import { afterEach, describe, it, expect } from 'vitest';
import { lineDuration, MOUTH_HOLD, mouthFromText, mouthOpen, pickVariant, typewriter } from '../../src/game/dialogue';
import {
  CHIEF_EVENTS, debriefScript, SHOOTER_EVENTS, WINGMAN_EVENTS, wingmanStart, type DebriefInput,
} from '../../src/game/dialogue-scripts';
import { LINES_EN } from '../../src/i18n/lines-en';
import { setLang } from '../../src/i18n/i18n';
import { missionById, MISSIONS } from '../../src/data/missions';
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

  describe('mouth', () => {
    const at = (k: number, edge = 0.5): number => (k + edge) * MOUTH_HOLD; // a moment inside hold k
    const SHAPES = [0, 0.5, 1];

    it('follows the typed text: vowel-rich bits open, punctuation and the end close', () => {
      expect(mouthFromText('Hello, pilot.', at(0))).toBe(1); // "Hello"
      expect(mouthFromText('Hello, pilot.', at(1))).toBe(0); // ", pil" — the comma pauses
      expect(mouthFromText('Hello, pilot.', at(2))).toBe(0); // "ot." — the full stop
      expect(mouthFromText('Hello, pilot.', at(3))).toBe(0); // typed out: closed
      expect(mouthFromText('Brrr', at(0))).toBe(0); // no vowel: closed
      expect(mouthFromText('Grab it', at(0))).toBe(0.5); // one vowel: half
    });

    it('holds each shape for a whole hold and never shows the same open shape twice in a row', () => {
      const text = 'Banana banana banana, all the way home';
      for (let k = 0; k < 8; k++) {
        const v = mouthFromText(text, at(k, 0.02));
        expect(SHAPES).toContain(v);
        expect(mouthFromText(text, at(k, 0.98))).toBe(v);
        if (k > 0 && v > 0) expect(mouthFromText(text, at(k - 1))).not.toBe(v);
      }
    });

    it('without the text: closed when silent, otherwise a held, never-repeating flap', () => {
      for (let k = 0; k < 40; k++) {
        expect(mouthOpen(at(k), false)).toBe(0);
        const v = mouthOpen(at(k, 0.02), true);
        expect(SHAPES).toContain(v);
        expect(mouthOpen(at(k, 0.98), true)).toBe(v);
        if (k > 0) expect(mouthOpen(at(k - 1), true)).not.toBe(v);
      }
      expect(1 / MOUTH_HOLD).toBeLessThanOrEqual(7); // at most ~7 mouth changes a second
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

    it('ends the campaign with the finale after mission 30 and points to the globe (doc 35)', () => {
      const lines = debriefScript(input({ mission: m30, result: result({ bossKilled: true }), stars: 3, campaignDone: true }));
      expect(lines.map((l) => l.key)).toEqual(['adm.open3', 'adm.boss', 'adm.pay', 'adm.finale', 'adm.globe']);
      expect(lines[3]?.gesture).toBe('salute');
    });

    it('sends map-2 bosses on within map 2 and ends map 2 with its own finale (doc 35)', () => {
      const m36 = missionById('m36');
      const m60 = missionById('m60');
      if (!m36 || !m60) throw new Error('missing');
      setLang('en');
      expect(debriefScript(input({ mission: m36, result: result({ bossKilled: true }) }))[3]?.params).toEqual({ theater: 'Roof of the World' });
      const lines = debriefScript(input({ mission: m60, result: result({ bossKilled: true }), stars: 3, campaignDone: true }));
      expect(lines.map((l) => l.key)).toEqual(['adm.open3', 'adm.boss', 'adm.pay', 'adm.finale2']);
    });
  });

  describe('event lines', () => {
    it('chief, shooter and wingman lines map every event to a known line key', () => {
      const all = [...Object.values(CHIEF_EVENTS), ...Object.values(SHOOTER_EVENTS), ...Object.values(WINGMAN_EVENTS)];
      expect(all.length).toBe(14 + 11 + 14);
      for (const e of all) expect(LINES_EN[e.key], e.key).toBeDefined();
      expect(wingmanStart({ type: 'strike', target: 'sam', count: 4 })).toMatchObject({ key: 'wing.startStrike', params: { n: 4, targets: 'SAM Sites' } });
      expect(wingmanStart({ type: 'boss', boss: 'leviathan' })).toMatchObject({ key: 'wing.startBoss', params: { boss: 'LEVIATHAN' } });
    });
  });
});
