import { EQUIPMENT, maxEquipmentLevel } from '../data/equipment';
import { LIVERIES, type LiveryId } from '../data/liveries';
import { PLANES } from '../data/planes';
import type { EquipmentId, GunLevel, MissionDef, MissionResult, PlaneId, SecondaryId, TakeoffRating } from '../data/types';
import { gunLevelDef, SECONDARIES, secondaryAllowedOn } from '../data/weapons';
import { equipmentCap, gun2Price, gunCap, weaponOnSale } from './firepower';
import { jetOnSale } from './jets';
import { mapTwoOpen } from './progress';
import type { SaveData } from './save';
import { recordMission } from './service-record';

export type ShopItem =
  | { type: 'plane'; id: PlaneId }
  | { type: 'gun' }
  /** Second gun of the new jets (doc 37). */
  | { type: 'gun2' }
  | { type: 'secondary'; id: SecondaryId }
  | { type: 'equipment'; id: EquipmentId }
  /** Paint jobs are unlocked by the campaign, never bought (doc 09). */
  | { type: 'livery'; id: LiveryId };

/** `locked`: a map-2 jet before map 2 is open (doc 36). */
export type BuyFailure = 'insufficient-funds' | 'already-owned' | 'max-level' | 'unknown-item' | 'locked';
export type MountFailure = 'not-owned' | 'bad-slot' | 'restricted-plane' | 'plane-not-owned';

export type Check<F> = { ok: true } | { ok: false; reason: F };

/** Price of the next purchase for an item, or null when it cannot be bought any more. */
export function priceOf(save: SaveData, item: ShopItem): number | null {
  switch (item.type) {
    case 'plane': return save.ownedPlanes.includes(item.id) ? null : PLANES[item.id].price;
    case 'gun': return save.gunLevel >= gunCap(save) ? null : gunLevelDef(save.gunLevel + 1).price;
    case 'gun2': return gun2Price(save.gun2Level);
    case 'secondary': return save.ownedSecondaries.includes(item.id) ? null : SECONDARIES[item.id].price;
    case 'equipment': return save.equipment[item.id] >= equipmentCap(save, item.id) ? null : EQUIPMENT[item.id].prices[save.equipment[item.id]] ?? null;
    case 'livery': return null;
    default: throw new Error(`unhandled: ${item satisfies never}`);
  }
}

function knownItem(item: ShopItem): boolean {
  switch (item.type) {
    case 'plane': return item.id in PLANES;
    case 'gun':
    case 'gun2': return true;
    case 'secondary': return item.id in SECONDARIES;
    case 'equipment': return item.id in EQUIPMENT;
    case 'livery': return item.id in LIVERIES;
    default: throw new Error(`unhandled: ${item satisfies never}`);
  }
}

/** Map-2 goods (docs 36, 37) cannot be bought before map 2 is open. */
function onSale(save: SaveData, item: ShopItem): boolean {
  switch (item.type) {
    case 'plane': return jetOnSale(save, item.id);
    case 'gun2': return mapTwoOpen(save);
    case 'secondary': return weaponOnSale(save, item.id);
    case 'gun':
    case 'equipment':
    case 'livery': return true;
    default: throw new Error(`unhandled: ${item satisfies never}`);
  }
}

export function canBuy(save: SaveData, item: ShopItem): Check<BuyFailure> {
  if (!knownItem(item)) return { ok: false, reason: 'unknown-item' };
  if (!onSale(save, item)) return { ok: false, reason: 'locked' };
  const price = priceOf(save, item);
  if (price === null) {
    const owned = item.type === 'plane' || item.type === 'secondary';
    return { ok: false, reason: owned ? 'already-owned' : 'max-level' };
  }
  if (save.money < price) return { ok: false, reason: 'insufficient-funds' };
  return { ok: true };
}

/** Returns a new save with the item bought. Throws if canBuy fails — call canBuy first. */
export function buy(save: SaveData, item: ShopItem): SaveData {
  const check = canBuy(save, item);
  if (!check.ok) throw new Error(`cannot buy: ${check.reason}`);
  const price = priceOf(save, item) ?? 0;
  const next: SaveData = structuredClone(save);
  next.money -= price;
  switch (item.type) {
    case 'plane': next.ownedPlanes.push(item.id); break;
    case 'gun': next.gunLevel = (save.gunLevel + 1) as GunLevel; break;
    case 'gun2': next.gun2Level = save.gun2Level + 1; break;
    case 'secondary': next.ownedSecondaries.push(item.id); break;
    case 'equipment': next.equipment[item.id] = Math.min(maxEquipmentLevel(item.id), save.equipment[item.id] + 1); break;
    case 'livery': break;
    default: throw new Error(`unhandled: ${item satisfies never}`);
  }
  return next;
}

export function canMount(save: SaveData, plane: PlaneId, id: SecondaryId, slot: number): Check<MountFailure> {
  if (!save.ownedPlanes.includes(plane)) return { ok: false, reason: 'plane-not-owned' };
  if (!save.ownedSecondaries.includes(id)) return { ok: false, reason: 'not-owned' };
  if (!Number.isInteger(slot) || slot < 0 || slot >= PLANES[plane].hardpoints) return { ok: false, reason: 'bad-slot' };
  if (!secondaryAllowedOn(id, plane)) return { ok: false, reason: 'restricted-plane' };
  return { ok: true };
}

export function mount(save: SaveData, plane: PlaneId, id: SecondaryId, slot: number): SaveData {
  const check = canMount(save, plane, id, slot);
  if (!check.ok) throw new Error(`cannot mount: ${check.reason}`);
  const next: SaveData = structuredClone(save);
  next.loadout[plane][slot] = id;
  return next;
}

export function unmount(save: SaveData, plane: PlaneId, slot: number): SaveData {
  const next: SaveData = structuredClone(save);
  if (slot >= 0 && slot < next.loadout[plane].length) next.loadout[plane][slot] = null;
  return next;
}

export function selectPlane(save: SaveData, plane: PlaneId): SaveData {
  if (!save.ownedPlanes.includes(plane)) return save;
  return { ...structuredClone(save), selectedPlane: plane };
}

export interface Payout {
  base: number;
  takeoffBonus: number;
  hullBonus: number;
  collected: number;
  salvage: number;
  total: number;
}

const TAKEOFF_BONUS: Readonly<Record<TakeoffRating, number>> = { perfect: 0.15, good: 0.05, early: 0, late: 0, skipped: 0 };
export const HULL_BONUS_RATIO = 0.7;
export const KILL_STAR_RATIO = 0.8;

export function computePayout(mission: MissionDef, result: MissionResult, firstClear: boolean): Payout {
  if (!result.success) {
    const salvage = Math.floor(result.collected * 0.5);
    return { base: 0, takeoffBonus: 0, hullBonus: 0, collected: 0, salvage, total: salvage };
  }
  const base = Math.round(mission.reward * (firstClear ? 1 : 0.5));
  const takeoffBonus = Math.round(base * TAKEOFF_BONUS[result.takeoff]);
  const hullBonus = result.hullRatio >= HULL_BONUS_RATIO ? Math.round(base * 0.1) : 0;
  const collected = Math.round(result.collected);
  return { base, takeoffBonus, hullBonus, collected, salvage: 0, total: base + takeoffBonus + hullBonus + collected };
}

export function computeStars(result: MissionResult): number {
  if (!result.success) return 0;
  const killRatio = result.spawned > 0 ? result.kills / result.spawned : 1;
  return 1 + (result.hullRatio >= HULL_BONUS_RATIO ? 1 : 0) + (killRatio >= KILL_STAR_RATIO ? 1 : 0);
}

/** Applies a finished mission to the save: money and best stars. */
/** Pays out, records the sortie (doc 24) and stores the best run's photo data when `now` is given. */
export function applyResult(save: SaveData, mission: MissionDef, result: MissionResult, now?: number): { save: SaveData; payout: Payout; stars: number } {
  const firstClear = !(mission.id in save.progress);
  const payout = computePayout(mission, result, firstClear);
  const stars = computeStars(result);
  const next: SaveData = structuredClone(save);
  next.money += payout.total;
  next.record = recordMission(save.record, result, save.selectedPlane);
  if (result.success) {
    const prev = save.progress[mission.id];
    const better = !prev || stars >= prev.stars;
    next.progress[mission.id] = better && now !== undefined
      ? { stars: Math.max(stars, prev?.stars ?? 0), at: now, plane: save.selectedPlane, livery: save.livery[save.selectedPlane] }
      : { ...(prev ?? {}), stars: Math.max(stars, prev?.stars ?? 0) };
  }
  return { save: next, payout, stars };
}
