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

// Map 4 (doc 56): space, flown with the spacecraft; wave 5 opens it with Low Orbit, m91–m96.

const cleared = (save: SaveData, ids: readonly string[]): SaveData =>
  ({ ...save, progress: { ...save.progress, ...Object.fromEntries(ids.map((id) => [id, { stars: 1 }])) } });

describe('Fourth map (doc 56)', () => {
  it('holds m91–m96 in Low Orbit, one step below map 3, HALO at the end, flown with the ship', () => {
    expect(MISSIONS_4.map((m) => m.id)).toEqual(['m91', 'm92', 'm93', 'm94', 'm95', 'm96']);
    expect(MISSIONS_4.every((m, i) => m.number === i + 91 && m.campaign === 4 && m.theater === 'orbit')).toBe(true);
    expect(MISSIONS_4.map((m) => m.difficulty)).toEqual([2, 3, 5, 6, 7, 9]);
    expect(MISSIONS_4[0]?.reward).toBe(1200);
    const last = MISSIONS_4[5]?.objective;
    expect(last).toEqual({ type: 'boss', boss: 'halo' });
    expect(BOSSES.halo.coreHp).toBe(3200);
    expect(campaignTheaters(4)).toEqual(['orbit']);
    expect(campaignMissions(4)).toEqual(MISSIONS_4);
    expect(ALL_MISSIONS.slice(90)).toEqual(MISSIONS_4);
    expect(kitOf(4)).toBe('ship');
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

  it('gives no finale after m96: a map ends only at a multiple of 30', () => {
    const m96 = MISSIONS_4[5];
    if (!m96) throw new Error('missing');
    const result: MissionResult = {
      missionId: m96.id, success: true, aborted: false, takeoff: 'skipped', kills: 20, spawned: 24,
      objectiveDone: true, hullRatio: 0.6, collected: 0, bossKilled: true,
    };
    const keys = debriefScript({ mission: m96, result, stars: 2, totalText: '$9,600', campaignDone: true }).map((l) => l.key);
    expect(keys.some((k) => k.startsWith('adm.finale'))).toBe(false);
    expect(keys).not.toContain('adm.space');
  });
});
