import { describe, expect, it } from 'vitest';
import { CAMPAIGN_IDS } from '../../src/data/types';
import { MAP_RECT } from '../../src/scenes/map-render';

// Map pictures (doc 77): every campaign map has its painted terrain on the map panel's art grid (4 logical px per art
// px), an indexed PNG of at most 48 colours.

const FILES = import.meta.glob<string>('../../src/assets/maps/*.png', { eager: true, query: '?inline', import: 'default' });

function bytes(dataUrl: string): Uint8Array {
  const bin = atob(dataUrl.slice(dataUrl.indexOf(',') + 1));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

const u32 = (b: Uint8Array, at: number): number => (((b[at] ?? 0) << 24) | ((b[at + 1] ?? 0) << 16) | ((b[at + 2] ?? 0) << 8) | (b[at + 3] ?? 0)) >>> 0;

function palette(b: Uint8Array): number {
  for (let at = 8; at + 8 <= b.length;) {
    const len = u32(b, at);
    if (String.fromCharCode(...b.subarray(at + 4, at + 8)) === 'PLTE') return len / 3;
    at += 12 + len;
  }
  return 0;
}

describe('Map pictures (doc 77)', () => {
  it('has a painted picture for every map, covering the map panel on its art grid', () => {
    for (const c of CAMPAIGN_IDS) {
      const url = FILES[`../../src/assets/maps/map${c}.png`];
      expect(url, `map${c}`).toBeDefined();
      if (!url) continue;
      const b = bytes(url);
      expect(u32(b, 16) * 4).toBeGreaterThanOrEqual(MAP_RECT.w);
      expect(u32(b, 20) * 4).toBeGreaterThanOrEqual(MAP_RECT.h);
      expect(b[25], 'indexed').toBe(3);
      expect(palette(b)).toBeLessThanOrEqual(48);
    }
  });
});
