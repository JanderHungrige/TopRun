import { PLANE_IDS, type MissionResult, type PlaneId } from '../data/types';

// The pilot's service record (doc 24): what the medals count. Pure.

export interface ServiceRecord {
  sorties: number;
  wins: number;
  kills: number;
  bossKills: number;
  flawless: number;
  gunOnly: number;
  launchStreak: number;
  bestLaunchStreak: number;
  planesFlown: PlaneId[];
}

export const emptyRecord = (): ServiceRecord => ({
  sorties: 0, wins: 0, kills: 0, bossKills: 0, flawless: 0, gunOnly: 0, launchStreak: 0, bestLaunchStreak: 0, planesFlown: [],
});

/** One finished sortie. Aborted sorties don't count; a missing `usedSecondaries` never counts as gun-only. */
export function recordMission(r: ServiceRecord, result: MissionResult, plane: PlaneId): ServiceRecord {
  if (result.aborted) return r;
  const won = result.success;
  const streak = result.takeoff === 'perfect' ? r.launchStreak + 1 : 0;
  return {
    sorties: r.sorties + 1,
    wins: r.wins + (won ? 1 : 0),
    kills: r.kills + Math.max(0, Math.floor(result.kills)),
    bossKills: r.bossKills + (result.bossKilled ? 1 : 0),
    flawless: r.flawless + (won && result.hullRatio >= 0.999 ? 1 : 0),
    gunOnly: r.gunOnly + (won && result.usedSecondaries === false ? 1 : 0),
    launchStreak: streak,
    bestLaunchStreak: Math.max(r.bestLaunchStreak, streak),
    planesFlown: r.planesFlown.includes(plane) ? r.planesFlown : [...r.planesFlown, plane],
  };
}

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const count = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? Math.floor(Math.min(v, 1e9)) : 0);

/** Untrusted save JSON → record; malformed fields become 0 / []. */
export function parseRecord(v: unknown): ServiceRecord {
  if (!isRecord(v)) return emptyRecord();
  const planes = Array.isArray(v.planesFlown) ? v.planesFlown : [];
  return {
    sorties: count(v.sorties), wins: count(v.wins), kills: count(v.kills), bossKills: count(v.bossKills),
    flawless: count(v.flawless), gunOnly: count(v.gunOnly), launchStreak: count(v.launchStreak),
    bestLaunchStreak: count(v.bestLaunchStreak),
    planesFlown: PLANE_IDS.filter((p) => planes.includes(p)),
  };
}
