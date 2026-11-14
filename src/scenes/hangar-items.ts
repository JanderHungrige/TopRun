import { PLANES } from '../data/planes';
import { EQUIPMENT_IDS, PLANE_IDS, SECONDARY_IDS } from '../data/types';
import { FLEET, isFleet, type FleetKitId } from '../data/fleet';
import { jetGunDef, MAX_GUN2_LEVEL, SECONDARIES, secondaryAllowedOn } from '../data/weapons';
import { MAX_MARK, toMark, type AmmoType } from '../data/arsenal';
import { ammoTypeLevel, canLoad, loadAmmo } from '../game/ammo';
import { canBuyMark, markCap, markOf, markPrice, weaponStats, type WeaponStats } from '../game/arsenal';
import { canBuy, priceOf, type ShopItem } from '../game/economy';
import { canBuyTwin, equipmentCap, gunCap, weaponOnSale } from '../game/firepower';
import { jetOnSale } from '../game/jets';
import { labKit } from '../game/kit';
import { wallet } from '../game/outpost';
import { mapTwoOpen } from '../game/progress';
import { isLiveryUnlocked } from '../game/liveries';
import type { SaveData } from '../game/save';
import {
  equipmentDescription, equipmentName, liveryName, planeDescription, secondaryDescription, secondaryName,
} from '../i18n/content';
import { t } from '../i18n/i18n';
import type { UiKey } from '../i18n/ui-en';
import { bayShort, buyKey, labWeapons, mechCraft, priceText } from './hangar-mech';
import { gearDescription, gearItems, gearLevelOf, gearLoadAction, gearName, gearStatus } from './hangar-gear';
import { canLoadGear, loadGear } from '../game/gear';
import { paintTab, unlockText } from './hangar-paint';

export interface Tab {
  name: UiKey;
  items: readonly ShopItem[];
}

/** A fleet kit's words in its hangar (docs 49, 66). */
export const FLEET_UI: Readonly<Record<FleetKitId, {
  title: UiKey; tab: UiKey; gunName: UiKey; gunDesc: UiKey; flyThis: UiKey; markInfo: UiKey;
}>> = {
  heli: {
    title: 'hangar.title', tab: 'hangar.tabHelis', gunName: 'hangar.heliGunName', gunDesc: 'hangar.heliGunDesc',
    flyThis: 'hangar.flyThisHeli', markInfo: 'arsenal.markInfoHeli',
  },
  sub: {
    title: 'hangar.titleSubs', tab: 'hangar.tabSubs', gunName: 'hangar.subGunName', gunDesc: 'hangar.subGunDesc',
    flyThis: 'hangar.flyThisSub', markInfo: 'arsenal.markInfoSub',
  },
  mech: {
    title: 'hangar.titleMechs', tab: 'hangar.tabMechs', gunName: 'hangar.mechGunName', gunDesc: 'hangar.mechGunDesc',
    flyThis: 'hangar.flyThisMech', markInfo: 'arsenal.markInfoMech',
  },
  tank: {
    title: 'hangar.titleTanks', tab: 'hangar.tabTanks', gunName: 'hangar.tankGunName', gunDesc: 'hangar.tankGunDesc',
    flyThis: 'hangar.flyThisTank', markInfo: 'arsenal.markInfoTank',
  },
};

/** A fleet kit's hangar (docs 49, 66): its craft, its gun and weapons, equipment, and — but for the mechs — their paint
 *  jobs (docs 100, 112). The mech bay lists every mech and every mech weapon, the ones it can't build yet too (doc 79). */
function fleetTabs(save: SaveData, fleet: FleetKitId): readonly Tab[] {
  const mech = fleet === 'mech';
  const craft = mech ? mechCraft() : PLANE_IDS.filter((id) => jetOnSale(save, id));
  const weapons = labKit(fleet) ? labWeapons(FLEET[fleet].campaign) : SECONDARY_IDS.filter((id) => weaponOnSale(save, id));
  return [
    { name: FLEET_UI[fleet].tab, items: craft.map((id) => ({ type: 'plane', id })) },
    { name: 'hangar.tabWeapons', items: [{ type: 'gun', fleet }, ...gearItems(save), ...weapons.map((id) => ({ type: 'secondary' as const, id }))] },
    { name: 'hangar.tabEquipment', items: EQUIPMENT_IDS.map((id) => ({ type: 'equipment', id })) },
    ...(mech ? [] : [paintTab(save)]), // the mechs are painted by hand (doc 87)
  ];
}

/** The shop's tabs; the JETS tab lists the map-2 jets only once map 2 is open (doc 36); maps 3 and 5 show their fleets. */
export const tabs = (save: SaveData): readonly Tab[] => (isFleet(save.kit) ? fleetTabs(save, save.kit) : [
  { name: 'hangar.tabJets', items: PLANE_IDS.filter((id) => jetOnSale(save, id)).map((id) => ({ type: 'plane', id })) },
  {
    name: 'hangar.tabWeapons',
    items: [
      { type: 'gun' }, { type: 'ammo' }, { type: 'incendiary' },
      ...(mapTwoOpen(save) ? [{ type: 'gun2' as const }, { type: 'he' as const }] : []),
      ...SECONDARY_IDS.filter((id) => weaponOnSale(save, id)).map((id) => ({ type: 'secondary' as const, id })),
    ],
  },
  { name: 'hangar.tabEquipment', items: EQUIPMENT_IDS.map((id) => ({ type: 'equipment', id })) },
  paintTab(save),
]);

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
    case 'gun': return t(item.fleet ? FLEET_UI[item.fleet].gunName : 'hangar.gunName');
    case 'gun2': return t('hangar.gun2Name');
    case 'ammo': return t('arsenal.ammoName');
    case 'incendiary': return t('arsenal.incName');
    case 'he': return t('arsenal.heName');
    case 'secondary': return secondaryName(item.id);
    case 'mod': case 'rounds': return gearName(item);
    case 'equipment': return equipmentName(item.id);
    case 'livery': return liveryName(item.id);
    default: throw new Error(`unhandled: ${item satisfies never}`);
  }
}

export function itemDescription(item: ShopItem): string {
  switch (item.type) {
    case 'plane': return planeDescription(item.id);
    case 'gun': return t(item.fleet ? FLEET_UI[item.fleet].gunDesc : 'hangar.gunDesc');
    case 'gun2': return t('hangar.gun2Desc');
    case 'ammo': return t('arsenal.ammoDesc');
    case 'incendiary': return t('arsenal.incDesc');
    case 'he': return t('arsenal.heDesc');
    case 'secondary': return secondaryDescription(item.id);
    case 'mod': case 'rounds': return gearDescription(item);
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
      if (save.ownedPlanes.includes(item.id)) return t('hangar.owned');
      return bayShort(save, item.id) ? t('mechbay.bayLevel', { level: bayShort(save, item.id) ?? 0 }) : priceText(save, PLANES[item.id].price);
    case 'gun':
      return save.gunLevel >= gunCap(save) ? t('hangar.maxLevel', { level: save.gunLevel }) : t('hangar.levelPrice', { level: save.gunLevel, price: priceText(save, price ?? 0) });
    case 'gun2':
      if (save.gun2Level >= MAX_GUN2_LEVEL) return t('hangar.maxLevel', { level: MAX_GUN2_LEVEL });
      return save.gun2Level === 0 ? priceText(save, price ?? 0) : t('hangar.levelPrice', { level: save.gun2Level, price: priceText(save, price ?? 0) });
    case 'ammo': return ammoStatus(save, 'uranium', price);
    case 'incendiary': return ammoStatus(save, 'incendiary', price);
    case 'he':
      if (price === null) return t('hangar.maxLevel', { level: save.heLevel });
      return save.heLevel === 0 ? priceText(save, price) : t('hangar.levelPrice', { level: save.heLevel, price: priceText(save, price) });
    case 'secondary': {
      const mounted = save.loadout[save.selectedPlane].filter((x) => x === item.id).length;
      const mark = markOf(save, item.id) > 1 ? `${markName(markOf(save, item.id))} · ` : '';
      if (save.ownedSecondaries.includes(item.id)) return mark + (mounted ? t('hangar.mounted', { n: mounted }) : t('hangar.owned'));
      return labKit(save.kit) ? t('mechbay.lab') : priceText(save, price ?? 0);
    }
    case 'mod': case 'rounds': return gearStatus(save, item, price);
    case 'equipment': {
      const lvl = save.equipment[item.id];
      const max = equipmentCap(save, item.id);
      if (price === null) return max === 1 ? t('hangar.installed') : t('hangar.maxLevel', { level: lvl });
      return max > 1 ? t('hangar.levelPrice', { level: lvl, price: priceText(save, price) }) : priceText(save, price);
    }
    case 'livery':
      if (save.livery[save.selectedPlane] === item.id) return t('hangar.inUse');
      return t(isLiveryUnlocked(save.progress, item.id) ? 'hangar.paintReady' : 'hangar.locked');
    default: throw new Error(`unhandled: ${item satisfies never}`);
  }
}

/** An ammo type's status: LOADED first when it is the loaded one (doc 45). */
function ammoStatus(save: SaveData, type: AmmoType, price: number | null): string {
  const level = ammoTypeLevel(save, type);
  const loaded = level > 0 && save.ammoType === type ? `${t('arsenal.loaded')} · ` : '';
  if (price === null) return loaded + t('hangar.maxLevel', { level });
  return loaded + (level === 0 ? priceText(save, price) : t('hangar.levelPrice', { level, price: priceText(save, price) }));
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
  const short = Math.max(0, price - wallet(save));
  const funds = !check.ok && check.reason === 'insufficient-funds';
  return {
    kind: 'buy', label, enabled: check.ok, shortfall: short, reason: funds ? 'funds' : null,
    note: funds ? t('hangar.needMore', { amount: priceText(save, short) }) : '',
  };
}

export function itemAction(save: SaveData, item: ShopItem): ItemAction {
  const price = priceText(save, priceOf(save, item) ?? 0);
  switch (item.type) {
    case 'plane':
      if (bayShort(save, item.id)) return none(t('mechbay.bayLevel', { level: bayShort(save, item.id) ?? 0 }), t('mechbay.bayNote'));
      if (!save.ownedPlanes.includes(item.id)) return buyAction(save, item, t(buyKey(save), { price }));
      if (save.selectedPlane === item.id) return none(t('hangar.inUse'));
      return { kind: 'select', label: t(isFleet(save.kit) ? FLEET_UI[save.kit].flyThis : 'hangar.flyThis'), enabled: true, note: '', reason: null, shortfall: 0 };
    case 'gun':
      if (save.gunLevel >= gunCap(save)) return none(t('hangar.maxed'));
      return buyAction(save, item, t('hangar.gunUpgrade', { level: save.gunLevel + 1, price }));
    case 'gun2':
      if (priceOf(save, item) === null) return none(t('hangar.maxed'));
      return buyAction(save, item, save.gun2Level === 0 ? t('hangar.buy', { price }) : t('hangar.gunUpgrade', { level: save.gun2Level + 1, price }));
    case 'ammo':
    case 'incendiary':
    case 'he': {
      if (priceOf(save, item) === null) return none(t('hangar.maxed'));
      const level = item.type === 'he' ? save.heLevel : ammoTypeLevel(save, item.type === 'ammo' ? 'uranium' : 'incendiary');
      return buyAction(save, item, t('hangar.gunUpgrade', { level: level + 1, price }));
    }
    case 'mod': case 'rounds':
      if (priceOf(save, item) === null) return none(t('hangar.maxed'));
      return buyAction(save, item, gearLevelOf(save, item) === 0 ? t('hangar.buy', { price }) : t('hangar.gunUpgrade', { level: gearLevelOf(save, item) + 1, price }));
    case 'secondary':
      if (!save.ownedSecondaries.includes(item.id) && labKit(save.kit)) return none(t('mechbay.lab'), t(save.kit === 'tank' ? 'motorpool.labNote' : 'mechbay.labNote'));
      if (!save.ownedSecondaries.includes(item.id)) return buyAction(save, item, t('hangar.buy', { price }));
      if (!secondaryAllowedOn(item.id, save.selectedPlane)) return none(t('hangar.f14Only'), t('hangar.f14OnlyNote'), 'restricted');
      return { kind: 'mount', label: t('hangar.mount'), enabled: true, note: '', reason: null, shortfall: 0 };
    case 'equipment':
      if (priceOf(save, item) === null) return none(t('hangar.maxed'));
      return buyAction(save, item, t(save.equipment[item.id] > 0 ? 'hangar.upgrade' : buyKey(save), { price }));
    case 'livery':
      if (!isLiveryUnlocked(save.progress, item.id)) return none(t('hangar.locked'), unlockText(item.id));
      if (save.livery[save.selectedPlane] === item.id) return none(t('hangar.inUse'));
      return { kind: 'paint', label: t('hangar.applyPaint'), enabled: true, note: '', reason: null, shortfall: 0 };
    default: throw new Error(`unhandled: ${item satisfies never}`);
  }
}

/** The ammo type an item sells, null for anything else (doc 45). */
export const ammoTypeOf = (item: ShopItem): AmmoType | null =>
  (item.type === 'ammo' ? 'uranium' : item.type === 'incendiary' ? 'incendiary' : null);

/** Key E on an ammo item: the save with it loaded, null when it can't be; undefined for anything else (docs 45, 99). */
export function loadFocused(save: SaveData, item: ShopItem): SaveData | null | undefined {
  if (item.type === 'rounds') return canLoadGear(save, item.id) ? loadGear(save, item.id) : null;
  const ammo = ammoTypeOf(item);
  return ammo ? (canLoad(save, ammo) ? loadAmmo(save, ammo) : null) : undefined;
}

/**
 * The side button (key E): TWIN PODS of an owned weapon once map 2 is open (doc 37), LOAD of an owned ammo type
 * (doc 45); null = no button.
 */
export function twinAction(save: SaveData, item: ShopItem): { label: string; enabled: boolean } | null {
  if (item.type === 'plane' && save.kit === 'mech') return save.ownedPlanes.includes(item.id) ? { label: t('paint.button'), enabled: true } : null; // doc 87
  if (item.type === 'rounds') return gearLoadAction(save, item.id);
  const ammo = ammoTypeOf(item);
  if (ammo) {
    if (ammoTypeLevel(save, ammo) === 0) return null;
    return canLoad(save, ammo) ? { label: t('arsenal.load'), enabled: true } : { label: t('arsenal.loaded'), enabled: false };
  }
  if (item.type !== 'secondary' || !mapTwoOpen(save) || save.kit !== 'jet' || !save.ownedSecondaries.includes(item.id)) return null;
  if (save.twinSecondaries.includes(item.id)) return { label: t('hangar.twinOwned'), enabled: false };
  return { label: t('hangar.buyTwin', { price: priceText(save, SECONDARIES[item.id].price) }), enabled: canBuyTwin(save, item.id).ok };
}

const ROMAN: readonly string[] = ['I', 'II', 'III', 'IV', 'V', 'VI'];

/** "Mk II" … "Mk VI". */
export const markName = (mark: number): string => t('arsenal.mark', { n: ROMAN[mark - 1] ?? String(mark) });

/** The UPGRADE button of an owned weapon (doc 43); null = not owned. */
export function markAction(save: SaveData, item: ShopItem): { label: string; enabled: boolean } | null {
  if (item.type !== 'secondary' || !save.ownedSecondaries.includes(item.id)) return null;
  const mark = markOf(save, item.id);
  if (labKit(save.kit)) return { label: mark < 3 ? t('mechbay.markLab') : t('arsenal.markTop', { mark: markName(mark) }), enabled: false };
  const price = markPrice(save, item.id);
  if (price !== null) return { label: t('arsenal.upgradeMark', { mark: markName(mark + 1), price: priceText(save, price) }), enabled: canBuyMark(save, item.id).ok };
  return { label: mark < MAX_MARK ? t('arsenal.markLater') : t('arsenal.markTop', { mark: markName(mark) }), enabled: false };
}

/** A secondary's numbers at its current mark, and at the next one on sale (null at the top). */
export function weaponNowNext(save: SaveData, id: (typeof SECONDARY_IDS)[number]): { now: WeaponStats; next: WeaponStats | null } {
  const mark = markOf(save, id);
  return { now: weaponStats(SECONDARIES[id], mark), next: mark < markCap(save) ? weaponStats(SECONDARIES[id], toMark(mark + 1)) : null };
}

/** Gun level line for the detail panel; `twin`: a new jet's gun (own numbers above level 7, doc 43); `fleet`: a fleet
 *  kit's gun (docs 49, 66). */
export function gunSummary(level: number, twin = false, fleet?: FleetKitId): string {
  const d = fleet ? FLEET[fleet].gunDef(level) : jetGunDef(level, twin);
  return t('hangar.gunSummary', { barrels: d.pattern.length, rate: d.shotsPerSec, damage: d.damage });
}

export function secondaryTargets(id: (typeof SECONDARY_IDS)[number]): string {
  const { hits, campaign } = SECONDARIES[id];
  if (campaign === 4) return t(hits === 'ground' ? 'hangar.targetsSeabed' : 'hangar.targetsWater'); // under the sea (docs 66, 74)
  return t(hits === 'any' ? 'hangar.targetsAny' : hits === 'air' ? 'hangar.targetsAir' : 'hangar.targetsGround');
}
