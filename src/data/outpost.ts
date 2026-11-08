import type { SecondaryId } from './types';

// The ground base on the jungle planet (doc 82): its buildings, the power grid, the magazine's rounds and the lab's
// projects. Static tables; the rules live in game/outpost.ts.

export type BuildingId = 'generator' | 'refinery' | 'factory' | 'lab' | 'mechbay';
export const BUILDING_IDS: readonly BuildingId[] = Object.freeze(['generator', 'refinery', 'factory', 'lab', 'mechbay'] as const);

export const MAX_BUILDING_LEVEL = 3;

export interface BuildingDef {
  id: BuildingId;
  /** Money for levels 1, 2, 3. */
  prices: readonly [number, number, number];
  /** Power drawn at levels 1, 2, 3 (the generator draws none). */
  draw: readonly [number, number, number];
  /** What a level gives, levels 0–3: the generator's power, the refinery's alloy and the lab's research per sortie, the
   *  factory's magazine size per kind of round, the mech bay's top gun level. */
  output: readonly [number, number, number, number];
}

export const BUILDINGS: Readonly<Record<BuildingId, BuildingDef>> = Object.freeze({
  generator: { id: 'generator', prices: [30000, 120000, 350000], draw: [0, 0, 0], output: [0, 8, 16, 26] },
  refinery: { id: 'refinery', prices: [40000, 150000, 400000], draw: [3, 5, 7], output: [0, 60, 120, 200] },
  factory: { id: 'factory', prices: [30000, 120000, 350000], draw: [2, 3, 5], output: [24, 48, 96, 160] },
  lab: { id: 'lab', prices: [50000, 180000, 450000], draw: [3, 5, 7], output: [0, 25, 50, 80] },
  mechbay: { id: 'mechbay', prices: [0, 150000, 400000], draw: [2, 3, 4], output: [0, 4, 7, 10] },
});

/** The mech bay is standing when the mechs land; nothing else is. */
export const START_BUILDINGS: Readonly<Record<BuildingId, number>> = Object.freeze({ generator: 0, refinery: 0, factory: 0, lab: 0, mechbay: 1 });

/** The rounds the factory builds for the magazine; energy weapons need none. */
export type RoundsId = 'rockets' | 'missiles' | 'shells';
export const ROUNDS_IDS: readonly RoundsId[] = Object.freeze(['rockets', 'missiles', 'shells'] as const);

/** Alloy per round. */
export const ROUND_COST: Readonly<Record<RoundsId, number>> = Object.freeze({ rockets: 2, missiles: 6, shells: 4 });
/** Rounds the factory builds per order. */
export const ROUND_BATCH = 10;

/** Which weapon fires which rounds; energy weapons (plasma, rail) and every other kit's weapons none. */
export function roundsOf(id: SecondaryId): RoundsId | null {
  switch (id) {
    case 'pod': return 'rockets';
    case 'seeker': return 'missiles';
    case 'mortar': return 'shells';
    default: return null;
  }
}

/** What came down with the mechs: a little alloy and a first load of rockets. */
export const START_ALLOY = 150;
export const START_MAGAZINE: Readonly<Record<RoundsId, number>> = Object.freeze({ rockets: 24, missiles: 0, shells: 0 });

/** Salvage from wrecks: alloy per kill (full on a won sortie, half on a lost one) and for a boss. */
export const SALVAGE = Object.freeze({ perKill: 3, boss: 80 });
