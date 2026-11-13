import {
  DOOR_GUN_LEVELS, GATLING_LEVELS, HEDP, HELI_INCENDIARY, HELI_MODS, HELI_ROUNDS, MAX_HELI_LEVEL, modLevelPrice, ROUNDS_PRICES,
  TRACER, TURRET_LEVELS, type HeliMod, type HeliRounds,
} from '../data/heli-arms';
import { mapOpen } from './progress';
import type { SaveData } from './save';

// The helicopters' arsenal (doc 99): the chain gun's upgrades and its three ammo types — the save entry, what is on
// sale, prices, loading one ammo type, and the numbers the mission takes from them. Buying runs through economy.ts. Pure.

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

/** Sold in the helicopters' hangar once map 3 is open. */
export const heliArmsOnSale = (save: SaveData): boolean => save.kit === 'heli' && mapOpen(save, 3);

/** Price of a gun upgrade's next level, or null at the top. */
export const heliModPrice = (save: SaveData, id: HeliMod): number | null => modLevelPrice(id, save.heliArms[id] + 1) ?? null;

/** Price of an ammo type's next level, or null at the top. */
export const heliRoundsPrice = (save: SaveData, id: HeliRounds): number | null => ROUNDS_PRICES[save.heliArms[id]] ?? null;

/** Returns a new save with the item's next level. Prices and checks are economy.ts's. */
export function withHeliLevel(save: SaveData, id: HeliMod | HeliRounds): SaveData {
  const arms = { ...save.heliArms, [id]: Math.min(MAX_HELI_LEVEL[id], save.heliArms[id] + 1) };
  return { ...save, heliArms: arms };
}

/** After buying a level of an ammo type: it is loaded when the loaded type has no level yet (doc 45's rule). */
export function afterHeliRoundsBought(save: SaveData, type: HeliRounds): SaveData {
  return save.heliArms[save.heliArms.loaded] > 0 ? save : { ...save, heliArms: { ...save.heliArms, loaded: type } };
}

/** LOAD is offered for an owned type that is not loaded. */
export const canLoadHeliRounds = (save: SaveData, type: HeliRounds): boolean => save.heliArms[type] > 0 && save.heliArms.loaded !== type;

/** Returns a new save with `type` loaded. Throws if canLoadHeliRounds fails — call it first. */
export function loadHeliRounds(save: SaveData, type: HeliRounds): SaveData {
  if (!canLoadHeliRounds(save, type)) throw new Error(`cannot load ${type}`);
  return { ...structuredClone(save), heliArms: { ...save.heliArms, loaded: type } };
}

/** What the mission takes from the arsenal. */
export interface HeliArmsStats {
  /** The Gatling Drive: rate × at full spin and the spin-up seconds; null = the plain chain gun. */
  gatling: { mul: number; spinUp: number } | null;
  /** The turret link's swivel (radians), 0 = none. */
  swivel: number;
  doorGuns: { range: number; damage: number } | null;
  /** The ammo type the guns fire, null = ordinary rounds. */
  rounds: HeliRounds | null;
  /** Tracer: extra damage a painted target takes, 0 = no painting. */
  paint: number;
  /** HEDP: the share of a hit that bursts onto others within the radius. */
  splash: { share: number; radius: number } | null;
  /** Incendiary: the share of a hit that burns on. */
  burn: number;
}

export function heliArmsStats(arms: HeliArms): HeliArmsStats {
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
  };
}

/** The gear's levels summed (kit score, doc 38). */
export const heliArmsLevels = (arms: HeliArms): number => [...HELI_MODS, ...HELI_ROUNDS].reduce((sum, id) => sum + arms[id], 0);
