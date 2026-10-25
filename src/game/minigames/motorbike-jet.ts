import { clamp } from '../../core/math';

// Motorbike vs. Jet (doc 22): Duke's take-off roll — the same schedule every race, a function of race time only.
// x is the jet's nose from the start line (m); it lifts off when the nose reaches the lift-off marker. Pure.

export interface JetPhase {
  /** Race time this phase lasts until (s). */
  until: number;
  /** Acceleration during the phase (m/s²). */
  a: number;
}

/** Rolling start: at GO Duke's nose passes the start line at this speed (m/s). */
export const JET_V0 = 16;
/** Military power, easing off to let the bike lead (Duke toys with you), then the afterburner from 25 s. */
export const JET_PHASES: readonly JetPhase[] = [
  { until: 12, a: 4.1 },
  { until: 25, a: 0.6 },
  { until: Infinity, a: 2.8 },
];
/** When Duke lights the afterburner. */
export const BURNER_AT = 25;
/** The lift-off marker (m from the start line). */
export const LIFTOFF_X = 2050;
/** Seconds of rotation (nose coming up) before the wheels leave the ground, and the pitch it reaches. */
export const ROTATE_TIME = 1.5;
export const ROTATE_PITCH = 0.16;
export const CLIMB_PITCH = 0.22;
/**
 * Climb-out (after the race is decided, visual only): height (m) = CLIMB·τ², extra afterburner acceleration
 * CLIMB_ACCEL so the jet roars past a bike that won, gear up between GEAR_UP and GEAR_UP + 1.5 s after lift-off.
 */
export const CLIMB = 3;
export const CLIMB_ACCEL = 22;
export const GEAR_UP = 1;

export interface JetState {
  x: number;
  v: number;
  /** Height of the main gear above the runway (m). */
  alt: number;
  /** Radians, nose up. */
  pitch: number;
  /** 1 = gear down … 0 = retracted. */
  gear: number;
}

/** Nose position and speed on the roll at race time t (continues past lift-off). */
export function jetRoll(t: number): { x: number; v: number } {
  let x = 0;
  let v = JET_V0;
  let from = 0;
  for (const p of JET_PHASES) {
    const d = Math.min(t, p.until) - from;
    if (d <= 0) break;
    x += v * d + 0.5 * p.a * d * d;
    v += p.a * d;
    from = p.until;
  }
  return { x, v };
}

/** Race time at which the nose reaches x (bisection on the monotonic roll). */
export function jetTimeAt(x: number): number {
  let lo = 0;
  let hi = 120;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (jetRoll(mid).x < x) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

/** The moment the wheels leave the ground. */
export const LIFTOFF_T = jetTimeAt(LIFTOFF_X);
export const LIFTOFF_V = jetRoll(LIFTOFF_T).v;

export function jetAt(t: number): JetState {
  const { x, v } = jetRoll(t);
  const tau = t - LIFTOFF_T;
  if (tau <= 0) {
    const rot = clamp((t - (LIFTOFF_T - ROTATE_TIME)) / ROTATE_TIME, 0, 1);
    return { x, v, alt: 0, pitch: rot * rot * ROTATE_PITCH, gear: 1 };
  }
  const pitch = ROTATE_PITCH + (CLIMB_PITCH - ROTATE_PITCH) * clamp(tau / 1.2, 0, 1);
  return {
    x: x + 0.5 * CLIMB_ACCEL * tau * tau, v: v + CLIMB_ACCEL * tau, alt: CLIMB * tau * tau, pitch,
    gear: 1 - clamp((tau - GEAR_UP) / 1.5, 0, 1),
  };
}
