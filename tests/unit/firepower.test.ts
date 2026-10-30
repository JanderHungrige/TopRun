import { describe, it, expect } from 'vitest';
import { maxEquipmentLevel } from '../../src/data/equipment';
import { MISSIONS } from '../../src/data/missions';
import { gunLevelDef, GUN2_PRICES, jetGunDef, SECONDARIES } from '../../src/data/weapons';
import { buy, canBuy } from '../../src/game/economy';
import { buyTwin, canBuyTwin, equipmentCap, gunCap, jetGunLevel, powerCap, weaponOnSale } from '../../src/game/firepower';
import { derivePlayerStats } from '../../src/game/loadout';
import { defaultSave, parseSave, type SaveData } from '../../src/game/save';

const rich = (over: Partial<SaveData> = {}): SaveData => ({ ...defaultSave(), money: 9_000_000, ...over });
const mapTwo = (save: SaveData): SaveData =>
  ({ ...save, progress: { ...save.progress, ...Object.fromEntries(MISSIONS.map((m) => [m.id, { stars: 2 }])) } });
const dps = (level: number): number => { const d = gunLevelDef(level); return d.damage * d.shotsPerSec * d.pattern.length; };
const twinDps = (level: number): number => { const d = jetGunDef(level, true); return d.damage * d.shotsPerSec * d.pattern.length; };

describe('Double firepower (doc 37)', () => {
  it('keeps every map-2 good off the shelf until map 2 is open', () => {
    const s = rich({ gunLevel: 7, equipment: { ...defaultSave().equipment, armor: 4, flares: 4 }, ownedSecondaries: ['aim9'] });
    expect(gunCap(s)).toBe(7);
    expect(canBuy(s, { type: 'gun' })).toEqual({ ok: false, reason: 'max-level' });
    expect(equipmentCap(s, 'armor')).toBe(4);
    expect(canBuy(s, { type: 'equipment', id: 'armor' })).toEqual({ ok: false, reason: 'max-level' });
    expect(weaponOnSale(s, 'aim120')).toBe(false);
    expect(canBuy(s, { type: 'secondary', id: 'jdam' })).toEqual({ ok: false, reason: 'locked' });
    expect(canBuy(s, { type: 'gun2' })).toEqual({ ok: false, reason: 'locked' });
    expect(canBuyTwin(s, 'aim9')).toEqual({ ok: false, reason: 'locked' });
  });

  it('sells gun levels 8–20, more armor and flares, the AIM-120 and the JDAM with map 2 (docs 43, wave 3)', () => {
    let s = mapTwo(rich({ gunLevel: 7, equipment: { ...defaultSave().equipment, armor: 3, flares: 3 } }));
    expect(gunCap(s)).toBe(20);
    for (let level = 8; level <= 20; level++) {
      expect(canBuy(s, { type: 'gun' })).toEqual({ ok: true });
      s = buy(s, { type: 'gun' });
      expect(s.gunLevel).toBe(level);
    }
    expect(canBuy(s, { type: 'gun' })).toEqual({ ok: false, reason: 'max-level' });
    expect(equipmentCap(s, 'armor')).toBe(maxEquipmentLevel('armor'));
    s = buy(buy(s, { type: 'equipment', id: 'armor' }), { type: 'equipment', id: 'armor' });
    expect(s.equipment.armor).toBe(5);
    expect(derivePlayerStats({ ...s, selectedPlane: 'f16' }).maxHull).toBe(200);
    for (const id of ['aim120', 'jdam'] as const) expect(canBuy(s, { type: 'secondary', id })).toEqual({ ok: true });
  });

  it('matches two new-jet guns with one old-jet gun at levels 7/10 and 14/20, and keeps the new jets main gun at 14', () => {
    expect(dps(5)).toBe(720);
    expect(dps(8)).toBe(1500);
    expect(Math.abs(2 * dps(7) - dps(10)) / dps(10)).toBeLessThan(0.01);
    for (let level = 2; level <= 20; level++) expect(dps(level)).toBeGreaterThan(dps(level - 1));
    expect(dps(20) / dps(10)).toBeCloseTo(2.36, 2);
    expect(Math.abs(2 * twinDps(14) - dps(20)) / dps(20)).toBeLessThan(0.01);
    expect(twinDps(7)).toBe(dps(7));
    for (let level = 8; level <= 14; level++) expect(twinDps(level)).toBeGreaterThan(twinDps(level - 1));
    expect(jetGunLevel('a10', 20)).toBe(14);
    expect(jetGunLevel('f14', 20)).toBe(20);
    expect(powerCap('f14')).toBe(20);
    expect(powerCap('tornado')).toBe(14);
  });

  it('levels the second gun on its own and fits it only to the new jets', () => {
    let s = mapTwo(rich({ ownedPlanes: ['f16', 'a10'], selectedPlane: 'a10' }));
    for (let level = 1; level <= 14; level++) {
      const before = s.money;
      s = buy(s, { type: 'gun2' });
      expect(s.gun2Level).toBe(level);
      expect(before - s.money).toBe(GUN2_PRICES[level - 1]);
    }
    expect(canBuy(s, { type: 'gun2' })).toEqual({ ok: false, reason: 'max-level' });
    expect(derivePlayerStats(s).gun2Level).toBe(14);
    expect(derivePlayerStats({ ...s, selectedPlane: 'f16' }).gun2Level).toBe(0);
  });

  it('buys twin pods for an owned weapon and doubles ammo on the new jets only', () => {
    let s = mapTwo(rich({ ownedPlanes: ['f16', 'f14', 'f35'], selectedPlane: 'f35' }));
    expect(canBuyTwin(s, 'aim9')).toEqual({ ok: false, reason: 'not-owned' });
    s = buy(s, { type: 'secondary', id: 'aim9' });
    const money = s.money;
    s = buyTwin(s, 'aim9');
    expect(money - s.money).toBe(SECONDARIES.aim9.price);
    expect(canBuyTwin(s, 'aim9')).toEqual({ ok: false, reason: 'already-owned' });
    s = { ...s, loadout: { ...s.loadout, f35: ['aim9', 'aim9', null, null], f14: ['aim9', null, null, null] } };
    expect(derivePlayerStats(s).secondaries).toMatchObject([{ id: 'aim9', ammo: 24, twin: true }]);
    expect(derivePlayerStats({ ...s, selectedPlane: 'f14' }).secondaries).toMatchObject([{ id: 'aim9', ammo: 6, twin: false }]);
  });

  it('keeps the new fields through a save round trip and drops twins of weapons not owned', () => {
    const s = mapTwo(rich({ gunLevel: 7, gun2Level: 3, ownedSecondaries: ['aim9'], twinSecondaries: ['aim9', 'mk82'] }));
    const back = parseSave(JSON.parse(JSON.stringify(s)));
    expect(back?.gunLevel).toBe(7);
    expect(back?.gun2Level).toBe(3);
    expect(back?.twinSecondaries).toEqual(['aim9']);
    const old = parseSave(JSON.parse(JSON.stringify({ ...defaultSave(), gun2Level: undefined, twinSecondaries: undefined })));
    expect(old?.gun2Level).toBe(0);
    expect(old?.twinSecondaries).toEqual([]);
  });
});
