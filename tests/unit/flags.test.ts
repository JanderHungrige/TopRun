import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import { COUNTRY_CODES } from '../../src/data/countries';
import { FLAG_COLS, FLAG_H, FLAG_ORDER, FLAG_W, flagCell } from '../../src/data/flags';

/** Width and height from a PNG's IHDR chunk. */
function pngSize(path: string): { w: number; h: number } {
  const b = readFileSync(new URL(`../../${path}`, import.meta.url));
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
}

describe('Ladder flags (doc 28)', () => {
  it('has a real pixel flag for every country code', () => {
    for (const code of COUNTRY_CODES) expect(flagCell(code), code).not.toBeNull();
    expect(new Set(FLAG_ORDER).size).toBe(FLAG_ORDER.length);
    expect(flagCell('ZZ')).toBeNull();
  });

  it('finds each flag in its cell of the sprite sheet', () => {
    const sheet = pngSize('src/assets/flags/flags.png');
    expect(sheet.w).toBe(FLAG_COLS * FLAG_W);
    expect(sheet.h).toBe(Math.ceil(FLAG_ORDER.length / FLAG_COLS) * FLAG_H);
    expect(flagCell(FLAG_ORDER[0] ?? '')).toEqual({ x: 0, y: 0 });
    expect(flagCell(FLAG_ORDER[FLAG_COLS + 1] ?? '')).toEqual({ x: FLAG_W, y: FLAG_H });
    for (const code of FLAG_ORDER) {
      const c = flagCell(code);
      expect(c && c.x + FLAG_W <= sheet.w && c.y + FLAG_H <= sheet.h, code).toBe(true);
    }
  });
});
