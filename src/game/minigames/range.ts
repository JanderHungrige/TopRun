import { createRng } from '../../core/rng';
import type { Medals } from './core';

// FIRING RANGE (doc 90): a mech's gunnery range in the jungle. Wooden boards pop up behind berms and bushes — enemy
// walkers to shoot, now and then a monkey board to spare — faster and shorter as the minute runs. A hit on a walker
// scores more the quicker it comes and the longer the streak; hitting a monkey costs points and the streak. Pure.

export const RANGE = Object.freeze({ length: 60, rise: 0.15, foe: 100, quick: 60, streak: 10, maxStreak: 10, friend: -150 });
export const RANGE_MEDALS: Medals = { bronze: 5000, silver: 8500, gold: 12000 };

/** Where boards stand (logical px: the board's centre when up) and how big (far boards are smaller). */
export const SPOTS: ReadonlyArray<{ x: number; y: number; s: number }> = Object.freeze([
  { x: 210, y: 300, s: 0.7 }, { x: 470, y: 280, s: 0.6 }, { x: 800, y: 285, s: 0.6 }, { x: 1070, y: 305, s: 0.7 },
  { x: 330, y: 470, s: 1 }, { x: 640, y: 450, s: 0.9 }, { x: 950, y: 470, s: 1 },
]);

export type BoardKind = 'foe' | 'friend';

export interface Board { spot: number; kind: BoardKind; at: number; up: number; hit: boolean }

export interface RangeState {
  t: number;
  boards: Board[];
  next: number;
  points: number;
  streak: number;
  hits: number;
  /** Boards that have popped up so far. */
  spawned: number;
  seed: number;
}

export const createRange = (seed: number): RangeState => ({ t: 0, boards: [], next: 0.8, points: 0, streak: 0, hits: 0, spawned: 0, seed });

/** How long a board stays up and how soon the next comes, at time t: both shrink as the minute runs. */
export const upTime = (t: number): number => 1.9 - (t / RANGE.length) * 0.9;
export const gap = (t: number): number => 0.95 - (t / RANGE.length) * 0.45;

/** A board's half-size at its spot. */
export const boardHalf = (spot: number): { w: number; h: number } => {
  const s = SPOTS[spot]?.s ?? 1;
  return { w: 44 * s, h: 58 * s };
};

/** How far a board has risen (0 hidden … 1 up) at time t. */
export function raised(b: Board, t: number): number {
  const age = t - b.at;
  if (age < 0 || age > b.up + RANGE.rise) return 0;
  return Math.min(1, age / RANGE.rise, (b.up + RANGE.rise - age) / RANGE.rise);
}

function spawn(s: RangeState): RangeState {
  const rng = createRng(s.seed + Math.floor(s.t * 1000));
  const busy = s.boards.filter((b) => s.t - b.at < b.up + RANGE.rise).map((b) => b.spot);
  const free = SPOTS.map((_, i) => i).filter((i) => !busy.includes(i));
  const spot = free[Math.floor(rng.next() * free.length)];
  const next = s.t + gap(s.t);
  if (spot === undefined) return { ...s, next };
  const kind: BoardKind = rng.next() < 0.2 ? 'friend' : 'foe';
  const boards = [...s.boards.filter((b) => s.t - b.at < b.up + RANGE.rise + 1), { spot, kind, at: s.t, up: upTime(s.t), hit: false }];
  return { ...s, next, boards, spawned: s.spawned + 1 };
}

export function stepRange(s: RangeState, dt: number): RangeState {
  const t = Math.min(RANGE.length, s.t + dt);
  const moved = { ...s, t };
  return t >= s.next && t < RANGE.length ? spawn(moved) : moved;
}

export const rangeOver = (s: RangeState): boolean => s.t >= RANGE.length;

export type ShotResult = { kind: 'foe'; points: number } | { kind: 'friend'; points: number } | { kind: 'miss'; points: 0 };

/** A shot at a point: the board up there (the front one first), or a miss. */
export function shoot(s: RangeState, at: { x: number; y: number }): { state: RangeState; result: ShotResult } {
  const order = [...s.boards.keys()].sort((a, b) => (SPOTS[s.boards[b]?.spot ?? 0]?.y ?? 0) - (SPOTS[s.boards[a]?.spot ?? 0]?.y ?? 0));
  for (const i of order) {
    const b = s.boards[i];
    if (!b || b.hit || raised(b, s.t) < 0.6) continue;
    const spot = SPOTS[b.spot];
    const half = boardHalf(b.spot);
    if (!spot || Math.abs(at.x - spot.x) > half.w || Math.abs(at.y - spot.y) > half.h) continue;
    const boards = s.boards.map((x, k) => (k === i ? { ...x, hit: true, up: Math.min(x.up, s.t - x.at + 0.05) } : x));
    if (b.kind === 'friend') return { state: { ...s, boards, points: s.points + RANGE.friend, streak: 0 }, result: { kind: 'friend', points: RANGE.friend } };
    const quick = Math.round(Math.max(0, 1 - (s.t - b.at) / b.up) * RANGE.quick);
    const points = RANGE.foe + quick + Math.min(RANGE.maxStreak, s.streak) * RANGE.streak;
    return { state: { ...s, boards, points: s.points + points, streak: s.streak + 1, hits: s.hits + 1 }, result: { kind: 'foe', points } };
  }
  return { state: { ...s, streak: 0 }, result: { kind: 'miss', points: 0 } };
}
