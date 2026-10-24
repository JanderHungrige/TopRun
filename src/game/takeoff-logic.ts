import type { TakeoffRating } from '../data/types';

export type TakeoffPhase = 'spool' | 'catapult' | 'edge' | 'climb' | 'ditched' | 'done';

export interface TakeoffInput {
  throttleHeld: boolean;
  /** A fresh press this tick (edge-triggered). */
  pressed: boolean;
  skip: boolean;
}

export interface TakeoffState {
  phase: TakeoffPhase;
  throttle: number;
  rawThrottle: number;
  greenTime: number;
  t: number;
  clock: number;
  deckPos: number;
  speed: number;
  altitude: number;
  climbRate: number;
  rating: TakeoffRating | null;
  attempts: number;
  overspeed: boolean;
}

export const GREEN_LO = 0.86;
export const GREEN_HI = 0.97;
export const GREEN_HOLD = 1.0;
export const THROTTLE_UP = 0.55;
export const THROTTLE_DOWN = 0.45;
export const DECK_LENGTH = 560;
export const STROKE_TIME = 1.4;
export const PERFECT_PX = 50;
export const GOOD_PX = 150;
export const EDGE_GRACE = 0.7;
export const CLIMB_TIME = 2.2;
const GRAVITY = 260;

export function createTakeoff(attempts = 1): TakeoffState {
  return {
    phase: 'spool', throttle: 0, rawThrottle: 0, greenTime: 0, t: 0, clock: 0, deckPos: 0, speed: 0,
    altitude: 0, climbRate: 0, rating: null, attempts, overspeed: false,
  };
}

/** Deterministic needle wobble so feathering the throttle takes a little skill. */
const jitter = (clock: number): number => Math.sin(clock * 9.1) * 0.012 + Math.sin(clock * 23.7) * 0.008;

function stepSpool(s: TakeoffState, input: TakeoffInput, dt: number): TakeoffState {
  const rate = input.throttleHeld ? THROTTLE_UP : -THROTTLE_DOWN;
  const rawThrottle = Math.min(1, Math.max(0, s.rawThrottle + rate * dt));
  const throttle = Math.min(1, Math.max(0, rawThrottle + (rawThrottle > 0.2 ? jitter(s.clock) : 0)));
  const inGreen = throttle >= GREEN_LO && throttle < GREEN_HI;
  const greenTime = inGreen ? s.greenTime + dt : 0;
  const next = { ...s, rawThrottle, throttle, greenTime, overspeed: throttle >= GREEN_HI };
  if (greenTime >= GREEN_HOLD) return { ...next, phase: 'catapult', t: 0, greenTime: 0 };
  return next;
}

function rateRotation(remaining: number): TakeoffRating {
  if (remaining <= PERFECT_PX) return 'perfect';
  if (remaining <= GOOD_PX) return 'good';
  return 'early';
}

function stepCatapult(s: TakeoffState, input: TakeoffInput): TakeoffState {
  const f = Math.min(1, s.t / STROKE_TIME);
  const deckPos = DECK_LENGTH * f * f;
  const speed = (2 * DECK_LENGTH * f) / STROKE_TIME;
  if (input.pressed) {
    const rating = rateRotation(DECK_LENGTH - deckPos);
    const climbRate = rating === 'early' ? 40 : 160;
    return { ...s, deckPos, speed, phase: 'climb', t: 0, rating, climbRate };
  }
  if (f >= 1) return { ...s, deckPos: DECK_LENGTH, speed, phase: 'edge', t: 0, climbRate: 0 };
  return { ...s, deckPos, speed };
}

function stepEdge(s: TakeoffState, input: TakeoffInput, dt: number): TakeoffState {
  const climbRate = s.climbRate - GRAVITY * dt;
  const altitude = s.altitude + climbRate * dt;
  if (input.pressed && s.t <= EDGE_GRACE) return { ...s, altitude, phase: 'climb', t: 0, rating: 'late', climbRate: 60 };
  if (s.t > EDGE_GRACE) return { ...s, altitude, phase: 'ditched', t: 0, climbRate: 0 };
  return { ...s, altitude, climbRate };
}

function stepClimb(s: TakeoffState, dt: number): TakeoffState {
  const climbRate = Math.min(260, s.climbRate + 220 * dt);
  const altitude = s.altitude + climbRate * dt;
  const speed = s.speed + 120 * dt;
  if (s.t >= CLIMB_TIME) return { ...s, altitude, climbRate, speed, phase: 'done' };
  return { ...s, altitude, climbRate, speed };
}

export function stepTakeoff(state: TakeoffState, input: TakeoffInput, dt: number): TakeoffState {
  if (state.phase === 'done') return state;
  if (input.skip) return { ...state, phase: 'done', rating: 'skipped' };
  const s = { ...state, t: state.t + dt, clock: state.clock + dt };
  switch (s.phase) {
    case 'spool': return stepSpool(s, input, dt);
    case 'catapult': return stepCatapult(s, input);
    case 'edge': return stepEdge(s, input, dt);
    case 'climb': return stepClimb(s, dt);
    case 'ditched': return input.pressed && s.t > 0.8 ? createTakeoff(s.attempts + 1) : s;
    case 'done': return s;
    default: throw new Error(`unhandled: ${s.phase satisfies never}`);
  }
}
