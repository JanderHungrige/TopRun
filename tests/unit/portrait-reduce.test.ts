import { describe, expect, it } from 'vitest';
import { imagePalette, reduceImage, toPhosphor, type Packed } from '../../src/render/pixel/reduce';

// Doc 33: a portrait shown smaller than its own pixel grid is reduced by area and snapped back onto its own palette
// (still hard-edged pixel art in the owner's colours); the radio feed remaps it onto the green phosphor ramp.

const RED: Packed = 0xd03020;
const BLUE: Packed = 0x2040c0;
const WHITE: Packed = 0xf0f0f0;

/** An RGBA image from packed colours (null = transparent). */
function rgba(w: number, h: number, at: (x: number, y: number) => Packed | null): Uint8ClampedArray {
  const out = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const c = at(x, y);
      if (c === null) continue;
      const i = (y * w + x) * 4;
      out.set([(c >> 16) & 255, (c >> 8) & 255, c & 255, 255], i);
    }
  }
  return out;
}

const colourAt = (d: Uint8ClampedArray, i: number): Packed | null => ((d[i * 4 + 3] ?? 0) === 0 ? null : ((d[i * 4] ?? 0) << 16) | ((d[i * 4 + 1] ?? 0) << 8) | (d[i * 4 + 2] ?? 0));

describe('portrait reduction', () => {
  it('collects the distinct opaque colours of an image', () => {
    const img = rgba(4, 4, (x, y) => (y === 0 ? null : x < 2 ? RED : BLUE));
    expect(imagePalette(img).sort()).toEqual([RED, BLUE].sort());
    expect(imagePalette(rgba(2, 2, () => null))).toEqual([]);
  });

  it('keeps blocks of one colour exact when halving', () => {
    const img = rgba(8, 4, (x) => (x < 4 ? RED : BLUE));
    const out = reduceImage(img, 8, 4, 4, 2, [RED, BLUE]);
    expect(Array.from({ length: 8 }, (_, i) => colourAt(out, i))).toEqual([RED, RED, BLUE, BLUE, RED, RED, BLUE, BLUE]);
  });

  it('only ever outputs colours of the palette, at every size', () => {
    const img = rgba(24, 30, (x, y) => [RED, BLUE, WHITE][(x * 7 + y * 3 + ((x * y) % 5)) % 3] ?? RED);
    const pal = imagePalette(img);
    for (const [w, h] of [[23, 29], [12, 15], [7, 9], [1, 1]] as const) {
      const out = reduceImage(img, 24, 30, w, h, pal);
      for (let i = 0; i < w * h; i++) expect(pal).toContain(colourAt(out, i));
    }
  });

  it('weights by area: the colour covering most of a target pixel wins', () => {
    const img = rgba(3, 1, (x) => (x < 2 ? WHITE : RED));
    expect(colourAt(reduceImage(img, 3, 1, 1, 1, [WHITE, RED]), 0)).toBe(WHITE);
    const img2 = rgba(3, 1, (x) => (x < 1 ? WHITE : RED));
    expect(colourAt(reduceImage(img2, 3, 1, 1, 1, [WHITE, RED]), 0)).toBe(RED);
  });

  it('keeps mostly transparent areas transparent and ignores transparent pixels in the colour', () => {
    const img = rgba(4, 2, (x, y) => (y === 0 && x === 0 ? RED : x >= 2 && (y === 0 || x === 2) ? BLUE : null));
    const out = reduceImage(img, 4, 2, 2, 1, [RED, BLUE, WHITE, 0x101010]);
    expect(colourAt(out, 0)).toBeNull(); // one opaque pixel of four
    expect(colourAt(out, 1)).toBe(BLUE); // three of four opaque: blue, not darkened towards black
  });

  it('maps the radio feed by brightness onto the phosphor ramp and leaves transparency alone', () => {
    const ramp: Packed[] = [0x001000, 0x105010, 0x30a030, 0x90ff90];
    const img = rgba(3, 1, (x) => [0x000000, WHITE, null][x] ?? null);
    toPhosphor(img, ramp);
    expect(colourAt(img, 0)).toBe(ramp[0]);
    expect(colourAt(img, 1)).toBe(ramp[3]);
    expect(colourAt(img, 2)).toBeNull();
  });
});
