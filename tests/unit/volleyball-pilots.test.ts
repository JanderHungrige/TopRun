import { describe, expect, it } from 'vitest';
import { medalFor } from '../../src/game/minigames/core';
import { VB_MEDALS } from '../../src/game/minigames/volleyball-score';
import { BOTS, makeBot, playMatch, type BotName, type MatchResult } from './volleyball-bots';

// Beach Volleyball balance (doc 21, "Balance playtest"): simulated players over a fixed set of seeds.

const SEEDS = Array.from({ length: 12 }, (_, i) => i * 7919 + 11);
const results = new Map<BotName | 'idle', MatchResult[]>();

function play(name: BotName | 'idle'): MatchResult[] {
  const hit = results.get(name);
  if (hit) return hit;
  const out = SEEDS.map((seed) => playMatch(seed, name === 'idle' ? null : makeBot(BOTS[name], seed ^ 0x2545f491)));
  results.set(name, out);
  return out;
}

const median = (xs: readonly number[]): number => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)] ?? 0;
const share = (rs: readonly MatchResult[], f: (r: MatchResult) => boolean): number => rs.filter(f).length / rs.length;
const won = (r: MatchResult): boolean => r.home > r.away;
const medal = (r: MatchResult) => medalFor(r.score, VB_MEDALS, true);

describe('Beach Volleyball — simulated players', () => {
  it('a player who does nothing never wins', () => {
    const rs = play('idle');
    expect(share(rs, won)).toBe(0);
    expect(median(rs.map((r) => r.score))).toBeLessThanOrEqual(-4);
  });

  it('better players score more', () => {
    const med = (['novice', 'casual', 'good', 'pro'] as const).map((n) => median(play(n).map((r) => r.score)));
    for (let i = 1; i < med.length; i++) expect(med[i] ?? 0).toBeGreaterThanOrEqual(med[i - 1] ?? 0);
  });

  it('a novice loses most matches, a casual player wins some, a good one most', () => {
    expect(share(play('novice'), won)).toBeLessThanOrEqual(0.4);
    expect(share(play('casual'), won)).toBeGreaterThanOrEqual(0.25);
    expect(share(play('good'), won)).toBeGreaterThanOrEqual(0.75);
    expect(share(play('good'), (r) => medal(r) === 'gold')).toBeGreaterThanOrEqual(0.25);
  });

  it('a pro wins every match and mostly takes gold', () => {
    expect(share(play('pro'), won)).toBeGreaterThanOrEqual(0.9);
    expect(share(play('pro'), (r) => medal(r) === 'gold')).toBeGreaterThanOrEqual(0.6);
  });

  it('matches take a few minutes', () => {
    for (const r of play('good')) {
      expect(r.seconds).toBeGreaterThan(60);
      expect(r.seconds).toBeLessThan(420);
    }
  });
});
