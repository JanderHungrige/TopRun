import { approach, clamp } from '../../core/math';
import type { SecondaryId } from '../../data/types';
import type { WeaponStats } from '../../game/arsenal';
import { MAX_GUN2_LEVEL, type GunLevelDef } from '../../data/weapons';
import { gunDef, powerCap } from '../../game/firepower';
import { heliVelocity } from '../../game/heli-flight';
import { shipGun, touchesShip } from '../../game/ship-loadout';
import { CELL_PX, SHIELD } from '../../data/ship-modules';
import { circleHit } from '../../game/combat';
import { specialRules } from '../../game/jets';
import type { PlayerStats } from '../../game/loadout';
import { PF_H, PF_W } from './world';

export const PLAYER_RADIUS = 13;
export const INVULN_AFTER_HIT = 0.6;

export interface SecondarySlot {
  id: SecondaryId;
  ammo: number;
  start: number;
  /** Twin pods: both fire per trigger (doc 37). */
  twin: boolean;
  /** The numbers of the weapon's mark (doc 43). */
  weapon: WeaponStats;
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
  /** Second gun of the new jets (doc 37): its own rate; `gun2Side` alternates the wing roots. */
  gun2Cooldown = 0;
  /** Bofors 40 mm HE gun reload (doc 46). */
  heCooldown = 0;
  gun2Side = 1;
  secCooldown = 0;
  readonly secondaries: SecondarySlot[];
  /** Fired any missile, rocket or bomb this sortie (doc 24, Gunslinger). */
  firedSecondary = false;
  /** Ground weapon picked with SWITCH: index into `secondaries`, −1 = none yet (doc 05). */
  groundPick = -1;
  /** Seconds left of the "<WEAPON> READY" callout after a switch. */
  switchFlash = 0;
  flares: number;
  specialCooldown = 0;
  specialActive = 0;
  powerTimer = 0;
  damageControlUsed = false;
  /** Damage-control repairs left this mission (doc 43: two at the top level). */
  damageControlLeft: number;
  dashVX = 0;
  /** The helicopter's velocity, eased toward the stick (doc 50); a jet's follows the stick at once. */
  drift = { x: 0, y: 0 };
  /** The spacecraft's shield points and the time since the last hit (doc 54). */
  shield = 0;
  readonly shieldMax: number;
  private quiet = 0;
  /** A-10 GAU-8 burst: seconds to the next round (doc 36). */
  cannonT = 0;
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
    this.shieldMax = stats.ship?.shield ?? 0;
    this.shield = this.shieldMax;
    this.damageControlLeft = stats.damageControlUses;
    this.secondaries = stats.secondaries.map((s) => ({ id: s.id, ammo: s.ammo, start: s.ammo, twin: s.twin, weapon: s.weapon }));
  }

  get gunLevel(): number {
    return Math.min(powerCap(this.stats.plane.id), this.stats.gunLevel + (this.powerTimer > 0 ? 1 : 0));
  }

  /** Second gun level, power-up included; 0 = no second gun. */
  get gun2Level(): number {
    return this.stats.gun2Level > 0 ? Math.min(MAX_GUN2_LEVEL, this.stats.gun2Level + (this.powerTimer > 0 ? 1 : 0)) : 0;
  }

  get gun(): GunLevelDef {
    const ship = this.stats.ship;
    return ship ? shipGun(ship, this.gunLevel) : gunDef(this.stats.plane.id, this.gunLevel);
  }

  /** A circle at (x, y) touches the player: its radius, or for the spacecraft any of its cells (doc 54). */
  touches(x: number, y: number, r: number, inset = 0): boolean {
    const ship = this.stats.ship;
    return ship ? touchesShip(ship, this.x, this.y, x, y, r, CELL_PX) : circleHit(x, y, r, this.x, this.y, PLAYER_RADIUS + inset);
  }

  get hullRatio(): number {
    return clamp(this.hull / this.maxHull, 0, 1);
  }

  get invulnerable(): boolean {
    return this.invuln > 0 || (this.specialActive > 0 && specialRules(this.stats.plane.special).invulnerable);
  }

  /** F-35 stealth running: enemies hold fire and stop homing (doc 36). */
  get stealthed(): boolean {
    return this.alive && this.specialActive > 0 && specialRules(this.stats.plane.special).stealth;
  }


  /** Moves by a normalised direction plus a raw drag delta (touch), clamped to the playfield. A helicopter eases
   *  toward the stick instead of moving at once (doc 50); a drag moves it directly. */
  move(dir: { x: number; y: number }, drag: { x: number; y: number }, dt: number): void {
    const dash = this.dashVX * dt;
    const v = this.stats.plane.kind === 'heli' ? heliVelocity(this.drift, dir, this.speed, dt) : { x: dir.x * this.speed, y: dir.y * this.speed };
    this.drift = v;
    this.x = clamp(this.x + v.x * dt + drag.x + dash, 24, PF_W - 24);
    this.y = clamp(this.y + v.y * dt + drag.y, 70, PF_H - 40);
    const sideways = clamp(dir.x + drag.x / Math.max(1, this.speed * dt), -1, 1);
    this.bank = approach(this.bank, sideways, dt * 6);
    this.forward = approach(this.forward, clamp(-dir.y - drag.y / Math.max(1, this.speed * dt), 0, 1), dt * 3);
    this.dashVX = approach(this.dashVX, 0, dt * 1400);
  }

  tick(dt: number): void {
    this.invuln = Math.max(0, this.invuln - dt);
    this.gunCooldown = Math.max(0, this.gunCooldown - dt);
    this.gun2Cooldown = Math.max(0, this.gun2Cooldown - dt);
    this.heCooldown = Math.max(0, this.heCooldown - dt);
    this.secCooldown = Math.max(0, this.secCooldown - dt);
    this.specialCooldown = Math.max(0, this.specialCooldown - dt);
    this.specialActive = Math.max(0, this.specialActive - dt);
    this.powerTimer = Math.max(0, this.powerTimer - dt);
    this.rollSpin = Math.max(0, this.rollSpin - dt);
    this.switchFlash = Math.max(0, this.switchFlash - dt);
    this.quiet += dt;
    if (this.quiet >= SHIELD.delay) this.shield = Math.min(this.shieldMax, this.shield + (this.stats.ship?.shieldRegen ?? SHIELD.regen) * dt);
  }


  /** Applies damage; returns true when this hit destroyed the jet. */
  damage(amount: number): boolean {
    if (!this.alive || this.invulnerable) return false;
    this.quiet = 0;
    const soaked = Math.min(this.shield, amount); // the spacecraft's shield takes hits first (doc 54)
    this.shield -= soaked;
    this.hull -= amount - soaked;
    this.invuln = INVULN_AFTER_HIT;
    if (this.hull < this.maxHull * 0.25 && this.damageControlLeft > 0 && this.hull > 0) {
      this.damageControlLeft -= 1;
      this.damageControlUsed = this.damageControlLeft === 0;
      this.hull += this.maxHull * this.stats.damageControlRestore;
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
