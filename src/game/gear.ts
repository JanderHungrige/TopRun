import { HELI_MODS, HELI_ROUNDS, MAX_HELI_LEVEL, modLevelPrice, ROUNDS_PRICES, type HeliMod, type HeliRounds } from '../data/heli-arms';
import { MAX_SUB_LEVEL, SUB_MODS, SUB_ROUNDS, SUB_ROUNDS_PRICES, subModLevelPrice, type SubMod, type SubRounds } from '../data/sub-arms';
import { MAX_TANK_LEVEL, TANK_MODS, TANK_ROUNDS, TANK_ROUNDS_PRICES, tankModLevelPrice, type TankMod, type TankRounds } from '../data/tank-arms';
import { mapOpen } from './progress';
import type { SaveData } from './save';

// The fleets' gun upgrades and ammo types in one layer (docs 99, 101, 108): every id belongs to one kit — the
// helicopters', the subs' or the tanks' — and is sold only in that kit's hangar once its map is open. Levels, prices,
// buying (through economy.ts) and loading one ammo type per sortie. Pure.

export type GearMod = HeliMod | SubMod | TankMod;
export type GearRounds = HeliRounds | SubRounds | TankRounds;
export type GearId = GearMod | GearRounds;
export type GearKit = 'heli' | 'sub' | 'tank';

export const GEAR_MODS: readonly GearMod[] = Object.freeze([...HELI_MODS, ...SUB_MODS, ...TANK_MODS]);
export const GEAR_ROUNDS: readonly GearRounds[] = Object.freeze([...HELI_ROUNDS, ...SUB_ROUNDS, ...TANK_ROUNDS]);

const has = (list: readonly string[], id: GearId): boolean => list.includes(id);
const isHeli = (id: GearId): id is HeliMod | HeliRounds => has(HELI_MODS, id) || has(HELI_ROUNDS, id);
const isTank = (id: GearId): id is TankMod | TankRounds => has(TANK_MODS, id) || has(TANK_ROUNDS, id);
const isSub = (id: GearId): id is SubMod | SubRounds => !isHeli(id) && !isTank(id);

export const gearKit = (id: GearId): GearKit => (isHeli(id) ? 'heli' : isTank(id) ? 'tank' : 'sub');

/** The map whose hangar sells a kit's gear. */
const MAP: Readonly<Record<GearKit, 3 | 4 | 7>> = { heli: 3, sub: 4, tank: 7 };

export function gearLevel(save: SaveData, id: GearId): number {
  if (isHeli(id)) return save.heliArms[id];
  if (isTank(id)) return save.tankArms[id];
  return isSub(id) ? save.subArms[id] : 0;
}

export function gearMax(id: GearId): number {
  if (isHeli(id)) return MAX_HELI_LEVEL[id];
  if (isTank(id)) return MAX_TANK_LEVEL[id];
  return isSub(id) ? MAX_SUB_LEVEL[id] : 0;
}

/** Sold in its kit's hangar once that kit's map is open. */
export const gearOnSale = (save: SaveData, id: GearId): boolean => save.kit === gearKit(id) && mapOpen(save, MAP[gearKit(id)]);

const isRounds = (id: GearId): id is GearRounds => (GEAR_ROUNDS as readonly GearId[]).includes(id);
const ROUND_PRICES: Readonly<Record<GearKit, readonly number[]>> = { heli: ROUNDS_PRICES, sub: SUB_ROUNDS_PRICES, tank: TANK_ROUNDS_PRICES };

/** Price of the next level, or null at the top. */
export function gearPrice(save: SaveData, id: GearId): number | null {
  const next = gearLevel(save, id) + 1;
  if (isRounds(id)) return ROUND_PRICES[gearKit(id)][next - 1] ?? null;
  if (isHeli(id)) return modLevelPrice(id, next) ?? null;
  if (isTank(id)) return tankModLevelPrice(id, next) ?? null;
  return isSub(id) ? subModLevelPrice(id, next) ?? null : null;
}

/** Returns a new save with the item's next level. Prices and checks are economy.ts's. */
export function withGearLevel(save: SaveData, id: GearId): SaveData {
  const level = Math.min(gearMax(id), gearLevel(save, id) + 1);
  if (isHeli(id)) return { ...save, heliArms: { ...save.heliArms, [id]: level } };
  if (isTank(id)) return { ...save, tankArms: { ...save.tankArms, [id]: level } };
  return { ...save, subArms: { ...save.subArms, [id]: level } };
}

/** The ammo type loaded in a kit. */
export function gearLoaded(save: SaveData, kit: GearKit): GearRounds {
  switch (kit) {
    case 'heli': return save.heliArms.loaded;
    case 'sub': return save.subArms.loaded;
    case 'tank': return save.tankArms.loaded;
    default: throw new Error(`unhandled: ${kit satisfies never}`);
  }
}

function withLoaded(save: SaveData, type: GearRounds): SaveData {
  if (isHeli(type)) return { ...save, heliArms: { ...save.heliArms, loaded: type } };
  if (isTank(type)) return { ...save, tankArms: { ...save.tankArms, loaded: type } };
  return isSub(type) ? { ...save, subArms: { ...save.subArms, loaded: type } } : save;
}

/** After buying a level of an ammo type: it is loaded when the loaded type has no level yet (doc 45's rule). */
export function afterGearRoundsBought(save: SaveData, type: GearRounds): SaveData {
  return gearLevel(save, gearLoaded(save, gearKit(type))) > 0 ? save : withLoaded(save, type);
}

/** LOAD is offered for an owned type that is not loaded. */
export const canLoadGear = (save: SaveData, type: GearRounds): boolean => gearLevel(save, type) > 0 && gearLoaded(save, gearKit(type)) !== type;

/** Returns a new save with `type` loaded. Throws if canLoadGear fails — call it first. */
export function loadGear(save: SaveData, type: GearRounds): SaveData {
  if (!canLoadGear(save, type)) throw new Error(`cannot load ${type}`);
  return withLoaded(structuredClone(save), type);
}
