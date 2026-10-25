import { clamp } from '../../core/math';
import type { Medals } from './core';
import type { Chart } from './piano-chart';

// Piano Bar (doc 23): the round rules — judgement windows, combo and multiplier, score, groove (which band
// layers play), crowd size and the verdict. Pure; one call per fixed tick with the lanes pressed that tick.

export const PIANO_RULES = {
  /** Judgement windows, s (|press − note|). */
  perfect: 0.05,
  good: 0.11,
  points: { perfect: 100, good: 50 },
  /** A press with no note in its lane costs this (the score never drops below 0). */
  wrongCost: 50,
  /** A glissando note scores this many times its points. */
  glissFactor: 2,
  multStep: 10,
  multMax: 4,
  grooveStart: 0.6,
  groove: { perfect: 0.03, good: 0.015, miss: -0.08, wrong: -0.05 },
  /** Groove from which the kit, the upright bass and the crowd claps play. */
  layers: [0.2, 0.4, 0.7],
  /** Pre-roll before the first note and ring-out after the last, s. */
  leadIn: 2,
  tail: 1.5,
  crowdMax: 7,
} as const;

const R = PIANO_RULES;

/** Medal limits (balance playtest in doc 23). */
export const PIANO_MEDALS: Medals = { bronze: 20000, silver: 44000, gold: 66000 };

export type Grade = 'perfect' | 'good';
export type Result = Grade | 'miss';
export type Verdict = 'encore' | 'nice' | 'tough';
export type Lanes = readonly [boolean, boolean, boolean, boolean];

export type PianoEvent =
  | { kind: 'hit'; note: number; grade: Grade; offset: number; points: number; combo: number }
  | { kind: 'miss'; note: number; broke: number }
  | { kind: 'wrong'; lane: number; broke: number };

export interface PianoState {
  /** Song clock, s (starts at −leadIn; 0 = the first note). */
  time: number;
  /** Per chart note: null until judged. */
  results: readonly (Result | null)[];
  /** Index of the first note not yet judged. */
  first: number;
  score: number;
  combo: number;
  maxCombo: number;
  perfect: number;
  good: number;
  miss: number;
  wrong: number;
  /** Band morale 0 … 1. */
  groove: number;
  /** What happened this tick (for sounds and effects). */
  events: readonly PianoEvent[];
  over: boolean;
}

export function judge(offset: number): Grade | null {
  const d = Math.abs(offset);
  if (d <= R.perfect + 1e-9) return 'perfect';
  if (d <= R.good + 1e-9) return 'good';
  return null;
}

export const multiplier = (combo: number): number => Math.min(R.multMax, 1 + Math.floor(combo / R.multStep));

/** The kit, the bass and the claps play from these groove levels: 0 = left hand only … 3 = everyone. */
export const bandLevel = (groove: number): 0 | 1 | 2 | 3 => {
  const n = R.layers.filter((l) => groove >= l - 1e-9).length;
  return n >= 3 ? 3 : n === 2 ? 2 : n === 1 ? 1 : 0;
};

/** Squadmates round the piano: the combo brings them, only a falling groove sends them away. */
export const crowdSize = (s: Pick<PianoState, 'combo' | 'groove'>): number =>
  clamp(Math.max(2 + Math.floor(s.combo / 10), Math.round(s.groove * R.crowdMax)), 2, R.crowdMax);

export const songEnd = (chart: Chart): number => chart.last + R.tail;

export function createPiano(chart: Chart): PianoState {
  return {
    time: -R.leadIn, results: chart.notes.map(() => null), first: 0, score: 0, combo: 0, maxCombo: 0,
    perfect: 0, good: 0, miss: 0, wrong: 0, groove: R.grooveStart, events: [], over: false,
  };
}

interface Draft extends Omit<PianoState, 'results' | 'events'> { results: (Result | null)[]; events: PianoEvent[] }

const nudge = (d: Draft, by: number): void => {
  d.groove = clamp(d.groove + by, 0, 1);
};

function hit(chart: Chart, d: Draft, i: number, grade: Grade, offset: number): void {
  const n = chart.notes[i];
  const points = R.points[grade] * (n?.gliss ? R.glissFactor : 1) * multiplier(d.combo);
  d.results[i] = grade;
  d.score += points;
  d.combo += 1;
  d.maxCombo = Math.max(d.maxCombo, d.combo);
  d[grade] += 1;
  nudge(d, R.groove[grade]);
  d.events.push({ kind: 'hit', note: i, grade, offset, points, combo: d.combo });
}

function press(chart: Chart, d: Draft, lane: number): void {
  for (let i = d.first; i < chart.notes.length; i++) {
    const n = chart.notes[i];
    if (!n || n.t > d.time + R.good + 1e-9) break;
    if (d.results[i] !== null || n.lane !== lane) continue;
    const grade = judge(d.time - n.t);
    if (grade) return hit(chart, d, i, grade, d.time - n.t);
  }
  d.events.push({ kind: 'wrong', lane, broke: d.combo });
  d.combo = 0;
  d.wrong += 1;
  d.score = Math.max(0, d.score - R.wrongCost);
  nudge(d, R.groove.wrong);
}

function missStale(chart: Chart, d: Draft): void {
  for (let i = d.first; i < chart.notes.length; i++) {
    const n = chart.notes[i];
    if (!n || n.t >= d.time - R.good - 1e-9) break;
    if (d.results[i] !== null) continue;
    d.results[i] = 'miss';
    d.events.push({ kind: 'miss', note: i, broke: d.combo });
    d.combo = 0;
    d.miss += 1;
    nudge(d, R.groove.miss);
  }
  while (d.first < chart.notes.length && d.results[d.first] !== null) d.first++;
}

/** One fixed tick: the clock advances, presses are judged, notes that passed unplayed become misses. */
export function stepPiano(chart: Chart, s: PianoState, lanes: Lanes, dt: number): PianoState {
  if (s.over) return s.events.length === 0 ? s : { ...s, events: [] };
  const d: Draft = { ...s, time: s.time + dt, results: [...s.results], events: [] };
  lanes.forEach((on, lane) => {
    if (on) press(chart, d, lane);
  });
  missStale(chart, d);
  d.over = d.time >= songEnd(chart) - 1e-9;
  return d;
}

export function maxScore(chart: Chart): number {
  return chart.notes.reduce((sum, n, i) => sum + R.points.perfect * (n.gliss ? R.glissFactor : 1) * multiplier(i), 0);
}

/** Share of the notes hit (perfect or good). */
export const hitRatio = (chart: Chart, s: Pick<PianoState, 'perfect' | 'good'>): number =>
  chart.notes.length === 0 ? 0 : (s.perfect + s.good) / chart.notes.length;

export function verdict(chart: Chart, s: Pick<PianoState, 'perfect' | 'good'>): Verdict {
  const r = hitRatio(chart, s);
  if (r >= 0.95) return 'encore';
  if (r >= 0.75) return 'nice';
  return 'tough';
}
