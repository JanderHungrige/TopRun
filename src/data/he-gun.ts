// The Bofors 40 mm HE gun (doc 46): an always-on third gun on every jet, sold once map 2 is open. Static table.

export interface HeLevelDef {
  level: number;
  price: number;
  shotsPerSec: number;
  /** Damage every enemy inside the blast takes. */
  damage: number;
  /** Blast radius in px. */
  radius: number;
}

export const HE_LEVELS: readonly HeLevelDef[] = Object.freeze([
  { level: 1, price: 50000, shotsPerSec: 1, damage: 150, radius: 40 },
  { level: 2, price: 65000, shotsPerSec: 1, damage: 185, radius: 44 },
  { level: 3, price: 80000, shotsPerSec: 1.1, damage: 225, radius: 48 },
  { level: 4, price: 100000, shotsPerSec: 1.1, damage: 270, radius: 52 },
  { level: 5, price: 120000, shotsPerSec: 1.2, damage: 320, radius: 56 },
  { level: 6, price: 145000, shotsPerSec: 1.2, damage: 375, radius: 60 },
  { level: 7, price: 170000, shotsPerSec: 1.3, damage: 435, radius: 64 },
  { level: 8, price: 200000, shotsPerSec: 1.3, damage: 500, radius: 68 },
  { level: 9, price: 235000, shotsPerSec: 1.4, damage: 570, radius: 72 },
  { level: 10, price: 275000, shotsPerSec: 1.5, damage: 650, radius: 76 },
]);
export const MAX_HE_LEVEL = 10;

/** The shell: speed (px/s) and seconds until it bursts in the air without a target (≈ 680 px). */
export const HE_SHELL = Object.freeze({ speed: 620, ttl: 1.1 });

export function heLevelDef(level: number): HeLevelDef | null {
  return HE_LEVELS[Math.min(MAX_HE_LEVEL, Math.floor(level)) - 1] ?? null;
}
