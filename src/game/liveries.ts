import { LIVERIES, LIVERY_IDS, type LiveryId } from '../data/liveries';
import { ALL_MISSIONS, campaignMissions } from '../data/missions';
import type { TheaterId } from '../data/types';
import { PLANE_IDS, type PlaneId } from '../data/types';
import type { Check } from './economy';
import type { SaveData } from './save';

// Paint-job rules (doc 09). Unlocks are derived from campaign progress, never stored. Pure.

type Progress = SaveData['progress'];

/** The theater's first mission is playable: the mission before it in its campaign is cleared (doc 03/35). */
export function regionOpen(progress: Progress, theater: TheaterId): boolean {
  const first = ALL_MISSIONS.find((m) => m.theater === theater);
  if (!first) return false;
  const list = campaignMissions(first.campaign);
  const i = list.indexOf(first);
  const prev = i > 0 ? list[i - 1] : first.campaign === 2 ? campaignMissions(1).at(-1) : undefined;
  return prev === undefined || progress[prev.id] !== undefined;
}

export function isLiveryUnlocked(progress: Progress, id: LiveryId): boolean {
  const unlock = LIVERIES[id].unlock;
  if (!unlock) return true;
  const missions = ALL_MISSIONS.filter((m) => m.theater === unlock.theater);
  switch (unlock.kind) {
    case 'boss': return missions.some((m) => m.objective.type === 'boss' && progress[m.id] !== undefined);
    case 'stars': return missions.every((m) => (progress[m.id]?.stars ?? 0) >= 3);
    case 'region': return regionOpen(progress, unlock.theater);
    default: throw new Error(`unhandled: ${unlock.kind satisfies never}`);
  }
}

/** Map-2 paint jobs show in the PAINT tab only once map 2 is open (doc 09). */
export function liveryOnShow(progress: Progress, id: LiveryId): boolean {
  const unlock = LIVERIES[id].unlock;
  if (!unlock) return true;
  const campaign = ALL_MISSIONS.find((m) => m.theater === unlock.theater)?.campaign ?? 1;
  return campaign === 1 || regionOpen(progress, 'northsea');
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
