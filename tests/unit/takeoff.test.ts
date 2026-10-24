import { describe, it, expect } from 'vitest';
import {
  createTakeoff, stepTakeoff, DECK_LENGTH, GREEN_HI, GREEN_LO, STROKE_TIME,
  type TakeoffInput, type TakeoffState,
} from '../../src/game/takeoff-logic';

const DT = 1 / 60;
const idle: TakeoffInput = { throttleHeld: false, pressed: false, skip: false };
const hold: TakeoffInput = { throttleHeld: true, pressed: false, skip: false };
const press: TakeoffInput = { throttleHeld: true, pressed: true, skip: false };

function run(s: TakeoffState, input: TakeoffInput, seconds: number): TakeoffState {
  let st = s;
  for (let i = 0; i < Math.round(seconds / DT); i++) st = stepTakeoff(st, input, DT);
  return st;
}

/** Feathers the throttle like a player: hold below the green band, release above it. */
function spoolToCatapult(): TakeoffState {
  let s = createTakeoff();
  for (let i = 0; i < 1200 && s.phase === 'spool'; i++) {
    const target = (GREEN_LO + GREEN_HI) / 2;
    s = stepTakeoff(s, { ...idle, throttleHeld: s.rawThrottle < target }, DT);
  }
  return s;
}

function catapultUntilRemaining(remaining: number): TakeoffState {
  let s = spoolToCatapult();
  while (s.phase === 'catapult' && DECK_LENGTH - s.deckPos > remaining) s = stepTakeoff(s, hold, DT);
  return s;
}

describe('Carrier Takeoff', () => {
  describe('spool', () => {
    it('raises throttle while held and lowers it when released', () => {
      const up = run(createTakeoff(), hold, 0.5);
      expect(up.rawThrottle).toBeCloseTo(0.275, 2);
      const down = run(up, idle, 0.2);
      expect(down.rawThrottle).toBeLessThan(up.rawThrottle);
      expect(down.phase).toBe('spool');
    });

    it('launches only after the needle stays in the green zone for 1 s', () => {
      const s = spoolToCatapult();
      expect(s.phase).toBe('catapult');
      expect(s.deckPos).toBe(0);
      expect(s.clock).toBeGreaterThan(1.5);
    });

    it('resets the green timer in the red overspeed zone', () => {
      const s = run(createTakeoff(), hold, 4);
      expect(s.throttle).toBeGreaterThanOrEqual(GREEN_HI);
      expect(s.overspeed).toBe(true);
      expect(s.greenTime).toBe(0);
      expect(s.phase).toBe('spool');
    });
  });

  describe('catapult', () => {
    it('ignores a throttle press that was already held when the catapult fired', () => {
      const s = run(spoolToCatapult(), hold, STROKE_TIME * 0.5);
      expect(s.phase).toBe('catapult');
      expect(s.deckPos).toBeGreaterThan(0);
      expect(s.rating).toBeNull();
    });

    it('rates perfect when rotating within the last 50 px of the deck', () => {
      const s = stepTakeoff(catapultUntilRemaining(45), press, DT);
      expect(s.phase).toBe('climb');
      expect(s.rating).toBe('perfect');
      expect(run(s, idle, 3).phase).toBe('done');
    });

    it('rates good within 150 px and early before that', () => {
      expect(stepTakeoff(catapultUntilRemaining(140), press, DT).rating).toBe('good');
      expect(stepTakeoff(catapultUntilRemaining(400), press, DT).rating).toBe('early');
    });
  });

  describe('edge', () => {
    it('rates late when rotating within the 0.7 s grace after the deck end', () => {
      let s = catapultUntilRemaining(0);
      s = run(s, hold, 0.2);
      expect(s.phase).toBe('edge');
      expect(s.altitude).toBeLessThan(0);
      s = stepTakeoff(s, press, DT);
      expect(s.phase).toBe('climb');
      expect(s.rating).toBe('late');
    });

    it('ditches without a press and retries with attempts + 1', () => {
      let s = run(catapultUntilRemaining(0), hold, 1.0);
      expect(s.phase).toBe('ditched');
      s = stepTakeoff(s, press, DT);
      expect(s.phase).toBe('ditched');
      s = run(s, idle, 1);
      s = stepTakeoff(s, press, DT);
      expect(s.phase).toBe('spool');
      expect(s.attempts).toBe(2);
    });
  });

  describe('skip', () => {
    it('ends immediately with rating skipped', () => {
      const s = stepTakeoff(createTakeoff(), { ...idle, skip: true }, DT);
      expect(s.phase).toBe('done');
      expect(s.rating).toBe('skipped');
      expect(stepTakeoff(s, press, DT)).toBe(s);
    });
  });
});
