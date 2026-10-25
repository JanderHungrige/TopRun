import { describe, expect, it } from 'vitest';
import { medalFor, type Medal } from '../../src/game/minigames/core';
import { COURSE } from '../../src/game/minigames/motorbike-course';
import { finalScore, isClean, MOTORBIKE_MEDALS } from '../../src/game/minigames/motorbike';
import { AUTO, AVERAGE, BLIND, LATE, NOVICE, PERFECT, rideRace, SKILLED, UPRIGHT, type Skill } from './motorbike-riders';

// Motorbike vs. Jet (doc 22): medal tuning with simulated riders on the pure rules (playtest table in the doc).

const medal = (score: number): Medal | null => medalFor(score, MOTORBIKE_MEDALS, true);
const scoreOf = (skill: Skill, seed = 1): number => finalScore(rideRace(skill, seed));
const nth = (kind: string, n = 0): number => COURSE.map((o, i) => ({ o, i })).filter((e) => e.o.kind === kind)[n]?.i ?? -1;

function spread(skill: Skill, seeds: number): Record<Medal | 'none', number> {
  const medals = { gold: 0, silver: 0, bronze: 0, none: 0 };
  for (let seed = 1; seed <= seeds; seed++) medals[medal(scoreOf(skill, seed)) ?? 'none']++;
  return medals;
}

describe('motorbike — simulated riders', () => {

  it('the perfect rider rides clean, shifts every gear in the green and takes gold', () => {
    const s = rideRace(PERFECT);
    expect(isClean(s)).toBe(true);
    expect(s.shifts.perfect).toBe(5);
    expect(s.shifts.early + s.shifts.late + s.shifts.auto).toBe(0);
    expect(medal(finalScore(s))).toBe('gold');
  });

  it('a clean race without shifting (the gearbox shifts at the limiter) is silver', () => {
    const s = rideRace(AUTO);
    expect(isClean(s)).toBe(true);
    expect(s.shifts.auto).toBe(5);
    expect(medal(finalScore(s))).toBe('silver');
  });

  it('shifting late every time or riding upright is silver', () => {
    expect(medal(scoreOf(LATE))).toBe('silver');
    expect(medal(scoreOf(UPRIGHT))).toBe('silver');
  });

  it('one mishap costs the gold: either bump or an oil slide; a barrier hit costs the race', () => {
    expect(medal(scoreOf({ ...PERFECT, miss: [nth('bump', 0)] }))).toBe('silver');
    expect(medal(scoreOf({ ...PERFECT, miss: [nth('bump', 2)] }))).toBe('silver');
    expect(medal(scoreOf({ ...PERFECT, miss: [nth('oil', 0)] }))).toBe('silver');
    expect(medal(scoreOf({ ...UPRIGHT, miss: [nth('gate', 0)] }))).toBeNull();
  });

  it('over-braking for the truck costs metres, a late reaction less so', () => {
    const perfect = scoreOf(PERFECT);
    expect(scoreOf({ ...PERFECT, truckMargin: 0.3 })).toBeLessThan(perfect - 80);
    expect(scoreOf({ ...PERFECT, react: 0.5 })).toBeGreaterThan(perfect - 40);
  });

  it('crashing into the fuel truck loses the race', () => {
    const s = rideRace({ ...PERFECT, miss: [nth('truck')] });
    expect(s.results[nth('truck')]).toBe('truck');
    expect(medal(finalScore(s))).toBeNull();
  });

  it('throttle only, never leaning or braking, loses to the jet', () => {
    const s = rideRace(BLIND);
    expect(s.results.filter((r) => r !== 'clean' && r !== 'pending').length).toBeGreaterThanOrEqual(4);
    expect(medal(finalScore(s))).toBeNull();
  });

  it('human-like riders spread across the medals (20 seeds each)', () => {
    const skilled = spread(SKILLED, 20);
    const average = spread(AVERAGE, 20);
    const novice = spread(NOVICE, 20);
    expect(skilled.gold).toBeGreaterThanOrEqual(4);
    expect(skilled.gold + skilled.silver).toBeGreaterThanOrEqual(17);
    expect(average.gold).toBe(0);
    expect(average.bronze + average.silver).toBeGreaterThanOrEqual(8);
    expect(average.none).toBeGreaterThanOrEqual(4);
    expect(novice.gold + novice.silver).toBe(0);
    expect(novice.none).toBeGreaterThanOrEqual(15);
  });
});
