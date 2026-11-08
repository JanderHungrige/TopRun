import { describe, expect, it } from 'vitest';
import { createSonar, distance, ping, SONAR_MEDALS, SONAR_RULES, subPoints, torpedo, type SonarState } from '../../src/game/minigames/sonar';

// SONAR HUNT (doc 88): pings return the sub's distance, a torpedo on its cell sinks it; five subs, eight torpedoes.

describe('sonar hunt (doc 88)', () => {
  it('returns an echo ring exactly as far as the sub', () => {
    const s = createSonar(1);
    const r = ping(s, { x: 0, y: 0 });
    expect(r.state.pings[0]?.range).toBeCloseTo(distance({ x: 0, y: 0 }, s.sub), 9);
    expect(r.state.pingsNow).toBe(1);
  });

  it('sinks the sub with a torpedo on its cell, a miss costs a torpedo and points', () => {
    let s = createSonar(2);
    const sub = s.sub;
    s = ping(s, { x: 0, y: 0 }).state;
    s = ping(s, { x: 9, y: 6 }).state;
    const away = { x: (sub.x + 5) % 10, y: sub.y };
    const miss = torpedo(s, away);
    expect(miss.event).toBe('miss');
    expect(miss.state.torpedoes).toBe(SONAR_RULES.torpedoes - 1);
    const hit = torpedo(miss.state, sub);
    expect(hit.event).toBe('sunk');
    expect(hit.state.points).toBe(subPoints(2, 1));
    expect(hit.state.sunk).toBe(1);
    expect(hit.state.torpedoes).toBe(SONAR_RULES.torpedoes - 1);
  });

  it('scores a sub less for every extra ping and miss, never below the floor', () => {
    expect(subPoints(1, 0)).toBe(120);
    expect(subPoints(3, 1)).toBe(120 - 20 - 25);
    expect(subPoints(20, 5)).toBe(SONAR_RULES.least);
  });

  it('ends after the fifth sub or the last torpedo', () => {
    let s: SonarState = createSonar(3);
    for (let i = 0; i < 5; i++) s = torpedo(s, s.sub).state;
    expect(s.over).toBe(true);
    expect(s.points).toBe(5 * 120);
    let t = createSonar(4);
    const wrong = { x: (t.sub.x + 1) % 10, y: t.sub.y };
    for (let i = 0; i < SONAR_RULES.torpedoes; i++) t = torpedo(t, wrong).state;
    expect(t.over).toBe(true);
    expect(SONAR_MEDALS.gold).toBeLessThanOrEqual(5 * 120);
  });

  it('lets the sub slip a cell away every third ping from the third sub on', () => {
    let s = createSonar(5);
    s = { ...s, sunk: 2 };
    const before = s.sub;
    for (let i = 0; i < 3; i++) s = ping(s, { x: 0, y: 0 }).state;
    expect(s.slipped).toBe(true);
    expect(Math.abs(s.sub.x - before.x) + Math.abs(s.sub.y - before.y)).toBe(1);
  });
});
