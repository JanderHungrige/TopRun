import { describe, expect, it } from 'vitest';
import { FORCES, QUIZ_RANKS, type Force, type QuizRank } from '../../src/data/rank-quiz';
import { answerPoints, makeQuiz, RANK_QUIZ, RANKS_MEDALS, rankAt, type Question } from '../../src/game/minigames/ranks';

// Doc 41: the rank tables and the seeded ten-question rounds of the Rank Quiz.

const codeNum = (c: string): number => Number(c.slice(3)) + (c.startsWith('OF') ? 100 : 0);
const gradeNum = (g: string): number => Number(g.slice(2)) + (g.startsWith('O') ? 100 : 0);

/** Every option that would also be a right answer to the question. */
function rightOptions(q: Question): string[] {
  const subject = rankAt(q.subject);
  const ranks = (f: Force): readonly QuizRank[] => QUIZ_RANKS[f];
  switch (q.kind) {
    case 'higher': {
      const partner = q.partner ? rankAt(q.partner) : null;
      return [q.subject.index > (q.partner?.index ?? -1) ? subject.name : partner?.name ?? ''];
    }
    case 'next': return [ranks(q.subject.force)[q.subject.index + 1]?.name ?? ''];
    case 'grade': return [subject.grade ?? ''];
    case 'code': return [subject.nato ?? ''];
    case 'usEquiv': return ranks(q.target ?? 'usn').filter((x) => x.grade === subject.grade).map((x) => x.name);
    case 'natoEquiv': return ranks(q.target ?? 'usn').filter((x) => x.nato === subject.nato).map((x) => x.name);
    default: throw new Error(`unhandled: ${q.kind satisfies never}`);
  }
}

describe('rank tables', () => {
  it('lists each force lowest first with unique names', () => {
    for (const f of FORCES) {
      const list = QUIZ_RANKS[f];
      expect(new Set(list.map((x) => x.name)).size).toBe(list.length);
      const codes = list.flatMap((x) => (x.nato ? [codeNum(x.nato)] : []));
      expect(codes).toEqual([...codes].sort((a, b) => a - b));
    }
  });

  it('gives US ranks strictly rising pay grades and German ranks none', () => {
    for (const f of ['usn', 'usa'] as const) {
      const grades = QUIZ_RANKS[f].map((x) => gradeNum(x.grade ?? ''));
      expect(grades.every((g, i) => i === 0 || g > (grades[i - 1] ?? 0))).toBe(true);
    }
    for (const f of ['marine', 'heer'] as const) expect(QUIZ_RANKS[f].every((x) => x.grade === null)).toBe(true);
  });

  it('knows the classic equivalents', () => {
    const find = (f: Force, name: string): QuizRank | undefined => QUIZ_RANKS[f].find((x) => x.name === name);
    expect(find('usn', 'Captain')?.nato).toBe(find('usa', 'Colonel')?.nato);
    expect(find('marine', 'Fregattenkapitän')?.nato).toBe(find('usn', 'Commander')?.nato);
    expect(find('heer', 'Hauptmann')?.nato).toBe('OF-2');
    expect(find('usn', 'Lieutenant Commander')?.grade).toBe('O-4');
    expect(find('heer', 'Oberstabsfeldwebel')?.nato).toBe('OR-9');
  });
});

describe('quiz rounds', () => {
  const seeds = [1, 2, 3, 42, 99, 2026, 31337, 7777, 123456, 987654];

  it('asks ten questions, the same for the same seed', () => {
    for (const seed of seeds) {
      const quiz = makeQuiz(seed);
      expect(quiz).toHaveLength(RANK_QUIZ.questions);
      expect(makeQuiz(seed)).toEqual(quiz);
    }
    expect(makeQuiz(1)).not.toEqual(makeQuiz(2));
  });

  it('mixes the kinds (three of one at most) and covers all four forces', () => {
    for (const seed of seeds) {
      const quiz = makeQuiz(seed);
      const kinds = new Map<string, number>();
      for (const q of quiz) kinds.set(q.kind, (kinds.get(q.kind) ?? 0) + 1);
      expect(Math.max(...kinds.values())).toBeLessThanOrEqual(3);
      const forces = new Set(quiz.flatMap((q) => [q.subject.force, q.partner?.force, q.target].filter((f): f is Force => !!f)));
      expect(forces.size).toBe(4);
      const keys = quiz.map((q) => `${q.kind}|${q.subject.force}|${q.subject.index}|${q.partner?.index ?? ''}|${q.target ?? ''}`);
      expect(new Set(keys).size).toBe(keys.length);
    }
  });

  it('has exactly one right option, at the answer index, among unique options', () => {
    for (const seed of seeds) {
      for (const q of makeQuiz(seed)) {
        expect(new Set(q.options).size).toBe(q.options.length);
        expect(q.options).toHaveLength(q.kind === 'higher' ? 2 : 4);
        const right = rightOptions(q);
        const hits = q.options.filter((o) => right.includes(o));
        expect(hits, `${q.kind} ${rankAt(q.subject).name}`).toHaveLength(1);
        expect(right).toContain(q.options[q.answer]);
      }
    }
  });

  it('asks codes and equivalents only about ranks with a known code', () => {
    for (const seed of seeds) {
      for (const q of makeQuiz(seed)) {
        if (q.kind === 'code' || q.kind === 'natoEquiv') expect(rankAt(q.subject).nato).not.toBeNull();
        if (q.kind === 'grade' || q.kind === 'usEquiv') expect(['usn', 'usa']).toContain(q.subject.force);
      }
    }
  });
});

describe('scoring', () => {
  it('pays 100 plus up to 50 for speed, nothing for a miss', () => {
    expect(answerPoints(true, RANK_QUIZ.time)).toBe(150);
    expect(answerPoints(true, RANK_QUIZ.time / 2)).toBe(125);
    expect(answerPoints(true, 0)).toBe(100);
    expect(answerPoints(false, 10)).toBe(0);
    expect(answerPoints(true, -3)).toBe(100);
  });

  it('awards medals on a 1500-point scale', () => {
    expect(RANKS_MEDALS).toEqual({ bronze: 700, silver: 1000, gold: 1300 });
    expect(RANK_QUIZ.questions * answerPoints(true, RANK_QUIZ.time)).toBe(1500);
  });
});
