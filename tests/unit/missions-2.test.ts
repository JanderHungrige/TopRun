import { describe, it, expect } from 'vitest';
import { BOSSES } from '../../src/data/bosses';
import { ALL_MISSIONS, campaignMissions, MISSIONS, missionById } from '../../src/data/missions';
import { MISSIONS_2 } from '../../src/data/missions-2';
import { campaignTheaters, THEATERS } from '../../src/data/theaters';
import { THEATER_IDS } from '../../src/data/types';
import { campaignComplete, campaignStars, isUnlocked, mapTwoOpen, nextMission } from '../../src/game/progress';
import { defaultSave, parseSave, type SaveData } from '../../src/game/save';
import { generateTimeline, strikeSpawns, waveGap } from '../../src/game/waves';

const MAP2 = ['northsea', 'himalaya', 'jungle', 'nightfall', 'thunderhead'];
const clear = (save: SaveData, ...ids: string[]): SaveData =>
  ({ ...save, progress: { ...save.progress, ...Object.fromEntries(ids.map((id) => [id, { stars: 2 }])) } });
const all1 = MISSIONS.map((m) => m.id);

describe('Second map (doc 35)', () => {
  it('holds missions m31–m60 on map 2, map 1 unchanged', () => {
    expect(MISSIONS).toHaveLength(30);
    expect(MISSIONS.every((m) => m.campaign === 1)).toBe(true);
    expect(MISSIONS_2.map((m) => m.id)).toEqual(Array.from({ length: 30 }, (_, i) => `m${i + 31}`));
    expect(MISSIONS_2.every((m, i) => m.number === i + 31 && m.difficulty === i + 31 && m.campaign === 2)).toBe(true);
    expect(ALL_MISSIONS).toHaveLength(60);
    expect(campaignMissions(1)).toEqual(MISSIONS);
    expect(campaignMissions(2)).toEqual(MISSIONS_2);
    expect(missionById('m45')?.campaign).toBe(2);
  });

  it('has five new theaters with six missions each and a new boss every sixth', () => {
    expect(campaignTheaters(2)).toEqual(MAP2);
    expect(campaignTheaters(1)).toEqual(['pacific', 'gulf', 'arctic', 'canyon', 'leviathan']);
    expect(THEATER_IDS).toHaveLength(10);
    MAP2.forEach((th, k) => {
      const six = MISSIONS_2.slice(k * 6, k * 6 + 6);
      expect(six.every((m) => m.theater === th)).toBe(true);
      const boss = six[5]?.objective;
      expect(boss?.type).toBe('boss');
      if (boss?.type === 'boss') expect(BOSSES[boss.boss].id).toBe(boss.boss);
      expect(six.slice(0, 5).every((m) => m.objective.type !== 'boss')).toBe(true);
    });
    const bosses = MISSIONS_2.flatMap((m) => (m.objective.type === 'boss' ? [m.objective.boss] : []));
    expect(bosses).toEqual(['kraken', 'condor', 'python', 'scorpion', 'colossus']);
  });

  it('pays and lasts more than map 1, and keeps its nodes inside the map', () => {
    for (const m of MISSIONS_2) {
      const base = Math.round((1200 + (m.number - 1) * 380) / 100) * 100;
      expect(m.reward).toBe(m.objective.type === 'boss' ? Math.round((base * 1.5) / 100) * 100 : base);
      expect(m.length).toBe(m.objective.type === 'boss' ? 45 + m.number : 105 + Math.round((m.number - 31) * 1.2));
      expect(m.map.x).toBeGreaterThan(30);
      expect(m.map.x).toBeLessThan(856);
      expect(m.map.y).toBeGreaterThan(90);
      expect(m.map.y).toBeLessThan(694);
      if (m.objective.type === 'strike') expect(m.pool).toContain(m.objective.target);
      if (THEATERS[m.theater].base === 'land') expect(m.pool.some((k) => k === 'boat' || k === 'destroyer')).toBe(false);
    }
  });

  it('opens map 2 with mission 30 and then unlocks in order', () => {
    const m31 = missionById('m31');
    const m32 = missionById('m32');
    if (!m31 || !m32) throw new Error('missing');
    let save = clear(defaultSave(), ...all1.slice(0, 29));
    expect(mapTwoOpen(save)).toBe(false);
    expect(isUnlocked(save, m31)).toBe(false);
    expect(nextMission(save).id).toBe('m30');
    save = clear(save, 'm30');
    expect(mapTwoOpen(save)).toBe(true);
    expect(isUnlocked(save, m31)).toBe(true);
    expect(isUnlocked(save, m32)).toBe(false);
    expect(nextMission(save).id).toBe('m31');
    save = clear(save, 'm31');
    expect(isUnlocked(save, m32)).toBe(true);
    expect(nextMission(save).id).toBe('m32');
    expect(campaignStars(save, 1)).toBe(60);
    expect(campaignStars(save, 2)).toBe(2);
    expect(campaignComplete(save, 1)).toBe(true);
    expect(campaignComplete(save, 2)).toBe(false);
  });

  it('keeps map-2 progress in the save', () => {
    const save = clear(defaultSave(), 'm45');
    expect(parseSave(JSON.parse(JSON.stringify(save)))?.progress.m45).toEqual({ stars: 2 });
  });

  it('keeps the wave gap positive and shrinking on map 2, map 1 unchanged', () => {
    expect(waveGap(1)).toBeCloseTo(3.2);
    expect(waveGap(30)).toBeCloseTo(1.5);
    expect(waveGap(45)).toBeCloseTo(1.3);
    expect(waveGap(60)).toBeCloseTo(1.1);
    for (let d = 2; d <= 60; d++) expect(waveGap(d)).toBeLessThanOrEqual(waveGap(d - 1));
  });

  it('guarantees more strike targets on map 2 only (playtest retune)', () => {
    expect(strikeSpawns(3, 1)).toBe(5);
    expect(strikeSpawns(3, 2)).toBe(7);
    expect(strikeSpawns(4, 2)).toBe(8);
    for (const m of ALL_MISSIONS) {
      const o = m.objective;
      if (o.type !== 'strike') continue;
      const spawned = generateTimeline(m).filter((e) => e.type === 'enemy' && e.kind === o.target).length;
      expect(spawned, m.id).toBeGreaterThanOrEqual(strikeSpawns(o.count, m.campaign));
    }
    const ironWall = missionById('m56');
    expect(ironWall?.objective).toEqual({ type: 'strike', target: 'destroyer', count: 4 });
  });
});
