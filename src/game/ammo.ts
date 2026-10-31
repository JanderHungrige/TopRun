import {
  BURN_SECONDS, incendiaryLevelDef, MAP1_AMMO_LEVEL, MAX_INCENDIARY_LEVEL, PLAIN_GROUND_FACTOR, type AmmoType,
} from '../data/arsenal';
import { gunAmmo } from './arsenal';
import { mapTwoOpen } from './progress';
import type { SaveData } from './save';

// Incendiary ammo (doc 45): the second ammo type, what is on sale, loading one type per sortie, the rounds the gun
// fires and how a burn plays out. Pure.

/** Top incendiary level on sale: 2 on map 1, 6 once map 2 is open. */
export const incendiaryCap = (save: SaveData): number => (mapTwoOpen(save) ? MAX_INCENDIARY_LEVEL : MAP1_AMMO_LEVEL);

/** Price of the next incendiary level, or null at the cap. */
export function incendiaryPrice(save: SaveData): number | null {
  if (save.incendiaryLevel >= incendiaryCap(save)) return null;
  return incendiaryLevelDef(save.incendiaryLevel + 1)?.price ?? null;
}

/** The level owned of an ammo type. */
export const ammoTypeLevel = (save: SaveData, type: AmmoType): number =>
  (type === 'uranium' ? save.ammoLevel : save.incendiaryLevel);

/** LOAD is offered for an owned type that is not loaded. */
export const canLoad = (save: SaveData, type: AmmoType): boolean => ammoTypeLevel(save, type) > 0 && save.ammoType !== type;

/** Returns a new save with `type` loaded. Throws if canLoad fails — call it first. */
export function loadAmmo(save: SaveData, type: AmmoType): SaveData {
  if (!canLoad(save, type)) throw new Error(`cannot load ${type}`);
  return { ...structuredClone(save), ammoType: type };
}

/** After buying a level of `type`: it is loaded when the loaded type has no level yet (doc 45). */
export function afterAmmoBought(save: SaveData, type: AmmoType): SaveData {
  return ammoTypeLevel(save, save.ammoType) > 0 ? save : { ...save, ammoType: type };
}

export interface Rounds {
  /** null = ordinary rounds. */
  type: AmmoType | null;
  damageMul: number;
  groundFactor: number;
  /** Share of each hit on a plane that burns on (incendiary only). */
  burn: number;
}

/**
 * The rounds the gun fires: the loaded type at its level, ordinary rounds without one. Incendiary's bonus counts
 * against planes only: its ground factor cancels the bonus, so ground targets take the plain half (doc 45).
 */
export function loadedRounds(save: SaveData): Rounds {
  const plain: Rounds = { type: null, damageMul: 1, groundFactor: PLAIN_GROUND_FACTOR, burn: 0 };
  if (save.ammoType === 'incendiary') {
    const def = incendiaryLevelDef(save.incendiaryLevel);
    return def ? { type: 'incendiary', damageMul: def.airMul, groundFactor: PLAIN_GROUND_FACTOR / def.airMul, burn: def.burn } : plain;
  }
  return save.ammoLevel > 0 ? { type: 'uranium', ...gunAmmo(save.ammoLevel), burn: 0 } : plain;
}

export interface Burn {
  /** Damage still to deal. */
  left: number;
  /** Seconds to deal it in. */
  t: number;
}

/** A hit adds to the burn and restarts its clock. */
export const ignite = (b: Burn, damage: number): Burn => ({ left: b.left + damage, t: BURN_SECONDS });

/** One step of a burn: the damage dealt now and the burn left, dealt evenly over the time left. */
export function burnStep(b: Burn, dt: number): { damage: number; burn: Burn } {
  if (b.t <= 0 || b.left <= 0) return { damage: 0, burn: { left: 0, t: 0 } };
  if (b.t - dt <= 1e-6) return { damage: b.left, burn: { left: 0, t: 0 } };
  const damage = (b.left * dt) / b.t;
  return { damage, burn: { left: b.left - damage, t: b.t - dt } };
}
