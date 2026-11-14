import type { TakeoffRating } from '../data/types';

// The ramp start (doc 109): the lander's ramp comes down, the countdown lights run, and the pilot holds the revs in the
// green band; on green the brake lets go and the revs at that moment rate the start like the carrier catapult (doc 04).
// Pure state machine; revs 0 … 1.

export type RampPhase = 'ramp' | 'lights' | 'go' | 'done';
export type RampGrade = 'perfect' | 'good' | 'early' | 'late';

export interface RampInput {
  /** Holding the throttle. */
  throttle: boolean;
  skip: boolean;
}

export interface RampState {
  phase: RampPhase;
  t: number;
  revs: number;
  /** Ever touched the throttle (else the start counts as skipped). */
  touched: boolean;
  grade: RampGrade | null;
  rating: TakeoffRating | null;
}

export const RAMP = Object.freeze({
  /** The ramp coming down (s), then the three reds and the green (s after the lights start). */
  ramp: 1.4,
  reds: Object.freeze([0, 0.8, 1.6]),
  green: 2.4,
  /** Revs per second held / let go. */
  rise: 0.75,
  fall: 0.95,
  perfect: Object.freeze([0.7, 0.85]),
  good: Object.freeze([0.55, 0.95]),
  /** The roll-off after green before the mission (s). */
  rollOff: 1.6,
});

export const createRamp = (): RampState => ({ phase: 'ramp', t: 0, revs: 0, touched: false, grade: null, rating: null });

/** The grade for the revs at the green light. */
export function gradeRamp(revs: number): RampGrade {
  const [p0, p1] = RAMP.perfect;
  const [g0, g1] = RAMP.good;
  if (revs >= (p0 ?? 0.7) && revs <= (p1 ?? 0.85)) return 'perfect';
  if (revs >= (g0 ?? 0.55) && revs <= (g1 ?? 0.95)) return 'good';
  return revs > (g1 ?? 0.95) ? 'early' : 'late';
}

/** How many of the three red lights are lit `t` s into the countdown; 4 = green. */
export function lightsLit(t: number): number {
  if (t >= RAMP.green) return 4;
  return RAMP.reds.filter((at) => t >= at).length;
}

const rev = (revs: number, held: boolean, dt: number): number =>
  Math.max(0, Math.min(1, revs + (held ? RAMP.rise : -RAMP.fall) * dt));

export function stepRamp(s: RampState, i: RampInput, dt: number): RampState {
  const n: RampState = { ...s, t: s.t + dt, revs: s.phase === 'go' || s.phase === 'done' ? s.revs : rev(s.revs, i.throttle, dt), touched: s.touched || i.throttle };
  if (i.skip && (s.phase === 'ramp' || s.phase === 'lights')) return { ...n, phase: 'done', rating: 'skipped' };
  switch (s.phase) {
    case 'ramp':
      return n.t >= RAMP.ramp ? { ...n, phase: 'lights', t: 0 } : n;
    case 'lights': {
      if (n.t < RAMP.green) return n;
      const grade = gradeRamp(n.revs);
      return { ...n, phase: 'go', t: 0, grade, rating: n.touched ? grade : 'skipped' };
    }
    case 'go':
      return n.t >= RAMP.rollOff ? { ...n, phase: 'done' } : n;
    case 'done':
      return n;
    default:
      throw new Error(`unhandled: ${s.phase satisfies never}`);
  }
}
