import { describe, it, expect } from 'vitest';
import { ALL_MISSIONS } from '../../src/data/missions';
import { MISSIONS_3 } from '../../src/data/missions-3';
import { CANYON, CANYON_MISSIONS, canyonPlan, channel, clampToChannel, hitsWall } from '../../src/game/canyon';

// Canyon runs (doc 52): a third of map 3, a winding gorge whose walls crash the helicopter.

describe('Canyon runs (doc 52)', () => {
  it('come in ten map-3 missions — never the first two, never a boss mission — and nowhere else', () => {
    const planned = ALL_MISSIONS.filter((m) => canyonPlan(m) !== null);
    expect(planned.map((m) => m.id)).toEqual([...CANYON_MISSIONS]);
    expect(planned).toHaveLength(10);
    for (const m of planned) {
      expect(m.campaign).toBe(3);
      expect(m.objective.type).not.toBe('boss');
      expect(m.number).toBeGreaterThan(62);
    }
    const m63 = MISSIONS_3[2];
    if (!m63) throw new Error('missing');
    expect(canyonPlan(m63)).toEqual({ at: Math.round(m63.length * CANYON.at), seconds: 25 });
  });

  it('opens at both ends and winds between the walls in the middle, always inside the playfield', () => {
    const total = 1600;
    expect(channel(0, total)).toEqual({ cx: CANYON.width / 2, half: CANYON.width / 2 });
    expect(channel(total, total).half).toBeCloseTo(CANYON.width / 2, 6);
    for (let d = CANYON.ease; d <= total - CANYON.ease; d += 7) {
      const c = channel(d, total);
      expect(c.half).toBeGreaterThanOrEqual(CANYON.minHalf - 1e-9);
      expect(c.half).toBeLessThanOrEqual(CANYON.maxHalf + 1e-9);
      expect(c.cx - c.half).toBeGreaterThanOrEqual(CANYON.margin - 1e-6);
      expect(c.cx + c.half).toBeLessThanOrEqual(CANYON.width - CANYON.margin + 1e-6);
    }
    const centres = Array.from({ length: 40 }, (_, i) => channel(CANYON.ease + i * 25, total).cx);
    expect(Math.max(...centres) - Math.min(...centres)).toBeGreaterThan(80);
  });

  it('crashes a body that touches a wall and keeps spawns inside the channel', () => {
    const c = { cx: 300, half: 120 };
    expect(hitsWall(300, 17, c)).toBe(false);
    expect(hitsWall(196, 17, c)).toBe(true);
    expect(hitsWall(404, 17, c)).toBe(true);
    expect(hitsWall(403, 17, c)).toBe(false);
    expect(clampToChannel(20, c)).toBe(200);
    expect(clampToChannel(600, c)).toBe(400);
    expect(clampToChannel(330, c)).toBe(330);
  });
});
