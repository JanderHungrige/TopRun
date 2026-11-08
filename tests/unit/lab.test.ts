import { describe, expect, it } from 'vitest';
import { PROJECT_IDS, PROJECTS } from '../../src/data/research';
import { addResearch, knownWeapons, labList, projectState, researchedMark, startProject } from '../../src/game/lab';
import { kitView } from '../../src/game/kit';
import { freshOutpost, type Outpost } from '../../src/game/outpost';
import { defaultSave } from '../../src/game/save';

// The lab (doc 83): one project at a time, research per sortie, inventions own the weapon and its marks.

const lab = (level: number, over: Partial<Outpost> = {}): Outpost => ({ ...freshOutpost(), ...over, buildings: { ...freshOutpost().buildings, lab: level } });

describe('lab (doc 83)', () => {
  it('knows the rocket pod from the landing and nothing else', () => {
    expect(knownWeapons(freshOutpost())).toEqual(['pod']);
    expect(researchedMark(freshOutpost(), 'pod')).toBe(1);
  });

  it('gates projects by the lab level and the inventions before them', () => {
    expect(projectState(lab(0), 'seeker')).toBe('lab');
    expect(projectState(lab(1), 'seeker')).toBe('open');
    expect(projectState(lab(1), 'plasma')).toBe('lab');
    expect(projectState(lab(3), 'rail')).toBe('needs');
    expect(projectState(lab(3, { done: ['plasma'] }), 'rail')).toBe('open');
    expect(projectState(lab(1), 'seeker2')).toBe('needs');
    expect(projectState(lab(1, { done: ['seeker'] }), 'seeker')).toBe('done');
  });

  it('puts research into the running project and invents it at its cost, keeping the rest', () => {
    let o = startProject(lab(1), 'seeker').outpost;
    expect(o.project).toBe('seeker');
    o = addResearch(o, 25).outpost;
    o = addResearch(o, 25).outpost;
    expect(o.progress).toBe(50);
    const done = addResearch(o, 25);
    expect(done.invented).toBe('seeker');
    expect(done.outpost.project).toBeNull();
    expect(done.outpost.research).toBe(15);
    expect(knownWeapons(done.outpost)).toEqual(['pod', 'seeker']);
  });

  it('keeps points made while nothing runs and feeds them into the next project; switching gives them back', () => {
    const banked = addResearch(lab(1), 70).outpost;
    expect(banked.research).toBe(70);
    const quick = startProject(banked, 'seeker');
    expect(quick.invented).toBe('seeker');
    expect(quick.outpost.research).toBe(10);
    const running = startProject(lab(1, { research: 40 }), 'mortar').outpost;
    expect(running.progress).toBe(40);
    const switched = startProject(running, 'seeker').outpost;
    expect(switched.project).toBe('seeker');
    expect(switched.progress + switched.research).toBe(40);
  });

  it('marks come from the lab, and the mech kit owns every invented weapon at its mark', () => {
    const o = lab(2, { done: ['pod2', 'seeker', 'seeker2', 'seeker3'] });
    expect(researchedMark(o, 'pod')).toBe(2);
    expect(researchedMark(o, 'seeker')).toBe(3);
    const view = kitView({ ...defaultSave(), outpost: o }, 'mech');
    expect(view.ownedSecondaries).toEqual(expect.arrayContaining(['pod', 'seeker']));
    expect(view.weaponLevels.seeker).toBe(3);
    expect(view.money).toBe(defaultSave().money);
  });

  it('lists the projects still to invent first', () => {
    const list = labList(lab(1, { done: ['seeker'] }));
    expect(list).toHaveLength(PROJECT_IDS.length);
    expect(list[list.length - 1]).toBe('seeker');
    for (const id of PROJECT_IDS) expect(PROJECTS[id].cost).toBeGreaterThan(0);
  });
});
