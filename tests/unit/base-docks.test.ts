import { describe, it, expect } from 'vitest';
import { areaDef, areaIds, BASE_AREAS, baseAreas, baseLookOf } from '../../src/data/base-areas';
import { CARRIER_AREAS, CARRIER_LAYOUT, HELI_LAYOUT, JUNGLE_LAYOUT, scaleAt, SEA_LAYOUT, SPACE_LAYOUT } from '../../src/data/base-docks';
import { areaAt, arrivedAt, neighbour, walkerAt, walkerAtArea } from '../../src/game/base-hangar';

// The home docks (doc 73): the base wears the look of the map the pilot came from; each look has its own geometry.

const inside = (r: { x: number; y: number; w: number; h: number }): boolean => r.x >= 0 && r.y >= 0 && r.x + r.w <= 1280 && r.y + r.h <= 720;

describe('Home docks (doc 73)', () => {
  it('shows the carrier lounge on maps 1–2, the helicopter base on map 3, the sea dock on map 4, the space dock on map 5 (doc 74), the jungle base on map 6', () => {
    expect([1, 2, 3, 4, 5, 6].map((c) => baseLookOf(c as 1 | 2 | 3 | 4 | 5 | 6))).toEqual(['carrier', 'carrier', 'heli', 'sea', 'space', 'jungle']);
    expect(baseAreas('carrier')).toBe(CARRIER_AREAS); // the lounge picture (doc 91); BASE_AREAS stays the code-drawn hangar's
  });

  it('places every area of the docks on the screen, and the pilot stands on the floor in front of it', () => {
    for (const look of ['carrier', 'heli', 'space', 'sea', 'jungle'] as const) {
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
    for (const look of ['carrier', 'heli', 'space', 'sea'] as const) expect(areaIds(baseAreas(look))).toHaveLength(8);
    const globe = JUNGLE_LAYOUT.globe;
    if (!globe) throw new Error('no globe');
    expect(areaAt({ x: globe.x + globe.w / 2, y: globe.y + globe.h / 2 }, baseAreas('jungle'))).toBe('exit');
  });

  it('leads to the map through the space lounge\'s holo table and the sea lounge\'s globe, the pilot to scale (docs 76, 93, 94)', () => {
    expect(SPACE_LAYOUT.globe).toBeNull();
    expect(SEA_LAYOUT.globe).toBeNull(); // the sea lounge's globe is in the picture (doc 93)
    const sea = baseAreas('sea');
    expect(areaAt({ x: 190, y: 480 }, sea)).toBe('exit'); // the antique globe
    expect(areaAt({ x: 220, y: 250 }, sea)).toBe('jet'); // the window with the submarine's bow
    const space = baseAreas('space');
    expect(areaAt({ x: 1050, y: 510 }, space)).toBe('exit'); // the holographic map table
    expect(areaAt({ x: 1080, y: 250 }, space)).toBe('jet'); // the window with the starfighter and the planet
    expect(SPACE_LAYOUT.front).toBe(true); // the pilot walks behind the map table (doc 92)
    for (const L of [CARRIER_LAYOUT, SPACE_LAYOUT, SEA_LAYOUT, JUNGLE_LAYOUT]) expect(L.pilot).toBeGreaterThan(0.7);
  });

  it('hit-tests, steps and arrives with the dock\'s own geometry', () => {
    const sea = baseAreas('sea');
    const tv = areaDef(sea, 'tv').hot;
    expect(areaAt({ x: tv.x + 4, y: tv.y + 4 }, sea)).toBe('tv'); // the TV stands in front of the rec room (doc 63)
    expect(neighbour('fun', 'right', sea)).toBe('tv');
    expect(arrivedAt(walkerAtArea('photos', sea), 'photos', sea)).toBe(true);
    expect(arrivedAt(walkerAt(areaDef(sea, 'photos').standX), 'photos', sea)).toBe(false); // the cork board is a step back (doc 92)
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
    expect(tv.x).toBeGreaterThanOrEqual((CARRIER_LAYOUT.tv?.x ?? Infinity) - 4);
    expect(slate.w / slate.h).toBeGreaterThan(2.5); // the long horizontal chalkboard
  });

  it('gives the helicopter base depth: deeper spots up the lane, the pilot smaller there, the map table in front (doc 92)', () => {
    expect(baseLookOf(3)).toBe('heli');
    const heli = baseAreas('heli');
    expect(areaAt({ x: 1000, y: 600 }, heli)).toBe('exit'); // the map table
    expect(areaAt({ x: 1000, y: 300 }, heli)).toBe('jet'); // the gate with the helicopter
    const gate = areaDef(heli, 'jet');
    expect(gate.standY).toBeLessThan(600);
    expect(gate.via).toBe(750);
    expect(scaleAt(HELI_LAYOUT, 640)).toBeCloseTo(HELI_LAYOUT.pilot, 6);
    expect(scaleAt(HELI_LAYOUT, gate.standY ?? 640)).toBeLessThan(HELI_LAYOUT.pilot / 2);
    expect(HELI_LAYOUT.front).toBe(true);
    const w = walkerAtArea('jet', heli);
    expect([w.x, w.y, w.lane]).toEqual([900, gate.standY, 750]);
  });

  it('gives the carrier, sea and space docks depth too: the lockers a step back, the pilot smaller there; not the jungle (doc 92)', () => {
    for (const [look, L] of [['carrier', CARRIER_LAYOUT], ['sea', SEA_LAYOUT], ['space', SPACE_LAYOUT]] as const) {
      const areas = baseAreas(look);
      expect(areaDef(areas, 'locker').standY, look).toBeLessThan(640);
      expect(scaleAt(L, 640)).toBeCloseTo(L.pilot, 6);
      const deep = scaleAt(L, Math.min(...areaIds(areas).map((id) => areaDef(areas, id).standY ?? 640)));
      expect(deep, look).toBeLessThan(L.pilot * 0.85);
      expect(deep, look).toBeGreaterThan(0.55); // the deepest spot (the carrier's hangar door): small, not tiny
    }
    const door = areaDef(baseAreas('carrier'), 'jet');
    expect(areaAt({ x: door.standX, y: (door.standY ?? 640) - 60 }, baseAreas('carrier'))).toBe('jet'); // in the doorway
    expect(JUNGLE_LAYOUT.horizon).toBeUndefined();
    for (const id of areaIds(baseAreas('jungle'))) expect(areaDef(baseAreas('jungle'), id).standY).toBeUndefined();
    expect(scaleAt(JUNGLE_LAYOUT, 512)).toBe(JUNGLE_LAYOUT.pilot);
  });
});

describe('Sea lounge (doc 93)', () => {
  it('has its own TV in the picture, no cart, and the game plays the TV\'s picture on its screen', () => {
    expect(SEA_LAYOUT.tv).toBeNull();
    const pictured = SEA_LAYOUT.picturedTv;
    if (!pictured) throw new Error('no TV in the picture');
    const tv = areaDef(baseAreas('sea'), 'tv').hot;
    const s = pictured.screen;
    expect(s.x >= tv.x && s.y >= tv.y && s.x + s.w <= tv.x + tv.w && s.y + s.h <= tv.y + tv.h).toBe(true);
    for (const L of [CARRIER_LAYOUT, HELI_LAYOUT, JUNGLE_LAYOUT]) expect(L.tv).not.toBeNull();
    expect(SPACE_LAYOUT.picturedTv).toBeDefined(); // the space lounge's flat screen too (doc 94)
  });

  it('keeps the front line right of the globe, and the spots on the back row share it', () => {
    const sea = baseAreas('sea');
    const globe = areaDef(sea, 'exit').hot;
    for (const id of areaIds(sea)) expect(areaDef(sea, id).standX, id).toBeGreaterThan(globe.x + globe.w + 40);
    expect(areaDef(sea, 'fun').standY).toBe(areaDef(sea, 'photos').standY); // the rec room's doorway and the cork board
  });
});
