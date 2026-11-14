import { describe, expect, it } from 'vitest';
import { TANK_IDS } from '../../src/data/types';
import { PLAYER_RADIUS } from '../../src/scenes/mission/player';
import {
  BUGGY_SIDE, BUGGY_TOP, linkOffset, roadWheelXs, sideWheels, TANK_SIDE, TANK_TOP, topExtent, topSilhouetteBox,
} from '../../src/render/tanks/vehicle-build';

// The motor pool's vehicles in detail (doc 114): the geometry the painters share.

describe('Vehicle detail — tracks and wheels (doc 114)', () => {
  it('slides the track links within one pitch, whichever way the vehicle drives', () => {
    for (const d of [0, 1.2, 3.19, 3.2, 47.5, -0.4, -6.5, 1e6]) {
      const o = linkOffset(d, 3.2);
      expect(o, String(d)).toBeGreaterThanOrEqual(0);
      expect(o, String(d)).toBeLessThan(3.2);
    }
    expect(linkOffset(4.2, 3.2)).toBeCloseTo(1, 6);
    expect(linkOffset(-1, 3.2)).toBeCloseTo(2.2, 6);
  });

  it('spaces the road wheels evenly between sprocket and idler, inside the track', () => {
    for (const id of ['lynx', 'bison'] as const) {
      const b = TANK_SIDE[id];
      const xs = roadWheelXs(b);
      expect(xs).toHaveLength(b.wheels);
      const gaps = xs.slice(1).map((x, i) => x - (xs[i] ?? 0));
      for (const g of gaps) expect(g).toBeCloseTo(gaps[0] ?? 0, 6);
      expect(Math.min(...xs) - b.wheelR).toBeGreaterThan(-b.half);
      expect(Math.max(...xs) + b.wheelR).toBeLessThan(b.half);
    }
    expect(TANK_SIDE.bison.wheels).toBeGreaterThan(TANK_SIDE.lynx.wheels);
  });

  it('stands every side-view wheel on the ground', () => {
    for (const id of TANK_IDS) for (const w of sideWheels(id)) expect(w.y + w.r, id).toBeCloseTo(0, 6);
    expect(BUGGY_SIDE.viper.wheelX).toBeGreaterThan(BUGGY_SIDE.jackal.wheelX);
  });
});

describe('Vehicle detail — from above (doc 114)', () => {
  it('keeps everything static inside the silhouette, and the silhouette at least the hit radius wide', () => {
    for (const id of TANK_IDS) {
      const art = topExtent(id);
      const box = topSilhouetteBox(id);
      expect(art.hx, id).toBeLessThanOrEqual(box.hx);
      expect(art.hy, id).toBeLessThanOrEqual(box.hy);
      expect(box.hx, id).toBeGreaterThanOrEqual(PLAYER_RADIUS);
    }
  });

  it('turns the turrets on the centre line, the Bison\'s gun the longest', () => {
    for (const id of ['lynx', 'bison'] as const) expect(TANK_TOP[id].pivot.x).toBe(0);
    expect(TANK_TOP.bison.barrel).toBeGreaterThan(TANK_TOP.lynx.barrel);
    expect(TANK_TOP.bison.track.w).toBeGreaterThan(TANK_TOP.lynx.track.w);
    expect(BUGGY_TOP.viper.len).toBeGreaterThan(BUGGY_TOP.jackal.len);
  });
});
