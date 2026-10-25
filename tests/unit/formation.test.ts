import { describe, it, expect } from 'vitest';
import { medalFor, type Medal } from '../../src/game/minigames/core';
import {
  ACCEL, createFormation, DRAG, finalScore, FORWARD_BOOST, FORMATION_MEDALS, INNER_R, JOIN_FROM, MAX_POINTS, maxPointsUntil, OUTER_R,
  pointRate, predict, rating, slotOffset, slotPoint, stepFormation, zoneFor, type FormationState,
} from '../../src/game/minigames/formation';
import {
  CALLS, callsBetween, leadPose, LEAD_HOME, ROUND_END, SEGMENTS, segmentAt, SHOW_END, SHOW_START, smokeOn, SMOKE_OFF, SMOKE_ON, turnRate,
} from '../../src/game/minigames/formation-script';
import { placeholders } from '../../src/i18n/i18n';
import { FORMATION_TEXT } from '../../src/i18n/minigames/formation';
import { calm, DT, fly, gluedUntil, keyPilot, naivePilot, place, solo, steps, STILL, wing, type Pilot } from './formation-pilots';

const medal = (s: FormationState): Medal | null => medalFor(finalScore(s), FORMATION_MEDALS, true);

describe('Formation Flying', () => {
  describe('routine', () => {
    it('is deterministic and starts with the lead at home, level and steady', () => {
      expect(leadPose(12.34)).toEqual(leadPose(12.34));
      const p = leadPose(0);
      expect(p.x).toBeCloseTo(LEAD_HOME.x, 6);
      expect(p.y).toBeCloseTo(LEAD_HOME.y, 6);
      expect(p.alt).toBe(0);
      expect(p.turn).toBe(0);
      expect(p.smoke).toBe(false);
    });

    it('covers the round with back-to-back segments in order', () => {
      expect(SEGMENTS[0]?.from).toBe(0);
      expect(SEGMENTS[SEGMENTS.length - 1]?.to).toBe(ROUND_END);
      for (let i = 1; i < SEGMENTS.length; i++) expect(SEGMENTS[i]?.from).toBe(SEGMENTS[i - 1]?.to);
      expect(SEGMENTS.map((g) => g.id)).toEqual(['join', 'weaves', 'closure', 'turn', 'pitch', 'smoke', 'break']);
      expect(segmentAt(2)).toBe('join');
      expect(segmentAt(30)).toBe('turn');
      expect(segmentAt(50)).toBe('smoke');
      expect(SHOW_START).toBe(4);
      expect(SHOW_END).toBe(58);
    });

    it('weaves left and right in the weave segment', () => {
      const xs = Array.from({ length: 121 }, (_, i) => leadPose(4 + i * 0.1).x);
      expect(Math.min(...xs)).toBeLessThan(LEAD_HOME.x - 60);
      expect(Math.max(...xs)).toBeGreaterThan(LEAD_HOME.x + 60);
    });

    it('slides back on power back and surges forward on power up', () => {
      expect(leadPose(20).y).toBeGreaterThan(LEAD_HOME.y + 80);
      expect(leadPose(22.5).y).toBeLessThan(LEAD_HOME.y - 50);
    });

    it('flies a 180° left turn in the turn segment and banks into it', () => {
      let heading = 0;
      for (let t = 25; t < 34; t += 0.001) heading += turnRate(t + 0.0005) * 0.001;
      expect(heading).toBeCloseTo(-Math.PI, 1);
      expect(leadPose(29).bank).toBeLessThan(-0.6);
      expect(turnRate(20)).toBe(0);
    });

    it('pulls up in the pitch-up and is back down for the smoke pass', () => {
      expect(leadPose(30).alt).toBe(0);
      expect(leadPose(38.5).alt).toBeCloseTo(1, 6);
      expect(leadPose(44).alt).toBe(0);
      expect(leadPose(38.5).ground).toBeLessThan(1);
    });

    it('has the smoke on from 44 to 58 s only', () => {
      expect([SMOKE_ON, SMOKE_OFF]).toEqual([44, 58]);
      expect(smokeOn(43.99)).toBe(false);
      expect(smokeOn(44)).toBe(true);
      expect(smokeOn(57.99)).toBe(true);
      expect(smokeOn(58)).toBe(false);
    });

    it('schedules the radio calls in order inside the round', () => {
      for (let i = 1; i < CALLS.length; i++) expect(CALLS[i]?.t).toBeGreaterThan(CALLS[i - 1]?.t ?? 0);
      for (const c of CALLS) expect(c.t).toBeGreaterThan(0);
      for (const c of CALLS) expect(c.t).toBeLessThan(ROUND_END);
      expect(callsBetween(35.5, 36)).toEqual(['pitchNow']);
      expect(callsBetween(36, 36.5)).toEqual([]);
      expect(CALLS[CALLS.length - 1]?.id).toBe('end');
    });
  });

  describe('slots', () => {
    it('puts the right slot behind and right of the lead, the left slot mirrored', () => {
      const r = slotOffset('right', 'f16');
      const l = slotOffset('left', 'f16');
      expect(r).toEqual({ x: 94, y: 72 });
      expect(l).toEqual({ x: -94, y: 72 });
      const lead = leadPose(0);
      expect(slotPoint(lead, 'right', 'f16').x).toBeCloseTo(lead.x + 94, 1);
      expect(slotPoint(lead, 'right', 'f16').y).toBeCloseTo(lead.y + 72, 1);
    });

    it('rotates the slot with the lead and spreads it in the pitch-up', () => {
      const lead = { ...leadPose(0), yaw: -0.5 };
      const p = slotPoint(lead, 'right', 'f16');
      const r = Math.hypot(p.x - lead.x, p.y - lead.y);
      expect(r).toBeCloseTo(Math.hypot(94, 72), 6);
      expect(p.y - lead.y).toBeLessThan(72);
      const high = { ...leadPose(0), alt: 1 };
      expect(slotPoint(high, 'right', 'f16').x - high.x).toBeCloseTo(94 * 1.22, 1);
    });

    it('keeps bigger jets further out', () => {
      expect(slotOffset('right', 'f14').x).toBeGreaterThan(slotOffset('right', 'f16').x);
      expect(slotOffset('right', 'sr71').y).toBeGreaterThan(slotOffset('right', 'f16').y);
    });
  });

  describe('your jet', () => {
    it('starts behind and right of the slot for the join-up', () => {
      const w = wing(solo());
      const at = slotPoint(leadPose(0), 'right', 'f16');
      expect(w.x).toBeCloseTo(at.x + JOIN_FROM.x, 6);
      expect(w.y).toBeCloseTo(at.y + JOIN_FROM.y, 6);
      expect(w.points).toBe(0);
    });

    it('accelerates with the stick towards 250 px/s and coasts to a stop', () => {
      const s0 = place(calm(), { x: 100, y: 400 });
      const fast = steps(s0, { x: 1, y: 0 }, 3);
      expect(wing(fast).vx).toBeCloseTo((ACCEL / DRAG) * (1 - Math.exp(-DRAG * 3)), 1);
      expect(ACCEL / DRAG).toBe(250);
      const coast = steps(place(s0, { x: 300, y: 400 }, { x: 100, y: 0 }), STILL, 6);
      expect(wing(coast).vx).toBeLessThan(0.01);
      expect(wing(coast).x - 300).toBeCloseTo(100 / DRAG, -0.5);
    });

    it('clamps the stick to length 1', () => {
      const s0 = place(solo(), { x: 640, y: 400 });
      const diag = wing(stepFormation(s0, [{ x: 1, y: 1 }], DT));
      const straight = wing(stepFormation(s0, [{ x: 1, y: 0 }], DT));
      expect(Math.hypot(diag.vx, diag.vy)).toBeCloseTo(straight.vx, 6);
    });

    it('falls behind on the outside of the left turn unless it adds power', () => {
      const s0 = gluedUntil(calm(), 28);
      const drift = steps(s0, STILL, 1);
      const lead = leadPose(drift.t);
      const slot = slotPoint(lead, 'right', 'f16');
      expect(wing(drift).y).toBeGreaterThan(slot.y + 20);
      expect(wing(drift).x).toBeLessThan(slot.x);
      const power = keyPilot(0.4, 3);
      let st = s0;
      for (let i = 0; i < 60; i++) st = stepFormation(st, [power(st)], DT);
      expect(wing(st).zone).not.toBe('out');
    });

    it('stays inside the screen', () => {
      const s = steps(place(solo(), { x: 1200, y: 650 }), { x: 1, y: 1 }, 2);
      expect(wing(s).x).toBeLessThanOrEqual(1240);
      expect(wing(s).y).toBeLessThanOrEqual(690);
      expect(wing(s).vx).toBe(0);
    });

    it('predicts where it coasts to in 0.5 s', () => {
      const s0 = place(calm(), { x: 640, y: 400 }, { x: 120, y: -60 });
      const p = predict(s0, 0, 0.5);
      const after = steps(s0, STILL, 0.5);
      expect(p.x).toBeCloseTo(wing(after).x, 0);
      expect(p.y).toBeCloseTo(wing(after).y, 0);
    });
  });

  describe('scoring', () => {
    it('sorts distances into tight, loose and out', () => {
      expect([INNER_R, OUTER_R]).toEqual([18, 40]);
      expect(zoneFor(0)).toBe('inner');
      expect(zoneFor(18)).toBe('inner');
      expect(zoneFor(18.01)).toBe('outer');
      expect(zoneFor(40)).toBe('outer');
      expect(zoneFor(40.01)).toBe('out');
    });

    it('pays 100 / 50 / 0 points per second, double with the smoke, nothing outside the show', () => {
      expect(pointRate('inner', 10)).toBe(100);
      expect(pointRate('outer', 10)).toBe(50);
      expect(pointRate('out', 10)).toBe(0);
      expect(pointRate('inner', 50)).toBe(200);
      expect(pointRate('outer', 50)).toBe(100);
      expect(pointRate('inner', 3)).toBe(0);
      expect(pointRate('inner', 59)).toBe(0);
    });

    it('gives a pilot glued to the slot the maximum of 6800', () => {
      expect(MAX_POINTS).toBe(6800);
      expect(maxPointsUntil(ROUND_END)).toBeCloseTo(6800, 6);
      expect(maxPointsUntil(SHOW_START)).toBe(0);
      expect(maxPointsUntil(10)).toBeCloseTo(600, 6);
      const s = gluedUntil(solo(), ROUND_END);
      expect(s.done).toBe(true);
      expect(Math.abs(finalScore(s) - 6800)).toBeLessThanOrEqual(2);
      expect(rating(s, 0)).toBeGreaterThan(0.999);
    });

    it('counts seconds out of the slot in a row and resets when back in', () => {
      const s0 = gluedUntil(solo(), 10);
      const away = slotPoint(leadPose(10), 'right', 'f16');
      const out = steps(place(s0, { x: away.x + 200, y: away.y }), STILL, 1);
      expect(wing(out).zone).toBe('out');
      expect(wing(out).outT).toBeCloseTo(1, 1);
      const back = gluedUntil(out, 11.5);
      expect(wing(back).outT).toBe(0);
      expect(wing(back).zone).toBe('inner');
    });

    it('rates the show so far as points over the best possible', () => {
      expect(rating(solo(), 0)).toBe(1);
      const half = gluedUntil(solo(), 10);
      const w = wing(half);
      expect(rating({ ...half, wings: [{ ...w, points: w.points / 2 }] }, 0)).toBeCloseTo(0.5, 2);
    });

    it('ends the round at 61 s and then stands still', () => {
      const s = steps(solo(), STILL, ROUND_END + 0.5);
      expect(s.done).toBe(true);
      expect(stepFormation(s, [STILL], DT)).toBe(s);
    });

    it('scores two wings independently: a co-op left wing is just data', () => {
      let s = createFormation([{ slot: 'right', plane: 'f16' }, { slot: 'left', plane: 'f14' }], 0);
      expect(wing(s, 1).x).toBeLessThan(leadPose(0).x);
      for (let i = 0; i < 60 * 10; i++) {
        const at = slotPoint(leadPose(s.t + DT), 'left', 'f14');
        s = stepFormation(s, [STILL, STILL], DT);
        s = { ...s, wings: [wing(s, 0), { ...wing(s, 1), x: at.x, y: at.y, vx: 0, vy: 0 }] };
      }
      expect(wing(s, 1).points).toBeGreaterThan(590);
      expect(wing(s, 0).points).toBeLessThan(wing(s, 1).points);
    });
  });

  describe('medals (simulated human pilots, jet wash on)', () => {
    const seeds = [1, 2, 3, 4];
    const medals = (p: (seed: number) => Pilot): (Medal | null)[] => seeds.map((sd) => medal(fly(solo(), p(sd))));

    it('gives nothing to a pilot who lets go of the stick', () => {
      expect(medal(fly(solo(), () => STILL))).toBeNull();
    });

    it('gives nothing to a chaser with a human reaction time but no anticipation', () => {
      expect(medals((sd) => keyPilot(0, 3, 0.2, 6, sd))).toEqual([null, null, null, null]);
      expect(medal(fly(solo(), naivePilot(0.2)))).toBeNull();
    });

    it('gives gold to a quick, anticipating pilot (0.12 s, ±3 px), even changing keys only 12 times a second', () => {
      expect(medals((sd) => keyPilot(0.3, 3, 0.12, 3, sd))).toEqual(['gold', 'gold', 'gold', 'gold']);
      expect(medals((sd) => keyPilot(0.5, 3, 0.12, 3, sd))).toEqual(['gold', 'gold', 'gold', 'gold']);
      expect(medals((sd) => keyPilot(0.5, 3, 0.12, 3, sd, 12))).toEqual(['gold', 'gold', 'gold', 'gold']);
    });

    it('gives silver to an average pilot (0.20 s, ±6 px) in any jet', () => {
      expect(medals((sd) => keyPilot(0.5, 3, 0.2, 6, sd))).toEqual(['silver', 'silver', 'silver', 'silver']);
      expect(medals((sd) => keyPilot(0.5, 3, 0.2, 6, sd, 12))).toEqual(['silver', 'silver', 'silver', 'silver']);
      expect(medal(fly(solo('f14'), keyPilot(0.5, 3, 0.2, 6)))).toBe('silver');
      expect(medal(fly(solo('sr71'), keyPilot(0.5, 3, 0.2, 6)))).toBe('silver');
    });

    it('gives bronze to a slow pilot who uses the prediction pip (0.28 s, ±8 px)', () => {
      expect(medals((sd) => keyPilot(0.5, 3, 0.28, 8, sd))).toEqual(['bronze', 'bronze', 'bronze', 'bronze']);
      expect(medals((sd) => keyPilot(0.5, 3, 0.28, 8, sd, 12))).toEqual(['bronze', 'bronze', 'bronze', 'bronze']);
    });
  });

  it('has the same keys and placeholders in English and German', () => {
    const keys = Object.keys(FORMATION_TEXT.en) as (keyof typeof FORMATION_TEXT.en)[];
    expect(Object.keys(FORMATION_TEXT.de).sort()).toEqual([...keys].sort());
    for (const k of keys) expect(placeholders(FORMATION_TEXT.de[k])).toEqual(placeholders(FORMATION_TEXT.en[k]));
  });

  describe('forward thrust (owner: "up does not speed you up")', () => {
    it('pushing forward accelerates harder than sideways or back', () => {
      expect(FORWARD_BOOST).toBeCloseTo(1.3, 6);
      const go = (stick: { x: number; y: number }) => {
        let s = createFormation([{ slot: 'right', plane: 'f16' }], 0);
        for (let i = 0; i < 30; i++) s = stepFormation(s, [stick], 1 / 60);
        const w = s.wings[0]!;
        return { vx: w.vx, vy: w.vy };
      };
      const fwd = go({ x: 0, y: -1 });
      const side = go({ x: 1, y: 0 });
      const back = go({ x: 0, y: 1 });
      expect(-fwd.vy).toBeGreaterThan(side.vx * 1.25);
      expect(back.vy).toBeCloseTo(side.vx, 6);
    });
  });
});
