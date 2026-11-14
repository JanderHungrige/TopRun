import { describe, expect, it } from 'vitest';
import { ENEMIES } from '../../src/data/enemies';
import { MISSIONS_7 } from '../../src/data/missions-7';
import {
  callBonus, defenceWaves, isDefenceOver, killSupply, leakDamage, startSupply, unitCost, unitTime, waveBudget, waveSupply,
} from '../../src/game/defence';
import { buildPads, defenceLayout, distToLane, laneCount, OUTPOST_Y, pointOnLane } from '../../src/game/defence-layout';
import { emptyTally } from '../../src/game/objectives';

// A defence (doc 106): the field (lanes, pads), the waves, supply, the outpost's damage, when it is over.

const defences = MISSIONS_7.filter((m) => m.defend);
const m182 = MISSIONS_7[1]!;

describe('Defence field (doc 106)', () => {
  it('lays one lane on the first defence, two to the badlands\' end, three after', () => {
    expect(defences.map((m) => laneCount(m.number))).toEqual([1, 2, 2, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3]);
  });

  it('runs every lane from above the top edge down to its gate at the outpost, inside the field', () => {
    for (const m of defences) {
      const { lanes } = defenceLayout(m);
      for (const l of lanes) {
        expect(l.points[0]!.y).toBeLessThan(0);
        expect(l.points[l.points.length - 1]).toEqual({ x: l.gateX, y: OUTPOST_Y });
        for (const p of l.points) expect(p.x >= 70 && p.x <= 570).toBe(true);
        expect(l.length).toBeGreaterThan(OUTPOST_Y);
      }
    }
  });

  it('is the same field every time for a mission', () => {
    expect(defenceLayout(m182)).toEqual(defenceLayout(m182));
  });

  it('puts the pads beside the lanes: off every lane, apart, inside the field, 8 / 10 / 12 of them', () => {
    for (const m of defences) {
      const { lanes, pads } = defenceLayout(m);
      expect(pads.length).toBe(({ 1: 8, 2: 10, 3: 12 } as Record<number, number>)[lanes.length]);
      for (const p of pads) {
        expect(p.x >= 40 && p.x <= 600 && p.y >= 120 && p.y <= 580).toBe(true);
        for (const l of lanes) expect(distToLane(p, l)).toBeGreaterThanOrEqual(45);
        for (const q of pads) if (q !== p) expect(Math.hypot(p.x - q.x, p.y - q.y)).toBeGreaterThanOrEqual(90);
      }
    }
    expect(buildPads(defenceLayout(m182).lanes, 3, 1)).toHaveLength(3);
  });

  it('walks a lane: the start at 0, the gate at its length, heading down the screen', () => {
    const l = defenceLayout(m182).lanes[0]!;
    expect(pointOnLane(l, 0)).toMatchObject({ x: l.points[0]!.x, y: l.points[0]!.y });
    const end = pointOnLane(l, l.length + 50);
    expect(end).toMatchObject({ x: l.gateX, y: OUTPOST_Y });
    expect(Math.abs(pointOnLane(l, l.length / 2).heading)).toBeLessThan(Math.PI / 2);
  });
});

describe('Defence waves and supply (doc 106)', () => {
  it('sends `defend` waves, each bigger than the last, from the pool, never a unit that stands still', () => {
    for (const m of defences) {
      const waves = defenceWaves(m, laneCount(m.number));
      expect(waves).toHaveLength(m.defend!);
      const points = waves.map((w) => w.groups.filter((g) => g.kind !== 'wartripod').reduce((s, g) => s + g.count * unitCost(ENEMIES[g.kind]), 0));
      expect(points[points.length - 1]!).toBeGreaterThan(points[0]!);
      for (const w of waves) for (const g of w.groups) {
        if (g.kind !== 'wartripod') expect(m.pool).toContain(g.kind);
        expect(ENEMIES[g.kind].speed).toBeGreaterThan(0);
        expect(g.lane).toBeLessThan(laneCount(m.number));
      }
    }
    expect(defenceWaves(m182, 1)).toEqual(defenceWaves(m182, 1));
  });

  it('closes the last wave with the war tripod from the salt flats on', () => {
    for (const m of defences) {
      const last = defenceWaves(m, laneCount(m.number)).at(-1)!;
      expect(last.groups.some((g) => g.kind === 'wartripod')).toBe(m.number >= 188);
    }
  });

  it('spaces a group\'s units 0.5 s apart', () => {
    expect(unitTime({ kind: 'crawler', count: 3, lane: 0, at: 4 }, 2)).toBeCloseTo(5, 6);
  });

  it('prices units and leaks by toughness and pays supply for kills, held waves and an early call', () => {
    expect([unitCost(ENEMIES.crawler), unitCost(ENEMIES.trooper), unitCost(ENEMIES.rider), unitCost(ENEMIES.tripod)]).toEqual([2, 3, 7, 17]);
    expect(leakDamage(ENEMIES.crawler)).toBe(3);
    expect(leakDamage(ENEMIES.wartripod)).toBe(173);
    expect(waveBudget(1, 0)).toBe(60);
    expect(waveBudget(3, 10)).toBeCloseTo(60 * 1.8 * 1.2, 6);
    expect(startSupply(5)).toBe(220);
    expect([killSupply(ENEMIES.crawler), killSupply(ENEMIES.trooper), killSupply(ENEMIES.rider)]).toEqual([3, 5, 12]);
    expect(waveSupply(3)).toBe(70);
    expect(callBonus(7.6)).toBe(21);
    expect(callBonus(-1)).toBe(0);
  });

  it('is won when the waves are held (and the boss killed), lost when the outpost falls or the player dies', () => {
    const held = { ...emptyTally(), wavesHeld: 5 };
    expect(isDefenceOver({ ...emptyTally(), wavesHeld: 4 }, 5, false, false)).toBe(false);
    expect(isDefenceOver(held, 5, false, false)).toBe(true);
    expect(isDefenceOver(held, 5, true, false)).toBe(false);
    expect(isDefenceOver({ ...held, bossKilled: true }, 5, true, false)).toBe(true);
    expect(isDefenceOver({ ...emptyTally(), outpostLost: true }, 5, false, false)).toBe(true);
    expect(isDefenceOver(emptyTally(), 5, false, true)).toBe(true);
  });
});
