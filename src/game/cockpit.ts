import type { Layer, SecondaryId } from '../data/types';
import { SECONDARIES, type WeaponRole } from '../data/weapons';

// Cockpit logic (doc 05): what the radar shows, which buttons are lit, which warning lamps burn. Pure.

import { atLevel, RADAR_AHEAD, RADAR_BURN_THROUGH, RADAR_RANGE as RANGES } from '../data/equipment';

export const RADAR_RANGE = atLevel(RANGES, 0);
export const EARLY_RANGE = atLevel(RANGES, 1);
export const EARLY_SPEED = 140;
export const MISSILE_ALERT_RANGE = 260;

export type ContactKind = 'air' | 'ground' | 'boss' | 'missile' | 'upcoming';

/** Scope coordinates: (0, 0) is the player, the unit circle is the radar range, −y is ahead. */
export interface Contact {
  x: number;
  y: number;
  kind: ContactKind;
}

export interface RadarInput {
  player: { x: number; y: number };
  /** `hidden`: a cloaked stealth fighter, shown only by Early-Warning Radar level 2 (doc 44). */
  enemies: ReadonlyArray<{ x: number; y: number; layer: Layer; dead: boolean; hidden?: boolean }>;
  boss: { x: number; y: number } | null;
  missiles: ReadonlyArray<{ x: number; y: number; enemy: boolean }>;
  /** Timeline spawns not yet in the world: seconds until they appear and where. */
  upcoming: ReadonlyArray<{ dt: number; x: number }>;
  /** A jammer is on screen: the scope shows nothing but static (doc 44). */
  jammed?: boolean;
}

/** Scope range for an Early-Warning Radar level 0–4 (docs 05, 43). */
export const radarRange = (level: number): number => atLevel(RANGES, level);

/** A jammer blanks the scope, unless the Early-Warning Radar burns through it (level 4, doc 43). */
export const scopeJammed = (jammed: boolean, level: number): boolean => jammed && level < RADAR_BURN_THROUGH;

/** Contacts on the scope; with the Early-Warning Radar (level ≥ 1) spawns due in the next 4 / 7 / 10 / 13 s show ahead. */
export function radarContacts(input: RadarInput, level: number): Contact[] {
  const range = radarRange(level);
  const window = atLevel(RADAR_AHEAD, level);
  if (scopeJammed(!!input.jammed, level)) return [];
  const out: Contact[] = [];
  const add = (x: number, y: number, kind: ContactKind): void => {
    const nx = (x - input.player.x) / range;
    const ny = (y - input.player.y) / range;
    if (nx * nx + ny * ny <= 1) out.push({ x: nx, y: ny, kind });
  };
  for (const e of input.enemies) if (!e.dead && (!e.hidden || level >= 2)) add(e.x, e.y, e.layer);
  if (input.boss) add(input.boss.x, input.boss.y, 'boss');
  for (const m of input.missiles) if (m.enemy) add(m.x, m.y, 'missile');
  for (const u of input.upcoming) {
    if (window > 0 && u.dt >= 0 && u.dt <= window) add(u.x, -60 - u.dt * EARLY_SPEED, 'upcoming');
  }
  return out;
}

export type WeaponButton = 'none' | 'empty' | 'cooldown' | 'ready';
export type FlareButton = 'none' | 'empty' | 'ready';

export interface ButtonStates {
  air: WeaponButton;
  ground: WeaponButton;
  flare: FlareButton;
  special: { state: 'ready' | 'cooldown' | 'active'; progress: number };
}

export interface ButtonInput {
  secondaries: ReadonlyArray<{ id: SecondaryId; ammo: number }>;
  secCooldown: number;
  flares: number;
  /** Flares per mission from the dispenser (0 = none fitted). */
  flareCapacity: number;
  specialCooldown: number;
  specialMax: number;
  specialActive: number;
}

function weaponButton(b: ButtonInput, role: WeaponRole): WeaponButton {
  const mine = b.secondaries.filter((s) => SECONDARIES[s.id].role === role);
  if (mine.length === 0) return 'none';
  if (!mine.some((s) => s.ammo > 0)) return 'empty';
  return b.secCooldown > 0 ? 'cooldown' : 'ready';
}

export function buttonStates(b: ButtonInput): ButtonStates {
  const special: ButtonStates['special'] = b.specialActive > 0
    ? { state: 'active', progress: 1 }
    : b.specialCooldown > 0
      ? { state: 'cooldown', progress: Math.max(0, Math.min(1, 1 - b.specialCooldown / Math.max(0.001, b.specialMax))) }
      : { state: 'ready', progress: 1 };
  return {
    air: weaponButton(b, 'air'),
    ground: weaponButton(b, 'ground'),
    flare: b.flareCapacity <= 0 ? 'none' : b.flares <= 0 ? 'empty' : 'ready',
    special,
  };
}

export interface WarningInput {
  player: { x: number; y: number; alive: boolean };
  hullRatio: number;
  missiles: ReadonlyArray<{ x: number; y: number; enemy: boolean; decoyed: boolean }>;
  bossActive: boolean;
  powerTimer: number;
  ecm: boolean;
  damageControl: boolean;
  damageControlUsed: boolean;
}

export interface WarningLights {
  missile: boolean;
  lowHull: boolean;
  boss: boolean;
  power: boolean;
  ecm: boolean;
  damageControl: 'none' | 'armed' | 'used';
}

export function warningLights(w: WarningInput): WarningLights {
  const r2 = MISSILE_ALERT_RANGE * MISSILE_ALERT_RANGE;
  const missile = w.player.alive && w.missiles.some((m) => {
    const dx = m.x - w.player.x;
    const dy = m.y - w.player.y;
    return m.enemy && !m.decoyed && dx * dx + dy * dy <= r2;
  });
  return {
    missile,
    lowHull: w.player.alive && w.hullRatio < 0.3,
    boss: w.bossActive,
    power: w.powerTimer > 0,
    ecm: w.ecm,
    damageControl: !w.damageControl ? 'none' : w.damageControlUsed ? 'used' : 'armed',
  };
}
