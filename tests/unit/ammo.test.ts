import { describe, it, expect } from 'vitest';
import { BURN_SECONDS } from '../../src/data/arsenal';
import { MISSIONS } from '../../src/data/missions';
import { burnStep, canLoad, ignite, incendiaryCap, loadAmmo, loadedRounds } from '../../src/game/ammo';
import { kitScore } from '../../src/game/challenge';
import { buy, canBuy, priceOf } from '../../src/game/economy';
import { derivePlayerStats } from '../../src/game/loadout';
import { defaultSave, parseSave, type SaveData } from '../../src/game/save';

// Incendiary ammo (doc 45): a second ammo type, one type loaded per sortie, burning planes.

const rich = (over: Partial<SaveData> = {}): SaveData => ({ ...defaultSave(), money: 5_000_000, ...over });
const mapTwo = (save: SaveData): SaveData =>
  ({ ...save, progress: { ...save.progress, ...Object.fromEntries(MISSIONS.map((m) => [m.id, { stars: 2 }])) } });

describe('Incendiary ammo (doc 45)', () => {
  it('sells levels 1–2 on map 1 and 3–6 with map 2, priced like uranium', () => {
    let s = rich();
    expect(incendiaryCap(s)).toBe(2);
    const prices: number[] = [];
    for (let i = 0; i < 2; i++) {
      prices.push(priceOf(s, { type: 'incendiary' }) ?? 0);
      s = buy(s, { type: 'incendiary' });
    }
    expect(canBuy(s, { type: 'incendiary' })).toEqual({ ok: false, reason: 'max-level' });
    s = mapTwo(s);
    for (let i = 0; i < 4; i++) {
      prices.push(priceOf(s, { type: 'incendiary' }) ?? 0);
      s = buy(s, { type: 'incendiary' });
    }
    expect(prices).toEqual([18000, 40000, 120000, 150000, 185000, 225000]);
    expect(s.incendiaryLevel).toBe(6);
    expect(canBuy(s, { type: 'incendiary' })).toEqual({ ok: false, reason: 'max-level' });
  });

  it('loads the first type bought, never switches on a later purchase, and loads on request', () => {
    let s = buy(rich(), { type: 'incendiary' });
    expect(s.ammoType).toBe('incendiary');
    s = buy(s, { type: 'ammo' });
    expect(s.ammoType).toBe('incendiary');
    expect(canLoad(s, 'incendiary')).toBe(false);
    expect(canLoad(s, 'uranium')).toBe(true);
    s = loadAmmo(s, 'uranium');
    expect(s.ammoType).toBe('uranium');
    expect(buy(s, { type: 'incendiary' }).ammoType).toBe('uranium');
    expect(canLoad(rich(), 'incendiary')).toBe(false);
    expect(() => loadAmmo(rich(), 'incendiary')).toThrow();
  });

  it('fires the loaded rounds: uranium bonus or a burn, never both', () => {
    const both = rich({ ammoLevel: 3, incendiaryLevel: 3 });
    expect(loadedRounds({ ...both, ammoType: 'uranium' })).toEqual({ type: 'uranium', damageMul: 1.45, groundFactor: 1, burn: 0 });
    const inc = loadedRounds({ ...both, ammoType: 'incendiary' });
    expect(inc).toMatchObject({ type: 'incendiary', damageMul: 1.45, burn: 0.4 });
    expect(inc.damageMul * inc.groundFactor).toBeCloseTo(0.5, 9); // ground targets: the plain half, no bonus
    expect(loadedRounds(rich({ ammoLevel: 2, ammoType: 'incendiary' }))).toEqual({ type: null, damageMul: 1, groundFactor: 0.5, burn: 0 });
    const stats = derivePlayerStats({ ...both, ammoType: 'incendiary', ownedPlanes: ['f16', 'f14'], selectedPlane: 'f14' });
    expect(stats).toMatchObject({ gunBurn: 0.4, rounds: 'incendiary' });
    expect(stats.gunDamageMul).toBeCloseTo(1.2 * 1.45, 6);
  });

  it('deals a burn evenly over 1.5 s and restarts the clock on every hit', () => {
    let b = ignite({ left: 0, t: 0 }, 30);
    expect(b).toEqual({ left: 30, t: BURN_SECONDS });
    let total = 0;
    for (let i = 0; i < 90; i++) {
      const step = burnStep(b, 1 / 60);
      total += step.damage;
      b = step.burn;
    }
    expect(total).toBeCloseTo(30, 6);
    expect(b).toEqual({ left: 0, t: 0 });
    const half = burnStep(ignite({ left: 0, t: 0 }, 30), 0.75);
    expect(half.damage).toBeCloseTo(15, 6);
    expect(ignite(half.burn, 10)).toEqual({ left: 25, t: BURN_SECONDS });
  });

  it('parses the new fields and counts both ammo types in the kit score', () => {
    const forged = parseSave({ ...JSON.parse(JSON.stringify(defaultSave())), incendiaryLevel: 40, ammoType: 'napalm' });
    expect(forged?.incendiaryLevel).toBe(6);
    expect(forged?.ammoType).toBe('uranium');
    const old = parseSave({ ...JSON.parse(JSON.stringify(defaultSave())), incendiaryLevel: undefined, ammoType: undefined });
    expect(old).toMatchObject({ incendiaryLevel: 0, ammoType: 'uranium' });
    expect(kitScore(rich({ incendiaryLevel: 2 })) - kitScore(rich())).toBe(20);
  });
});
