import { MEDAL_IDS, type MedalId } from '../data/medals';
import { MISSIONS } from '../data/missions';
import type { TheaterId } from '../data/types';
import type { SaveData } from './save';

// Which medals a pilot has earned (doc 24). Derived from the save, never stored. Pure.

const THEATER_MEDAL: Readonly<Partial<Record<MedalId, TheaterId>>> = {
  pacific: 'pacific', gulf: 'gulf', arctic: 'arctic', canyon: 'canyon', leviathan: 'leviathan',
};

const bossCleared = (progress: SaveData['progress'], theater: TheaterId): boolean =>
  MISSIONS.some((m) => m.theater === theater && m.objective.type === 'boss' && progress[m.id] !== undefined);

function earned(id: MedalId, save: SaveData, golds: number): boolean {
  const r = save.record;
  const theater = THEATER_MEDAL[id];
  if (theater) return bossCleared(save.progress, theater);
  switch (id) {
    case 'victory': return save.progress[MISSIONS[MISSIONS.length - 1]?.id ?? ''] !== undefined;
    case 'allstars': return MISSIONS.every((m) => (save.progress[m.id]?.stars ?? 0) >= 3);
    case 'ace': return r.kills >= 50;
    case 'topace': return r.kills >= 250;
    case 'giant': return r.bossKills >= 3;
    case 'untouchable': return r.flawless >= 1;
    case 'gunslinger': return r.gunOnly >= 1;
    case 'catapult': return r.bestLaunchStreak >= 5;
    case 'offduty5': return golds >= 5;
    case 'offduty10': return golds >= 10;
    case 'sorties25': return r.sorties >= 25;
    case 'sorties100': return r.sorties >= 100;
    case 'triple': return r.planesFlown.length >= 3;
    case 'pacific':
    case 'gulf':
    case 'arctic':
    case 'canyon':
    case 'leviathan': return false;
    default: throw new Error(`unhandled: ${id satisfies never}`);
  }
}

/** The earned medals in catalogue order. `golds` = minigames with a gold personal best. */
export function earnedMedals(save: SaveData, golds: number): MedalId[] {
  return MEDAL_IDS.filter((id) => earned(id, save, golds));
}

export const newMedals = (before: readonly MedalId[], after: readonly MedalId[]): MedalId[] => after.filter((id) => !before.includes(id));
