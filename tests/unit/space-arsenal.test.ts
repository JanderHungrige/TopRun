import { describe, it, expect } from 'vitest';
import { GRID, MODULES, type ModuleId } from '../../src/data/ship-modules';
import { SECONDARY_ROLES } from '../../src/data/weapons';
import { kitView } from '../../src/game/kit';
import { derivePlayerStats } from '../../src/game/loadout';
import { defaultSave, parseSave, type SaveData } from '../../src/game/save';
import { canPlace, freshShip, place, shipStats, type ShipKit } from '../../src/game/ship';
import { buyShipMark, canBuyShipMark, markValue, shipMarkPrice } from '../../src/game/ship-shop';

// The space arsenal (doc 57): the torpedo bay, rocket wings on the AIR key, Mk II–V marks for the ship's modules.

const { col: C, row: R } = GRID.core;
const bare = (stock: Partial<Record<ModuleId, number>>, marks: Partial<ShipKit['marks']> = {}): ShipKit =>
  ({ ...freshShip(), modules: [], stock: { ...freshShip().stock, ...stock }, marks: { ...freshShip().marks, ...marks } });
const mapFour = (money: number): SaveData =>
  ({ ...defaultSave(), money, progress: Object.fromEntries(Array.from({ length: 90 }, (_, i) => [`m${String(i + 1).padStart(2, '0')}`, { stars: 1 }])) });

describe('Space arsenal (doc 57)', () => {
  it('fits a torpedo bay with a clear line ahead; it draws one power', () => {
    let s = bare({ torpedo: 2, plate: 1 });
    s = place(s, 'torpedo', C - 1, R);
    expect(canPlace(s, 'plate', C - 1, R - 1)).toEqual({ ok: false, reason: 'invalid' }); // in front of the tube
    const st = shipStats(s);
    expect(st).toMatchObject({ torpedoBays: 1, power: 3, hull: 80 + 8 });
  });

  it('puts the rockets on the AIR key and the torpedoes on GROUND', () => {
    expect(SECONDARY_ROLES.spacerocket).toBe('air');
    expect(SECONDARY_ROLES.torpedo).toBe('ground');
  });

  it('grows every plate, engine and shield with its family mark', () => {
    let s = bare({ plate: 2, engine: 1, shield: 1 }, { plate: 3, engine: 5, shield: 2 });
    s = place(s, 'plate', C - 1, R);
    s = place(s, 'plate', C + 1, R);
    s = place(s, 'engine', C, R + 1);
    s = place(s, 'shield', C - 1, R + 1);
    const st = shipStats(s);
    expect(st.hull).toBe(80 + 2 * 38 + 6 + 6);
    expect(st.thrust).toBe(2 + 6);
    expect(st.shield).toBe(31);
    expect(st.shieldRegen).toBeCloseTo(7.5, 9);
    expect(shipStats({ modules: s.modules }).hull).toBe(80 + 2 * 25 + 6 + 6); // Mk I without marks
  });

  it('arms one station per weapon: ammo and damage from the mark, times the copies', () => {
    let save = mapFour(0);
    let ship = bare({ rockets: 2, torpedo: 1, reactor: 1 }, { rockets: 3, torpedo: 1 });
    ship = place(ship, 'rockets', C - 1, R);
    ship = place(ship, 'rockets', C + 1, R);
    ship = place(ship, 'torpedo', C, R - 1);
    save = { ...save, ship };
    const stats = derivePlayerStats(kitView(save, 'ship'));
    expect(stats.secondaries).toEqual([
      expect.objectContaining({ id: 'spacerocket', ammo: 2 * (6 + 2), mark: 3 }),
      expect.objectContaining({ id: 'torpedo', ammo: 2, mark: 1 }),
    ]);
    expect(stats.secondaries[0]?.weapon.damage).toBe(105);
    expect(stats.secondaries[1]?.weapon.damage).toBe(300);
  });

  it('sells marks II–V at the module price × 1.5 / 4 / 6 / 9 once map 4 is open, even before the module', () => {
    expect(canBuyShipMark({ ...defaultSave(), money: 9e6 }, 'plate')).toEqual({ ok: false, reason: 'locked' });
    let s = mapFour(1_000_000);
    const prices: (number | null)[] = [];
    for (let k = 0; k < 4; k++) {
      prices.push(shipMarkPrice(s, 'plate'));
      s = buyShipMark(s, 'plate');
    }
    expect(prices).toEqual([45000, 120000, 180000, 270000]);
    expect(s.ship.marks.plate).toBe(5);
    expect(s.money).toBe(1_000_000 - 615000);
    expect(shipMarkPrice(s, 'plate')).toBeNull();
    expect(canBuyShipMark(s, 'plate')).toEqual({ ok: false, reason: 'max' });
    expect(shipMarkPrice(s, 'torpedo')).toBe(MODULES.torpedo.price * 1.5);
  });

  it('shows each family value per mark and parses forged marks back into 1–5', () => {
    expect([1, 2, 3, 4, 5].map((m) => markValue('plate', m))).toEqual([25, 31, 38, 44, 50]);
    expect(markValue('engine', 5)).toBe(6);
    expect(markValue('torpedo', 5)).toBe(600);
    const raw = JSON.parse(JSON.stringify({ ...defaultSave(), ship: { modules: [], stock: {}, laserLevel: 1, marks: { plate: 9, shield: -3, rockets: 'x' } } }));
    expect(parseSave(raw)?.ship.marks).toEqual({ plate: 5, engine: 1, shield: 1, rockets: 1, torpedo: 1 });
  });
});
