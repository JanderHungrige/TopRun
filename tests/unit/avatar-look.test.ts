import { describe, expect, it } from 'vitest';
import {
  cycleLook, DEFAULT_LOOK, LOOK_PARTS, lookFromKey, lookKey, lookOptions, lookPreset, parseLook, portraitKey, PRESET_LOOKS,
  randomLook, sameLook, type AvatarLook,
} from '../../src/game/avatar-look';
import { AVATAR_IDS } from '../../src/game/profiles';

// Docs 29, 33: the builder's trait pick — parsing and migration of the retired looks and of looks saved before
// gender was a trait, looks saved before faces existed, cycling, deterministic random picks, keys (= portrait file names)
// and the exact portrait.

const valid = (look: AvatarLook): boolean => LOOK_PARTS.every((part) => (lookOptions(part) as readonly string[]).includes(look[part]));
const ALL: string[] = [];
for (const age of lookOptions('age')) for (const gender of lookOptions('gender')) for (const skin of lookOptions('skin')) {
  for (const hair of lookOptions('hair')) for (const length of lookOptions('length')) {
    for (const face of lookOptions('face')) ALL.push(lookKey({ age, gender, skin, hair, length, face }));
  }
}

describe('avatar pick', () => {
  it('offers age, gender, skin, hair colour, hair length and two faces: 256 portraits', () => {
    expect(LOOK_PARTS).toEqual(['age', 'gender', 'skin', 'hair', 'length', 'face']);
    expect(lookOptions('age')).toEqual(['kid', 'adult']);
    expect(lookOptions('gender')).toEqual(['female', 'male']);
    expect(lookOptions('skin')).toEqual(['fair', 'olive', 'brown', 'dark']);
    expect(lookOptions('hair')).toEqual(['black', 'brown', 'blond', 'red']);
    expect(lookOptions('length')).toEqual(['short', 'long']);
    expect(lookOptions('face')).toEqual(['f1', 'f2']);
    expect(new Set(ALL).size).toBe(256);
  });

  describe('parseLook', () => {
    it('keeps a valid pick and drops extra keys', () => {
      const look: AvatarLook = { age: 'adult', gender: 'male', skin: 'dark', hair: 'red', length: 'long', face: 'f2' };
      expect(parseLook(JSON.parse(JSON.stringify({ ...look, extra: 1 })))).toEqual(look);
    });

    it('turns anything that is not an object into the default pick', () => {
      for (const raw of [null, undefined, 3, 'pilot1', [], [DEFAULT_LOOK]]) expect(parseLook(raw)).toEqual(DEFAULT_LOOK);
    });

    it('replaces unknown or wrongly typed traits with their default', () => {
      expect(parseLook({ age: 'teen', gender: 'female', skin: 'dark', hair: 7, length: 'long', face: 'f9' }))
        .toEqual({ ...DEFAULT_LOOK, gender: 'female', skin: 'dark', length: 'long' });
      expect(parseLook({ age: 'kid', gender: 'robot', skin: 'fair', hair: 'red', length: 'long' }).gender).toBe('female');
    });

    it('keeps the face of a look saved before gender was a trait', () => {
      const old = (age: string, skin: string, hair: string, length: string): string => parseLook({ age, skin, hair, length }).gender;
      expect(old('kid', 'fair', 'red', 'short')).toBe('male');
      expect(old('adult', 'dark', 'black', 'short')).toBe('male');
      expect(old('kid', 'fair', 'black', 'long')).toBe('female');
      expect(old('adult', 'olive', 'blond', 'long')).toBe('female');
      for (const [skin, hair] of [['fair', 'black'], ['fair', 'blond'], ['fair', 'brown'], ['fair', 'red'], ['olive', 'black']]) {
        expect(old('adult', skin ?? '', hair ?? '', 'long'), `${skin} ${hair}`).toBe('male');
      }
    });

    it('gives a look saved before faces existed the first face and keeps every other trait', () => {
      const old = { age: 'adult', gender: 'female', skin: 'brown', hair: 'blond', length: 'long' };
      expect(parseLook(old)).toEqual({ ...old, face: 'f1' });
      expect(parseLook({ ...old, face: 2 }).face).toBe('f1');
      expect(parseLook({ ...old, face: 'f2' }).face).toBe('f2');
    });

    it('migrates a v2 look to the nearest pick: skin bucket, hair family, long styles, a kid', () => {
      const v2 = { hair: 'braids', hairColor: 'auburn', skin: 'deep', eyes: 'green', freckles: 'some', cheeks: 'rosy', glasses: 'clear', accessory: 'scarf', suit: 'khaki', sky: 'night' };
      expect(parseLook(v2)).toEqual({ age: 'kid', gender: 'female', skin: 'dark', hair: 'red', length: 'long', face: 'f1' });
      expect(parseLook({ ...v2, hair: 'crop', hairColor: 'platinum', skin: 'pale' })).toEqual({ age: 'kid', gender: 'male', skin: 'fair', hair: 'blond', length: 'short', face: 'f1' });
      expect(parseLook({ ...v2, hair: 'bob', hairColor: 'darkBrown', skin: 'tan' })).toEqual({ age: 'kid', gender: 'female', skin: 'olive', hair: 'brown', length: 'long', face: 'f1' });
      expect(parseLook({ ...v2, hair: 'mop', hairColor: 'black', skin: 'brown' })).toEqual({ age: 'kid', gender: 'male', skin: 'brown', hair: 'black', length: 'short', face: 'f1' });
      expect(parseLook({ ...v2, hair: 'ponytail', hairColor: 'blue', skin: 'olive' }).length).toBe('long');
    });

    it('maps every old skin tone and hair colour into the four buckets', () => {
      const skins = ['pale', 'light', 'ruddy', 'tan', 'olive', 'brown', 'deep', 'ebony'].map((skin) => parseLook({ hairColor: 'brown', skin }).skin);
      expect(skins).toEqual(['fair', 'fair', 'olive', 'olive', 'brown', 'brown', 'dark', 'dark']);
      const hairs = ['black', 'darkBrown', 'brown', 'chestnut', 'auburn', 'strawberry', 'ginger', 'golden', 'blond', 'platinum', 'silver', 'blue', 'pink']
        .map((hairColor) => parseLook({ hairColor }).hair);
      expect(hairs).toEqual(['black', 'brown', 'brown', 'brown', 'red', 'red', 'red', 'blond', 'blond', 'blond', 'blond', 'black', 'red']);
      expect(parseLook({ hairColor: 'neon', skin: 'green', hair: 'mohawk' })).toEqual({ age: 'kid', gender: 'male', skin: 'fair', hair: 'brown', length: 'short', face: 'f1' });
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
    const picks = Array.from({ length: 600 }, (_, i) => randomLook(i * 31 + 7));
    for (let i = 0; i < 600; i++) expect(randomLook(i * 31 + 7)).toEqual(picks[i]);
    expect(picks.every(valid)).toBe(true);
    expect(new Set(picks.map(lookKey)).size).toBeGreaterThan(200);
  });

  it('names a pick by its portrait file and reads names back', () => {
    const look: AvatarLook = { age: 'adult', gender: 'female', skin: 'olive', hair: 'blond', length: 'short', face: 'f2' };
    expect(lookKey(look)).toBe('adult-female-olive-blond-short-f2');
    expect(lookFromKey('adult-female-olive-blond-short-f2')).toEqual(look);
    const bad = ['adult-female-olive-blond-short', 'adult-female-olive-blond-short-f3', 'adult-olive-blond-short-f1', 'teen-female-olive-blond-short-f1',
      'adult-woman-olive-blond-short-f1', 'adult-female-olive-blond-short-f2-talk', 'pilot1'];
    for (const key of bad) expect(lookFromKey(key), key).toBeNull();
    expect(sameLook(look, { ...look })).toBe(true);
    expect(sameLook(look, { ...look, gender: 'male' })).toBe(false);
    expect(sameLook(look, { ...look, face: 'f1' })).toBe(false);
  });

  describe('portraitKey', () => {
    const want: AvatarLook = { age: 'adult', gender: 'male', skin: 'brown', hair: 'red', length: 'long', face: 'f2' };

    it('takes the exact portrait when it exists, and nothing when the set is empty', () => {
      expect(portraitKey(want, ALL)).toBe('adult-male-brown-red-long-f2');
      expect(portraitKey(want, [])).toBeNull();
      expect(portraitKey(want, ['pilot1', 'adult-male-brown-red-long', 'adult-male-brown-red-long-f2-talk'])).toBeNull();
    });

    it('never stands in a different portrait while the set is incomplete', () => {
      expect(portraitKey(want, ['adult-male-brown-red-long-f1', 'adult-female-brown-red-long-f2', 'adult-male-brown-red-short-f2'])).toBeNull();
    });
  });

  it('files the presets under themselves and other picks by hair', () => {
    for (const id of AVATAR_IDS) expect(valid(PRESET_LOOKS[id])).toBe(true);
    expect(lookPreset(PRESET_LOOKS.pilot3)).toBe('pilot3');
    expect(lookPreset({ ...DEFAULT_LOOK, hair: 'blond', length: 'long' })).toBe('pilot2');
    expect(lookPreset({ ...DEFAULT_LOOK, hair: 'black' })).toBe('pilot1');
  });
});
