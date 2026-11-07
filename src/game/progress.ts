import { ALL_MISSIONS, campaignMissions, MISSIONS } from '../data/missions';
import type { CampaignId, MissionDef } from '../data/types';
import type { SaveData } from './save';

// Campaign progress on every map (docs 03, 35). Pure.

/** The map whose finale opens a map; map 1 is always open. */
const PREVIOUS: Readonly<Record<CampaignId, CampaignId>> = { 1: 1, 2: 1, 3: 2, 4: 3, 5: 4 };

export function isCleared(save: SaveData, mission: MissionDef): boolean {
  return mission.id in save.progress;
}

/** A map opens once the previous map's finale is cleared: map 2 after m30 (doc 35), map 3 after m60 (doc 48),
 *  map 4 after m90 (doc 56), map 5 after m120 (doc 65).
 *  Map 1 is always open, and the admin has every map (doc 47). */
export function mapOpen(save: SaveData, c: CampaignId): boolean {
  if (c === 1 || save.admin) return true;
  const prev = campaignMissions(PREVIOUS[c]);
  const last = prev[prev.length - 1];
  return last !== undefined && isCleared(save, last);
}

export const mapTwoOpen = (save: SaveData): boolean => mapOpen(save, 2);

/** A map's first mission once the map is open; otherwise the previous mission of its map.
 *  The admin pilot has every mission (doc 47). */
export function isUnlocked(save: SaveData, mission: MissionDef): boolean {
  if (save.admin) return true;
  const list = campaignMissions(mission.campaign);
  const i = list.indexOf(mission);
  if (i === 0) return mapOpen(save, mission.campaign);
  const prev = list[i - 1];
  return prev !== undefined && isCleared(save, prev);
}

/** Highest unlocked mission, on the newest open map — the default map selection. With everything open the
 *  admin starts at the first mission not yet cleared instead. */
export function nextMission(save: SaveData): MissionDef {
  if (save.admin) return firstUncleared(save, ALL_MISSIONS);
  let best = MISSIONS[0];
  for (const m of ALL_MISSIONS) if (isUnlocked(save, m)) best = m;
  if (!best) throw new Error('no missions defined');
  return best;
}

/** Highest unlocked mission of one map (its default selection when switching maps). */
export function nextMissionOn(save: SaveData, c: CampaignId): MissionDef {
  const list = campaignMissions(c);
  if (save.admin) return firstUncleared(save, list);
  let best = list[0];
  for (const m of list) if (isUnlocked(save, m)) best = m;
  if (!best) throw new Error('no missions defined');
  return best;
}

function firstUncleared(save: SaveData, list: readonly MissionDef[]): MissionDef {
  const m = list.find((x) => !isCleared(save, x)) ?? list[list.length - 1];
  if (!m) throw new Error('no missions defined');
  return m;
}

/** All stars, every map (the pilot rating, doc 26). */
export function totalStars(save: SaveData): number {
  return Object.values(save.progress).reduce((sum, p) => sum + p.stars, 0);
}

/** Stars earned on one map (the map's top bar). */
export function campaignStars(save: SaveData, c: CampaignId): number {
  return campaignMissions(c).reduce((sum, m) => sum + (save.progress[m.id]?.stars ?? 0), 0);
}

export function campaignComplete(save: SaveData, c: CampaignId = 1): boolean {
  return campaignMissions(c).every((m) => isCleared(save, m));
}
