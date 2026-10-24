import type { GunLevel, PlaneId, SecondaryId } from './types';

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

export const GUN_LEVELS: readonly GunLevelDef[] = Object.freeze([
  { level: 1, price: 0, shotsPerSec: 9, damage: 10, pattern: [{ dx: 0, angle: 0 }] },
  { level: 2, price: 2500, shotsPerSec: 10, damage: 10, pattern: [{ dx: -7, angle: 0 }, { dx: 7, angle: 0 }] },
  { level: 3, price: 6000, shotsPerSec: 13, damage: 11, pattern: [{ dx: -7, angle: 0 }, { dx: 7, angle: 0 }] },
  {
    level: 4, price: 12000, shotsPerSec: 13, damage: 11,
    pattern: [{ dx: 0, angle: 0 }, { dx: -6, angle: deg(-6) }, { dx: 6, angle: deg(6) }],
  },
  {
    level: 5, price: 20000, shotsPerSec: 15, damage: 12,
    pattern: [
      { dx: -5, angle: 0 }, { dx: 5, angle: 0 }, { dx: -9, angle: deg(-9) }, { dx: 9, angle: deg(9) },
    ],
  },
]);

export const MAX_GUN_LEVEL: GunLevel = 5;

export function gunLevelDef(level: number): GunLevelDef {
  const clamped = Math.max(1, Math.min(MAX_GUN_LEVEL, Math.floor(level)));
  const def = GUN_LEVELS[clamped - 1];
  if (!def) throw new Error(`missing gun level ${clamped}`);
  return def;
}

export type SecondaryHits = 'air' | 'ground' | 'any';
export type SecondaryBehavior = 'homing' | 'fan' | 'bomb';

export interface SecondaryDef {
  id: SecondaryId;
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
}

export const SECONDARIES: Readonly<Record<SecondaryId, SecondaryDef>> = Object.freeze({
  aim9: {
    id: 'aim9', name: 'AIM-9 Sidewinder', short: 'AIM-9', price: 3000, ammoPerSlot: 6,
    damage: 60, radius: 0, hits: 'air', behavior: 'homing', cooldown: 0.35, speed: 520,
    turnRate: 3.5, planes: null, description: 'Heat-seeking air-to-air missile. Locks the nearest bandit ahead.',
  },
  rockets: {
    id: 'rockets', name: 'Zuni Rocket Pod', short: 'ROCKETS', price: 4500, ammoPerSlot: 5,
    damage: 25, radius: 0, hits: 'any', behavior: 'fan', cooldown: 0.5, speed: 620,
    turnRate: 0, planes: null, description: 'Fires a fan of five unguided rockets. Hits air and ground.',
  },
  mk82: {
    id: 'mk82', name: 'Mk-82 Bombs', short: 'MK-82', price: 5000, ammoPerSlot: 6,
    damage: 140, radius: 70, hits: 'ground', behavior: 'bomb', cooldown: 0.5, speed: 0,
    turnRate: 0, planes: null, description: '500 lb free-fall bomb. Big blast radius against ground and sea targets.',
  },
  agm65: {
    id: 'agm65', name: 'AGM-65 Maverick', short: 'AGM-65', price: 9000, ammoPerSlot: 4,
    damage: 160, radius: 0, hits: 'ground', behavior: 'homing', cooldown: 0.6, speed: 430,
    turnRate: 3.0, planes: null, description: 'TV-guided air-to-ground missile. Seeks SAMs, tanks and ships.',
  },
  aim54: {
    id: 'aim54', name: 'AIM-54 Phoenix', short: 'AIM-54', price: 15000, ammoPerSlot: 2,
    damage: 320, radius: 0, hits: 'any', behavior: 'homing', cooldown: 0.8, speed: 480,
    turnRate: 2.6, planes: ['f14'], description: 'Long-range heavy missile. Devastating against bosses. F-14 only.',
  },
});

export function secondaryAllowedOn(id: SecondaryId, plane: PlaneId): boolean {
  const allowed = SECONDARIES[id].planes;
  return allowed === null || allowed.includes(plane);
}
