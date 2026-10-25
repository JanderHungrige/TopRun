import { describe, it, expect } from 'vitest';
import { medalFor, type Medal } from '../../src/game/minigames/core';
import { TACTICS_MEDALS } from '../../src/game/minigames/tactics';
import { aggressive, best, lookahead, playRound, random, reader, ruleOfThumb, sloppy, type Pilot } from './tactics-bots';

// Dogfight Tactics balance (doc 19): simulated players over fixed seeds decide the medal limits.

const SEEDS = 60;
interface Tally { none: number; bronze: number; silver: number; gold: number; median: number }

function tally(pilot: Pilot): Tally {
  const t: Tally = { none: 0, bronze: 0, silver: 0, gold: 0, median: 0 };
  const scores: number[] = [];
  for (let seed = 1; seed <= SEEDS; seed++) {
    const { points } = playRound(seed * 7919 + 13, pilot);
    scores.push(points);
    const m: Medal | null = medalFor(points, TACTICS_MEDALS, true);
    t[m ?? 'none']++;
  }
  scores.sort((a, b) => a - b);
  t.median = scores[SEEDS >> 1] ?? 0;
  return t;
}

describe('Dogfight Tactics medals (simulated players)', () => {
  it('gives random and always-aggressive play no silver', () => {
    const r = tally(random);
    expect(r.silver + r.gold).toBe(0);
    expect(r.bronze).toBeLessThanOrEqual(SEEDS * 0.12);
    const a = tally(aggressive);
    expect(a.median).toBeLessThan(TACTICS_MEDALS.bronze);
    expect(a.gold).toBe(0);
  });

  it('needs energy, not just range: rule-of-thumb play stays below silver', () => {
    const t = tally(ruleOfThumb);
    expect(t.median).toBeLessThan(TACTICS_MEDALS.silver);
    expect(t.gold).toBeLessThanOrEqual(1);
  });

  it('turns understanding into medals: the best card is silver, often gold', () => {
    const b = tally(best);
    expect(b.median).toBeGreaterThanOrEqual(TACTICS_MEDALS.silver);
    expect(b.gold).toBeGreaterThanOrEqual(SEEDS * 0.25);
    expect(b.gold).toBeLessThanOrEqual(SEEDS * 0.75);
    const rd = tally(reader);
    expect(rd.median).toBeGreaterThanOrEqual(TACTICS_MEDALS.silver);
    expect(rd.gold).toBeGreaterThanOrEqual(SEEDS * 0.25);
  });

  it('costs gold for mistakes: 30 % wrong cards is bronze or silver, rarely gold', () => {
    const t = tally(sloppy(0.3));
    expect(t.none).toBeLessThanOrEqual(SEEDS * 0.1);
    expect(t.gold).toBeLessThanOrEqual(SEEDS * 0.12);
    expect(t.median).toBeLessThan(TACTICS_MEDALS.gold);
  });

  it('rewards planning ahead the most', () => {
    const b = tally(best);
    const plan = tally(lookahead(2));
    expect(plan.median).toBeGreaterThanOrEqual(b.median);
    expect(plan.gold).toBeGreaterThanOrEqual(b.gold);
    expect(plan.gold).toBeGreaterThanOrEqual(SEEDS * 0.4);
  });
});
