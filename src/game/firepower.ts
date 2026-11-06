import { EQUIPMENT, map1EquipmentLevel, maxEquipmentLevel } from '../data/equipment';
import { HELI_PRICE, heliGunDef, MAX_HELI_GUN_LEVEL } from '../data/heli-kit';
import { PLANES } from '../data/planes';
import type { EquipmentId, PlaneId, SecondaryId } from '../data/types';
import {
  GUN2_PRICES, gunLevelDef, jetGunDef, MAP1_GUN_LEVEL, MAX_GUN2_LEVEL, MAX_GUN_LEVEL, SECONDARIES, TWIN_GUN_LEVEL, type GunLevelDef,
} from '../data/weapons';
import { mapOpen, mapTwoOpen } from './progress';
import type { SaveData } from './save';

// Map-2 firepower (doc 37): the second gun and twin pods of the new jets, gun levels 8–20 and equipment levels
// beyond the map-1 caps for the old ones, two heavy weapons — all on sale only once map 2 is open (docs 43, wave 3).

/** Top gun level on sale for this pilot: 7, or 20 once map 2 is open (doc 43); the chain gun's 10 (doc 49). */
export function gunCap(save: SaveData): number {
  if (save.kit === 'heli') return MAX_HELI_GUN_LEVEL;
  return mapTwoOpen(save) ? MAX_GUN_LEVEL : MAP1_GUN_LEVEL;
}

/** Price of a gun level in the kit on show: the jets' table or the chain gun's (doc 49). */
export const gunPrice = (save: SaveData, level: number): number =>
  (save.kit === 'heli' ? heliGunDef(level) : gunLevelDef(level)).price;

/** Top level of a piece of equipment on sale for this pilot; the helicopters stop at the map-1 caps (doc 49). */
export const equipmentCap = (save: SaveData, id: EquipmentId): number =>
  (mapTwoOpen(save) && save.kit === 'jet' ? maxEquipmentLevel(id) : map1EquipmentLevel(id));

/** Price of the next level of a piece of equipment, or null at the top; helicopters pay HELI_PRICE times. */
export function equipmentPrice(save: SaveData, id: EquipmentId): number | null {
  const lvl = save.equipment[id];
  const price = lvl >= equipmentCap(save, id) ? undefined : EQUIPMENT[id].prices[lvl];
  return price === undefined ? null : price * (save.kit === 'heli' ? HELI_PRICE : 1);
}

/** Map-1 weapons always, the AIM-120 and JDAM once map 2 is open — in the jets' hangar; the helicopter weapons in the
 *  helicopters' once map 3 is open (doc 49). */
export function weaponOnSale(save: SaveData, id: SecondaryId): boolean {
  const c = SECONDARIES[id].campaign;
  if ((c === 3) !== (save.kit === 'heli')) return false;
  return c === 1 || (c === 2 && mapTwoOpen(save)) || (c === 3 && mapOpen(save, 3));
}

/** The gun a plane fires at a level: a jet's (doc 43) or the chain gun (doc 49). */
export const gunDef = (plane: PlaneId, level: number): GunLevelDef =>
  (PLANES[plane].kind === 'heli' ? heliGunDef(level) : jetGunDef(level, doubleFirepower(plane)));

/** The A-10, F-35 and Tornado carry the second gun and twin pods. */
export const doubleFirepower = (plane: PlaneId): boolean => PLANES[plane].campaign === 2;

/** A jet's main gun level: the new jets stop at 14 (they have the second gun as well, doc 43). */
export const jetGunLevel = (plane: PlaneId, gunLevel: number): number =>
  (doubleFirepower(plane) ? Math.min(TWIN_GUN_LEVEL, gunLevel) : gunLevel);

/** Highest level a power-up lifts the main gun to: the top of the table, 14 for a new jet's main gun (doc 43). */
export function powerCap(plane: PlaneId): number {
  if (PLANES[plane].kind === 'heli') return MAX_HELI_GUN_LEVEL;
  return doubleFirepower(plane) ? TWIN_GUN_LEVEL : MAX_GUN_LEVEL;
}

/** Price of the second gun's next level, or null when it is at the top. */
export const gun2Price = (level: number): number | null => (level >= MAX_GUN2_LEVEL ? null : GUN2_PRICES[level] ?? null);

export type TwinFailure = 'locked' | 'not-owned' | 'already-owned' | 'insufficient-funds';

/** Twin pods: the same weapon bought a second time (same price again). */
export function canBuyTwin(save: SaveData, id: SecondaryId): { ok: true } | { ok: false; reason: TwinFailure } {
  if (!mapTwoOpen(save) || save.kit === 'heli') return { ok: false, reason: 'locked' };
  if (!save.ownedSecondaries.includes(id)) return { ok: false, reason: 'not-owned' };
  if (save.twinSecondaries.includes(id)) return { ok: false, reason: 'already-owned' };
  if (save.money < SECONDARIES[id].price) return { ok: false, reason: 'insufficient-funds' };
  return { ok: true };
}

/** Returns a new save with twin pods for `id`. Throws if canBuyTwin fails — call it first. */
export function buyTwin(save: SaveData, id: SecondaryId): SaveData {
  const check = canBuyTwin(save, id);
  if (!check.ok) throw new Error(`cannot buy twin pods: ${check.reason}`);
  return { ...structuredClone(save), money: save.money - SECONDARIES[id].price, twinSecondaries: [...save.twinSecondaries, id] };
}
