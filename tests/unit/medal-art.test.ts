import { describe, expect, it } from 'vitest';
import { MEDAL_IDS, type MedalId } from '../../src/data/medals';
import { MEDAL_H, MEDAL_W, medalBottom, paintMedal, paintRibbonBar } from '../../src/render/medals';
import { stripeAt } from '../../src/render/medals/ribbon';
import { Pix } from '../../src/render/pixel/raster';

// Doc 25: every medal of the catalogue renders at every size the game uses, all 18 look different, and the
// ribbon bars follow the data's stripes.

function medal(id: MedalId, k: number): { p: Pix; metal: Uint8Array } {
  const W = 2 * Math.ceil((MEDAL_W / 2) * k) + 2;
  const H = Math.ceil(MEDAL_H * k) + 3;
  const p = new Pix(W, H, k, W / 2, 1);
  return { p, metal: paintMedal(p, id) };
}

function bar(id: MedalId, w = 36, h = 10): Uint16Array {
  const p = new Pix(w, h);
  paintRibbonBar(p, id);
  return p.data;
}

const same = (a: ArrayLike<number>, b: ArrayLike<number>): boolean => a.length === b.length && Array.from(a).every((v, i) => v === b[i]);
const count = (m: ArrayLike<number>): number => Array.from(m).filter((v) => v !== 0).length;

describe('medal art', () => {
  it('paints every medal with metal at chest, locker and close-up sizes', () => {
    for (const k of [0.125, 0.5, 1, 1.25]) {
      for (const id of MEDAL_IDS) {
        const { p, metal } = medal(id, k);
        expect(count(p.data), `${id} @ ${k}`).toBeGreaterThan(20 * k * k);
        expect(count(metal), `${id} @ ${k}`).toBeGreaterThan(0);
      }
    }
  });

  it('gives all 18 medals a different look, close up and at locker size', () => {
    for (const k of [0.5, 1]) {
      const all = MEDAL_IDS.map((id) => medal(id, k).p.data);
      for (let i = 0; i < all.length; i++) {
        for (let j = i + 1; j < all.length; j++) expect(same(all[i]!, all[j]!), `${MEDAL_IDS[i]} vs ${MEDAL_IDS[j]} @ ${k}`).toBe(false);
      }
    }
  });

  it('keeps each medal inside its frame (room for the outline) and above its bottom mark', () => {
    for (const id of MEDAL_IDS) {
      const { p } = medal(id, 1);
      let lowest = 0;
      for (let i = 0; i < p.data.length; i++) {
        if (!p.data[i]) continue;
        const c = i % p.w;
        lowest = Math.max(lowest, (i - c) / p.w);
        expect(c > 0 && c < p.w - 1, `${id} column ${c}`).toBe(true);
      }
      expect(lowest, id).toBeLessThanOrEqual(1 + medalBottom(id) + 1);
      expect(lowest, id).toBeGreaterThan(medalBottom(id) - 8);
    }
  });

  it('draws ribbon bars from the data stripes: mirrored, all different, still painted when tiny', () => {
    const bars = MEDAL_IDS.map((id) => bar(id));
    for (let i = 0; i < bars.length; i++) for (let j = i + 1; j < bars.length; j++) expect(same(bars[i]!, bars[j]!), `${MEDAL_IDS[i]} vs ${MEDAL_IDS[j]}`).toBe(false);
    const pacific = bar('pacific', 36, 4);
    for (let c = 0; c < 18; c++) expect(pacific[2 * 36 + c], `column ${c}`).toBe(pacific[2 * 36 + 35 - c]);
    expect(count(bar('sorties25', 3, 2))).toBe(6);
  });

  it('walks the stripes from the outer edge in to the centre', () => {
    expect(stripeAt(3, 1)).toBe(0);
    expect(stripeAt(3, 0)).toBe(2);
    expect(stripeAt(3, 0.5)).toBe(1);
    expect(stripeAt(1, 0.3)).toBe(0);
    expect(stripeAt(2, 0.95)).toBe(0);
    expect(stripeAt(2, 0.1)).toBe(1);
  });
});
