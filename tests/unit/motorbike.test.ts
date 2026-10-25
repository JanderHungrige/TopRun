import { describe, expect, it } from 'vitest';
import {
  BOG, BOOST, createBike, DOWNSHIFT_OFF_RPM, DOWNSHIFT_RPM, GEAR_TOP, GEARS, IDLE_RPM, LIMITER_TIME, REDLINE_TORQUE, rpm, SHIFT,
  shiftRating, stepBike, torque,
  type Bike, type BikeControls,
} from '../../src/game/minigames/motorbike-bike';
import { NEEDS } from '../../src/game/minigames/motorbike-course';
import { jetAt, LIFTOFF_T, LIFTOFF_X, ROTATE_TIME } from '../../src/game/minigames/motorbike-jet';
import { placeholders } from '../../src/i18n/i18n';
import { MOTORBIKE_TEXT } from '../../src/i18n/minigames/motorbike';

// Motorbike vs. Jet (doc 22): the bike and Duke's jet. Course and race rules: motorbike-race.test.ts.

const DT = 1 / 60;
const FLAT: BikeControls = { throttle: 1, brake: false, lean: 0, shift: false, stunned: false };
const top = (gear: number): number => GEAR_TOP[gear - 1] ?? 0;
const bikeAt = (gear: number, r: number, extra: Partial<Bike> = {}): Bike => ({ ...createBike(), gear, v: r * top(gear), ...extra });

function ride(b: Bike, c: BikeControls, seconds: number): Bike {
  let out = b;
  for (let i = 0; i < Math.round(seconds / DT); i++) out = stepBike(out, c, DT).bike;
  return out;
}

describe('motorbike — the bike', () => {
  it('idles the rev meter at standstill and reads speed / redline otherwise', () => {
    expect(rpm(createBike())).toBe(IDLE_RPM);
    expect(rpm(bikeAt(3, 0.7))).toBeCloseTo(0.7, 6);
    expect(GEAR_TOP).toHaveLength(GEARS);
  });

  it('has its torque peak across the green band and falls off towards the redline', () => {
    expect(torque(0.1)).toBe(0.5);
    expect(torque(SHIFT.green)).toBe(1);
    expect(torque(SHIFT.late)).toBe(1);
    expect(torque(1)).toBeCloseTo(REDLINE_TORQUE, 6);
    expect(torque(0.96)).toBeLessThan(torque(SHIFT.late));
    expect(torque(0.6)).toBeGreaterThan(torque(0.4));
  });

  it('rates a shift press by the rev meter', () => {
    expect(shiftRating(SHIFT.ignore - 0.01)).toBeNull();
    expect(shiftRating(0.7)).toBe('early');
    expect(shiftRating(SHIFT.green)).toBe('perfect');
    expect(shiftRating(0.86)).toBe('perfect');
    expect(shiftRating(SHIFT.late)).toBe('perfect');
    expect(shiftRating(0.95)).toBe('late');
  });

  it('shifts up in the green with a boost and early with a bog', () => {
    const perfect = stepBike(bikeAt(2, 0.86), { ...FLAT, shift: true }, DT);
    expect(perfect.shift).toBe('perfect');
    expect(perfect.bike.gear).toBe(3);
    expect(perfect.bike.boost).toBeGreaterThan(BOOST.time - 0.05);
    const early = stepBike(bikeAt(2, 0.7), { ...FLAT, shift: true }, DT);
    expect(early.shift).toBe('early');
    expect(early.bike.bog).toBeGreaterThan(BOG.time - 0.05);
    const late = stepBike(bikeAt(2, 0.96), { ...FLAT, shift: true }, DT);
    expect(late.shift).toBe('late');
    expect(late.bike.boost).toBe(0);
    expect(late.bike.bog).toBe(0);
  });

  it('pulls harder with the boost and weaker with the bog', () => {
    const base = bikeAt(3, 0.65);
    const plain = ride(base, FLAT, 0.3).v;
    expect(ride({ ...base, boost: BOOST.time }, FLAT, 0.3).v).toBeGreaterThan(plain + 0.5);
    expect(ride({ ...base, bog: BOG.time }, FLAT, 0.3).v).toBeLessThan(plain - 0.5);
  });

  it('ignores a shift press at low revs and in top gear', () => {
    const low = stepBike(bikeAt(2, 0.5), { ...FLAT, shift: true }, DT);
    expect(low.shift).toBeNull();
    expect(low.bike.gear).toBe(2);
    const sixth = stepBike(bikeAt(GEARS, 0.85), { ...FLAT, shift: true }, DT);
    expect(sixth.shift).toBeNull();
    expect(sixth.bike.gear).toBe(GEARS);
  });

  it('bounces off the limiter, then shifts up by itself', () => {
    let b = bikeAt(1, 0.995);
    let atRed: number | null = null;
    for (let i = 1; i < 120; i++) {
      const r = stepBike(b, FLAT, DT);
      if (atRed !== null && r.bike.gear === 1) expect(r.bike.v).toBeLessThanOrEqual(b.v + 1e-9);
      if (atRed === null && rpm(r.bike) >= 1) atRed = i;
      b = r.bike;
      if (r.shift) {
        expect(r.shift).toBe('auto');
        expect(b.gear).toBe(2);
        expect((i - (atRed ?? 0)) * DT).toBeCloseTo(LIMITER_TIME, 1);
        return;
      }
    }
    throw new Error('never shifted');
  });

  it('shifts down by itself after braking, and only when lugging on the throttle', () => {
    const b = ride(bikeAt(4, 0.9), { ...FLAT, throttle: 0, brake: true }, 2.5);
    expect(b.gear).toBeLessThan(4);
    expect(b.gear === 1 || rpm(b) >= DOWNSHIFT_OFF_RPM).toBe(true);
    expect(stepBike(bikeAt(3, DOWNSHIFT_RPM + 0.05), FLAT, DT).bike.gear).toBe(3);
    expect(stepBike(bikeAt(3, DOWNSHIFT_RPM - 0.05), FLAT, DT).bike.gear).toBe(2);
  });

  it('tops out above 300 km/h tucked, slower sitting up', () => {
    const tucked = ride(bikeAt(GEARS, 0.8, { tuck: 1 }), { ...FLAT, lean: 1 }, 60);
    const upright = ride(bikeAt(GEARS, 0.8), FLAT, 60);
    expect(tucked.v * 3.6).toBeGreaterThan(310);
    expect(tucked.v * 3.6).toBeLessThan(330);
    expect(tucked.v - upright.v).toBeGreaterThan(3);
  });

  it('lifts the front wheel when leaning back, tucks when leaning forward, one cancels the other', () => {
    const w = ride(bikeAt(3, 0.6), { ...FLAT, lean: -1 }, 0.2);
    expect(w.wheelie).toBeGreaterThanOrEqual(NEEDS.wheelie);
    const k = ride(bikeAt(3, 0.6), { ...FLAT, lean: 1 }, 0.2);
    expect(k.tuck).toBeGreaterThanOrEqual(NEEDS.tuck);
    const back = ride(k, { ...FLAT, lean: -1 }, 0.3);
    expect(back.tuck).toBe(0);
    expect(back.wheelie).toBeGreaterThan(0.5);
  });

  it('rides slower on the back wheel', () => {
    const wheelie = ride(bikeAt(4, 0.6), { ...FLAT, lean: -1 }, 3);
    const plain = ride(bikeAt(4, 0.6), FLAT, 3);
    expect(wheelie.x).toBeLessThan(plain.x - 2);
  });

  it('cannot drive or lean while stunned', () => {
    const b = ride(bikeAt(3, 0.5), { ...FLAT, lean: -1, stunned: true }, 0.5);
    expect(b.v).toBeLessThan(0.5 * top(3));
    expect(b.wheelie).toBe(0);
  });
});

describe('motorbike — Duke\'s jet', () => {
  it('rolls from the start line and lifts off at the marker after 30-40 s', () => {
    expect(jetAt(0).x).toBe(0);
    expect(LIFTOFF_T).toBeGreaterThan(30);
    expect(LIFTOFF_T).toBeLessThan(40);
    expect(jetAt(LIFTOFF_T).x).toBeCloseTo(LIFTOFF_X, 3);
    let last = -1;
    for (let t = 0; t <= LIFTOFF_T; t += 0.5) {
      const j = jetAt(t);
      expect(j.v).toBeGreaterThan(last);
      expect(j.alt).toBe(0);
      last = j.v;
    }
  });

  it('rotates before lift-off and climbs out after it', () => {
    expect(jetAt(LIFTOFF_T - ROTATE_TIME - 0.1).pitch).toBe(0);
    expect(jetAt(LIFTOFF_T - 0.01).pitch).toBeGreaterThan(0.1);
    expect(jetAt(LIFTOFF_T + 1).alt).toBeGreaterThan(0);
    expect(jetAt(LIFTOFF_T + 2).alt).toBeGreaterThan(jetAt(LIFTOFF_T + 1).alt);
    expect(jetAt(LIFTOFF_T + 3).gear).toBeLessThan(1);
  });
});

describe('motorbike — strings', () => {
  it('has the same placeholders in English and German', () => {
    for (const k of Object.keys(MOTORBIKE_TEXT.en) as (keyof typeof MOTORBIKE_TEXT.en)[]) {
      expect(placeholders(MOTORBIKE_TEXT.de[k])).toEqual(placeholders(MOTORBIKE_TEXT.en[k]));
      expect(MOTORBIKE_TEXT.de[k].length).toBeGreaterThan(0);
    }
  });
});
