import { describe, expect, it } from 'vitest';
import { AVATAR_IDS } from '../../src/game/profiles';
import { avatarArt } from '../../src/render/avatars';
import type { BustArt } from '../../src/render/pixel/bust';
import { Pix } from '../../src/render/pixel/raster';
import { MOODS, pixelRig, portraitArt, type CharacterId, type Gesture, type Mood, type MoodShape, type Rig } from '../../src/render/portraits';

// Doc 20: every pixel-art frame of the cast renders, and the frames that carry an expression really differ.

const CAST: readonly CharacterId[] = ['admiral', 'chief', 'shooter', 'wingman'];
const MOOD_LIST: readonly Mood[] = ['neutral', 'happy', 'stern', 'worried'];
const GESTURES: readonly Gesture[] = ['none', 'thumbsUp', 'point', 'salute', 'facepalm'];

function frame(art: BustArt<Rig>, rig: Rig, k: number): Uint16Array {
  const w = 2 * Math.ceil(72 * k);
  const p = new Pix(w, Math.ceil(127 * k) + 1, k, w / 2, 0);
  art.figure(p, rig);
  return p.data;
}
const rig = (over: Partial<Rig>, table: Readonly<Record<Mood, MoodShape>> = MOODS): Rig =>
  ({ ...pixelRig(1, 0, 'neutral', 'none', 0, table), blink: 0, look: 0, ...over, m: table[over.mood ?? 'neutral'] });
const same = (a: Uint16Array, b: Uint16Array): boolean => a.every((v, i) => v === b[i]);

describe('pixel cast', () => {
  for (const k of [0.5, 0.75, 1]) {
    it(`renders every portrait mood, gesture, mouth and blink frame at k = ${k}`, () => {
      for (const id of CAST) {
        const art = portraitArt(id);
        for (const g of GESTURES) expect(frame(art, rig({ gesture: g, mood: 'happy' }), k).some((v) => v > 0)).toBe(true);
        const moods = MOOD_LIST.map((m) => frame(art, rig({ mood: m }), k));
        for (let i = 0; i < moods.length; i++) for (let j = i + 1; j < moods.length; j++) expect(same(moods[i]!, moods[j]!)).toBe(false);
        const mouths = ([0, 1, 2] as const).map((m) => frame(art, rig({ mouth: m }), k));
        expect(same(mouths[0]!, mouths[1]!) || same(mouths[1]!, mouths[2]!)).toBe(false);
        if (id !== 'admiral') expect(same(frame(art, rig({ blink: 0 }), k), frame(art, rig({ blink: 2 }), k))).toBe(false);
      }
    });

    it(`renders every avatar frame at k = ${k}`, () => {
      for (const id of AVATAR_IDS) {
        const { art, moods } = avatarArt(id);
        const looks = MOOD_LIST.map((m) => frame(art, rig({ mood: m }, moods), k));
        for (let i = 1; i < looks.length; i++) expect(same(looks[0]!, looks[i]!)).toBe(false);
        expect(same(frame(art, rig({ blink: 0 }, moods), k), frame(art, rig({ blink: 2 }, moods), k))).toBe(false);
        expect(same(frame(art, rig({ mouth: 0 }, moods), k), frame(art, rig({ mouth: 2 }, moods), k))).toBe(false);
      }
    });
  }

  it('quantises the continuous animation inputs to frames', () => {
    expect(pixelRig(1, 0, 'neutral', 'none', 0, MOODS).mouth).toBe(0);
    expect(pixelRig(1, 0.4, 'neutral', 'none', 0, MOODS).mouth).toBe(1);
    expect(pixelRig(1, 1, 'neutral', 'none', 0, MOODS).mouth).toBe(2);
    const blinks = new Set<number>();
    for (let t = 0; t < 8; t += 0.005) blinks.add(pixelRig(t, 0, 'neutral', 'none', 0.3, MOODS).blink);
    expect([...blinks].sort()).toEqual([0, 1, 2]);
  });
});
