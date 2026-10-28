import {
  AREA_ROWS, BASE_AREA_IDS, BASE_AREAS, STRIDE_PX, WALK_FRAMES, type BaseAreaId,
} from '../data/base-areas';
import type { Route } from './state';

// Hangar base (doc 30), pure: where each area leads, moving the highlight between areas, hit-testing the
// hotspots and the pilot walking along the floor to the highlighted area.

export type NavDir = 'left' | 'right' | 'up' | 'down';

/** The route an area opens. */
export function areaRoute(id: BaseAreaId): Route {
  switch (id) {
    case 'fun': return { to: 'recRoom' };
    case 'locker': return { to: 'locker' };
    case 'photos': return { to: 'photoWall' };
    case 'ladder': return { to: 'ladder' };
    case 'chalk': return { to: 'chalkboard' };
    case 'exit': return { to: 'map' };
    default: throw new Error(`unhandled: ${id satisfies never}`);
  }
}

const centreX = (id: BaseAreaId): number => {
  const h = BASE_AREAS[id].hot;
  return h.x + h.w / 2;
};

/** The area in a row above (`step` −1) or below (+1) whose centre is nearest in x (a tie: the nearer row), or null. */
function otherRow(id: BaseAreaId, step: -1 | 1): BaseAreaId | null {
  const row = AREA_ROWS.indexOf(BASE_AREAS[id].row);
  let best: BaseAreaId | null = null;
  let bestD = Infinity;
  let bestRows = Infinity;
  for (const other of BASE_AREA_IDS) {
    const rows = (AREA_ROWS.indexOf(BASE_AREAS[other].row) - row) * step;
    if (rows <= 0) continue;
    const d = Math.abs(centreX(other) - centreX(id));
    if (d < bestD || (d === bestD && rows < bestRows)) {
      bestD = d;
      bestRows = rows;
      best = other;
    }
  }
  return best;
}

/**
 * Where the highlight goes from `id`: ← / → one area along the left → right order (clamped at the ends);
 * ↑ / ↓ to the nearest area (by x) in any row above / below. Returns `id` itself when the move goes nowhere.
 */
export function neighbour(id: BaseAreaId, dir: NavDir): BaseAreaId {
  const i = BASE_AREA_IDS.indexOf(id);
  switch (dir) {
    case 'left': return BASE_AREA_IDS[Math.max(0, i - 1)] ?? id;
    case 'right': return BASE_AREA_IDS[Math.min(BASE_AREA_IDS.length - 1, i + 1)] ?? id;
    case 'up': return otherRow(id, -1) ?? id;
    case 'down': return otherRow(id, 1) ?? id;
    default: throw new Error(`unhandled: ${dir satisfies never}`);
  }
}

/** The area whose hotspot contains the point (logical px), if any. */
export function areaAt(p: { x: number; y: number }): BaseAreaId | null {
  for (const id of BASE_AREA_IDS) {
    const r = BASE_AREAS[id].hot;
    if (p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h) return id;
  }
  return null;
}

/** The pilot on the hangar floor. `dist` = floor distance walked so far (drives the walk cycle). */
export interface Walker {
  x: number;
  target: number;
  facing: 1 | -1;
  moving: boolean;
  dist: number;
}

/** A pilot standing at x, facing `facing`. */
export const walkerAt = (x: number, facing: 1 | -1 = 1): Walker => ({ x, target: x, facing, moving: false, dist: 0 });

/** Sends the pilot towards a new floor x (keeps walking from where they are). */
export const walkTo = (w: Walker, target: number): Walker => ({ ...w, target, moving: w.x !== target });

/** Advances the walk by dt at `speed` px/s; stops exactly on the target and faces the way it walked. */
export function stepWalker(w: Walker, dt: number, speed: number): Walker {
  const d = w.target - w.x;
  if (d === 0) return w.moving ? { ...w, moving: false } : w;
  const step = Math.min(Math.abs(d), speed * dt);
  const facing: 1 | -1 = d > 0 ? 1 : -1;
  const x = Math.abs(d) <= step ? w.target : w.x + facing * step;
  return { x, target: w.target, facing, moving: x !== w.target, dist: w.dist + step };
}

/** Whether the pilot stands at the area's spot. */
export const arrivedAt = (w: Walker, id: BaseAreaId): boolean => !w.moving && w.x === BASE_AREAS[id].standX;

/** The walk-cycle key frame (0 … WALK_FRAMES − 1) for the distance walked. */
export function walkFrame(w: Walker): number {
  const f = Math.floor((w.dist / STRIDE_PX) * WALK_FRAMES) % WALK_FRAMES;
  return (f + WALK_FRAMES) % WALK_FRAMES;
}
