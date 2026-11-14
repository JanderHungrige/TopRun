import { createRng } from '../core/rng';
import type { MissionDef } from '../data/types';

// The field of a defence (doc 106), pure and the same every time for a mission: the lanes the invasion marches down from
// the top edge to the outpost's gates, and the build pads beside them. Playfield-local (640 × 720).

export interface Point { x: number; y: number }
export interface Lane { points: readonly Point[]; gateX: number; length: number }
export interface DefenceLayout { lanes: readonly Lane[]; pads: readonly Point[] }

/** Where the outpost's wall starts (y) and the field the lanes and pads keep to. */
export const OUTPOST_Y = 628;
const TOP = -40;
const SEGMENTS = 9;
const W = 640;

/** One lane on the first defence, two up to the Red Badlands' end, three on the last two theaters (doc 106). */
export const laneCount = (n: number): number => (n <= 182 ? 1 : n <= 198 ? 2 : 3);

const PADS: Readonly<Record<number, number>> = { 1: 8, 2: 10, 3: 12 };
const AMPLITUDE: Readonly<Record<number, number>> = { 1: 150, 2: 85, 3: 58 };

function lane(gateX: number, amp: number, freq: number, phase: number): Lane {
  const points: Point[] = [];
  for (let k = 0; k <= SEGMENTS; k++) {
    const y = TOP + (k * (OUTPOST_Y - TOP)) / SEGMENTS;
    const fade = k === SEGMENTS ? 0 : 1 - (k / SEGMENTS) * 0.35; // the lanes straighten toward their gate
    const x = gateX + amp * fade * Math.sin(k * freq + phase);
    points.push({ x: Math.round(Math.max(70, Math.min(W - 70, x))), y: Math.round(y) });
  }
  let length = 0;
  for (let k = 1; k < points.length; k++) length += dist(points[k - 1]!, points[k]!);
  return { points, gateX, length };
}

const dist = (a: Point, b: Point): number => Math.hypot(a.x - b.x, a.y - b.y);

/** The point `s` px down a lane and the heading there (rad, 0 = down the screen). */
export function pointOnLane(l: Lane, s: number): { x: number; y: number; heading: number } {
  let left = Math.max(0, s);
  for (let k = 1; k < l.points.length; k++) {
    const a = l.points[k - 1]!;
    const b = l.points[k]!;
    const d = dist(a, b);
    if (left <= d || k === l.points.length - 1) {
      const u = d > 0 ? Math.min(1, left / d) : 1;
      return { x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u, heading: Math.atan2(-(b.x - a.x), b.y - a.y) };
    }
    left -= d;
  }
  const last = l.points[l.points.length - 1]!;
  return { x: last.x, y: last.y, heading: 0 };
}

/** Distance from a point to a lane's path. */
export function distToLane(p: Point, l: Lane): number {
  let best = Infinity;
  for (let k = 1; k < l.points.length; k++) {
    const a = l.points[k - 1]!;
    const b = l.points[k]!;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const u = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy || 1)));
    best = Math.min(best, Math.hypot(p.x - (a.x + dx * u), p.y - (a.y + dy * u)));
  }
  return best;
}

/** `n` pads beside the lanes: off every lane, not on top of each other, inside the field. */
export function buildPads(lanes: readonly Lane[], n: number, seed: number): Point[] {
  const rng = createRng(seed);
  const spots: Point[] = [];
  for (const l of lanes) {
    for (let k = 1; k < l.points.length - 1; k++) {
      const a = l.points[k]!;
      const b = l.points[k + 1]!;
      const len = dist(a, b) || 1;
      const nx = -(b.y - a.y) / len;
      const ny = (b.x - a.x) / len;
      for (const side of [-1, 1]) {
        const off = 58 + rng.next() * 18;
        spots.push({ x: Math.round((a.x + b.x) / 2 + nx * off * side), y: Math.round((a.y + b.y) / 2 + ny * off * side) });
      }
    }
  }
  const order = spots.map((p) => ({ p, key: rng.next() })).sort((u, v) => u.key - v.key).map((x) => x.p);
  const pads: Point[] = [];
  for (const p of order) {
    if (pads.length >= n) break;
    if (p.x < 40 || p.x > W - 40 || p.y < 120 || p.y > 580) continue;
    if (lanes.some((l) => distToLane(p, l) < 45)) continue;
    if (pads.some((q) => dist(p, q) < 90)) continue;
    pads.push(p);
  }
  return pads;
}

export function defenceLayout(m: MissionDef): DefenceLayout {
  const count = laneCount(m.number);
  const rng = createRng(m.number * 97 + 13);
  const lanes = Array.from({ length: count }, (_, i) =>
    lane(Math.round((W * (i + 1)) / (count + 1)), AMPLITUDE[count] ?? 60, 0.7 + rng.next() * 0.5, rng.next() * Math.PI * 2));
  return { lanes, pads: buildPads(lanes, PADS[count] ?? 10, m.number * 31 + 5) };
}
