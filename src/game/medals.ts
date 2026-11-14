import { MEDAL_IDS, type MedalId } from '../data/medals';
import { ALL_MISSIONS, campaignMissions } from '../data/missions';
import type { CampaignId, TheaterId } from '../data/types';
import type { SaveData } from './save';

// Which medals a pilot has earned (docs 24, 62). Derived from the save, never stored. Pure.

/** Campaign ribbons (doc 62 adds maps 2–4): the theater whose boss earns it. */
const THEATER_MEDAL: Readonly<Partial<Record<MedalId, TheaterId>>> = {
  pacific: 'pacific', gulf: 'gulf', arctic: 'arctic', canyon: 'canyon', leviathan: 'leviathan',
  northsea: 'northsea', himalaya: 'himalaya', jungle: 'jungle', nightfall: 'nightfall', thunderhead: 'thunderhead',
  fjords: 'fjords', highlands: 'highlands', delta: 'delta', mesa: 'mesa', ashfall: 'ashfall',
  orbit: 'orbit', belt: 'belt', moon: 'moon', rings: 'rings', deep: 'deep',
  reef: 'reef', kelp: 'kelp', wrecks: 'wrecks', trench: 'trench', abyss: 'abyss',
  landing: 'landing', canopy: 'canopy', swamp: 'swamp', ruins: 'ruins', hive: 'hive',
  grass: 'grass', saltflats: 'saltflats', badlands: 'badlands', barrows: 'barrows', impact: 'impact',
};

/** Each map's victory medal and golden star (doc 62). */
const MAP_MEDAL: Readonly<Partial<Record<MedalId, { map: CampaignId; kind: 'victory' | 'stars' }>>> = {
  victory: { map: 1, kind: 'victory' }, allstars: { map: 1, kind: 'stars' },
  victory2: { map: 2, kind: 'victory' }, allstars2: { map: 2, kind: 'stars' },
  victory3: { map: 3, kind: 'victory' }, allstars3: { map: 3, kind: 'stars' },
  victory5: { map: 4, kind: 'victory' }, allstars5: { map: 4, kind: 'stars' }, // the sea's: map 4 since doc 74
  victory4: { map: 5, kind: 'victory' }, allstars4: { map: 5, kind: 'stars' }, // space's: map 5 since doc 74
  victory6: { map: 6, kind: 'victory' }, allstars6: { map: 6, kind: 'stars' }, // the jungle planet (doc 85)
  victory7: { map: 7, kind: 'victory' }, allstars7: { map: 7, kind: 'stars' }, // the alien steppe (doc 110)
};

const bossCleared = (progress: SaveData['progress'], theater: TheaterId): boolean =>
  ALL_MISSIONS.some((m) => m.theater === theater && m.objective.type === 'boss' && progress[m.id] !== undefined);

function mapMedal(progress: SaveData['progress'], map: CampaignId, kind: 'victory' | 'stars'): boolean {
  const list = campaignMissions(map);
  if (kind === 'victory') return list.length > 0 && progress[list[list.length - 1]?.id ?? ''] !== undefined;
  return list.length > 0 && list.every((m) => (progress[m.id]?.stars ?? 0) >= 3);
}

/** The combat, off-duty and dedication medals. */
const PERSONAL: Readonly<Partial<Record<MedalId, (r: SaveData['record'], golds: number) => boolean>>> = {
  ace: (r) => r.kills >= 50,
  topace: (r) => r.kills >= 250,
  giant: (r) => r.bossKills >= 3,
  untouchable: (r) => r.flawless >= 1,
  gunslinger: (r) => r.gunOnly >= 1,
  catapult: (r) => r.bestLaunchStreak >= 5,
  offduty5: (_r, golds) => golds >= 5,
  offduty10: (_r, golds) => golds >= 10,
  sorties25: (r) => r.sorties >= 25,
  sorties100: (r) => r.sorties >= 100,
  triple: (r) => r.planesFlown.length >= 3,
};

function earned(id: MedalId, save: SaveData, golds: number): boolean {
  const theater = THEATER_MEDAL[id];
  if (theater) return bossCleared(save.progress, theater);
  const map = MAP_MEDAL[id];
  if (map) return mapMedal(save.progress, map.map, map.kind);
  return PERSONAL[id]?.(save.record, golds) ?? false;
}

/** The earned medals in catalogue order. `golds` = minigames with a gold personal best. */
export function earnedMedals(save: SaveData, golds: number): MedalId[] {
  return MEDAL_IDS.filter((id) => earned(id, save, golds));
}

export const newMedals = (before: readonly MedalId[], after: readonly MedalId[]): MedalId[] => after.filter((id) => !before.includes(id));
