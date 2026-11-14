// The tanks' arsenal (doc 108): the turret cannon's upgrade ladders (Autoloader, Gun Stabiliser, Coax MG) and its three
// ammo types (APDS, HE-Frag, Thermite; one loaded per sortie). The mechanics are the helicopters' and the subs' (docs 99,
// 101) where they fit; prices are the steppe's.

export type TankMod = 'autoloader' | 'stabiliser' | 'coaxmg';
export const TANK_MODS: readonly TankMod[] = Object.freeze(['autoloader', 'stabiliser', 'coaxmg'] as const);

export type TankRounds = 'apds' | 'hefrag' | 'thermite';
export const TANK_ROUNDS: readonly TankRounds[] = Object.freeze(['apds', 'hefrag', 'thermite'] as const);

const deg = (d: number): number => (d * Math.PI) / 180;

/** The Autoloader: the cannon's rate × at full speed, a quick spin-up. */
export const AUTOLOADER_LEVELS = Object.freeze([
  { level: 1, price: 250000, mul: 1.15, spinUp: 0.2 },
  { level: 2, price: 550000, mul: 1.3, spinUp: 0.2 },
  { level: 3, price: 950000, mul: 1.45, spinUp: 0.2 },
]);
/** The Gun Stabiliser: how much further the rounds turn toward a target (on top of a tank's own turret). */
export const STABILISER_LEVELS = Object.freeze([
  { level: 1, price: 180000, swivel: deg(12) },
  { level: 2, price: 400000, swivel: deg(20) },
  { level: 3, price: 700000, swivel: deg(28) },
]);
/** The Coax MG: the door guns' auto fire at the nearest enemy in reach. */
export const COAX_LEVELS = Object.freeze([
  { level: 1, price: 160000, range: 220, damage: 6 },
  { level: 2, price: 360000, range: 270, damage: 10 },
  { level: 3, price: 620000, range: 320, damage: 14 },
]);

/** Each ammo type's levels 1–3 cost the same. */
export const TANK_ROUNDS_PRICES: readonly number[] = Object.freeze([150000, 400000, 750000]);

/** APDS: further enemies a round passes through, by level (keeping half its hit each time, doc 101's rule). */
export const APDS = Object.freeze({ pierce: Object.freeze([1, 2, 3]), speed: 1.2 });
/** HE-Frag: the share of a hit that bursts onto others and the radius, by level. */
export const HEFRAG = Object.freeze({ share: Object.freeze([0.3, 0.4, 0.5]), radius: Object.freeze([36, 42, 48]) });
/** Thermite: the share of a hit that burns on, by level — on the ground too. */
export const THERMITE = Object.freeze({ burn: Object.freeze([0.25, 0.35, 0.45]) });

export const MAX_TANK_LEVEL: Readonly<Record<TankMod | TankRounds, number>> = Object.freeze({
  autoloader: 3, stabiliser: 3, coaxmg: 3, apds: 3, hefrag: 3, thermite: 3,
});

/** Price of level `level` (1-based) of a tank mod, or undefined past the top. */
export function tankModLevelPrice(id: TankMod, level: number): number | undefined {
  switch (id) {
    case 'autoloader': return AUTOLOADER_LEVELS[level - 1]?.price;
    case 'stabiliser': return STABILISER_LEVELS[level - 1]?.price;
    case 'coaxmg': return COAX_LEVELS[level - 1]?.price;
    default: throw new Error(`unhandled: ${id satisfies never}`);
  }
}
