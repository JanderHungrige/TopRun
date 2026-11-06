import { describe, it, expect } from 'vitest';
import { HELI_FLIGHT, heliVelocity, LONGBOW, longbowTargets } from '../../src/game/heli-flight';
import { specialRules } from '../../src/game/jets';

// Helicopter flight (doc 50): drift toward the stick, the slower map-3 scroll, the Longbow's targets.

describe('Helicopter flight (doc 50)', () => {
  it('eases toward the stick instead of moving at once', () => {
    let v = { x: 0, y: 0 };
    v = heliVelocity(v, { x: 1, y: 0 }, 240, 1 / 60);
    expect(v.x).toBeGreaterThan(0);
    expect(v.x).toBeLessThan(240 * 0.2);
    for (let i = 0; i < 59; i++) v = heliVelocity(v, { x: 1, y: 0 }, 240, 1 / 60);
    expect(v.x).toBeCloseTo(240 * (1 - Math.exp(-HELI_FLIGHT.accel)), 6);
    for (let i = 0; i < 120; i++) v = heliVelocity(v, { x: 0, y: -1 }, 240, 1 / 60);
    expect(Math.abs(v.x)).toBeLessThan(1);
    expect(v.y).toBeLessThan(-235);
    expect(HELI_FLIGHT.scroll).toBeLessThan(1);
  });

  it('locks the nearest ground targets, four at most', () => {
    const at = (x: number, y: number, id: string): { x: number; y: number; id: string } => ({ x, y, id });
    const picks = longbowTargets([at(0, 500, 'far'), at(300, 300, 'b'), at(310, 320, 'a'), at(100, 300, 'c'), at(320, 100, 'd'), at(320, 600, 'e')], { x: 320, y: 340 });
    expect(picks.map((p) => p.id)).toEqual(['a', 'b', 'c', 'd']);
    expect(picks).toHaveLength(LONGBOW.max);
    expect(longbowTargets([], { x: 0, y: 0 })).toEqual([]);
    expect(specialRules('longbow')).toEqual({ invulnerable: false, stealth: false });
  });
});
