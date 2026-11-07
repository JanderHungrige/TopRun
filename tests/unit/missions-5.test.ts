import { describe, it, expect } from 'vitest';
import { BOSSES } from '../../src/data/bosses';
import { ALL_MISSIONS, campaignMissions } from '../../src/data/missions';
import { MISSIONS_4 } from '../../src/data/missions-4';
import { MISSIONS_5 } from '../../src/data/missions-5';
import { miniBosses } from '../../src/data/reinforcements';
import { campaignTheaters } from '../../src/data/theaters';
import type { MissionResult } from '../../src/data/types';
import { adminView } from '../../src/game/admin';
import { debriefScript } from '../../src/game/dialogue-scripts';
import { kitOf } from '../../src/game/kit';
import { MAP_FIVE, MAP_FOUR } from '../../src/game/map-three';
import { payScale } from '../../src/game/map-two';
import { isUnlocked, mapOpen, nextMission } from '../../src/game/progress';
import { defaultSave, type SaveData } from '../../src/game/save';

// Map 5 (docs 56, 58, 74): space, flown with the spacecraft, m121–m150 in five theaters — the last world.

const MAP5 = ['orbit', 'belt', 'moon', 'rings', 'deep'];
const cleared = (save: SaveData, ids: readonly string[]): SaveData =>
  ({ ...save, progress: { ...save.progress, ...Object.fromEntries(ids.map((id) => [id, { stars: 1 }])) } });
const win = (id: string): MissionResult => ({
  missionId: id, success: true, aborted: false, takeoff: 'skipped', kills: 20, spawned: 24,
  objectiveDone: true, hullRatio: 0.6, collected: 0, bossKilled: true,
});

describe('Fifth map: space (docs 56, 58, 74)', () => {
  it('holds m121–m150 on map 5, a fresh climb, flown with the ship', () => {
    expect(MISSIONS_5.map((m) => m.id)).toEqual(Array.from({ length: 30 }, (_, i) => `m${i + 121}`));
    expect(MISSIONS_5.every((m, i) => m.number === i + 121 && m.campaign === 5)).toBe(true);
    expect(MISSIONS_5.map((m) => m.difficulty).slice(0, 6)).toEqual([2, 3, 5, 6, 7, 9]);
    expect(MISSIONS_5[29]?.difficulty).toBe(41);
    expect(MISSIONS_5[0]?.reward).toBe(1200);
    expect(MISSIONS_5[29]?.reward).toBe(Math.round((1200 + 29 * 380) * 1.5 / 100) * 100);
    expect(campaignMissions(5)).toEqual(MISSIONS_5);
    expect(ALL_MISSIONS.slice(120)).toEqual(MISSIONS_5);
    expect(kitOf(5)).toBe('ship');
  });

  it('has five theaters of six missions, a boss every sixth, the ARK last (doc 58)', () => {
    expect(campaignTheaters(5)).toEqual(MAP5);
    MAP5.forEach((th, k) => {
      const six = MISSIONS_5.slice(k * 6, k * 6 + 6);
      expect(six.every((m) => m.theater === th)).toBe(true);
      expect(six.slice(0, 5).every((m) => m.objective.type !== 'boss')).toBe(true);
    });
    const bosses = MISSIONS_5.flatMap((m) => (m.objective.type === 'boss' ? [m.objective.boss] : []));
    expect(bosses).toEqual(['halo', 'quarry', 'crater', 'trident', 'ark']);
    expect(bosses.map((b) => BOSSES[b].coreHp)).toEqual([3200, 3800, 4400, 5000, 6200]);
    expect(bosses.every((b) => BOSSES[b].layer === 'ground')).toBe(true); // the torpedoes reach them (doc 57)
    for (const m of MISSIONS_5) for (const k of m.pool) expect(['raider', 'satgun', 'corvette', 'interceptor', 'gunship', 'battery', 'drone']).toContain(k);
  });

  it('sends the battlecruiser mid-mission from the Asteroid Belt on, never in boss missions (doc 58)', () => {
    const at = (n: number): ReturnType<typeof miniBosses> => {
      const m = MISSIONS_5[n - 121];
      if (!m) throw new Error(`missing m${n}`);
      return miniBosses(m);
    };
    expect(at(125)).toEqual([]);
    expect(at(127)).toEqual([{ at: 0.55, kind: 'warden' }]);
    expect(at(132)).toEqual([]);
  });

  it('opens after m120, then mission by mission; the admin has it at once', () => {
    const before = cleared(defaultSave(), [...ALL_MISSIONS.slice(0, 90), ...MISSIONS_4.slice(0, 29)].map((m) => m.id));
    const m121 = MISSIONS_5[0];
    if (!m121) throw new Error('missing');
    expect(mapOpen(before, 5)).toBe(false);
    expect(isUnlocked(before, m121)).toBe(false);
    const open = cleared(before, ['m120']);
    expect(mapOpen(open, 5)).toBe(true);
    expect(isUnlocked(open, m121)).toBe(true);
    expect(nextMission(open).id).toBe('m121');
    expect(mapOpen(adminView(defaultSave()), 5)).toBe(true);
  });

  it('stays open once any of its missions is cleared, even before the sea is won (doc 74)', () => {
    const flown = cleared(defaultSave(), [...ALL_MISSIONS.slice(0, 90), ...MISSIONS_5.slice(0, 7)].map((m) => m.id));
    expect(mapOpen(flown, 5)).toBe(true);
    expect(nextMission(flown).id).toBe('m128');
    expect(mapOpen(flown, 4)).toBe(true);
  });

  it('pays on its own scale from m121: ×8, three per cent more each mission (its pay from map 4, doc 74)', () => {
    expect(MAP_FIVE.pay).toBe(8);
    expect(payScale(120)).toBeCloseTo(MAP_FOUR.pay * (1 + MAP_FOUR.ramp * 29), 9);
    expect(payScale(121)).toBe(MAP_FIVE.pay);
    expect(payScale(126)).toBeCloseTo(MAP_FIVE.pay * (1 + MAP_FIVE.ramp * 5), 9);
  });

  it('points the admiral at the stars after m120, gives no finale after m126, and the last word after m150', () => {
    const m120 = MISSIONS_4[29];
    const m126 = MISSIONS_5[5];
    const m150 = MISSIONS_5[29];
    if (!m120 || !m126 || !m150) throw new Error('missing');
    const after120 = debriefScript({ mission: m120, result: win('m120'), stars: 2, totalText: '$9,600', campaignDone: true }).map((l) => l.key);
    expect(after120).toEqual(expect.arrayContaining(['adm.finale4', 'adm.space']));
    const after126 = debriefScript({ mission: m126, result: win('m126'), stars: 2, totalText: '$9,600', campaignDone: true }).map((l) => l.key);
    expect(after126.some((k) => k.startsWith('adm.finale'))).toBe(false);
    const after150 = debriefScript({ mission: m150, result: win('m150'), stars: 2, totalText: '$9,600', campaignDone: true }).map((l) => l.key);
    expect(after150).toContain('adm.finale5');
    expect(after150).not.toContain('adm.space');
  });
});
