import { describe, expect, it } from 'vitest';
import { TOWER_IDS, TOWER_STARTERS, TOWERS } from '../../src/data/towers';
import { sellValue, towerSpent, towerStats, upgradeCost } from '../../src/game/defence';
import { knownTowers, towerMark } from '../../src/game/steppe-lab';
import { defaultSave } from '../../src/game/save';

// The towers of a defence (doc 106): six kinds, three levels each, the marks of the lab, building, upgrading, selling.

describe('Towers (doc 106)', () => {
  it('has six towers, each stronger or further-reaching by level', () => {
    expect(TOWER_IDS).toEqual(['mgnest', 'flak', 'mortarpit', 'tesla', 'jammer', 'rockets']);
    for (const id of TOWER_IDS) {
      const [a, b, c] = TOWERS[id].levels;
      expect(b.damage + b.range + (b.slow ?? 0) + (b.rockets ?? 0) + (b.jumps ?? 0) - 1 / (b.period || 1)).toBeGreaterThan(a.damage + a.range + (a.slow ?? 0) + (a.rockets ?? 0) + (a.jumps ?? 0) - 1 / (a.period || 1));
      expect(c.damage + c.range + (c.slow ?? 0) + (c.rockets ?? 0) + (c.jumps ?? 0)).toBeGreaterThanOrEqual(b.damage + b.range + (b.slow ?? 0) + (b.rockets ?? 0) + (b.jumps ?? 0));
    }
    expect(TOWERS.flak.reach).toBe('air');
    expect(TOWERS.mortarpit.reach).toBe('ground');
    expect(TOWERS.mortarpit.minRange).toBe(60);
  });

  it('knows the MG nest and the flak tower from the start, at Mk I', () => {
    expect(TOWER_STARTERS).toEqual(['mgnest', 'flak']);
    expect(knownTowers(defaultSave())).toEqual(['mgnest', 'flak']);
    expect(towerMark(defaultSave(), 'mgnest')).toBe(1);
  });

  it('raises damage and reach with the lab\'s marks', () => {
    expect(towerStats('mgnest', 1, 1)).toEqual(TOWERS.mgnest.levels[0]);
    expect(towerStats('mgnest', 2, 2)).toMatchObject({ damage: 12.5, range: 165 * 1.1 });
    expect(towerStats('flak', 3, 3)).toMatchObject({ damage: 82.5, range: 312 });
    expect(towerStats('mgnest', 9, 9)).toMatchObject({ damage: 18 });
  });

  it('costs supply to build and upgrade and gives 60 % back when sold', () => {
    expect(upgradeCost('mgnest', 1)).toBe(50);
    expect(upgradeCost('mgnest', 2)).toBe(80);
    expect(upgradeCost('mgnest', 3)).toBeNull();
    expect(towerSpent('rockets', 3)).toBe(360);
    expect(sellValue('mgnest', 2)).toBe(66);
  });
});
