import { describe, expect, it } from 'vitest';
import { BUILDINGS, ROUND_COST } from '../../src/data/outpost';
import { MISSIONS_6 } from '../../src/data/missions-6';
import { MISSIONS } from '../../src/data/missions';
import type { MissionResult } from '../../src/data/types';
import {
  alloyPerDay, build, buildRounds, canBuild, canBuildRounds, freshOutpost, magazineCap, parseOutpost, powerDemand, powerShare,
  powerSupply, researchPerDay, spend, wallet, type Outpost,
} from '../../src/game/outpost';
import { runDay, spendRounds } from '../../src/game/outpost-day';
import { defaultSave, parseSave } from '../../src/game/save';

// The ground base (doc 82): buildings bought with money, the power grid, rounds built with alloy, a day per sortie.

const won = (over: Partial<MissionResult> = {}): MissionResult => ({
  missionId: 'm151', success: true, aborted: false, takeoff: 'good', kills: 20, spawned: 30, objectiveDone: true,
  hullRatio: 0.8, collected: 0, bossKilled: false, ...over,
});

const at = (b: Partial<Outpost['buildings']>, over: Partial<Outpost> = {}): Outpost =>
  ({ ...freshOutpost(), ...over, buildings: { ...freshOutpost().buildings, ...b } });

describe('ground base (doc 82)', () => {
  it('starts with the mech bay standing, a little alloy and a first load of rockets', () => {
    const o = freshOutpost();
    expect(o.buildings).toEqual({ generator: 0, refinery: 0, factory: 0, lab: 0, mechbay: 1 });
    expect(o.alloy).toBe(150);
    expect(o.magazine).toEqual({ rockets: 24, missiles: 0, shells: 0 });
  });

  it('buys buildings with money, level by level, up to 3', () => {
    let s = { ...defaultSave(), money: 1_000_000 };
    s = build(s, 'generator');
    expect(s.outpost.buildings.generator).toBe(1);
    expect(s.money).toBe(1_000_000 - BUILDINGS.generator.prices[0]);
    s = build(build(s, 'generator'), 'generator');
    expect(canBuild(s, 'generator')).toEqual({ ok: false, reason: 'max-level' });
    expect(canBuild({ ...s, money: 0 }, 'refinery')).toEqual({ ok: false, reason: 'insufficient-funds' });
    expect(() => build({ ...s, money: 0 }, 'refinery')).toThrow();
  });

  it('runs the refinery and the lab at the power the generator gives', () => {
    const short = at({ refinery: 1, lab: 1, factory: 1 });
    expect(powerSupply(short)).toBe(0);
    expect(powerDemand(short)).toBe(3 + 3 + 2 + 2);
    expect(powerShare(short)).toBe(0);
    expect(alloyPerDay(short)).toBe(0);
    const half = at({ generator: 1, refinery: 2, lab: 1, factory: 1 });
    expect(powerShare(half)).toBeCloseTo(8 / 12, 6);
    expect(alloyPerDay(half)).toBe(Math.round(120 * (8 / 12)));
    const full = at({ generator: 3, refinery: 3, lab: 3, factory: 3, mechbay: 3 });
    expect(powerShare(full)).toBe(1);
    expect([alloyPerDay(full), researchPerDay(full)]).toEqual([200, 80]);
  });

  it('builds rounds in orders of ten, no more than the magazine holds or the alloy pays for', () => {
    expect(canBuildRounds(freshOutpost(), 'rockets')).toEqual({ ok: false, reason: 'no-factory' });
    const o = at({ factory: 1 }, { alloy: 100, magazine: { rockets: 44, missiles: 0, shells: 0 } });
    expect(magazineCap(o)).toBe(48);
    const r = buildRounds(o, 'rockets');
    expect(r.magazine.rockets).toBe(48);
    expect(r.alloy).toBe(100 - 4 * ROUND_COST.rockets);
    expect(canBuildRounds(r, 'rockets')).toEqual({ ok: false, reason: 'full' });
    const poor = buildRounds({ ...o, alloy: 13 }, 'missiles');
    expect(poor.magazine.missiles).toBe(2);
    expect(poor.alloy).toBe(1);
    expect(canBuildRounds(poor, 'missiles')).toEqual({ ok: false, reason: 'insufficient-alloy' });
  });

  it('pays with alloy in the mech kit and money everywhere else', () => {
    const s = { ...defaultSave(), money: 500 };
    expect(wallet(s)).toBe(500);
    expect(wallet({ ...s, kit: 'mech' })).toBe(150);
    expect(spend({ ...s, kit: 'mech' }, 50).outpost.alloy).toBe(100);
    expect(spend({ ...s, kit: 'mech' }, 50).money).toBe(500);
    expect(spend(s, 50).money).toBe(450);
  });

  it('runs a day after every map-6 sortie: refinery, lab and salvage; half when lost, nothing when aborted', () => {
    const o = at({ generator: 3, refinery: 1, lab: 1 });
    const m = MISSIONS_6[0];
    if (!m) throw new Error('no m151');
    const day = runDay(o, m, won());
    expect(day?.report).toMatchObject({ refined: 60, salvage: 60, research: 25, power: 1, invented: null });
    expect(day?.outpost.alloy).toBe(150 + 60 + 60);
    expect(day?.outpost.research).toBe(25);
    expect(day?.outpost.days).toBe(1);
    expect(runDay(o, m, won({ success: false }))?.report).toMatchObject({ refined: 30, salvage: 30, research: 13 });
    expect(runDay(o, m, won({ aborted: true, success: false }))?.report).toMatchObject({ refined: 0, salvage: 0, research: 0 });
    expect(runDay(o, m, won({ bossKilled: true }))?.report.salvage).toBe(140);
    expect(runDay(o, MISSIONS[0] ?? m, won())).toBeNull();
  });

  it('takes the rounds fired out of the magazine, never below empty', () => {
    const o = at({}, { magazine: { rockets: 20, missiles: 3, shells: 0 } });
    const { outpost, spent } = spendRounds(o, won({ spent: { pod: 12, seeker: 5, plasma: 4 } }));
    expect(outpost.magazine).toEqual({ rockets: 8, missiles: 0, shells: 0 });
    expect(spent).toEqual({ rockets: 12, missiles: 3, shells: 0 });
  });

  it('parses a broken base from storage into a fresh one and clamps the numbers', () => {
    expect(parseOutpost(null)).toEqual(freshOutpost());
    const o = parseOutpost({ buildings: { generator: 9, lab: -2, mechbay: 'x' }, alloy: 1e12, project: 'nonsense', done: ['seeker', 'bogus'] });
    expect(o.buildings).toMatchObject({ generator: 3, lab: 0, mechbay: 1 });
    expect(o.alloy).toBe(1e9);
    expect(o.project).toBeNull();
    expect(o.done).toEqual(['seeker']);
    const s = parseSave({ ...defaultSave(), outpost: { ...freshOutpost(), alloy: 77 } });
    expect(s?.outpost.alloy).toBe(77);
  });
});
