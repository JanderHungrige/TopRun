import { THEATERS } from './theaters';
import type { EnemyKind, MissionDef, TheaterId } from './types';

// New adversaries (doc 44): the enemy types each theater adds to its missions' pools, and the mid-mission
// mini-bosses. Pure data + lookups; the wave generator (game/waves.ts) reads them.

/** The six new regular types and the three mini-bosses. */
export const NEW_KINDS: readonly EnemyKind[] = Object.freeze(['shilka', 'bunker', 'foxbat', 'jammer', 'frigate', 'felon'] as const);
export const MINI_BOSSES: readonly EnemyKind[] = Object.freeze(['backfire', 'fortress', 'cruiser'] as const);
export const isMiniBoss = (kind: EnemyKind): boolean => MINI_BOSSES.includes(kind);

interface Reinforcement {
  kind: EnemyKind;
  /** First mission number that gets it. */
  from: number;
}

const r = (kind: EnemyKind, from: number): Reinforcement => ({ kind, from });

/** Per theater: kinds added to every mission's pool from mission `from` on. The Pacific stays as it is. */
const ADDS: Readonly<Record<TheaterId, readonly Reinforcement[]>> = {
  pacific: [],
  gulf: [r('shilka', 8), r('bunker', 9), r('foxbat', 10)],
  arctic: [r('foxbat', 13), r('jammer', 13), r('frigate', 14)],
  canyon: [r('shilka', 19), r('bunker', 19), r('felon', 19), r('jammer', 20), r('foxbat', 21)],
  leviathan: [r('felon', 25), r('frigate', 25), r('foxbat', 25), r('jammer', 26)],
  northsea: [r('felon', 31), r('frigate', 31), r('foxbat', 31), r('jammer', 31), r('shilka', 31)],
  himalaya: [r('felon', 37), r('bunker', 37), r('shilka', 37), r('foxbat', 37), r('jammer', 37)],
  jungle: [r('bunker', 43), r('shilka', 43), r('felon', 43), r('jammer', 43)],
  nightfall: [r('felon', 49), r('bunker', 49), r('shilka', 49), r('foxbat', 49), r('jammer', 49)],
  thunderhead: [r('felon', 55), r('frigate', 55), r('foxbat', 55), r('jammer', 55), r('bunker', 55)],
};

/** Sea units need a sea theater (land units stand on islands in sea theaters). */
const SEA_ONLY: readonly EnemyKind[] = ['frigate', 'cruiser'];

/** The mission's reinforcements: new kinds for its pool, never ones it already has, never sea units on land. */
export function reinforcements(m: MissionDef): EnemyKind[] {
  const land = THEATERS[m.theater].base === 'land';
  return (ADDS[m.theater] ?? [])
    .filter((x) => m.number >= x.from && !m.pool.includes(x.kind) && !(land && SEA_ONLY.includes(x.kind)))
    .map((x) => x.kind);
}

/** First mission with mid-mission mini-bosses (the Arctic). */
export const MINI_BOSS_FROM = 13;

/** Mini-bosses of a mission: when (share of the mission length) and which kind. None in boss missions. */
export function miniBosses(m: MissionDef): Array<{ at: number; kind: EnemyKind }> {
  if (m.objective.type === 'boss' || m.number < MINI_BOSS_FROM) return [];
  const sea = THEATERS[m.theater].base === 'sea';
  const pick = (k: number): EnemyKind => ((m.number + k) % 2 === 0 ? 'backfire' : sea ? 'cruiser' : 'fortress');
  const times = m.campaign === 1 ? [0.55] : [0.4, 0.75];
  return times.map((at, k) => ({ at, kind: pick(k) }));
}
