import { describe, it, expect } from 'vitest';
import { THEATERS } from '../../src/data/theaters';
import { ALL_MISSIONS } from '../../src/data/missions';
import { mapOpen, nextMission } from '../../src/game/progress';
import { defaultSave, parseSave } from '../../src/game/save';
import { movedId, reorderWorlds, WORLD_ORDER } from '../../src/game/world-order';

// The world order (doc 74): the sea is map 4 (m91–m120), space map 5 (m121–m150); older saves are moved when read.

const theaterOf = (id: string): string | undefined => ALL_MISSIONS.find((m) => m.id === id)?.theater;
const old = (progress: Record<string, unknown>, sorties: unknown[] = []): Record<string, unknown> =>
  ({ ...JSON.parse(JSON.stringify(defaultSave())), worlds: undefined, progress, sorties });

describe('World order (doc 74)', () => {
  it('swaps m91–m120 with m121–m150 and leaves every other id alone', () => {
    expect([movedId('m91'), movedId('m120'), movedId('m121'), movedId('m150')]).toEqual(['m121', 'm150', 'm91', 'm120']);
    expect([movedId('m90'), movedId('m01'), movedId('m151'), movedId('x91'), movedId('m91x')]).toEqual(['m90', 'm01', 'm151', 'x91', 'm91x']);
    for (let n = 91; n <= 150; n++) expect(movedId(movedId(`m${n}`))).toBe(`m${n}`);
  });

  it('puts the sea first and space last on the globe', () => {
    expect([theaterOf('m91'), theaterOf('m120'), theaterOf('m121'), theaterOf('m150')]).toEqual(['reef', 'abyss', 'orbit', 'deep']);
    expect([THEATERS.reef.campaign, THEATERS.orbit.campaign]).toEqual([4, 5]);
  });

  it('moves an old save once: space progress and sorties follow space to m121–m150', () => {
    const ninety = Object.fromEntries(ALL_MISSIONS.slice(0, 90).map((m) => [m.id, { stars: 3 }]));
    const raw = old({ ...ninety, m91: { stars: 2, score: 700 }, m96: { stars: 1 } }, [
      { mission: 'm96', outcome: 'win', hull: 0.5, kills: 0.8, kit: 10, level: 2, score: 500, at: 5 },
      { mission: 'm40', outcome: 'down', hull: 0, kills: 0.2, kit: 10, level: 2, score: 0, at: 6 },
    ]);
    const save = parseSave(raw);
    if (!save) throw new Error('not parsed');
    expect(save.worlds).toBe(WORLD_ORDER);
    expect(save.progress.m121).toEqual({ stars: 2, score: 700 });
    expect(save.progress.m126).toEqual({ stars: 1 });
    expect(save.progress.m91).toBeUndefined();
    expect(save.progress.m90).toEqual({ stars: 3 });
    expect(save.sorties.map((s) => s.mission)).toEqual(['m126', 'm40']);
    expect(theaterOf('m126')).toBe('orbit');
  });

  it('never moves a save twice: what it writes comes back the same', () => {
    const once = parseSave(old({ m91: { stars: 2 }, m125: { stars: 1 } }));
    if (!once) throw new Error('not parsed');
    const again = parseSave(JSON.parse(JSON.stringify(once)));
    expect(again?.progress).toEqual(once.progress);
    expect(Object.keys(once.progress).sort()).toEqual(['m121', 'm95']);
    const fresh = { ...defaultSave(), progress: { m91: { stars: 1 } } };
    expect(reorderWorlds(fresh as unknown as Record<string, unknown>)).toBe(fresh);
  });

  it('keeps space open for a pilot who flew it as map 4, and the sea opens after m90 as before', () => {
    const ninety = Object.fromEntries(ALL_MISSIONS.slice(0, 90).map((m) => [m.id, { stars: 2 }]));
    const flewSpace = Object.fromEntries(Array.from({ length: 8 }, (_, i) => [`m${91 + i}`, { stars: 2 }]));
    const save = parseSave(old({ ...ninety, ...flewSpace }));
    if (!save) throw new Error('not parsed');
    expect(mapOpen(save, 4)).toBe(true);
    expect(mapOpen(save, 5)).toBe(true);
    expect(save.progress.m128).toBeDefined();
    expect(nextMission(save).id).toBe('m129');
  });

  it('passes nonsense through to the parser, which drops it', () => {
    expect(reorderWorlds({ version: 1, progress: 'x', sorties: { a: 1 } })).toEqual({ version: 1, progress: 'x', sorties: { a: 1 } });
    const save = parseSave(old({ m91: 'junk', __proto__x: { stars: 1 } }, ['nope', { mission: 7 }]));
    expect(save?.progress).toEqual({});
    expect(save?.sorties).toEqual([]);
  });
});
