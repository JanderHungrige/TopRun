import { describe, expect, it } from 'vitest';
import { DEFAULT_LOOK, LOOK_PARTS, lookOptions, PRESET_LOOKS, randomLook, type AvatarLook } from '../../src/game/avatar-look';
import { avatarArt, pilotAccent } from '../../src/render/avatars';
import { faceOf, playerPerson, restyle } from '../../src/render/avatars/person';
import { SKIES } from '../../src/render/avatars/skies';
import type { BustArt } from '../../src/render/pixel/bust';
import { path } from '../../src/render/pixel/path';
import { Pix } from '../../src/render/pixel/raster';
import { pixelRig, type Mood, type MoodShape, type Rig } from '../../src/render/portraits';

// Doc 29: every part of a custom look renders through the bust pipeline with the same animation frames as the
// presets; the head tilt only moves what it should; full-body looks stay identical objects.

function frame(art: BustArt<Rig>, rig: Rig, k: number): Uint16Array {
  const w = 2 * Math.ceil(72 * k);
  const p = new Pix(w, Math.ceil(127 * k) + 1, k, w / 2, 0);
  art.figure(p, rig);
  return p.data;
}
const rig = (table: Readonly<Record<Mood, MoodShape>>, over: Partial<Rig> = {}): Rig =>
  ({ ...pixelRig(1, 0, 'neutral', 'none', 0, table), blink: 0, look: 0, ...over, m: table[over.mood ?? 'neutral'] });
const same = (a: Uint16Array, b: Uint16Array): boolean => a.every((v, i) => v === b[i]);

describe('custom avatar art', () => {
  it('renders every option of every part, and each option changes the picture', () => {
    for (const part of LOOK_PARTS) {
      if (part === 'sky') continue; // the sky is the background layer, not the figure
      const seen: Uint16Array[] = [];
      for (const option of lookOptions(part)) {
        const look = { ...DEFAULT_LOOK, [part]: option } as AvatarLook;
        const { art, moods } = avatarArt(look);
        const px = frame(art, rig(moods), 1);
        expect(px.some((v) => v > 0), `${part}=${option}`).toBe(true);
        for (const other of seen) expect(same(px, other), `${part}=${option}`).toBe(false);
        seen.push(px);
      }
    }
  });

  it('animates moods, blinks and the talking mouth for random looks at every art size', () => {
    for (let seed = 1; seed <= 6; seed++) {
      const { art, moods } = avatarArt(randomLook(seed));
      for (const k of [0.5, 0.75, 1]) {
        const looks = (['neutral', 'happy', 'stern', 'worried'] as const).map((m) => frame(art, rig(moods, { mood: m }), k));
        for (let i = 1; i < looks.length; i++) expect(same(looks[0]!, looks[i]!)).toBe(false);
        expect(same(frame(art, rig(moods, { blink: 0 }), k), frame(art, rig(moods, { blink: 2 }), k))).toBe(false);
        expect(same(frame(art, rig(moods, { mouth: 0 }), k), frame(art, rig(moods, { mouth: 2 }), k))).toBe(false);
      }
    }
  });

  it('gives every sky a background and every look a UI accent', () => {
    for (const sky of lookOptions('sky')) expect(SKIES[sky].grad.length).toBeGreaterThan(2);
    expect(pilotAccent({ ...DEFAULT_LOOK, suit: 'red' })).toMatch(/^#[0-9a-f]{6}$/);
    expect(pilotAccent({ ...DEFAULT_LOOK, suit: 'red' })).not.toBe(pilotAccent({ ...DEFAULT_LOOK, suit: 'navy' }));
    expect(pilotAccent('pilot2')).toBe('#4fb0e6');
  });

  it('keeps full-body looks as stable objects and follows the custom look', () => {
    const look: AvatarLook = { ...PRESET_LOOKS.pilot3, skin: 'deep', hairColor: 'black', hair: 'curly' };
    const a = playerPerson(look);
    expect(playerPerson({ ...look })).toBe(a);
    expect(a.hair.style).toBe('messy');
    expect(a.skin.base).not.toBe(playerPerson('pilot3').skin.base);
    const beach = (b: typeof a): typeof a => ({ ...b, legs: 'shorts' });
    expect(restyle(a, 'test', beach)).toBe(restyle(a, 'test', beach));
    expect(faceOf(null)).toBe('pilot1');
    expect(faceOf({ avatar: 'pilot2', save: { look: null } })).toBe('pilot2');
    expect(faceOf({ avatar: 'pilot2', save: { look } })).toBe(look);
  });
});

describe('head tilt (Pix.rot)', () => {
  it('maps exactly like the upright frame when rot = 0', () => {
    const p = new Pix(40, 40, 0.8, 20, 3);
    expect(p.at(3.3, 7.7)).toEqual([p.X(3.3), p.Y(7.7)]);
    expect(p.nudge(5, 5)).toEqual([0, 0]);
  });

  it('turns shapes about the pivot and moves hand-placed features to their turned anchor', () => {
    const upright = new Pix(60, 60, 1, 30, 0);
    const tilted = new Pix(60, 60, 1, 30, 0);
    tilted.rot = -0.3;
    tilted.pivotY = 40;
    const bar = path().rect(-10, 20, 20, 2);
    /** Top row of the bar's left end (columns left of the centre). */
    const leftTop = (m: Uint8Array): number => Math.floor(m.findIndex((v, i) => v === 1 && i % 60 < 25) / 60);
    expect(leftTop(upright.shape(bar))).toBe(20);
    expect(leftTop(tilted.shape(bar))).toBeGreaterThan(20); // the left end drops, the bar slants
    const [dc, dr] = tilted.nudge(-8, 30);
    expect(dr).toBeGreaterThan(0);
    expect(dc).toBeLessThan(0);
  });

  it('tilts pilot 3 only: the presets still render every frame', () => {
    const { art, moods } = avatarArt('pilot3');
    expect(frame(art, rig(moods), 1).some((v) => v > 0)).toBe(true);
  });
});
