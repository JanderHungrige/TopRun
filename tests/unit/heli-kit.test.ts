import { describe, it, expect } from 'vitest';
import { HELI_PRICE, heliGunDef } from '../../src/data/heli-kit';
import { MISSIONS } from '../../src/data/missions';
import { MISSIONS_2 } from '../../src/data/missions-2';
import { secondaryAllowedOn } from '../../src/data/weapons';
import { buy, canBuy, canMount, priceOf } from '../../src/game/economy';
import { equipmentCap, gunCap, gunDef, weaponOnSale } from '../../src/game/firepower';
import { jetOnSale } from '../../src/game/jets';
import { fromKitView, kitOf, kitView } from '../../src/game/kit';
import { derivePlayerStats } from '../../src/game/loadout';
import { defaultSave, parseSave, type SaveData } from '../../src/game/save';

// The helicopter kit (doc 49): one wallet, a fresh kit for map 3, the kit view the scenes see.

const mapThree = (save: SaveData): SaveData =>
  ({ ...save, progress: { ...save.progress, ...Object.fromEntries([...MISSIONS, ...MISSIONS_2].map((m) => [m.id, { stars: 2 }])) } });
const rich = (): SaveData => mapThree({ ...defaultSave(), money: 5_000_000, gunLevel: 9, equipment: { ...defaultSave().equipment, armor: 6 } });

describe('Helicopter kit (doc 49)', () => {
  it('maps 1–2 show the jets, map 3 the helicopters', () => {
    expect([kitOf(1), kitOf(2), kitOf(3)]).toEqual(['jet', 'jet', 'heli']);
  });

  it('starts the helicopters from zero with the Apache free, the jets untouched', () => {
    const save = rich();
    const view = kitView(save, 'heli');
    expect(view).toMatchObject({ kit: 'heli', selectedPlane: 'ah64', gunLevel: 1, gun2Level: 0, ammoLevel: 0, heLevel: 0 });
    expect(view.ownedPlanes).toContain('ah64');
    expect(Object.values(view.equipment).every((l) => l === 0)).toBe(true);
    expect(view.money).toBe(save.money);
    expect(kitView(save, 'jet')).toBe(save);
  });

  it('writes a helicopter purchase into the helicopter kit and keeps the jets as they were', () => {
    const save = rich();
    let view = kitView(save, 'heli');
    expect(priceOf(view, { type: 'gun', heli: true })).toBe(2500 * HELI_PRICE);
    view = buy(view, { type: 'gun', heli: true });
    view = buy(view, { type: 'equipment', id: 'armor' });
    const stored = fromKitView(save, view);
    expect(stored).toMatchObject({ kit: 'jet', gunLevel: 9, selectedPlane: 'f16', heli: { gunLevel: 2, selectedPlane: 'ah64' } });
    expect(stored.equipment.armor).toBe(6);
    expect(stored.heli.equipment.armor).toBe(1);
    expect(stored.money).toBe(5_000_000 - 2500 * HELI_PRICE - 3000 * HELI_PRICE);
    expect(kitView(stored, 'heli')).toMatchObject({ gunLevel: 2, equipment: { armor: 1 } });
  });

  it('sells each kit only its own goods, the helicopter weapons once map 3 is open', () => {
    const save = rich();
    const jets = kitView(save, 'jet');
    const helis = kitView(save, 'heli');
    expect(jetOnSale(jets, 'ah64')).toBe(false);
    expect(jetOnSale(helis, 'f14')).toBe(false);
    expect(jetOnSale(helis, 'ah64')).toBe(true);
    expect(weaponOnSale(jets, 'hellfire')).toBe(false);
    expect(weaponOnSale(helis, 'hellfire')).toBe(true);
    expect(weaponOnSale(helis, 'aim9')).toBe(false);
    expect(weaponOnSale(kitView(defaultSave(), 'heli'), 'hydra')).toBe(false);
    for (const type of ['gun2', 'he', 'ammo', 'incendiary'] as const) expect(canBuy(helis, { type })).toEqual({ ok: false, reason: 'locked' });
    expect(gunCap(helis)).toBe(10);
    expect(equipmentCap(helis, 'armor')).toBe(4);
    expect(equipmentCap(jets, 'armor')).toBeGreaterThan(4);
  });

  it('mounts helicopter weapons on helicopters only', () => {
    expect(secondaryAllowedOn('hellfire', 'ah64')).toBe(true);
    expect(secondaryAllowedOn('hellfire', 'f16')).toBe(false);
    expect(secondaryAllowedOn('aim9', 'ah64')).toBe(false);
    const view = buy(kitView(rich(), 'heli'), { type: 'secondary', id: 'hydra' });
    expect(canMount(view, 'ah64', 'hydra', 3)).toEqual({ ok: true });
    expect(canMount(view, 'ah64', 'hydra', 4)).toEqual({ ok: false, reason: 'bad-slot' });
  });

  it('flies the Apache with the chain gun, at full damage on the ground', () => {
    const stats = derivePlayerStats(kitView(rich(), 'heli'));
    expect(stats.plane.id).toBe('ah64');
    expect(stats.gunGround).toBe(1);
    expect(gunDef('ah64', 1)).toBe(heliGunDef(1));
    expect(derivePlayerStats(rich()).gunGround).toBe(0.5);
  });

  it('parses the helicopter kit from storage and keeps each selection in its own kit', () => {
    const raw = JSON.parse(JSON.stringify({ ...rich(), selectedPlane: 'ah64', ownedPlanes: ['f16', 'ah64'], heli: { selectedPlane: 'f14', gunLevel: 99, equipment: { armor: 'x' } } }));
    const parsed = parseSave(raw);
    expect(parsed?.selectedPlane).toBe('f16');
    expect(parsed?.ownedPlanes).toEqual(['f16', 'ah64']);
    expect(parsed?.heli).toMatchObject({ selectedPlane: 'ah64', gunLevel: 10, equipment: { armor: 0 } });
    expect(parseSave({ ...JSON.parse(JSON.stringify(defaultSave())), heli: undefined, kit: 'heli' })).toMatchObject({ kit: 'jet', heli: { gunLevel: 1 } });
  });
});
