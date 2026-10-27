import type { MissionResult, TakeoffRating } from '../data/types';

// Mission score (doc 39): 0–1000 for a won mission from kills, damage avoided, accuracy, the launch and pickups.
// Counts into the pilot rating (doc 26) through the best score per mission. Pure.

export interface ScoreParts {
  kills: number;
  damage: number;
  accuracy: number;
  launch: number;
  pickups: number;
  total: number;
}

export const SCORE = Object.freeze({ kills: 300, damage: 300, accuracy: 200, launch: 100, pickups: 100, fullAccuracy: 0.3, max: 1000 });

const LAUNCH: Readonly<Record<TakeoffRating, number>> = { perfect: 1, good: 0.6, early: 0.2, late: 0.2, skipped: 0 };

const share = (part: number, whole: number, none = 1): number => (whole > 0 ? Math.min(1, Math.max(0, part / whole)) : none);

/** The score of one sortie; 0 when it was not won. Missing measurements count as full marks (older results). */
export function missionScore(r: MissionResult): ScoreParts {
  if (!r.success) return { kills: 0, damage: 0, accuracy: 0, launch: 0, pickups: 0, total: 0 };
  const p = r.perf;
  const parts = {
    kills: Math.round(SCORE.kills * share(r.kills, r.spawned)),
    damage: Math.round(SCORE.damage * (1 - Math.min(1, Math.max(0, p?.damage ?? 0)))),
    accuracy: Math.round(SCORE.accuracy * Math.min(1, share(p?.hits ?? 1, p?.shots ?? 1) / SCORE.fullAccuracy)),
    launch: Math.round(SCORE.launch * LAUNCH[r.takeoff]),
    pickups: Math.round(SCORE.pickups * share(p?.taken ?? 0, p?.drops ?? 0)),
  };
  return { ...parts, total: parts.kills + parts.damage + parts.accuracy + parts.launch + parts.pickups };
}
