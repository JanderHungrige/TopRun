import { describe, it, expect } from 'vitest';
import { BOSSES } from '../../src/data/bosses';
import { ENEMIES } from '../../src/data/enemies';
import { ALL_MISSIONS, campaignMissions } from '../../src/data/missions';
import { MISSIONS_4 } from '../../src/data/missions-4';
import { MISSIONS_5 } from '../../src/data/missions-5';
import { campaignTheaters, THEATERS, underwater } from '../../src/data/theaters';
import type { MissionResult } from '../../src/data/types';
import { adminView } from '../../src/game/admin';
import { debriefScript } from '../../src/game/dialogue-scripts';
import { kitOf } from '../../src/game/kit';
import { MAP_FIVE, MAP_FOUR } from '../../src/game/map-three';
import { payScale } from '../../src/game/map-two';
import { isUnlocked, mapOpen, nextMission } from '../../src/game/progress';
import { defaultSave, type SaveData } from '../../src/game/save';

// Map 5 (doc 65): under the sea, steered with the subs; the Coral Reef (m121–m126) first.

const SEA_KINDS = ['minisub', 'seadrone', 'seamine', 'seaturret', 'jelly', 'eel'];
const cleared = (save: SaveData, ids: readonly string[]): SaveData =>
  ({ ...save, progress: { ...save.progress, ...Object.fromEntries(ids.map((id) => [id, { stars: 1 }])) } });
const win = (id: string): MissionResult => ({
  missionId: id, success: true, aborted: false, takeoff: 'skipped', kills: 20, spawned: 24,
  objectiveDone: true, hullRatio: 0.6, collected: 0, bossKilled: true,
});

describe('Fifth map (doc 65)', () => {
  it('holds the Coral Reef, m121–m126, on map 5: a fresh climb, steered with the subs', () => {
    expect(MISSIONS_5.map((m) => m.id)).toEqual(['m121', 'm122', 'm123', 'm124', 'm125', 'm126']);
    expect(MISSIONS_5.every((m, i) => m.number === i + 121 && m.campaign === 5 && m.theater === 'reef')).toBe(true);
    expect(MISSIONS_5.map((m) => m.difficulty)).toEqual([2, 3, 5, 6, 7, 9]);
    expect(MISSIONS_5[0]?.reward).toBe(1200);
    expect(campaignMissions(5)).toEqual(MISSIONS_5);
    expect(ALL_MISSIONS.slice(120)).toEqual(MISSIONS_5);
    expect(campaignTheaters(5)).toEqual(['reef']);
    expect(kitOf(5)).toBe('sub');
  });

  it('fights under the sea: sea enemies only, the BARRACUDA last, a reef that is underwater', () => {
    for (const m of MISSIONS_5) for (const k of m.pool) expect(SEA_KINDS).toContain(k);
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
