import { GATLING_LEVELS, TURRET_LEVELS } from './heli-arms';

// The subs' arsenal (doc 101): the harpoon gun's upgrade ladders (Rapid Loader, Homing Tips, Side Tubes), its three ammo
// types (explosive, electric, cavitation; one loaded per sortie) and the numbers of the torpedo swarm, the sonar pulse,
// the decoy drone and the drift net that the weapon table doesn't carry. The mechanics are the helicopters' (doc 99)
// where they fit; prices are sub prices.

export type SubMod = 'loader' | 'homing' | 'sideTubes';
export const SUB_MODS: readonly SubMod[] = Object.freeze(['loader', 'homing', 'sideTubes'] as const);

export type SubRounds = 'explosive' | 'electric' | 'cavitation';
export const SUB_ROUNDS: readonly SubRounds[] = Object.freeze(['explosive', 'electric', 'cavitation'] as const);

/** The Rapid Loader: the Gatling Drive's rate and spin-up at sub prices. */
export const LOADER_LEVELS = Object.freeze(GATLING_LEVELS.map((l, i) => ({ ...l, price: [300000, 600000, 1000000, 1500000][i] ?? 0 })));
/** Homing Tips: the Turret Link's swivel at sub prices. */
export const HOMING_LEVELS = Object.freeze(TURRET_LEVELS.map((l, i) => ({ ...l, price: [200000, 420000, 700000][i] ?? 0 })));
export const SIDE_TUBE_LEVELS = Object.freeze([
  { level: 1, price: 170000, range: 220, damage: 6 },
  { level: 2, price: 370000, range: 270, damage: 11 },
  { level: 3, price: 640000, range: 320, damage: 16 },
]);

/** Each ammo type's levels 1–3 cost the same. */
export const SUB_ROUNDS_PRICES: readonly number[] = Object.freeze([150000, 400000, 750000]);

/** Explosive tips: doc 99's HEDP burst, wider for the sea's spread-out swimmers — the share of a hit and the radius by level. */
export const EXPLOSIVE = Object.freeze({ share: Object.freeze([0.3, 0.4, 0.5]), radius: Object.freeze([34, 40, 46]) });
/** Electric harpoons: how many neighbours a hit arcs to, within how far, the share of the hit and the stun, by level. */
export const ELECTRIC = Object.freeze({
  targets: Object.freeze([2, 3, 4]), reach: 70, share: Object.freeze([0.25, 0.35, 0.45]), stun: Object.freeze([0.3, 0.45, 0.6]),
});
/** Cavitation tips: how many more enemies a bolt passes through, by level, how much faster it flies, and the share of its
 *  hit it keeps for the next enemy after each one it passes through. */
export const CAVITATION = Object.freeze({ pierce: Object.freeze([1, 2, 3]), speed: 1.25, keep: 0.5 });

/** The torpedo swarm: torpedoes per salvo, their headings at launch, their life. */
export const TORP_SWARM = Object.freeze({ torpedoes: 6, headings: Object.freeze([-1.3, -0.8, -0.3, 0.3, 0.8, 1.3]), ttl: 6 });
/** The decoy drone: seconds it swims, its speed up the screen and off to the side (away from the sub's line of fire),
 *  how far from it enemies notice it. */
export const DECOY = Object.freeze({ seconds: 6, speed: 45, drift: 70, reach: 520 });
/** The drift net: seconds it drifts and how slow an enemy inside swims. */
export const NET = Object.freeze({ seconds: 6, slow: 0.3, throw: 160 });
/** The sonar pulse runs all the way round the sub. */
export const PULSE_CONE = Math.PI;

export const MAX_SUB_LEVEL: Readonly<Record<SubMod | SubRounds, number>> = Object.freeze({
  loader: LOADER_LEVELS.length, homing: HOMING_LEVELS.length, sideTubes: SIDE_TUBE_LEVELS.length,
  explosive: 3, electric: 3, cavitation: 3,
});

/** Price of level `level` (1-based) of a sub mod, or undefined past the top. */
export function subModLevelPrice(id: SubMod, level: number): number | undefined {
  switch (id) {
    case 'loader': return LOADER_LEVELS[level - 1]?.price;
    case 'homing': return HOMING_LEVELS[level - 1]?.price;
    case 'sideTubes': return SIDE_TUBE_LEVELS[level - 1]?.price;
    default: throw new Error(`unhandled: ${id satisfies never}`);
  }
}
