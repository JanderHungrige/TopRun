import type { GunLevelDef } from './weapons';

// The sub kit's tables (doc 66): the harpoon gun and the price factor of everything the SUB PEN sells. The sub weapons
// themselves are secondaries (data/weapons.ts, campaign 5).

/** Sub prices: what the jets pay for the same step × this; set by the map-5 balance (doc 65). */
export const SUB_PRICE = 10;

const deg = (d: number): number => (d * Math.PI) / 180;
const ONE = [{ dx: 0, angle: 0 }];
const TWO = [{ dx: -4, angle: 0 }, { dx: 4, angle: 0 }];
const THREE = [{ dx: 0, angle: 0 }, { dx: -6, angle: deg(-5) }, { dx: 6, angle: deg(5) }];
const FOUR = [{ dx: -4, angle: 0 }, { dx: 4, angle: 0 }, { dx: -8, angle: deg(-6) }, { dx: 8, angle: deg(6) }];

/** Harpoon gun, levels 1–10: steel bolts at the chain gun's rate and damage; prices are the jets' × SUB_PRICE. */
export const SUB_GUN_LEVELS: readonly GunLevelDef[] = Object.freeze([
  { level: 1, price: 0, shotsPerSec: 6, damage: 15, pattern: ONE },
  { level: 2, price: 2500 * SUB_PRICE, shotsPerSec: 7, damage: 16, pattern: ONE },
  { level: 3, price: 6000 * SUB_PRICE, shotsPerSec: 8, damage: 18, pattern: ONE },
  { level: 4, price: 14000 * SUB_PRICE, shotsPerSec: 9, damage: 19, pattern: TWO },
  { level: 5, price: 26000 * SUB_PRICE, shotsPerSec: 10, damage: 21, pattern: TWO },
  { level: 6, price: 45000 * SUB_PRICE, shotsPerSec: 11, damage: 23, pattern: TWO },
  { level: 7, price: 70000 * SUB_PRICE, shotsPerSec: 12, damage: 27, pattern: THREE },
  { level: 8, price: 110000 * SUB_PRICE, shotsPerSec: 13, damage: 30, pattern: THREE },
  { level: 9, price: 160000 * SUB_PRICE, shotsPerSec: 14, damage: 32, pattern: FOUR },
  { level: 10, price: 230000 * SUB_PRICE, shotsPerSec: 15, damage: 35, pattern: FOUR },
]);

export const MAX_SUB_GUN_LEVEL = 10;

export function subGunDef(level: number): GunLevelDef {
  const def = SUB_GUN_LEVELS[Math.max(1, Math.min(MAX_SUB_GUN_LEVEL, Math.floor(level))) - 1];
  if (!def) throw new Error(`missing harpoon gun level ${level}`);
  return def;
}
