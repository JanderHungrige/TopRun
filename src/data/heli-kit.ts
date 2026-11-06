import type { GunLevelDef } from './weapons';

// The helicopter kit's tables (doc 49): the M230 chain gun and the price factor of everything the helicopter
// hangar sells. The helicopter weapons themselves are secondaries (data/weapons.ts, campaign 3).

/** Helicopter prices: what the jets pay for the same step × this; set by the map-3 balance (doc 48). */
export const HELI_PRICE = 6;

const deg = (d: number): number => (d * Math.PI) / 180;
const ONE = [{ dx: 0, angle: 0 }];
const TWO = [{ dx: -4, angle: 0 }, { dx: 4, angle: 0 }];
const THREE = [{ dx: 0, angle: 0 }, { dx: -6, angle: deg(-5) }, { dx: 6, angle: deg(5) }];
const FOUR = [{ dx: -4, angle: 0 }, { dx: 4, angle: 0 }, { dx: -8, angle: deg(-6) }, { dx: 8, angle: deg(6) }];

/** M230 30 mm chain gun, levels 1–10: fewer, heavier rounds than a jet's gun; prices are the jets' × HELI_PRICE. */
export const HELI_GUN_LEVELS: readonly GunLevelDef[] = Object.freeze([
  { level: 1, price: 0, shotsPerSec: 6, damage: 15, pattern: ONE },
  { level: 2, price: 2500 * HELI_PRICE, shotsPerSec: 7, damage: 16, pattern: ONE },
  { level: 3, price: 6000 * HELI_PRICE, shotsPerSec: 8, damage: 18, pattern: ONE },
  { level: 4, price: 14000 * HELI_PRICE, shotsPerSec: 9, damage: 19, pattern: TWO },
  { level: 5, price: 26000 * HELI_PRICE, shotsPerSec: 10, damage: 21, pattern: TWO },
  { level: 6, price: 45000 * HELI_PRICE, shotsPerSec: 11, damage: 23, pattern: TWO },
  { level: 7, price: 70000 * HELI_PRICE, shotsPerSec: 11, damage: 25, pattern: THREE },
  { level: 8, price: 110000 * HELI_PRICE, shotsPerSec: 12, damage: 27, pattern: THREE },
  { level: 9, price: 160000 * HELI_PRICE, shotsPerSec: 13, damage: 29, pattern: THREE },
  { level: 10, price: 230000 * HELI_PRICE, shotsPerSec: 14, damage: 31, pattern: FOUR },
]);

export const MAX_HELI_GUN_LEVEL = 10;

export function heliGunDef(level: number): GunLevelDef {
  const def = HELI_GUN_LEVELS[Math.max(1, Math.min(MAX_HELI_GUN_LEVEL, Math.floor(level))) - 1];
  if (!def) throw new Error(`missing helicopter gun level ${level}`);
  return def;
}
