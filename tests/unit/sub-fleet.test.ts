import { describe, it, expect } from 'vitest';
import { ALL_MISSIONS } from '../../src/data/missions';
import { PLANES } from '../../src/data/planes';
import { SUB_IDS } from '../../src/data/types';
import { SECONDARIES, secondaryAllowedOn } from '../../src/data/weapons';
import { buy, canBuy } from '../../src/game/economy';
import { weaponOnSale } from '../../src/game/firepower';
import { jetOnSale, specialRules } from '../../src/game/jets';
import { fromKitView, kitView } from '../../src/game/kit';
import { defaultSave, type SaveData } from '../../src/game/save';

// The sub fleet (doc 69): three more subs in the SUB PEN, each with its own E, and the Shkval rocket fan.

const mapFour = (save: SaveData): SaveData =>
  ({ ...save, progress: { ...save.progress, ...Object.fromEntries(ALL_MISSIONS.slice(0, 90).map((m) => [m.id, { stars: 2 }])) } });

describe('Sub fleet (doc 69)', () => {
  it('has four subs with their own E: sonar, supercavitation (ram), silent running (stealth), double hull (armour)', () => {
    expect(SUB_IDS).toEqual(['u212', 'seawolf', 'virginia', 'akula']);
    expect(SUB_IDS.map((id) => PLANES[id].special)).toEqual(['sonar', 'dash', 'stealth', 'armour']);
    expect(SUB_IDS.every((id) => PLANES[id].kind === 'sub' && PLANES[id].campaign === 4)).toBe(true);
    expect(specialRules('dash').invulnerable).toBe(true);
    expect(specialRules('stealth').stealth).toBe(true);
    expect(specialRules('armour').invulnerable).toBe(true);
    expect(PLANES.akula.hardpoints).toBe(6);
    expect(PLANES.seawolf.speed).toBeGreaterThan(PLANES.virginia.speed);
    expect(PLANES.akula.hull).toBeGreaterThan(PLANES.u212.hull);
  });

  it('sells the subs in the SUB PEN once map 4 is open, and keeps a bought one in the sub kit', () => {
    const save = mapFour({ ...defaultSave(), money: 9_000_000 });
    const subs = kitView(save, 'sub');
    expect(jetOnSale(subs, 'seawolf')).toBe(true);
    expect(jetOnSale(kitView(save, 'heli'), 'seawolf')).toBe(false);
    expect(jetOnSale(kitView(defaultSave(), 'sub'), 'akula')).toBe(false);
    expect(canBuy(subs, { type: 'plane', id: 'akula' })).toEqual({ ok: true });
    const after = fromKitView(save, buy(subs, { type: 'plane', id: 'akula' }));
    expect(after.ownedPlanes).toContain('akula');
    expect(after.money).toBe(9_000_000 - PLANES.akula.price);
  });

  it('adds the Shkval: a sub-only rocket fan on the GROUND key that hits anything', () => {
    expect(SECONDARIES.shkval).toMatchObject({ role: 'ground', behavior: 'fan', hits: 'any', campaign: 4 });
    expect(weaponOnSale(kitView(mapFour(defaultSave()), 'sub'), 'shkval')).toBe(true);
    expect(secondaryAllowedOn('shkval', 'virginia')).toBe(true);
    expect(secondaryAllowedOn('shkval', 'ah64')).toBe(false);
  });
});
