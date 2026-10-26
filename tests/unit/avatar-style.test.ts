import { describe, expect, it } from 'vitest';
import { lookFromKey } from '../../src/game/avatar-look';
import { AVATAR_IDS } from '../../src/game/profiles';
import { CUSTOM_KEYS, customFrames, fixedFrames } from '../../src/render/portraits/assets';

// Doc 33: the owner's portrait images keep to the contract the renderer relies on — 240 × 288 indexed PNGs with at
// most 64 colours, named after a character, a preset or a builder pick, talk / blink frames only next to a base
// image — and the renderer finds them. Checked on every file in src/assets/portraits/, so new images are covered.

const FILES = import.meta.glob<string>('../../src/assets/portraits/**/*.png', { eager: true, query: '?inline', import: 'default' });
const FIXED_NAMES = ['admiral', 'shooter', 'chief', 'wingman', ...AVATAR_IDS];

/** The bytes of a bundled PNG (Vite inlines it as a base64 data URL here). */
function bytes(dataUrl: string): Uint8Array {
  const bin = atob(dataUrl.slice(dataUrl.indexOf(',') + 1));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

const u32 = (b: Uint8Array, at: number): number => (((b[at] ?? 0) << 24) | ((b[at + 1] ?? 0) << 16) | ((b[at + 2] ?? 0) << 8) | (b[at + 3] ?? 0)) >>> 0;

/** Width, height, bit depth, colour type and palette size of a PNG. */
function header(b: Uint8Array): { w: number; h: number; depth: number; type: number; colours: number } {
  let colours = 0;
  for (let at = 8; at + 8 <= b.length;) {
    const len = u32(b, at);
    const kind = String.fromCharCode(...b.subarray(at + 4, at + 8));
    if (kind === 'PLTE') colours = len / 3;
    if (kind === 'IDAT' || kind === 'IEND') break;
    at += 12 + len;
  }
  return { w: u32(b, 16), h: u32(b, 20), depth: b[24] ?? 0, type: b[25] ?? 0, colours };
}

const name = (path: string): string => path.slice(path.lastIndexOf('/') + 1).replace(/\.png$/, '');
const baseOf = (n: string): string => n.replace(/-(talk|half|blink)$/, '');

describe('portrait images', () => {
  const entries = Object.entries(FILES);

  it('ships the six fixed portraits', () => {
    for (const id of ['admiral', 'shooter', 'chief', ...AVATAR_IDS]) expect(fixedFrames(id)?.base, id).toBeTruthy();
  });

  it('are 240 × 288 indexed PNGs with at most 64 colours', () => {
    expect(entries.length).toBeGreaterThanOrEqual(6);
    for (const [path, url] of entries) {
      const b = bytes(url);
      expect([...b.subarray(0, 8)], path).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
      const h = header(b);
      expect({ w: h.w, h: h.h, type: h.type }, path).toEqual({ w: 240, h: 288, type: 3 });
      expect(h.depth, path).toBeLessThanOrEqual(8);
      expect(h.colours, path).toBeGreaterThan(0);
      expect(h.colours, path).toBeLessThanOrEqual(64);
    }
  });

  it('are named after a character, a preset or a builder pick, with talk / blink frames next to a base image', () => {
    const names = new Set(entries.map(([path]) => `${path.includes('/custom/') ? 'custom/' : ''}${name(path)}`));
    for (const n of names) {
      const custom = n.startsWith('custom/');
      const base = baseOf(n.replace('custom/', ''));
      expect(custom ? lookFromKey(base) !== null : FIXED_NAMES.includes(base), n).toBe(true);
      expect(names.has(`${custom ? 'custom/' : ''}${base}`), `${n} needs its base image`).toBe(true);
    }
  });

  it('wires every talk and blink frame to its character', () => {
    for (const [path] of entries) {
      const n = name(path);
      const base = baseOf(n);
      const frames = path.includes('/custom/') ? customFrames(base) : fixedFrames(base);
      expect(frames, n).not.toBeNull();
      if (n.endsWith('-talk')) expect(frames?.talk, n).toBeTruthy();
      if (n.endsWith('-half')) expect(frames?.half, n).toBeTruthy();
      if (n.endsWith('-blink')) expect(frames?.blink, n).toBeTruthy();
    }
    expect(CUSTOM_KEYS.every((k) => lookFromKey(k) !== null)).toBe(true);
    expect(fixedFrames('admiral')?.blink).toBeUndefined(); // sunglasses: never a blink frame
  });
});
