import { describe, expect, it } from 'vitest';
import {
  beatTimes, createHighFive, HIGH_FIVE, HIGHFIVE_MEDALS, repAt, repDuration, stepHighFive, totalTime, type HighFiveState, type Verdict,
} from '../../src/game/minigames/highfive';

// Doc 42: the beats of the High Five, judging a press and the score.

const DT = 1 / 60;

/** Runs the whole round; `pressAt(beatIndex)` gives the offset (s) at which to press for that beat, or null. */
function play(pressAt: (i: number) => number | null): HighFiveState {
  const beats = beatTimes();
  const presses = beats.flatMap((b, i) => {
    const off = pressAt(i);
    return off === null ? [] : [b.at + off];
  });
  let s = createHighFive();
  let k = 0;
  while (s.t < totalTime() + 1) {
    // The press lands in the coming tick: it is judged at s.t + DT, at most one tick after its time.
    const press = k < presses.length && (presses[k] ?? Infinity) <= s.t + DT;
    if (press) k++;
    s = stepHighFive(s, DT, press).state;
  }
  return s;
}

describe('high five beats', () => {
  it('has eight reps getting faster, three beats each in order', () => {
    expect(repDuration(0)).toBeCloseTo(2.6);
    expect(repDuration(7)).toBeCloseTo(1.62);
    const beats = beatTimes();
    expect(beats).toHaveLength(24);
    expect(beats.map((b) => b.kind).slice(0, 3)).toEqual(['jump', 'high', 'low']);
    expect(beats.every((b, i) => i === 0 || b.at > (beats[i - 1]?.at ?? 0))).toBe(true);
    expect(totalTime()).toBeCloseTo(Array.from({ length: 8 }, (_, r) => repDuration(r)).reduce((a, b) => a + b, 0));
  });

  it('knows which rep a moment belongs to and how far into it', () => {
    expect(repAt(0)).toEqual({ rep: 0, f: 0 });
    const mid = repAt(repDuration(0) + repDuration(1) / 2);
    expect(mid.rep).toBe(1);
    expect(mid.f).toBeCloseTo(0.5);
    expect(repAt(totalTime() + 5).rep).toBe(HIGH_FIVE.reps - 1);
  });
});

describe('judging', () => {
  it('scores 2400 for every beat hit on time', () => {
    const s = play(() => 0);
    expect(s.verdicts.every((v) => v === 'perfect')).toBe(true);
    expect(s.points).toBe(2400);
  });

  it('misses every beat nobody presses for', () => {
    const s = play(() => null);
    expect(s.verdicts).toHaveLength(24);
    expect(s.verdicts.every((v) => v === 'miss')).toBe(true);
    expect(s.points).toBe(0);
  });

  it('grades late, early and far-too-early presses', () => {
    const one = (off: number): Verdict | undefined => play((i) => (i === 0 ? off : null)).verdicts[0];
    expect(one(0.04)).toBe('perfect');
    expect(one(0.1)).toBe('good');
    expect(one(-0.1)).toBe('good');
    expect(one(-0.2)).toBe('miss');
    // Far too early: ignored, so the beat is still open — and then passes unpressed.
    let s = createHighFive();
    const first = beatTimes()[0]?.at ?? 0;
    while (s.t < first - 0.5) s = stepHighFive(s, DT, false).state;
    const r = stepHighFive(s, DT, true);
    expect(r.judged).toBeNull();
    expect(r.state.next).toBe(0);
  });

  it('judges one beat per press and reports it', () => {
    let s = createHighFive();
    const first = beatTimes()[0]?.at ?? 0;
    while (s.t < first - DT) s = stepHighFive(s, DT, false).state;
    const r = stepHighFive(s, DT, true);
    expect(r.judged?.beat.kind).toBe('jump');
    expect(r.judged?.verdict).toBe('perfect');
    expect(r.state.next).toBe(1);
    expect(r.state.points).toBe(100);
  });

  it('pays 100 / 60 / 0 and has medals on the 2400 scale', () => {
    const s = play((i) => (i % 3 === 0 ? 0 : i % 3 === 1 ? 0.1 : null));
    expect(s.points).toBe(8 * 100 + 8 * 60);
    expect(HIGHFIVE_MEDALS).toEqual({ bronze: 1200, silver: 1700, gold: 2100 });
  });
});
