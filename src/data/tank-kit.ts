import type { TankId } from './types';
import type { GunLevelDef } from './weapons';

// The tank kit's tables (doc 103): the turret cannon, the price factor of everything the MOTOR POOL sells, and which
// vehicles are buggies and which tanks (doc 104: the handling, the turret, the marks they leave). The tank weapons
// themselves are secondaries (data/weapons-fleet.ts, campaign 7).

/** Tank prices: what the jets pay for the same step × this (set by the map-7 playtest, doc 102). */
export const TANK_PRICE = 8;

const deg = (d: number): number => (d * Math.PI) / 180;
const ONE = [{ dx: 0, angle: 0 }];
const TWO = [{ dx: -4, angle: 0 }, { dx: 4, angle: 0 }];
const THREE = [{ dx: 0, angle: 0 }, { dx: -6, angle: deg(-5) }, { dx: 6, angle: deg(5) }];
const FOUR = [{ dx: -4, angle: 0 }, { dx: 4, angle: 0 }, { dx: -8, angle: deg(-6) }, { dx: 8, angle: deg(6) }];

/** Turret cannon, levels 1–10: 20 mm rounds at the chain gun's rate and damage; prices are the jets' × TANK_PRICE. */
export const TANK_GUN_LEVELS: readonly GunLevelDef[] = Object.freeze([
  { level: 1, price: 0, shotsPerSec: 6, damage: 15, pattern: ONE },
  { level: 2, price: 2500 * TANK_PRICE, shotsPerSec: 7, damage: 16, pattern: ONE },
  { level: 3, price: 6000 * TANK_PRICE, shotsPerSec: 8, damage: 18, pattern: ONE },
  { level: 4, price: 14000 * TANK_PRICE, shotsPerSec: 9, damage: 19, pattern: TWO },
  { level: 5, price: 26000 * TANK_PRICE, shotsPerSec: 10, damage: 21, pattern: TWO },
  { level: 6, price: 45000 * TANK_PRICE, shotsPerSec: 11, damage: 23, pattern: TWO },
  { level: 7, price: 70000 * TANK_PRICE, shotsPerSec: 12, damage: 27, pattern: THREE },
  { level: 8, price: 110000 * TANK_PRICE, shotsPerSec: 13, damage: 30, pattern: THREE },
  { level: 9, price: 160000 * TANK_PRICE, shotsPerSec: 14, damage: 32, pattern: FOUR },
  { level: 10, price: 230000 * TANK_PRICE, shotsPerSec: 15, damage: 35, pattern: FOUR },
]);

export const MAX_TANK_GUN_LEVEL = 10;

export function tankGunDef(level: number): GunLevelDef {
  const def = TANK_GUN_LEVELS[Math.max(1, Math.min(MAX_TANK_GUN_LEVEL, Math.floor(level))) - 1];
  if (!def) throw new Error(`missing turret cannon level ${level}`);
  return def;
}

export type VehicleKind = 'buggy' | 'tank';

/** Buggies are quick and slide, tanks heavy with a turret that follows the target (doc 104). */
export const VEHICLE: Readonly<Record<TankId, VehicleKind>> = Object.freeze({
  jackal: 'buggy', lynx: 'tank', viper: 'buggy', bison: 'tank',
});
