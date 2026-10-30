import { describe, it, expect } from 'vitest';
import { ammoLevelDef, AMMO_LEVELS } from '../../src/data/arsenal';
import { EQUIPMENT, map1EquipmentLevel } from '../../src/data/equipment';
import { MISSIONS } from '../../src/data/missions';
import { PLANES } from '../../src/data/planes';
import { EQUIPMENT_IDS, SECONDARY_IDS } from '../../src/data/types';
import { GUN2_PRICES, GUN_LEVELS, SECONDARIES } from '../../src/data/weapons';
import { ammoCap, buyMark, canBuyMark, markPrice, weaponStats } from '../../src/game/arsenal';
import { kitScore } from '../../src/game/challenge';
import { buy, canBuy, priceOf } from '../../src/game/economy';
import { derivePlayerStats } from '../../src/game/loadout';
import { defaultSave, parseSave, type SaveData } from '../../src/game/save';

const rich = (over: Partial<SaveData> = {}): SaveData => ({ ...defaultSave(), money: 5_000_000, ...over });
const mapTwo = (save: SaveData): SaveData =>
  ({ ...save, progress: { ...save.progress, ...Object.fromEntries(MISSIONS.map((m) => [m.id, { stars: 2 }])) } });

describe('Deep arsenal (doc 43)', () => {
  describe('uranium ammo', () => {
    it('sells levels 1–2 on map 1 and levels 3–6 with map 2, one at a time', () => {
      let s = rich();
      expect(ammoCap(s)).toBe(2);
      expect(priceOf(s, { type: 'ammo' })).toBe(18000);
      s = buy(buy(s, { type: 'ammo' }), { type: 'ammo' });
      expect(s.ammoLevel).toBe(2);
      expect(s.money).toBe(5_000_000 - 58000);
      expect(canBuy(s, { type: 'ammo' })).toEqual({ ok: false, reason: 'max-level' });
      s = buy(mapTwo(s), { type: 'ammo' });
      expect(s.ammoLevel).toBe(3);
      expect([4, 5, 6].map((l) => ammoLevelDef(l)?.price)).toEqual([150000, 185000, 225000]);
      for (let i = 0; i < 3; i++) s = buy(s, { type: 'ammo' });
      expect(s.ammoLevel).toBe(6);
      expect(canBuy(s, { type: 'ammo' })).toEqual({ ok: false, reason: 'max-level' });
    });

    it('multiplies gun damage and raises the gun ground factor', () => {
      const plain = derivePlayerStats(rich());
      expect(plain.gunDamageMul).toBe(1);
      expect(plain.gunGround).toBe(0.5);
      const du = derivePlayerStats(rich({ ammoLevel: 2, ownedPlanes: ['f16', 'f14'], selectedPlane: 'f14' }));
      expect(du.gunDamageMul).toBeCloseTo(1.2 * 1.3, 6);
      expect(du.gunGround).toBe(0.8);
      expect(derivePlayerStats(rich({ ammoLevel: 3 })).gunGround).toBe(1);
    });
  });

  describe('weapon marks', () => {
    it('sells Mk II of an owned weapon on map 1 for 1.5 × its price, Mk III–VI with map 2 for 4 / 6 / 9 / 13 ×', () => {
      let s = rich();
      expect(canBuyMark(s, 'aim9')).toEqual({ ok: false, reason: 'not-owned' });
      s = buy(s, { type: 'secondary', id: 'aim9' });
      expect(markPrice(s, 'aim9')).toBe(4500);
      s = buyMark(s, 'aim9');
      expect(s.weaponLevels.aim9).toBe(2);
      expect(canBuyMark(s, 'aim9')).toEqual({ ok: false, reason: 'locked' });
      s = mapTwo(s);
      expect(markPrice(s, 'aim9')).toBe(12000);
      s = buyMark(s, 'aim9');
      expect(s.weaponLevels.aim9).toBe(3);
      const prices: number[] = [];
      for (let m = 4; m <= 6; m++) {
        prices.push(markPrice(s, 'aim9') ?? 0);
        s = buyMark(s, 'aim9');
      }
      expect(prices).toEqual([18000, 27000, 39000]);
      expect(s.weaponLevels.aim9).toBe(6);
      expect(canBuyMark(s, 'aim9')).toEqual({ ok: false, reason: 'max-level' });
    });

    it('keeps the map-2 weapons and their marks locked before map 2', () => {
      const s = rich({ ownedSecondaries: ['aim120'] });
      expect(canBuyMark(s, 'aim120')).toEqual({ ok: false, reason: 'locked' });
      expect(canBuyMark(mapTwo(s), 'aim120')).toEqual({ ok: true });
      expect(canBuyMark({ ...rich({ ownedSecondaries: ['mk82'] }), money: 100 }, 'mk82')).toEqual({ ok: false, reason: 'insufficient-funds' });
    });

    it('gives more damage, ammo and a faster, more agile flight', () => {
      const d = SECONDARIES.aim9;
      expect(weaponStats(d, 1)).toEqual({ damage: 60, ammoPerSlot: 6, turnRate: 3.5, speed: 520, radius: 0 });
      expect(weaponStats(d, 2)).toMatchObject({ damage: 75, ammoPerSlot: 7, turnRate: 3.5, speed: 520 });
      const mk3 = weaponStats(SECONDARIES.mk82, 3);
      expect(mk3).toMatchObject({ damage: 210, ammoPerSlot: 8, radius: 84 });
      expect(weaponStats(SECONDARIES.mk82, 6)).toMatchObject({ damage: 315, ammoPerSlot: 11, radius: 105 });
      expect(weaponStats(d, 6)).toMatchObject({ damage: 135, turnRate: 5.25, speed: 650 });
    });

    it('carries the mark into the mission stats, with twin pods doubling the marked ammo', () => {
      let s = mapTwo(rich({ ownedPlanes: ['f16', 'f35'], selectedPlane: 'f35', ownedSecondaries: ['aim9'], twinSecondaries: ['aim9'] }));
      s = buyMark(buyMark(s, 'aim9'), 'aim9');
      s = { ...s, loadout: { ...s.loadout, f35: ['aim9', null, null, null] } };
      const [slot] = derivePlayerStats(s).secondaries;
      expect(slot).toMatchObject({ id: 'aim9', ammo: 16, twin: true, mark: 3 });
      expect(slot?.weapon.damage).toBe(90);
    });
  });

  describe('equipment levels', () => {
    it('puts armour, engine and flares level 4 and the second ECM, damage control, magnet and radar level on map 1', () => {
      expect(map1EquipmentLevel('armor')).toBe(4);
      expect(map1EquipmentLevel('engine')).toBe(4);
      expect(map1EquipmentLevel('flares')).toBe(4);
      for (const id of ['ecm', 'damageControl', 'magnet', 'radar'] as const) expect(map1EquipmentLevel(id)).toBe(2);
      for (const id of EQUIPMENT_IDS) expect(EQUIPMENT[id].levelText).toHaveLength(EQUIPMENT[id].prices.length);
    });

    it('derives the stronger ECM, two damage-control repairs and the longer magnet and radar', () => {
      const eq = { armor: 7, engine: 5, flares: 7, ecm: 3, damageControl: 3, magnet: 2, radar: 2 };
      const st = derivePlayerStats(rich({ equipment: eq }));
      expect(st.maxHull).toBe(250);
      expect(st.speed).toBe(Math.round(330 * 1.36));
      expect(st.flares).toBe(14);
      expect(st).toMatchObject({ ecmBullet: 0.55, ecmTurn: 0.5, damageControlRestore: 0.6, damageControlUses: 2, magnetLevel: 2, radarLevel: 2 });
      const none = derivePlayerStats(rich());
      expect(none).toMatchObject({ ecmBullet: 1, ecmTurn: 1, damageControlUses: 0, magnetLevel: 0, radarLevel: 0 });
    });
  });

  describe('save', () => {
    it('keeps ammo and marks through a round trip and drops marks of weapons not owned', () => {
      const s = rich({ ammoLevel: 2, ownedSecondaries: ['aim9'], weaponLevels: { ...defaultSave().weaponLevels, aim9: 2, mk82: 3 } });
      const back = parseSave(JSON.parse(JSON.stringify(s)));
      expect(back?.ammoLevel).toBe(2);
      expect(back?.weaponLevels.aim9).toBe(2);
      expect(back?.weaponLevels.mk82).toBe(1);
      const forged = parseSave({ ...JSON.parse(JSON.stringify(s)), ammoLevel: 9, weaponLevels: { aim9: 7 } });
      expect(forged?.ammoLevel).toBe(6);
      expect(forged?.weaponLevels.aim9).toBe(6);
      const old = parseSave({ ...JSON.parse(JSON.stringify(defaultSave())), ammoLevel: undefined, weaponLevels: undefined });
      expect(old?.ammoLevel).toBe(0);
      expect(Object.values(old?.weaponLevels ?? {})).toEqual(SECONDARY_IDS.map(() => 1));
    });

    it('counts ammo levels and marks in the kit score', () => {
      const base = rich({ ownedSecondaries: ['aim9'] });
      expect(kitScore({ ...base, ammoLevel: 2 }) - kitScore(base)).toBe(20);
      expect(kitScore({ ...base, weaponLevels: { ...base.weaponLevels, aim9: 3 } }) - kitScore(base)).toBe(8);
    });
  });

  describe('prices', () => {
    const sum = (xs: readonly number[]): number => xs.reduce((a, b) => a + b, 0);
    const map1 = (): number => {
      const jets = PLANES.f14.price + PLANES.sr71.price;
      const gun = sum(GUN_LEVELS.slice(1, 7).map((g) => g.price));
      const ammo = sum(AMMO_LEVELS.filter((a) => a.campaign === 1).map((a) => a.price));
      const weapons = sum(SECONDARY_IDS.filter((id) => SECONDARIES[id].campaign === 1).map((id) => SECONDARIES[id].price * 2.5));
      const equipment = sum(EQUIPMENT_IDS.map((id) => sum(EQUIPMENT[id].prices.slice(0, map1EquipmentLevel(id)))));
      return jets + gun + ammo + weapons + equipment;
    };

    it('makes the map-1 shop cost about what map 1 pays (≈ 660,000)', () => {
      expect(map1()).toBeGreaterThan(620_000);
      expect(map1()).toBeLessThan(700_000);
    });

    it('rises at the top: every gun level, second-gun level and ammo level costs more than the one before', () => {
      for (let i = 3; i < GUN_LEVELS.length; i++) expect(GUN_LEVELS[i]?.price).toBeGreaterThan(GUN_LEVELS[i - 1]?.price ?? 0);
      for (let i = 2; i < GUN2_PRICES.length; i++) expect(GUN2_PRICES[i]).toBeGreaterThan(GUN2_PRICES[i - 1] ?? 0);
      for (let i = 1; i < AMMO_LEVELS.length; i++) expect(AMMO_LEVELS[i]?.price).toBeGreaterThan(AMMO_LEVELS[i - 1]?.price ?? 0);
      for (const id of EQUIPMENT_IDS) {
        const p = EQUIPMENT[id].prices;
        for (let i = 1; i < p.length; i++) expect(p[i]).toBeGreaterThan(p[i - 1] ?? 0);
      }
    });
  });
});
