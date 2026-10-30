import { heLevelDef, MAX_HE_LEVEL, type HeLevelDef } from '../data/he-gun';
import { circleHit } from './combat';
import type { SaveData } from './save';

// The Bofors 40 mm HE gun (doc 46): price of the next level, the gun a pilot flies with, and who a burst hits. Pure.
// On sale only once map 2 is open (economy.onSale).

/** Price of the next level, or null at the top. */
export const hePrice = (save: SaveData): number | null =>
  (save.heLevel >= MAX_HE_LEVEL ? null : heLevelDef(save.heLevel + 1)?.price ?? null);

/** The gun at the pilot's level, null when none is fitted. */
export const heGun = (level: number): HeLevelDef | null => (level > 0 ? heLevelDef(level) : null);

interface Body { x: number; y: number; radius: number; dead: boolean }

/** Every live body the blast at (x, y) reaches: air and ground alike (explosive). */
export function inBlast<T extends Body>(x: number, y: number, radius: number, bodies: readonly T[]): T[] {
  return bodies.filter((b) => !b.dead && circleHit(x, y, radius, b.x, b.y, b.radius));
}
