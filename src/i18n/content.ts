import { BOSSES } from '../data/bosses';
import { ENEMIES } from '../data/enemies';
import { EQUIPMENT } from '../data/equipment';
import { LIVERIES, type LiveryId } from '../data/liveries';
import { MEDALS, type MedalId } from '../data/medals';
import { PLANES } from '../data/planes';
import { THEATERS } from '../data/theaters';
import type { BossId, EnemyKind, EquipmentId, MissionDef, Objective, PlaneId, SecondaryId, TheaterId } from '../data/types';
import { SECONDARIES } from '../data/weapons';
import { BOSSES_DE, ENEMIES_DE, ENEMIES_EN_PLURAL, EQUIPMENT_DE, PLANES_DE, SECONDARIES_DE, THEATERS_DE } from './content-de';
import { getLang, t } from './i18n';
import { LIVERIES_DE } from './liveries-de';
import { MEDALS_DE } from './medals-de';
import { MISSIONS_DE } from './missions-de';

// Language-aware accessors over the data tables. English comes from src/data, German from the DE tables.
const de = (): boolean => getLang() === 'de';

export const missionName = (m: MissionDef): string => (de() ? MISSIONS_DE[m.id]?.name ?? m.name : m.name);
export const missionBriefing = (m: MissionDef): string => (de() ? MISSIONS_DE[m.id]?.briefing ?? m.briefing : m.briefing);

export const theaterName = (id: TheaterId): string => (de() ? THEATERS_DE[id].name : THEATERS[id].name);
export const theaterTagline = (id: TheaterId): string => (de() ? THEATERS_DE[id].tagline : THEATERS[id].tagline);

export const planeDescription = (id: PlaneId): string => (de() ? PLANES_DE[id].description : PLANES[id].description);
export const planeSpecialName = (id: PlaneId): string => (de() ? PLANES_DE[id].specialName : PLANES[id].specialName);

export const secondaryName = (id: SecondaryId): string => (de() ? SECONDARIES_DE[id].name : SECONDARIES[id].name);
export const secondaryDescription = (id: SecondaryId): string => (de() ? SECONDARIES_DE[id].description : SECONDARIES[id].description);

export const equipmentName = (id: EquipmentId): string => (de() ? EQUIPMENT_DE[id].name : EQUIPMENT[id].name);
export const equipmentDescription = (id: EquipmentId): string => (de() ? EQUIPMENT_DE[id].description : EQUIPMENT[id].description);
export const equipmentLevelText = (id: EquipmentId): readonly string[] => (de() ? EQUIPMENT_DE[id].levelText : EQUIPMENT[id].levelText);

export function enemyName(kind: EnemyKind, count = 1): string {
  if (de()) return ENEMIES_DE[kind][count === 1 ? 0 : 1];
  return count === 1 ? ENEMIES[kind].name : ENEMIES_EN_PLURAL[kind];
}

export const liveryName = (id: LiveryId): string => (de() ? LIVERIES_DE[id] : LIVERIES[id].name);

export const medalName = (id: MedalId): string => (de() ? MEDALS_DE[id].name : MEDALS[id].name);
export const medalCitation = (id: MedalId): string => (de() ? MEDALS_DE[id].citation : MEDALS[id].citation);

export const bossTitle = (id: BossId): string => (de() ? BOSSES_DE[id] : BOSSES[id].title);

export function objectiveText(o: Objective): string {
  switch (o.type) {
    case 'patrol': return t('objective.patrol');
    case 'intercept': return t('objective.intercept', { n: o.count });
    case 'strike': return t('objective.strike', { n: o.count, targets: enemyName(o.target, o.count) });
    case 'boss': return t('objective.boss', { boss: BOSSES[o.boss].name, title: bossTitle(o.boss) });
    default: throw new Error(`unhandled: ${o satisfies never}`);
  }
}
