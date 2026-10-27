import { describe, it, expect } from 'vitest';
import { RANK_IDS } from '../../src/data/ranks';
import { clampStats, maxRating, pilotRating, rankFor, type RatingStats } from '../../src/game/rating';

const zero: RatingStats = { stars: 0, medals: 0, kills: 0, golds: 0, silvers: 0, bronzes: 0, score: 0 };

describe('Pilot rating', () => {
  it('weights stars, medals, kills and minigame medals', () => {
    expect(pilotRating(zero)).toBe(0);
    expect(pilotRating({ ...zero, stars: 3 })).toBe(300);
    expect(pilotRating({ ...zero, medals: 2 })).toBe(500);
    expect(pilotRating({ ...zero, kills: 10 })).toBe(20);
    expect(pilotRating({ ...zero, golds: 1, silvers: 1, bronzes: 1, score: 0 })).toBe(150 + 80 + 40);
  });

  it('caps every ingredient so grinding cannot dominate, max 34 000 with both maps and the mission score (docs 35, 39)', () => {
    expect(pilotRating({ ...zero, kills: 99999 })).toBe(4000);
    expect(pilotRating({ stars: 999, medals: 99, kills: 99999, golds: 99, silvers: 0, bronzes: 0, score: 999999 })).toBe(maxRating());
    expect(maxRating()).toBe(34000);
    expect(pilotRating({ ...zero, stars: 180 })).toBe(18000);
  });

  it('adds the best mission scores ÷ 10, capped at 60 missions × 1000 (doc 39)', () => {
    expect(pilotRating({ ...zero, score: 734 })).toBe(73);
    expect(pilotRating({ ...zero, score: 60000 })).toBe(6000);
    expect(pilotRating({ ...zero, score: 99999 })).toBe(6000);
    expect(clampStats({ ...zero, score: -3 }).score).toBe(0);
  });

  it('clamps nonsense: negatives, fractions, NaN, more medals than games', () => {
    expect(clampStats({ stars: -5, medals: 2.7, kills: Number.NaN, golds: 8, silvers: 5, bronzes: 5, score: 0 }))
      .toEqual({ stars: 0, medals: 2, kills: 0, golds: 8, silvers: 2, bronzes: 0, score: 0 });
  });

  it('maps ratings to naval ranks', () => {
    expect(RANK_IDS).toEqual(['ensign', 'ltjg', 'lt', 'lcdr', 'cdr', 'capt', 'radm', 'adm', 'fadm', 'legend']);
    expect(rankFor(0)).toBe('ensign');
    expect(rankFor(799)).toBe('ensign');
    expect(rankFor(800)).toBe('ltjg');
    expect(rankFor(6500)).toBe('cdr');
    expect(rankFor(16500)).toBe('adm');
    expect(rankFor(19999)).toBe('adm');
    expect(rankFor(20000)).toBe('fadm');
    expect(rankFor(25000)).toBe('legend');
    expect(rankFor(28000)).toBe('legend');
  });
});
