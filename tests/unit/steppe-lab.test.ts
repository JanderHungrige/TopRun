import { describe, expect, it } from 'vitest';
import { MISSIONS_7 } from '../../src/data/missions-7';
import { STEPPE_LAB_LEVELS, STEPPE_PROJECT_IDS, STEPPE_PROJECTS } from '../../src/data/steppe-research';
import type { MissionResult } from '../../src/data/types';
import { adminView } from '../../src/game/admin';
import { applyResult } from '../../src/game/economy';
import { kitView } from '../../src/game/kit';
import { defaultSave, parseSave, type SaveData } from '../../src/game/save';
import {
  addSteppeResearch, buySteppeLab, freshSteppeLab, knownTowers, labLevelPrice, labResearch, parseSteppeLab, startSteppeProject,
  steppeDay, steppeLabList, steppeProjectState, tankKnownWeapons, tankMark, towerMark,
} from '../../src/game/steppe-lab';

// The steppe lab (doc 107): its level for money, research per map-7 sortie, one project at a time, the inventions.

const lab = (over: Partial<SaveData['steppeLab']> = {}): SaveData['steppeLab'] => ({ ...freshSteppeLab(), ...over });
const withLab = (l: SaveData['steppeLab']): SaveData => ({ ...defaultSave(), steppeLab: l });
const result = (success: boolean, aborted = false): MissionResult => ({
  missionId: 'm183', success, aborted, takeoff: 'skipped', kills: 10, spawned: 12, objectiveDone: success, hullRatio: 1, collected: 0, bossKilled: false,
});

describe('Steppe lab (doc 107)', () => {
  it('has 23 projects costing 3,260 points, each needing a lab level and maybe an earlier project', () => {
    expect(STEPPE_PROJECT_IDS).toHaveLength(23);
    expect(STEPPE_PROJECT_IDS.reduce((s, id) => s + STEPPE_PROJECTS[id].cost, 0)).toBe(3260);
    for (const id of STEPPE_PROJECT_IDS) {
      const n = STEPPE_PROJECTS[id].needs;
      if (n) expect(STEPPE_PROJECT_IDS.indexOf(n)).toBeLessThan(STEPPE_PROJECT_IDS.length);
    }
  });

  it('is bought with money, level by level, and researches more the bigger it is', () => {
    let s: SaveData | null = { ...defaultSave(), money: 3_000_000 };
    expect(labResearch(s.steppeLab)).toBe(0);
    for (const level of STEPPE_LAB_LEVELS) {
      expect(labLevelPrice(s!.steppeLab)).toBe(level.price);
      s = buySteppeLab(s!);
    }
    expect(s!.steppeLab.level).toBe(3);
    expect(s!.money).toBe(3_000_000 - 150_000 - 500_000 - 1_200_000);
    expect(labResearch(s!.steppeLab)).toBe(130);
    expect(buySteppeLab(s!)).toBeNull();
    expect(buySteppeLab({ ...defaultSave(), money: 10 })).toBeNull();
  });

  it('runs one project at a time: invents at its cost, keeps the rest, gives a switched project back', () => {
    let l = startSteppeProject(lab({ level: 1 }), 'aarocket').lab;
    expect(steppeProjectState(l, 'aarocket')).toBe('active');
    const r = addSteppeResearch(l, 70);
    expect(r.invented).toBe('aarocket');
    expect(r.lab).toMatchObject({ project: null, research: 20, done: ['aarocket'] });
    l = startSteppeProject(r.lab, 'atgm').lab;
    expect(l.progress).toBe(20);
    l = startSteppeProject(l, 'mines').lab;
    expect(l).toMatchObject({ project: 'mines', progress: 20, research: 0 });
    expect(steppeProjectState(l, 'flamer')).toBe('lab');
    expect(steppeProjectState(l, 'atgm2')).toBe('needs');
    expect(steppeLabList(r.lab).at(-1)).toBe('aarocket');
  });

  it('owns the inventions: weapons and their marks in the motor pool, towers and their marks in the defences', () => {
    const s = withLab(lab({ level: 3, done: ['aarocket', 'aarocket2', 't-mortarpit', 'towers2', 'grenade2'] }));
    expect(tankKnownWeapons(s)).toEqual(['grenade', 'aarocket']);
    expect([tankMark(s, 'aarocket'), tankMark(s, 'grenade'), tankMark(s, 'atgm')]).toEqual([2, 2, 1]);
    expect(knownTowers(s)).toEqual(['mgnest', 'flak', 'mortarpit']);
    expect(towerMark(s, 'flak')).toBe(2);
    const view = kitView(s, 'tank');
    expect(view.ownedSecondaries).toEqual(expect.arrayContaining(['grenade', 'aarocket']));
    expect(view.weaponLevels.aarocket).toBe(2);
  });

  it('researches after a map-7 sortie: full when won, half when lost, nothing when aborted or elsewhere', () => {
    const l = lab({ level: 2 });
    const m = MISSIONS_7[2]!;
    expect(steppeDay(l, m, result(true))?.research).toBe(80);
    expect(steppeDay(l, m, result(false))?.research).toBe(40);
    expect(steppeDay(l, m, result(false, true))?.research).toBe(0);
    const applied = applyResult(withLab(l), m, result(true));
    expect(applied.save.steppeLab.research).toBe(80);
    expect(applied.lab).toEqual({ research: 80, invented: null });
  });

  it('parses from storage and opens fully for the admin pilot', () => {
    expect(parseSteppeLab({ level: 9, project: 'nope', done: ['atgm', 'atgm', 'x'], research: -4 })).toEqual(lab({ level: 3, done: ['atgm'] }));
    const raw = JSON.parse(JSON.stringify(withLab(lab({ level: 2, project: 'mines', progress: 40 }))));
    expect(parseSave(raw)?.steppeLab).toMatchObject({ level: 2, project: 'mines', progress: 40 });
    expect(adminView(defaultSave()).steppeLab).toMatchObject({ level: 3, done: [...STEPPE_PROJECT_IDS] });
  });
});
