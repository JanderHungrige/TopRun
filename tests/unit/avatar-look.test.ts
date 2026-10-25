import { describe, expect, it } from 'vitest';
import {
  cycleLook, DEFAULT_LOOK, LOOK_PARTS, lookKey, lookOptions, lookPreset, parseLook, PRESET_LOOKS, randomLook, sameLook,
  type AvatarLook,
} from '../../src/game/avatar-look';
import { AVATAR_IDS } from '../../src/game/profiles';

// Doc 29: the builder's look model — parsing, cycling, deterministic random looks, cache keys.

const valid = (look: AvatarLook): boolean => LOOK_PARTS.every((part) => (lookOptions(part) as readonly string[]).includes(look[part]));

describe('avatar look', () => {
  it('offers the promised choices per part', () => {
    expect(lookOptions('hair')).toHaveLength(10);
    expect(lookOptions('hair')).toEqual(expect.arrayContaining(['bob', 'long', 'mop', 'crop', 'buzz', 'ponytail', 'curly', 'bun', 'sidePart']));
    expect(lookOptions('hairColor').length).toBeGreaterThanOrEqual(12);
    expect(lookOptions('skin')).toHaveLength(8);
    expect(lookOptions('glasses')).toEqual(['none', 'aviators', 'clear']);
    expect(lookOptions('accessory')).toEqual(expect.arrayContaining(['none', 'scarf', 'pendant', 'bandana']));
    expect(lookOptions('suit')).toEqual(expect.arrayContaining(['orange', 'navy', 'sage']));
    expect(lookOptions('sky')).toEqual(expect.arrayContaining(['dawn', 'sunset', 'night']));
    for (const part of LOOK_PARTS) expect(new Set(lookOptions(part)).size).toBe(lookOptions(part).length);
  });

  describe('parseLook', () => {
    it('keeps a valid look', () => {
      const look: AvatarLook = { ...DEFAULT_LOOK, hair: 'curly', hairColor: 'pink', skin: 'ebony', sky: 'night' };
      expect(parseLook(JSON.parse(JSON.stringify(look)))).toEqual(look);
    });

    it('turns anything that is not an object into the default look', () => {
      for (const raw of [null, undefined, 3, 'bob', [], [DEFAULT_LOOK]]) expect(parseLook(raw)).toEqual(DEFAULT_LOOK);
    });

    it('replaces unknown or wrongly typed parts with their default, keeps the rest', () => {
      const raw = { ...PRESET_LOOKS.pilot2, hair: 'mohawk', skin: 7, glasses: null, extra: 'x' };
      const look = parseLook(raw);
      expect(look).toEqual({ ...PRESET_LOOKS.pilot2, hair: DEFAULT_LOOK.hair, skin: DEFAULT_LOOK.skin, glasses: DEFAULT_LOOK.glasses });
      expect('extra' in look).toBe(false);
    });
  });

  describe('cycleLook', () => {
    it('steps one part forwards and backwards, wrapping round', () => {
      const hair = lookOptions('hair');
      const first = { ...DEFAULT_LOOK, hair: hair[0]! };
      expect(cycleLook(first, 'hair', 1).hair).toBe(hair[1]);
      expect(cycleLook(first, 'hair', -1).hair).toBe(hair[hair.length - 1]);
      let look: AvatarLook = first;
      for (let i = 0; i < hair.length; i++) look = cycleLook(look, 'hair', 1);
      expect(look).toEqual(first);
    });

    it('changes only the chosen part', () => {
      for (const part of LOOK_PARTS) {
        const next = cycleLook(DEFAULT_LOOK, part, 1);
        expect(next[part]).not.toBe(DEFAULT_LOOK[part]);
        for (const other of LOOK_PARTS) if (other !== part) expect(next[other]).toBe(DEFAULT_LOOK[other]);
      }
    });
  });

  describe('randomLook', () => {
    it('is deterministic per seed and always valid', () => {
      for (let seed = 0; seed < 200; seed++) {
        const a = randomLook(seed);
        expect(randomLook(seed)).toEqual(a);
        expect(valid(a)).toBe(true);
      }
    });

    it('varies between seeds and keeps fun hair colours rare', () => {
      const looks = Array.from({ length: 400 }, (_, i) => randomLook(i * 31 + 7));
      expect(new Set(looks.map(lookKey)).size).toBeGreaterThan(390);
      const fun = looks.filter((l) => l.hairColor === 'blue' || l.hairColor === 'pink').length;
      expect(fun).toBeGreaterThan(10);
      expect(fun).toBeLessThan(100);
      for (const part of LOOK_PARTS) expect(new Set(looks.map((l) => l[part])).size).toBe(lookOptions(part).length);
    });
  });

  describe('lookKey', () => {
    it('is short, stable and differs for every single-part change', () => {
      expect(lookKey(DEFAULT_LOOK)).toHaveLength(LOOK_PARTS.length);
      expect(lookKey({ ...DEFAULT_LOOK })).toBe(lookKey(DEFAULT_LOOK));
      const keys = new Set([lookKey(DEFAULT_LOOK)]);
      for (const part of LOOK_PARTS) {
        for (const option of lookOptions(part)) {
          if (option === DEFAULT_LOOK[part]) continue;
          const key = lookKey({ ...DEFAULT_LOOK, [part]: option });
          expect(keys.has(key)).toBe(false);
          keys.add(key);
        }
      }
      expect(sameLook(PRESET_LOOKS.pilot1, { ...PRESET_LOOKS.pilot1 })).toBe(true);
      expect(sameLook(PRESET_LOOKS.pilot1, PRESET_LOOKS.pilot2)).toBe(false);
    });
  });

  it('files every preset look under its own preset and other suits under pilot 1', () => {
    for (const id of AVATAR_IDS) {
      expect(valid(PRESET_LOOKS[id])).toBe(true);
      expect(lookPreset(PRESET_LOOKS[id])).toBe(id);
    }
    expect(lookPreset({ ...DEFAULT_LOOK, suit: 'khaki' })).toBe('pilot1');
  });
});
