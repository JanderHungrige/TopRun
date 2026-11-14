import { describe, expect, it } from 'vitest';
import { ALL_MISSIONS } from '../../src/data/missions';
import { AUTOLOADER_LEVELS, COAX_LEVELS, TANK_ROUNDS_PRICES } from '../../src/data/tank-arms';
import { SECONDARIES } from '../../src/data/weapons';
import { kitScore } from '../../src/game/challenge';
import { buy, canBuy, priceOf } from '../../src/game/economy';
import { canLoadGear, gearKit, loadGear } from '../../src/game/gear';
import { kitView } from '../../src/game/kit';
import { derivePlayerStats } from '../../src/game/loadout';
import { defaultSave, parseSave, type SaveData } from '../../src/game/save';
import { freshTankArms, parseTankArms, TANK_SWIVEL, tankArmsStats } from '../../src/game/tank-arms';

// The tanks' arsenal (doc 108): the turret cannon's upgrades and ammo for money, the lab's weapons.

const through = (n: number): SaveData['progress'] =>
  Object.fromEntries(ALL_MISSIONS.filter((m) => m.campaign <= n).map((m) => [m.id, { stars: 2 }]));
const tanks = (money = 50_000_000): SaveData => kitView({ ...defaultSave(), money, progress: through(6) }, 'tank');

describe('Tank arsenal (doc 108)', () => {
  it('sells the cannon\'s upgrades and ammo only in the MOTOR POOL once map 7 is open', () => {
    expect(canBuy(tanks(), { type: 'mod', id: 'autoloader' }).ok).toBe(true);
    expect(canBuy(tanks(), { type: 'rounds', id: 'thermite' }).ok).toBe(true);
    const subs = kitView({ ...defaultSave(), money: 50_000_000, progress: through(6) }, 'sub');
    expect(canBuy(subs, { type: 'mod', id: 'autoloader' })).toEqual({ ok: false, reason: 'locked' });
    const closed = kitView({ ...defaultSave(), money: 50_000_000, progress: through(5) }, 'tank');
    expect(canBuy(closed, { type: 'rounds', id: 'apds' })).toEqual({ ok: false, reason: 'locked' });
    expect([gearKit('autoloader'), gearKit('hefrag'), gearKit('loader')]).toEqual(['tank', 'tank', 'sub']);
  });

  it('climbs the Autoloader at its prices, then stops; the ammo at the steppe\'s prices', () => {
    let s = tanks();
    for (const lvl of AUTOLOADER_LEVELS) {
      expect(priceOf(s, { type: 'mod', id: 'autoloader' })).toBe(lvl.price);
      s = buy(s, { type: 'mod', id: 'autoloader' });
    }
    expect(s.tankArms.autoloader).toBe(3);
    expect(canBuy(s, { type: 'mod', id: 'autoloader' })).toEqual({ ok: false, reason: 'max-level' });
    expect(priceOf(tanks(), { type: 'rounds', id: 'apds' })).toBe(TANK_ROUNDS_PRICES[0]);
  });

  it('loads the first ammo type bought and another on request, the other fleets untouched', () => {
    let s = buy(tanks(), { type: 'rounds', id: 'thermite' });
    expect(s.tankArms.loaded).toBe('thermite');
    s = buy(s, { type: 'rounds', id: 'apds' });
    expect(s.tankArms.loaded).toBe('thermite');
    expect(canLoadGear(s, 'apds')).toBe(true);
    expect(loadGear(s, 'apds').tankArms.loaded).toBe('apds');
    expect(s.subArms.loaded).toBe('explosive');
  });

  it('gives each upgrade and ammo type its effect; a tank keeps its turret, a buggy gets one with the stabiliser', () => {
    expect(tankArmsStats('jackal').swivel).toBe(0);
    expect(tankArmsStats('bison').swivel).toBeCloseTo(TANK_SWIVEL, 6);
    const arms = { ...freshTankArms(), autoloader: 2, stabiliser: 1, coaxmg: 3, hefrag: 2, loaded: 'hefrag' as const };
    const st = tankArmsStats('jackal', arms);
    expect(st).toMatchObject({ gatling: { mul: 1.3 }, doorGuns: { range: COAX_LEVELS[2]!.range, damage: 14 }, rounds: 'hedp', splash: { share: 0.4, radius: 42 } });
    expect(st.swivel).toBeCloseTo((12 * Math.PI) / 180, 6);
    expect(tankArmsStats('lynx', { ...freshTankArms(), apds: 3, loaded: 'apds' }).pierce).toEqual({ count: 3, speed: 1.2 });
    expect(tankArmsStats('lynx', { ...freshTankArms(), thermite: 1, loaded: 'thermite' })).toMatchObject({ burn: 0.25, rounds: 'incendiary' });
  });

  it('burns ground targets with thermite, and counts the tanks\' gear in the kit score', () => {
    const s = { ...tanks(), tankArms: { ...freshTankArms(), thermite: 1, loaded: 'thermite' as const } };
    expect(derivePlayerStats(s).burnGround).toBe(true);
    expect(derivePlayerStats(tanks()).burnGround).toBe(false);
    expect(kitScore(buy(tanks(), { type: 'mod', id: 'coaxmg' })) - kitScore(tanks())).toBe(10);
  });

  it('adds five lab weapons for the tanks, never on sale', () => {
    for (const id of ['aarocket', 'atgm', 'mines', 'flamer', 'tesla'] as const) {
      expect(SECONDARIES[id]).toMatchObject({ campaign: 7, price: 0 });
      expect(canBuy(tanks(), { type: 'secondary', id }).ok).toBe(false);
    }
    expect([SECONDARIES.mines.behavior, SECONDARIES.flamer.behavior, SECONDARIES.tesla.behavior]).toEqual(['mine', 'flame', 'chain']);
    expect([SECONDARIES.flamer.recharge, SECONDARIES.tesla.recharge]).toEqual([3, 4]);
  });

  it('parses the gear from storage', () => {
    expect(defaultSave().tankArms).toEqual(freshTankArms());
    expect(parseTankArms({ autoloader: 9, apds: -1, loaded: 'tracer' })).toEqual({ ...freshTankArms(), autoloader: 3 });
    const raw = JSON.parse(JSON.stringify({ ...defaultSave(), tankArms: { coaxmg: 2, loaded: 'apds' } }));
    expect(parseSave(raw)?.tankArms).toMatchObject({ coaxmg: 2, loaded: 'apds' });
  });
});
