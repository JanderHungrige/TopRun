import { HELI_MODS, HELI_ROUNDS, MAX_HELI_LEVEL, modLevelPrice, ROUNDS_PRICES, type HeliMod, type HeliRounds } from '../data/heli-arms';
import { MAX_SUB_LEVEL, SUB_MODS, SUB_ROUNDS, SUB_ROUNDS_PRICES, subModLevelPrice, type SubMod, type SubRounds } from '../data/sub-arms';
import { mapOpen } from './progress';
import type { SaveData } from './save';

// The fleets' gun upgrades and ammo types in one layer (docs 99, 101): every id belongs to one kit — the helicopters'
// or the subs' — and is sold only in that kit's hangar once its map is open. Levels, prices, buying (through
// economy.ts) and loading one ammo type per sortie. Pure.

export type GearMod = HeliMod | SubMod;
export type GearRounds = HeliRounds | SubRounds;
export type GearId = GearMod | GearRounds;
export type GearKit = 'heli' | 'sub';

export const GEAR_MODS: readonly GearMod[] = Object.freeze([...HELI_MODS, ...SUB_MODS]);
export const GEAR_ROUNDS: readonly GearRounds[] = Object.freeze([...HELI_ROUNDS, ...SUB_ROUNDS]);

const isHeli = (id: GearId): id is HeliMod | HeliRounds => (HELI_MODS as readonly GearId[]).includes(id) || (HELI_ROUNDS as readonly GearId[]).includes(id);

export const gearKit = (id: GearId): GearKit => (isHeli(id) ? 'heli' : 'sub');

/** The map whose hangar sells a kit's gear. */
const MAP: Readonly<Record<GearKit, 3 | 4>> = { heli: 3, sub: 4 };

export const gearLevel = (save: SaveData, id: GearId): number => (isHeli(id) ? save.heliArms[id] : save.subArms[id]);

export const gearMax = (id: GearId): number => (isHeli(id) ? MAX_HELI_LEVEL[id] : MAX_SUB_LEVEL[id]);

/** Sold in its kit's hangar once that kit's map is open. */
export const gearOnSale = (save: SaveData, id: GearId): boolean => save.kit === gearKit(id) && mapOpen(save, MAP[gearKit(id)]);

const isRounds = (id: GearId): id is GearRounds => (GEAR_ROUNDS as readonly GearId[]).includes(id);

/** Price of the next level, or null at the top. */
export function gearPrice(save: SaveData, id: GearId): number | null {
  const next = gearLevel(save, id) + 1;
  if (isRounds(id)) return (isHeli(id) ? ROUNDS_PRICES : SUB_ROUNDS_PRICES)[next - 1] ?? null;
  return (isHeli(id) ? modLevelPrice(id, next) : subModLevelPrice(id, next)) ?? null;
}

/** Returns a new save with the item's next level. Prices and checks are economy.ts's. */
export function withGearLevel(save: SaveData, id: GearId): SaveData {
  const level = Math.min(gearMax(id), gearLevel(save, id) + 1);
  return isHeli(id) ? { ...save, heliArms: { ...save.heliArms, [id]: level } } : { ...save, subArms: { ...save.subArms, [id]: level } };
}

/** The ammo type loaded in a kit. */
export const gearLoaded = (save: SaveData, kit: GearKit): GearRounds => (kit === 'heli' ? save.heliArms.loaded : save.subArms.loaded);

function withLoaded(save: SaveData, type: GearRounds): SaveData {
  if (isHeli(type)) return { ...save, heliArms: { ...save.heliArms, loaded: type } };
  return { ...save, subArms: { ...save.subArms, loaded: type } };
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
