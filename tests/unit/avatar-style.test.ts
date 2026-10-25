import { describe, expect, it } from 'vitest';
import { HAIR_STYLES, randomLook, type AvatarLook } from '../../src/game/avatar-look';
import { AVATAR_IDS } from '../../src/game/profiles';
import { avatarArt, type PilotFace } from '../../src/render/avatars';
import { faceOutline, KID_HEAD } from '../../src/render/avatars/head';
import { litFill, rimLight } from '../../src/render/avatars/light';
import { lighter, PAL } from '../../src/render/pixel/palette';
import { path } from '../../src/render/pixel/path';
import { Pix } from '../../src/render/pixel/raster';
import { pixelRig } from '../../src/render/portraits';

// Doc 29 / doc 20 style rules (owner feedback: "way too long heads … less cute, more cool"): realistic head
// proportions, eyes at about the middle of the head, shoulders that fit the head, one key light from the left and a
// rim light from the background.

const K = 1;
const W = 2 * Math.ceil(72 * K);

/** The figure of a face rendered at k = 1 (neutral, eyes open, mouth shut). */
function figure(face: PilotFace): { p: Pix; chin: number; eye: number; faceW: number } {
  const { art, moods, face: f } = avatarArt(face);
  const p = new Pix(W, Math.ceil(127 * K) + 1, K, W / 2, 0);
  art.figure(p, { ...pixelRig(1, 0, 'neutral', 'none', 0, moods), blink: 0, look: 0, m: moods.neutral });
  return { p, chin: f?.head.chinY ?? 0, eye: f?.eye.y ?? 0, faceW: 2 * ((f?.head.cheek ?? 0) + 2.5) };
}

/** Columns covered in one row (leftmost to rightmost painted pixel). */
function span(p: Pix, row: number): number {
  let l = -1;
  let r = -1;
  for (let c = 0; c < p.w; c++) {
    if (!p.data[row * p.w + c]) continue;
    if (l < 0) l = c;
    r = c;
  }
  return l < 0 ? 0 : r - l + 1;
}

/** Bounding box of the head with its hair (everything above the chin; single flyaway strands do not count). */
function headBox(p: Pix, chin: number): { w: number; top: number } {
  let top = -1;
  let w = 0;
  for (let r = 0; r <= Math.floor(chin); r++) {
    let painted = 0;
    for (let c = 0; c < p.w; c++) if (p.data[r * p.w + c]) painted++;
    if (painted >= 10 && top < 0) top = r;
    w = Math.max(w, span(p, r));
  }
  return { w, top };
}

const FACES: readonly PilotFace[] = [...AVATAR_IDS, ...HAIR_STYLES.map((hair, i): AvatarLook => ({ ...randomLook(i + 40), hair, accessory: 'none' }))];

describe('avatar proportions (style v2)', () => {
  it('draws heads about 3:4 wide:tall with the eyes near the middle, never tall egg heads', () => {
    for (const face of FACES) {
      const { p, chin, eye } = figure(face);
      const box = headBox(p, chin);
      const height = chin - box.top;
      expect(box.w / height, JSON.stringify(face)).toBeGreaterThan(0.6);
      expect(box.w / height, JSON.stringify(face)).toBeLessThan(1);
      const eyeAt = (eye - box.top) / height;
      expect(eyeAt, JSON.stringify(face)).toBeGreaterThan(0.42);
      expect(eyeAt, JSON.stringify(face)).toBeLessThan(0.62);
    }
  });

  it('gives the head shoulders that fit (no bobble-heads): ≥ 2.4× the face with ears, ≥ 1.8× even the fullest hair', () => {
    for (const face of FACES) {
      const { p, chin, faceW } = figure(face);
      const shoulders = span(p, 104);
      expect(shoulders / faceW, JSON.stringify(face)).toBeGreaterThan(2.4);
      expect(shoulders / headBox(p, chin).w, JSON.stringify(face)).toBeGreaterThan(1.8);
    }
  });

  it('keeps the bare face a real face shape: wider than half its height, chin at chinY', () => {
    const p = new Pix(W, 128, 1, W / 2, 0);
    const m = p.shape(faceOutline(KID_HEAD));
    let top = 128;
    let bottom = 0;
    let wide = 0;
    for (let r = 0; r < 128; r++) {
      let n = 0;
      for (let c = 0; c < W; c++) n += m[r * W + c] ?? 0;
      if (n > 0) { top = Math.min(top, r); bottom = Math.max(bottom, r); }
      wide = Math.max(wide, n);
    }
    expect(wide / (bottom - top)).toBeGreaterThan(0.6);
    expect(Math.abs(bottom - KID_HEAD.chinY)).toBeLessThanOrEqual(1.5);
  });
});

describe('avatar lighting (style v2)', () => {
  it('lights a round form from the left: its left half is lighter along the ramp', () => {
    const p = new Pix(40, 40, 1, 20, 0);
    const m = p.oval(0, 20, 14, 14);
    const r = PAL.skinTan;
    litFill(p, m, r, { cx: 0, cy: 20, rx: 14, ry: 14 });
    let left = 0;
    let right = 0;
    for (let i = 0; i < m.length; i++) {
      if (!m[i]) continue;
      const tone = r.indexOf(p.data[i] ?? 0);
      if (i % 40 < 20) left += tone;
      else right += tone;
    }
    expect(left).toBeGreaterThan(right * 1.15);
  });

  it('adds a rim light only on the edges facing the background light', () => {
    const p = new Pix(10, 6, 1, 0, 0);
    const v = PAL.navy[2] ?? 0;
    p.paint(p.shape(path().rect(2, 1, 5, 4)), v);
    rimLight(p, 1, false, 2);
    expect(p.get(6, 2)).toBe(lighter(v, 2));
    expect(p.get(2, 2)).toBe(v);
    expect(p.get(4, 2)).toBe(v);
  });

  it('lightens along a colour ramp without leaving it', () => {
    const s = PAL.skinPale;
    expect(lighter(s[2] ?? 0, 2)).toBe(s[4]);
    expect(lighter(s[5] ?? 0, 3)).toBe(s[5]);
    expect(lighter(0, 2)).toBe(0);
  });

  it('maps art pixels back to frame points, tilt included (per-pixel lighting of a tilted head)', () => {
    const p = new Pix(80, 80, 0.8, 40, 6);
    p.rot = -0.2;
    p.pivotY = 66;
    const [ax, ay] = p.at(-7.4, 43.8);
    const [x, y] = p.frame(ax, ay);
    expect(x).toBeCloseTo(-7.4, 6);
    expect(y).toBeCloseTo(43.8, 6);
  });

  it('still animates every preset mood at the map header size', () => {
    for (const id of AVATAR_IDS) {
      const { art, moods } = avatarArt(id);
      const at = (mood: 'neutral' | 'stern'): Uint16Array => {
        const p = new Pix(2 * Math.ceil(72 * 0.5), Math.ceil(127 * 0.5) + 1, 0.5, Math.ceil(72 * 0.5), 0);
        art.figure(p, { ...pixelRig(1, 0, mood, 'none', 0, moods), blink: 0, look: 0, m: moods[mood] });
        return p.data;
      };
      const neutral = at('neutral');
      const stern = at('stern');
      expect(neutral.every((v, i) => v === stern[i])).toBe(false);
    }
  });
});
