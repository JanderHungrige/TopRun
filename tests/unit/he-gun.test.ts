import { describe, it, expect } from 'vitest';
import { HE_LEVELS, MAX_HE_LEVEL } from '../../src/data/he-gun';
import { MISSIONS } from '../../src/data/missions';
import { kitScore } from '../../src/game/challenge';
import { buy, canBuy, priceOf } from '../../src/game/economy';
import { heGun, inBlast } from '../../src/game/he-gun';
import { derivePlayerStats } from '../../src/game/loadout';
import { defaultSave, parseSave, type SaveData } from '../../src/game/save';

// The Bofors 40 mm HE gun (doc 46): an always-on third gun sold once map 2 is open.

const rich = (over: Partial<SaveData> = {}): SaveData => ({ ...defaultSave(), money: 5_000_000, ...over });
const mapTwo = (save: SaveData): SaveData =>
  ({ ...save, progress: { ...save.progress, ...Object.fromEntries(MISSIONS.map((m) => [m.id, { stars: 2 }])) } });

describe('Bofors HE gun (doc 46)', () => {
  it('is locked before map 2, then sells levels 1–10 one at a time at rising prices', () => {
    expect(canBuy(rich(), { type: 'he' })).toEqual({ ok: false, reason: 'locked' });
    let s = mapTwo(rich());
    const prices: number[] = [];
    for (let level = 1; level <= MAX_HE_LEVEL; level++) {
      prices.push(priceOf(s, { type: 'he' }) ?? 0);
      s = buy(s, { type: 'he' });
      expect(s.heLevel).toBe(level);
    }
    expect(prices).toEqual(HE_LEVELS.map((l) => l.price));
    expect(prices.every((p, i) => i === 0 || p > (prices[i - 1] ?? 0))).toBe(true);
    expect(canBuy(s, { type: 'he' })).toEqual({ ok: false, reason: 'max-level' });
  });

  it('fires slowly and hits hard: level 10 is about a fifth of a level-20 gun on one target', () => {
    expect(heGun(0)).toBeNull();
    const top = heGun(10);
    expect(top).toMatchObject({ shotsPerSec: 1.5, damage: 650, radius: 76 });
    expect((top?.damage ?? 0) * (top?.shotsPerSec ?? 0)).toBe(975);
    for (const l of HE_LEVELS) expect(l.shotsPerSec).toBeLessThanOrEqual(1.5);
  });

  it('bursts on everything inside the blast, air and ground alike, and skips the dead', () => {
    const bodies = [
      { x: 100, y: 100, radius: 10, dead: false, layer: 'air' },
      { x: 150, y: 100, radius: 12, dead: false, layer: 'ground' },
      { x: 130, y: 100, radius: 10, dead: true, layer: 'air' },
      { x: 300, y: 100, radius: 10, dead: false, layer: 'air' },
    ];
    expect(inBlast(120, 100, 40, bodies).map((b) => b.x)).toEqual([100, 150]);
  });

  it('goes on every jet, parses safely and counts in the kit score', () => {
    expect(derivePlayerStats(rich({ heLevel: 4 })).heLevel).toBe(4);
    expect(parseSave({ ...JSON.parse(JSON.stringify(defaultSave())), heLevel: 99 })?.heLevel).toBe(10);
    expect(parseSave({ ...JSON.parse(JSON.stringify(defaultSave())), heLevel: 'x' })?.heLevel).toBe(0);
    expect(kitScore(rich({ heLevel: 3 })) - kitScore(rich())).toBe(30);
  });
});
