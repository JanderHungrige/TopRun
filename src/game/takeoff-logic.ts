import type { TakeoffRating } from '../data/types';

// Carrier launch (doc 04): Space spools the afterburner, E locks it in the green,
// a 3 s countdown, E launches. Pure state machine.

export type TakeoffPhase = 'spool' | 'locked' | 'ready' | 'catapult' | 'climb' | 'done';

export interface TakeoffInput {
  /** Space / J / ↑ / gamepad A / touch hold. */
  throttleHeld: boolean;
  /** E / gamepad Y / LOCK-LAUNCH button — a fresh press this tick. */
  action: boolean;
  skip: boolean;
}

export interface TakeoffState {
  phase: TakeoffPhase;
  throttle: number;
  rawThrottle: number;
  t: number;
  clock: number;
  countdown: number;
  deckPos: number;
  speed: number;
  altitude: number;
  climbRate: number;
  rating: TakeoffRating | null;
  overspeed: boolean;
  rejected: 'low' | 'high' | null;
  earlyPresses: number;
}

export const GREEN_LO = 0.8;
export const GREEN_HI = 0.97;
export const THROTTLE_UP = 0.5;
export const THROTTLE_BLEED = 0.25;
/** Where a released lever in the red comes to rest: just inside the green. */
export const BLEED_TO = 0.95;
export const COUNTDOWN = 3;
export const PERFECT_REACTION = 0.6;
export const GOOD_REACTION = 1.5;
export const DECK_LENGTH = 560;
export const STROKE_TIME = 1.4;
export const CLIMB_TIME = 2.2;

export function createTakeoff(): TakeoffState {
  return {
    phase: 'spool', throttle: 0, rawThrottle: 0, t: 0, clock: 0, countdown: COUNTDOWN, deckPos: 0, speed: 0,
    altitude: 0, climbRate: 0, rating: null, overspeed: false, rejected: null, earlyPresses: 0,
  };
}

/** Deterministic needle wobble so the gauge feels alive. */
const jitter = (clock: number): number => Math.sin(clock * 9.1) * 0.008 + Math.sin(clock * 23.7) * 0.004;

export const inGreen = (throttle: number): boolean => throttle >= GREEN_LO && throttle < GREEN_HI;

function stepSpool(s: TakeoffState, input: TakeoffInput, dt: number): TakeoffState {
  // Held: rises. Released: stays — except in the red, where it bleeds back into the green.
  const bleed = s.rawThrottle > BLEED_TO ? Math.max(BLEED_TO, s.rawThrottle - THROTTLE_BLEED * dt) : s.rawThrottle;
  const rawThrottle = input.throttleHeld ? Math.min(1, s.rawThrottle + THROTTLE_UP * dt) : bleed;
  const throttle = Math.min(1, Math.max(0, rawThrottle + (rawThrottle > 0.2 ? jitter(s.clock) : 0)));
  const next = { ...s, rawThrottle, throttle, overspeed: throttle >= GREEN_HI };
  if (!input.action) return next;
  if (inGreen(throttle)) return { ...next, phase: 'locked', t: 0, countdown: COUNTDOWN, rejected: null };
  return { ...next, rejected: throttle >= GREEN_HI ? 'high' : 'low' };
}

function stepLocked(s: TakeoffState, input: TakeoffInput): TakeoffState {
  const countdown = Math.max(0, COUNTDOWN - s.t);
  const earlyPresses = s.earlyPresses + (input.action ? 1 : 0);
  if (countdown <= 0) return { ...s, countdown: 0, earlyPresses, phase: 'ready', t: 0 };
  return { ...s, countdown, earlyPresses };
}

export function rateReaction(seconds: number): TakeoffRating {
  if (seconds <= PERFECT_REACTION) return 'perfect';
  if (seconds <= GOOD_REACTION) return 'good';
  return 'late';
}

function stepReady(s: TakeoffState, input: TakeoffInput): TakeoffState {
  if (!input.action) return s;
  return { ...s, phase: 'catapult', rating: rateReaction(s.t), t: 0 };
}

function stepCatapult(s: TakeoffState): TakeoffState {
  const f = Math.min(1, s.t / STROKE_TIME);
  const deckPos = DECK_LENGTH * f * f;
  const speed = (2 * DECK_LENGTH * f) / STROKE_TIME;
  if (f >= 1) return { ...s, deckPos: DECK_LENGTH, speed, phase: 'climb', t: 0, climbRate: 120 };
  return { ...s, deckPos, speed };
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
    case 'locked': return stepLocked(s, input);
    case 'ready': return stepReady(s, input);
    case 'catapult': return stepCatapult(s);
    case 'climb': return stepClimb(s, dt);
    case 'done': return s;
    default: throw new Error(`unhandled: ${s.phase satisfies never}`);
  }
}
