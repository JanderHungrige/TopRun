import { createRng, type Rng } from '../../core/rng';
import { RANK_CHARTS, type Chart, type QuizRank } from '../../data/rank-quiz';
import type { Medals } from './core';

// Rank Quiz (doc 41): a round is five different ranks of one chart; each question shows the insignia and offers four
// names — the right one and three others, nearest in rank first (the hard ones). Points: 100 for a right answer plus
// up to 50 for speed. Pure and deterministic for a seed.

export const RANK_QUIZ = Object.freeze({ questions: 5, options: 4, near: 3, time: 12, base: 100, bonus: 50 });
export const RANKS_MEDALS: Medals = { bronze: 400, silver: 550, gold: 700 };

export interface Question {
  /** The rank whose insignia is shown (index into its chart). */
  index: number;
  options: readonly string[];
  /** Which option is right. */
  answer: number;
}

/** Fisher–Yates on a copy. */
export function shuffle<T>(rng: Rng, items: readonly T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = rng.int(0, i);
    const a = out[i];
    const b = out[j];
    if (a === undefined || b === undefined) continue;
    out[i] = b;
    out[j] = a;
  }
  return out;
}

function ask(rng: Rng, ranks: readonly QuizRank[], index: number): Question {
  const all = ranks.map((_, i) => i).filter((i) => i !== index);
  const near = shuffle(rng, all.filter((i) => Math.abs(i - index) <= RANK_QUIZ.near));
  const far = shuffle(rng, all.filter((i) => Math.abs(i - index) > RANK_QUIZ.near));
  const order = shuffle(rng, [index, ...[...near, ...far].slice(0, RANK_QUIZ.options - 1)]);
  return { index, options: order.map((i) => ranks[i]?.name ?? ''), answer: order.indexOf(index) };
}

/** Five questions on five different ranks of the chart. */
export function makeQuiz(chart: Chart, seed: number): Question[] {
  const rng = createRng(seed);
  const ranks = RANK_CHARTS[chart];
  const picks = shuffle(rng, ranks.map((_, i) => i)).slice(0, RANK_QUIZ.questions);
  return picks.map((index) => ask(rng, ranks, index));
}

/** Points for an answer with `timeLeft` seconds on the clock. */
export function answerPoints(correct: boolean, timeLeft: number): number {
  if (!correct) return 0;
  const left = Math.max(0, Math.min(RANK_QUIZ.time, timeLeft));
  return RANK_QUIZ.base + Math.round((RANK_QUIZ.bonus * left) / RANK_QUIZ.time);
}
