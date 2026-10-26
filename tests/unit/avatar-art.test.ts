import { describe, expect, it } from 'vitest';
import { DEFAULT_LOOK, lookKey, nearestLookKey, PRESET_LOOKS, type AvatarLook } from '../../src/game/avatar-look';
import { AVATAR_IDS } from '../../src/game/profiles';
import { AVATAR_COLORS, avatarFrames, pilotAccent, pilotFace } from '../../src/render/avatars';
import { faceOf, playerPerson, restyle } from '../../src/render/avatars/person';
import { CUSTOM_KEYS, customFrames, fixedFrames } from '../../src/render/portraits/assets';

// Docs 29, 33: a pilot's portrait is the preset image or the generated portrait nearest the builder pick; the
// full-body scenes derive the people-kit figure from the same pick and keep it as a stable object.

const look: AvatarLook = { age: 'adult', skin: 'dark', hair: 'black', length: 'short' };

describe('pilot portraits', () => {
  it('draws the presets from their own images', () => {
    for (const id of AVATAR_IDS) expect(avatarFrames(id)).toEqual(fixedFrames(id));
    expect(avatarFrames('pilot2')?.base).toBeTruthy();
  });

  it('draws a builder pick from the nearest generated portrait, or none while the set is missing', () => {
    const key = nearestLookKey(look, CUSTOM_KEYS);
    expect(avatarFrames(look)).toEqual(key === null ? null : customFrames(key));
    if (CUSTOM_KEYS.includes(lookKey(look))) expect(key).toBe(lookKey(look));
  });

  it('picks the face of a profile and a UI accent for it', () => {
    expect(pilotFace({ avatar: 'pilot3', save: { look: null } })).toBe('pilot3');
    expect(pilotFace({ avatar: 'pilot3', save: { look } })).toBe(look);
    expect(pilotAccent('pilot2')).toBe(AVATAR_COLORS.pilot2);
    expect(pilotAccent(look)).toMatch(/^#[0-9a-f]{6}$/);
    expect(pilotAccent(look)).not.toBe(pilotAccent({ ...look, hair: 'blond' }));
  });
});

describe('full-body player', () => {
  it('keeps the presets and follows a pick: skin, hair colour and a kit hair style', () => {
    for (const id of AVATAR_IDS) expect(playerPerson(id)).toBe(playerPerson(id));
    const a = playerPerson(look);
    expect(playerPerson({ ...look })).toBe(a); // stable object = the kit's cache key
    expect(a.hair.style).toBe('crew');
    expect(playerPerson({ ...look, age: 'kid' }).hair.style).toBe('messy');
    expect(playerPerson({ ...look, length: 'long' }).hair.style).toBe('long');
    expect(playerPerson({ ...look, skin: 'fair' }).skin.base).not.toBe(a.skin.base);
    expect(playerPerson({ ...look, hair: 'red' }).hair.base).not.toBe(a.hair.base);
    expect(playerPerson(PRESET_LOOKS.pilot1)).not.toBe(playerPerson('pilot1'));
  });

  it('restyles a figure once per base and tag', () => {
    const a = playerPerson(DEFAULT_LOOK);
    const beach = (b: typeof a): typeof a => ({ ...b, legs: 'shorts' });
    expect(restyle(a, 'test', beach)).toBe(restyle(a, 'test', beach));
    expect(restyle(a, 'test', beach).legs).toBe('shorts');
  });

  it('uses the active pilot, or pilot 1 before anyone is chosen', () => {
    expect(faceOf(null)).toBe('pilot1');
    expect(faceOf({ avatar: 'pilot2', save: { look: null } })).toBe('pilot2');
    expect(faceOf({ avatar: 'pilot2', save: { look } })).toBe(look);
  });
});
