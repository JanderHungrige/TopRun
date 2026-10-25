import { describe, expect, it } from 'vitest';
import { fitBox } from '../../src/render/pixel/blit';
import { vgrad } from '../../src/render/pixel/fx';
import { INK, PAL, PALETTE_SIZE, RGB } from '../../src/render/pixel/palette';
import { path } from '../../src/render/pixel/path';
import { outline } from '../../src/render/pixel/post';
import { dominantColors, outlineRgba, snapToPalette } from '../../src/render/pixel/quantize';
import { Pix } from '../../src/render/pixel/raster';

const count = (m: Uint8Array): number => m.reduce((a, v) => a + v, 0);
const ctxAt = (s: number): CanvasRenderingContext2D =>
  ({ getTransform: () => ({ a: s, b: 0, c: 0, d: s, e: 0, f: 0 }) }) as unknown as CanvasRenderingContext2D;

describe('pixel raster', () => {
  it('fills a polygon by pixel centres, with hard edges', () => {
    const p = new Pix(10, 10);
    const m = p.shape(path().rect(1, 1, 3, 2));
    expect(count(m)).toBe(6);
    expect(m[1 * 10 + 1]).toBe(1);
    expect(m[1 * 10 + 4]).toBe(0);
  });

  it('does not flood the buffer when a polygon lies off its left edge', () => {
    const p = new Pix(100, 120, 1, 50, 0);
    const m = p.shape(path().move(0, 46).line(-199, 26).line(-188, -22.6).close());
    let below = 0;
    for (let r = 47; r < 120; r++) for (let c = 0; c < 100; c++) below += m[r * 100 + c] ?? 0;
    expect(below).toBe(0);
    expect(count(m)).toBeLessThan(100 * 46);
  });

  it('keeps shapes mirror-symmetric about frame x = 0', () => {
    for (const ox of [50, 37.5]) {
      const p = new Pix(Math.ceil(ox * 2), 60, 0.83, ox, 0);
      const m = p.shape(path().move(0, 5).cubic(18, 5, 22, 30, 12, 50).line(-12, 50).cubic(-22, 30, -18, 5, 0, 5).close());
      for (let r = 0; r < 60; r++) for (let c = 0; c < p.w; c++) expect(m[r * p.w + c]).toBe(m[r * p.w + p.mirror(c)] ?? 0);
    }
  });

  it('never loses a tiny oval and draws thin strokes as connected pixel lines', () => {
    const p = new Pix(20, 20, 0.4, 10, 10);
    expect(count(p.oval(0, 0, 0.3, 0.3))).toBe(1);
    const line = p.thick([-20, -10, 20, 10], 0.2);
    expect(count(line)).toBeGreaterThanOrEqual(17);
  });

  it('finds seams only where a shape overlaps earlier paint', () => {
    const p = new Pix(10, 10);
    p.paint(p.shape(path().rect(0, 0, 5, 10)), 7);
    const m = p.shape(path().rect(3, 3, 4, 4));
    const seam = p.seam(m);
    expect(seam[4 * 10 + 3]).toBe(1);
    expect(seam[4 * 10 + 6]).toBe(0);
  });
});

describe('pixel palette and post-processing', () => {
  it('has more than 256 colours, unique ramps and an ink per ramp', () => {
    expect(PALETTE_SIZE).toBeGreaterThan(256);
    expect(RGB.length).toBe(PALETTE_SIZE);
    const all = Object.values(PAL).flat();
    expect(new Set(all).size).toBe(all.length);
    for (const ramp of Object.values(PAL)) for (const i of ramp.slice(1)) expect(INK[i]).toBe(ramp[0]);
  });

  it('outlines the silhouette in the neighbour ramp ink and leaves the bottom row open', () => {
    const p = new Pix(6, 6);
    const skin = PAL.skinPale[3] ?? 0;
    p.paint(p.shape(path().rect(2, 2, 2, 4)), skin);
    outline(p);
    expect(p.get(1, 2)).toBe(PAL.skinPale[0]);
    expect(p.get(2, 1)).toBe(PAL.skinPale[0]);
    expect(p.get(1, 4)).toBe(PAL.skinPale[0]);
    expect(p.get(1, 5)).toBe(0);
    expect(p.get(0, 0)).toBe(0);
  });

  it('draws gradients as flat bands with dithered seams, only from the given colours', () => {
    const p = new Pix(8, 40);
    const cols = [PAL.sky[2] ?? 0, PAL.sky[4] ?? 0, PAL.sky[6] ?? 0];
    vgrad(p, cols, 0, 40);
    expect(new Set(p.data)).toEqual(new Set(cols));
    expect(p.get(0, 0)).toBe(cols[0]);
    expect(p.get(5, 39)).toBe(cols[2]);
    expect(new Set(Array.from({ length: 8 }, (_, c) => p.get(c, 5))).size).toBe(1);
  });
});

describe('vector capture clean-up', () => {
  const img = (px: readonly (readonly [number, number, number, number])[]): Uint8ClampedArray => Uint8ClampedArray.from(px.flat());

  it('keeps the dominant flat colours and snaps blends and hard alpha', () => {
    const red = [200, 40, 40, 255] as const;
    const blue = [40, 40, 200, 255] as const;
    const data = img([red, red, red, red, blue, blue, blue, [120, 40, 120, 255], [200, 40, 40, 60]]);
    const pal = dominantColors(data, 2);
    expect(pal).toHaveLength(2);
    snapToPalette(data, pal);
    expect([data[28], data[29], data[30]]).not.toEqual([120, 40, 120]);
    expect(data[35]).toBe(0);
  });

  it('outlines a captured silhouette with a darkened neighbour colour', () => {
    const data = img([[0, 0, 0, 0], [240, 200, 160, 255], [0, 0, 0, 0]]);
    outlineRgba(data, 3, 1);
    expect(data[3]).toBe(255);
    expect(data[0] ?? 0).toBeLessThan(100);
    expect(data[11]).toBe(255);
  });
});

describe('art grid fitting', () => {
  it('uses whole device pixels per art pixel and keeps the art near the preferred size', () => {
    for (const s of [1, 1.25, 2, 2.25, 3]) {
      for (const box of [{ w: 250, h: 300 }, { w: 112, h: 136 }, { w: 66, h: 80 }]) {
        const f = fitBox(ctxAt(s), { x: 0, y: 0, ...box }, 100, 120, (fs) => (fs >= 1.5 ? 1 : fs >= 0.9 ? 0.7 : 0.5));
        expect(Number.isInteger(f.D)).toBe(true);
        expect(f.L * s).toBeCloseTo(f.D, 6);
        expect(f.W % 2).toBe(0);
        expect(f.k).toBeLessThanOrEqual(1.125);
        expect(f.W * f.L).toBeGreaterThanOrEqual(box.w - 1e-6);
        expect(Math.abs(120 * f.k * f.L - Math.min(box.w / 100, box.h / 120) * 120)).toBeLessThan(0.04 * box.h);
      }
    }
  });
});
