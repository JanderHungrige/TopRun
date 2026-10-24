import { MISSIONS } from '../data/missions';
import type { MissionDef } from '../data/types';
import type { SaveData } from './save';

export function isCleared(save: SaveData, mission: MissionDef): boolean {
  return mission.id in save.progress;
}

export function isUnlocked(save: SaveData, mission: MissionDef): boolean {
  if (mission.number === 1) return true;
  const prev = MISSIONS[mission.number - 2];
  return prev !== undefined && isCleared(save, prev);
}

/** Highest unlocked mission — the default map selection. */
export function nextMission(save: SaveData): MissionDef {
  let best = MISSIONS[0];
  for (const m of MISSIONS) if (isUnlocked(save, m)) best = m;
  if (!best) throw new Error('no missions defined');
  return best;
}

export function totalStars(save: SaveData): number {
  return Object.values(save.progress).reduce((sum, p) => sum + p.stars, 0);
}

export function campaignComplete(save: SaveData): boolean {
  return MISSIONS.every((m) => isCleared(save, m));
}
