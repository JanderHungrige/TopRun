import { describe, expect, it } from 'vitest';
import {
  cycleLook, DEFAULT_LOOK, LOOK_PARTS, lookFromKey, lookKey, lookOptions, lookPreset, parseLook, portraitKey, PRESET_LOOKS,
  randomLook, sameLook, type AvatarLook,
} from '../../src/game/avatar-look';
import { AVATAR_IDS } from '../../src/game/profiles';

// Docs 29, 33: the builder's trait pick — parsing and migration of the retired looks, cycling, deterministic random
// picks, keys (= portrait file names) and the nearest available portrait.

const valid = (look: AvatarLook): boolean => LOOK_PARTS.every((part) => (lookOptions(part) as readonly string[]).includes(look[part]));
const ALL: string[] = [];
for (const age of lookOptions('age')) for (const skin of lookOptions('skin')) for (const hair of lookOptions('hair')) for (const length of lookOptions('length')) {
  ALL.push(lookKey({ age, skin, hair, length }));
}

describe('avatar pick', () => {
  it('offers age, skin, hair colour and hair length: 64 portraits', () => {
    expect(LOOK_PARTS).toEqual(['age', 'skin', 'hair', 'length']);
    expect(lookOptions('age')).toEqual(['kid', 'adult']);
    expect(lookOptions('skin')).toEqual(['fair', 'olive', 'brown', 'dark']);
    expect(lookOptions('hair')).toEqual(['black', 'brown', 'blond', 'red']);
    expect(lookOptions('length')).toEqual(['short', 'long']);
    expect(new Set(ALL).size).toBe(64);
  });

  describe('parseLook', () => {
    it('keeps a valid pick and drops extra keys', () => {
      const look: AvatarLook = { age: 'adult', skin: 'dark', hair: 'red', length: 'long' };
      expect(parseLook(JSON.parse(JSON.stringify({ ...look, extra: 1 })))).toEqual(look);
    });

    it('turns anything that is not an object into the default pick', () => {
      for (const raw of [null, undefined, 3, 'pilot1', [], [DEFAULT_LOOK]]) expect(parseLook(raw)).toEqual(DEFAULT_LOOK);
    });

    it('replaces unknown or wrongly typed traits with their default', () => {
      expect(parseLook({ age: 'teen', skin: 'dark', hair: 7, length: 'long' })).toEqual({ ...DEFAULT_LOOK, skin: 'dark', length: 'long' });
    });

    it('migrates a v2 look to the nearest pick: skin bucket, hair family, long styles, a kid', () => {
      const v2 = { hair: 'braids', hairColor: 'auburn', skin: 'deep', eyes: 'green', freckles: 'some', cheeks: 'rosy', glasses: 'clear', accessory: 'scarf', suit: 'khaki', sky: 'night' };
      expect(parseLook(v2)).toEqual({ age: 'kid', skin: 'dark', hair: 'red', length: 'long' });
      expect(parseLook({ ...v2, hair: 'crop', hairColor: 'platinum', skin: 'pale' })).toEqual({ age: 'kid', skin: 'fair', hair: 'blond', length: 'short' });
      expect(parseLook({ ...v2, hair: 'bob', hairColor: 'darkBrown', skin: 'tan' })).toEqual({ age: 'kid', skin: 'olive', hair: 'brown', length: 'long' });
      expect(parseLook({ ...v2, hair: 'mop', hairColor: 'black', skin: 'brown' })).toEqual({ age: 'kid', skin: 'brown', hair: 'black', length: 'short' });
      expect(parseLook({ ...v2, hair: 'ponytail', hairColor: 'blue', skin: 'olive' }).length).toBe('long');
    });

    it('maps every old skin tone and hair colour into the four buckets', () => {
      const skins = ['pale', 'light', 'ruddy', 'tan', 'olive', 'brown', 'deep', 'ebony'].map((skin) => parseLook({ hairColor: 'brown', skin }).skin);
      expect(skins).toEqual(['fair', 'fair', 'olive', 'olive', 'brown', 'brown', 'dark', 'dark']);
      const hairs = ['black', 'darkBrown', 'brown', 'chestnut', 'auburn', 'strawberry', 'ginger', 'golden', 'blond', 'platinum', 'silver', 'blue', 'pink']
        .map((hairColor) => parseLook({ hairColor }).hair);
      expect(hairs).toEqual(['black', 'brown', 'brown', 'brown', 'red', 'red', 'red', 'blond', 'blond', 'blond', 'blond', 'black', 'red']);
      expect(parseLook({ hairColor: 'neon', skin: 'green', hair: 'mohawk' })).toEqual({ age: 'kid', skin: 'fair', hair: 'brown', length: 'short' });
    });
  });

  it('cycles one trait forwards and backwards, wrapping round, and changes nothing else', () => {
    for (const part of LOOK_PARTS) {
      const options = lookOptions(part);
      let look: AvatarLook = { ...DEFAULT_LOOK };
      for (let i = 0; i < options.length; i++) look = cycleLook(look, part, 1);
      expect(look).toEqual(DEFAULT_LOOK);
      const prev = cycleLook(DEFAULT_LOOK, part, -1);
      expect(prev[part]).toBe(options[(options.indexOf(DEFAULT_LOOK[part]) + options.length - 1) % options.length]);
      for (const other of LOOK_PARTS) if (other !== part) expect(prev[other]).toBe(DEFAULT_LOOK[other]);
    }
  });

  it('draws deterministic, valid and varied random picks', () => {
    const picks = Array.from({ length: 300 }, (_, i) => randomLook(i * 31 + 7));
    for (let i = 0; i < 300; i++) expect(randomLook(i * 31 + 7)).toEqual(picks[i]);
    expect(picks.every(valid)).toBe(true);
    expect(new Set(picks.map(lookKey)).size).toBeGreaterThan(55);
  });

  it('names a pick by its portrait file and reads names back', () => {
    const look: AvatarLook = { age: 'adult', skin: 'olive', hair: 'blond', length: 'short' };
    expect(lookKey(look)).toBe('adult-olive-blond-short');
    expect(lookFromKey('adult-olive-blond-short')).toEqual(look);
    for (const bad of ['adult-olive-blond', 'teen-olive-blond-short', 'adult-olive-blond-short-talk', 'pilot1']) expect(lookFromKey(bad)).toBeNull();
    expect(sameLook(look, { ...look })).toBe(true);
  });

  describe('portraitKey', () => {
    const want: AvatarLook = { age: 'adult', skin: 'brown', hair: 'red', length: 'long' };

    it('takes the exact portrait when it exists, and nothing when the set is empty', () => {
      expect(portraitKey(want, ALL)).toBe('adult-brown-red-long');
      expect(portraitKey(want, [])).toBeNull();
      expect(portraitKey(want, ['pilot1', 'adult-brown-red-long-talk'])).toBeNull();
    });

    it('never stands in a different portrait while the set is incomplete', () => {
      expect(portraitKey(want, ['adult-brown-red-short', 'kid-brown-red-long', 'adult-olive-red-long'])).toBeNull();
    });
  });

  it('files the presets under themselves and other picks by hair', () => {
    for (const id of AVATAR_IDS) expect(valid(PRESET_LOOKS[id])).toBe(true);
    expect(lookPreset(PRESET_LOOKS.pilot3)).toBe('pilot3');
    expect(lookPreset({ ...DEFAULT_LOOK, hair: 'blond', length: 'long' })).toBe('pilot2');
    expect(lookPreset({ ...DEFAULT_LOOK, hair: 'black' })).toBe('pilot1');
  });
});
