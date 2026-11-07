import { describe, it, expect } from 'vitest';
import { BOSSES } from '../../src/data/bosses';
import { ALL_MISSIONS, campaignMissions } from '../../src/data/missions';
import { MISSIONS_3 } from '../../src/data/missions-3';
import { MISSIONS_4 } from '../../src/data/missions-4';
import { campaignTheaters } from '../../src/data/theaters';
import type { MissionResult } from '../../src/data/types';
import { adminView } from '../../src/game/admin';
import { debriefScript } from '../../src/game/dialogue-scripts';
import { kitOf } from '../../src/game/kit';
import { MAP_FOUR, MAP_THREE } from '../../src/game/map-three';
import { payScale } from '../../src/game/map-two';
import { isUnlocked, mapOpen, nextMission } from '../../src/game/progress';
import { defaultSave, type SaveData } from '../../src/game/save';

// Map 4 (docs 56, 58): space, flown with the spacecraft, m91–m120 in five theaters.

const MAP4 = ['orbit', 'belt', 'moon', 'rings', 'deep'];
const cleared = (save: SaveData, ids: readonly string[]): SaveData =>
  ({ ...save, progress: { ...save.progress, ...Object.fromEntries(ids.map((id) => [id, { stars: 1 }])) } });

describe('Fourth map (docs 56, 58)', () => {
  it('holds m91–m120 on map 4, one step below map 3, flown with the ship', () => {
    expect(MISSIONS_4.map((m) => m.id)).toEqual(Array.from({ length: 30 }, (_, i) => `m${i + 91}`));
    expect(MISSIONS_4.every((m, i) => m.number === i + 91 && m.campaign === 4)).toBe(true);
    expect(MISSIONS_4.map((m) => m.difficulty).slice(0, 6)).toEqual([2, 3, 5, 6, 7, 9]);
    expect(MISSIONS_4[29]?.difficulty).toBe(41);
    expect(MISSIONS_4[0]?.reward).toBe(1200);
    expect(MISSIONS_4[29]?.reward).toBe(Math.round((1200 + 29 * 380) * 1.5 / 100) * 100);
    expect(campaignMissions(4)).toEqual(MISSIONS_4);
    expect(ALL_MISSIONS.slice(90, 120)).toEqual(MISSIONS_4);
    expect(kitOf(4)).toBe('ship');
  });

  it('has five theaters of six missions, a boss every sixth, the ARK last (doc 58)', () => {
    expect(campaignTheaters(4)).toEqual(MAP4);
    MAP4.forEach((th, k) => {
      const six = MISSIONS_4.slice(k * 6, k * 6 + 6);
      expect(six.every((m) => m.theater === th)).toBe(true);
      expect(six.slice(0, 5).every((m) => m.objective.type !== 'boss')).toBe(true);
    });
    const bosses = MISSIONS_4.flatMap((m) => (m.objective.type === 'boss' ? [m.objective.boss] : []));
    expect(bosses).toEqual(['halo', 'quarry', 'crater', 'trident', 'ark']);
    expect(bosses.map((b) => BOSSES[b].coreHp)).toEqual([3200, 3800, 4400, 5000, 6200]);
    expect(bosses.every((b) => BOSSES[b].layer === 'ground')).toBe(true); // the torpedoes reach them (doc 57)
    for (const m of MISSIONS_4) for (const k of m.pool) expect(['raider', 'satgun', 'corvette', 'interceptor', 'gunship', 'battery', 'drone']).toContain(k);
  });

  it('opens after m90, then mission by mission; the admin has it at once', () => {
    const before = cleared(defaultSave(), MISSIONS_3.slice(0, 29).map((m) => m.id));
    const m91 = MISSIONS_4[0];
    if (!m91) throw new Error('missing');
    expect(mapOpen(before, 4)).toBe(false);
    expect(isUnlocked(before, m91)).toBe(false);
    const open = cleared(before, ['m90']);
    expect(mapOpen(open, 4)).toBe(true);
    expect(isUnlocked(open, m91)).toBe(true);
    expect(nextMission(open).id).toBe('m91');
    expect(mapOpen(adminView(defaultSave()), 4)).toBe(true);
  });

  it('pays on its own scale from m91: ×8, three per cent more each mission', () => {
    expect(payScale(90)).toBeCloseTo(MAP_THREE.pay * (1 + MAP_THREE.ramp * 29), 9);
    expect(payScale(91)).toBe(MAP_FOUR.pay);
    expect(payScale(96)).toBeCloseTo(MAP_FOUR.pay * (1 + MAP_FOUR.ramp * 5), 9);
  });

  it('gives no finale after m96, only after m120: a map ends at a multiple of 30', () => {
    const m96 = MISSIONS_4[5];
    if (!m96) throw new Error('missing');
    const result: MissionResult = {
      missionId: m96.id, success: true, aborted: false, takeoff: 'skipped', kills: 20, spawned: 24,
      objectiveDone: true, hullRatio: 0.6, collected: 0, bossKilled: true,
    };
    const keys = debriefScript({ mission: m96, result, stars: 2, totalText: '$9,600', campaignDone: true }).map((l) => l.key);
    expect(keys.some((k) => k.startsWith('adm.finale'))).toBe(false);
    expect(keys).not.toContain('adm.space');
    const m120 = MISSIONS_4[29];
    if (!m120) throw new Error('missing');
    const last = debriefScript({ mission: m120, result: { ...result, missionId: 'm120' }, stars: 2, totalText: '$9,600', campaignDone: true });
    expect(last.map((l) => l.key)).toContain('adm.finale4');
  });
});
