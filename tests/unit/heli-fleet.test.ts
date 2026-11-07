import { describe, it, expect } from 'vitest';
import { MISSIONS } from '../../src/data/missions';
import { MISSIONS_2 } from '../../src/data/missions-2';
import { PLANES } from '../../src/data/planes';
import { HELI_IDS, JET_IDS } from '../../src/data/types';
import { secondaryAllowedOn, SECONDARIES } from '../../src/data/weapons';
import { buy, canBuy, canMount, selectPlane } from '../../src/game/economy';
import { weaponOnSale } from '../../src/game/firepower';
import { jetOnSale, specialRules } from '../../src/game/jets';
import { fromKitView, kitView } from '../../src/game/kit';
import { derivePlayerStats } from '../../src/game/loadout';
import { defaultSave, type SaveData } from '../../src/game/save';

// The helicopter fleet (doc 51): Tiger, Comanche, Hind and the Stinger in the helicopters' hangar.

const mapThree = (money: number): SaveData =>
  ({ ...defaultSave(), money, progress: Object.fromEntries([...MISSIONS, ...MISSIONS_2].map((m) => [m.id, { stars: 2 }])) });

describe('Helicopter fleet (doc 51)', () => {
  it('has four helicopters with their own E abilities, sold in the helicopters hangar once map 3 is open', () => {
    expect(HELI_IDS).toEqual(['ah64', 'tiger', 'rah66', 'mi24']);
    expect(HELI_IDS.map((id) => PLANES[id].special)).toEqual(['longbow', 'gunpods', 'stealth', 'armour']);
    for (const id of HELI_IDS) expect(PLANES[id]).toMatchObject({ kind: 'heli', campaign: 3 });
    const helis = kitView(mapThree(10_000_000), 'heli');
    for (const id of ['tiger', 'rah66', 'mi24'] as const) {
      expect(jetOnSale(helis, id)).toBe(true);
      expect(jetOnSale(kitView(mapThree(10_000_000), 'jet'), id)).toBe(false);
      expect(jetOnSale(kitView(defaultSave(), 'heli'), id)).toBe(false);
    }
    expect(PLANES.mi24.hull).toBeGreaterThan(Math.max(...HELI_IDS.filter((id) => id !== 'mi24').map((id) => PLANES[id].hull)));
    expect(PLANES.rah66.speed).toBeGreaterThan(Math.max(...HELI_IDS.filter((id) => id !== 'rah66').map((id) => PLANES[id].speed)));
  });

  it('flying tank is untouchable, gun pods and the Longbow are not; the Comanche uses the F-35 stealth', () => {
    expect(specialRules('armour')).toEqual({ invulnerable: true, stealth: false });
    expect(specialRules('gunpods')).toEqual({ invulnerable: false, stealth: false });
    expect(specialRules(PLANES.rah66.special)).toEqual(specialRules(PLANES.f35.special));
  });

  it('buys a helicopter into the shared kit: same gun level and equipment, its own stations', () => {
    const start = mapThree(10_000_000);
    let view = buy(kitView(start, 'heli'), { type: 'gun', heli: true });
    view = buy(view, { type: 'plane', id: 'mi24' });
    view = selectPlane(view, 'mi24');
    const stored = fromKitView(start, view);
    expect(stored.selectedPlane).toBe('f16');
    expect(stored.heli).toMatchObject({ selectedPlane: 'mi24', gunLevel: 2 });
    expect(stored.ownedPlanes).toContain('mi24');
    const stats = derivePlayerStats(kitView(stored, 'heli'));
    expect(stats.plane.id).toBe('mi24');
    expect(stats.gunLevel).toBe(2);
    expect(stored.loadout.mi24).toHaveLength(6);
  });

  it('sells the Stinger to helicopters only, as an air weapon', () => {
    expect(SECONDARIES.stinger).toMatchObject({ role: 'air', hits: 'air', behavior: 'homing', campaign: 3 });
    const helis = kitView(mapThree(10_000_000), 'heli');
    expect(weaponOnSale(helis, 'stinger')).toBe(true);
    expect(weaponOnSale(kitView(mapThree(10_000_000), 'jet'), 'stinger')).toBe(false);
    for (const id of HELI_IDS) expect(secondaryAllowedOn('stinger', id)).toBe(true);
    for (const id of JET_IDS) expect(secondaryAllowedOn('stinger', id)).toBe(false);
    const owned = buy(buy(helis, { type: 'secondary', id: 'stinger' }), { type: 'plane', id: 'mi24' });
    expect(canMount(owned, 'mi24', 'stinger', 5)).toEqual({ ok: true });
    expect(canBuy(owned, { type: 'plane', id: 'mi24' })).toEqual({ ok: false, reason: 'already-owned' });
  });
});
