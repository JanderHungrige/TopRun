import type { MechId } from './types';
import type { GunLevelDef } from './weapons';

// The mech kit's tables (doc 79): the autocannon and the price factor of everything the MECH BAY builds — in alloy,
// not money. The mech weapons themselves are secondaries (data/weapons.ts, campaign 6).

/** Mech prices in alloy: what the jets pay in money for the same step × this (doc 79). */
export const MECH_PRICE = 0.008;

const deg = (d: number): number => (d * Math.PI) / 180;
const TWO = [{ dx: -9, angle: 0 }, { dx: 9, angle: 0 }];
const THREE = [{ dx: 0, angle: 0 }, { dx: -10, angle: deg(-4) }, { dx: 10, angle: deg(4) }];
const FOUR = [{ dx: -6, angle: 0 }, { dx: 6, angle: 0 }, { dx: -11, angle: deg(-6) }, { dx: 11, angle: deg(6) }];

/** Autocannon, levels 1–10: a gun on each arm, heavy rounds at the chain gun's rate; prices are the jets' × MECH_PRICE. */
export const MECH_GUN_LEVELS: readonly GunLevelDef[] = Object.freeze([
  { level: 1, price: 0, shotsPerSec: 6, damage: 15, pattern: TWO },
  { level: 2, price: 2500 * MECH_PRICE, shotsPerSec: 7, damage: 16, pattern: TWO },
  { level: 3, price: 6000 * MECH_PRICE, shotsPerSec: 8, damage: 18, pattern: TWO },
  { level: 4, price: 14000 * MECH_PRICE, shotsPerSec: 9, damage: 19, pattern: TWO },
  { level: 5, price: 26000 * MECH_PRICE, shotsPerSec: 9, damage: 21, pattern: THREE },
  { level: 6, price: 45000 * MECH_PRICE, shotsPerSec: 10, damage: 23, pattern: THREE },
  { level: 7, price: 70000 * MECH_PRICE, shotsPerSec: 11, damage: 26, pattern: THREE },
  { level: 8, price: 110000 * MECH_PRICE, shotsPerSec: 12, damage: 28, pattern: FOUR },
  { level: 9, price: 160000 * MECH_PRICE, shotsPerSec: 13, damage: 31, pattern: FOUR },
  { level: 10, price: 230000 * MECH_PRICE, shotsPerSec: 14, damage: 34, pattern: FOUR },
]);

export const MAX_MECH_GUN_LEVEL = 10;

export function mechGunDef(level: number): GunLevelDef {
  const def = MECH_GUN_LEVELS[Math.max(1, Math.min(MAX_MECH_GUN_LEVEL, Math.floor(level))) - 1];
  if (!def) throw new Error(`missing autocannon level ${level}`);
  return def;
}

/** The mech bay level that builds each mech (doc 79). */
export const MECH_BAY: Readonly<Record<MechId, number>> = Object.freeze({ strider: 1, ranger: 2, hornet: 2, titan: 3 });
