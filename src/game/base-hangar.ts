import {
  AREA_ROWS, areaDef, areaIds, BASE_AREAS, PILOT_FLOOR_Y, STRIDE_PX, WALK_FRAMES, type AreaTable, type BaseAreaId,
} from '../data/base-areas';
import type { Route } from './state';

// Hangar base (doc 30), pure: where each area leads, moving the highlight between areas, hit-testing the
// hotspots and the pilot walking along the floor to the highlighted area. The geometry is the look's (doc 73): the
// carrier hangar's unless an area table is given.

type Areas = AreaTable;

export type NavDir = 'left' | 'right' | 'up' | 'down';

/** The route an area opens. */
export function areaRoute(id: BaseAreaId): Route {
  switch (id) {
    case 'fun': return { to: 'recRoom' };
    case 'tv': return { to: 'tapes' };
    case 'locker': return { to: 'locker' };
    case 'photos': return { to: 'photoWall' };
    case 'jet': return { to: 'hangar' };
    case 'base': return { to: 'outpost' };
    case 'lab': return { to: 'lab' };
    case 'ladder': return { to: 'ladder' };
    case 'chalk': return { to: 'chalkboard' };
    case 'exit': return { to: 'map' };
    default: throw new Error(`unhandled: ${id satisfies never}`);
  }
}

const centreX = (id: BaseAreaId, areas: Areas): number => {
  const h = areaDef(areas, id).hot;
  return h.x + h.w / 2;
};

/** The area in a row above (`step` −1) or below (+1) whose centre is nearest in x (a tie: the nearer row), or null. */
function otherRow(id: BaseAreaId, step: -1 | 1, areas: Areas): BaseAreaId | null {
  const row = AREA_ROWS.indexOf(areaDef(areas, id).row);
  let best: BaseAreaId | null = null;
  let bestD = Infinity;
  let bestRows = Infinity;
  for (const other of areaIds(areas)) {
    const rows = (AREA_ROWS.indexOf(areaDef(areas, other).row) - row) * step;
    if (rows <= 0) continue;
    const d = Math.abs(centreX(other, areas) - centreX(id, areas));
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
export function neighbour(id: BaseAreaId, dir: NavDir, areas: Areas = BASE_AREAS): BaseAreaId {
  const ids = areaIds(areas);
  const i = ids.indexOf(id);
  switch (dir) {
    case 'left': return ids[Math.max(0, i - 1)] ?? id;
    case 'right': return ids[Math.min(ids.length - 1, i + 1)] ?? id;
    case 'up': return otherRow(id, -1, areas) ?? id;
    case 'down': return otherRow(id, 1, areas) ?? id;
    default: throw new Error(`unhandled: ${dir satisfies never}`);
  }
}

/** The area whose hotspot contains the point (logical px), if any. Hit-test order: the TV first — it stands in front of
 *  the rec room's doorway (doc 63) — then left to right. */
export function areaAt(p: { x: number; y: number }, areas: Areas = BASE_AREAS): BaseAreaId | null {
  const ids = areaIds(areas);
  for (const id of ['tv' as const, ...ids.filter((id) => id !== 'tv')]) {
    const r = areaDef(areas, id).hot;
    if (p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h) return id;
  }
  return null;
}

/** A floor point (logical px): x, and y the line the feet stand on. */
export type FloorPoint = readonly [number, number];

/**
 * The pilot on the base's floor (docs 30, 92). On most looks the pilot walks the front line (PILOT_FLOOR_Y); a look with
 * depth gives areas spots deeper in the room, reached up a free lane (`via`). `path`: the points still ahead; `lane`: the
 * x of the lane the pilot is standing up (or walking) in, the way back to the front line; `dist`: the floor distance
 * walked so far (drives the walk cycle).
 */
export interface Walker {
  x: number;
  y: number;
  /** The walk's last point. */
  target: number;
  targetY: number;
  path: readonly FloorPoint[];
  lane: number;
  facing: 1 | -1;
  moving: boolean;
  dist: number;
}

/** Steps into and out of the room look slower than sideways ones. */
const DEPTH_PACE = 0.5;

/** A pilot standing at x (on the front line unless `y` is given), facing `facing`. */
export const walkerAt = (x: number, facing: 1 | -1 = 1, y: number = PILOT_FLOOR_Y, lane = x): Walker =>
  ({ x, y, target: x, targetY: y, path: [], lane, facing, moving: false, dist: 0 });

/** The points from the walker to (x, y) entered from the front line up the lane `via`: straight across when the walker
 *  is on that row deeper in the room already (spots on one row share free floor, the docks' back wall), else back down
 *  its own lane first when it stands deeper, unless both spots share the lane. */
function route(w: Walker, x: number, y: number, via: number): FloorPoint[] {
  const pts: FloorPoint[] = [];
  if (w.y !== PILOT_FLOOR_Y && w.y === y && w.y === w.targetY) pts.push([x, y]);
  else if (w.y !== PILOT_FLOOR_Y && w.lane === via) pts.push([via, w.y], [via, y]);
  else {
    if (w.y !== PILOT_FLOOR_Y) pts.push([w.lane, w.y], [w.lane, PILOT_FLOOR_Y]);
    pts.push([via, PILOT_FLOOR_Y], [via, y]);
  }
  pts.push([x, y]);
  return pts.filter(([px, py], i) => {
    const [qx, qy] = i === 0 ? [w.x, w.y] : (pts[i - 1] ?? [w.x, w.y]);
    return px !== qx || py !== qy;
  });
}

/** Sends the pilot towards a spot (keeps walking from where they are); on the front line unless `y` is deeper. */
export function walkTo(w: Walker, x: number, y: number = PILOT_FLOOR_Y, via: number = x): Walker {
  const path = route(w, x, y, via);
  return { ...w, target: x, targetY: y, path, lane: y === PILOT_FLOOR_Y ? w.lane : via, moving: path.length > 0 };
}

/** Advances the walk by dt at `speed` px/s (into the room at half pace); faces the way it walks sideways; stops exactly. */
export function stepWalker(w: Walker, dt: number, speed: number): Walker {
  const next = w.path[0];
  if (!next) return w.moving ? { ...w, moving: false } : w;
  const [tx, ty] = next;
  const sideways = tx !== w.x;
  const d = sideways ? tx - w.x : ty - w.y;
  const step = Math.min(Math.abs(d), speed * (sideways ? 1 : DEPTH_PACE) * dt);
  const done = Math.abs(d) <= step;
  const x = sideways ? (done ? tx : w.x + Math.sign(d) * step) : w.x;
  const y = sideways ? w.y : done ? ty : w.y + Math.sign(d) * step;
  const path = done ? w.path.slice(1) : w.path;
  const facing: 1 | -1 = sideways ? (d > 0 ? 1 : -1) : w.facing;
  return { ...w, x, y, path, facing, moving: path.length > 0, dist: w.dist + step };
}

/** Whether the pilot stands at the area's spot. */
export function arrivedAt(w: Walker, id: BaseAreaId, areas: Areas = BASE_AREAS): boolean {
  const a = areaDef(areas, id);
  return !w.moving && w.x === a.standX && w.y === (a.standY ?? PILOT_FLOOR_Y);
}

/** A pilot standing at an area's spot. */
export function walkerAtArea(id: BaseAreaId, areas: Areas, facing: 1 | -1 = 1): Walker {
  const a = areaDef(areas, id);
  return walkerAt(a.standX, facing, a.standY ?? PILOT_FLOOR_Y, a.via ?? a.standX);
}

/** Sends the pilot to an area's spot, up its lane when it lies deeper in the room (doc 92). */
export function walkToArea(w: Walker, id: BaseAreaId, areas: Areas): Walker {
  const a = areaDef(areas, id);
  return walkTo(w, a.standX, a.standY ?? PILOT_FLOOR_Y, a.via ?? a.standX);
}

/** The walk-cycle key frame (0 … WALK_FRAMES − 1) for the distance walked. */
export function walkFrame(w: Walker): number {
  const f = Math.floor((w.dist / STRIDE_PX) * WALK_FRAMES) % WALK_FRAMES;
  return (f + WALK_FRAMES) % WALK_FRAMES;
}
