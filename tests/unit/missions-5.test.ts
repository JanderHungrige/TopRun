import { describe, it, expect } from 'vitest';
import { BOSSES } from '../../src/data/bosses';
import { ENEMIES } from '../../src/data/enemies';
import { ALL_MISSIONS, campaignMissions } from '../../src/data/missions';
import { MISSIONS_4 } from '../../src/data/missions-4';
import { MISSIONS_5 } from '../../src/data/missions-5';
import { miniBosses } from '../../src/data/reinforcements';
import { campaignTheaters, THEATERS, underwater } from '../../src/data/theaters';
import type { MissionResult } from '../../src/data/types';
import { adminView } from '../../src/game/admin';
import { debriefScript } from '../../src/game/dialogue-scripts';
import { kitOf } from '../../src/game/kit';
import { MAP_FIVE, MAP_FOUR } from '../../src/game/map-three';
import { payScale } from '../../src/game/map-two';
import { isUnlocked, mapOpen, nextMission } from '../../src/game/progress';
import { defaultSave, type SaveData } from '../../src/game/save';

// Map 5 (docs 65, 70): under the sea, steered with the subs; m121–m150 in five theaters.

const SEA_KINDS = ['minisub', 'seadrone', 'seamine', 'seaturret', 'jelly', 'eel'];
const DEEP_KINDS = ['hunter', 'torpboat', 'squid', 'crab', 'sealab', 'angler'];
const MAP5 = ['reef', 'kelp', 'wrecks', 'trench', 'abyss'];
const cleared = (save: SaveData, ids: readonly string[]): SaveData =>
  ({ ...save, progress: { ...save.progress, ...Object.fromEntries(ids.map((id) => [id, { stars: 1 }])) } });
const win = (id: string): MissionResult => ({
  missionId: id, success: true, aborted: false, takeoff: 'skipped', kills: 20, spawned: 24,
  objectiveDone: true, hullRatio: 0.6, collected: 0, bossKilled: true,
});

describe('Fifth map (doc 65)', () => {
  it('holds m121–m150 on map 5: a fresh climb, steered with the subs', () => {
    expect(MISSIONS_5.map((m) => m.id)).toEqual(Array.from({ length: 30 }, (_, i) => `m${i + 121}`));
    expect(MISSIONS_5.every((m, i) => m.number === i + 121 && m.campaign === 5)).toBe(true);
    expect(MISSIONS_5.map((m) => m.difficulty).slice(0, 6)).toEqual([2, 3, 5, 6, 7, 9]);
    expect(MISSIONS_5[29]?.difficulty).toBe(41);
    expect(MISSIONS_5[0]?.reward).toBe(1200);
    expect(campaignMissions(5)).toEqual(MISSIONS_5);
    expect(ALL_MISSIONS.slice(120)).toEqual(MISSIONS_5);
    expect(kitOf(5)).toBe('sub');
  });

  it('has five theaters of six missions, a boss every sixth, the sea serpent last (doc 70)', () => {
    expect(campaignTheaters(5)).toEqual(MAP5);
    MAP5.forEach((th, k) => {
      const six = MISSIONS_5.slice(k * 6, k * 6 + 6);
      expect(six.every((m) => m.theater === th)).toBe(true);
      expect(six.slice(0, 5).every((m) => m.objective.type !== 'boss')).toBe(true);
      expect(underwater(THEATERS[th as keyof typeof THEATERS].terrain)).toBe(true);
    });
    const bosses = MISSIONS_5.flatMap((m) => (m.objective.type === 'boss' ? [m.objective.boss] : []));
    expect(bosses).toEqual(['barracuda', 'medusa', 'bastion', 'goliath', 'jormungand']);
    expect(bosses.every((b) => BOSSES[b].layer === 'ground')).toBe(true); // torpedoes, gun, Shkval and sonar reach them
    for (const m of MISSIONS_5) for (const k of m.pool) expect([...SEA_KINDS, ...DEEP_KINDS]).toContain(k);
  });

  it('sends the missile sub mid-mission from the Kelp Forest on, never in boss missions (doc 70)', () => {
    const at = (n: number): ReturnType<typeof miniBosses> => {
      const m = MISSIONS_5[n - 121];
      if (!m) throw new Error(`missing m${n}`);
      return miniBosses(m);
    };
    expect(at(125)).toEqual([]);
    expect(at(127)).toEqual([{ at: 0.55, kind: 'boomer' }]);
    expect(at(132)).toEqual([]);
    expect(ENEMIES.boomer.layer).toBe('ground');
  });

  it('fights the Coral Reef with sea enemies only and the BARRACUDA at its end', () => {
    for (const m of MISSIONS_5.slice(0, 6)) for (const k of m.pool) expect(SEA_KINDS).toContain(k);
    const last = MISSIONS_5[5]?.objective;
    expect(last).toEqual({ type: 'boss', boss: 'barracuda' });
    expect(BOSSES.barracuda).toMatchObject({ coreHp: 1700, layer: 'ground', escort: { kind: 'minisub', every: 6 } });
    expect(underwater(THEATERS.reef.terrain)).toBe(true);
    expect(underwater(THEATERS.deep.terrain)).toBe(false);
    expect(SEA_KINDS.map((k) => ENEMIES[k as keyof typeof ENEMIES].layer)).toEqual(['air', 'air', 'air', 'ground', 'air', 'air']);
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

  it('pays on its own scale from m121: ×10, three per cent more each mission', () => {
    expect(payScale(120)).toBeCloseTo(MAP_FOUR.pay * (1 + MAP_FOUR.ramp * 29), 9);
    expect(payScale(121)).toBe(MAP_FIVE.pay);
    expect(payScale(126)).toBeCloseTo(MAP_FIVE.pay * (1 + MAP_FIVE.ramp * 5), 9);
  });

  it('points the admiral at the sea after m120, and gives no finale after m126', () => {
    const m120 = MISSIONS_4[29];
    const m126 = MISSIONS_5[5];
    if (!m120 || !m126) throw new Error('missing');
    const after120 = debriefScript({ mission: m120, result: win('m120'), stars: 2, totalText: '$9,600', campaignDone: true }).map((l) => l.key);
    expect(after120).toEqual(expect.arrayContaining(['adm.finale4', 'adm.deepWater']));
    const after126 = debriefScript({ mission: m126, result: win('m126'), stars: 2, totalText: '$9,600', campaignDone: true }).map((l) => l.key);
    expect(after126.some((k) => k.startsWith('adm.finale'))).toBe(false);
  });
});
