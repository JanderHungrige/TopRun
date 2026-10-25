import type { Bike } from './motorbike-bike';

// Motorbike vs. Jet (doc 22): the fixed course along the perimeter road and what each obstacle needs. Pure.

export type ObstacleKind = 'bump' | 'oil' | 'gate' | 'truck';

export interface Obstacle {
  kind: ObstacleKind;
  /** Where the front wheel meets it (m from the start line); for the truck, the edge of its lane. */
  x: number;
  /** Length along the road (oil only). */
  len: number;
}

export const COURSE: readonly Obstacle[] = [
  { kind: 'bump', x: 230, len: 0 },
  { kind: 'oil', x: 470, len: 26 },
  { kind: 'gate', x: 720, len: 0 },
  { kind: 'bump', x: 960, len: 0 },
  { kind: 'truck', x: 1240, len: 0 },
  { kind: 'oil', x: 1530, len: 30 },
  { kind: 'bump', x: 1760, len: 0 },
  { kind: 'gate', x: 1840, len: 0 },
];

/** The fuel truck pulls out when the front wheel is `trigger` m short of its lane and blocks it in between. */
export const TRUCK = { trigger: 170, blockFrom: 1.3, blockTo: 2.1, close: 0.25 } as const;

/**
 * Wheelie / tuck needed when the front wheel gets there; bumps are harmless below `slowBump` m/s; on oil the
 * throttle must stay at or under `oilThrottle` (no brake) — up to `oilGrace` s of it are forgiven.
 */
export const NEEDS = { wheelie: 0.5, tuck: 0.6, slowBump: 12, oilThrottle: 0.25, oilGrace: 0.1 } as const;

export type Mishap = 'bump' | 'slide' | 'gate' | 'truck';

/** Speed kept and seconds without drive after a mishap. */
export const MISHAP: Readonly<Record<Mishap, { keep: number; stun: number }>> = {
  bump: { keep: 0.85, stun: 0.2 },
  slide: { keep: 0.75, stun: 0.5 },
  gate: { keep: 0.68, stun: 0.6 },
  truck: { keep: 0, stun: 0.8 },
};

/** The truck covers the bike's lane this long after it pulled out. */
export const truckBlocked = (t: number): boolean => t >= TRUCK.blockFrom && t <= TRUCK.blockTo;

export interface Judge {
  /** Front wheel before this tick; the bike after it. */
  prevX: number;
  bike: Bike;
  throttle: number;
  brake: boolean;
  /** Seconds of throttle / brake on the current oil patch so far. */
  oilT: number;
  /** Seconds since the truck pulled out (null: not yet). */
  truckT: number | null;
  dt: number;
}

export interface Verdict {
  /** null = not decided yet. */
  result: 'clean' | Mishap | null;
  oilT: number;
}

const crossed = (j: Judge, x: number): boolean => j.prevX < x && j.bike.x >= x;

function oil(o: Obstacle, j: Judge): Verdict {
  if (j.bike.x < o.x) return { result: null, oilT: 0 };
  const on = j.prevX < o.x + o.len;
  const working = j.throttle > NEEDS.oilThrottle || j.brake;
  const oilT = on && working ? j.oilT + j.dt : j.oilT;
  if (oilT > NEEDS.oilGrace + 1e-9) return { result: 'slide', oilT };
  return { result: j.bike.x >= o.x + o.len ? 'clean' : null, oilT };
}

/** Whether this tick decides the obstacle, and how. */
export function judgeObstacle(o: Obstacle, j: Judge): Verdict {
  const none: Verdict = { result: null, oilT: j.oilT };
  switch (o.kind) {
    case 'bump':
      if (!crossed(j, o.x)) return none;
      return { result: j.bike.wheelie >= NEEDS.wheelie || j.bike.v < NEEDS.slowBump ? 'clean' : 'bump', oilT: 0 };
    case 'gate':
      if (!crossed(j, o.x)) return none;
      return { result: j.bike.tuck >= NEEDS.tuck ? 'clean' : 'gate', oilT: 0 };
    case 'oil': return oil(o, j);
    case 'truck':
      if (!crossed(j, o.x)) return none;
      return { result: j.truckT !== null && truckBlocked(j.truckT) ? 'truck' : 'clean', oilT: 0 };
    default: throw new Error(`unhandled: ${o.kind satisfies never}`);
  }
}
