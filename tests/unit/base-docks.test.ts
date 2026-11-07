import { describe, it, expect } from 'vitest';
import { BASE_AREA_IDS, BASE_AREAS, baseAreas, baseLookOf } from '../../src/data/base-areas';
import { SEA_LAYOUT, SPACE_LAYOUT } from '../../src/data/base-docks';
import { areaAt, arrivedAt, neighbour, walkerAt } from '../../src/game/base-hangar';

// The home docks (doc 73): the base wears the look of the map the pilot came from; each look has its own geometry.

const inside = (r: { x: number; y: number; w: number; h: number }): boolean => r.x >= 0 && r.y >= 0 && r.x + r.w <= 1280 && r.y + r.h <= 720;

describe('Home docks (doc 73)', () => {
  it('shows the carrier hangar on maps 1–3, the space dock on map 4, the sea dock on map 5', () => {
    expect([1, 2, 3, 4, 5].map((c) => baseLookOf(c as 1 | 2 | 3 | 4 | 5))).toEqual(['carrier', 'carrier', 'carrier', 'space', 'sea']);
    expect(baseAreas('carrier')).toBe(BASE_AREAS);
  });

  it('places every area of both docks on the screen, and the pilot stands on the floor in front of it', () => {
    for (const look of ['space', 'sea'] as const) {
      const areas = baseAreas(look);
      for (const id of BASE_AREA_IDS) {
        expect(inside(areas[id].hot)).toBe(true);
        expect(areas[id].standX).toBeGreaterThan(40);
        expect(areas[id].standX).toBeLessThan(1240);
        expect(areaAt({ x: areas[id].hot.x + areas[id].hot.w / 2, y: areas[id].hot.y + areas[id].hot.h / 2 }, areas)).not.toBeNull();
      }
    }
    for (const L of [SPACE_LAYOUT, SEA_LAYOUT]) for (const r of [L.board, L.slate, L.neon, L.hatch]) expect(inside(r)).toBe(true);
  });

  it('hit-tests, steps and arrives with the dock\'s own geometry', () => {
    const sea = baseAreas('sea');
    const tv = sea.tv.hot;
    expect(areaAt({ x: tv.x + 4, y: tv.y + 4 }, sea)).toBe('tv'); // the TV stands in front of the rec room (doc 63)
    expect(neighbour('fun', 'right', sea)).toBe('tv');
    expect(arrivedAt(walkerAt(sea.chalk.standX), 'chalk', sea)).toBe(true);
    expect(arrivedAt(walkerAt(sea.chalk.standX), 'chalk')).toBe(sea.chalk.standX === BASE_AREAS.chalk.standX);
  });
});
