import { describe, it, expect } from 'vitest';
import { DOOR_GUN_LEVELS, GATLING_LEVELS, HEDP, HELI_INCENDIARY, ROUNDS_PRICES, TRACER, TURRET_LEVELS } from '../../src/data/heli-arms';
import { HELI_IDS, SECONDARY_IDS } from '../../src/data/types';
import { MISSIONS } from '../../src/data/missions';
import { MISSIONS_2 } from '../../src/data/missions-2';
import { SECONDARIES, secondaryAllowedOn } from '../../src/data/weapons';
import { kitScore } from '../../src/game/challenge';
import { buy, canBuy, priceOf } from '../../src/game/economy';
import { weaponOnSale } from '../../src/game/firepower';
import { freshHeliArms, heliArmsStats, parseHeliArms } from '../../src/game/heli-arms';
import { canLoadGear, loadGear } from '../../src/game/gear';
import { kitView } from '../../src/game/kit';
import { derivePlayerStats } from '../../src/game/loadout';
import { defaultSave, parseSave, type SaveData } from '../../src/game/save';

// The helicopters' new goods (doc 99): on sale, prices, buying, loading one ammo type, the save, the mission numbers.

const mapThree = (save: SaveData): SaveData =>
  ({ ...save, progress: { ...save.progress, ...Object.fromEntries([...MISSIONS, ...MISSIONS_2].map((m) => [m.id, { stars: 2 }])) } });
const heli = (money = 50_000_000): SaveData => kitView(mapThree({ ...defaultSave(), money }), 'heli');

describe('Heli arsenal — on sale (doc 99)', () => {
  it('sells the gun upgrades and the ammo only in the helicopters\' hangar once map 3 is open', () => {
    const open = heli();
    expect(canBuy(open, { type: 'mod', id: 'gatling' }).ok).toBe(true);
    expect(canBuy(open, { type: 'rounds', id: 'tracer' }).ok).toBe(true);
    const jets = mapThree({ ...defaultSave(), money: 50_000_000 });
    expect(canBuy(jets, { type: 'mod', id: 'gatling' })).toEqual({ ok: false, reason: 'locked' });
    const closed = kitView({ ...defaultSave(), money: 50_000_000 }, 'heli');
    expect(canBuy(closed, { type: 'rounds', id: 'hedp' })).toEqual({ ok: false, reason: 'locked' });
  });

  it('adds the pulse laser, sonic cannon and drone swarm as helicopter station weapons', () => {
    for (const id of ['pulselaser', 'sonic', 'drones'] as const) {
      expect(SECONDARY_IDS).toContain(id);
      expect(SECONDARIES[id].campaign).toBe(3);
      expect(SECONDARIES[id].planes).toEqual(HELI_IDS);
      expect(secondaryAllowedOn(id, 'ah64')).toBe(true);
      expect(secondaryAllowedOn(id, 'f16')).toBe(false);
      expect(weaponOnSale(heli(), id)).toBe(true);
    }
    expect([SECONDARIES.pulselaser.role, SECONDARIES.sonic.role, SECONDARIES.drones.role]).toEqual(['air', 'ground', 'ground']);
    expect(SECONDARIES.pulselaser.recharge).toBe(3.5);
    expect(SECONDARIES.sonic.recharge).toBe(4);
    expect(SECONDARIES.drones.recharge).toBeUndefined();
  });
});

describe('Heli arsenal — buying (doc 99)', () => {
  it('climbs the Gatling Drive one level at a time at the listed prices, then stops', () => {
    let s = heli();
    for (const lvl of GATLING_LEVELS) {
      expect(priceOf(s, { type: 'mod', id: 'gatling' })).toBe(lvl.price);
      const before = s.money;
      s = buy(s, { type: 'mod', id: 'gatling' });
      expect(s.heliArms.gatling).toBe(lvl.level);
      expect(before - s.money).toBe(lvl.price);
    }
    expect(priceOf(s, { type: 'mod', id: 'gatling' })).toBeNull();
    expect(canBuy(s, { type: 'mod', id: 'gatling' })).toEqual({ ok: false, reason: 'max-level' });
  });

  it('prices the turret link, the door guns and each ammo type by their tables', () => {
    const s = heli();
    expect(priceOf(s, { type: 'mod', id: 'turret' })).toBe(TURRET_LEVELS[0]?.price);
    expect(priceOf(s, { type: 'mod', id: 'doorGuns' })).toBe(DOOR_GUN_LEVELS[0]?.price);
    expect(ROUNDS_PRICES).toEqual([90000, 200000, 360000]);
    for (const id of ['tracer', 'hedp', 'incendiary'] as const) expect(priceOf(s, { type: 'rounds', id })).toBe(90000);
  });

  it('refuses a purchase the wallet can\'t cover', () => {
    const poor = heli(1000);
    expect(canBuy(poor, { type: 'mod', id: 'turret' })).toEqual({ ok: false, reason: 'insufficient-funds' });
  });

  it('loads the first ammo type bought and never switches on a later purchase', () => {
    let s = buy(heli(), { type: 'rounds', id: 'hedp' });
    expect(s.heliArms.loaded).toBe('hedp');
    s = buy(s, { type: 'rounds', id: 'tracer' });
    expect(s.heliArms).toMatchObject({ hedp: 1, tracer: 1, loaded: 'hedp' });
    expect(canLoadGear(s, 'tracer')).toBe(true);
    expect(canLoadGear(s, 'hedp')).toBe(false);
    expect(canLoadGear(s, 'incendiary')).toBe(false);
    expect(loadGear(s, 'tracer').heliArms.loaded).toBe('tracer');
    expect(() => loadGear(s, 'incendiary')).toThrow();
  });

  it('counts the gear in the helicopters\' kit score only', () => {
    const plain = heli();
    const geared = buy(buy(plain, { type: 'mod', id: 'gatling' }), { type: 'rounds', id: 'tracer' });
    expect(kitScore(geared) - kitScore(plain)).toBe(20);
    const jetView = { ...geared, kit: 'jet' as const };
    expect(kitScore(jetView)).toBe(kitScore({ ...jetView, heliArms: freshHeliArms() }));
  });
});

describe('Heli arsenal — save (doc 99)', () => {
  it('starts with nothing and tracer as the loaded type', () => {
    expect(defaultSave().heliArms).toEqual({ gatling: 0, turret: 0, doorGuns: 0, tracer: 0, hedp: 0, incendiary: 0, loaded: 'tracer' });
  });

  it('clamps forged levels and repairs a broken loaded type', () => {
    expect(parseHeliArms({ gatling: 99, turret: -3, doorGuns: 2.7, tracer: 'x', hedp: 3, incendiary: 1, loaded: 'uranium' }))
      .toEqual({ gatling: 4, turret: 0, doorGuns: 2, tracer: 0, hedp: 3, incendiary: 1, loaded: 'tracer' });
    expect(parseHeliArms(null)).toEqual(freshHeliArms());
    const raw = { ...defaultSave(), heliArms: { gatling: 2, loaded: 'incendiary', incendiary: 2 } };
    expect(parseSave(JSON.parse(JSON.stringify(raw)))?.heliArms).toMatchObject({ gatling: 2, incendiary: 2, loaded: 'incendiary' });
  });
});

describe('Heli arsenal — mission numbers (doc 99)', () => {
  it('gives the gatling, turret and door guns their level\'s numbers', () => {
    const st = heliArmsStats({ ...freshHeliArms(), gatling: 3, turret: 2, doorGuns: 1 });
    expect(st.gatling).toEqual({ mul: 1.45, spinUp: 0.6 });
    expect(st.swivel).toBeCloseTo((14 * Math.PI) / 180, 5);
    expect(st.doorGuns).toEqual({ range: 220, damage: 10 });
    expect(heliArmsStats(freshHeliArms())).toMatchObject({ gatling: null, swivel: 0, doorGuns: null, rounds: null, paint: 0, splash: null, burn: 0, chain: null, pierce: null });
  });

  it('fires the loaded rounds only when that type is owned', () => {
    const tracer = heliArmsStats({ ...freshHeliArms(), tracer: 2, loaded: 'tracer' });
    expect(tracer).toMatchObject({ rounds: 'tracer', paint: TRACER.bonus[1], splash: null, burn: 0 });
    const hedp = heliArmsStats({ ...freshHeliArms(), hedp: 3, loaded: 'hedp' });
    expect(hedp.splash).toEqual({ share: HEDP.share[2], radius: HEDP.radius[2] });
    const inc = heliArmsStats({ ...freshHeliArms(), incendiary: 1, loaded: 'incendiary' });
    expect(inc).toMatchObject({ rounds: 'incendiary', burn: HELI_INCENDIARY.burn[0] });
    expect(heliArmsStats({ ...freshHeliArms(), hedp: 2, loaded: 'tracer' }).rounds).toBeNull();
  });

  it('hands the helicopter its arms and the recharge of its energy weapons per station', () => {
    let s = heli();
    s = buy(s, { type: 'secondary', id: 'pulselaser' });
    s = buy(s, { type: 'rounds', id: 'incendiary' });
    s = { ...s, loadout: { ...s.loadout, ah64: ['pulselaser', 'pulselaser', null, null] } };
    const st = derivePlayerStats(s);
    expect(st.arms?.rounds).toBe('incendiary');
    expect(st.gunBurn).toBe(HELI_INCENDIARY.burn[0]);
    expect(st.burnGround).toBe(true);
    const laser = st.secondaries.find((x) => x.id === 'pulselaser');
    expect(laser?.ammo).toBe(10);
    expect(laser?.recharge).toBeCloseTo(3.5 / 2, 5);
    const jet = derivePlayerStats(mapThree(defaultSave()));
    expect(jet.arms).toBeNull();
    expect(jet.burnGround).toBe(false);
  });
});
