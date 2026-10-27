import { describe, it, expect } from 'vitest';
import { LIVERIES, LIVERY_IDS } from '../../src/data/liveries';
import { MISSIONS } from '../../src/data/missions';
import { MISSIONS_2 } from '../../src/data/missions-2';
import { isLiveryUnlocked, liveryOnShow, newlyUnlocked, parseLiveries, regionOpen } from '../../src/game/liveries';
import type { SaveData } from '../../src/game/save';

type Progress = SaveData['progress'];
const cleared = (ids: readonly string[], stars = 2): Progress => Object.fromEntries(ids.map((id) => [id, { stars }]));
const MAP1 = MISSIONS.map((m) => m.id);
const MAP2 = MISSIONS_2.map((m) => m.id);

describe('Map-2 paint jobs (doc 09, Second Front wave 4)', () => {
  it('adds a region camo and a 3★ reward for each map-2 theater', () => {
    expect(LIVERY_IDS).toHaveLength(21);
    for (const theater of ['northsea', 'himalaya', 'jungle', 'nightfall', 'thunderhead'] as const) {
      const kinds = LIVERY_IDS.map((id) => LIVERIES[id].unlock).filter((u) => u?.theater === theater).map((u) => u?.kind);
      expect(kinds.sort(), theater).toEqual(['region', 'stars']);
    }
  });

  it('opens a region when its first mission becomes playable', () => {
    expect(regionOpen({}, 'pacific')).toBe(true);
    expect(regionOpen(cleared(MAP1.slice(0, 29)), 'northsea')).toBe(false);
    expect(regionOpen(cleared(MAP1), 'northsea')).toBe(true);
    expect(regionOpen(cleared([...MAP1, ...MAP2.slice(0, 5)]), 'himalaya')).toBe(false);
    expect(regionOpen(cleared([...MAP1, ...MAP2.slice(0, 6)]), 'himalaya')).toBe(true);
  });

  it('hands out the region camo before the region — with the previous boss, the North Sea one with mission 30', () => {
    const before = cleared(MAP1.slice(0, 29));
    const after = cleared(MAP1);
    expect(newlyUnlocked(before, after)).toEqual(expect.arrayContaining(['seagrey']));
    expect(isLiveryUnlocked(after, 'snowrock')).toBe(false);
    const kraken = cleared([...MAP1, ...MAP2.slice(0, 6)]);
    expect(newlyUnlocked(cleared([...MAP1, ...MAP2.slice(0, 5)]), kraken)).toEqual(['snowrock']);
    expect(isLiveryUnlocked(kraken, 'deepblue')).toBe(false);
    expect(isLiveryUnlocked({ ...kraken, ...cleared(MAP2.slice(0, 6), 3) }, 'deepblue')).toBe(true);
  });

  it('shows the map-2 paint jobs only once map 2 is open', () => {
    expect(liveryOnShow({}, 'desert')).toBe(true);
    expect(liveryOnShow(cleared(MAP1.slice(0, 29)), 'seagrey')).toBe(false);
    expect(liveryOnShow(cleared(MAP1), 'legend')).toBe(true);
  });

  it('keeps an earned map-2 paint job through save parsing', () => {
    const progress = cleared([...MAP1, ...MAP2.slice(0, 6)]);
    expect(parseLiveries({ a10: 'snowrock', f14: 'legend' }, progress)).toMatchObject({ a10: 'snowrock', f14: 'standard' });
  });
});
