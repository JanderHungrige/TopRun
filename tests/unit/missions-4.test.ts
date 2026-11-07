import { describe, it, expect } from 'vitest';
import { BOSSES } from '../../src/data/bosses';
import { ENEMIES } from '../../src/data/enemies';
import { ALL_MISSIONS, campaignMissions } from '../../src/data/missions';
import { MISSIONS_3 } from '../../src/data/missions-3';
import { MISSIONS_4 } from '../../src/data/missions-4';
import { miniBosses } from '../../src/data/reinforcements';
import { campaignTheaters, THEATERS, underwater } from '../../src/data/theaters';
import type { MissionResult } from '../../src/data/types';
import { adminView } from '../../src/game/admin';
import { debriefScript } from '../../src/game/dialogue-scripts';
import { kitOf } from '../../src/game/kit';
import { MAP_FOUR, MAP_THREE } from '../../src/game/map-three';
import { payScale } from '../../src/game/map-two';
import { isUnlocked, mapOpen, nextMission } from '../../src/game/progress';
import { defaultSave, type SaveData } from '../../src/game/save';

// Map 4 (docs 65, 70, 74): under the sea, steered with the subs; m91–m120 in five theaters.

const SEA_KINDS = ['minisub', 'seadrone', 'seamine', 'seaturret', 'jelly', 'eel'];
const DEEP_KINDS = ['hunter', 'torpboat', 'squid', 'crab', 'sealab', 'angler'];
const MAP4 = ['reef', 'kelp', 'wrecks', 'trench', 'abyss'];
const cleared = (save: SaveData, ids: readonly string[]): SaveData =>
  ({ ...save, progress: { ...save.progress, ...Object.fromEntries(ids.map((id) => [id, { stars: 1 }])) } });
const win = (id: string): MissionResult => ({
  missionId: id, success: true, aborted: false, takeoff: 'skipped', kills: 20, spawned: 24,
  objectiveDone: true, hullRatio: 0.6, collected: 0, bossKilled: true,
});

describe('Fourth map: under the sea (docs 65, 74)', () => {
  it('holds m91–m120 on map 4: a fresh climb, steered with the subs', () => {
    expect(MISSIONS_4.map((m) => m.id)).toEqual(Array.from({ length: 30 }, (_, i) => `m${i + 91}`));
    expect(MISSIONS_4.every((m, i) => m.number === i + 91 && m.campaign === 4)).toBe(true);
    expect(MISSIONS_4.map((m) => m.difficulty).slice(0, 6)).toEqual([2, 3, 5, 6, 7, 9]);
    expect(MISSIONS_4[29]?.difficulty).toBe(41);
    expect(MISSIONS_4[0]?.reward).toBe(1200);
    expect(campaignMissions(4)).toEqual(MISSIONS_4);
    expect(ALL_MISSIONS.slice(90, 120)).toEqual(MISSIONS_4);
    expect(kitOf(4)).toBe('sub');
  });

  it('has five theaters of six missions, a boss every sixth, the sea serpent last (doc 70)', () => {
    expect(campaignTheaters(4)).toEqual(MAP4);
    MAP4.forEach((th, k) => {
      const six = MISSIONS_4.slice(k * 6, k * 6 + 6);
      expect(six.every((m) => m.theater === th)).toBe(true);
      expect(six.slice(0, 5).every((m) => m.objective.type !== 'boss')).toBe(true);
      expect(underwater(THEATERS[th as keyof typeof THEATERS].terrain)).toBe(true);
    });
    const bosses = MISSIONS_4.flatMap((m) => (m.objective.type === 'boss' ? [m.objective.boss] : []));
    expect(bosses).toEqual(['barracuda', 'medusa', 'bastion', 'goliath', 'jormungand']);
    expect(bosses.every((b) => BOSSES[b].layer === 'ground')).toBe(true); // torpedoes, gun, Shkval and sonar reach them
    for (const m of MISSIONS_4) for (const k of m.pool) expect([...SEA_KINDS, ...DEEP_KINDS]).toContain(k);
  });

  it('sends the missile sub mid-mission from the Kelp Forest on, never in boss missions (doc 70)', () => {
    const at = (n: number): ReturnType<typeof miniBosses> => {
      const m = MISSIONS_4[n - 91];
      if (!m) throw new Error(`missing m${n}`);
      return miniBosses(m);
    };
    expect(at(95)).toEqual([]);
    expect(at(97)).toEqual([{ at: 0.55, kind: 'boomer' }]);
    expect(at(102)).toEqual([]);
    expect(ENEMIES.boomer.layer).toBe('ground');
  });

  it('fights the Coral Reef with sea enemies only and the BARRACUDA at its end', () => {
    for (const m of MISSIONS_4.slice(0, 6)) for (const k of m.pool) expect(SEA_KINDS).toContain(k);
    const last = MISSIONS_4[5]?.objective;
    expect(last).toEqual({ type: 'boss', boss: 'barracuda' });
    expect(BOSSES.barracuda).toMatchObject({ coreHp: 1700, layer: 'ground', escort: { kind: 'minisub', every: 6 } });
    expect(underwater(THEATERS.reef.terrain)).toBe(true);
    expect(underwater(THEATERS.deep.terrain)).toBe(false);
    expect(SEA_KINDS.map((k) => ENEMIES[k as keyof typeof ENEMIES].layer)).toEqual(['air', 'air', 'air', 'ground', 'air', 'air']);
  });

  it('opens after m90, then mission by mission; the admin has it at once', () => {
    const before = cleared(defaultSave(), [...ALL_MISSIONS.slice(0, 60), ...MISSIONS_3.slice(0, 29)].map((m) => m.id));
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

  it('pays on its own scale from m91: ×10, three per cent more each mission (its pay from map 5, doc 74)', () => {
    expect(MAP_FOUR.pay).toBe(10);
    expect(payScale(90)).toBeCloseTo(MAP_THREE.pay * (1 + MAP_THREE.ramp * 29), 9);
    expect(payScale(91)).toBe(MAP_FOUR.pay);
    expect(payScale(96)).toBeCloseTo(MAP_FOUR.pay * (1 + MAP_FOUR.ramp * 5), 9);
  });

  it('points the admiral at the sea after m90, and gives no finale after m96', () => {
    const m90 = MISSIONS_3[29];
    const m96 = MISSIONS_4[5];
    if (!m90 || !m96) throw new Error('missing');
    const after90 = debriefScript({ mission: m90, result: win('m90'), stars: 2, totalText: '$9,600', campaignDone: true }).map((l) => l.key);
    expect(after90).toEqual(expect.arrayContaining(['adm.finale3', 'adm.deepWater']));
    expect(after90).not.toContain('adm.space');
    const after96 = debriefScript({ mission: m96, result: win('m96'), stars: 2, totalText: '$9,600', campaignDone: true }).map((l) => l.key);
    expect(after96.some((k) => k.startsWith('adm.finale'))).toBe(false);
  });
});
