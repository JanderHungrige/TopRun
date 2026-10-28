import { formatMoney } from '../core/math';
import { BOSSES } from '../data/bosses';
import { LIVERIES, LIVERY_IDS, type LiveryId } from '../data/liveries';
import { ALL_MISSIONS } from '../data/missions';
import { PLANES } from '../data/planes';
import { EQUIPMENT_IDS, PLANE_IDS, SECONDARY_IDS } from '../data/types';
import { gunLevelDef, MAX_GUN2_LEVEL, SECONDARIES, secondaryAllowedOn } from '../data/weapons';
import { MAX_MARK, toMark } from '../data/arsenal';
import { canBuyMark, markCap, markOf, markPrice, weaponStats, type WeaponStats } from '../game/arsenal';
import { canBuy, priceOf, type ShopItem } from '../game/economy';
import { canBuyTwin, equipmentCap, gunCap, weaponOnSale } from '../game/firepower';
import { jetOnSale } from '../game/jets';
import { mapTwoOpen } from '../game/progress';
import { isLiveryUnlocked, liveryOnShow } from '../game/liveries';
import type { SaveData } from '../game/save';
import {
  equipmentDescription, equipmentName, liveryName, planeDescription, secondaryDescription, secondaryName, theaterName,
} from '../i18n/content';
import { t } from '../i18n/i18n';
import type { UiKey } from '../i18n/ui-en';

export interface Tab {
  name: UiKey;
  items: readonly ShopItem[];
}

/** The shop's tabs; the JETS tab lists the map-2 jets only once map 2 is open (doc 36). */
export const tabs = (save: SaveData): readonly Tab[] => [
  { name: 'hangar.tabJets', items: PLANE_IDS.filter((id) => jetOnSale(save, id)).map((id) => ({ type: 'plane', id })) },
  {
    name: 'hangar.tabWeapons',
    items: [
      { type: 'gun' }, { type: 'ammo' }, ...(mapTwoOpen(save) ? [{ type: 'gun2' as const }] : []),
      ...SECONDARY_IDS.filter((id) => weaponOnSale(save, id)).map((id) => ({ type: 'secondary' as const, id })),
    ],
  },
  { name: 'hangar.tabEquipment', items: EQUIPMENT_IDS.map((id) => ({ type: 'equipment', id })) },
  { name: 'hangar.tabPaint', items: LIVERY_IDS.filter((id) => liveryOnShow(save.progress, id)).map((id) => ({ type: 'livery', id })) },
];

export type ActionKind = 'buy' | 'select' | 'mount' | 'paint' | 'none';

export interface ItemAction {
  kind: ActionKind;
  label: string;
  enabled: boolean;
  note: string;
  /** Why the action is unavailable, for the crew chief. */
  reason: 'funds' | 'restricted' | null;
  shortfall: number;
}

export function itemName(item: ShopItem): string {
  switch (item.type) {
    case 'plane': return PLANES[item.id].name;
    case 'gun': return t('hangar.gunName');
    case 'gun2': return t('hangar.gun2Name');
    case 'ammo': return t('arsenal.ammoName');
    case 'secondary': return secondaryName(item.id);
    case 'equipment': return equipmentName(item.id);
    case 'livery': return liveryName(item.id);
    default: throw new Error(`unhandled: ${item satisfies never}`);
  }
}

export function itemDescription(item: ShopItem): string {
  switch (item.type) {
    case 'plane': return planeDescription(item.id);
    case 'gun': return t('hangar.gunDesc');
    case 'gun2': return t('hangar.gun2Desc');
    case 'ammo': return t('arsenal.ammoDesc');
    case 'secondary': return secondaryDescription(item.id);
    case 'equipment': return equipmentDescription(item.id);
    case 'livery': return t('hangar.paintDesc');
    default: throw new Error(`unhandled: ${item satisfies never}`);
  }
}

/** Short status shown on the right of a list row. */
export function itemStatus(save: SaveData, item: ShopItem): string {
  const price = priceOf(save, item);
  switch (item.type) {
    case 'plane':
      if (save.selectedPlane === item.id) return t('hangar.inUse');
      return save.ownedPlanes.includes(item.id) ? t('hangar.owned') : formatMoney(PLANES[item.id].price);
    case 'gun':
      return save.gunLevel >= gunCap(save) ? t('hangar.maxLevel', { level: save.gunLevel }) : t('hangar.levelPrice', { level: save.gunLevel, price: formatMoney(price ?? 0) });
    case 'gun2':
      if (save.gun2Level >= MAX_GUN2_LEVEL) return t('hangar.maxLevel', { level: MAX_GUN2_LEVEL });
      return save.gun2Level === 0 ? formatMoney(price ?? 0) : t('hangar.levelPrice', { level: save.gun2Level, price: formatMoney(price ?? 0) });
    case 'ammo':
      if (price === null) return t('hangar.maxLevel', { level: save.ammoLevel });
      return save.ammoLevel === 0 ? formatMoney(price) : t('hangar.levelPrice', { level: save.ammoLevel, price: formatMoney(price) });
    case 'secondary': {
      const mounted = save.loadout[save.selectedPlane].filter((x) => x === item.id).length;
      const mark = markOf(save, item.id) > 1 ? `${markName(markOf(save, item.id))} · ` : '';
      if (save.ownedSecondaries.includes(item.id)) return mark + (mounted ? t('hangar.mounted', { n: mounted }) : t('hangar.owned'));
      return formatMoney(price ?? 0);
    }
    case 'equipment': {
      const lvl = save.equipment[item.id];
      const max = equipmentCap(save, item.id);
      if (price === null) return max === 1 ? t('hangar.installed') : t('hangar.maxLevel', { level: lvl });
      return max > 1 ? t('hangar.levelPrice', { level: lvl, price: formatMoney(price) }) : formatMoney(price);
    }
    case 'livery':
      if (save.livery[save.selectedPlane] === item.id) return t('hangar.inUse');
      return t(isLiveryUnlocked(save.progress, item.id) ? 'hangar.paintReady' : 'hangar.locked');
    default: throw new Error(`unhandled: ${item satisfies never}`);
  }
}

/** True when a status string means "owned / done" (drawn green). */
export function statusIsOwned(save: SaveData, item: ShopItem): boolean {
  if (item.type === 'livery') return isLiveryUnlocked(save.progress, item.id);
  return priceOf(save, item) === null || (item.type === 'secondary' && save.ownedSecondaries.includes(item.id));
}

const none = (label: string, note = '', reason: ItemAction['reason'] = null): ItemAction =>
  ({ kind: 'none', label, enabled: false, note, reason, shortfall: 0 });

function buyAction(save: SaveData, item: ShopItem, label: string): ItemAction {
  const price = priceOf(save, item) ?? 0;
  const check = canBuy(save, item);
  const short = Math.max(0, price - save.money);
  const funds = !check.ok && check.reason === 'insufficient-funds';
  return {
    kind: 'buy', label, enabled: check.ok, shortfall: short, reason: funds ? 'funds' : null,
    note: funds ? t('hangar.needMore', { amount: formatMoney(short) }) : '',
  };
}

export function itemAction(save: SaveData, item: ShopItem): ItemAction {
  const price = formatMoney(priceOf(save, item) ?? 0);
  switch (item.type) {
    case 'plane':
      if (!save.ownedPlanes.includes(item.id)) return buyAction(save, item, t('hangar.buy', { price }));
      if (save.selectedPlane === item.id) return none(t('hangar.inUse'));
      return { kind: 'select', label: t('hangar.flyThis'), enabled: true, note: '', reason: null, shortfall: 0 };
    case 'gun':
      if (save.gunLevel >= gunCap(save)) return none(t('hangar.maxed'));
      return buyAction(save, item, t('hangar.gunUpgrade', { level: save.gunLevel + 1, price }));
    case 'gun2':
      if (priceOf(save, item) === null) return none(t('hangar.maxed'));
      return buyAction(save, item, save.gun2Level === 0 ? t('hangar.buy', { price }) : t('hangar.gunUpgrade', { level: save.gun2Level + 1, price }));
    case 'ammo':
      if (priceOf(save, item) === null) return none(t('hangar.maxed'));
      return buyAction(save, item, t('hangar.gunUpgrade', { level: save.ammoLevel + 1, price }));
    case 'secondary':
      if (!save.ownedSecondaries.includes(item.id)) return buyAction(save, item, t('hangar.buy', { price }));
      if (!secondaryAllowedOn(item.id, save.selectedPlane)) return none(t('hangar.f14Only'), t('hangar.f14OnlyNote'), 'restricted');
      return { kind: 'mount', label: t('hangar.mount'), enabled: true, note: '', reason: null, shortfall: 0 };
    case 'equipment':
      if (priceOf(save, item) === null) return none(t('hangar.maxed'));
      return buyAction(save, item, t(save.equipment[item.id] > 0 ? 'hangar.upgrade' : 'hangar.buy', { price }));
    case 'livery':
      if (!isLiveryUnlocked(save.progress, item.id)) return none(t('hangar.locked'), unlockText(item.id));
      if (save.livery[save.selectedPlane] === item.id) return none(t('hangar.inUse'));
      return { kind: 'paint', label: t('hangar.applyPaint'), enabled: true, note: '', reason: null, shortfall: 0 };
    default: throw new Error(`unhandled: ${item satisfies never}`);
  }
}

/** The TWIN PODS button of an owned weapon once map 2 is open (doc 37); null = no button. */
export function twinAction(save: SaveData, item: ShopItem): { label: string; enabled: boolean } | null {
  if (item.type !== 'secondary' || !mapTwoOpen(save) || !save.ownedSecondaries.includes(item.id)) return null;
  if (save.twinSecondaries.includes(item.id)) return { label: t('hangar.twinOwned'), enabled: false };
  return { label: t('hangar.buyTwin', { price: formatMoney(SECONDARIES[item.id].price) }), enabled: canBuyTwin(save, item.id).ok };
}

/** "Mk II" etc. */
export const markName = (mark: number): string => t('arsenal.mark', { n: 'I'.repeat(mark) });

/** The UPGRADE button of an owned weapon (doc 43); null = not owned. */
export function markAction(save: SaveData, item: ShopItem): { label: string; enabled: boolean } | null {
  if (item.type !== 'secondary' || !save.ownedSecondaries.includes(item.id)) return null;
  const mark = markOf(save, item.id);
  const price = markPrice(save, item.id);
  if (price !== null) return { label: t('arsenal.upgradeMark', { mark: markName(mark + 1), price: formatMoney(price) }), enabled: canBuyMark(save, item.id).ok };
  return { label: mark < MAX_MARK ? t('arsenal.markLater') : t('arsenal.markTop', { mark: markName(mark) }), enabled: false };
}

/** A secondary's numbers at its current mark, and at the next one on sale (null at the top). */
export function weaponNowNext(save: SaveData, id: (typeof SECONDARY_IDS)[number]): { now: WeaponStats; next: WeaponStats | null } {
  const mark = markOf(save, id);
  return { now: weaponStats(SECONDARIES[id], mark), next: mark < markCap(save) ? weaponStats(SECONDARIES[id], toMark(mark + 1)) : null };
}

/** How a paint job is earned: "Beat IRONCLAD — Pacific …" / "3★ on every … mission". */
export function unlockText(id: LiveryId): string {
  const u = LIVERIES[id].unlock;
  if (!u) return '';
  const theater = theaterName(u.theater);
  if (u.kind === 'stars') return t('hangar.unlockStars', { theater });
  if (u.kind === 'region') return t('hangar.unlockRegion', { theater });
  const o = ALL_MISSIONS.find((m) => m.theater === u.theater && m.objective.type === 'boss')?.objective;
  return t('hangar.unlockBoss', { boss: o?.type === 'boss' ? BOSSES[o.boss].name : '', theater });
}

/** Gun level line for the detail panel. */
export function gunSummary(level: number): string {
  const d = gunLevelDef(level);
  return t('hangar.gunSummary', { barrels: d.pattern.length, rate: d.shotsPerSec, damage: d.damage });
}

export function secondaryTargets(id: (typeof SECONDARY_IDS)[number]): string {
  const hits = SECONDARIES[id].hits;
  return t(hits === 'any' ? 'hangar.targetsAny' : hits === 'air' ? 'hangar.targetsAir' : 'hangar.targetsGround');
}
