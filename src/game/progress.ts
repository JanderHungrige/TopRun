import { ALL_MISSIONS, campaignMissions, MISSIONS } from '../data/missions';
import type { CampaignId, MissionDef } from '../data/types';
import type { SaveData } from './save';

// Campaign progress on both maps (docs 03, 35). Pure.

export function isCleared(save: SaveData, mission: MissionDef): boolean {
  return mission.id in save.progress;
}

/** Map 2 opens once the map-1 finale (m30) is cleared (doc 35), for the admin always (doc 47). */
export function mapTwoOpen(save: SaveData): boolean {
  if (save.admin) return true;
  const last = MISSIONS[MISSIONS.length - 1];
  return last !== undefined && isCleared(save, last);
}

/** Mission 1 always; the first map-2 mission once map 2 is open; otherwise the previous mission of its map.
 *  The admin pilot has every mission (doc 47). */
export function isUnlocked(save: SaveData, mission: MissionDef): boolean {
  if (save.admin) return true;
  const list = campaignMissions(mission.campaign);
  const i = list.indexOf(mission);
  if (i === 0) return mission.campaign === 1 || mapTwoOpen(save);
  const prev = list[i - 1];
  return prev !== undefined && isCleared(save, prev);
}

/** Highest unlocked mission, on map 2 once it is open — the default map selection. With everything open the
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

/** All stars, both maps (the pilot rating, doc 26). */
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
