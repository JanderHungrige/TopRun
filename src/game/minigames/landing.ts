import { clamp } from '../../core/math';
import type { Medals } from './core';
import { airAt, createSea, deckY, DECK, gustAt, passStart, type SeaState } from './landing-deck';
import { ballOf, flyJet, KNOTS_PER_MS, LANDING_RULES as R, type FlightCmd, type LandingJet } from './landing-flight';
import { addSample, gradeTrap, mainFault, NO_STATS, POINTS, quality, type FaultNote, type Grade, type PassStats } from './landing-grade';

// Carrier Landing rules (doc 18): three night passes at the carrier. Fly the ball (glide path), stay on the
// centreline and on speed; Paddles waves off a dangerous pass, the hook catches a wire or the jet bolters, and
// every pass is graded. Landing frame in metres (x right, y up, z forward from the ramp). Pure and deterministic.

export { aoaOf, ballOf, KNOTS_PER_MS, LANDING_RULES, type AoaState, type LandingJet } from './landing-flight';

const RAD = Math.PI / 180;

export const LANDING_MEDALS: Readonly<Medals> = Object.freeze({ bronze: 6, silver: 9, gold: 11 });

export type LandingPhase = 'approach' | 'trap' | 'bolter' | 'waveoff' | 'graded' | 'over';
export type BolterReason = 'long' | 'fast';
export type WaveoffReason = 'low' | 'lineup';
export type Outcome =
  | { kind: 'trap'; wire: number }
  | { kind: 'bolter'; reason: BolterReason }
  | { kind: 'waveoff'; reason: WaveoffReason };

export interface PassResult {
  pass: number;
  outcome: Outcome;
  grade: Grade;
  points: number;
  note: FaultNote | null;
  /** Approach quality (0 = perfect). */
  q: number;
}

export type LandingEventKind = 'trap' | 'bolter' | 'waveoff' | 'graded' | 'pass' | 'over';
export interface LandingEvent {
  kind: LandingEventKind;
  pass: number;
  t: number;
}

/** Stick and throttle, plus next = skip the grade card. */
export interface LandingInput extends FlightCmd {
  next: boolean;
}

export interface LandingState {
  seed: number;
  /** Deck motion and gust scale: 1 in the game, 0 = flat calm (reference pilots). */
  motion: number;
  pass: number;
  sea: SeaState;
  t: number;
  passT: number;
  phase: LandingPhase;
  phaseT: number;
  jet: LandingJet;
  /** Ball position (balls, high = +). */
  ball: number;
  stats: PassStats;
  /** This pass's result from the outcome until its grade card. */
  pending: PassResult | null;
  results: readonly PassResult[];
  event: LandingEvent | null;
  events: number;
}

/** The first wire at or past the touchdown point (1–4), or null past the 4-wire. */
export function wireFor(z: number): number | null {
  const i = DECK.wires.findIndex((w) => w >= z);
  return i < 0 ? null : i + 1;
}

export function judgeTouchdown(z: number, dv: number): Outcome {
  if (dv > R.skipFast) return { kind: 'bolter', reason: 'fast' };
  const wire = wireFor(z);
  return wire === null ? { kind: 'bolter', reason: 'long' } : { kind: 'trap', wire };
}

export const landingScore = (s: LandingState): number => s.results.reduce((a, r) => a + r.points, 0);

function passJet(seed: number, pass: number, sea: SeaState): LandingJet {
  const p = passStart(seed, pass);
  const y = deckY(sea, DECK.target, 0) + R.startRange * Math.tan((R.glide + p.ball * R.ball) * RAD);
  const gamma = (-R.glide + p.gammaOff) * RAD;
  const v = R.speed + p.dv;
  return { x: p.x, y, z: DECK.target - R.startRange, gamma, q: 0, vxa: DECK.drift, dv: p.dv, engine: R.trim, vy: v * Math.sin(gamma), vz: v * Math.cos(gamma) };
}

const withEvent = (s: LandingState, kind: LandingEventKind): Pick<LandingState, 'event' | 'events'> =>
  ({ event: { kind, pass: s.pass, t: s.t }, events: s.events + 1 });

function newPass(s: LandingState, pass: number): LandingState {
  const sea = createSea(s.seed, pass, s.motion);
  const jet = passJet(s.seed, pass, sea);
  const next = { ...s, pass, sea, jet, passT: 0, phase: 'approach' as const, phaseT: 0, ball: ballOf(jet, sea, 0), stats: NO_STATS, pending: null };
  return { ...next, ...withEvent(next, 'pass') };
}

export function createLanding(seed: number, motion = 1): LandingState {
  const sea = createSea(seed, 0, motion);
  const base: LandingState = {
    seed, motion, pass: 0, sea, t: 0, passT: 0, phase: 'approach', phaseT: 0, jet: passJet(seed, 0, sea), ball: 0,
    stats: NO_STATS, pending: null, results: [], event: null, events: 0,
  };
  return newPass(base, 0);
}

/** Why Paddles waves this pass off right now, if he does. */
export function waveOffReason(s: LandingState): WaveoffReason | null {
  const j = s.jet;
  const toRamp = -j.z;
  if (j.y < R.floor || (toRamp <= R.wayLowFrom && s.ball < R.wayLow)) return 'low';
  if (toRamp > R.zone) return null;
  if (Math.abs(j.x) > R.laneLimit) return 'lineup';
  if (s.ball < R.redBall) return 'low';
  if (toRamp > R.clearFrom) return null;
  const tr = toRamp / Math.max(1, j.vz);
  return j.y + j.vy * tr - deckY(s.sea, 0, s.passT + tr) < R.rampClear ? 'low' : null;
}

function outcomeOf(s: LandingState, prevZ: number): Outcome | null {
  const j = s.jet;
  if (j.z < 0) {
    const reason = waveOffReason(s);
    return reason ? { kind: 'waveoff', reason } : null;
  }
  const deck = deckY(s.sea, j.z, s.passT);
  // a hook below the ramp as it crosses it: Paddles had waved it off (never a crash)
  if (prevZ < 0 && j.y < deck) return { kind: 'waveoff', reason: 'low' };
  if (j.y <= deck) return judgeTouchdown(j.z, j.dv);
  const last = DECK.wires[DECK.wires.length - 1] ?? 0;
  return j.z > last + R.floatPast ? { kind: 'bolter', reason: 'long' } : null;
}

function enterOutcome(s: LandingState, outcome: Outcome): LandingState {
  const q = quality(s.stats);
  const grade: Grade = outcome.kind === 'trap' ? gradeTrap(q, outcome.wire) : outcome.kind;
  const pending: PassResult = { pass: s.pass, outcome, grade, points: POINTS[grade], note: mainFault(s.stats), q };
  const onDeck = outcome.kind !== 'waveoff' ? { y: deckY(s.sea, s.jet.z, s.passT) } : {};
  return { ...s, phase: outcome.kind, phaseT: 0, pending, jet: { ...s.jet, ...onDeck }, ...withEvent(s, outcome.kind) };
}

function approachStep(s: LandingState, input: LandingInput, dt: number): LandingState {
  const jet = flyJet(s.jet, input, airAt(s.sea, s.passT, s.jet.z), dt);
  const ball = DECK.target - jet.z > R.ballFreeze ? ballOf(jet, s.sea, s.passT) : s.ball;
  const stats = addSample(s.stats, jet.z, ball, jet.x, jet.dv * KNOTS_PER_MS, dt);
  const moved = { ...s, jet, ball, stats };
  const out = outcomeOf(moved, s.jet.z);
  return out ? enterOutcome(moved, out) : moved;
}

function toGraded(s: LandingState): LandingState {
  const results = s.pending ? [...s.results, s.pending] : s.results;
  return { ...s, phase: 'graded', phaseT: 0, results, pending: null, ...withEvent(s, 'graded') };
}

function trapStep(s: LandingState, dt: number): LandingState {
  const j = s.jet;
  const vz = Math.max(0, j.vz - R.trapDecel * dt);
  const z = j.z + ((j.vz + vz) / 2) * dt;
  const jet = { ...j, z, vz, vy: 0, y: deckY(s.sea, z, s.passT), q: 0, gamma: 0, vxa: DECK.drift };
  const moved = { ...s, jet };
  return vz === 0 && s.phaseT >= R.outcomeTime ? toGraded(moved) : moved;
}

/** Bolter or wave-off: full power and climb away, never below the deck. */
function goAroundStep(s: LandingState, dt: number): LandingState {
  const climb = (s.phase === 'bolter' ? R.bolterGamma : R.waveoffGamma) * RAD;
  const cmd = { x: DECK.drift / R.latMax, y: clamp(((climb - s.jet.gamma) / (R.autoQ * RAD)) * 2, -1, 1), throttle: 1 };
  let jet = flyJet(s.jet, cmd, gustAt(s.sea, s.passT), dt, R.autoQ * RAD);
  if (jet.z > -5 && jet.z < DECK.length + 20) {
    const floor = deckY(s.sea, Math.max(0, jet.z), s.passT) + (s.phase === 'waveoff' ? R.skim : 0);
    if (jet.y < floor) jet = { ...jet, y: floor, vy: Math.max(0, jet.vy) };
  }
  const moved = { ...s, jet };
  return s.phaseT >= R.outcomeTime ? toGraded(moved) : moved;
}

function gradedStep(s: LandingState, input: LandingInput): LandingState {
  const skip = input.next && s.phaseT >= R.cardSkip;
  if (!skip && s.phaseT < R.cardTime) return s;
  if (s.pass + 1 < R.passes) return newPass(s, s.pass + 1);
  return { ...s, phase: 'over', phaseT: 0, ...withEvent(s, 'over') };
}

export function stepLanding(s: LandingState, input: LandingInput, dt: number): LandingState {
  if (s.phase === 'over') return s;
  const ticked = { ...s, t: s.t + dt, passT: s.passT + dt, phaseT: s.phaseT + dt };
  switch (s.phase) {
    case 'approach': return approachStep(ticked, input, dt);
    case 'trap': return trapStep(ticked, dt);
    case 'bolter':
    case 'waveoff': return goAroundStep(ticked, dt);
    case 'graded': return gradedStep(ticked, input);
    default: throw new Error(`unhandled: ${s.phase satisfies never}`);
  }
}
