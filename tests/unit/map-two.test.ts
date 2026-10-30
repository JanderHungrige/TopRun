import { describe, it, expect } from 'vitest';
import { ALL_MISSIONS } from '../../src/data/missions';
import { computePayout } from '../../src/game/economy';
import { MAP_TWO, mapTwoHit, mapTwoHp, payScale } from '../../src/game/map-two';
import type { MissionResult } from '../../src/data/types';

// Map 2 pays and hits harder by mission number (wave 3, doc 43); map 1 is untouched.

const mission = (n: number) => {
  const m = ALL_MISSIONS.find((x) => x.number === n);
  if (!m) throw new Error(`m${n}`);
  return m;
};

describe('Map 2 pays and hits harder (doc 43, wave 3)', () => {
  it('leaves map 1 alone', () => {
    for (const n of [1, 12, 30]) {
      expect(payScale(n)).toBe(1);
      expect(mapTwoHp(n)).toBe(1);
      expect(mapTwoHit(n)).toBe(1);
    }
  });

  it('pays × 1.08 at m31, × 3.1 at m45 and × 7 at m60, growing every mission', () => {
    expect(payScale(31)).toBeCloseTo(1.084, 6);
    expect(payScale(45)).toBeCloseTo(3.1, 6);
    expect(payScale(60)).toBeCloseTo(7, 6);
    for (let n = 32; n <= 60; n++) {
      expect(payScale(n)).toBeGreaterThan(payScale(n - 1));
      expect(mapTwoHp(n)).toBeGreaterThan(mapTwoHp(n - 1));
      expect(mapTwoHit(n)).toBeGreaterThan(mapTwoHit(n - 1));
    }
  });

  it('makes the last mission tougher than the first of map 2 by the documented factors', () => {
    const x = 30;
    expect(mapTwoHp(60)).toBeCloseTo(1 + MAP_TWO.hp * x + MAP_TWO.hp2 * x * x, 6);
    expect(mapTwoHit(60)).toBeCloseTo(1 + MAP_TWO.hit * x, 6);
  });

  it('pays the mission reward with the map-2 factor, first clears and replays alike', () => {
    const win = { success: true, aborted: false, takeoff: 'skipped', hullRatio: 0.5, collected: 0, kills: 0, spawned: 1 } as unknown as MissionResult;
    const m50 = mission(50);
    expect(computePayout(m50, win, true).base).toBe(Math.round(m50.reward * payScale(50)));
    expect(computePayout(m50, win, false).base).toBe(Math.round(m50.reward * payScale(50) * 0.5));
    const m10 = mission(10);
    expect(computePayout(m10, win, true).base).toBe(m10.reward);
  });
});
