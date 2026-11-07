import type { TakeoffRating } from '../data/types';

// The spacecraft's rocket launch (doc 59): a countdown, two stage burns, and the pilot separates each spent stage with
// E; the worse separation rates the launch like the carrier catapult (doc 04). Pure state machine; altitude in km,
// speed in km/s (shown, not simulated precisely).

export type LaunchPhase = 'countdown' | 'burn' | 'spent' | 'orbit' | 'done';
export type SeparationGrade = 'perfect' | 'good' | 'early' | 'late';

export interface LaunchInput {
  /** E / gamepad Y / the SEPARATE button — a fresh press this tick. */
  action: boolean;
  skip: boolean;
}

export interface LaunchState {
  phase: LaunchPhase;
  /** The stage burning or just spent. */
  stage: 1 | 2;
  /** Seconds in the current phase. */
  t: number;
  /** Fuel left in the burning stage, 0–1. */
  fuel: number;
  speed: number;
  alt: number;
  grades: SeparationGrade[];
  rating: TakeoffRating | null;
}

export const LAUNCH = Object.freeze({
  countdown: 3,
  /** Burn time of stage 1 and stage 2, seconds. */
  burn: [4, 3.2] as const,
  /** Acceleration while each stage burns, km/s². */
  accel: [1.4, 2.2] as const,
  perfect: 0.35,
  good: 0.9,
  /** A spent stage drops on its own after this long (late). */
  drop: 2,
  /** Seconds of free flight shown before the mission starts. */
  orbit: 1.5,
});

export const createLaunch = (): LaunchState =>
  ({ phase: 'countdown', stage: 1, t: 0, fuel: 1, speed: 0, alt: 0, grades: [], rating: null });

/** A separation by the time from burnout to the press. */
export function gradeSeparation(sinceBurnout: number): SeparationGrade {
  if (sinceBurnout <= LAUNCH.perfect) return 'perfect';
  return sinceBurnout <= LAUNCH.good ? 'good' : 'late';
}

/** The launch takes the worse separation: early before late before good before perfect. */
export function rateLaunch(grades: readonly SeparationGrade[]): TakeoffRating {
  if (grades.includes('early')) return 'early';
  if (grades.includes('late')) return 'late';
  return grades.includes('good') ? 'good' : 'perfect';
}

/** The spent (or still burning) stage drops: stage 2 ignites, or after stage 2 the ship flies free. */
function separate(s: LaunchState, grade: SeparationGrade): LaunchState {
  const grades = [...s.grades, grade];
  if (s.stage === 1) return { ...s, grades, phase: 'burn', stage: 2, t: 0, fuel: 1 };
  return { ...s, grades, phase: 'orbit', t: 0, fuel: 0, rating: rateLaunch(grades) };
}

const climb = (s: LaunchState, accel: number, dt: number): Pick<LaunchState, 'speed' | 'alt'> => {
  const speed = Math.max(0, s.speed + accel * dt);
  return { speed, alt: s.alt + speed * dt };
};

export function stepLaunch(s: LaunchState, i: LaunchInput, dt: number): LaunchState {
  const n: LaunchState = { ...s, t: s.t + dt };
  if (i.skip && s.phase !== 'orbit' && s.phase !== 'done') return { ...n, phase: 'done', rating: 'skipped' };
  switch (s.phase) {
    case 'countdown':
      return n.t >= LAUNCH.countdown ? { ...n, phase: 'burn', t: 0 } : n;
    case 'burn': {
      const burn = LAUNCH.burn[s.stage - 1];
      const flying = { ...n, ...climb(s, LAUNCH.accel[s.stage - 1], dt), fuel: Math.max(0, 1 - n.t / burn) };
      if (i.action) return separate(flying, 'early');
      return n.t >= burn ? { ...flying, phase: 'spent', t: 0, fuel: 0 } : flying;
    }
    case 'spent': {
      const coasting = { ...n, ...climb(s, -0.4, dt) };
      if (i.action) return separate(coasting, gradeSeparation(s.t));
      return n.t >= LAUNCH.drop ? separate(coasting, 'late') : coasting;
    }
    case 'orbit': {
      const free = { ...n, ...climb(s, 0.6, dt) };
      return free.t >= LAUNCH.orbit ? { ...free, phase: 'done' } : free;
    }
    case 'done':
      return n;
    default:
      throw new Error(`unhandled: ${s.phase satisfies never}`);
  }
}
