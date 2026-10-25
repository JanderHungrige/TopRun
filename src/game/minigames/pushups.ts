import { clamp } from '../../core/math';
import { createRng } from '../../core/rng';
import type { Medals } from './core';

// Push-up Challenge rules (doc 12): alternate LEFT (down) / RIGHT (up), keep each rep in the tempo
// zone, manage stamina, race the rival's seeded schedule for 30 s. Pure and deterministic.

export const PUSHUP_RULES = Object.freeze({
  roundTime: 30,
  /** Clean rep interval (s between completed reps), inclusive. */
  zoneMin: 0.6,
  zoneMax: 0.9,
  staminaMax: 100,
  costClean: 3,
  costSlow: 2,
  /** Extra stamina per second the interval is under zoneMin. */
  fastPenalty: 100,
  regenBase: 1.5,
  regenIdle: 18,
  /** Seconds without a stroke before the fast (idle) recovery kicks in. */
  idleAfter: 0.6,
  burnoutTime: 1.5,
  burnoutStamina: 25,
  rivalMin: 36,
  rivalMax: 40,
  rivalJitter: 0.07,
  rivalFatigue: 0.12,
  rivalEndMin: 29,
  rivalEndMax: 29.8,
});
const R = PUSHUP_RULES;
const EPS = 1e-9;

export const PUSHUP_MEDALS: Readonly<Medals> = Object.freeze({ bronze: 25, silver: 35, gold: 45 });

export type RepRating = 'clean' | 'fast' | 'slow';
export type Winner = 'player' | 'rival' | 'tie';

/** Pressed this tick. */
export interface PushupInput {
  left: boolean;
  right: boolean;
}

export interface LastRep {
  rating: RepRating;
  /** Seconds since the previous rep (or burnout end); null for the first rep after GO. */
  interval: number | null;
  /** Round time of the rep. */
  at: number;
}

export interface PushupState {
  time: number;
  reps: number;
  clean: number;
  /** True after LEFT, waiting for RIGHT. */
  down: boolean;
  stamina: number;
  /** Seconds of burnout left; 0 = can push. */
  burnout: number;
  burnouts: number;
  /** Time of the last completed rep (or the end of the last burnout); null before the first rep. */
  lastRepAt: number | null;
  /** Time of the last accepted stroke (or GO / burnout end), for the idle recovery. */
  lastStrokeAt: number;
  last: LastRep | null;
  /** Clean reps in a row (for the pitch of the rep sound). */
  streak: number;
  /** The rival's rep times, increasing. */
  rival: readonly number[];
  over: boolean;
}

/** The rival's seeded rep times: 36-40 reps, jittered, slowing down, the last at 29.0-29.8 s. */
export function rivalSchedule(seed: number): number[] {
  const rng = createRng(seed ^ 0x5bd1e995);
  const n = rng.int(R.rivalMin, R.rivalMax);
  const gaps = Array.from({ length: n }, (_, i) => (1 + R.rivalFatigue * (i / (n - 1))) * (1 + rng.range(-R.rivalJitter, R.rivalJitter)));
  const total = gaps.reduce((a, b) => a + b, 0);
  const end = rng.range(R.rivalEndMin, R.rivalEndMax);
  let acc = 0;
  return gaps.map((g) => {
    acc += g;
    return (acc / total) * end;
  });
}

export function createPushups(seed: number): PushupState {
  return {
    time: 0, reps: 0, clean: 0, down: false, stamina: R.staminaMax, burnout: 0, burnouts: 0,
    lastRepAt: null, lastStrokeAt: 0, last: null, streak: 0, rival: rivalSchedule(seed), over: false,
  };
}

export function rateRep(interval: number | null): RepRating {
  if (interval === null) return 'clean';
  if (interval < R.zoneMin - EPS) return 'fast';
  if (interval > R.zoneMax + EPS) return 'slow';
  return 'clean';
}

export function repCost(interval: number | null): number {
  const rating = rateRep(interval);
  switch (rating) {
    case 'clean': return R.costClean;
    case 'slow': return R.costSlow;
    case 'fast': return R.costClean + R.fastPenalty * (R.zoneMin - (interval ?? R.zoneMin));
    default: throw new Error(`unhandled: ${rating satisfies never}`);
  }
}

/** Seconds since the last rep or burnout end (the tempo needle); null before the first rep. */
export const tempoClock = (s: PushupState): number | null => (s.lastRepAt === null ? null : s.time - s.lastRepAt);

function completeRep(s: PushupState): PushupState {
  const interval = tempoClock(s);
  const rating = rateRep(interval);
  const stamina = s.stamina - repCost(interval);
  const next: PushupState = {
    ...s, reps: s.reps + 1, clean: s.clean + (rating === 'clean' ? 1 : 0), down: false,
    lastRepAt: s.time, lastStrokeAt: s.time, last: { rating, interval, at: s.time },
    streak: rating === 'clean' ? s.streak + 1 : 0, stamina,
  };
  return stamina <= EPS ? { ...next, stamina: 0, burnout: R.burnoutTime, burnouts: s.burnouts + 1, streak: 0 } : next;
}

function stroke(s: PushupState, input: PushupInput): PushupState {
  if (!s.down && input.left) return { ...s, down: true, lastStrokeAt: s.time };
  if (s.down && input.right) return completeRep(s);
  return s;
}

function recover(s: PushupState, dt: number): PushupState {
  const rate = s.time - s.lastStrokeAt >= R.idleAfter - EPS ? R.regenIdle : R.regenBase;
  return { ...s, stamina: clamp(s.stamina + rate * dt, 0, R.staminaMax) };
}

function stepBurnout(s: PushupState, dt: number): PushupState {
  const left = s.burnout - dt;
  if (left > EPS) return { ...s, burnout: left };
  return { ...s, burnout: 0, stamina: R.burnoutStamina, down: false, lastRepAt: s.time, lastStrokeAt: s.time };
}

/** One fixed tick. Returns a new state; an `over` state is returned unchanged. */
export function stepPushups(s: PushupState, input: PushupInput, dt: number): PushupState {
  if (s.over) return s;
  const time = Math.min(R.roundTime, s.time + dt);
  const ticked: PushupState = { ...s, time };
  let next: PushupState;
  if (s.burnout > 0) next = stepBurnout(ticked, dt);
  else {
    const stroked = stroke(ticked, input);
    next = stroked.burnout > 0 ? stroked : recover(stroked, dt);
  }
  return time >= R.roundTime - EPS ? { ...next, time: R.roundTime, over: true } : next;
}

export function rivalReps(s: PushupState): number {
  let n = 0;
  while (n < s.rival.length && (s.rival[n] ?? Infinity) <= s.time + EPS) n++;
  return n;
}

/** 0..1 through the rival's current rep (0 = up, resting after his last rep). */
export function rivalPhase(s: PushupState): number {
  const n = rivalReps(s);
  const end = s.rival[n];
  if (end === undefined) return 0;
  const start = n === 0 ? 0 : s.rival[n - 1] ?? 0;
  return clamp((s.time - start) / (end - start), 0, 1);
}

export function winner(s: PushupState): Winner {
  const rival = rivalReps(s);
  if (s.reps > rival) return 'player';
  if (s.reps < rival) return 'rival';
  return 'tie';
}
