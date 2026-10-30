import { ammoLevelDef, MAP1_AMMO_LEVEL, MAP1_MARK, MARKS, MAX_AMMO_LEVEL, MAX_MARK, PLAIN_GROUND_FACTOR, toMark, type Mark } from '../data/arsenal';
import type { SecondaryId } from '../data/types';
import { SECONDARIES, type SecondaryDef } from '../data/weapons';
import { weaponOnSale } from './firepower';
import { mapTwoOpen } from './progress';
import type { SaveData } from './save';

// Deep arsenal (doc 43): uranium ammo for the gun and the Mk II–VI marks of the secondaries — what is on sale,
// prices, buying, and the stats a mark gives. Pure.

/** Top uranium-ammo level on sale: 2 on map 1, 6 once map 2 is open. */
export const ammoCap = (save: SaveData): number => (mapTwoOpen(save) ? MAX_AMMO_LEVEL : MAP1_AMMO_LEVEL);

/** Price of the next uranium-ammo level, or null at the cap. */
export function ammoPrice(save: SaveData): number | null {
  if (save.ammoLevel >= ammoCap(save)) return null;
  return ammoLevelDef(save.ammoLevel + 1)?.price ?? null;
}

/** Gun damage multiplier and ground factor for an ammo level (0 = ordinary rounds). */
export function gunAmmo(level: number): { damageMul: number; groundFactor: number } {
  const def = ammoLevelDef(level);
  return def ? { damageMul: def.damageMul, groundFactor: def.groundFactor } : { damageMul: 1, groundFactor: PLAIN_GROUND_FACTOR };
}

export const markOf = (save: SaveData, id: SecondaryId): Mark => toMark(save.weaponLevels[id]);

/** Top mark on sale for a weapon: Mk II on map 1, Mk VI once map 2 is open. */
export const markCap = (save: SaveData): Mark => (mapTwoOpen(save) ? MAX_MARK : MAP1_MARK);

/** Price of a weapon's next mark, or null at the top. */
export function markPrice(save: SaveData, id: SecondaryId): number | null {
  const mark = markOf(save, id);
  if (mark >= markCap(save)) return null;
  return Math.round(SECONDARIES[id].price * MARKS[toMark(mark + 1)].priceMul);
}

export type MarkFailure = 'locked' | 'not-owned' | 'max-level' | 'insufficient-funds';

export function canBuyMark(save: SaveData, id: SecondaryId): { ok: true } | { ok: false; reason: MarkFailure } {
  if (!weaponOnSale(save, id)) return { ok: false, reason: 'locked' };
  if (!save.ownedSecondaries.includes(id)) return { ok: false, reason: 'not-owned' };
  const price = markPrice(save, id);
  if (price === null) return { ok: false, reason: mapTwoOpen(save) || markOf(save, id) >= MAX_MARK ? 'max-level' : 'locked' };
  if (save.money < price) return { ok: false, reason: 'insufficient-funds' };
  return { ok: true };
}

/** Returns a new save with the weapon's next mark. Throws if canBuyMark fails — call it first. */
export function buyMark(save: SaveData, id: SecondaryId): SaveData {
  const check = canBuyMark(save, id);
  if (!check.ok) throw new Error(`cannot buy mark: ${check.reason}`);
  const next = structuredClone(save);
  next.money -= markPrice(save, id) ?? 0;
  next.weaponLevels[id] = toMark(markOf(save, id) + 1);
  return next;
}

export interface WeaponStats {
  damage: number;
  ammoPerSlot: number;
  turnRate: number;
  speed: number;
  radius: number;
}

/** A secondary's numbers at a mark (damage rounded to whole points). */
export function weaponStats(def: SecondaryDef, mark: Mark): WeaponStats {
  const m = MARKS[mark];
  return {
    damage: Math.round(def.damage * m.damageMul),
    ammoPerSlot: def.ammoPerSlot + m.ammoBonus,
    turnRate: def.turnRate * m.turnMul,
    speed: def.speed * m.speedMul,
    radius: def.radius * m.radiusMul,
  };
}

/** Marks above Mk I summed over all weapons (kit score, doc 38). */
export const marksBought = (save: SaveData): number =>
  Object.values(save.weaponLevels).reduce((sum, level) => sum + Math.max(0, toMark(level) - 1), 0);
