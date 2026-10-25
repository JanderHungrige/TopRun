import { describe, it, expect } from 'vitest';
import type { PlaneId } from '../../src/data/types';
import { medalFor } from '../../src/game/minigames/core';
import {
  BURNER_SPEED, createFlyby, EXIT_TIME, FLYBY_MEDALS, PASSES, ROOF_LIFT, SCRAPE_DEPTH, scorePass, SPEED,
  speedMult, START_ALT, START_X, stepFlyby, totalScore, TOWER_ROOF, type FlybyInput, type FlybyState,
} from '../../src/game/minigames/flyby';
import { CLIMB, feet, gust, jetSpan, lowestPoint, MAX_ALT, MAX_PITCH } from '../../src/game/minigames/flyby-jet';
import { placeholders } from '../../src/i18n/i18n';
import { FLYBY_TEXT } from '../../src/i18n/minigames/flyby';

const DT = 1 / 60;
const level: FlybyInput = { climb: 0, burner: false };
const burn: FlybyInput = { climb: 0, burner: true };
const dive: FlybyInput = { climb: -1, burner: false };
const pull: FlybyInput = { climb: 1, burner: false };

/** Calm air: the reference pilots and exact flight checks. */
const calm = (plane: PlaneId = 'f16'): FlybyState => createFlyby(plane, 0);

function run(s: FlybyState, input: FlybyInput, seconds: number): FlybyState {
  let st = s;
  for (let i = 0; i < Math.round(seconds / DT); i++) st = stepFlyby(st, input, DT);
  return st;
}

/** Steps until `stop` holds (or a safety limit of 30 s). */
function until(s: FlybyState, input: FlybyInput, stop: (s: FlybyState) => boolean): FlybyState {
  let st = s;
  for (let i = 0; i < 1800 && !stop(st); i++) st = stepFlyby(st, input, DT);
  return st;
}

/** Puts the jet level so that its lowest point is `clear` px above the roof. */
function at(s: FlybyState, clear: number): FlybyState {
  const lift = TOWER_ROOF + clear - lowestPoint(s.plane, s.jet.alt, 0);
  return { ...s, jet: { ...s.jet, alt: s.jet.alt + lift, pitch: 0 } };
}

/** Reference pilot: one level pass at `clear` px over the roof, burner on or off, until the next pass starts. */
function flyPass(s: FlybyState, clear: number, burner: boolean): FlybyState {
  const pass = s.pass;
  return until(at(s, clear), burner ? burn : level, (st) => st.done || st.pass !== pass);
}

function round(clears: readonly number[], burner: boolean, plane: PlaneId = 'f16'): FlybyState {
  return clears.reduce((s, c) => flyPass(s, c, burner), calm(plane));
}

/** Autopilot in bumpy air: arrow keys only (full up / down / nothing), aims `target` px over the roof. */
function autopilot(target: number, burner: boolean): FlybyState {
  let s = createFlyby('f16');
  for (let i = 0; i < 60 * 30 && !s.done; i++) {
    const j = s.jet;
    const ahead = lowestPoint(s.plane, j.alt, j.pitch) + j.speed * Math.sin(j.pitch) * CLIMB * 0.3;
    const e = TOWER_ROOF + target - ahead;
    s = stepFlyby(s, { climb: e > 4 ? 1 : e < -4 ? -1 : 0, burner }, DT);
  }
  return s;
}

describe('Tower Flyby', () => {
  describe('jet geometry', () => {
    it('finds the lowest hull point: the ventral fin when level, the nose when diving, the tail when climbing', () => {
      expect(lowestPoint('f16', 100, 0)).toBeCloseTo(100 + 7.4 * 1.1, 5);
      const down = -MAX_PITCH;
      expect(lowestPoint('f16', 100, down)).toBeLessThan(100 + 7.4 * 1.1);
      expect(lowestPoint('f16', 100, MAX_PITCH)).toBeCloseTo(100 + (-37.8 * Math.sin(MAX_PITCH) + 7.4 * Math.cos(MAX_PITCH)) * 1.1, 5);
      expect(lowestPoint('sr71', 0, 0)).toBeCloseTo(11.4 * 1.1, 5);
    });

    it('measures the horizontal span from the hull', () => {
      const s = jetSpan('f16', 0);
      expect(s.front).toBeCloseTo(52 * 1.1, 5);
      expect(s.back).toBeCloseTo(56 * 1.1, 5);
      expect(jetSpan('sr71', 0).front).toBeGreaterThan(s.front);
    });

    it('converts px to feet at 0.4 ft per px', () => {
      expect(feet(25)).toBe(10);
      expect(feet(150)).toBe(60);
      expect(feet(-12)).toBe(-5);
    });
  });

  describe('scoring', () => {
    it('scales the multiplier from 1.0 at normal speed to 1.5 with a spooled afterburner', () => {
      expect(speedMult(SPEED)).toBe(1);
      expect(speedMult(BURNER_SPEED)).toBe(1.5);
      expect(speedMult(1100)).toBeCloseTo(1.25, 5);
      expect(speedMult(600)).toBe(1);
      expect(speedMult(2000)).toBe(1.5);
    });

    it('pays more the closer the pass and adds the coffee bonus under 25 px', () => {
      expect(scorePass(50, SPEED)).toEqual({ outcome: 'scored', clearance: 50, mult: 1, spill: false, points: 400 });
      expect(scorePass(10, BURNER_SPEED)).toEqual({ outcome: 'scored', clearance: 10, mult: 1.5, spill: true, points: 1040 });
      expect(scorePass(25, SPEED).spill).toBe(false);
      expect(scorePass(24.9, SPEED).spill).toBe(true);
      expect(scorePass(30, SPEED).points).toBeLessThan(scorePass(20, SPEED).points);
    });

    it('scores nothing at 150 px (60 ft) or higher', () => {
      expect(scorePass(150, BURNER_SPEED)).toMatchObject({ outcome: 'tooHigh', points: 0, spill: false });
      expect(scorePass(400, SPEED)).toMatchObject({ outcome: 'tooHigh', points: 0 });
    });
  });

  describe('flight', () => {
    it('starts every round level at the start line, in bumpy air', () => {
      const s = createFlyby('f14');
      expect(s).toMatchObject({ pass: 0, done: false, result: null, results: [], turbulence: 1 });
      expect(s.jet).toEqual({ x: START_X, alt: START_ALT, pitch: 0, speed: SPEED, burner: false });
    });

    it('climbs and dives with inertia', () => {
      const s = calm();
      const up = run(s, pull, 0.5);
      const down = run(s, dive, 0.5);
      expect(up.jet.alt).toBeGreaterThan(START_ALT + 20);
      expect(down.jet.alt).toBeLessThan(START_ALT - 20);
      const tick = stepFlyby(s, dive, DT);
      expect(tick.jet.pitch).toBeLessThan(0);
      expect(tick.jet.pitch).toBeGreaterThan(-MAX_PITCH / 2);
      expect(run(s, level, 1).jet.alt).toBeCloseTo(START_ALT, 5);
    });

    it('spools to afterburner speed and reacts more sharply with it lit', () => {
      const s = calm();
      expect(run(s, burn, 2).jet.speed).toBeGreaterThan(1250);
      const gentle = run(s, dive, 0.1).jet.pitch;
      const sharp = run(s, { climb: -1, burner: true }, 0.1).jet.pitch;
      expect(sharp).toBeLessThan(gentle);
    });

    it('never climbs above the ceiling', () => {
      expect(run(calm(), pull, 1.4).jet.alt).toBeLessThanOrEqual(MAX_ALT);
    });

    it('bumps a level jet around in the same pattern every round, different per pass', () => {
      const a = run(createFlyby('f16'), level, 1);
      expect(Math.abs(a.jet.alt - START_ALT)).toBeGreaterThan(5);
      expect(run(createFlyby('f16'), level, 1).jet.alt).toBe(a.jet.alt);
      expect(gust(1, 0.5)).not.toBeCloseTo(gust(0, 0.5), 3);
      for (let t = 0; t < 4; t += 0.1) expect(Math.abs(gust(0, t))).toBeLessThanOrEqual(40);
    });
  });

  describe('passes', () => {
    it('scores a level pass by its minimum clearance and the speed over the tower', () => {
      const s = until(at(calm(), 20), level, (st) => st.result !== null);
      expect(s.result).toMatchObject({ outcome: 'scored', spill: true, mult: 1 });
      expect(s.result?.clearance).toBeCloseTo(20, 5);
      expect(s.result?.points).toBe(scorePass(20, SPEED).points);
    });

    it('counts a ground contact as a failed pass and lifts the jet clear', () => {
      const s = until(at(calm(), -150), dive, (st) => st.result !== null);
      expect(s.result).toEqual({ outcome: 'ground', clearance: null, mult: 1, spill: false, points: 0 });
      expect(s.jet.x).toBeLessThan(-500);
      expect(lowestPoint(s.plane, s.jet.alt, s.jet.pitch)).toBeGreaterThan(0);
      expect(s.jet.pitch).toBeGreaterThanOrEqual(0);
      const later = run(s, dive, 0.5);
      expect(later.jet.alt).toBeGreaterThan(s.jet.alt);
    });

    it('bounces a shallow tower hit over the roof (scrape)', () => {
      const s = until(at(calm(), -10), level, (st) => st.result !== null);
      expect(s.result).toMatchObject({ outcome: 'tower', points: 0, spill: false });
      expect(s.result?.clearance).toBeCloseTo(-10, 5);
      expect(lowestPoint(s.plane, s.jet.alt, s.jet.pitch)).toBeCloseTo(TOWER_ROOF + ROOF_LIFT, 5);
    });

    it('lets a deep tower hit streak past without the bounce (near miss)', () => {
      const s0 = at(calm(), -SCRAPE_DEPTH - 30);
      const s = until(s0, level, (st) => st.result !== null);
      expect(s.result).toMatchObject({ outcome: 'tower', points: 0 });
      expect(lowestPoint(s.plane, s.jet.alt, s.jet.pitch)).toBeLessThan(TOWER_ROOF);
    });

    it('takes the controls away after a pass and pulls up', () => {
      const s = until(at(calm(), 30), level, (st) => st.result !== null);
      const later = run(s, dive, 0.6);
      expect(later.jet.alt).toBeGreaterThan(s.jet.alt);
      expect(later.result).toEqual(s.result);
    });

    it('starts the next pass after the exit time and ends the round after three', () => {
      const scored = until(at(calm(), 40), level, (st) => st.result !== null);
      const before = run(scored, level, EXIT_TIME - 0.1);
      expect(before.pass).toBe(0);
      const next = run(before, level, 0.2);
      expect(next).toMatchObject({ pass: 1, result: null, done: false });
      expect(next.results).toHaveLength(1);
      expect(next.jet.x).toBeLessThan(START_X + 400);
      const end = round([40, 40, 40], false);
      expect(end.done).toBe(true);
      expect(end.results).toHaveLength(PASSES);
      expect(totalScore(end)).toBe(end.results.reduce((a, r) => a + r.points, 0));
      expect(stepFlyby(end, dive, DT)).toBe(end);
    });

    it('includes the decided current pass in the running total', () => {
      const s = until(at(calm(), 40), level, (st) => st.result !== null);
      expect(totalScore(s)).toBe(s.result?.points);
    });
  });

  describe('medals (reference pilots)', () => {
    const medal = (s: FlybyState) => medalFor(totalScore(s), FLYBY_MEDALS, true);

    it('gives bronze for three steady 20 ft passes without afterburner', () => {
      expect(medal(round([50, 50, 50], false))).toBe('bronze');
      expect(medal(round([60, 60, 60], false))).toBeNull();
    });

    it('gives silver for 14 ft passes with the afterburner lit', () => {
      expect(medal(round([35, 35, 35], true))).toBe('silver');
      expect(medal(round([20, 20, 20], false))).toBe('silver');
    });

    it('needs three coffee spills with the afterburner for gold', () => {
      expect(medal(round([15, 15, 15], true))).toBe('gold');
      expect(medal(round([22, 22, 22], true))).toBe('gold');
      expect(medal(round([15, 15, 40], true))).toBe('silver');
      expect(medal(round([15, 15, 15], false))).toBe('silver');
      expect(medal(round([15, 15, 15], true, 'sr71'))).toBe('gold');
    });

    it('still takes daring afterburner passes in bumpy air', () => {
      expect(medal(autopilot(14, true))).toBe('gold');
      expect(medal(autopilot(35, true))).toBe('silver');
      expect(medal(autopilot(50, false))).toBe('bronze');
      expect(autopilot(14, false).results.every((r) => r.outcome === 'scored')).toBe(true);
    });
  });

  it('has the same keys and placeholders in English and German', () => {
    const keys = Object.keys(FLYBY_TEXT.en) as (keyof typeof FLYBY_TEXT.en)[];
    expect(Object.keys(FLYBY_TEXT.de).sort()).toEqual([...keys].sort());
    for (const k of keys) expect(placeholders(FLYBY_TEXT.de[k])).toEqual(placeholders(FLYBY_TEXT.en[k]));
  });
});
