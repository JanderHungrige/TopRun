import { describe, it, expect } from 'vitest';
import { areaDef, areaIds, BASE_AREAS, baseAreas, baseLookOf } from '../../src/data/base-areas';
import { CARRIER_AREAS, CARRIER_LAYOUT, JUNGLE_LAYOUT, SEA_LAYOUT, SPACE_LAYOUT } from '../../src/data/base-docks';
import { areaAt, arrivedAt, neighbour, walkerAt } from '../../src/game/base-hangar';

// The home docks (doc 73): the base wears the look of the map the pilot came from; each look has its own geometry.

const inside = (r: { x: number; y: number; w: number; h: number }): boolean => r.x >= 0 && r.y >= 0 && r.x + r.w <= 1280 && r.y + r.h <= 720;

describe('Home docks (doc 73)', () => {
  it('shows the carrier hangar on maps 1–3, the sea dock on map 4, the space dock on map 5 (doc 74), the jungle base on map 6', () => {
    expect([1, 2, 3, 4, 5, 6].map((c) => baseLookOf(c as 1 | 2 | 3 | 4 | 5 | 6))).toEqual(['carrier', 'carrier', 'carrier', 'sea', 'space', 'jungle']);
    expect(baseAreas('carrier')).toBe(CARRIER_AREAS); // the lounge picture (doc 91); BASE_AREAS stays the code-drawn hangar's
  });

  it('places every area of the docks on the screen, and the pilot stands on the floor in front of it', () => {
    for (const look of ['carrier', 'space', 'sea', 'jungle'] as const) {
      const areas = baseAreas(look);
      for (const id of areaIds(areas)) {
        const a = areaDef(areas, id);
        expect(inside(a.hot)).toBe(true);
        expect(a.standX).toBeGreaterThan(40);
        expect(a.standX).toBeLessThan(1240);
        expect(areaAt({ x: a.hot.x + a.hot.w / 2, y: a.hot.y + a.hot.h / 2 }, areas), `${look} ${id}`).not.toBeNull();
      }
    }
    for (const L of [CARRIER_LAYOUT, SPACE_LAYOUT, SEA_LAYOUT, JUNGLE_LAYOUT]) for (const r of [L.board, L.slate, L.neon]) expect(inside(r)).toBe(true);
  });

  it('gives only the jungle base the ground base and the lab (doc 86)', () => {
    expect(areaIds(baseAreas('jungle'))).toEqual(['fun', 'tv', 'locker', 'photos', 'jet', 'base', 'lab', 'ladder', 'chalk', 'exit']);
    for (const look of ['carrier', 'space', 'sea'] as const) expect(areaIds(baseAreas(look))).toHaveLength(8);
    const globe = JUNGLE_LAYOUT.globe;
    if (!globe) throw new Error('no globe');
    expect(areaAt({ x: globe.x + globe.w / 2, y: globe.y + globe.h / 2 }, baseAreas('jungle'))).toBe('exit');
  });

  it('leads to the map through the space dock\'s porthole and the sea dock\'s globe, the pilot to scale (doc 76)', () => {
    expect(SPACE_LAYOUT.globe).toBeNull();
    const globe = SEA_LAYOUT.globe;
    if (!globe) throw new Error('no globe');
    expect(inside(globe)).toBe(true);
    const sea = baseAreas('sea');
    expect(areaAt({ x: globe.x + globe.w / 2, y: globe.y + globe.h / 2 }, sea)).toBe('exit');
    const space = baseAreas('space');
    expect(areaDef(space, 'exit').row).toBe('wall');
    expect(areaAt({ x: 910, y: 292 }, space)).toBe('exit'); // the left porthole
    expect(areaAt({ x: 1162, y: 262 }, space)).toBe('jet'); // the right one, with the starfighter in it
    for (const L of [CARRIER_LAYOUT, SPACE_LAYOUT, SEA_LAYOUT, JUNGLE_LAYOUT]) expect(L.pilot).toBeGreaterThan(0.7);
  });

  it('hit-tests, steps and arrives with the dock\'s own geometry', () => {
    const sea = baseAreas('sea');
    const tv = areaDef(sea, 'tv').hot;
    expect(areaAt({ x: tv.x + 4, y: tv.y + 4 }, sea)).toBe('tv'); // the TV stands in front of the rec room (doc 63)
    expect(neighbour('fun', 'right', sea)).toBe('tv');
    const chalk = areaDef(sea, 'chalk').standX;
    expect(arrivedAt(walkerAt(chalk), 'chalk', sea)).toBe(true);
    expect(arrivedAt(walkerAt(chalk), 'chalk')).toBe(chalk === areaDef(BASE_AREAS, 'chalk').standX);
  });

  it('leads to the map through the carrier lounge\'s opening onto the flight deck, the hangar through its door (doc 91)', () => {
    const carrier = baseAreas('carrier');
    expect(CARRIER_LAYOUT.globe).toBeNull();
    expect(areaAt({ x: 1140, y: 300 }, carrier)).toBe('exit'); // the opening onto the flight deck
    expect(areaAt({ x: 820, y: 330 }, carrier)).toBe('jet'); // the steel door with the hall and the jet
    expect(areaAt({ x: 560, y: 330 }, carrier)).toBe('chalk');
    expect(areaAt({ x: 500, y: 210 }, carrier)).toBe('ladder');
    const tv = areaDef(carrier, 'tv').hot;
    const slate = CARRIER_LAYOUT.slate;
    expect(tv.x).toBeGreaterThanOrEqual(CARRIER_LAYOUT.tv.x - 4);
    expect(slate.w / slate.h).toBeGreaterThan(2.5); // the long horizontal chalkboard
  });
});
