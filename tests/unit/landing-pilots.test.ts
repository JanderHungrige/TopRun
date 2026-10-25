import { describe, it, expect } from 'vitest';
import { medalFor, type Medal } from '../../src/game/minigames/core';
import { createLanding, LANDING_MEDALS, landingScore, stepLanding, type LandingState } from '../../src/game/minigames/landing';
import { DECK } from '../../src/game/minigames/landing-deck';
import { lsoStep, NEW_LSO, type LsoCall, type LsoMemo } from '../../src/game/minigames/landing-lso';
import { ACE, AVERAGE, flyRound, GOOD, holdInput, NOVICE, ROOKIE, type PilotSkill } from './landing-pilot';

const DT = 1 / 60;
const SEEDS = 20;

function medals(skill: PilotSkill): Record<Medal | 'none', number> {
  const out = { gold: 0, silver: 0, bronze: 0, none: 0 };
  for (let seed = 1; seed <= SEEDS; seed++) out[medalFor(landingScore(flyRound(skill, seed)), LANDING_MEDALS, true) ?? 'none']++;
  return out;
}

/** The calls Paddles makes over one pass flown by `fly`, with the range (m before the ramp) of each. */
function calls(start: LandingState, fly: (s: LandingState) => ReturnType<typeof holdInput>): { call: LsoCall; at: number; t: number }[] {
  const out: { call: LsoCall; at: number; t: number }[] = [];
  let memo: LsoMemo = NEW_LSO;
  let s = start;
  for (let i = 0; s.phase === 'approach' && i < 60 * 40; i++) {
    s = stepLanding(s, fly(s), DT);
    const r = lsoStep(memo, s, DT);
    memo = r.memo;
    if (r.call) out.push({ call: r.call, at: -s.jet.z, t: s.passT });
  }
  return out;
}

describe('Carrier Landing pilots', () => {
  it('lets Paddles call the ball once, then stay quiet while the approach is steady', () => {
    const c = calls(createLanding(3, 0), (s) => holdInput(s));
    expect(c[0]?.call).toBe('rogerBall');
    expect(c.filter((x) => x.call === 'rogerBall')).toHaveLength(1);
    expect(c[0]!.at).toBeLessThanOrEqual(1400 + 2);
    expect(c.every((x) => x.call === 'rogerBall' || x.call === 'nice' || x.call === 'right' || x.call === 'left')).toBe(true);
    expect(c.every((x) => x.at > 0)).toBe(true);
  });

  it('calls for power when low, keeps calls 1.6 s apart and repeats a call no sooner than 3.5 s', () => {
    // fly at idle with the nose pushed down: low and slow
    const c = calls(createLanding(3, 0), (s) => ({ ...holdInput(s), y: s.jet.z > -1500 ? -0.2 : holdInput(s).y, throttle: 0 }));
    expect(c.some((x) => x.call === 'power')).toBe(true);
    for (let i = 1; i < c.length; i++) expect(c[i]!.t - c[i - 1]!.t).toBeGreaterThanOrEqual(1.6 - 1e-6);
    const powers = c.filter((x) => x.call === 'power');
    for (let i = 1; i < powers.length; i++) expect(powers[i]!.t - powers[i - 1]!.t).toBeGreaterThanOrEqual(3.5 - 1e-6);
  });

  it('calls line-up when drifting left of the centreline', () => {
    const c = calls(createLanding(3, 0), (s) => ({ ...holdInput(s), x: 0 }));
    expect(c.some((x) => x.call === 'right')).toBe(true);
  });

  it('gives better pilots better medals (simulated keyboard pilots)', () => {
    const ace = medals(ACE);
    const good = medals(GOOD);
    const avg = medals(AVERAGE);
    const rookie = medals(ROOKIE);
    const novice = medals(NOVICE);
    expect(ace.gold).toBeGreaterThanOrEqual(SEEDS * 0.75);
    expect(good.gold).toBeGreaterThanOrEqual(SEEDS * 0.6);
    expect(avg.gold + avg.silver).toBeGreaterThanOrEqual(SEEDS * 0.75);
    expect(avg.gold).toBeLessThan(ace.gold);
    expect(rookie.gold).toBeLessThanOrEqual(SEEDS * 0.35);
    expect(rookie.gold + rookie.silver + rookie.bronze).toBeGreaterThanOrEqual(SEEDS * 0.6);
    expect(novice.gold + novice.silver).toBeLessThanOrEqual(SEEDS * 0.1);
    expect(novice.none).toBeGreaterThanOrEqual(SEEDS * 0.5);
  });

  it('never lets the hook touch the ship outside the landing area', () => {
    for (let seed = 1; seed <= 6; seed++) {
      const s = flyRound(NOVICE, seed);
      expect(s.phase).toBe('over');
      expect(s.results).toHaveLength(3);
      for (const r of s.results) if (r.outcome.kind === 'trap') expect(r.outcome.wire).toBeLessThanOrEqual(DECK.wires.length);
    }
  });
});
