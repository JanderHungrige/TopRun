import { describe, it, expect } from 'vitest';
import { MISSIONS } from '../../src/data/missions';
import { PLANES } from '../../src/data/planes';
import { PLANE_IDS } from '../../src/data/types';
import { secondaryAllowedOn } from '../../src/data/weapons';
import { applyDamage, GROUND_GUN_FACTOR } from '../../src/game/combat';
import { buy, canBuy, canMount } from '../../src/game/economy';
import { AGE, ageDrain, cannonDamage, jetOnSale, newJetsWaiting, nukeBossDamage, nukePartDamage, specialRules } from '../../src/game/jets';
import { defaultSave, parseSave, type SaveData } from '../../src/game/save';

const NEW = ['a10', 'f35', 'tornado'] as const;
const rich = (money = 1_000_000): SaveData => ({ ...defaultSave(), money });
const mapTwo = (save: SaveData): SaveData =>
  ({ ...save, progress: { ...save.progress, ...Object.fromEntries(MISSIONS.map((m) => [m.id, { stars: 2 }])) } });

describe('New jets (doc 36)', () => {
  it('adds the A-10, F-35 and Tornado as map-2 jets with their specials', () => {
    expect(PLANE_IDS.slice(3)).toEqual([...NEW]);
    expect(NEW.map((id) => PLANES[id].special)).toEqual(['cannon', 'stealth', 'nuke']);
    for (const id of NEW) expect(PLANES[id].campaign).toBe(2);
    for (const id of ['f16', 'f14', 'sr71'] as const) expect(PLANES[id].campaign).toBe(1);
    expect(PLANES.a10.hull).toBeGreaterThan(Math.max(...PLANE_IDS.filter((p) => p !== 'a10').map((p) => PLANES[p].hull)));
  });

  it('sells them only once map 2 is open', () => {
    const before = rich();
    for (const id of NEW) {
      expect(jetOnSale(before, id)).toBe(false);
      expect(canBuy(before, { type: 'plane', id })).toEqual({ ok: false, reason: 'locked' });
    }
    expect(jetOnSale(before, 'f14')).toBe(true);
    const after = mapTwo(rich());
    for (const id of NEW) expect(canBuy(after, { type: 'plane', id })).toEqual({ ok: true });
    expect(canBuy(mapTwo(defaultSave()), { type: 'plane', id: 'f35' })).toEqual({ ok: false, reason: 'insufficient-funds' });
  });

  it('has the crew chief point the new jets out until one is bought', () => {
    expect(newJetsWaiting(rich())).toBe(false);
    expect(newJetsWaiting(mapTwo(rich()))).toBe(true);
    expect(newJetsWaiting(buy(mapTwo(rich()), { type: 'plane', id: 'a10' }))).toBe(false);
  });

  it('buys, mounts and keeps a new jet through a save round trip', () => {
    let s = buy(mapTwo(rich()), { type: 'plane', id: 'tornado' });
    s = buy(s, { type: 'secondary', id: 'mk82' });
    expect(canMount(s, 'tornado', 'mk82', 3)).toEqual({ ok: true });
    expect(canMount(s, 'tornado', 'aim54', 0)).toEqual({ ok: false, reason: 'not-owned' });
    expect(secondaryAllowedOn('aim54', 'a10')).toBe(false);
    const back = parseSave(JSON.parse(JSON.stringify({ ...s, selectedPlane: 'tornado' })));
    expect(back?.ownedPlanes).toContain('tornado');
    expect(back?.selectedPlane).toBe('tornado');
    expect(back?.loadout.tornado).toHaveLength(PLANES.tornado.hardpoints);
    expect(back?.livery.a10).toBe('standard');
  });

  it('makes only the roll and the dash invulnerable, only stealth hidden', () => {
    expect(specialRules('roll')).toEqual({ invulnerable: true, stealth: false });
    expect(specialRules('dash')).toEqual({ invulnerable: true, stealth: false });
    expect(specialRules('stealth')).toEqual({ invulnerable: false, stealth: true });
    for (const s of ['wingman', 'cannon', 'nuke'] as const) expect(specialRules(s)).toEqual({ invulnerable: false, stealth: false });
  });

  it('lets cannon rounds hit ground targets at full damage, unlike the gun', () => {
    expect(cannonDamage(PLANES.a10.gunDamageMul)).toBe(24);
    expect(applyDamage(24, { source: 'cannon', targetLayer: 'ground' })).toBe(24);
    expect(applyDamage(24, { source: 'gun', targetLayer: 'ground' })).toBe(24 * GROUND_GUN_FACTOR);
  });

  it('drains the Tornado slowly and never below the floor', () => {
    const max = PLANES.tornado.hull;
    expect(ageDrain(max, max, 1)).toBeCloseTo(max * (1 - AGE.perSec));
    let hull = max;
    for (let i = 0; i < 140 * 60; i++) hull = ageDrain(hull, max, 1 / 60);
    expect(hull / max).toBeCloseTo(1 - 140 * AGE.perSec, 3); // a full map-2 mission: about a fifth
    for (let i = 0; i < 3600 * 60; i++) hull = ageDrain(hull, max, 1 / 60);
    expect(hull).toBeCloseTo(max * AGE.floor);
    expect(ageDrain(5, max, 1)).toBe(5); // already below the floor (enemy damage): the drain stops
  });

  it('takes a fifth of a boss and half of each part with one nuke', () => {
    expect(nukeBossDamage(27650)).toBe(5530);
    expect(nukePartDamage(320)).toBe(160);
  });
});
