import { describe, expect, it } from 'vitest';
import { CHART_SAMPLE, CHARTS, RANK_CHARTS } from '../../src/data/rank-quiz';
import { answerPoints, makeQuiz, RANK_QUIZ, RANKS_MEDALS } from '../../src/game/minigames/ranks';

// Doc 41: the four rank charts and the seeded five-question rounds of the Rank Quiz.

describe('rank charts', () => {
  it('holds the four charts with the documented number of ranks', () => {
    expect(CHARTS).toEqual(['usn', 'usa', 'marine', 'heer']);
    expect(CHARTS.map((c) => RANK_CHARTS[c].length)).toEqual([19, 21, 26, 26]);
    expect(RANK_CHARTS.usn[0]?.name).toBe('Seaman Recruit');
    expect(RANK_CHARTS.heer.at(-1)?.name).toBe('General');
  });

  it('gives every rank of a chart its own name and its own insignia', () => {
    for (const c of CHARTS) {
      const ranks = RANK_CHARTS[c];
      expect(new Set(ranks.map((x) => x.name)).size).toBe(ranks.length);
      // An insignia that two ranks shared could not be named: every one is unique within its chart.
      expect(new Set(ranks.map((x) => JSON.stringify(x.insignia))).size).toBe(ranks.length);
    }
  });

  it('shows a real rank of each chart on the pick cards', () => {
    for (const c of CHARTS) expect(RANK_CHARTS[c][CHART_SAMPLE[c]]).toBeDefined();
  });
});

describe('quiz rounds', () => {
  it('asks five different ranks of the chart, each with four different names and one right answer', () => {
    for (const c of CHARTS) {
      for (let seed = 1; seed <= 40; seed++) {
        const quiz = makeQuiz(c, seed);
        expect(quiz).toHaveLength(RANK_QUIZ.questions);
        expect(new Set(quiz.map((q) => q.index)).size).toBe(RANK_QUIZ.questions);
        for (const q of quiz) {
          expect(new Set(q.options).size).toBe(RANK_QUIZ.options);
          expect(q.options[q.answer]).toBe(RANK_CHARTS[c][q.index]?.name);
        }
      }
    }
  });

  it('offers the nearest ranks as the wrong names', () => {
    for (const c of CHARTS) {
      const names = RANK_CHARTS[c].map((x) => x.name);
      for (const q of makeQuiz(c, 7)) {
        const wrong = q.options.filter((_, i) => i !== q.answer).map((n) => names.indexOf(n));
        expect(wrong.every((i) => i >= 0 && Math.abs(i - q.index) <= RANK_QUIZ.near)).toBe(true);
      }
    }
  });

  it('is the same round for the same seed and varies with the seed', () => {
    expect(makeQuiz('marine', 42)).toEqual(makeQuiz('marine', 42));
    const firsts = new Set(Array.from({ length: 30 }, (_, s) => makeQuiz('heer', s).map((q) => q.index).join(',')));
    expect(firsts.size).toBeGreaterThan(25);
    // The right answer's slot moves around.
    const slots = new Set(Array.from({ length: 30 }, (_, s) => makeQuiz('usa', s)[0]?.answer));
    expect(slots.size).toBe(RANK_QUIZ.options);
  });

  it('reaches every rank of a chart over many rounds', () => {
    for (const c of CHARTS) {
      const seen = new Set<number>();
      for (let seed = 0; seed < 200; seed++) for (const q of makeQuiz(c, seed)) seen.add(q.index);
      expect(seen.size).toBe(RANK_CHARTS[c].length);
    }
  });
});

describe('points', () => {
  it('pays 100 plus up to 50 for speed, nothing for a wrong answer', () => {
    expect(answerPoints(true, RANK_QUIZ.time)).toBe(150);
    expect(answerPoints(true, RANK_QUIZ.time / 2)).toBe(125);
    expect(answerPoints(true, 0)).toBe(100);
    expect(answerPoints(true, -3)).toBe(100);
    expect(answerPoints(false, 10)).toBe(0);
  });

  it('has medals on the 750-point scale', () => {
    expect(RANK_QUIZ.questions * answerPoints(true, RANK_QUIZ.time)).toBe(750);
    expect(RANKS_MEDALS).toEqual({ bronze: 400, silver: 550, gold: 700 });
  });
});
