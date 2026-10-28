import type { CampaignId } from './types';

// Deep arsenal (doc 43): uranium ammo for the gun and the Mk II / Mk III marks of every missile, rocket pod and bomb.

export interface AmmoLevelDef {
  level: number;
  price: number;
  /** Multiplies all gun damage: main gun, second gun, GAU-8 burst. */
  damageMul: number;
  /** Share of gun damage that ground and sea targets take (today 0.5). */
  groundFactor: number;
  campaign: CampaignId;
}

/** Uranium ammo levels 1–3; level 0 = ordinary rounds. */
export const AMMO_LEVELS: readonly AmmoLevelDef[] = Object.freeze([
  { level: 1, price: 18000, damageMul: 1.15, groundFactor: 0.65, campaign: 1 },
  { level: 2, price: 40000, damageMul: 1.3, groundFactor: 0.8, campaign: 1 },
  { level: 3, price: 120000, damageMul: 1.45, groundFactor: 1, campaign: 2 },
]);
export const MAX_AMMO_LEVEL = 3;
/** The gun's ground factor with ordinary rounds (doc 05). */
export const PLAIN_GROUND_FACTOR = 0.5;

export function ammoLevelDef(level: number): AmmoLevelDef | null {
  return AMMO_LEVELS[Math.min(MAX_AMMO_LEVEL, Math.floor(level)) - 1] ?? null;
}

export type Mark = 1 | 2 | 3;
export const MAX_MARK: Mark = 3;

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
});

export const toMark = (n: number): Mark => (n >= 3 ? 3 : n >= 2 ? 2 : 1);
