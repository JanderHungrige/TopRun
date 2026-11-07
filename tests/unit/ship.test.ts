import { describe, it, expect } from 'vitest';
import { CELL_PX, GRID, MODULES, type ModuleId } from '../../src/data/ship-modules';
import { CORE, canPlace, freshShip, isValidLayout, moduleLinks, place, remove, shipStats, trimLayout, wingSide, type ShipKit } from '../../src/game/ship';
import { buyLaser, buyModule, canBuyLaser, canBuyModule, modulePrice, owned } from '../../src/game/ship-shop';
import { kitView } from '../../src/game/kit';
import { derivePlayerStats } from '../../src/game/loadout';
import { defaultSave, parseSave, type SaveData } from '../../src/game/save';

// The spacecraft (doc 54): modules on a 7 × 9 grid around a fixed core; shape is the hitbox.

/** The rules on an empty core (a new ship comes with a starter layout). */
const stocked = (stock: Partial<Record<ModuleId, number>>): ShipKit => ({ ...freshShip(), modules: [], stock: { ...freshShip().stock, ...stock } });
const { col: C, row: R } = GRID.core;

describe('Spacecraft (doc 54)', () => {
  it('starts with the core, a laser on each side and an engine: three barrels, 98 hull', () => {
    const s = shipStats(freshShip());
    expect(s).toMatchObject({ hull: 98, shield: 0, mass: 10, thrust: 5, power: 1, rocketWings: 0, radar: false });
    expect(s.speed).toBe(290);
    expect(s.cells).toHaveLength(4);
    expect(s.barrels.map((b) => b.dx).sort((a, b) => a - b)).toEqual([-CELL_PX, 0, CELL_PX]);
    const core = shipStats({ modules: [] });
    expect(core).toMatchObject({ hull: 80, mass: 4, thrust: 2, power: 4 });
    expect(core.barrels).toEqual([{ dx: 0, dy: 0 }]);
  });

  it('places bought modules next to the core and takes them back into stock', () => {
    let s = stocked({ laser: 2, plate: 1 });
    expect(canPlace(s, 'laser', C + 2, R)).toEqual({ ok: false, reason: 'invalid' }); // not touching the core
    s = place(s, 'laser', C - 1, R);
    s = place(s, 'laser', C + 1, R);
    expect(s.stock.laser).toBe(0);
    expect(canPlace(s, 'laser', C + 1, R + 1)).toEqual({ ok: false, reason: 'no-stock' });
    expect(canPlace(s, 'plate', C, R)).toEqual({ ok: false, reason: 'occupied' });
    const st = shipStats(s);
    expect(st.barrels.map((b) => b.dx).sort((a, b) => a - b)).toEqual([-CELL_PX, 0, CELL_PX]);
    s = remove(s, C - 1, R);
    expect(s.stock.laser).toBe(1);
    expect(s.modules).toHaveLength(1);
  });

  it('keeps lasers and the capsule clear ahead, engines clear behind, rocket wings on an open side', () => {
    let s = stocked({ laser: 1, plate: 2, engine: 2, capsule: 2, rockets: 2, reactor: 1 });
    s = place(s, 'laser', C, R - 1);
    expect(canPlace(s, 'plate', C, R - 2)).toEqual({ ok: false, reason: 'invalid' }); // in front of the laser
    s = place(s, 'engine', C, R + 1);
    expect(canPlace(s, 'plate', C, R + 2)).toEqual({ ok: false, reason: 'invalid' }); // behind the engine
    expect(canPlace(s, 'capsule', C - 1, R)).toEqual({ ok: true });
    s = place(s, 'capsule', C - 1, R);
    s = place(s, 'reactor', C + 1, R);
    expect(canPlace(s, 'capsule', C + 1, R - 1)).toEqual({ ok: false, reason: 'invalid' }); // only one capsule
    s = place(s, 'plate', C - 1, R + 1);
    expect(canPlace(s, 'rockets', C - 2, R + 1)).toEqual({ ok: true });
    s = place(s, 'rockets', C - 2, R + 1);
    expect(s.modules).toHaveLength(6);
  });

  it('needs power for engines, lasers and shields: four from the core, four per reactor', () => {
    let s = stocked({ shield: 3, reactor: 1 });
    s = place(s, 'shield', C - 1, R);
    s = place(s, 'shield', C + 1, R);
    expect(canPlace(s, 'shield', C, R + 1)).toEqual({ ok: false, reason: 'invalid' });
    s = place(s, 'reactor', C, R + 1);
    s = place(s, 'shield', C, R + 2);
    expect(shipStats(s)).toMatchObject({ shield: 75, power: 2 });
  });

  it('makes a bigger ship a bigger, slower target with more hull', () => {
    let s = stocked({ plate: 4, capsule: 1 });
    for (const [c, r] of [[C - 1, R], [C + 1, R], [C - 1, R + 1], [C + 1, R + 1]] as const) s = place(s, 'plate', c, r);
    s = place(s, 'capsule', C, R - 1);
    const st = shipStats(s);
    expect(st.cells).toHaveLength(6);
    expect(st.hull).toBe(80 + 4 * 25 + 40);
    expect(st.radar).toBe(true);
    expect(st.speed).toBeLessThan(shipStats(freshShip()).speed);
    expect(st.mass).toBe(4 + 4 * MODULES.plate.mass + MODULES.capsule.mass);
  });

  it('refuses to take off a module others hang on, and trims a forged layout to its valid part', () => {
    let s = stocked({ plate: 2 });
    s = place(s, 'plate', C + 1, R);
    s = place(s, 'plate', C + 2, R);
    expect(remove(s, C + 1, R)).toBe(s);
    expect(isValidLayout([CORE, { id: 'plate', col: C + 2, row: R }])).toBe(false);
    expect(trimLayout([{ id: 'plate', col: C + 2, row: R }, { id: 'plate', col: C + 1, row: R }, { id: 'laser', col: 99, row: 0 }]))
      .toEqual([{ id: 'plate', col: C + 1, row: R }]);
  });
});

describe('Shipyard shop (doc 55)', () => {
  const mapFour = (money: number): SaveData =>
    ({ ...defaultSave(), money, progress: Object.fromEntries(Array.from({ length: 90 }, (_, i) => [`m${String(i + 1).padStart(2, '0')}`, { stars: 1 }])) });

  it('sells modules into stock once map 4 is open, each further copy a quarter dearer', () => {
    expect(canBuyModule({ ...defaultSave(), money: 9e6 }, 'plate')).toEqual({ ok: false, reason: 'locked' });
    let s = mapFour(1_000_000);
    expect(modulePrice(s, 'plate')).toBe(MODULES.plate.price);
    s = buyModule(s, 'plate');
    expect(s.ship.stock.plate).toBe(1);
    expect(s.money).toBe(1_000_000 - MODULES.plate.price);
    expect(modulePrice(s, 'plate')).toBe(Math.round(MODULES.plate.price * 1.25 / 1000) * 1000);
    s = { ...s, ship: place(s.ship, 'plate', C + 1, R) };
    expect(owned(s, 'plate')).toBe(1);
    expect(modulePrice(s, 'plate')).toBe(Math.round(MODULES.plate.price * 1.25 / 1000) * 1000);
  });

  it('sells one capsule only, never the core, and laser power to level 10', () => {
    let s = buyModule(mapFour(9_000_000), 'capsule');
    expect(canBuyModule(s, 'capsule')).toEqual({ ok: false, reason: 'max' });
    expect(modulePrice(s, 'core')).toBeNull();
    for (let i = 0; i < 12; i++) s = buyLaser(s);
    expect(s.ship.laserLevel).toBe(10);
    expect(canBuyLaser(s)).toEqual({ ok: false, reason: 'max' });
    expect(canBuyLaser(mapFour(10))).toEqual({ ok: false, reason: 'insufficient-funds' });
  });

  it('flies the ship from its modules: hull, guns, rocket wings, shield; parses forged layouts down', () => {
    let s = mapFour(9_000_000);
    for (const id of ['laser', 'rockets', 'shield', 'plate'] as const) s = buyModule(s, id);
    let ship = place({ ...s.ship, modules: [] }, 'laser', C - 1, R);
    ship = place(ship, 'rockets', C + 1, R);
    ship = place(ship, 'shield', C, R + 1);
    ship = place(ship, 'plate', C, R + 2);
    const stats = derivePlayerStats(kitView({ ...s, ship }, 'ship'));
    expect(stats.plane.id).toBe('starship');
    expect(stats.maxHull).toBe(80 + 6 + 6 + 6 + 25);
    expect(stats.ship?.barrels).toHaveLength(2);
    expect(stats.ship?.shield).toBe(25);
    expect(stats.secondaries).toEqual([expect.objectContaining({ id: 'spacerocket', ammo: 6 })]);
    const raw = JSON.parse(JSON.stringify({ ...defaultSave(), ship: { modules: [{ id: 'plate', col: 0, row: 0 }, { id: 'core', col: 1, row: 1 }], stock: { laser: 99 }, laserLevel: 42 } }));
    expect(parseSave(raw)?.ship).toMatchObject({ modules: [], laserLevel: 10, stock: { laser: 40 } });
  });
});

describe('Starfighter art helpers (doc 54)', () => {
  it('joins every side-by-side pair of modules once with a strut', () => {
    const list = [CORE, { id: 'laser', col: C - 1, row: R }, { id: 'engine', col: C, row: R + 1 }, { id: 'plate', col: C - 1, row: R + 1 }] as const;
    const links = moduleLinks(list);
    expect(links).toHaveLength(4);
    expect(links.every(([a, b]) => Math.abs(a.col - b.col) + Math.abs(a.row - b.row) === 1)).toBe(true);
    expect(moduleLinks([CORE])).toEqual([]);
  });

  it('sweeps a rocket wing to its open side, away from the core when both are open', () => {
    const left = { id: 'rockets', col: C - 1, row: R } as const;
    expect(wingSide(left, [CORE, left])).toBe(-1);
    const right = { id: 'rockets', col: C + 1, row: R } as const;
    expect(wingSide(right, [CORE, right])).toBe(1);
    const below = { id: 'rockets', col: C, row: R + 1 } as const;
    const blocker = { id: 'plate', col: C - 1, row: R + 1 } as const;
    expect(wingSide(below, [CORE, below, blocker])).toBe(1);
  });
});
