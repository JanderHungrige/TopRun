import { describe, expect, it } from 'vitest';
import { FLEET, isFleet } from '../../src/data/fleet';
import { ALL_MISSIONS } from '../../src/data/missions';
import { PLANES } from '../../src/data/planes';
import { TANK_GUN_LEVELS, TANK_PRICE, tankGunDef, VEHICLE } from '../../src/data/tank-kit';
import { TANK_IDS } from '../../src/data/types';
import { SECONDARIES, secondaryAllowedOn } from '../../src/data/weapons';
import { markCap } from '../../src/game/arsenal';
import { buy, canBuy, priceOf } from '../../src/game/economy';
import { gunCap, gunDef, weaponOnSale } from '../../src/game/firepower';
import { jetOnSale } from '../../src/game/jets';
import { fromKitView, kitOf, kitView, labKit, parseFleetKit } from '../../src/game/kit';
import { derivePlayerStats } from '../../src/game/loadout';
import { defaultSave, parseSave, type SaveData } from '../../src/game/save';

// The tank kit (doc 103): the fourth fleet kit — the Jackal free, the turret cannon, the grenade launcher known from the
// start, the seven equipment items at tank prices, all for money; the weapons and marks come from the steppe lab.

const mapSeven = (save: SaveData): SaveData =>
  ({ ...save, progress: { ...save.progress, ...Object.fromEntries(ALL_MISSIONS.slice(0, 180).map((m) => [m.id, { stars: 2 }])) } });
const rich = (): SaveData => mapSeven({ ...defaultSave(), money: 20_000_000, gunLevel: 9 });

describe('Tank kit (doc 103)', () => {
  it('starts the tanks from zero with the Jackal free, the other kits untouched', () => {
    const view = kitView(rich(), 'tank');
    expect(view).toMatchObject({ kit: 'tank', selectedPlane: 'jackal', gunLevel: 1, gun2Level: 0 });
    expect(view.ownedPlanes).toContain('jackal');
    expect(FLEET.tank).toMatchObject({ campaign: 7, starter: 'jackal', price: TANK_PRICE, maxGun: 10, gunPicture: 'turretgun' });
    expect(isFleet('tank')).toBe(true);
    expect(kitOf(7)).toBe('tank');
    expect(labKit('tank')).toBe(true);
    expect(labKit('sub')).toBe(false);
  });

  it('sells the four vehicles for money once map 7 is open, a buggy or a tank each', () => {
    const view = kitView(rich(), 'tank');
    for (const id of TANK_IDS) expect(PLANES[id]).toMatchObject({ kind: 'tank', campaign: 7 });
    expect(TANK_IDS.map((id) => VEHICLE[id])).toEqual(['buggy', 'tank', 'buggy', 'tank']);
    expect(TANK_IDS.filter((id) => jetOnSale(view, id))).toEqual([...TANK_IDS]);
    expect(jetOnSale(kitView({ ...defaultSave(), money: 1e7 }, 'tank'), 'lynx')).toBe(false);
    expect(priceOf(view, { type: 'plane', id: 'lynx' })).toBe(1_600_000);
    const bought = fromKitView(rich(), buy(view, { type: 'plane', id: 'bison' }));
    expect(bought.money).toBe(20_000_000 - 4_200_000);
    expect(bought.ownedPlanes).toContain('bison');
  });

  it('climbs the turret cannon at the jets\' prices × 10 and writes it into the tank kit only', () => {
    const save = rich();
    let view = kitView(save, 'tank');
    expect(gunCap(view)).toBe(10);
    expect(priceOf(view, { type: 'gun', fleet: 'tank' })).toBe(2500 * TANK_PRICE);
    view = buy(view, { type: 'gun', fleet: 'tank' });
    view = buy(view, { type: 'equipment', id: 'armor' });
    const stored = fromKitView(save, view);
    expect(stored).toMatchObject({ kit: 'jet', gunLevel: 9, tank: { gunLevel: 2, selectedPlane: 'jackal' } });
    expect(stored.tank.equipment.armor).toBe(1);
    expect(stored.mech).toEqual(save.mech);
    expect(gunDef('bison', 4)).toEqual(tankGunDef(4));
    expect(TANK_GUN_LEVELS.map((l) => l.damage)).toEqual([15, 16, 18, 19, 21, 23, 27, 30, 32, 35]);
  });

  it('owns the grenade launcher from the start; the other tank weapons and every mark come from the lab', () => {
    const view = kitView(rich(), 'tank');
    expect(view.ownedSecondaries).toContain('grenade');
    expect(SECONDARIES.grenade).toMatchObject({ campaign: 7, role: 'ground', behavior: 'lob', price: 0 });
    expect(weaponOnSale(view, 'grenade')).toBe(true);
    expect(weaponOnSale(view, 'mk48')).toBe(false);
    expect(secondaryAllowedOn('grenade', 'jackal')).toBe(true);
    expect(secondaryAllowedOn('grenade', 'f16')).toBe(false);
    expect(markCap(view)).toBe(1);
    expect(canBuy(view, { type: 'secondary', id: 'grenade' }).ok).toBe(false);
  });

  it('hands a tank its turret: the tanks swivel toward the target, the buggies fire straight', () => {
    const view = kitView(rich(), 'tank');
    expect(derivePlayerStats(view).arms?.swivel).toBe(0);
    const bison = { ...view, ownedPlanes: [...view.ownedPlanes, 'bison' as const], selectedPlane: 'bison' as const };
    expect(derivePlayerStats(bison).arms?.swivel).toBeCloseTo((25 * Math.PI) / 180, 6);
    expect(derivePlayerStats(bison).gunGround).toBe(1);
  });

  it('parses the tank kit from storage: missing → fresh, a non-tank craft → the Jackal, levels clamped', () => {
    expect(defaultSave().tank).toEqual(parseFleetKit('tank', undefined));
    expect(parseFleetKit('tank', { selectedPlane: 'strider', gunLevel: 99, equipment: { armor: 99 } })).toMatchObject({ selectedPlane: 'jackal', gunLevel: 10 });
    const raw = JSON.parse(JSON.stringify({ ...defaultSave(), tank: { selectedPlane: 'viper', gunLevel: 4 } }));
    expect(parseSave(raw)?.tank).toMatchObject({ selectedPlane: 'viper', gunLevel: 4 });
  });
});
