import {
  CAVITATION, ELECTRIC, EXPLOSIVE, HOMING_LEVELS, LOADER_LEVELS, MAX_SUB_LEVEL, SIDE_TUBE_LEVELS, SUB_MODS, SUB_ROUNDS,
  type SubMod, type SubRounds,
} from '../data/sub-arms';
import type { ArmsStats } from './heli-arms';

// The subs' arsenal (doc 101): the harpoon gun's upgrades and its three ammo types — the save entry and the numbers the
// mission takes from them (the helicopters' shape, doc 99, plus the electric chain and the cavitation pierce). On sale,
// prices, buying and loading run through gear.ts. Pure.

/** Levels of every gun upgrade and ammo type (0 = none), and the ammo type loaded for the next sortie. */
export type SubArms = Record<SubMod | SubRounds, number> & { loaded: SubRounds };

export const freshSubArms = (): SubArms => ({ loader: 0, homing: 0, sideTubes: 0, explosive: 0, electric: 0, cavitation: 0, loaded: 'explosive' });

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const level = (v: unknown, hi: number): number => (typeof v === 'number' && Number.isFinite(v) ? Math.floor(Math.min(hi, Math.max(0, v))) : 0);

/** The entry from untrusted storage: each level clamped, a broken or missing part fresh. */
export function parseSubArms(v: unknown): SubArms {
  if (!isRecord(v)) return freshSubArms();
  const arms = freshSubArms();
  for (const id of [...SUB_MODS, ...SUB_ROUNDS]) arms[id] = level(v[id], MAX_SUB_LEVEL[id]);
  arms.loaded = SUB_ROUNDS.find((r) => r === v.loaded) ?? 'explosive';
  return arms;
}

export function subArmsStats(arms: SubArms): ArmsStats {
  const loader = LOADER_LEVELS[arms.loader - 1];
  const tubes = SIDE_TUBE_LEVELS[arms.sideTubes - 1];
  const lvl = arms[arms.loaded];
  const rounds = lvl > 0 ? arms.loaded : null;
  const k = lvl - 1;
  return {
    gatling: loader ? { mul: loader.mul, spinUp: loader.spinUp } : null,
    swivel: HOMING_LEVELS[arms.homing - 1]?.swivel ?? 0,
    doorGuns: tubes ? { range: tubes.range, damage: tubes.damage } : null,
    rounds,
    paint: 0,
    splash: rounds === 'explosive' ? { share: EXPLOSIVE.share[k] ?? 0, radius: EXPLOSIVE.radius[k] ?? 0 } : null,
    burn: 0,
    chain: rounds === 'electric'
      ? { targets: ELECTRIC.targets[k] ?? 0, reach: ELECTRIC.reach, share: ELECTRIC.share[k] ?? 0, stun: ELECTRIC.stun[k] ?? 0 } : null,
    pierce: rounds === 'cavitation' ? { count: CAVITATION.pierce[k] ?? 0, speed: CAVITATION.speed } : null,
  };
}

/** The gear's levels summed (kit score, doc 38). */
export const subArmsLevels = (arms: SubArms): number => [...SUB_MODS, ...SUB_ROUNDS].reduce((sum, id) => sum + arms[id], 0);
