import { createRng, type Rng } from '../../core/rng';
import type { Medals } from './core';

// SONAR HUNT (doc 88): an enemy sub hides somewhere on a 10 × 7 grid of dark sea. A ping from any cell returns an echo
// ring as far out as the sub is; where the rings cross, it is. A torpedo on the right cell sinks it. Five subs, eight
// torpedoes; from the third sub on, the sub slips one cell away after every third ping. Pure.

export const SONAR_GRID = Object.freeze({ w: 10, h: 7 });
export const SONAR_RULES = Object.freeze({ subs: 5, torpedoes: 8, perSub: 120, perPing: 10, perMiss: 25, least: 20, slipFrom: 2, slipEvery: 3 });
export const SONAR_MEDALS: Medals = { bronze: 260, silver: 400, gold: 500 };

export interface Cell { x: number; y: number }
export interface Ping { at: Cell; range: number }

export interface SonarState {
  sub: Cell;
  /** Subs sunk so far (the one hunted now is number `sunk`). */
  sunk: number;
  torpedoes: number;
  pings: Ping[];
  /** Pings and misses on the sub hunted now. */
  pingsNow: number;
  missesNow: number;
  points: number;
  seed: number;
  /** The sub slipped away after the last ping. */
  slipped: boolean;
  over: boolean;
}

export type SonarEvent = 'ping' | 'miss' | 'sunk' | 'empty';

/** Straight-line distance in cells. */
export const distance = (a: Cell, b: Cell): number => Math.hypot(a.x - b.x, a.y - b.y);

function place(rng: Rng): Cell {
  return { x: Math.floor(rng.next() * SONAR_GRID.w), y: Math.floor(rng.next() * SONAR_GRID.h) };
}

export function createSonar(seed: number): SonarState {
  const rng = createRng(seed);
  return { sub: place(rng), sunk: 0, torpedoes: SONAR_RULES.torpedoes, pings: [], pingsNow: 0, missesNow: 0, points: 0, seed: seed + 1, slipped: false, over: false };
}

/** The sub's next hiding place: one step to a neighbouring cell inside the grid. */
function slip(sub: Cell, seed: number): Cell {
  const rng = createRng(seed);
  const steps = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dy]) => {
    const x = sub.x + (dx ?? 0);
    const y = sub.y + (dy ?? 0);
    return x >= 0 && y >= 0 && x < SONAR_GRID.w && y < SONAR_GRID.h;
  });
  const [dx, dy] = steps[Math.floor(rng.next() * steps.length)] ?? [0, 0];
  return { x: sub.x + (dx ?? 0), y: sub.y + (dy ?? 0) };
}

/** A ping at a cell: its echo ring's range; from the third sub on, every third ping the sub slips away. */
export function ping(s: SonarState, at: Cell): { state: SonarState; event: SonarEvent } {
  if (s.over) return { state: s, event: 'empty' };
  const pingsNow = s.pingsNow + 1;
  const slips = s.sunk >= SONAR_RULES.slipFrom && pingsNow % SONAR_RULES.slipEvery === 0;
  const pings = [...s.pings, { at, range: distance(at, s.sub) }].slice(-4);
  const sub = slips ? slip(s.sub, s.seed + pingsNow) : s.sub;
  return { state: { ...s, pings: slips ? [] : pings, pingsNow, sub, slipped: slips }, event: 'ping' };
}

/** Points for a sub: the base less the pings beyond the first and the misses, never below the floor. */
export const subPoints = (pings: number, misses: number): number =>
  Math.max(SONAR_RULES.least, SONAR_RULES.perSub - Math.max(0, pings - 1) * SONAR_RULES.perPing - misses * SONAR_RULES.perMiss);

/** A torpedo at a cell: sinks the sub there, else a miss; the hunt ends with the fifth sub or the last torpedo. */
export function torpedo(s: SonarState, at: Cell): { state: SonarState; event: SonarEvent } {
  if (s.over || s.torpedoes <= 0) return { state: s, event: 'empty' };
  const torpedoes = s.torpedoes - 1;
  if (at.x !== s.sub.x || at.y !== s.sub.y) {
    return { state: { ...s, torpedoes, missesNow: s.missesNow + 1, over: torpedoes <= 0, slipped: false }, event: 'miss' };
  }
  const points = s.points + subPoints(s.pingsNow, s.missesNow);
  const sunk = s.sunk + 1;
  const rng = createRng(s.seed + sunk * 97);
  const next: SonarState = {
    ...s, sub: place(rng), sunk, torpedoes: torpedoes + 1, pings: [], pingsNow: 0, missesNow: 0, points, seed: s.seed + 13, slipped: false,
    over: sunk >= SONAR_RULES.subs,
  };
  return { state: next, event: 'sunk' };
}
