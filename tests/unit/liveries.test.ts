import { describe, it, expect } from 'vitest';
import { LIVERIES, LIVERY_IDS } from '../../src/data/liveries';
import { MISSIONS } from '../../src/data/missions';
import type { MissionResult, TheaterId } from '../../src/data/types';
import { debriefScript, type DebriefInput } from '../../src/game/dialogue-scripts';
import {
  applyLivery, canApplyLivery, isLiveryUnlocked, liveryOf, newlyUnlocked, unlockedLiveries,
} from '../../src/game/liveries';
import { derivePlayerStats } from '../../src/game/loadout';
import { defaultSave, parseSave, type SaveData } from '../../src/game/save';
import { LIVERIES_DE } from '../../src/i18n/liveries-de';

type Progress = SaveData['progress'];

const theater = (id: TheaterId) => MISSIONS.filter((m) => m.theater === id);

/** Progress with the given theater's missions cleared at `stars`; `skipBoss` leaves the boss out. */
function cleared(id: TheaterId, stars: number, skipBoss = false): Progress {
  const out: Progress = {};
  for (const m of theater(id)) {
    if (skipBoss && m.objective.type === 'boss') continue;
    out[m.id] = { stars };
  }
  return out;
}

const withProgress = (progress: Progress): SaveData => ({ ...defaultSave(), progress });

describe('Paint jobs', () => {
  describe('unlocks', () => {
    it('starts with the factory standard and the Pacific camo (the Pacific is open from mission 1)', () => {
      expect(unlockedLiveries({})).toEqual(['standard', 'gullgray']);
      expect(isLiveryUnlocked({}, 'standard')).toBe(true);
      expect(isLiveryUnlocked({}, 'desert')).toBe(false);
    });

    it('readies a region camo when its region opens, i.e. with the previous boss (Fair Challenge wave 1)', () => {
      expect(unlockedLiveries(cleared('pacific', 1, true))).toEqual(['standard', 'gullgray']);
      expect(unlockedLiveries(cleared('pacific', 1))).toEqual(['standard', 'gullgray', 'desert']);
      expect(unlockedLiveries({ ...cleared('pacific', 2), ...cleared('gulf', 1) })).toEqual(['standard', 'gullgray', 'desert', 'arctic']);
    });

    it('never takes a camo away: a beaten boss means its region was open', () => {
      for (const th of ['pacific', 'gulf', 'arctic', 'canyon', 'leviathan'] as const) {
        const camo = LIVERY_IDS.find((id) => LIVERIES[id].unlock?.theater === th && LIVERIES[id].unlock?.kind === 'region');
        const upTo = MISSIONS.slice(0, MISSIONS.findIndex((m) => m.theater === th && m.objective.type === 'boss') + 1);
        expect(camo && isLiveryUnlocked(Object.fromEntries(upTo.map((m) => [m.id, { stars: 1 }])), camo), th).toBe(true);
      }
    });

    it('unlocks the rare scheme only with 3 stars on every mission of the theater', () => {
      expect(unlockedLiveries(cleared('pacific', 3))).toEqual(['standard', 'gullgray', 'blackflag', 'desert']);
      const oneShort = cleared('pacific', 3);
      const first = theater('pacific')[0]!;
      oneShort[first.id] = { stars: 2 };
      expect(isLiveryUnlocked(oneShort, 'blackflag')).toBe(false);
      expect(isLiveryUnlocked(cleared('pacific', 3, true), 'blackflag')).toBe(false);
    });

    it('every theater has exactly one region camo and one stars scheme', () => {
      const theaters = new Set(MISSIONS.map((m) => m.theater));
      for (const th of theaters) {
        const kinds = LIVERY_IDS.map((id) => LIVERIES[id].unlock).filter((u) => u?.theater === th).map((u) => u?.kind).sort();
        expect(kinds).toEqual(['region', 'stars']);
      }
    });

    it('lists what a mission newly unlocked, in data order', () => {
      const before = cleared('pacific', 3, true);
      const after = cleared('pacific', 3);
      expect(newlyUnlocked(before, after)).toEqual(['blackflag', 'desert']);
      expect(newlyUnlocked(after, after)).toEqual([]);
    });
  });

  describe('applying', () => {
    it('applies an unlocked livery to one jet only and refuses a locked one', () => {
      const save = withProgress(cleared('pacific', 1));
      expect(canApplyLivery(save, 'desert')).toEqual({ ok: true });
      const next = applyLivery(save, 'f14', 'desert');
      expect(liveryOf(next, 'f14')).toBe('desert');
      expect(liveryOf(next, 'f16')).toBe('standard');
      expect(canApplyLivery(save, 'tiger')).toEqual({ ok: false, reason: 'locked' });
      expect(applyLivery(save, 'f14', 'tiger')).toBe(save);
    });

    it('hands the selected jet livery to the mission stats', () => {
      const save = { ...applyLivery(withProgress({}), 'f16', 'gullgray'), selectedPlane: 'f16' as const };
      expect(derivePlayerStats(save).livery).toBe('gullgray');
      expect(derivePlayerStats(defaultSave()).livery).toBe('standard');
    });
  });

  describe('save parsing', () => {
    const raw = (livery: unknown, progress: Progress = {}): unknown => JSON.parse(JSON.stringify({ ...defaultSave(), progress, livery }));

    it('defaults to standard for old saves and unknown ids', () => {
      expect(defaultSave().livery).toEqual({ f16: 'standard', f14: 'standard', sr71: 'standard', a10: 'standard', f35: 'standard', tornado: 'standard' });
      expect(parseSave(raw(undefined))?.livery).toEqual(defaultSave().livery);
      expect(parseSave(raw({ f16: 'chrome', f14: 7 }))?.livery).toEqual(defaultSave().livery);
    });

    it('keeps unlocked liveries and drops ones the progress has not earned', () => {
      const parsed = parseSave(raw({ f16: 'desert', f14: 'tiger', sr71: 'standard' }, cleared('pacific', 1)));
      expect(parsed?.livery).toEqual({ f16: 'desert', f14: 'standard', sr71: 'standard', a10: 'standard', f35: 'standard', tornado: 'standard' });
    });
  });

  describe('debrief and language', () => {
    const result: MissionResult = {
      missionId: MISSIONS[5]!.id, success: true, aborted: false, takeoff: 'good', kills: 12, spawned: 20,
      objectiveDone: true, hullRatio: 0.5, collected: 300, bossKilled: true,
    };
    const input = (liveries: DebriefInput['liveries']): DebriefInput => ({
      mission: MISSIONS[5]!, result, stars: 3, totalText: '$1,800', campaignDone: false, liveries,
    });

    it('lets the admiral announce new paint jobs after the pay line', () => {
      const lines = debriefScript(input([{ name: 'Seventies Navy', rare: false }, { name: 'Black Flag', rare: true }]));
      const keys = lines.map((l) => l.key);
      expect(keys.indexOf('adm.livery')).toBe(keys.indexOf('adm.pay') + 1);
      expect(keys.indexOf('adm.liveryRare')).toBe(keys.indexOf('adm.pay') + 2);
      expect(lines.find((l) => l.key === 'adm.livery')?.params).toEqual({ livery: 'Seventies Navy' });
      expect(debriefScript(input([])).map((l) => l.key)).not.toContain('adm.livery');
    });

    it('names every livery in German too', () => {
      for (const id of LIVERY_IDS) expect(LIVERIES_DE[id].length).toBeGreaterThan(2);
    });
  });
});
