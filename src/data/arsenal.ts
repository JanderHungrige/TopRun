import type { CampaignId } from './types';

// Deep arsenal (doc 43): uranium and incendiary ammo for the gun (doc 45) and the marks Mk II–VI of every missile,
// rocket pod and bomb.

export interface AmmoLevelDef {
  level: number;
  price: number;
  /** Multiplies all gun damage: main gun, second gun, GAU-8 burst. */
  damageMul: number;
  /** Share of gun damage that ground and sea targets take (today 0.5). */
  groundFactor: number;
  campaign: CampaignId;
}

/** Uranium ammo levels 1–6 (4–6: wave 3); level 0 = ordinary rounds. */
export const AMMO_LEVELS: readonly AmmoLevelDef[] = Object.freeze([
  { level: 1, price: 18000, damageMul: 1.15, groundFactor: 0.65, campaign: 1 },
  { level: 2, price: 40000, damageMul: 1.3, groundFactor: 0.8, campaign: 1 },
  { level: 3, price: 120000, damageMul: 1.45, groundFactor: 1, campaign: 2 },
  { level: 4, price: 150000, damageMul: 1.6, groundFactor: 1, campaign: 2 },
  { level: 5, price: 185000, damageMul: 1.75, groundFactor: 1, campaign: 2 },
  { level: 6, price: 225000, damageMul: 1.9, groundFactor: 1, campaign: 2 },
]);
export const MAX_AMMO_LEVEL = 6;
/** Top level of either ammo type before map 2 opens. */
export const MAP1_AMMO_LEVEL = 2;

export interface IncendiaryLevelDef {
  level: number;
  price: number;
  /** Share of each hit on a plane that burns on over BURN_SECONDS (doc 45). */
  burn: number;
  campaign: CampaignId;
}

/** Incendiary ammo levels 1–6 (doc 45), priced like uranium. */
export const INCENDIARY_LEVELS: readonly IncendiaryLevelDef[] = Object.freeze([
  { level: 1, price: 18000, burn: 0.3, campaign: 1 },
  { level: 2, price: 40000, burn: 0.55, campaign: 1 },
  { level: 3, price: 120000, burn: 0.8, campaign: 2 },
  { level: 4, price: 150000, burn: 1, campaign: 2 },
  { level: 5, price: 185000, burn: 1.2, campaign: 2 },
  { level: 6, price: 225000, burn: 1.4, campaign: 2 },
]);
export const MAX_INCENDIARY_LEVEL = 6;
/** Seconds a burn takes to deal its damage; each new hit restarts it. */
export const BURN_SECONDS = 1.5;

export type AmmoType = 'uranium' | 'incendiary';
export const AMMO_TYPES: readonly AmmoType[] = Object.freeze(['uranium', 'incendiary'] as const);
/** The gun's ground factor with ordinary rounds (doc 05). */
export const PLAIN_GROUND_FACTOR = 0.5;

export function ammoLevelDef(level: number): AmmoLevelDef | null {
  return AMMO_LEVELS[Math.min(MAX_AMMO_LEVEL, Math.floor(level)) - 1] ?? null;
}

export function incendiaryLevelDef(level: number): IncendiaryLevelDef | null {
  return INCENDIARY_LEVELS[Math.min(MAX_INCENDIARY_LEVEL, Math.floor(level)) - 1] ?? null;
}

export type Mark = 1 | 2 | 3 | 4 | 5 | 6;
export const MAX_MARK: Mark = 6;
/** Top mark before map 2 opens. */
export const MAP1_MARK: Mark = 2;

export interface MarkDef {
  mark: Mark;
  damageMul: number;
  /** Extra ammo per hardpoint (volleys for the rocket pod). */
  ammoBonus: number;
  /** Homing turn rate and top speed multipliers. */
  turnMul: number;
  speedMul: number;
  /** Bomb blast radius multiplier. */
  radiusMul: number;
  /** Price as a multiple of the weapon's own price. */
  priceMul: number;
  /** Map on which the mark goes on sale (a map-2 weapon's marks need map 2 anyway). */
  campaign: CampaignId;
}

export const MARKS: Readonly<Record<Mark, MarkDef>> = Object.freeze({
  1: { mark: 1, damageMul: 1, ammoBonus: 0, turnMul: 1, speedMul: 1, radiusMul: 1, priceMul: 0, campaign: 1 },
  2: { mark: 2, damageMul: 1.25, ammoBonus: 1, turnMul: 1, speedMul: 1, radiusMul: 1, priceMul: 1.5, campaign: 1 },
  3: { mark: 3, damageMul: 1.5, ammoBonus: 2, turnMul: 1.2, speedMul: 1.1, radiusMul: 1.2, priceMul: 4, campaign: 2 },
  // Wave 3 (doc 43): Mk IV–VI on map 2.
  4: { mark: 4, damageMul: 1.75, ammoBonus: 3, turnMul: 1.3, speedMul: 1.15, radiusMul: 1.3, priceMul: 6, campaign: 2 },
  5: { mark: 5, damageMul: 2, ammoBonus: 4, turnMul: 1.4, speedMul: 1.2, radiusMul: 1.4, priceMul: 9, campaign: 2 },
  6: { mark: 6, damageMul: 2.25, ammoBonus: 5, turnMul: 1.5, speedMul: 1.25, radiusMul: 1.5, priceMul: 13, campaign: 2 },
});

const MARK_LIST: readonly Mark[] = [1, 2, 3, 4, 5, 6];
export const toMark = (n: number): Mark => MARK_LIST[Math.max(0, Math.min(MAX_MARK, Math.floor(n) || 1) - 1)] ?? 1;
