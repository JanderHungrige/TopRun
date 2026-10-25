import { describe, it, expect } from 'vitest';
import {
  CLIMB_TIME, COUNTDOWN, createTakeoff, DECK_LENGTH, GREEN_HI, GREEN_LO, stepTakeoff, STROKE_TIME,
  type TakeoffInput, type TakeoffState,
} from '../../src/game/takeoff-logic';

const DT = 1 / 60;
const idle: TakeoffInput = { throttleHeld: false, action: false, skip: false };
const hold: TakeoffInput = { throttleHeld: true, action: false, skip: false };
const e: TakeoffInput = { throttleHeld: false, action: true, skip: false };

function run(s: TakeoffState, input: TakeoffInput, seconds: number): TakeoffState {
  let st = s;
  for (let i = 0; i < Math.round(seconds / DT); i++) st = stepTakeoff(st, input, DT);
  return st;
}

/** Holds Space until the needle sits in the middle of the green, then lets go. */
function spoolToGreen(): TakeoffState {
  let s = createTakeoff();
  while (s.rawThrottle < (GREEN_LO + GREEN_HI) / 2) s = stepTakeoff(s, hold, DT);
  return s;
}

const lockedNow = (): TakeoffState => stepTakeoff(spoolToGreen(), e, DT);
const readyNow = (): TakeoffState => run(lockedNow(), idle, COUNTDOWN + 0.05);

describe('Carrier Takeoff', () => {
  describe('spool', () => {
    it('raises the lever while Space is held and keeps it in place when released', () => {
      const up = run(createTakeoff(), hold, 1);
      expect(up.rawThrottle).toBeCloseTo(0.5, 2);
      const still = run(up, idle, 3);
      expect(still.rawThrottle).toBe(up.rawThrottle);
      expect(still.phase).toBe('spool');
    });

    it('bleeds a released lever out of the red back into the green', () => {
      const red = run(createTakeoff(), hold, 2.5);
      expect(red.overspeed).toBe(true);
      const settled = run(red, idle, 1);
      expect(settled.rawThrottle).toBeCloseTo(0.95, 5);
      expect(settled.overspeed).toBe(false);
      expect(stepTakeoff(settled, e, 1 / 60).phase).toBe('locked');
    });

    it('marks overspeed in the red zone', () => {
      const s = run(createTakeoff(), hold, 2.5);
      expect(s.throttle).toBeGreaterThanOrEqual(GREEN_HI);
      expect(s.overspeed).toBe(true);
      expect(spoolToGreen().overspeed).toBe(false);
    });
  });

  describe('lock', () => {
    it('locks with E only while the needle is in the green', () => {
      const s = lockedNow();
      expect(s.phase).toBe('locked');
      expect(s.countdown).toBe(COUNTDOWN);
      expect(s.rejected).toBeNull();
      expect(stepTakeoff(createTakeoff(), e, DT).phase).toBe('spool');
    });

    it('rejects E below the green as low and in the red as high', () => {
      const low = stepTakeoff(run(createTakeoff(), hold, 0.5), e, DT);
      expect(low).toMatchObject({ phase: 'spool', rejected: 'low' });
      const high = stepTakeoff(run(createTakeoff(), hold, 2.5), e, DT);
      expect(high).toMatchObject({ phase: 'spool', rejected: 'high' });
    });
  });

  describe('countdown', () => {
    it('counts down 3 seconds while the throttle stays frozen, then becomes ready', () => {
      const locked = lockedNow();
      const mid = run(locked, hold, 1.5);
      expect(mid.phase).toBe('locked');
      expect(mid.countdown).toBeCloseTo(1.5, 1);
      expect(mid.rawThrottle).toBe(locked.rawThrottle);
      expect(readyNow().phase).toBe('ready');
    });

    it('ignores E during the countdown but counts it', () => {
      let s = lockedNow();
      s = stepTakeoff(s, e, DT);
      s = stepTakeoff(s, e, DT);
      expect(s.phase).toBe('locked');
      expect(s.earlyPresses).toBe(2);
    });
  });

  describe('launch', () => {
    it('launches with E after GO and rates the reaction time perfect, good or late', () => {
      const fast = stepTakeoff(run(readyNow(), idle, 0.3), e, DT);
      expect(fast).toMatchObject({ phase: 'catapult', rating: 'perfect' });
      expect(stepTakeoff(run(readyNow(), idle, 1.2), e, DT).rating).toBe('good');
      expect(stepTakeoff(run(readyNow(), idle, 4), e, DT).rating).toBe('late');
      expect(run(readyNow(), idle, 30).phase).toBe('ready');
    });

    it('runs the catapult and climbs out automatically to done', () => {
      const launched = stepTakeoff(readyNow(), e, DT);
      const mid = run(launched, idle, STROKE_TIME / 2);
      expect(mid.phase).toBe('catapult');
      expect(mid.deckPos).toBeGreaterThan(0);
      const climbing = run(launched, idle, STROKE_TIME + 0.1);
      expect(climbing.phase).toBe('climb');
      expect(climbing.deckPos).toBe(DECK_LENGTH);
      const done = run(climbing, idle, CLIMB_TIME + 0.1);
      expect(done.phase).toBe('done');
      expect(done.altitude).toBeGreaterThan(100);
      expect(done.rating).toBe('perfect');
    });
  });

  describe('skip', () => {
    it('ends immediately with rating skipped', () => {
      const s = stepTakeoff(createTakeoff(), { ...idle, skip: true }, DT);
      expect(s.phase).toBe('done');
      expect(s.rating).toBe('skipped');
      expect(stepTakeoff(s, e, DT)).toBe(s);
    });
  });
});
