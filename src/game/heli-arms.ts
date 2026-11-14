import {
  DOOR_GUN_LEVELS, GATLING_LEVELS, HEDP, HELI_INCENDIARY, HELI_MODS, HELI_ROUNDS, MAX_HELI_LEVEL, TRACER, TURRET_LEVELS,
  type HeliMod, type HeliRounds, type RoundsLook,
} from '../data/heli-arms';

// The helicopters' arsenal (doc 99): the chain gun's upgrades and its three ammo types — the save entry and the numbers
// the mission takes from them. On sale, prices, buying and loading run through gear.ts for both fleets (doc 101). Pure.

/** Levels of every gun upgrade and ammo type (0 = none), and the ammo type loaded for the next sortie. */
export type HeliArms = Record<HeliMod | HeliRounds, number> & { loaded: HeliRounds };

export const freshHeliArms = (): HeliArms => ({ gatling: 0, turret: 0, doorGuns: 0, tracer: 0, hedp: 0, incendiary: 0, loaded: 'tracer' });

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const level = (v: unknown, hi: number): number => (typeof v === 'number' && Number.isFinite(v) ? Math.floor(Math.min(hi, Math.max(0, v))) : 0);

/** The entry from untrusted storage: each level clamped, a broken or missing part fresh. */
export function parseHeliArms(v: unknown): HeliArms {
  if (!isRecord(v)) return freshHeliArms();
  const arms = freshHeliArms();
  for (const id of [...HELI_MODS, ...HELI_ROUNDS]) arms[id] = level(v[id], MAX_HELI_LEVEL[id]);
  arms.loaded = HELI_ROUNDS.find((r) => r === v.loaded) ?? 'tracer';
  return arms;
}

/** What the mission takes from a fleet's arsenal (docs 99, 101). */
export interface ArmsStats {
  /** The Gatling Drive: rate × at full spin and the spin-up seconds; null = the plain chain gun. */
  gatling: { mul: number; spinUp: number } | null;
  /** The turret link's swivel (radians), 0 = none. */
  swivel: number;
  doorGuns: { range: number; damage: number } | null;
  /** The ammo type the guns fire, null = ordinary rounds. */
  rounds: RoundsLook | null;
  /** Tracer: extra damage a painted target takes, 0 = no painting. */
  paint: number;
  /** HEDP: the share of a hit that bursts onto others within the radius. */
  splash: { share: number; radius: number } | null;
  /** Incendiary: the share of a hit that burns on. */
  burn: number;
  /** Electric harpoons (doc 101): neighbours a hit arcs to, within how far, the share and the stun. */
  chain: { targets: number; reach: number; share: number; stun: number } | null;
  /** Cavitation tips (doc 101): further enemies a bolt passes through, and its speed ×. */
  pierce: { count: number; speed: number } | null;
}

export function heliArmsStats(arms: HeliArms): ArmsStats {
  const gat = GATLING_LEVELS[arms.gatling - 1];
  const door = DOOR_GUN_LEVELS[arms.doorGuns - 1];
  const lvl = arms[arms.loaded];
  const rounds = lvl > 0 ? arms.loaded : null;
  const k = lvl - 1;
  return {
    gatling: gat ? { mul: gat.mul, spinUp: gat.spinUp } : null,
    swivel: TURRET_LEVELS[arms.turret - 1]?.swivel ?? 0,
    doorGuns: door ? { range: door.range, damage: door.damage } : null,
    rounds,
    paint: rounds === 'tracer' ? TRACER.bonus[k] ?? 0 : 0,
    splash: rounds === 'hedp' ? { share: HEDP.share[k] ?? 0, radius: HEDP.radius[k] ?? 0 } : null,
    burn: rounds === 'incendiary' ? HELI_INCENDIARY.burn[k] ?? 0 : 0,
    chain: null,
    pierce: null,
  };
}

/** The gear's levels summed (kit score, doc 38). */
export const heliArmsLevels = (arms: HeliArms): number => [...HELI_MODS, ...HELI_ROUNDS].reduce((sum, id) => sum + arms[id], 0);
