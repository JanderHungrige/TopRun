import { LIVERIES, LIVERY_IDS, type LiveryId } from '../data/liveries';
import { ALL_MISSIONS, campaignMissions } from '../data/missions';
import type { TheaterId } from '../data/types';
import { PLANE_IDS, type PlaneId } from '../data/types';
import type { Check } from './economy';
import { kitOf, kitOfPlane, type Kit } from './kit';
import { mapOpenIn } from './progress';
import type { SaveData } from './save';

// Paint-job rules (doc 09). Unlocks are derived from campaign progress, never stored. Pure.

type Progress = SaveData['progress'];

/** The theater's first mission is playable: the mission before it in its campaign is cleared (doc 03/35); a map's
 *  first theater opens with its map (doc 100: maps 3–6 too). */
export function regionOpen(progress: Progress, theater: TheaterId): boolean {
  const first = ALL_MISSIONS.find((m) => m.theater === theater);
  if (!first) return false;
  const list = campaignMissions(first.campaign);
  const prev = list[list.indexOf(first) - 1];
  return prev === undefined ? mapOpenIn(progress, first.campaign) : progress[prev.id] !== undefined;
}

/** The kit whose craft wear a paint job: the jets maps 1–2's, the helicopters map 3's, the subs map 4's, the
 *  spacecraft map 5's (doc 100); null = the standard paint, everyone's. */
export function liveryKit(id: LiveryId): Kit | null {
  const unlock = LIVERIES[id].unlock;
  const campaign = unlock ? ALL_MISSIONS.find((m) => m.theater === unlock.theater)?.campaign : undefined;
  return campaign === undefined ? null : kitOf(campaign);
}

/** A craft may wear the paint job: the standard one, or one of its own kit's. */
export const liveryFits = (plane: PlaneId, id: LiveryId): boolean => {
  const kit = liveryKit(id);
  return kit === null || kit === kitOfPlane(plane);
};

/** The paint jobs a kit's PAINT list shows, standard first. */
export const liveriesFor = (kit: Kit): LiveryId[] => LIVERY_IDS.filter((id) => liveryKit(id) === null || liveryKit(id) === kit);

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

/** A map's paint jobs show in the PAINT list only once that map is open (docs 09, 100). */
export function liveryOnShow(progress: Progress, id: LiveryId): boolean {
  const unlock = LIVERIES[id].unlock;
  if (!unlock) return true;
  const campaign = ALL_MISSIONS.find((m) => m.theater === unlock.theater)?.campaign ?? 1;
  return mapOpenIn(progress, campaign);
}

export const unlockedLiveries = (progress: Progress): LiveryId[] => LIVERY_IDS.filter((id) => isLiveryUnlocked(progress, id));

/** Liveries unlocked by going from `before` to `after` (e.g. one mission), in data order. */
export function newlyUnlocked(before: Progress, after: Progress): LiveryId[] {
  return LIVERY_IDS.filter((id) => !isLiveryUnlocked(before, id) && isLiveryUnlocked(after, id));
}

export const liveryOf = (save: SaveData, plane: PlaneId): LiveryId => save.livery[plane];

export function canApplyLivery(save: SaveData, id: LiveryId, plane = save.selectedPlane): Check<'locked'> {
  return isLiveryUnlocked(save.progress, id) && liveryFits(plane, id) ? { ok: true } : { ok: false, reason: 'locked' };
}

/** Paints one craft. A locked livery, or another kit's, leaves the save untouched. */
export function applyLivery(save: SaveData, plane: PlaneId, id: LiveryId): SaveData {
  if (!canApplyLivery(save, id, plane).ok) return save;
  return { ...save, livery: { ...save.livery, [plane]: id } };
}

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

/** Untrusted save JSON → one livery per jet; unknown or not-yet-earned ones become standard. */
export function parseLiveries(v: unknown, progress: Progress): Record<PlaneId, LiveryId> {
  const raw = isRecord(v) ? v : {};
  const pick = (plane: PlaneId): LiveryId => {
    const id = LIVERY_IDS.find((x) => x === raw[plane]);
    return id !== undefined && isLiveryUnlocked(progress, id) && liveryFits(plane, id) ? id : 'standard';
  };
  return Object.fromEntries(PLANE_IDS.map((p) => [p, pick(p)])) as Record<PlaneId, LiveryId>;
}
