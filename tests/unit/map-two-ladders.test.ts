import { describe, it, expect } from 'vitest';
import { AMMO_LEVELS, MARKS, MAX_MARK } from '../../src/data/arsenal';
import { EQUIPMENT, map1EquipmentLevel, maxEquipmentLevel } from '../../src/data/equipment';
import { EQUIPMENT_IDS } from '../../src/data/types';
import { GUN2_PRICES, GUN_LEVELS, MAX_GUN_LEVEL } from '../../src/data/weapons';
import { radarContacts, radarRange, scopeJammed } from '../../src/game/cockpit';
import { derivePlayerStats } from '../../src/game/loadout';
import { defaultSave } from '../../src/game/save';

// Wave 3 (doc 43): every ladder gets as many levels again on map 2, at prices that keep rising.

const rising = (xs: readonly number[]): boolean => xs.every((x, i) => i === 0 || x > (xs[i - 1] ?? 0));

describe('Map 2 doubled (doc 43, wave 3)', () => {
  it('doubles every equipment ladder on map 2 and leaves the map-1 caps alone', () => {
    const max = Object.fromEntries(EQUIPMENT_IDS.map((id) => [id, maxEquipmentLevel(id)]));
    expect(max).toEqual({ armor: 14, engine: 10, flares: 14, ecm: 6, damageControl: 6, magnet: 4, radar: 4 });
    const map1 = Object.fromEntries(EQUIPMENT_IDS.map((id) => [id, map1EquipmentLevel(id)]));
    expect(map1).toEqual({ armor: 4, engine: 4, flares: 4, ecm: 2, damageControl: 2, magnet: 2, radar: 2 });
    for (const id of EQUIPMENT_IDS) {
      expect(rising(EQUIPMENT[id].prices), id).toBe(true);
      expect(EQUIPMENT[id].levelText).toHaveLength(EQUIPMENT[id].prices.length);
    }
  });

  it('keeps every price ladder rising: gun 1–20, second gun, uranium, marks', () => {
    expect(GUN_LEVELS.map((g) => g.level)).toEqual(Array.from({ length: MAX_GUN_LEVEL }, (_, i) => i + 1));
    expect(rising(GUN_LEVELS.slice(1).map((g) => g.price))).toBe(true);
    expect(rising(GUN2_PRICES.slice(1))).toBe(true);
    expect(rising(AMMO_LEVELS.map((a) => a.price))).toBe(true);
    expect(rising(AMMO_LEVELS.map((a) => a.damageMul))).toBe(true);
    const marks = Array.from({ length: MAX_MARK }, (_, i) => MARKS[(i + 1) as 1]);
    expect(rising(marks.map((m) => m.priceMul))).toBe(true);
    expect(rising(marks.map((m) => m.damageMul))).toBe(true);
  });

  it('gives the top equipment levels their effects', () => {
    const s = derivePlayerStats({
      ...defaultSave(),
      equipment: { armor: 14, engine: 10, flares: 14, ecm: 6, damageControl: 6, magnet: 4, radar: 4 },
    });
    expect(s.maxHull).toBe(Math.round(s.plane.hull * 4.25));
    expect(s.flares).toBe(28);
    expect(s.ecmBullet).toBe(0.4);
    expect(s.damageControlRestore).toBe(0.8);
    expect(s.damageControlUses).toBe(3);
    expect(s.radarLevel).toBe(4);
  });

  it('lets Early-Warning Radar level 4 see through a jammer, with a longer range from level 3', () => {
    expect(radarRange(3)).toBe(1700);
    expect(radarRange(4)).toBe(2000);
    expect(scopeJammed(true, 3)).toBe(true);
    expect(scopeJammed(true, 4)).toBe(false);
    const input = { player: { x: 320, y: 600 }, boss: null, missiles: [], upcoming: [], jammed: true, enemies: [{ x: 320, y: 300, layer: 'air' as const, dead: false }] };
    expect(radarContacts(input, 3)).toEqual([]);
    expect(radarContacts(input, 4)).toHaveLength(1);
  });
});
