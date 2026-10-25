import { LIVERIES, LIVERY_IDS, type LiveryId } from '../data/liveries';
import { MISSIONS } from '../data/missions';
import { PLANE_IDS, type PlaneId } from '../data/types';
import type { Check } from './economy';
import type { SaveData } from './save';

// Paint-job rules (doc 09). Unlocks are derived from campaign progress, never stored. Pure.

type Progress = SaveData['progress'];

export function isLiveryUnlocked(progress: Progress, id: LiveryId): boolean {
  const unlock = LIVERIES[id].unlock;
  if (!unlock) return true;
  const missions = MISSIONS.filter((m) => m.theater === unlock.theater);
  if (unlock.kind === 'boss') return missions.some((m) => m.objective.type === 'boss' && progress[m.id] !== undefined);
  return missions.every((m) => (progress[m.id]?.stars ?? 0) >= 3);
}

export const unlockedLiveries = (progress: Progress): LiveryId[] => LIVERY_IDS.filter((id) => isLiveryUnlocked(progress, id));

/** Liveries unlocked by going from `before` to `after` (e.g. one mission), in data order. */
export function newlyUnlocked(before: Progress, after: Progress): LiveryId[] {
  return LIVERY_IDS.filter((id) => !isLiveryUnlocked(before, id) && isLiveryUnlocked(after, id));
}

export const liveryOf = (save: SaveData, plane: PlaneId): LiveryId => save.livery[plane];

export function canApplyLivery(save: SaveData, id: LiveryId): Check<'locked'> {
  return isLiveryUnlocked(save.progress, id) ? { ok: true } : { ok: false, reason: 'locked' };
}

/** Paints one jet. A locked livery leaves the save untouched. */
export function applyLivery(save: SaveData, plane: PlaneId, id: LiveryId): SaveData {
  if (!canApplyLivery(save, id).ok) return save;
  return { ...save, livery: { ...save.livery, [plane]: id } };
}

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

/** Untrusted save JSON → one livery per jet; unknown or not-yet-earned ones become standard. */
export function parseLiveries(v: unknown, progress: Progress): Record<PlaneId, LiveryId> {
  const raw = isRecord(v) ? v : {};
  const pick = (plane: PlaneId): LiveryId => {
    const id = LIVERY_IDS.find((x) => x === raw[plane]);
    return id !== undefined && isLiveryUnlocked(progress, id) ? id : 'standard';
  };
  return Object.fromEntries(PLANE_IDS.map((p) => [p, pick(p)])) as Record<PlaneId, LiveryId>;
}
