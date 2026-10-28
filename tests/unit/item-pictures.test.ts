import { describe, expect, it } from 'vitest';
import { EQUIPMENT_IDS, SECONDARY_IDS } from '../../src/data/types';
import { ITEM_IDS, itemPictureUrl } from '../../src/render/items';

// The hangar's item pictures (doc 02): <id>.png 192 × 192 and <id>-small.png 72 × 40, both RGBA (transparent).

const FILES = import.meta.glob<string>('../../src/assets/items/*.png', { eager: true, query: '?inline', import: 'default' });

function bytes(dataUrl: string): Uint8Array {
  const bin = atob(dataUrl.slice(dataUrl.indexOf(',') + 1));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}
const u32 = (b: Uint8Array, at: number): number => (((b[at] ?? 0) << 24) | ((b[at + 1] ?? 0) << 16) | ((b[at + 2] ?? 0) << 8) | (b[at + 3] ?? 0)) >>> 0;
const name = (path: string): string => path.slice(path.lastIndexOf('/') + 1).replace(/\.png$/, '');

describe('hangar item pictures', () => {
  it('cover every weapon, the cannon, the uranium ammo and every add-on', () => {
    expect([...ITEM_IDS].sort()).toEqual([...SECONDARY_IDS, ...EQUIPMENT_IDS, 'gun', 'ammo'].sort());
  });

  it('come in pairs: a 192 × 192 picture and a 72 × 40 list icon, both with transparency', () => {
    const names = new Set(Object.keys(FILES).map(name));
    for (const [path, url] of Object.entries(FILES)) {
      const n = name(path);
      const small = n.endsWith('-small');
      const id = n.replace(/-small$/, '');
      expect(ITEM_IDS.some((x) => x === id), n).toBe(true);
      expect(names.has(small ? id : `${id}-small`), `${n} needs its pair`).toBe(true);
      const b = bytes(url);
      expect([u32(b, 16), u32(b, 20)], n).toEqual(small ? [72, 40] : [192, 192]);
      expect(b[25], `${n} is RGBA`).toBe(6);
    }
  });

  it('gives a picture only where one exists', () => {
    for (const id of ITEM_IDS) {
      const has = Object.keys(FILES).some((p) => name(p) === id);
      expect(itemPictureUrl(id, false) !== undefined, id).toBe(has);
      expect(itemPictureUrl(id, true) !== undefined, `${id}-small`).toBe(has);
    }
  });
});
