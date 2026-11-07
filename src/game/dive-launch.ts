import type { TakeoffRating } from '../data/types';

// The sub's dive launch (doc 71): the carrier's well deck floods, the sub moves out over the ramp, and the pilot floods
// or blows ballast to pass the gap between the anti-sub net and the reef; the depth at the net rates the dive like the
// carrier catapult (doc 04). Pure state machine; distances in metres, depth positive down.

export type DivePhase = 'flood' | 'dive' | 'clear' | 'done';
export type DiveGrade = 'perfect' | 'good' | 'early' | 'late';

export interface DiveInput {
  /** Holding the dive control: flood the tanks (sink); let go: blow ballast (rise). */
  flood: boolean;
  skip: boolean;
}

export interface DiveState {
  phase: DivePhase;
  t: number;
  /** Metres out from the start in the well deck; the net is at DIVE.net. */
  x: number;
  depth: number;
  /** Sink rate, m/s (positive = going down). */
  vz: number;
  grade: DiveGrade | null;
  /** The sail snagged the net or the keel scraped the reef. */
  scraped: boolean;
  rating: TakeoffRating | null;
}

export const DIVE = Object.freeze({
  flood: 2,
  speed: 9,
  /** The ramp's end: inside the deck the floor stops the sub at deckFloor. */
  deckEnd: 34,
  deckFloor: 4.5,
  start: 1.5,
  net: 78,
  netBottom: 9,
  reef: 21,
  /** Ballast: how fast the sink rate changes, and its limit. */
  accel: 4,
  maxRate: 5,
  perfect: 0.15,
  good: 0.45,
  clear: 1.2,
});

const MIDDLE = (DIVE.netBottom + DIVE.reef) / 2;
const HALF = (DIVE.reef - DIVE.netBottom) / 2;

export const createDive = (): DiveState =>
  ({ phase: 'flood', t: 0, x: 0, depth: DIVE.start, vz: 0, grade: null, scraped: false, rating: null });

/** The grade for passing the net at `depth`: by its distance from the gap's middle, as a share of the half-gap. */
export function gradeDive(depth: number): DiveGrade {
  const off = (depth - MIDDLE) / HALF;
  if (Math.abs(off) <= DIVE.perfect) return 'perfect';
  if (Math.abs(off) <= DIVE.good) return 'good';
  return off < 0 ? 'early' : 'late';
}

/** True when the depth at the net is outside the gap: snagged on the net or scraped on the reef. */
export const outsideGap = (depth: number): boolean => depth < DIVE.netBottom || depth > DIVE.reef;

/** One tick of ballast: flooding sinks, blowing rises, with momentum; never above the surface, never through the deck. */
function ballast(s: DiveState, flood: boolean, dt: number): Pick<DiveState, 'depth' | 'vz'> {
  const vz = Math.max(-DIVE.maxRate, Math.min(DIVE.maxRate, s.vz + (flood ? DIVE.accel : -DIVE.accel) * dt));
  const floor = s.x < DIVE.deckEnd ? DIVE.deckFloor : Infinity;
  const depth = Math.max(DIVE.start, Math.min(floor, s.depth + vz * dt));
  return { depth, vz: depth === floor || depth === DIVE.start ? 0 : vz };
}

export function stepDive(s: DiveState, i: DiveInput, dt: number): DiveState {
  const n: DiveState = { ...s, t: s.t + dt };
  if (i.skip && s.phase !== 'clear' && s.phase !== 'done') return { ...n, phase: 'done', rating: 'skipped' };
  switch (s.phase) {
    case 'flood':
      return n.t >= DIVE.flood ? { ...n, phase: 'dive', t: 0 } : n;
    case 'dive': {
      const moved = { ...n, ...ballast(s, i.flood, dt), x: s.x + DIVE.speed * dt };
      if (moved.x < DIVE.net) return moved;
      const grade = gradeDive(moved.depth);
      return { ...moved, phase: 'clear', t: 0, grade, scraped: outsideGap(moved.depth), rating: grade };
    }
    case 'clear': {
      const vz = s.vz * Math.exp(-3 * dt);
      return n.t >= DIVE.clear ? { ...n, phase: 'done' } : { ...n, x: s.x + DIVE.speed * dt, vz, depth: s.depth + vz * dt };
    }
    case 'done':
      return n;
    default:
      throw new Error(`unhandled: ${s.phase satisfies never}`);
  }
}
