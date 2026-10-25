import type { Vec } from '../../core/math';
import type { Geo, MoveId, Range } from '../../game/minigames/tactics-moves';

// Dogfight Tactics (doc 19): where the two jets sit in the whiteboard sketch for a situation, and the plan-view
// path each manoeuvre draws (board coordinates). Heading 0 = up, clockwise positive (as in the missions).

export interface Pose {
  x: number;
  y: number;
  h: number;
}

/** The sketch area on the board. */
export const SKETCH = { x: 48, y: 176, w: 596, h: 292, cx: 342, cy: 326 } as const;
const DIST: Readonly<Record<Range, number>> = { 0: 128, 1: 188, 2: 250 };

const fwd = (h: number): Vec => ({ x: Math.sin(h), y: -Math.cos(h) });
const side = (h: number): Vec => ({ x: Math.cos(h), y: Math.sin(h) });

export function posesFor(geo: Geo, range: Range): { you: Pose; him: Pose } {
  const d = DIST[range];
  const { cx, cy } = SKETCH;
  const h = 1.15;
  const f = fwd(h);
  const back = { x: cx - (f.x * d) / 2 - 10, y: cy - (f.y * d) / 2 - 14 };
  const front = { x: cx + (f.x * d) / 2, y: cy + (f.y * d) / 2 };
  switch (geo) {
    case 'offensive': return { you: { ...back, h }, him: { ...front, h: h + 0.35 } };
    case 'defensive': return { him: { ...back, h }, you: { ...front, h: h + 0.35 } };
    case 'merge': return { you: { x: cx - d / 2, y: cy + 34, h: Math.PI / 2 }, him: { x: cx + d / 2, y: cy - 34, h: -Math.PI / 2 } };
    case 'abeam': return { you: { x: cx - 46, y: cy + 40, h: 0.12 }, him: { x: cx + 46, y: cy + 22, h: -0.12 } };
    default: throw new Error(`unhandled: ${geo satisfies never}`);
  }
}

const wrap = (a: number): number => Math.atan2(Math.sin(a), Math.cos(a));
export const lerpPose = (a: Pose, b: Pose, k: number): Pose => ({
  x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k, h: a.h + wrap(b.h - a.h) * k,
});

/** Local shape: (l, f) = lateral towards the other jet, forward. */
type Shape = (t: number) => [number, number];

const arc = (r: number, sweep: number): Shape => (t) => [r - r * Math.cos(t * sweep), r * Math.sin(t * sweep)];
const reversal = (lead: number, r: number, away: number): Shape => (t) => {
  const a = lead / (lead + Math.PI * r + 60);
  const b = (lead + Math.PI * r) / (lead + Math.PI * r + 60);
  if (t <= a) return [0, (t / a) * lead];
  if (t <= b) {
    const th = ((t - a) / (b - a)) * Math.PI;
    return [away * (r - r * Math.cos(th)), lead + r * Math.sin(th)];
  }
  return [away * 2 * r, lead - ((t - b) / (1 - b)) * 60];
};

type ShapeMove = 'break' | 'leadTurn' | 'scissors' | 'extend' | 'splitS' | 'immelmann';
type PursuitMove = 'leadPursuit' | 'lagPursuit' | 'highYoyo' | 'lowYoyo';

const SHAPES: Readonly<Record<ShapeMove, Shape>> = {
  break: arc(34, Math.PI * 1.3),
  leadTurn: arc(62, Math.PI * 0.8),
  scissors: (t) => [26 * Math.sin(t * Math.PI * 3.2) * (0.6 + 0.4 * t), 112 * (1 - (1 - t) ** 1.6)],
  extend: (t) => [-12 * t * t, 140 * t],
  splitS: reversal(26, 20, -1),
  immelmann: reversal(56, 14, 1),
};

function bezier(a: Vec, c: Vec, b: Vec, n = 22): Vec[] {
  const out: Vec[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const u = 1 - t;
    out.push({ x: u * u * a.x + 2 * u * t * c.x + t * t * b.x, y: u * u * a.y + 2 * u * t * c.y + t * t * b.y });
  }
  return out;
}

function pursuit(move: PursuitMove, self: Pose, other: Pose): Vec[] {
  const fo = fwd(other.h);
  const fs = fwd(self.h);
  const mid = { x: (self.x + other.x) / 2, y: (self.y + other.y) / 2 };
  const out = side(self.h);
  const s = (other.x - self.x) * out.x + (other.y - self.y) * out.y >= 0 ? 1 : -1;
  const d = Math.hypot(other.x - self.x, other.y - self.y);
  switch (move) {
    case 'leadPursuit': return bezier(self, { x: self.x + fs.x * d * 0.5, y: self.y + fs.y * d * 0.5 }, { x: other.x + fo.x * 46, y: other.y + fo.y * 46 });
    case 'lagPursuit': return bezier(self, { x: self.x + fs.x * d * 0.45, y: self.y + fs.y * d * 0.45 }, { x: other.x - fo.x * 54, y: other.y - fo.y * 54 });
    case 'highYoyo': return bezier(self, { x: mid.x - out.x * s * 70, y: mid.y - out.y * s * 70 }, { x: other.x - fo.x * 36, y: other.y - fo.y * 36 });
    case 'lowYoyo': return bezier(self, { x: mid.x + out.x * s * 36, y: mid.y + out.y * s * 36 }, { x: other.x - fo.x * 12, y: other.y - fo.y * 12 });
    default: throw new Error(`unhandled: ${move satisfies never}`);
  }
}

/** The plan-view path of `move` flown from `self` (board coordinates). */
export function manoeuvrePath(move: MoveId, self: Pose, other: Pose): Vec[] {
  switch (move) {
    case 'leadPursuit':
    case 'lagPursuit':
    case 'highYoyo':
    case 'lowYoyo': return pursuit(move, self, other);
    case 'break':
    case 'leadTurn':
    case 'scissors':
    case 'extend':
    case 'splitS':
    case 'immelmann': return shaped(SHAPES[move], self, other);
    default: throw new Error(`unhandled: ${move satisfies never}`);
  }
}

function shaped(shape: Shape, self: Pose, other: Pose): Vec[] {
  const f = fwd(self.h);
  const r = side(self.h);
  const s = (other.x - self.x) * r.x + (other.y - self.y) * r.y >= 0 ? 1 : -1;
  const pts: Vec[] = [];
  for (let i = 0; i <= 28; i++) {
    const [l, fw] = shape(i / 28);
    pts.push({ x: self.x + r.x * l * s + f.x * fw, y: self.y + r.y * l * s + f.y * fw });
  }
  return pts;
}

/** Vertical manoeuvres get an altitude arrow at their apex. */
export function altitudeMark(move: MoveId): 'up' | 'down' | null {
  switch (move) {
    case 'immelmann':
    case 'highYoyo': return 'up';
    case 'splitS':
    case 'lowYoyo': return 'down';
    case 'break':
    case 'scissors':
    case 'extend':
    case 'leadPursuit':
    case 'lagPursuit':
    case 'leadTurn': return null;
    default: throw new Error(`unhandled: ${move satisfies never}`);
  }
}
