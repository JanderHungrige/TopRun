import { THEATERS } from './theaters';
import type { EnemyKind, MissionDef, TheaterId } from './types';

// New adversaries (doc 44): the enemy types each theater adds to its missions' pools, and the mid-mission
// mini-bosses. Pure data + lookups; the wave generator (game/waves.ts) reads them.

/** The six new regular types and the three mini-bosses. */
export const NEW_KINDS: readonly EnemyKind[] = Object.freeze(['shilka', 'bunker', 'foxbat', 'jammer', 'frigate', 'felon'] as const);
export const MINI_BOSSES: readonly EnemyKind[] = Object.freeze(['backfire', 'fortress', 'cruiser', 'warden'] as const);
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
  // Map 3 (doc 48): the kit starts from zero, so the new kinds come back one theater at a time, mostly on the ground.
  fjords: [r('shilka', 62)],
  highlands: [r('bunker', 67), r('shilka', 67)],
  delta: [r('shilka', 73), r('bunker', 74)],
  mesa: [r('bunker', 79), r('shilka', 79), r('foxbat', 80)],
  ashfall: [r('frigate', 85), r('shilka', 85), r('bunker', 85), r('felon', 87)],
  // Map 4 (docs 56, 58): its own enemies only; the interceptor spreads from m99, the gunship from m109.
  orbit: [],
  belt: [r('interceptor', 99)],
  moon: [r('interceptor', 103)],
  rings: [r('interceptor', 109), r('gunship', 109)],
  deep: [r('gunship', 115), r('interceptor', 115)],
  // Map 5 (doc 65): its own enemies only.
  reef: [],
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

/** First mission with mid-mission mini-bosses (the Arctic); on map 3 from the highlands on (doc 48); on map 4 from the
 *  Asteroid Belt on, always the battlecruiser (doc 58). */
export const MINI_BOSS_FROM = 13;
export const MAP3_MINI_BOSS_FROM = 67;
export const MAP4_MINI_BOSS_FROM = 97;

/** Mini-bosses of a mission: when (share of the mission length) and which kind. None in boss missions. */
export function miniBosses(m: MissionDef): Array<{ at: number; kind: EnemyKind }> {
  if (m.objective.type === 'boss' || m.number < MINI_BOSS_FROM || (m.campaign === 3 && m.number < MAP3_MINI_BOSS_FROM)) return [];
  if (m.campaign === 4) return m.number < MAP4_MINI_BOSS_FROM ? [] : [{ at: 0.55, kind: 'warden' }];
  const sea = THEATERS[m.theater].base === 'sea';
  const pick = (k: number): EnemyKind => ((m.number + k) % 2 === 0 ? 'backfire' : sea ? 'cruiser' : 'fortress');
  const times = m.campaign === 2 ? [0.4, 0.75] : [0.55];
  return times.map((at, k) => ({ at, kind: pick(k) }));
}
