import { describe, expect, it } from 'vitest';
import { createRange, raised, RANGE, RANGE_MEDALS, rangeOver, shoot, SPOTS, stepRange, type RangeState } from '../../src/game/minigames/range';

// FIRING RANGE (doc 90): boards pop up, walkers are shot, monkeys spared; quick hits and streaks score more.

const DT = 1 / 60;

/** A shooter: aims at every enemy board `reaction` s after it pops up and hits `accuracy` of them; never a monkey. */
function play(reaction: number, accuracy: number): RangeState {
  let s = createRange(7);
  let shots = 0;
  while (!rangeOver(s)) {
    s = stepRange(s, DT);
    for (const b of s.boards) {
      const spot = SPOTS[b.spot];
      if (!spot || b.hit || b.kind !== 'foe' || Math.abs(s.t - b.at - reaction) >= DT / 2 || raised(b, s.t) < 0.6) continue;
      shots += 1;
      s = shoot(s, (shots % 10) / 10 < accuracy ? spot : { x: 0, y: 0 }).state;
    }
  }
  return s;
}

describe('firing range (doc 90)', () => {
  it('pops boards up over the minute, faster towards the end, and ends after a minute', () => {
    let s = createRange(1);
    for (let i = 0; i < 60 * 10; i++) s = stepRange(s, DT);
    expect(s.spawned).toBeGreaterThan(9);
    while (!rangeOver(s)) s = stepRange(s, DT);
    expect(s.t).toBe(RANGE.length);
  });

  it('scores a walker, quicker and in a streak for more; a monkey costs points; a miss breaks the streak', () => {
    let s = createRange(2);
    s = { ...s, t: 1, boards: [{ spot: 4, kind: 'foe', at: 0.6, up: 1.8, hit: false }, { spot: 5, kind: 'friend', at: 0.6, up: 1.8, hit: false }] };
    const spot = SPOTS[4];
    const monkey = SPOTS[5];
    if (!spot || !monkey) throw new Error('spots');
    const first = shoot(s, spot);
    expect(first.result.kind).toBe('foe');
    expect(first.result.points).toBeGreaterThan(RANGE.foe);
    expect(first.state.streak).toBe(1);
    expect(shoot(first.state, spot).result.kind).toBe('miss');
    const bad = shoot(first.state, monkey);
    expect(bad.result.points).toBe(RANGE.friend);
    expect(bad.state.streak).toBe(0);
  });

  it('gives a quick, sure shooter gold, a slow one who misses a lot bronze', () => {
    expect(play(0.25, 1).points).toBeGreaterThanOrEqual(RANGE_MEDALS.gold);
    const slow = play(0.9, 0.6).points;
    expect(slow).toBeGreaterThanOrEqual(RANGE_MEDALS.bronze);
    expect(slow).toBeLessThan(RANGE_MEDALS.silver);
  });
});
