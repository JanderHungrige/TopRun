import { describe, expect, it } from 'vitest';
import { BOSSES } from '../../src/data/bosses';
import { ALL_MISSIONS, campaignMissions } from '../../src/data/missions';
import { MISSIONS_5 } from '../../src/data/missions-5';
import { MISSIONS_6 } from '../../src/data/missions-6';
import { miniBosses } from '../../src/data/reinforcements';
import { campaignTheaters } from '../../src/data/theaters';
import { ENEMIES } from '../../src/data/enemies';
import type { MissionResult } from '../../src/data/types';
import { debriefScript } from '../../src/game/dialogue-scripts';
import { kitOf } from '../../src/game/kit';
import { MAP_SIX } from '../../src/game/map-three';
import { payScale } from '../../src/game/map-two';
import { isUnlocked, mapOpen } from '../../src/game/progress';
import { defaultSave, type SaveData } from '../../src/game/save';

// Map 6 (doc 78): the jungle planet, walked by the mechs, m151–m180 in five theaters after space.

const MAP6 = ['landing', 'canopy', 'swamp', 'ruins', 'hive'];
const cleared = (save: SaveData, ids: readonly string[]): SaveData =>
  ({ ...save, progress: { ...save.progress, ...Object.fromEntries(ids.map((id) => [id, { stars: 1 }])) } });
const win = (id: string): MissionResult => ({
  missionId: id, success: true, aborted: false, takeoff: 'skipped', kills: 20, spawned: 24, objectiveDone: true, hullRatio: 0.6, collected: 0, bossKilled: true,
});

describe('Sixth map: the jungle planet (doc 78)', () => {
  it('holds m151–m180 on map 6, a fresh climb, walked with the mechs', () => {
    expect(MISSIONS_6.map((m) => m.id)).toEqual(Array.from({ length: 30 }, (_, i) => `m${i + 151}`));
    expect(MISSIONS_6.every((m, i) => m.number === i + 151 && m.campaign === 6)).toBe(true);
    expect(MISSIONS_6[0]?.difficulty).toBe(2);
    expect(MISSIONS_6[0]?.reward).toBe(1200);
    expect(campaignMissions(6)).toEqual(MISSIONS_6);
    expect(ALL_MISSIONS.slice(150)).toEqual(MISSIONS_6);
    expect(kitOf(6)).toBe('mech');
  });

  it('has five theaters of six missions, a boss every sixth, the HIVE QUEEN last', () => {
    expect(campaignTheaters(6)).toEqual(MAP6);
    const bosses = MISSIONS_6.flatMap((m) => (m.objective.type === 'boss' ? [m.objective.boss] : []));
    expect(bosses).toEqual(['ravager', 'mantis', 'basilisk', 'sentinel', 'queen']);
    expect(bosses.map((b) => BOSSES[b].coreHp)).toEqual([1800, 3200, 3800, 4400, 5000]);
    const jungle = ['walker', 'hovertank', 'artillery', 'gundrone', 'dropship', 'raptor', 'beetle', 'spitter', 'wasp'];
    for (const m of MISSIONS_6) for (const k of m.pool) expect(jungle).toContain(k);
    for (const m of MISSIONS_6) if (m.objective.type === 'strike') expect(m.pool).toContain(m.objective.target);
    expect(ENEMIES.brute.hp).toBeGreaterThan(2000);
  });

  it('sends the brute walker mid-mission from the canopy on, never in boss missions', () => {
    const at = (n: number): ReturnType<typeof miniBosses> => miniBosses(MISSIONS_6[n - 151] ?? MISSIONS_6[0]!);
    expect(at(152)).toEqual([]);
    expect(at(157)).toEqual([{ at: 0.55, kind: 'brute' }]);
    expect(at(162)).toEqual([]);
  });

  it('opens after the space finale and pays on its own scale', () => {
    const last5 = MISSIONS_5[29];
    const first6 = MISSIONS_6[0];
    if (!last5 || !first6) throw new Error('missing missions');
    expect(mapOpen(defaultSave(), 6)).toBe(false);
    const done = cleared(defaultSave(), [last5.id]);
    expect(mapOpen(done, 6)).toBe(true);
    expect(isUnlocked(done, first6)).toBe(true);
    expect(payScale(151)).toBeCloseTo(MAP_SIX.pay, 6);
    expect(payScale(180)).toBeCloseTo(MAP_SIX.pay * (1 + MAP_SIX.ramp * 29), 6);
  });

  it('has the admiral open the jungle after space and close it after the queen', () => {
    const last5 = MISSIONS_5[29];
    const last6 = MISSIONS_6[29];
    if (!last5 || !last6) throw new Error('missing missions');
    const keys5 = debriefScript({ mission: last5, result: win(last5.id), stars: 2, totalText: '$9,600', campaignDone: true }).map((l) => l.key);
    expect(keys5).toEqual(expect.arrayContaining(['adm.finale5', 'adm.jungle']));
    const keys6 = debriefScript({ mission: last6, result: win(last6.id), stars: 2, totalText: '$9,600', campaignDone: true }).map((l) => l.key);
    expect(keys6).toContain('adm.finale6');
    expect(keys6).not.toContain('adm.jungle');
  });
});
