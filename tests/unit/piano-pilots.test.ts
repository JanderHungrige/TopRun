import { describe, it, expect } from 'vitest';
import { medalFor, type Medal } from '../../src/game/minigames/core';
import { pianoChart } from '../../src/game/minigames/piano-chart';
import { maxScore, PIANO_MEDALS } from '../../src/game/minigames/piano';
import { guesser, masher, playRound, PLAYERS, type Player } from './piano-bots';

// Piano Bar balance (doc 23): simulated players over fixed seeds decide the medal limits.

const SEEDS = 40;
const chart = pianoChart();
interface Tally { none: number; bronze: number; silver: number; gold: number; median: number }

function tally(p: Player): Tally {
  const t: Tally = { none: 0, bronze: 0, silver: 0, gold: 0, median: 0 };
  const scores: number[] = [];
  for (let seed = 1; seed <= SEEDS; seed++) {
    const s = playRound(chart, p, seed * 7919 + 17);
    scores.push(s.score);
    const m: Medal | null = medalFor(s.score, PIANO_MEDALS, true);
    t[m ?? 'none']++;
  }
  scores.sort((a, b) => a - b);
  t.median = scores[SEEDS >> 1] ?? 0;
  return t;
}

describe('Piano Bar medals (simulated players)', () => {
  it('orders the limits below the all-perfect score', () => {
    expect(PIANO_MEDALS.bronze).toBeLessThan(PIANO_MEDALS.silver);
    expect(PIANO_MEDALS.silver).toBeLessThan(PIANO_MEDALS.gold);
    expect(PIANO_MEDALS.gold).toBeLessThan(maxScore(chart));
    expect(medalFor(playRound(chart, PLAYERS.perfect, 1).score, PIANO_MEDALS, true)).toBe('gold');
  });

  it('gives an expert (±22 ms, almost never misses) gold in most rounds', () => {
    const t = tally(PLAYERS.expert);
    expect(t.gold).toBeGreaterThanOrEqual(SEEDS * 0.6);
    expect(t.none + t.bronze).toBe(0);
  });

  it('gives a skilled player (±35 ms) silver, rarely gold', () => {
    const t = tally(PLAYERS.skilled);
    expect(t.silver + t.gold).toBeGreaterThanOrEqual(SEEDS * 0.8);
    expect(t.gold).toBeLessThanOrEqual(SEEDS * 0.25);
  });

  it('gives an average player (±50 ms, misses in fast runs) bronze, not gold', () => {
    const t = tally(PLAYERS.average);
    expect(t.none).toBeLessThanOrEqual(SEEDS * 0.15);
    expect(t.gold).toBe(0);
    expect(t.median).toBeLessThan(PIANO_MEDALS.silver);
  });

  it('leaves a novice mostly without a medal', () => {
    const t = tally(PLAYERS.novice);
    expect(t.silver + t.gold).toBe(0);
    expect(t.none).toBeGreaterThanOrEqual(SEEDS * 0.5);
  });

  it('never pays for mashing or guessing lanes', () => {
    for (const every of [2, 4, 8, 15]) expect(masher(chart, every).score).toBeLessThan(PIANO_MEDALS.bronze * 0.5);
    for (let seed = 1; seed <= 10; seed++) expect(guesser(chart, seed).score).toBeLessThan(PIANO_MEDALS.bronze * 0.5);
  });
});
