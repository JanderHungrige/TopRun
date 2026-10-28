import { createRng, type Rng } from '../../core/rng';
import { FORCES, type Force } from '../../data/rank-quiz';
import type { Medals } from './core';
import {
  askCode, askGrade, askHigher, askNatoEquiv, askNext, askUsEquiv, shuffle, type Question, type QuestionKind,
} from './ranks-ask';

export { rankAt, type Question, type QuestionKind, type QuizRef } from './ranks-ask';

// Rank Quiz (doc 41): a round of ten seeded questions — two of most kinds, all four forces — and the points for an
// answer: 100 for a right one plus up to 50 for speed. Pure and deterministic for a seed.

export const RANK_QUIZ = Object.freeze({ questions: 10, time: 12, base: 100, bonus: 50 });
export const RANKS_MEDALS: Medals = { bronze: 700, silver: 1000, gold: 1300 };

const KINDS: readonly QuestionKind[] = ['higher', 'higher', 'next', 'next', 'grade', 'usEquiv', 'usEquiv', 'natoEquiv', 'natoEquiv', 'code'];
const ATTEMPTS = 30;

function ask(rng: Rng, kind: QuestionKind, force: Force): Question | null {
  const us: Force = force === 'usa' ? 'usa' : force === 'usn' ? 'usn' : rng.pick(['usn', 'usa'] as const);
  switch (kind) {
    case 'higher': return askHigher(rng, force);
    case 'next': return askNext(rng, force);
    case 'grade': return askGrade(rng, us);
    case 'usEquiv': return askUsEquiv(rng, us);
    case 'natoEquiv': return askNatoEquiv(rng, force);
    case 'code': return askCode(rng, force);
    default: throw new Error(`unhandled: ${kind satisfies never}`);
  }
}

const keyOf = (q: Question): string => `${q.kind}|${q.subject.force}|${q.subject.index}|${q.partner?.index ?? ''}|${q.target ?? ''}`;

/** Ten questions for a seed: the kinds shuffled, the forces taken in turn so that all four appear. */
export function makeQuiz(seed: number): Question[] {
  const rng = createRng(seed);
  const kinds = shuffle(rng, KINDS);
  const forces = shuffle(rng, FORCES);
  const seen = new Set<string>();
  return kinds.map((kind, n) => {
    const force = forces[n % forces.length] ?? 'usn';
    // A kind that keeps failing (too few options, only repeats) falls back to a 'higher' question.
    let last: Question | null = null;
    for (let a = 0; a < ATTEMPTS * 2; a++) {
      const q = a < ATTEMPTS ? ask(rng, kind, force) : askHigher(rng, force);
      last = q ?? last;
      if (q && !seen.has(keyOf(q))) {
        seen.add(keyOf(q));
        return q;
      }
    }
    if (!last) throw new Error(`no ${kind} question for ${force}`);
    return last;
  });
}

/** Points for an answer with `timeLeft` seconds on the clock. */
export function answerPoints(correct: boolean, timeLeft: number): number {
  if (!correct) return 0;
  const left = Math.max(0, Math.min(RANK_QUIZ.time, timeLeft));
  return RANK_QUIZ.base + Math.round((RANK_QUIZ.bonus * left) / RANK_QUIZ.time);
}
