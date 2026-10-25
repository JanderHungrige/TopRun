import { describe, it, expect } from 'vitest';
import { medalFor, type Medal } from '../../src/game/minigames/core';
import { AIR, createAir, roughTarget, stepSwing, wander } from '../../src/game/minigames/refuel-air';
import {
  createRefuel, fuelScore, judgeContact, offsetOf, podLight, REFUEL_MEDALS, REFUEL_RULES as R, refuelStatus, stepRefuel,
  type RefuelInput, type RefuelState,
} from '../../src/game/minigames/refuel';
import { placeholders } from '../../src/i18n/i18n';
import { clockText, REFUEL_TEXT } from '../../src/i18n/minigames/refuel';
import { ACE, AVERAGE, calmPilot, flyRound, GOOD, NOVICE, ROOKIE, type PilotSkill } from './refuel-pilot';

const DT = 1 / 60;
const idle: RefuelInput = { x: 0, y: 0, throttle: 0 };

function run(s: RefuelState, input: RefuelInput, seconds: number): RefuelState {
  let st = s;
  for (let i = 0; i < Math.round(seconds / DT); i++) st = stepRefuel(st, input, DT);
  return st;
}

/** Calm air, jet lined up with the basket `gap` m behind it, closing at `closure` m/s. */
function lined(gap: number, closure: number, dx = 0): RefuelState {
  const s = createRefuel(1, 0);
  return { ...s, gap, closure, jet: { ...s.jet, x: dx, y: 0, z: -gap, vx: 0, vy: 0, vz: closure } };
}

/** Holds the throttle that keeps the current closure (calm air). */
const neutral = (closure: number): number => (closure - R.closeIdle) / (R.closeFull - R.closeIdle);

/** Plugged in calm air with the hose pushed in `push` m and the jet at rest relative to the tanker. */
function plugged(push: number): RefuelState {
  let s = run(lined(0.5, 1, 0), { x: 0, y: 0, throttle: neutral(1) }, 0.6);
  expect(s.phase).toBe('contact');
  s = { ...s, jet: { ...s.jet, z: push, vz: 0 }, gap: -push, push, closure: 0 };
  return s;
}

function medals(skill: PilotSkill, seeds: number): Record<Medal | 'none', number> {
  const out = { gold: 0, silver: 0, bronze: 0, none: 0 };
  for (let seed = 1; seed <= seeds; seed++) out[medalFor(fuelScore(flyRound(skill, seed)), REFUEL_MEDALS, true) ?? 'none']++;
  return out;
}

describe('Air Refuelling', () => {
  describe('turbulence', () => {
    it('is deterministic per seed and differs between seeds', () => {
      expect(wander(createAir(7), 12.3)).toEqual(wander(createAir(7), 12.3));
      expect(wander(createAir(7), 12.3)).not.toEqual(wander(createAir(8), 12.3));
    });

    it('wanders smoothly within its amplitude', () => {
      const air = createAir(3);
      let prev = wander(air, 0);
      let maxX = 0;
      for (let t = DT; t < 60; t += DT) {
        const w = wander(air, t);
        expect(Math.abs(w.x - prev.x)).toBeLessThan(0.02);
        expect(Math.abs(w.y - prev.y)).toBeLessThan(0.02);
        maxX = Math.max(maxX, Math.abs(w.x));
        prev = w;
      }
      expect(maxX).toBeGreaterThan(0.2);
      expect(maxX).toBeLessThanOrEqual(0.54 + 1e-9);
    });

    it('gets rougher through the minute and with every contact after the first', () => {
      expect(roughTarget(0, 0)).toBe(AIR.roughStart);
      expect(roughTarget(0, 1)).toBe(AIR.roughStart);
      expect(roughTarget(30, 0)).toBeCloseTo(AIR.roughStart + AIR.roughTime / 2, 9);
      expect(roughTarget(60, 1)).toBeCloseTo(AIR.roughStart + AIR.roughTime, 9);
      expect(roughTarget(0, 3)).toBeCloseTo(AIR.roughStart + 2 * AIR.roughContact, 9);
      expect(roughTarget(0, 9)).toBeCloseTo(AIR.roughStart + 3 * AIR.roughContact, 9);
    });

    it('never lets the basket jump while the air gets rougher (except where it is released from the probe)', () => {
      let prev: RefuelState | null = null;
      let jump = 0;
      flyRound(ROOKIE, 4, 1, (s) => {
        if (prev && s.events === prev.events) jump = Math.max(jump, Math.abs(s.trail.x - prev.trail.x), Math.abs(s.trail.y - prev.trail.y));
        prev = s;
      });
      expect(jump).toBeLessThan(0.06);
    });

    it('lets a knocked basket swing back to the trail', () => {
      let sw = { x: 0, y: 0, vx: 1.5, vy: 1.5 };
      let peak = 0;
      for (let i = 0; i < 60 * 4; i++) {
        sw = stepSwing(sw, DT);
        peak = Math.max(peak, sw.x);
      }
      expect(peak).toBeGreaterThan(0.25);
      expect(Math.hypot(sw.x, sw.y)).toBeLessThan(0.02);
    });
  });

  describe('flying', () => {
    it('starts 9 m behind, offset right and below, ready for contact', () => {
      const s = createRefuel(5);
      expect(s).toMatchObject({ phase: 'approach', t: 0, fuel: 0, contacts: 0, disconnects: 0, closure: 0 });
      expect(s.gap).toBeCloseTo(R.startGap, 1);
      expect(offsetOf(createRefuel(5, 0))).toEqual({ x: -R.startX, y: -R.startY });
      expect(podLight(s)).toBe('amber');
    });

    it('steers with a short lag up to 1.6 m/s', () => {
      const s = run(createRefuel(1, 0), { x: 1, y: 0, throttle: neutral(0) }, 1);
      expect(s.jet.vx).toBeGreaterThan(1.45);
      expect(s.jet.x - R.startX).toBeGreaterThan(0.95);
      expect(s.jet.x - R.startX).toBeLessThan(1.1);
      const up = run(createRefuel(1, 0), { x: 0, y: 1, throttle: neutral(0) }, 3);
      expect(up.jet.vy).toBeCloseTo(R.steerSpeed, 2);
    });

    it('closes with power, drifts back at idle and holds at about a third throttle', () => {
      const s = createRefuel(1, 0);
      expect(run(s, { ...idle, throttle: 1 }, 2).gap).toBeLessThan(R.startGap - 2);
      expect(run(s, idle, 2).gap).toBeGreaterThan(R.startGap + 1);
      expect(run(s, { ...idle, throttle: neutral(0) }, 3).gap).toBeCloseTo(R.startGap, 2);
      expect(run(s, { ...idle, throttle: 1 }, 1).closure).toBeCloseTo(R.closeFull * (1 - Math.exp(-1)), 1);
    });

    it('never falls back further than 16 m', () => {
      expect(run(createRefuel(1, 0), idle, 20).gap).toBeCloseTo(R.maxGap, 5);
    });
  });

  describe('contact', () => {
    it('judges offset first, then the closure window', () => {
      expect(R.captureR).toBe(0.33);
      expect(judgeContact(0.34, 1)).toBe('miss');
      expect(judgeContact(0.5, 3)).toBe('miss');
      expect(judgeContact(0.33, 1)).toBe('contact');
      expect(judgeContact(0.1, 1.81)).toBe('tooFast');
      expect(judgeContact(0.1, 1.8)).toBe('contact');
      expect(judgeContact(0, 0.29)).toBe('tooSoft');
      expect(judgeContact(0, 0.3)).toBe('contact');
    });

    it('plugs in when the probe reaches the ring centred at a gentle closure', () => {
      const s = run(lined(0.5, 1), { ...idle, throttle: neutral(1) }, 0.6);
      expect(s).toMatchObject({ phase: 'contact', contacts: 1 });
      expect(s.event).toMatchObject({ kind: 'contact' });
      expect(s.events).toBe(1);
      expect(podLight(s)).toBe('amber');
      expect(refuelStatus(s)).toBe('pushIn');
    });

    it('misses off-centre, bounces too fast, does not latch too soft — and backs off', () => {
      const miss = run(lined(0.5, 1, 0.45), { ...idle, throttle: neutral(1) }, 0.6);
      expect(miss).toMatchObject({ phase: 'backoff', backoffTo: R.backoffGap, contacts: 0 });
      expect(miss.event?.kind).toBe('miss');
      expect(Math.hypot(miss.swing.vx, miss.swing.vy)).toBeGreaterThan(0);
      expect(podLight(miss)).toBe('red');
      const fast = run(lined(0.5, 2.4), { ...idle, throttle: 1 }, 0.4);
      expect(fast.event?.kind).toBe('tooFast');
      const soft = run(lined(0.05, 0.2), { ...idle, throttle: neutral(0.2) }, 0.6);
      expect(soft.event?.kind).toBe('tooSoft');
      expect(soft.backoffTo).toBe(R.softGap);
    });

    it('drops back to the backoff gap, then is cleared again', () => {
      let s = run(lined(0.5, 1, 0.45), { ...idle, throttle: 1 }, 0.6);
      expect(s.phase).toBe('backoff');
      s = run(s, { ...idle, throttle: neutral(0) }, 6);
      expect(s.phase).toBe('approach');
      expect(s.gap).toBeGreaterThanOrEqual(R.backoffGap - 0.3);
      expect(refuelStatus(s)).toBe('cleared');
    });
  });

  describe('plugged', () => {
    it('flows 150 lbs/s once pushed 1–3 m in, after the valve opens', () => {
      let s = run(plugged(2), { ...idle, throttle: neutral(0) }, R.flowRamp);
      expect(s.valve).toBeCloseTo(1, 5);
      expect(podLight(s)).toBe('green');
      expect(refuelStatus(s)).toBe('flowing');
      const before = s.fuel;
      s = run(s, { ...idle, throttle: neutral(0) }, 2);
      expect(s.fuel - before).toBeCloseTo(2 * R.flowRate, 0);
      expect(s.phase).toBe('contact');
    });

    it('closes the valve below 1 m and warns past 3 m', () => {
      const shallow = run(plugged(0.6), { ...idle, throttle: neutral(0) }, 2);
      expect(shallow).toMatchObject({ phase: 'contact', fuel: 0, valve: 0 });
      const deep = run(plugged(3.3), { ...idle, throttle: neutral(0) }, 0.5);
      expect(deep.phase).toBe('contact');
      expect(deep.valve).toBe(0);
      expect(refuelStatus(deep)).toBe('tooFar');
    });

    it('disconnects on hose slack, when dropping out, or when breaking out of the box', () => {
      const slack = run(plugged(3.5), { ...idle, throttle: neutral(0.5) }, 1);
      expect(slack).toMatchObject({ phase: 'backoff', disconnects: 1, valve: 0, backoffTo: R.backoffGap });
      expect(slack.event?.kind).toBe('slack');
      const out = run(plugged(0.1), { ...idle, throttle: neutral(-0.5) }, 1);
      expect(out.event?.kind).toBe('droppedOff');
      expect(out.backoffTo).toBe(R.softGap);
      const side = run(plugged(2), { x: 1, y: 0, throttle: neutral(0) }, 1.5);
      expect(side.event?.kind).toBe('brokeOff');
      expect(side.disconnects).toBe(1);
    });
  });

  describe('round', () => {
    it('ends after 60 s and then stands still', () => {
      const s = run(createRefuel(2), idle, R.roundTime + 0.1);
      expect(s.phase).toBe('over');
      expect(podLight(s)).toBe('off');
      expect(stepRefuel(s, { x: 1, y: 1, throttle: 1 }, DT)).toBe(s);
    });

    it('pays about 8,000 lbs for a perfect minute in calm air', () => {
      const best = fuelScore(calmPilot(1.2));
      expect(best).toBeGreaterThan(7600);
      expect(best).toBeLessThan(8300);
      expect(medalFor(best, REFUEL_MEDALS, true)).toBe('gold');
      expect(fuelScore(calmPilot(2.5))).toBeLessThan(best);
    });

    it('scores whole pounds', () => {
      expect(fuelScore({ ...createRefuel(1), fuel: 1234.6 })).toBe(1235);
    });
  });

  describe('medals (simulated keyboard pilots in the turbulence)', () => {
    it('gives quick, clean pilots gold and slower ones silver or bronze', () => {
      expect(medals(ACE, 12).gold).toBe(12);
      expect(medals(GOOD, 12).gold).toBeGreaterThanOrEqual(10);
      const avg = medals(AVERAGE, 12);
      expect(avg.gold).toBeGreaterThanOrEqual(8);
      expect(avg.gold).toBeLessThan(12);
      expect(avg.none + avg.bronze).toBe(0);
      const rookie = medals(ROOKIE, 12);
      expect(rookie.gold).toBeLessThanOrEqual(3);
      expect(rookie.silver + rookie.bronze).toBeGreaterThanOrEqual(9);
      const novice = medals(NOVICE, 12);
      expect(novice.gold + novice.silver).toBe(0);
    });
  });

  it('shows the time left as m:ss and 0:00 at the end', () => {
    expect(clockText(60)).toBe('1:00');
    expect(clockText(42.3)).toBe('0:43');
    expect(clockText(1e-8)).toBe('0:00');
    expect(clockText(-2)).toBe('0:00');
  });

  it('has the same keys and placeholders in English and German', () => {
    const keys = Object.keys(REFUEL_TEXT.en) as (keyof typeof REFUEL_TEXT.en)[];
    expect(Object.keys(REFUEL_TEXT.de).sort()).toEqual([...keys].sort());
    for (const k of keys) expect(placeholders(REFUEL_TEXT.de[k])).toEqual(placeholders(REFUEL_TEXT.en[k]));
  });
});
