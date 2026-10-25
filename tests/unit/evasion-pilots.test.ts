import { describe, it, expect } from 'vitest';
import { medalFor, type Medal } from '../../src/game/minigames/core';
import { EVASION_MEDALS } from '../../src/game/minigames/evasion';
import { SEEKER } from '../../src/game/minigames/evasion-missiles';
import { ACE, circler, flareSpammer, idle, playRound, skilled, spinner, type PilotFactory } from './evasion-bots';

// Missile Evasion balance (doc 16): simulated pilots over fixed seeds decide the medal limits.

const SEEDS = 30;
interface Tally { none: number; bronze: number; silver: number; gold: number; median: number }

function tally(pilot: PilotFactory, delay = ACE.delay): Tally {
  const t: Tally = { none: 0, bronze: 0, silver: 0, gold: 0, median: 0 };
  const scores: number[] = [];
  for (let seed = 1; seed <= SEEDS; seed++) {
    const score = playRound(seed, pilot, delay).evaded;
    scores.push(score);
    const m: Medal | null = medalFor(score, EVASION_MEDALS, true);
    t[m ?? 'none']++;
  }
  scores.sort((a, b) => a - b);
  t.median = scores[SEEDS >> 1] ?? 0;
  return t;
}

describe('Missile Evasion medals (simulated pilots)', () => {
  it('keeps the tuned seeker gimbal and hit radius', () => {
    expect(SEEKER.gimbal).toBeCloseTo((72 * Math.PI) / 180, 6);
    expect(SEEKER.hitRadius).toBe(14);
    expect(EVASION_MEDALS).toEqual({ bronze: 12, silver: 24, gold: 38 });
  });

  it('gives nothing for flying straight or only spamming flares', () => {
    expect(tally(idle, 0).none).toBe(SEEDS);
    expect(tally(flareSpammer, 0).none).toBe(SEEDS);
  });

  it('gives circling at most a rare bronze or silver, never gold', () => {
    const circle = tally(circler, 0);
    expect(circle.median).toBeLessThan(EVASION_MEDALS.bronze);
    expect(circle.silver + circle.gold).toBe(0);
    const spin = tally(spinner, 0);
    expect(spin.median).toBeLessThan(EVASION_MEDALS.bronze);
    expect(spin.gold).toBe(0);
  });

  it('needs break turns: flares alone reach bronze at best', () => {
    const t = tally(skilled({ ...ACE, breakAt: -1 }));
    expect(t.silver + t.gold).toBe(0);
  });

  it('rewards well-timed breaks plus flares with silver, often gold', () => {
    const ace = tally(skilled(ACE));
    expect(ace.median).toBeGreaterThanOrEqual(EVASION_MEDALS.silver);
    expect(ace.gold).toBeGreaterThanOrEqual(SEEDS * 0.3);
    const human = tally(skilled({ ...ACE, jitter: 0.15 }), 0.25);
    expect(human.median).toBeGreaterThanOrEqual(EVASION_MEDALS.silver);
    expect(human.gold).toBeGreaterThan(0);
    expect(human.gold).toBeLessThan(ace.gold);
  });

  it('costs gold for breaking too late or skipping the flares', () => {
    const ace = tally(skilled(ACE));
    const late = tally(skilled({ ...ACE, breakAt: 0.6 }));
    expect(late.median).toBeLessThan(EVASION_MEDALS.silver);
    expect(late.gold).toBeLessThan(ace.gold / 2);
    const noFlares = tally(skilled({ ...ACE, flareWorth: 0 }));
    expect(noFlares.gold).toBeLessThan(ace.gold);
  });
});
