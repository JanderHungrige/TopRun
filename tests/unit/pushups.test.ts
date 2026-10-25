import { describe, it, expect } from 'vitest';
import { createRng } from '../../src/core/rng';
import { medalFor } from '../../src/game/minigames/core';
import {
  createPushups, PUSHUP_MEDALS, PUSHUP_RULES as R, rateRep, repCost, rivalPhase, rivalReps, stepPushups, tempoClock, winner,
  type PushupInput, type PushupState,
} from '../../src/game/minigames/pushups';
import { placeholders } from '../../src/i18n/i18n';
import { PUSHUP_TEXT } from '../../src/i18n/minigames/pushups';

const DT = 1 / 60;
const NONE: PushupInput = { left: false, right: false };
const LEFT: PushupInput = { left: true, right: false };
const RIGHT: PushupInput = { left: false, right: true };
const SEEDS = Array.from({ length: 20 }, (_, i) => i * 7919 + 3);

function idle(s: PushupState, seconds: number): PushupState {
  let out = s;
  for (let i = 0; i < Math.round(seconds * 60); i++) out = stepPushups(out, NONE, DT);
  return out;
}

/** Waits `gap` seconds, then presses `inp` for one tick. */
function press(s: PushupState, inp: PushupInput, gap = 0): PushupState {
  return stepPushups(idle(s, gap), inp, DT);
}

/** One full rep: down after `gap / 2`, up after another `gap / 2`. */
const rep = (s: PushupState, gap: number): PushupState => press(press(s, LEFT, gap / 2 - DT), RIGHT, gap / 2 - DT);

/** Bot playtest: a stroke (the one that fits) every `half(i)` seconds until the round is over. */
function bot(seed: number, half: (i: number) => number): PushupState {
  let s = createPushups(seed);
  let next = half(0);
  let i = 0;
  while (!s.over) {
    const due = s.time + DT >= next - 1e-9;
    s = stepPushups(s, due ? (s.down ? RIGHT : LEFT) : NONE, DT);
    if (due) next += half(++i);
  }
  return s;
}

const gaussian = (seed: number): (() => number) => {
  const rng = createRng(seed);
  return () => Math.sqrt(-2 * Math.log(1 - rng.next())) * Math.cos(2 * Math.PI * rng.next());
};

describe('Push-up Challenge', () => {
  describe('start', () => {
    it('starts up, full stamina, no reps', () => {
      const s = createPushups(1);
      expect(s).toMatchObject({ time: 0, reps: 0, clean: 0, down: false, stamina: 100, burnout: 0, burnouts: 0, over: false });
      expect(tempoClock(s)).toBeNull();
    });

    it('schedules the rival deterministically: 36-40 increasing reps, the last at 29.0-29.8 s', () => {
      for (const seed of SEEDS) {
        const r = createPushups(seed).rival;
        expect(r.length).toBeGreaterThanOrEqual(36);
        expect(r.length).toBeLessThanOrEqual(40);
        r.forEach((t, i) => expect(t).toBeGreaterThan(i === 0 ? 0.5 : r[i - 1] ?? 0));
        const last = r[r.length - 1] ?? 0;
        expect(last).toBeGreaterThanOrEqual(29);
        expect(last).toBeLessThanOrEqual(29.8);
        expect(createPushups(seed).rival).toEqual(r);
      }
      const counts = new Set(SEEDS.map((seed) => createPushups(seed).rival.length));
      expect(counts.size).toBeGreaterThan(2);
    });

    it('slows the rival down towards the end', () => {
      const r = createPushups(42).rival;
      const gap = (i: number): number => (r[i] ?? 0) - (r[i - 1] ?? 0);
      const early = (gap(1) + gap(2) + gap(3) + gap(4)) / 4;
      const n = r.length;
      const late = (gap(n - 1) + gap(n - 2) + gap(n - 3) + gap(n - 4)) / 4;
      expect(late).toBeGreaterThan(early);
    });
  });

  describe('strokes', () => {
    it('counts a rep for LEFT (down) then RIGHT (up)', () => {
      let s = press(createPushups(1), LEFT, 0.2);
      expect(s.down).toBe(true);
      expect(s.reps).toBe(0);
      s = press(s, RIGHT, 0.3);
      expect(s.down).toBe(false);
      expect(s.reps).toBe(1);
    });

    it('ignores presses that do not fit the position', () => {
      let s = press(createPushups(1), RIGHT, 0.2);
      expect(s).toMatchObject({ down: false, reps: 0 });
      s = press(press(s, LEFT, 0.2), LEFT, 0.2);
      expect(s).toMatchObject({ down: true, reps: 0 });
      s = press(press(s, RIGHT, 0.2), RIGHT, 0.2);
      expect(s.reps).toBe(1);
    });

    it('takes at most one stroke per tick', () => {
      const both: PushupInput = { left: true, right: true };
      let s = stepPushups(createPushups(1), both, DT);
      expect(s).toMatchObject({ down: true, reps: 0 });
      s = stepPushups(s, both, DT);
      expect(s).toMatchObject({ down: false, reps: 1 });
    });
  });

  describe('tempo', () => {
    it('rates the interval between reps against the 0.60-0.90 s zone', () => {
      expect(R.zoneMin).toBe(0.6);
      expect(R.zoneMax).toBe(0.9);
      expect(rateRep(null)).toBe('clean');
      expect(rateRep(0.6)).toBe('clean');
      expect(rateRep(0.9)).toBe('clean');
      expect(rateRep(0.59)).toBe('fast');
      expect(rateRep(0.91)).toBe('slow');
    });

    it('charges clean 3, slow 2, fast 3 + 100 per second under the zone', () => {
      expect(repCost(null)).toBe(3);
      expect(repCost(0.75)).toBe(3);
      expect(repCost(1.4)).toBe(2);
      expect(repCost(0.3)).toBeCloseTo(33, 6);
      expect(repCost(0.5)).toBeCloseTo(13, 6);
    });

    it('rates the first rep clean and the next ones by their interval', () => {
      let s = rep(createPushups(1), 0.2);
      expect(s.last).toMatchObject({ rating: 'clean', interval: null });
      s = rep(s, 0.7);
      expect(s.last?.rating).toBe('clean');
      expect(s.last?.interval).toBeCloseTo(0.7, 1);
      s = rep(s, 0.3);
      expect(s.last?.rating).toBe('fast');
      s = rep(s, 1.2);
      expect(s.last?.rating).toBe('slow');
      expect(s.clean).toBe(2);
      expect(s.reps).toBe(4);
    });

    it('runs the tempo clock since the last rep', () => {
      const s = idle(rep(createPushups(1), 0.4), 0.5);
      expect(tempoClock(s)).toBeCloseTo(0.5, 1);
    });
  });

  describe('stamina and burnout', () => {
    it('drains slowly with a steady clean rhythm', () => {
      let s = createPushups(1);
      for (let i = 0; i < 20; i++) s = rep(s, 0.7);
      expect(s.clean).toBe(20);
      expect(s.burnouts).toBe(0);
      expect(s.stamina).toBeGreaterThan(55);
    });

    it('burns out within two seconds of mashing', () => {
      let s = createPushups(1);
      while (s.burnout === 0 && s.time < 5) s = rep(s, 0.2);
      expect(s.time).toBeLessThan(2);
      expect(s).toMatchObject({ stamina: 0, burnout: R.burnoutTime, burnouts: 1, down: false });
    });

    it('recovers 1.5/s while working and 18/s after a 0.6 s pause, capped at 100', () => {
      let s = createPushups(1);
      for (let i = 0; i < 4; i++) s = rep(s, 0.3);
      const low = s.stamina;
      s = idle(s, 2);
      expect(s.stamina - low).toBeCloseTo(0.6 * R.regenBase + 1.4 * R.regenIdle, 0);
      expect(idle(s, 10).stamina).toBe(100);
    });

    it('ignores input during the 1.5 s burnout, then restarts at 25 stamina with the tempo from that moment', () => {
      let s = createPushups(1);
      while (s.burnout === 0) s = rep(s, 0.2);
      const reps = s.reps;
      for (let i = 0; i < 8; i++) s = rep(s, 0.16);
      expect(s.reps).toBe(reps);
      expect(s.burnout).toBeGreaterThan(0);
      while (s.burnout > 0) s = stepPushups(s, NONE, DT);
      expect(s.stamina).toBe(R.burnoutStamina);
      expect(s.down).toBe(false);
      expect(tempoClock(s)).toBe(0);
      const fresh = s;
      s = rep(fresh, 0.7);
      expect(s.reps).toBe(reps + 1);
      expect(s.last?.rating).toBe('clean');
      s = rep(fresh, 0.2);
      expect(s.last?.rating).toBe('fast');
      expect(s.burnout).toBe(R.burnoutTime);
    });
  });

  describe('end of round', () => {
    it('ends after 30 s and then ignores everything', () => {
      let s = idle(createPushups(3), R.roundTime - 0.1);
      expect(s.over).toBe(false);
      s = idle(s, 0.2);
      expect(s.over).toBe(true);
      expect(s.time).toBe(R.roundTime);
      const after = rep(s, 0.7);
      expect(after.reps).toBe(s.reps);
      expect(after.time).toBe(R.roundTime);
    });

    it('lets the rival finish his whole schedule and animates within his reps', () => {
      for (const seed of SEEDS.slice(0, 5)) {
        let s = createPushups(seed);
        expect(rivalReps(s)).toBe(0);
        s = idle(s, 10);
        expect(rivalReps(s)).toBeGreaterThan(10);
        expect(rivalPhase(s)).toBeGreaterThanOrEqual(0);
        expect(rivalPhase(s)).toBeLessThanOrEqual(1);
        s = idle(s, 21);
        expect(rivalReps(s)).toBe(s.rival.length);
        expect(rivalPhase(s)).toBe(0);
      }
    });

    it('names the winner by reps', () => {
      const s = createPushups(5);
      const over = { ...s, time: R.roundTime, over: true };
      const n = s.rival.length;
      expect(winner({ ...over, reps: n + 1 })).toBe('player');
      expect(winner({ ...over, reps: n - 1 })).toBe('rival');
      expect(winner({ ...over, reps: n })).toBe('tie');
    });
  });

  describe('balance (bot playtest, doc 12)', () => {
    const score = (half: (i: number) => number): number[] => SEEDS.map((seed) => bot(seed, half).reps);
    const medal = (n: number) => medalFor(n, PUSHUP_MEDALS, true);

    it('uses bronze 25, silver 35, gold 45', () => {
      expect(PUSHUP_MEDALS).toEqual({ bronze: 25, silver: 35, gold: 45 });
    });

    it('a masher (a press every 0.10 s) wins no medal', () => {
      for (const n of score(() => 0.1)) expect(medal(n)).toBeNull();
    });

    it('a semi-masher (a rep every 0.50 s) stays at bronze', () => {
      for (const n of score(() => 0.25)) expect(medal(n)).toBe('bronze');
    });

    it('a steady 0.75 s rhythm (the rival\'s pace) earns silver', () => {
      for (const n of score(() => 0.375)) expect(medal(n)).toBe('silver');
    });

    it('a steady 0.66 s rhythm earns gold', () => {
      for (const n of score(() => 0.33)) expect(medal(n)).toBe('gold');
    });

    it('a human-like 0.68 s ± 0.05 s rhythm beats the rival', () => {
      for (const seed of SEEDS) {
        const g = gaussian(seed + 1);
        const s = bot(seed, () => 0.34 + g() * 0.025);
        expect(winner(s)).toBe('player');
      }
    });
  });

  describe('strings', () => {
    it('has the same keys and placeholders in English and German', () => {
      const keys = Object.keys(PUSHUP_TEXT.en) as Array<keyof typeof PUSHUP_TEXT.en>;
      expect(Object.keys(PUSHUP_TEXT.de).sort()).toEqual([...keys].sort());
      for (const k of keys) expect(placeholders(PUSHUP_TEXT.de[k])).toEqual(placeholders(PUSHUP_TEXT.en[k]));
    });
  });
});
