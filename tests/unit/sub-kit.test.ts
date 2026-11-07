import { describe, it, expect } from 'vitest';
import { FLEET } from '../../src/data/fleet';
import { ALL_MISSIONS } from '../../src/data/missions';
import { SUB_PRICE, subGunDef } from '../../src/data/sub-kit';
import { secondaryAllowedOn } from '../../src/data/weapons';
import { markCap } from '../../src/game/arsenal';
import { buy, canBuy, priceOf } from '../../src/game/economy';
import { equipmentCap, gunCap, gunDef, weaponOnSale } from '../../src/game/firepower';
import { jetOnSale } from '../../src/game/jets';
import { fromKitView, kitView, parseFleetKit } from '../../src/game/kit';
import { derivePlayerStats } from '../../src/game/loadout';
import { defaultSave, parseSave, type SaveData } from '../../src/game/save';

// The sub kit (doc 66): a second fleet kit beside the helicopters' — the Type 212 free, the harpoon gun, the MK48
// and the depth mine, the seven equipment items at sub prices.

const mapFour = (save: SaveData): SaveData =>
  ({ ...save, progress: { ...save.progress, ...Object.fromEntries(ALL_MISSIONS.slice(0, 90).map((m) => [m.id, { stars: 2 }])) } });
const rich = (): SaveData => mapFour({ ...defaultSave(), money: 9_000_000, gunLevel: 9 });

describe('Sub kit (doc 66)', () => {
  it('starts the subs from zero with the Type 212 free, the jets and the helicopters untouched', () => {
    const save = rich();
    const view = kitView(save, 'sub');
    expect(view).toMatchObject({ kit: 'sub', selectedPlane: 'u212', gunLevel: 1, gun2Level: 0, ammoLevel: 0 });
    expect(view.ownedPlanes).toContain('u212');
    expect(Object.values(view.equipment).every((l) => l === 0)).toBe(true);
    expect(FLEET.sub).toMatchObject({ campaign: 4, starter: 'u212', price: SUB_PRICE, maxGun: 10 });
  });

  it('writes a sub purchase into the sub kit and keeps the other kits as they were', () => {
    const save = rich();
    let view = kitView(save, 'sub');
    expect(priceOf(view, { type: 'gun', fleet: 'sub' })).toBe(2500 * SUB_PRICE);
    view = buy(view, { type: 'gun', fleet: 'sub' });
    view = buy(view, { type: 'equipment', id: 'armor' });
    const stored = fromKitView(save, view);
    expect(stored).toMatchObject({ kit: 'jet', gunLevel: 9, selectedPlane: 'f16', sub: { gunLevel: 2, selectedPlane: 'u212' } });
    expect(stored.heli).toEqual(save.heli);
    expect(stored.sub.equipment.armor).toBe(1);
    expect(stored.money).toBe(9_000_000 - 2500 * SUB_PRICE - 3000 * SUB_PRICE);
    expect(kitView(stored, 'sub')).toMatchObject({ gunLevel: 2, equipment: { armor: 1 } });
  });

  it('sells the SUB PEN only sub goods, once map 4 is open', () => {
    const save = rich();
    const subs = kitView(save, 'sub');
    const helis = kitView(save, 'heli');
    expect(jetOnSale(subs, 'u212')).toBe(true);
    expect(jetOnSale(subs, 'ah64')).toBe(false);
    expect(jetOnSale(helis, 'u212')).toBe(false);
    expect(weaponOnSale(subs, 'mk48')).toBe(true);
    expect(weaponOnSale(subs, 'depthmine')).toBe(true);
    expect(weaponOnSale(subs, 'hellfire')).toBe(false);
    expect(weaponOnSale(helis, 'mk48')).toBe(false);
    expect(weaponOnSale(kitView(defaultSave(), 'sub'), 'mk48')).toBe(false);
    for (const type of ['gun2', 'he', 'ammo', 'incendiary'] as const) expect(canBuy(subs, { type })).toEqual({ ok: false, reason: 'locked' });
    expect(gunCap(subs)).toBe(10);
    expect(markCap(subs)).toBe(3);
    expect(equipmentCap(subs, 'armor')).toBe(equipmentCap(kitView(defaultSave(), 'jet'), 'armor'));
    expect(secondaryAllowedOn('mk48', 'u212')).toBe(true);
    expect(secondaryAllowedOn('mk48', 'ah64')).toBe(false);
    expect(secondaryAllowedOn('aim9', 'u212')).toBe(false);
  });

  it('fires the harpoon gun, full damage on the seabed', () => {
    expect(gunDef('u212', 4)).toBe(subGunDef(4));
    const view = kitView(rich(), 'sub');
    expect(derivePlayerStats(view).gunGround).toBe(1);
  });

  it('parses the sub kit from storage: missing → fresh, a craft of another kit → the Type 212, levels clamped', () => {
    expect(parseFleetKit('sub', undefined)).toMatchObject({ selectedPlane: 'u212', gunLevel: 1 });
    expect(parseFleetKit('sub', { selectedPlane: 'ah64', gunLevel: 99, equipment: { armor: -3 } })).toMatchObject({
      selectedPlane: 'u212', gunLevel: 10, equipment: { armor: 0 },
    });
    const stored = JSON.parse(JSON.stringify({ ...defaultSave(), sub: { selectedPlane: 'u212', gunLevel: 3 } })) as unknown;
    expect(parseSave(stored)?.sub.gunLevel).toBe(3);
  });
});
