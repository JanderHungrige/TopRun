import { afterEach, describe, it, expect } from 'vitest';
import { lineDuration, mouthOpen, pickVariant, typewriter } from '../../src/game/dialogue';
import {
  CHIEF_EVENTS, debriefScript, SHOOTER_EVENTS, WINGMAN_EVENTS, wingmanStart, type DebriefInput,
} from '../../src/game/dialogue-scripts';
import { LINES_EN } from '../../src/i18n/lines-en';
import { setLang } from '../../src/i18n/i18n';
import { MISSIONS } from '../../src/data/missions';
import type { MissionResult } from '../../src/data/types';

afterEach(() => setLang('en'));

const m1 = MISSIONS[0]!;
const m6 = MISSIONS[5]!;
const m30 = MISSIONS[29]!;

const result = (over: Partial<MissionResult> = {}): MissionResult => ({
  missionId: m1.id, success: true, aborted: false, takeoff: 'good', kills: 12, spawned: 20,
  objectiveDone: true, hullRatio: 0.5, collected: 300, bossKilled: false, ...over,
});

const input = (over: Partial<DebriefInput> = {}): DebriefInput => ({
  mission: m1, result: result(), stars: 2, totalText: '$1,800', campaignDone: false, ...over,
});

const keys = (d: DebriefInput): string[] => debriefScript(d).map((l) => l.key);

describe('Dialogue', () => {
  describe('typewriter', () => {
    it('reveals characters over time and never exceeds the text', () => {
      expect(typewriter('Hello pilot', 0)).toBe('');
      expect(typewriter('Hello pilot', 5 / 34)).toBe('Hello');
      expect(typewriter('Hello pilot', 99)).toBe('Hello pilot');
      expect(typewriter('Hi', -1)).toBe('');
    });
  });

  describe('lineDuration', () => {
    it('is at least 1.8 s and grows with length', () => {
      expect(lineDuration('Go!')).toBe(1.8);
      const long = 'x'.repeat(170);
      expect(lineDuration(long)).toBeCloseTo(170 / 34 + 1.4, 5);
      expect(lineDuration(long)).toBeGreaterThan(lineDuration('x'.repeat(60)));
    });
  });

  describe('mouthOpen', () => {
    it('is 0 when silent and stays within 0..1 while talking', () => {
      let max = 0;
      for (let i = 0; i < 400; i++) {
        const t = i / 97;
        expect(mouthOpen(t, false)).toBe(0);
        const v = mouthOpen(t, true);
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(1);
        max = Math.max(max, v);
      }
      expect(max).toBeGreaterThan(0.5);
    });
  });

  describe('pickVariant', () => {
    it('is deterministic per seed and avoids immediate repeats with a running counter', () => {
      expect(pickVariant(3, 7)).toBe(pickVariant(3, 7));
      expect(pickVariant(3, 7)).not.toBe(pickVariant(3, 8));
      expect(pickVariant(1, 99)).toBe(0);
      expect(pickVariant(0, 5)).toBe(0);
      expect(pickVariant(2, -3)).toBe(1);
    });
  });

  describe('debriefScript', () => {
    it('opens by outcome: 3 stars, 1 star, shot down, objective failed, aborted', () => {
      expect(keys(input({ stars: 3 }))[0]).toBe('adm.open3');
      expect(keys(input({ stars: 1 }))[0]).toBe('adm.open1');
      expect(keys(input({ result: result({ success: false, hullRatio: 0 }) }))[0]).toBe('adm.shotDown');
      expect(keys(input({ result: result({ success: false, objectiveDone: false, hullRatio: 0.6 }) }))[0]).toBe('adm.objFailed');
      expect(keys(input({ result: result({ success: false, aborted: true }) }))[0]).toBe('adm.aborted');
      expect(debriefScript(input({ stars: 3 }))[0]).toMatchObject({ speaker: 'admiral', mood: 'happy', gesture: 'thumbsUp' });
    });

    it('adds a detail line (boss, perfect launch, hull, kills) and the pay line', () => {
      const boss = debriefScript(input({ mission: m6, result: result({ bossKilled: true }) }));
      expect(boss.map((l) => l.key)).toEqual(['adm.open2', 'adm.boss', 'adm.pay', 'adm.nextTheater']);
      expect(boss[1]?.params).toEqual({ boss: 'IRONCLAD' });
      expect(boss[3]?.params).toEqual({ theater: 'Persian Gulf' });
      expect(keys(input({ result: result({ takeoff: 'perfect' }) }))).toEqual(['adm.open2', 'adm.perfectLaunch', 'adm.pay']);
      expect(keys(input({ result: result({ hullRatio: 1 }) }))[1]).toBe('adm.cleanHull');
      const kills = debriefScript(input());
      expect(kills[1]).toMatchObject({ key: 'adm.kills', params: { kills: 12 } });
      expect(kills[2]).toMatchObject({ key: 'adm.pay', params: { total: '$1,800' } });
      expect(keys(input({ result: result({ success: false, hullRatio: 0 }) }))).toEqual(['adm.shotDown', 'adm.salvage']);
      setLang('de');
      expect(debriefScript(input({ mission: m6, result: result({ bossKilled: true }) }))[3]?.params).toEqual({ theater: 'Persischer Golf' });
    });

    it('ends the campaign with the finale after mission 30', () => {
      const lines = debriefScript(input({ mission: m30, result: result({ bossKilled: true }), stars: 3, campaignDone: true }));
      expect(lines.map((l) => l.key)).toEqual(['adm.open3', 'adm.boss', 'adm.pay', 'adm.finale']);
      expect(lines[3]?.gesture).toBe('salute');
    });
  });

  describe('event lines', () => {
    it('chief, shooter and wingman lines map every event to a known line key', () => {
      const all = [...Object.values(CHIEF_EVENTS), ...Object.values(SHOOTER_EVENTS), ...Object.values(WINGMAN_EVENTS)];
      expect(all.length).toBe(14 + 11 + 10);
      for (const e of all) expect(LINES_EN[e.key], e.key).toBeDefined();
      expect(wingmanStart({ type: 'strike', target: 'sam', count: 4 })).toMatchObject({ key: 'wing.startStrike', params: { n: 4, targets: 'SAM Sites' } });
      expect(wingmanStart({ type: 'boss', boss: 'leviathan' })).toMatchObject({ key: 'wing.startBoss', params: { boss: 'LEVIATHAN' } });
    });
  });
});
