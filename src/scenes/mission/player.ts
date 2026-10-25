import { approach, clamp } from '../../core/math';
import type { SecondaryId } from '../../data/types';
import { gunLevelDef } from '../../data/weapons';
import type { PlayerStats } from '../../game/loadout';
import { PF_H, PF_W } from './world';

export const PLAYER_RADIUS = 13;
export const INVULN_AFTER_HIT = 0.6;

export interface SecondarySlot {
  id: SecondaryId;
  ammo: number;
  start: number;
}

/** Player jet state; behaviour that touches the world lives in weapons-fire.ts / mission-scene.ts. */
export class Player {
  x = PF_W / 2;
  y = PF_H - 110;
  hull: number;
  readonly maxHull: number;
  readonly speed: number;
  bank = 0;
  forward = 0;
  invuln = 1.2;
  gunCooldown = 0;
  secCooldown = 0;
  readonly secondaries: SecondarySlot[];
  /** Fired any missile, rocket or bomb this sortie (doc 24, Gunslinger). */
  firedSecondary = false;
  flares: number;
  specialCooldown = 0;
  specialActive = 0;
  powerTimer = 0;
  damageControlUsed = false;
  dashVX = 0;
  rollSpin = 0;
  wingman: { x: number; y: number; fireT: number } | null = null;
  alive = true;
  sideToggle = 1;
  exitY = 0;

  constructor(readonly stats: PlayerStats) {
    this.maxHull = stats.maxHull;
    this.hull = stats.maxHull;
    this.speed = stats.speed;
    this.flares = stats.flares;
    this.secondaries = stats.secondaries.map((s) => ({ id: s.id, ammo: s.ammo, start: s.ammo }));
  }

  get gunLevel(): number {
    return Math.min(5, this.stats.gunLevel + (this.powerTimer > 0 ? 1 : 0));
  }

  get gun(): ReturnType<typeof gunLevelDef> {
    return gunLevelDef(this.gunLevel);
  }

  get hullRatio(): number {
    return clamp(this.hull / this.maxHull, 0, 1);
  }

  get invulnerable(): boolean {
    return this.invuln > 0 || (this.specialActive > 0 && this.stats.plane.special !== 'wingman');
  }


  /** Moves by a normalised direction plus a raw drag delta (touch), clamped to the playfield. */
  move(dir: { x: number; y: number }, drag: { x: number; y: number }, dt: number): void {
    const dash = this.dashVX * dt;
    this.x = clamp(this.x + dir.x * this.speed * dt + drag.x + dash, 24, PF_W - 24);
    this.y = clamp(this.y + dir.y * this.speed * dt + drag.y, 70, PF_H - 40);
    const sideways = clamp(dir.x + drag.x / Math.max(1, this.speed * dt), -1, 1);
    this.bank = approach(this.bank, sideways, dt * 6);
    this.forward = approach(this.forward, clamp(-dir.y - drag.y / Math.max(1, this.speed * dt), 0, 1), dt * 3);
    this.dashVX = approach(this.dashVX, 0, dt * 1400);
  }

  tick(dt: number): void {
    this.invuln = Math.max(0, this.invuln - dt);
    this.gunCooldown = Math.max(0, this.gunCooldown - dt);
    this.secCooldown = Math.max(0, this.secCooldown - dt);
    this.specialCooldown = Math.max(0, this.specialCooldown - dt);
    this.specialActive = Math.max(0, this.specialActive - dt);
    this.powerTimer = Math.max(0, this.powerTimer - dt);
    this.rollSpin = Math.max(0, this.rollSpin - dt);
  }


  /** Applies damage; returns true when this hit destroyed the jet. */
  damage(amount: number): boolean {
    if (!this.alive || this.invulnerable) return false;
    this.hull -= amount;
    this.invuln = INVULN_AFTER_HIT;
    if (this.hull < this.maxHull * 0.25 && this.stats.damageControl && !this.damageControlUsed && this.hull > 0) {
      this.damageControlUsed = true;
      this.hull += this.maxHull * 0.4;
    }
    if (this.hull <= 0) {
      this.hull = 0;
      this.alive = false;
      return true;
    }
    return false;
  }

  repair(ratio: number): void {
    this.hull = Math.min(this.maxHull, this.hull + this.maxHull * ratio);
  }

  reloadAmmo(): void {
    for (const s of this.secondaries) s.ammo = Math.min(s.start * 2, s.ammo + Math.ceil(s.start * 0.5));
  }

}
