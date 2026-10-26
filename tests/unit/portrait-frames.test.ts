import { describe, expect, it } from 'vitest';
import { BLINK_TIME, blinking, breathBob, portraitFrame, talking, TALK_OPEN } from '../../src/game/portrait-frames';

// Doc 33: which frame of an image portrait shows — talk while the mouth is open, a 120 ms blink every 3–6 s with a
// per-character phase, the base image otherwise — and the one-pixel breathing bob.

const DT = 0.002;

/** Start times and lengths of every blink in [0, until) for one character. */
function blinks(seed: number, until = 240): { start: number; length: number }[] {
  const out: { start: number; length: number }[] = [];
  let on = -1;
  for (let i = 0; i * DT < until; i++) {
    const t = i * DT;
    const b = blinking(t, seed);
    if (b && on < 0) on = t;
    if (!b && on >= 0) {
      if (on > 0) out.push({ start: on, length: t - on }); // a blink already running at t = 0 is cut short
      on = -1;
    }
  }
  return out;
}

describe('portrait frames', () => {
  it('blinks for about 120 ms, once every 3 to 6 seconds', () => {
    for (const seed of [0.3, 1.9, 3.1, 4.6, 7.2]) {
      const list = blinks(seed);
      expect(list.length).toBeGreaterThan(240 / 6 - 2);
      expect(list.length).toBeLessThan(240 / 3 + 2);
      for (const b of list) expect(Math.abs(b.length - BLINK_TIME)).toBeLessThanOrEqual(2 * DT);
      for (let i = 1; i < list.length; i++) {
        const gap = list[i]!.start - list[i - 1]!.start;
        expect(gap).toBeGreaterThan(3 - 2 * DT);
        expect(gap).toBeLessThan(6 + 2 * DT);
      }
    }
  });

  it('gives every character its own blink phase and varies the rhythm', () => {
    const firsts = [0.3, 1.9, 3.1, 4.6].map((seed) => blinks(seed, 30).map((b) => b.start.toFixed(2)).join());
    expect(new Set(firsts).size).toBe(4);
    const gaps = blinks(0.3).map((b, i, all) => (i > 0 ? b.start - all[i - 1]!.start : 0)).slice(1);
    expect(Math.max(...gaps) - Math.min(...gaps)).toBeGreaterThan(1);
  });

  it('opens the talk frame from the threshold up', () => {
    expect(talking(0)).toBe(false);
    expect(talking(TALK_OPEN - 0.01)).toBe(false);
    expect(talking(TALK_OPEN)).toBe(true);
    expect(talking(1)).toBe(true);
  });

  it('prefers talk over blink over base, and only uses frames that exist', () => {
    const blinkAt = blinks(1.9, 10)[0]!.start + BLINK_TIME / 2;
    const restAt = blinkAt + 1;
    const all = { talk: true, blink: true };
    expect(portraitFrame(blinkAt, 1, 1.9, all)).toBe('talk');
    expect(portraitFrame(blinkAt, 0, 1.9, all)).toBe('blink');
    expect(portraitFrame(restAt, 0, 1.9, all)).toBe('base');
    expect(portraitFrame(restAt, 1, 1.9, all)).toBe('talk');
    expect(portraitFrame(blinkAt, 1, 1.9, { talk: false, blink: true })).toBe('blink'); // no talk frame yet
    expect(portraitFrame(blinkAt, 0, 1.9, { talk: true, blink: false })).toBe('base'); // the admiral: sunglasses
    expect(portraitFrame(blinkAt, 1, 1.9, { talk: false, blink: false })).toBe('base');
  });

  it('breathes by one pixel, part of the time, out of step between characters', () => {
    const at = (seed: number): number[] => Array.from({ length: 400 }, (_, i) => breathBob(i * 0.02, seed));
    const a = at(0.3);
    expect(new Set(a)).toEqual(new Set([0, 1]));
    const down = a.filter((v) => v === 1).length / a.length;
    expect(down).toBeGreaterThan(0.2);
    expect(down).toBeLessThan(0.6);
    expect(at(3.1)).not.toEqual(a);
  });
});
