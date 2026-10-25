import type { Layer } from '../data/types';

// Cockpit logic (doc 05): what the radar shows, which buttons are lit, which warning lamps burn. Pure.

export const RADAR_RANGE = 720;
export const EARLY_RANGE = 1100;
export const EARLY_WINDOW = 4;
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
  enemies: ReadonlyArray<{ x: number; y: number; layer: Layer; dead: boolean }>;
  boss: { x: number; y: number } | null;
  missiles: ReadonlyArray<{ x: number; y: number; enemy: boolean }>;
  /** Timeline spawns not yet in the world: seconds until they appear and where. */
  upcoming: ReadonlyArray<{ dt: number; x: number }>;
}

export const radarRange = (early: boolean): number => (early ? EARLY_RANGE : RADAR_RANGE);

export function radarContacts(input: RadarInput, early: boolean): Contact[] {
  const range = radarRange(early);
  const out: Contact[] = [];
  const add = (x: number, y: number, kind: ContactKind): void => {
    const nx = (x - input.player.x) / range;
    const ny = (y - input.player.y) / range;
    if (nx * nx + ny * ny <= 1) out.push({ x: nx, y: ny, kind });
  };
  for (const e of input.enemies) if (!e.dead) add(e.x, e.y, e.layer);
  if (input.boss) add(input.boss.x, input.boss.y, 'boss');
  for (const m of input.missiles) if (m.enemy) add(m.x, m.y, 'missile');
  if (early) {
    for (const u of input.upcoming) {
      if (u.dt >= 0 && u.dt <= EARLY_WINDOW) add(u.x, -60 - u.dt * EARLY_SPEED, 'upcoming');
    }
  }
  return out;
}

export type MissileButton = 'none' | 'empty' | 'cooldown' | 'ready';
export type FlareButton = 'none' | 'empty' | 'ready';

export interface ButtonStates {
  missile: MissileButton;
  switch: 'ready' | 'none';
  flare: FlareButton;
  special: { state: 'ready' | 'cooldown' | 'active'; progress: number };
}

export interface ButtonInput {
  secondaries: ReadonlyArray<{ ammo: number }>;
  secIndex: number;
  secCooldown: number;
  flares: number;
  /** Flares per mission from the dispenser (0 = none fitted). */
  flareCapacity: number;
  specialCooldown: number;
  specialMax: number;
  specialActive: number;
}

function missileButton(b: ButtonInput): MissileButton {
  if (b.secondaries.length === 0) return 'none';
  if ((b.secondaries[b.secIndex]?.ammo ?? 0) <= 0) return 'empty';
  return b.secCooldown > 0 ? 'cooldown' : 'ready';
}

export function buttonStates(b: ButtonInput): ButtonStates {
  const loaded = b.secondaries.filter((s) => s.ammo > 0).length;
  const special: ButtonStates['special'] = b.specialActive > 0
    ? { state: 'active', progress: 1 }
    : b.specialCooldown > 0
      ? { state: 'cooldown', progress: Math.max(0, Math.min(1, 1 - b.specialCooldown / Math.max(0.001, b.specialMax))) }
      : { state: 'ready', progress: 1 };
  return {
    missile: missileButton(b),
    switch: loaded >= 2 ? 'ready' : 'none',
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
