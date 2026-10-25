import { createRng, type Rng } from '../../src/core/rng';
import {
  createTactics, nextEngagement, playCard, resolveTurn, TACTICS_RULES as R, viewOf, type Engagement, type Situation,
} from '../../src/game/minigames/tactics';
import { bestCard, CARDS, mirrorGeo, overshoot, quality, type MoveId } from '../../src/game/minigames/tactics-moves';

// Dogfight Tactics balance (doc 19): simulated players that pick a card for the current engagement.

export type Pilot = (e: Engagement, rng: Rng) => MoveId;

const offered = (s: Situation): readonly MoveId[] => CARDS[s.geo];

export const random: Pilot = (e, rng) => rng.pick(offered(e.sit));

/** Always the most aggressive card of the geometry. */
export const aggressive: Pilot = (e) => offered(e.sit)[0] ?? 'break';

/** Reads the range but ignores energy and altitude. */
export const ruleOfThumb: Pilot = (e) => {
  const r = e.sit.range;
  switch (e.sit.geo) {
    case 'defensive': return r === 0 ? 'break' : 'extend';
    case 'offensive': return r === 2 ? 'lowYoyo' : 'leadPursuit';
    case 'merge': return r === 2 ? 'immelmann' : 'leadTurn';
    case 'abeam': return 'scissors';
    default: throw new Error(`unhandled: ${e.sit.geo satisfies never}`);
  }
};

/** The card with the best quality for the situation (what the card hints describe). */
export const bestFor = (s: Situation): MoveId => {
  const v = viewOf(s, 'you');
  let pick: MoveId = offered(s)[0] ?? 'break';
  let best = -Infinity;
  for (const m of offered(s)) {
    const q = quality(m, v).q;
    if (q > best) [best, pick] = [q, m];
  }
  return pick;
};
export const best: Pilot = (e) => bestFor(e.sit);

/** Best card, but a random one with probability `p`. */
export const sloppy = (p: number): Pilot => (e, rng) => (rng.chance(p) ? random(e, rng) : best(e, rng));

/** Predicts the bandit's best card and adds the overshoot to the choice. */
export const reader: Pilot = (e) => {
  const s = e.sit;
  const his = bestCard(viewOf(s, 'him'));
  const v = viewOf(s, 'you');
  let pick: MoveId = offered(s)[0] ?? 'break';
  let top = -Infinity;
  for (const m of offered(s)) {
    const x = 2 * quality(m, v).q + 2 * overshoot(m, his, s.range, v.edge);
    if (x > top) [top, pick] = [x, m];
  }
  return pick;
};

/** The bandit's card odds: his best card with `skill`, otherwise any of his four. */
function odds(s: Situation, skill: number): Array<[MoveId, number]> {
  const cards = CARDS[mirrorGeo(s.geo)];
  const smart = bestCard(viewOf(s, 'him'));
  return cards.map((c) => [c, (1 - skill) / cards.length + (c === smart ? skill : 0)]);
}

function value(s: Situation, turn: number, par: number, skill: number, depth: number): number {
  if (s.adv >= R.meter) return 20 + (turn <= par ? 8 : 0);
  if (s.adv <= -R.meter) return -20;
  if (turn >= R.turns) return 6;
  if (depth === 0) return s.adv + 0.6 * (viewOf(s, 'you').edge);
  let top = -Infinity;
  for (const m of CARDS[s.geo]) top = Math.max(top, expected(s, m, turn, par, skill, depth));
  return top;
}

function expected(s: Situation, m: MoveId, turn: number, par: number, skill: number, depth: number): number {
  let ev = 0;
  for (const [h, p] of odds(s, skill)) ev += p * value(resolveTurn(s, m, h).after, turn + 1, par, skill, depth - 1);
  return ev;
}

/** Looks `depth` turns ahead, knowing the bandit's odds. */
export const lookahead = (depth: number): Pilot => (e) => {
  let pick: MoveId = offered(e.sit)[0] ?? 'break';
  let top = -Infinity;
  for (const m of offered(e.sit)) {
    const ev = expected(e.sit, m, e.turn, e.par, e.skill, depth);
    if (ev > top) [top, pick] = [ev, m];
  }
  return pick;
};

/** Plays a whole round; returns the points and the eight outcomes. */
export function playRound(seed: number, pilot: Pilot): { points: number; outcomes: string[]; turns: number } {
  let s = createTactics(seed);
  const rng = createRng(seed ^ 0x2545f491);
  let turns = 0;
  while (!s.over) {
    if (s.eng.outcome) {
      s = nextEngagement(s);
      continue;
    }
    s = playCard(s, pilot(s.eng, rng));
    turns++;
  }
  return { points: s.points, outcomes: [...s.outcomes], turns };
}
