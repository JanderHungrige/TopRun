import { MINIGAME_IDS, MINIGAMES, type MinigameId } from '../../data/minigames';
import { MISSIONS } from '../../data/missions';
import type { SaveData } from '../save';

// Minigame rules (doc 10): unlocks, offers after missions, medals, personal bests. Pure.

type Progress = SaveData['progress'];

export type Medal = 'gold' | 'silver' | 'bronze';
export interface Medals {
  bronze: number;
  silver: number;
  gold: number;
}
export interface MinigameRecord {
  best: number;
  plays: number;
}
export type MinigameRecords = Partial<Record<MinigameId, MinigameRecord>>;

function cleared(progress: Progress, missionNumber: number): boolean {
  const m = MISSIONS[missionNumber - 1];
  return m !== undefined && progress[m.id] !== undefined;
}

export function unlockedMinigames(progress: Progress, playable: readonly MinigameId[]): MinigameId[] {
  return MINIGAME_IDS.filter((id) => playable.includes(id) && cleared(progress, MINIGAMES[id].unlockAfter));
}

export function newlyUnlockedMinigames(before: Progress, after: Progress, playable: readonly MinigameId[]): MinigameId[] {
  const had = unlockedMinigames(before, playable);
  return unlockedMinigames(after, playable).filter((id) => !had.includes(id));
}

export interface OfferInput {
  missionNumber: number;
  before: Progress;
  after: Progress;
  playable: readonly MinigameId[];
  /** Settings.minigameOffers. */
  enabled: boolean;
}

/** What to offer after a successful debrief: a new unlock first, else every 3rd mission a seeded pick. */
export function offerAfterMission(o: OfferInput): { id: MinigameId; isNew: boolean } | null {
  if (!o.enabled) return null;
  const fresh = newlyUnlockedMinigames(o.before, o.after, o.playable)[0];
  if (fresh) return { id: fresh, isNew: true };
  if (o.missionNumber % 3 !== 0) return null;
  const pool = unlockedMinigames(o.after, o.playable);
  const id = pool[(o.missionNumber * 7) % Math.max(1, pool.length)];
  return id ? { id, isNew: false } : null;
}

export function medalFor(score: number, m: Medals, higherIsBetter: boolean): Medal | null {
  const beats = (limit: number): boolean => (higherIsBetter ? score >= limit : score <= limit);
  if (beats(m.gold)) return 'gold';
  if (beats(m.silver)) return 'silver';
  if (beats(m.bronze)) return 'bronze';
  return null;
}

/** A finished round: counts the play and keeps the best score. */
export function recordScore(save: SaveData, id: MinigameId, score: number, higherIsBetter: boolean): { save: SaveData; newBest: boolean } {
  const prev = save.minigames[id];
  const newBest = !prev || (higherIsBetter ? score > prev.best : score < prev.best);
  const rec: MinigameRecord = { best: newBest ? score : prev.best, plays: (prev?.plays ?? 0) + 1 };
  return { save: { ...save, minigames: { ...save.minigames, [id]: rec } }, newBest };
}

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

/** Untrusted save JSON → records; unknown ids and malformed entries are dropped. */
export function parseMinigames(v: unknown): MinigameRecords {
  const out: MinigameRecords = {};
  if (!isRecord(v)) return out;
  for (const id of MINIGAME_IDS) {
    const r = v[id];
    if (!isRecord(r)) continue;
    const { best, plays } = r;
    if (typeof best !== 'number' || !Number.isFinite(best)) continue;
    if (typeof plays !== 'number' || !Number.isInteger(plays) || plays < 0) continue;
    out[id] = { best, plays };
  }
  return out;
}
