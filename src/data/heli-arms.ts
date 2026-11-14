// The helicopters' arsenal (doc 99): the chain gun's own upgrade ladders (Gatling Drive, Turret Link, M134 door guns),
// its three ammo types (tracer, HEDP, incendiary; one loaded per sortie) and the numbers of the pulse laser, the sonic
// cannon and the drone swarm that the weapon table (data/weapons.ts) doesn't carry. Prices are already helicopter prices.

import type { AmmoType } from './arsenal';

const deg = (d: number): number => (d * Math.PI) / 180;

export type HeliMod = 'gatling' | 'turret' | 'doorGuns';
export const HELI_MODS: readonly HeliMod[] = Object.freeze(['gatling', 'turret', 'doorGuns'] as const);

export type HeliRounds = 'tracer' | 'hedp' | 'incendiary';
export const HELI_ROUNDS: readonly HeliRounds[] = Object.freeze(['tracer', 'hedp', 'incendiary'] as const);

/** The look of a gun round: the jets' ammo (docs 43, 45), the helicopters' or the subs' (docs 99, 101). */
export type RoundsLook = AmmoType | HeliRounds | 'explosive' | 'electric' | 'cavitation';

export interface GatlingLevel { level: number; price: number; mul: number; spinUp: number }
/** Rate × at full spin, seconds to spin up from rest. */
export const GATLING_LEVELS: readonly GatlingLevel[] = Object.freeze([
  { level: 1, price: 180000, mul: 1.15, spinUp: 0.8 },
  { level: 2, price: 360000, mul: 1.3, spinUp: 0.7 },
  { level: 3, price: 600000, mul: 1.45, spinUp: 0.6 },
  { level: 4, price: 900000, mul: 1.6, spinUp: 0.5 },
]);
/** Seconds the barrels take to coast down from full spin. */
export const GATLING_SPIN_DOWN = 1.5;

export interface TurretLevel { level: number; price: number; swivel: number }
export const TURRET_LEVELS: readonly TurretLevel[] = Object.freeze([
  { level: 1, price: 120000, swivel: deg(8) },
  { level: 2, price: 250000, swivel: deg(14) },
  { level: 3, price: 420000, swivel: deg(20) },
]);
/** How far the turret looks for a target, and how far beyond its swivel a target may lie. */
export const TURRET = Object.freeze({ range: 480, slack: deg(12) });

export interface DoorGunLevel { level: number; price: number; range: number; damage: number }
export const DOOR_GUN_LEVELS: readonly DoorGunLevel[] = Object.freeze([
  { level: 1, price: 100000, range: 220, damage: 10 },
  { level: 2, price: 220000, range: 270, damage: 15 },
  { level: 3, price: 380000, range: 320, damage: 20 },
]);
/** Rounds a second per gun, the arc each gun covers (bearings off the nose) and the rounds' speed. */
export const DOOR_GUN = Object.freeze({ rate: 10, from: deg(20), to: deg(160), speed: 820 });

/** Each ammo type's levels 1–3 cost the same. */
export const ROUNDS_PRICES: readonly number[] = Object.freeze([90000, 200000, 360000]);
export const MAX_ROUNDS_LEVEL = 3;

/** Tracer: seconds a hit paints its target, and the extra damage a painted target takes, by level. */
export const TRACER = Object.freeze({ seconds: 3, bonus: Object.freeze([0.12, 0.2, 0.28]) });
/** HEDP: the share of a hit that bursts onto every other enemy within the radius, by level. */
export const HEDP = Object.freeze({ share: Object.freeze([0.2, 0.3, 0.4]), radius: Object.freeze([22, 26, 30]) });
/** Incendiary: the share of each hit that burns on over 1.5 s, by level (air and ground). */
export const HELI_INCENDIARY = Object.freeze({ burn: Object.freeze([0.25, 0.4, 0.55]) });

/** The pulse laser: pulses per burst, seconds between them, its cone and its reach. */
export const PULSE = Object.freeze({ pulses: 4, gap: 0.08, cone: deg(30), range: 460 });
/** The sonic wave: its arc, the seconds it takes to run out, the stun and how slow a stunned plane flies. */
export const SONIC = Object.freeze({ cone: deg(40), time: 0.45, stun: 1.5, slow: 1 / 3 });
/** The drone swarm: drones per launch, their headings at launch, their life. */
export const SWARM = Object.freeze({ drones: 3, headings: Object.freeze([-1.2, 0, 1.2]), ttl: 6 });

export const MAX_HELI_LEVEL: Readonly<Record<HeliMod | HeliRounds, number>> = Object.freeze({
  gatling: GATLING_LEVELS.length, turret: TURRET_LEVELS.length, doorGuns: DOOR_GUN_LEVELS.length,
  tracer: MAX_ROUNDS_LEVEL, hedp: MAX_ROUNDS_LEVEL, incendiary: MAX_ROUNDS_LEVEL,
});

/** Price of level `level` (1-based) of a mod, or undefined past the top. */
export function modLevelPrice(id: HeliMod, level: number): number | undefined {
  switch (id) {
    case 'gatling': return GATLING_LEVELS[level - 1]?.price;
    case 'turret': return TURRET_LEVELS[level - 1]?.price;
    case 'doorGuns': return DOOR_GUN_LEVELS[level - 1]?.price;
    default: throw new Error(`unhandled: ${id satisfies never}`);
  }
}
