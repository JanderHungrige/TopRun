import { createRng } from '../../core/rng';
import type { Medals } from './core';
import {
  bestCard, CARDS, EFFECTS, mirrorGeo, overshoot, quality, type Alt, type Geo, type MoveId, type NoteId, type Quality, type Range,
  type View,
} from './tactics-moves';

// Dogfight Tactics (doc 19): eight seeded engagements; each turn the player's card meets the bandit's seeded
// card, the advantage meter swings, energies / altitude / range change, until guns, a firing solution or
// the turn limit. Pure and deterministic for a seed.

export const TACTICS_RULES = {
  engagements: 8,
  turns: 6,
  /** Meter end (half-steps): +meter = guns tracking, −meter = shot down. */
  meter: 10,
  /** |adv| ≥ this → offensive / defensive. */
  offensive: 4,
  maxEnergy: 6,
  /** Meter change cap by range: close, medium, far. */
  caps: [8, 6, 4],
  skill: [0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9],
  /** Chance per jet that a setup's energy moves by ±1. */
  jitter: 0.3,
} as const;
const R = TACTICS_RULES;

export type Outcome = 'fastKill' | 'kill' | 'separated' | 'shotDown';
export const POINTS: Readonly<Record<Outcome, number>> = { fastKill: 100, kill: 70, separated: 30, shotDown: 0 };
export const TACTICS_MEDALS: Medals = { bronze: 300, silver: 450, gold: 560 };

export interface Situation {
  geo: Geo;
  range: Range;
  you: number;
  him: number;
  alt: Alt;
  /** Advantage meter, −meter … +meter (half-steps). */
  adv: number;
}

export interface Setup {
  geo: Geo;
  range: Range;
  you: number;
  him: number;
  alt: Alt;
}
const setup = (geo: Geo, range: Range, you: number, him: number, alt: Alt = 0): Setup => ({ geo, range, you, him, alt });
export const SETUPS: readonly Setup[] = [
  setup('offensive', 1, 4, 3), setup('merge', 1, 4, 3), setup('offensive', 0, 5, 3), setup('defensive', 0, 4, 4),
  setup('merge', 2, 3, 4, 1), setup('defensive', 1, 4, 4), setup('abeam', 0, 3, 4), setup('defensive', 0, 3, 5, 1),
];
const PAR: Readonly<Record<Geo, number>> = { offensive: 2, merge: 3, abeam: 3, defensive: 4 };
const START_ADV: Readonly<Record<Geo, number>> = { offensive: R.offensive, defensive: -R.offensive, merge: 0, abeam: 0 };

export interface Engagement {
  index: number;
  start: Situation;
  sit: Situation;
  /** Turns played. */
  turn: number;
  par: number;
  skill: number;
  outcome: Outcome | null;
}

export interface TurnResult {
  mine: MoveId;
  his: MoveId;
  you: Quality;
  him: Quality;
  overshoot: number;
  delta: number;
  before: Situation;
  after: Situation;
  /** The instructor's line: the overshoot if one happened, otherwise the verdict on the player's card. */
  note: NoteId;
  outcome: Outcome | null;
}

export interface TacticsState {
  seed: number;
  eng: Engagement;
  outcomes: Outcome[];
  points: number;
  last: TurnResult | null;
  over: boolean;
}

const clamp = (v: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, v));
const toRange = (r: number): Range => (r <= 0 ? 0 : r >= 2 ? 2 : 1);
const toAlt = (a: number): Alt => (a <= -1 ? -1 : a >= 1 ? 1 : 0);

export const geoFor = (adv: number, range: Range): Geo =>
  adv >= R.offensive ? 'offensive' : adv <= -R.offensive ? 'defensive' : range === 0 ? 'abeam' : 'merge';

export function viewOf(s: Situation, side: 'you' | 'him'): View {
  if (side === 'you') return { geo: s.geo, range: s.range, edge: s.you - s.him + s.alt, energy: s.you, alt: s.alt };
  return { geo: mirrorGeo(s.geo), range: s.range, edge: s.him - s.you - s.alt, energy: s.him, alt: toAlt(-s.alt) };
}

/** Resolves one turn: the player's card `mine` against the bandit's `his`. */
export function resolveTurn(s: Situation, mine: MoveId, his: MoveId): { after: Situation; delta: number; overshoot: number; you: Quality; him: Quality } {
  const v = viewOf(s, 'you');
  const you = quality(mine, v);
  const him = quality(his, viewOf(s, 'him'));
  const over = overshoot(mine, his, s.range, v.edge);
  const cap = R.caps[s.range];
  const delta = clamp(2 * you.q - him.q + 2 * over, -cap, cap);
  const adv = clamp(s.adv + delta, -R.meter, R.meter);
  const range = toRange(s.range + EFFECTS[mine].range + EFFECTS[his].range);
  const after: Situation = {
    geo: geoFor(adv, range), range, adv,
    you: clamp(s.you + EFFECTS[mine].energy, 0, R.maxEnergy),
    him: clamp(s.him + EFFECTS[his].energy, 0, R.maxEnergy),
    alt: toAlt(s.alt + EFFECTS[mine].alt - EFFECTS[his].alt),
  };
  return { after, delta, overshoot: over, you, him };
}

const mix = (seed: number, a: number, b: number): number => (seed ^ Math.imul(a + 1, 0x9e3779b1) ^ Math.imul(b + 7, 0x85ebca6b)) >>> 0;

export function startEngagement(seed: number, index: number): Engagement {
  const base = SETUPS[index] ?? SETUPS[0] ?? setup('merge', 1, 3, 3);
  const rng = createRng(mix(seed, index, 101));
  const jitter = (e: number): number => clamp(e + (rng.chance(R.jitter) ? (rng.chance(0.5) ? 1 : -1) : 0), 1, R.maxEnergy);
  const you = jitter(base.you);
  const him = jitter(base.him);
  const start: Situation = { geo: base.geo, range: base.range, you, him, alt: base.alt, adv: START_ADV[base.geo] };
  return { index, start, sit: start, turn: 0, par: PAR[base.geo], skill: R.skill[index] ?? 0.9, outcome: null };
}

/** The bandit's card this turn: his best with probability `skill`, otherwise any of his four. Seeded. */
export function banditCard(seed: number, eng: Engagement): MoveId {
  const rng = createRng(mix(seed, eng.index, eng.turn));
  const view = viewOf(eng.sit, 'him');
  if (rng.chance(eng.skill)) return bestCard(view);
  return rng.pick(CARDS[view.geo]);
}

export const createTactics = (seed: number): TacticsState => ({
  seed: seed >>> 0, eng: startEngagement(seed >>> 0, 0), outcomes: [], points: 0, last: null, over: false,
});

function outcomeOf(adv: number, turn: number, par: number): Outcome | null {
  if (adv >= R.meter) return turn <= par ? 'fastKill' : 'kill';
  if (adv <= -R.meter) return 'shotDown';
  return turn >= R.turns ? 'separated' : null;
}

/** The player plays `mine` (one of the four offered cards). Anything else, or a finished engagement: unchanged. */
export function playCard(s: TacticsState, mine: MoveId): TacticsState {
  const e = s.eng;
  if (s.over || e.outcome || !CARDS[e.sit.geo].includes(mine)) return s;
  const his = banditCard(s.seed, e);
  const r = resolveTurn(e.sit, mine, his);
  const turn = e.turn + 1;
  const outcome = outcomeOf(r.after.adv, turn, e.par);
  const note: NoteId = r.overshoot > 0 ? 'overshoot' : r.overshoot < 0 ? 'overshot' : r.you.note;
  const last: TurnResult = { mine, his, you: r.you, him: r.him, overshoot: r.overshoot, delta: r.delta, before: e.sit, after: r.after, note, outcome };
  return {
    ...s,
    eng: { ...e, sit: r.after, turn, outcome },
    outcomes: outcome ? [...s.outcomes, outcome] : s.outcomes,
    points: s.points + (outcome ? POINTS[outcome] : 0),
    last,
  };
}

/** After an outcome: the next engagement, or the round is over after the eighth. */
export function nextEngagement(s: TacticsState): TacticsState {
  if (s.over || !s.eng.outcome) return s;
  if (s.outcomes.length >= R.engagements) return { ...s, over: true };
  return { ...s, eng: startEngagement(s.seed, s.outcomes.length), last: null };
}
