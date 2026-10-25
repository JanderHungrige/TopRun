import { formatMoney } from '../core/math';
import { maxEquipmentLevel } from '../data/equipment';
import { PLANES } from '../data/planes';
import { EQUIPMENT_IDS, PLANE_IDS, SECONDARY_IDS } from '../data/types';
import { gunLevelDef, MAX_GUN_LEVEL, SECONDARIES, secondaryAllowedOn } from '../data/weapons';
import { canBuy, priceOf, type ShopItem } from '../game/economy';
import type { SaveData } from '../game/save';
import { equipmentDescription, equipmentName, planeDescription, secondaryDescription, secondaryName } from '../i18n/content';
import { t } from '../i18n/i18n';
import type { UiKey } from '../i18n/ui-en';

export interface Tab {
  name: UiKey;
  items: readonly ShopItem[];
}

export const TABS: readonly Tab[] = [
  { name: 'hangar.tabJets', items: PLANE_IDS.map((id) => ({ type: 'plane', id })) },
  { name: 'hangar.tabWeapons', items: [{ type: 'gun' }, ...SECONDARY_IDS.map((id) => ({ type: 'secondary' as const, id }))] },
  { name: 'hangar.tabEquipment', items: EQUIPMENT_IDS.map((id) => ({ type: 'equipment', id })) },
];

export type ActionKind = 'buy' | 'select' | 'mount' | 'none';

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
    case 'secondary': return secondaryName(item.id);
    case 'equipment': return equipmentName(item.id);
    default: throw new Error(`unhandled: ${item satisfies never}`);
  }
}

export function itemDescription(item: ShopItem): string {
  switch (item.type) {
    case 'plane': return planeDescription(item.id);
    case 'gun': return t('hangar.gunDesc');
    case 'secondary': return secondaryDescription(item.id);
    case 'equipment': return equipmentDescription(item.id);
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
      return save.gunLevel >= MAX_GUN_LEVEL ? t('hangar.maxLevel', { level: 5 }) : t('hangar.levelPrice', { level: save.gunLevel, price: formatMoney(price ?? 0) });
    case 'secondary': {
      const mounted = save.loadout[save.selectedPlane].filter((x) => x === item.id).length;
      if (save.ownedSecondaries.includes(item.id)) return mounted ? t('hangar.mounted', { n: mounted }) : t('hangar.owned');
      return formatMoney(price ?? 0);
    }
    case 'equipment': {
      const lvl = save.equipment[item.id];
      const max = maxEquipmentLevel(item.id);
      if (price === null) return max === 1 ? t('hangar.installed') : t('hangar.maxLevel', { level: lvl });
      return max > 1 ? t('hangar.levelPrice', { level: lvl, price: formatMoney(price) }) : formatMoney(price);
    }
    default: throw new Error(`unhandled: ${item satisfies never}`);
  }
}

/** True when a status string means "owned / done" (drawn green). */
export function statusIsOwned(save: SaveData, item: ShopItem): boolean {
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
      if (save.gunLevel >= MAX_GUN_LEVEL) return none(t('hangar.maxed'));
      return buyAction(save, item, t('hangar.gunUpgrade', { level: save.gunLevel + 1, price }));
    case 'secondary':
      if (!save.ownedSecondaries.includes(item.id)) return buyAction(save, item, t('hangar.buy', { price }));
      if (!secondaryAllowedOn(item.id, save.selectedPlane)) return none(t('hangar.f14Only'), t('hangar.f14OnlyNote'), 'restricted');
      return { kind: 'mount', label: t('hangar.mount'), enabled: true, note: '', reason: null, shortfall: 0 };
    case 'equipment':
      if (priceOf(save, item) === null) return none(t('hangar.maxed'));
      return buyAction(save, item, t(save.equipment[item.id] > 0 ? 'hangar.upgrade' : 'hangar.buy', { price }));
    default: throw new Error(`unhandled: ${item satisfies never}`);
  }
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
