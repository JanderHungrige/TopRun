import type { CampaignId, GunLevel, PlaneId, SecondaryId } from './types';

export interface GunBarrel {
  dx: number;
  angle: number; // radians away from straight up (positive = right)
}

export interface GunLevelDef {
  level: GunLevel;
  price: number;
  shotsPerSec: number;
  damage: number;
  pattern: readonly GunBarrel[];
}

const deg = (d: number): number => (d * Math.PI) / 180;

/** Barrel patterns shared by several levels. */
const FIVE: readonly GunBarrel[] = [
  { dx: 0, angle: 0 }, { dx: -6, angle: 0 }, { dx: 6, angle: 0 }, { dx: -10, angle: deg(-9) }, { dx: 10, angle: deg(9) },
];
const SIX: readonly GunBarrel[] = [
  { dx: -4, angle: 0 }, { dx: 4, angle: 0 }, { dx: -8, angle: deg(-4) }, { dx: 8, angle: deg(4) },
  { dx: -12, angle: deg(-10) }, { dx: 12, angle: deg(10) },
];
const SEVEN: readonly GunBarrel[] = [{ dx: 0, angle: 0 }, ...SIX];

export const GUN_LEVELS: readonly GunLevelDef[] = Object.freeze([
  { level: 1, price: 0, shotsPerSec: 9, damage: 10, pattern: [{ dx: 0, angle: 0 }] },
  { level: 2, price: 2500, shotsPerSec: 10, damage: 10, pattern: [{ dx: -7, angle: 0 }, { dx: 7, angle: 0 }] },
  { level: 3, price: 6000, shotsPerSec: 13, damage: 11, pattern: [{ dx: -7, angle: 0 }, { dx: 7, angle: 0 }] },
  {
    level: 4, price: 14000, shotsPerSec: 13, damage: 11,
    pattern: [{ dx: 0, angle: 0 }, { dx: -6, angle: deg(-6) }, { dx: 6, angle: deg(6) }],
  },
  {
    level: 5, price: 26000, shotsPerSec: 15, damage: 12,
    pattern: [
      { dx: -5, angle: 0 }, { dx: 5, angle: 0 }, { dx: -9, angle: deg(-9) }, { dx: 9, angle: deg(9) },
    ],
  },
  // Map 1 since doc 43 (were map 2 only, doc 37).
  {
    level: 6, price: 45000, shotsPerSec: 17, damage: 13,
    pattern: [{ dx: -5, angle: 0 }, { dx: 5, angle: 0 }, { dx: -9, angle: deg(-7) }, { dx: 9, angle: deg(7) }],
  },
  { level: 7, price: 70000, shotsPerSec: 16, damage: 14, pattern: FIVE },
  // Map 2: the old jets' path beyond the map-1 top (docs 37, 43).
  {
    level: 8, price: 110000, shotsPerSec: 20, damage: 15,
    pattern: [{ dx: 0, angle: 0 }, { dx: -6, angle: 0 }, { dx: 6, angle: 0 }, { dx: -10, angle: deg(-7) }, { dx: 10, angle: deg(7) }],
  },
  {
    level: 9, price: 160000, shotsPerSec: 22, damage: 17,
    pattern: [{ dx: 0, angle: 0 }, { dx: -6, angle: 0 }, { dx: 6, angle: 0 }, { dx: -10, angle: deg(-8) }, { dx: 10, angle: deg(8) }],
  },
  {
    level: 10, price: 230000, shotsPerSec: 22, damage: 17, pattern: SIX,
  },
  // Map 2, wave 3 (doc 43): as many levels again, about +8–11 % each; the seventh barrel fires from the nose.
  { level: 11, price: 250000, shotsPerSec: 23, damage: 18, pattern: SIX },
  { level: 12, price: 265000, shotsPerSec: 23, damage: 20, pattern: SIX },
  { level: 13, price: 280000, shotsPerSec: 24, damage: 21, pattern: SIX },
  { level: 14, price: 300000, shotsPerSec: 24, damage: 23, pattern: SIX },
  { level: 15, price: 320000, shotsPerSec: 25, damage: 24, pattern: SIX },
  { level: 16, price: 340000, shotsPerSec: 25, damage: 22, pattern: SEVEN },
  { level: 17, price: 360000, shotsPerSec: 26, damage: 23, pattern: SEVEN },
  { level: 18, price: 385000, shotsPerSec: 26, damage: 25, pattern: SEVEN },
  { level: 19, price: 410000, shotsPerSec: 27, damage: 26, pattern: SEVEN },
  { level: 20, price: 435000, shotsPerSec: 27, damage: 28, pattern: SEVEN },
]);

export const MAX_GUN_LEVEL: GunLevel = 20;
/** The gun's cap before map 2 opens (docs 37, 43). */
export const MAP1_GUN_LEVEL: GunLevel = 7;
/** A new jet's main gun and second gun go to 14 (wave 3, doc 43; 7 before). */
export const TWIN_GUN_LEVEL = 14;
/** Second gun of the new jets (docs 37, 43): price of levels 1–14. */
export const GUN2_PRICES: readonly number[] = Object.freeze([
  15000, 8000, 15000, 25000, 40000, 60000, 90000, 120000, 150000, 185000, 225000, 270000, 320000, 375000,
]);
export const MAX_GUN2_LEVEL = TWIN_GUN_LEVEL;

/**
 * Levels 8–14 of a new jet's two guns (wave 3, doc 43): each about half an old jet's gun at the same point of the
 * ladder, so two level-14 guns match one level-20 gun. Price is the shared ladder's (main gun) or GUN2_PRICES.
 */
const TWIN_LEVELS: readonly GunLevelDef[] = Object.freeze([
  { level: 8, price: 0, shotsPerSec: 17, damage: 15, pattern: FIVE },
  { level: 9, price: 0, shotsPerSec: 18, damage: 16, pattern: FIVE },
  { level: 10, price: 0, shotsPerSec: 18, damage: 18, pattern: FIVE },
  { level: 11, price: 0, shotsPerSec: 20, damage: 18, pattern: FIVE },
  { level: 12, price: 0, shotsPerSec: 20, damage: 21, pattern: FIVE },
  { level: 13, price: 0, shotsPerSec: 21, damage: 22, pattern: FIVE },
  { level: 14, price: 0, shotsPerSec: 21, damage: 25, pattern: FIVE },
]);

export function gunLevelDef(level: number): GunLevelDef {
  const clamped = Math.max(1, Math.min(MAX_GUN_LEVEL, Math.floor(level)));
  const def = GUN_LEVELS[clamped - 1];
  if (!def) throw new Error(`missing gun level ${clamped}`);
  return def;
}

/** A gun's numbers on a jet: a new jet's guns (`twin`) use their own table above level 7. */
export function jetGunDef(level: number, twin: boolean): GunLevelDef {
  if (!twin || level <= MAP1_GUN_LEVEL) return gunLevelDef(Math.min(level, twin ? MAP1_GUN_LEVEL : MAX_GUN_LEVEL));
  const def = TWIN_LEVELS[Math.min(TWIN_GUN_LEVEL, Math.floor(level)) - 8];
  if (!def) throw new Error(`missing twin gun level ${level}`);
  return def;
}

export type SecondaryHits = 'air' | 'ground' | 'any';
export type SecondaryBehavior = 'homing' | 'fan' | 'bomb';

/** Which weapon key fires it (doc 05): AIR (R) or GROUND (Q). */
export type WeaponRole = 'air' | 'ground';

export const SECONDARY_ROLES: Readonly<Record<SecondaryId, WeaponRole>> = Object.freeze({
  aim9: 'air', aim54: 'air', rockets: 'ground', mk82: 'ground', agm65: 'ground', aim120: 'air', jdam: 'ground',
});

export interface SecondaryDef {
  id: SecondaryId;
  role: WeaponRole;
  name: string;
  short: string;
  price: number;
  ammoPerSlot: number;
  damage: number;
  radius: number;
  hits: SecondaryHits;
  behavior: SecondaryBehavior;
  cooldown: number;
  speed: number;
  turnRate: number;
  planes: readonly PlaneId[] | null;
  description: string;
  /** 1 = sold from the start; 2 = once map 2 is open (doc 37). */
  campaign: CampaignId;
}

export const SECONDARIES: Readonly<Record<SecondaryId, SecondaryDef>> = Object.freeze({
  aim9: {
    id: 'aim9', role: 'air', name: 'AIM-9 Sidewinder', short: 'AIM-9', price: 3000, ammoPerSlot: 6,
    damage: 60, radius: 0, hits: 'air', behavior: 'homing', cooldown: 0.35, speed: 520,
    turnRate: 3.5, planes: null, description: 'Heat-seeking air-to-air missile. Locks the nearest bandit ahead.', campaign: 1,
  },
  rockets: {
    id: 'rockets', role: 'ground', name: 'Zuni Rocket Pod', short: 'ROCKETS', price: 4500, ammoPerSlot: 5,
    damage: 25, radius: 0, hits: 'any', behavior: 'fan', cooldown: 0.5, speed: 620,
    turnRate: 0, planes: null, description: 'Fires a fan of five unguided rockets. Hits air and ground.', campaign: 1,
  },
  mk82: {
    id: 'mk82', role: 'ground', name: 'Mk-82 Bombs', short: 'MK-82', price: 5000, ammoPerSlot: 6,
    damage: 140, radius: 70, hits: 'ground', behavior: 'bomb', cooldown: 0.5, speed: 0,
    turnRate: 0, planes: null, description: '500 lb free-fall bomb. Big blast radius against ground and sea targets.', campaign: 1,
  },
  agm65: {
    id: 'agm65', role: 'ground', name: 'AGM-65 Maverick', short: 'AGM-65', price: 9000, ammoPerSlot: 4,
    damage: 160, radius: 0, hits: 'ground', behavior: 'homing', cooldown: 0.6, speed: 430,
    turnRate: 3.0, planes: null, description: 'TV-guided air-to-ground missile. Seeks SAMs, tanks and ships.', campaign: 1,
  },
  aim54: {
    id: 'aim54', role: 'air', name: 'AIM-54 Phoenix', short: 'AIM-54', price: 15000, ammoPerSlot: 2,
    damage: 320, radius: 0, hits: 'any', behavior: 'homing', cooldown: 0.8, speed: 480,
    turnRate: 2.6, planes: ['f14'], description: 'Long-range heavy missile. Devastating against bosses. F-14 only.', campaign: 1,
  },
  aim120: {
    id: 'aim120', role: 'air', name: 'AIM-120 AMRAAM', short: 'AIM-120', price: 24000, ammoPerSlot: 4,
    damage: 180, radius: 0, hits: 'air', behavior: 'homing', cooldown: 0.3, speed: 640,
    turnRate: 4.2, planes: null, description: 'Fast, agile radar-guided missile. Hunts down the toughest fighters.', campaign: 2,
  },
  jdam: {
    id: 'jdam', role: 'ground', name: 'GBU-31 JDAM', short: 'JDAM', price: 28000, ammoPerSlot: 2,
    damage: 520, radius: 130, hits: 'ground', behavior: 'bomb', cooldown: 0.8, speed: 0,
    turnRate: 0, planes: null, description: '2,000 lb satellite-guided bomb. The biggest blast in the hangar.', campaign: 2,
  },
});

export function secondaryAllowedOn(id: SecondaryId, plane: PlaneId): boolean {
  const allowed = SECONDARIES[id].planes;
  return allowed === null || allowed.includes(plane);
}
