import { describe, expect, it } from 'vitest';
import { GEAR_TOP, type Bike } from '../../src/game/minigames/motorbike-bike';
import { COURSE, MISHAP, NEEDS, TRUCK, truckBlocked, type ObstacleKind } from '../../src/game/minigames/motorbike-course';
import { LIFTOFF_T, LIFTOFF_X } from '../../src/game/minigames/motorbike-jet';
import {
  createRace, finalScore, MOTORBIKE_MEDALS, raceGap, stepRace, truckHint, type RaceState, type RideInput,
} from '../../src/game/minigames/motorbike';
import { medalFor } from '../../src/game/minigames/core';

// Motorbike vs. Jet (doc 22): obstacles, mishaps, the truck window, the lift-off margin and the score.

const DT = 1 / 60;
const GO: RideInput = { throttle: 1, brake: false, lean: 0, shift: false };

function race(s: RaceState, input: RideInput, seconds: number): RaceState {
  let out = s;
  for (let i = 0; i < Math.round(seconds / DT); i++) out = stepRace(out, input, DT);
  return out;
}

const indexOf = (kind: ObstacleKind, nth = 0): number => COURSE.map((o, i) => ({ o, i })).filter((e) => e.o.kind === kind)[nth]?.i ?? -1;

/** A race with the bike `gap` m before obstacle `i` at speed `v`, the earlier obstacles cleared. */
function before(i: number, gap: number, v: number, bike: Partial<Bike> = {}): RaceState {
  const s = createRace();
  const o = COURSE[i];
  if (!o) throw new Error('no obstacle');
  const gear = GEAR_TOP.findIndex((t) => v / t < 0.9) + 1;
  const results = s.results.map((r, k) => (k < i ? 'clean' : r));
  return { ...s, t: 10, results, bike: { ...s.bike, x: o.x - gap, v, gear, ...bike } };
}

describe('motorbike — the course', () => {
  it('lies before the lift-off marker in order, with every kind of obstacle', () => {
    const xs = COURSE.map((o) => o.x);
    expect([...xs].sort((a, b) => a - b)).toEqual(xs);
    expect(Math.max(...COURSE.map((o) => o.x + o.len))).toBeLessThan(LIFTOFF_X - 100);
    for (const k of ['bump', 'oil', 'gate', 'truck'] as const) expect(indexOf(k)).toBeGreaterThanOrEqual(0);
  });

  it('takes a speed bump on the back wheel, bounces without', () => {
    const i = indexOf('bump');
    const clean = race(before(i, 1, 50, { wheelie: 1 }), { ...GO, lean: -1 }, 0.2);
    expect(clean.results[i]).toBe('clean');
    const hit = race(before(i, 1, 50), GO, 0.2);
    expect(hit.results[i]).toBe('bump');
    expect(hit.bike.v).toBeLessThan(50 * MISHAP.bump.keep + 1);
    expect(race(before(i, 1, NEEDS.slowBump - 2), GO, 0.3).results[i]).toBe('clean');
  });

  it('ducks under the barrier only in a tuck', () => {
    const i = indexOf('gate');
    expect(race(before(i, 1, 60, { tuck: 1 }), { ...GO, lean: 1 }, 0.2).results[i]).toBe('clean');
    const hit = race(before(i, 1, 60), GO, 0.2);
    expect(hit.results[i]).toBe('gate');
    expect(hit.bike.v).toBeLessThan(60 * MISHAP.gate.keep + 1);
    expect(hit.stun).toBeGreaterThan(MISHAP.gate.stun - 0.3);
  });

  it('crosses oil coasting, slides on the throttle, forgives a short blip', () => {
    const i = indexOf('oil');
    const o = COURSE[i];
    if (!o) throw new Error('no oil');
    const span = (o.len + 4) / 55 + 0.2;
    expect(race(before(i, 1, 55), { ...GO, throttle: 0 }, span).results[i]).toBe('clean');
    expect(race(before(i, 1, 55), GO, span).results[i]).toBe('slide');
    let s = race(before(i, 0.5, 55), GO, NEEDS.oilGrace - 2 * DT);
    s = race(s, { ...GO, throttle: 0 }, span);
    expect(s.results[i]).toBe('clean');
  });

  it('starts the truck when the bike is 150 m out; it blocks the lane for a window', () => {
    expect(truckBlocked(TRUCK.blockFrom - 0.01)).toBe(false);
    expect(truckBlocked((TRUCK.blockFrom + TRUCK.blockTo) / 2)).toBe(true);
    expect(truckBlocked(TRUCK.blockTo + 0.01)).toBe(false);
    const i = indexOf('truck');
    const early = race(before(i, TRUCK.trigger + 8, 70), GO, 0.05);
    expect(early.truckAt).toBeNull();
    const s = race(before(i, TRUCK.trigger + 2, 70), GO, 0.1);
    expect(s.truckAt).not.toBeNull();
  });

  it('skids to a stop flat out into the truck, passes behind it with a dab of brake', () => {
    const i = indexOf('truck');
    const o = COURSE[i];
    if (!o) throw new Error('no truck');
    const flat = race(before(i, TRUCK.trigger + 1, 88, { tuck: 1 }), { ...GO, lean: 1 }, 2.4);
    expect(flat.results[i]).toBe('truck');
    expect(flat.bike.x).toBeLessThanOrEqual(o.x);
    expect(flat.bike.v).toBe(0);
    let s = before(i, TRUCK.trigger + 1, 88, { tuck: 1 });
    for (let k = 0; k < 60 * 4; k++) {
      const t = s.truckAt === null ? 0 : s.t - s.truckAt;
      const eta = t + (o.x - s.bike.x) / Math.max(1, s.bike.v);
      s = stepRace(s, eta < TRUCK.blockTo + 0.15 && s.bike.x < o.x ? { ...GO, throttle: 0, brake: true } : { ...GO, lean: 1 }, DT);
    }
    expect(s.results[i]).toBe('clean');
    expect(s.bike.v).toBeGreaterThan(60);
  });

  it('hints brake while the bike would meet the truck, go once it would pass behind', () => {
    const i = indexOf('truck');
    expect(truckHint(before(i, TRUCK.trigger + 20, 88))).toBeNull();
    const rolling = race(before(i, TRUCK.trigger + 1, 88), GO, 0.1);
    expect(truckHint(rolling)).toBe('brake');
    const slow = race(before(i, TRUCK.trigger + 1, 60), { ...GO, throttle: 0 }, 0.1);
    expect(truckHint(slow)).toBe('go');
  });

  it('cannot drive through a mishap', () => {
    const i = indexOf('gate');
    const hit = race(before(i, 1, 60), GO, 0.2);
    expect(race(hit, GO, 0.4).bike.v).toBeLessThanOrEqual(hit.bike.v + 1e-9);
  });
});

describe('motorbike — the race', () => {
  it('starts on the line at rest', () => {
    const s = createRace();
    expect(s.bike.x).toBe(0);
    expect(s.bike.v).toBe(0);
    expect(s.results).toEqual(COURSE.map(() => 'pending'));
    expect(raceGap(s)).toBe(0);
    expect(s.margin).toBeNull();
  });

  it('measures the margin at lift-off and freezes it', () => {
    let s = createRace();
    s = { ...s, t: LIFTOFF_T - 0.05, results: s.results.map(() => 'clean'), bike: { ...s.bike, x: LIFTOFF_X + 40, v: 80, gear: 6 } };
    let lifted = 0;
    for (let k = 0; k < 30; k++) {
      s = stepRace(s, GO, DT);
      lifted += s.events.filter((e) => e.kind === 'liftoff').length;
    }
    expect(lifted).toBe(1);
    expect(s.margin ?? 0).toBeGreaterThan(40 + 80 * 0.05 - 1);
    expect(s.margin ?? 0).toBeLessThan(40 + 80 * 0.05 + 1);
    expect(finalScore(s)).toBe(Math.round(s.margin ?? 0));
    expect(race(s, GO, 1).margin).toBe(s.margin);
  });

  it('flags the moment the bike passes the lift-off marker', () => {
    let s = createRace();
    s = { ...s, t: 20, results: s.results.map(() => 'clean'), bike: { ...s.bike, x: LIFTOFF_X - 1, v: 80, gear: 6 } };
    s = stepRace(s, GO, DT);
    expect(s.events.some((e) => e.kind === 'marker')).toBe(true);
    expect(s.passedAt).toBeCloseTo(20 + DT, 6);
  });

  it('loses heavily standing still', () => {
    const s = race(createRace(), { ...GO, throttle: 0 }, LIFTOFF_T + 0.1);
    expect(finalScore(s)).toBe(-LIFTOFF_X);
    expect(medalFor(finalScore(s), MOTORBIKE_MEDALS, true)).toBeNull();
  });

  it('gives bronze for beating the jet, with silver and gold above', () => {
    expect(MOTORBIKE_MEDALS.bronze).toBeGreaterThanOrEqual(0);
    expect(MOTORBIKE_MEDALS.silver).toBeGreaterThan(MOTORBIKE_MEDALS.bronze);
    expect(MOTORBIKE_MEDALS.gold).toBeGreaterThan(MOTORBIKE_MEDALS.silver);
  });
});
