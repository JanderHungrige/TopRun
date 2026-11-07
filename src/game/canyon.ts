import type { MissionDef } from '../data/types';

// Canyon runs (doc 52): a third of the map-3 missions lead through a winding gorge whose walls crash the helicopter.
// Geometry in playfield pixels (640 wide), measured in scrolled distance from where the run began. Pure.

export const CANYON = Object.freeze({
  /** Playfield width the walls close in from. */
  width: 640,
  /** Pixels over which the walls close in at the start and open at the end. */
  ease: 300,
  /** The channel's half-width breathes between these. */
  minHalf: 105,
  maxHalf: 150,
  /** Never closer to the playfield's edge than this. */
  margin: 30,
  /** The run starts at this share of the mission. */
  at: 0.35,
  /** Seconds of warning before it. */
  warn: 4,
});

/** Ten of the thirty map-3 missions: never the first two, never a boss mission. */
export const CANYON_MISSIONS: ReadonlySet<string> = new Set(['m63', 'm65', 'm68', 'm70', 'm74', 'm76', 'm80', 'm82', 'm86', 'm88']);

export interface CanyonPlan {
  /** Mission second the gorge reaches the top of the screen. */
  at: number;
  /** Seconds of gorge at the mission's scroll speed. */
  seconds: number;
}

export function canyonPlan(m: MissionDef): CanyonPlan | null {
  if (!CANYON_MISSIONS.has(m.id) || m.objective.type === 'boss') return null;
  return { at: Math.round(m.length * CANYON.at), seconds: Math.round(24 + (m.number - 61) * 0.4) };
}

export interface Channel { cx: number; half: number }

const smooth = (u: number): number => {
  const c = Math.min(1, Math.max(0, u));
  return c * c * (3 - 2 * c);
};

/** The channel `d` px into a run of `total` px: open at both ends, a winding gorge between. */
export function channel(d: number, total: number): Channel {
  const mid = CANYON.width / 2;
  const open = smooth(Math.min(d, total - d) / CANYON.ease);
  const breathe = CANYON.minHalf + (CANYON.maxHalf - CANYON.minHalf) * (0.5 + 0.5 * Math.sin(d * 0.0047 + 1.3));
  const half = mid + (breathe - mid) * open;
  const room = Math.max(0, mid - half - CANYON.margin);
  const swing = (0.6 + 0.4 * Math.min(1, d / Math.max(1, total))) * (0.65 * Math.sin(d * 0.0031) + 0.35 * Math.sin(d * 0.0083 + 2));
  return { cx: mid + room * swing, half };
}

/** A body of radius `r` at `x` touches a wall of the channel. */
export const hitsWall = (x: number, r: number, c: Channel): boolean => x - r < c.cx - c.half || x + r > c.cx + c.half;

/** An x moved inside the channel, `inset` px from its walls. */
export const clampToChannel = (x: number, c: Channel, inset = 20): number =>
  Math.min(c.cx + c.half - inset, Math.max(c.cx - c.half + inset, x));
