import { describe, expect, it } from 'vitest';
import { BOSSES } from '../../src/data/bosses';
import { ENEMIES_7 } from '../../src/data/enemies-7';
import { ALL_MISSIONS, campaignMissions } from '../../src/data/missions';
import { MISSIONS_6 } from '../../src/data/missions-6';
import { MISSIONS_7 } from '../../src/data/missions-7';
import { miniBosses } from '../../src/data/reinforcements';
import { campaignTheaters } from '../../src/data/theaters';
import type { MissionResult } from '../../src/data/types';
import { debriefScript } from '../../src/game/dialogue-scripts';
import { kitOf } from '../../src/game/kit';
import { MAP_SEVEN } from '../../src/game/map-three';
import { payScale } from '../../src/game/map-two';
import { objectiveMet, emptyTally } from '../../src/game/objectives';
import { isUnlocked, mapOpen } from '../../src/game/progress';
import { defaultSave, type SaveData } from '../../src/game/save';
import { objectiveText } from '../../src/i18n/content';
import { MISSIONS_DE } from '../../src/i18n/missions-de';

// Map 7 (doc 102): the alien steppe, driven by the tanks and buggies, m181–m210 in five theaters after the jungle;
// drives and defences in turn.

const MAP7 = ['grass', 'saltflats', 'badlands', 'barrows', 'impact'];
const cleared = (save: SaveData, ids: readonly string[]): SaveData =>
  ({ ...save, progress: { ...save.progress, ...Object.fromEntries(ids.map((id) => [id, { stars: 1 }])) } });
const win = (id: string): MissionResult => ({
  missionId: id, success: true, aborted: false, takeoff: 'skipped', kills: 20, spawned: 24, objectiveDone: true, hullRatio: 0.6, collected: 0, bossKilled: true,
});

describe('Seventh map: the alien steppe (doc 102)', () => {
  it('holds m181–m210 on map 7, a fresh climb, driven with the tanks', () => {
    expect(MISSIONS_7.map((m) => m.id)).toEqual(Array.from({ length: 30 }, (_, i) => `m${i + 181}`));
    expect(MISSIONS_7.every((m, i) => m.number === i + 181 && m.campaign === 7)).toBe(true);
    expect(MISSIONS_7[0]?.difficulty).toBe(2);
    expect(MISSIONS_7[0]?.reward).toBe(1200);
    expect(campaignMissions(7)).toEqual(MISSIONS_7);
    expect(ALL_MISSIONS.slice(180)).toEqual(MISSIONS_7);
    expect(kitOf(7)).toBe('tank');
    for (const m of MISSIONS_7) expect(MISSIONS_DE[m.id]?.name).toBeTruthy();
  });

  it('alternates drives and defences: the 2nd, 4th and 6th mission of each theater hold the outpost', () => {
    MISSIONS_7.forEach((m, i) => {
      const defence = i % 2 === 1;
      expect(!!m.defend, m.id).toBe(defence);
      if (defence && m.objective.type !== 'boss') expect(m.objective).toEqual({ type: 'defend', waves: m.defend });
    });
    expect(MISSIONS_7.map((m) => m.defend ?? 0).filter((w) => w > 0)).toEqual([5, 5, 6, 6, 6, 7, 6, 7, 7, 7, 7, 8, 7, 8, 8]);
    expect(MISSIONS_6.every((m) => m.defend === undefined)).toBe(true);
  });

  it('has five theaters of six missions, a boss every sixth, the MOTHERSHIP last, each tougher than the one before', () => {
    expect(campaignTheaters(7)).toEqual(MAP7);
    const bosses = MISSIONS_7.flatMap((m) => (m.objective.type === 'boss' ? [m.objective.boss] : []));
    expect(bosses).toEqual(['harvester', 'longshanks', 'juggernaut', 'dreadnought', 'mothership']);
    expect(bosses.map((b) => BOSSES[b].coreHp)).toEqual([3000, 4200, 4600, 5000, 5600]);
    for (const m of MISSIONS_7) for (const k of m.pool) expect(Object.keys(ENEMIES_7)).toContain(k);
    for (const m of MISSIONS_7) if (m.objective.type === 'strike') expect(m.pool).toContain(m.objective.target);
  });

  it('sends the war tripod mid-mission in the drives from the salt flats on, never in a defence or a boss mission', () => {
    const at = (n: number): ReturnType<typeof miniBosses> => miniBosses(MISSIONS_7[n - 181] ?? MISSIONS_7[0]!);
    expect(at(183)).toEqual([]);
    expect(at(187)).toEqual([{ at: 0.55, kind: 'wartripod' }]);
    expect(at(188)).toEqual([]);
    expect(at(192)).toEqual([]);
  });

  it('opens after the jungle finale and pays on its own scale', () => {
    const last6 = MISSIONS_6[29];
    const first7 = MISSIONS_7[0];
    if (!last6 || !first7) throw new Error('missing missions');
    expect(mapOpen(defaultSave(), 7)).toBe(false);
    const done = cleared(defaultSave(), [last6.id]);
    expect(mapOpen(done, 7)).toBe(true);
    expect(isUnlocked(done, first7)).toBe(true);
    expect(payScale(181)).toBeCloseTo(MAP_SEVEN.pay, 6);
    expect(payScale(210)).toBeCloseTo(MAP_SEVEN.pay * (1 + MAP_SEVEN.ramp * 29), 6);
  });

  it('has the admiral open the steppe after the jungle and close it after the mothership', () => {
    const last6 = MISSIONS_6[29];
    const last7 = MISSIONS_7[29];
    if (!last6 || !last7) throw new Error('missing missions');
    const keys6 = debriefScript({ mission: last6, result: win(last6.id), stars: 2, totalText: '$9,600', campaignDone: true }).map((l) => l.key);
    expect(keys6).toEqual(expect.arrayContaining(['adm.finale6', 'adm.steppe']));
    const keys7 = debriefScript({ mission: last7, result: win(last7.id), stars: 2, totalText: '$9,600', campaignDone: true }).map((l) => l.key);
    expect(keys7).toContain('adm.finale7');
  });

  it('wins a defence when the waves are held and the outpost stands', () => {
    const o = { type: 'defend', waves: 5 } as const;
    expect(objectiveMet(o, { ...emptyTally(), wavesHeld: 4 }, true)).toBe(false);
    expect(objectiveMet(o, { ...emptyTally(), wavesHeld: 5 }, true)).toBe(true);
    expect(objectiveMet(o, { ...emptyTally(), wavesHeld: 5, outpostLost: true }, true)).toBe(false);
    expect(objectiveMet({ type: 'patrol' }, { ...emptyTally(), outpostLost: true }, true)).toBe(false);
    expect(objectiveText(o)).toBe('Hold the outpost: 5 waves');
  });
});
