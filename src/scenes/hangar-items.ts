import { formatMoney } from '../core/math';
import { EQUIPMENT, maxEquipmentLevel } from '../data/equipment';
import { PLANES } from '../data/planes';
import { EQUIPMENT_IDS, PLANE_IDS, SECONDARY_IDS } from '../data/types';
import { gunLevelDef, MAX_GUN_LEVEL, SECONDARIES, secondaryAllowedOn } from '../data/weapons';
import { canBuy, priceOf, type ShopItem } from '../game/economy';
import type { SaveData } from '../game/save';

export interface Tab {
  name: string;
  items: readonly ShopItem[];
}

export const TABS: readonly Tab[] = [
  { name: 'JETS', items: PLANE_IDS.map((id) => ({ type: 'plane', id })) },
  { name: 'WEAPONS', items: [{ type: 'gun' }, ...SECONDARY_IDS.map((id) => ({ type: 'secondary' as const, id }))] },
  { name: 'EQUIPMENT', items: EQUIPMENT_IDS.map((id) => ({ type: 'equipment', id })) },
];

export type ActionKind = 'buy' | 'select' | 'mount' | 'none';

export interface ItemAction {
  kind: ActionKind;
  label: string;
  enabled: boolean;
  note: string;
}

export function itemName(item: ShopItem): string {
  switch (item.type) {
    case 'plane': return PLANES[item.id].name;
    case 'gun': return 'M61 Vulcan Cannon';
    case 'secondary': return SECONDARIES[item.id].name;
    case 'equipment': return EQUIPMENT[item.id].name;
    default: throw new Error(`unhandled: ${item satisfies never}`);
  }
}

export function itemDescription(item: ShopItem): string {
  switch (item.type) {
    case 'plane': return PLANES[item.id].description;
    case 'gun': return 'Six-barrel 20 mm rotary cannon. Each upgrade adds barrels, rate of fire or damage. Guns deal half damage to ground targets.';
    case 'secondary': return SECONDARIES[item.id].description;
    case 'equipment': return EQUIPMENT[item.id].description;
    default: throw new Error(`unhandled: ${item satisfies never}`);
  }
}

/** Short status shown on the right of a list row. */
export function itemStatus(save: SaveData, item: ShopItem): string {
  const price = priceOf(save, item);
  switch (item.type) {
    case 'plane':
      if (save.selectedPlane === item.id) return 'IN USE';
      return save.ownedPlanes.includes(item.id) ? 'OWNED' : formatMoney(PLANES[item.id].price);
    case 'gun': return save.gunLevel >= MAX_GUN_LEVEL ? 'LV 5 · MAX' : `LV ${save.gunLevel} → ${formatMoney(price ?? 0)}`;
    case 'secondary': {
      const mounted = save.loadout[save.selectedPlane].filter((x) => x === item.id).length;
      if (save.ownedSecondaries.includes(item.id)) return mounted ? `MOUNTED ×${mounted}` : 'OWNED';
      return formatMoney(price ?? 0);
    }
    case 'equipment': {
      const lvl = save.equipment[item.id];
      const max = maxEquipmentLevel(item.id);
      return price === null ? (max === 1 ? 'INSTALLED' : `LV ${lvl} · MAX`) : `${max > 1 ? `LV ${lvl} → ` : ''}${formatMoney(price)}`;
    }
    default: throw new Error(`unhandled: ${item satisfies never}`);
  }
}

const buyAction = (save: SaveData, item: ShopItem, label: string): ItemAction => {
  const price = priceOf(save, item) ?? 0;
  const check = canBuy(save, item);
  return {
    kind: 'buy', label: `${label} ${formatMoney(price)}`, enabled: check.ok,
    note: check.ok ? '' : check.reason === 'insufficient-funds' ? `Need ${formatMoney(price - save.money)} more` : '',
  };
};

export function itemAction(save: SaveData, item: ShopItem): ItemAction {
  switch (item.type) {
    case 'plane':
      if (!save.ownedPlanes.includes(item.id)) return buyAction(save, item, 'BUY');
      if (save.selectedPlane === item.id) return { kind: 'none', label: 'IN USE', enabled: false, note: '' };
      return { kind: 'select', label: 'FLY THIS JET', enabled: true, note: '' };
    case 'gun':
      if (save.gunLevel >= MAX_GUN_LEVEL) return { kind: 'none', label: 'MAXED', enabled: false, note: '' };
      return buyAction(save, item, `LV ${save.gunLevel + 1} ·`);
    case 'secondary':
      if (!save.ownedSecondaries.includes(item.id)) return buyAction(save, item, 'BUY');
      if (!secondaryAllowedOn(item.id, save.selectedPlane)) return { kind: 'none', label: 'F-14 ONLY', enabled: false, note: 'Switch to the F-14 to mount it' };
      return { kind: 'mount', label: 'MOUNT', enabled: true, note: '' };
    case 'equipment':
      if (priceOf(save, item) === null) return { kind: 'none', label: 'MAXED', enabled: false, note: '' };
      return buyAction(save, item, save.equipment[item.id] > 0 ? 'UPGRADE' : 'BUY');
    default: throw new Error(`unhandled: ${item satisfies never}`);
  }
}

/** Gun level line for the detail panel. */
export function gunSummary(level: number): string {
  const d = gunLevelDef(level);
  return `${d.pattern.length} barrel${d.pattern.length > 1 ? 's' : ''} · ${d.shotsPerSec} shots/s · ${d.damage} dmg`;
}
