import { describe, expect, it } from 'vitest';
import { path } from '../../src/render/pixel/path';
import { Pix } from '../../src/render/pixel/raster';
import { MOODS, pixelRig, wingmanArt } from '../../src/render/portraits/procedural';
import type { Gesture, Mood, Rig } from '../../src/render/portraits';

// Docs 20, 33: the procedural wingman — the last portrait drawn in code, until the owner's wingman.png exists —
// renders every frame, and the frames that carry an expression really differ. Delete this file together with
// portraits/procedural.ts (doc 33, one-file follow-up).

const MOOD_LIST: readonly Mood[] = ['neutral', 'happy', 'stern', 'worried'];
const GESTURES: readonly Gesture[] = ['none', 'thumbsUp', 'point', 'salute', 'facepalm'];

function frame(rig: Rig, k: number): Uint16Array {
  const w = 2 * Math.ceil(72 * k);
  const p = new Pix(w, Math.ceil(127 * k) + 1, k, w / 2, 0);
  wingmanArt.figure(p, rig);
  return p.data;
}
const rig = (over: Partial<Rig>): Rig => ({ ...pixelRig(1, 0, 'neutral', 'none', 0), blink: 0, look: 0, ...over, m: MOODS[over.mood ?? 'neutral'] });
const same = (a: Uint16Array, b: Uint16Array): boolean => a.every((v, i) => v === b[i]);

describe('procedural wingman', () => {
  for (const k of [0.5, 0.75, 1]) {
    it(`renders every mood, gesture, mouth and blink frame at k = ${k}`, () => {
      for (const g of GESTURES) expect(frame(rig({ gesture: g, mood: 'happy' }), k).some((v) => v > 0)).toBe(true);
      const moods = MOOD_LIST.map((m) => frame(rig({ mood: m }), k));
      for (let i = 0; i < moods.length; i++) for (let j = i + 1; j < moods.length; j++) expect(same(moods[i]!, moods[j]!)).toBe(false);
      const mouths = ([0, 1, 2] as const).map((m) => frame(rig({ mouth: m }), k));
      expect(same(mouths[0]!, mouths[1]!) || same(mouths[1]!, mouths[2]!)).toBe(false);
      expect(same(frame(rig({ blink: 0 }), k), frame(rig({ blink: 2 }), k))).toBe(false);
    });
  }

  it('quantises the continuous animation inputs to frames', () => {
    expect(pixelRig(1, 0, 'neutral', 'none', 0).mouth).toBe(0);
    expect(pixelRig(1, 0.4, 'neutral', 'none', 0).mouth).toBe(1);
    expect(pixelRig(1, 1, 'neutral', 'none', 0).mouth).toBe(2);
    const blinks = new Set<number>();
    for (let t = 0; t < 8; t += 0.005) blinks.add(pixelRig(t, 0, 'neutral', 'none', 0.3).blink);
    expect([...blinks].sort()).toEqual([0, 1, 2]);
  });
});

describe('head tilt (Pix.rot, used by the procedural features)', () => {
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
    expect(leftTop(tilted.shape(bar))).toBeGreaterThan(20);
    const [dc, dr] = tilted.nudge(-8, 30);
    expect(dr).toBeGreaterThan(0);
    expect(dc).toBeLessThan(0);
  });
});
