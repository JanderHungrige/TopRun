import type { Medals } from './core';

// High Five (doc 42): eight reps, each with three beats — JUMP, UP HIGH, DOWN LOW — at fixed fractions of a rep
// that gets shorter every time; one button judged against the next open beat. Pure: a state and a step function
// on the round's own clock.

export type BeatKind = 'jump' | 'high' | 'low';
export type Verdict = 'perfect' | 'good' | 'miss';

export const HIGH_FIVE = Object.freeze({
  reps: 8,
  /** Rep length: first − step × rep (s). */
  first: 2.6,
  step: 0.14,
  /** Beats and the landing as fractions of a rep. */
  beats: Object.freeze({ jump: 0.42, high: 0.57, low: 0.8 }),
  land: 0.72,
  /** Judging windows (s). */
  perfect: 0.06,
  good: 0.14,
  /** A press earlier than this before the next beat is ignored. */
  ignore: 0.3,
  points: Object.freeze({ perfect: 100, good: 60, miss: 0 }),
});

export const HIGHFIVE_MEDALS: Medals = { bronze: 1200, silver: 1700, gold: 2100 };

const KINDS: readonly BeatKind[] = ['jump', 'high', 'low'];

export const repDuration = (rep: number): number => HIGH_FIVE.first - HIGH_FIVE.step * rep;

/** When rep `rep` starts (s from the round's start). */
export function repStart(rep: number): number {
  let t = 0;
  for (let r = 0; r < rep; r++) t += repDuration(r);
  return t;
}

export const totalTime = (): number => repStart(HIGH_FIVE.reps);

export interface Beat { rep: number; kind: BeatKind; at: number }

/** All 24 beats in order. */
export function beatTimes(): Beat[] {
  return Array.from({ length: HIGH_FIVE.reps }, (_, rep) =>
    KINDS.map((kind) => ({ rep, kind, at: repStart(rep) + HIGH_FIVE.beats[kind] * repDuration(rep) }))).flat();
}

/** The rep a moment falls in and the fraction 0 … 1 into it (the last rep holds after the end). */
export function repAt(t: number): { rep: number; f: number } {
  let start = 0;
  for (let rep = 0; rep < HIGH_FIVE.reps; rep++) {
    const d = repDuration(rep);
    if (t < start + d || rep === HIGH_FIVE.reps - 1) return { rep, f: Math.max(0, Math.min(1, (t - start) / d)) };
    start += d;
  }
  return { rep: HIGH_FIVE.reps - 1, f: 1 };
}

export interface HighFiveState {
  /** Round clock (s). */
  t: number;
  /** Index of the next open beat (24 = all judged). */
  next: number;
  verdicts: Verdict[];
  points: number;
}

export const createHighFive = (): HighFiveState => ({ t: 0, next: 0, verdicts: [], points: 0 });

export interface StepResult { state: HighFiveState; judged: { beat: Beat; verdict: Verdict } | null }

const BEATS = beatTimes();

function judge(s: HighFiveState, beat: Beat, verdict: Verdict): StepResult {
  const state = { ...s, next: s.next + 1, verdicts: [...s.verdicts, verdict], points: s.points + HIGH_FIVE.points[verdict] };
  return { state, judged: { beat, verdict } };
}

/** One tick: the clock runs on; a press is judged against the next open beat; a beat left too long is missed. */
export function stepHighFive(s: HighFiveState, dt: number, pressed: boolean): StepResult {
  const state = { ...s, t: s.t + dt };
  const beat = BEATS[state.next];
  if (!beat) return { state, judged: null };
  const delta = state.t - beat.at;
  if (pressed && delta >= -HIGH_FIVE.ignore) {
    const off = Math.abs(delta);
    return judge(state, beat, off <= HIGH_FIVE.perfect ? 'perfect' : off <= HIGH_FIVE.good ? 'good' : 'miss');
  }
  if (delta > HIGH_FIVE.good) return judge(state, beat, 'miss');
  return { state, judged: null };
}

/** True once every beat is judged and the last rep has run out. */
export const highFiveOver = (s: HighFiveState): boolean => s.next >= BEATS.length && s.t >= totalTime();
