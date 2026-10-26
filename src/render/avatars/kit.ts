import type { ArtView } from '../pixel/bust';
import { hexOf, PAL, type Ramp } from '../pixel/palette';
import { union, type Mask, type Pix } from '../pixel/raster';
import { BASE, D1, L1 } from '../portraits/parts';
import type { Mood, MoodShape, Rig } from '../portraits/types';
import type { FaceArt } from './head';
import type { Sky } from './skies';

/**
 * Shared pieces of the pixel-art player avatars (doc 08 / 20 / 29): the art interface, the mood table (cool and
 * confident: a steady gaze and a half-smile), freckles, round chest patches and the gold "selected" frame. Same
 * 100 × 120 frame as the portraits.
 */

export type { Sky } from './skies';
export { flightSuit, neck, type Suit } from './suit';
export interface AvatarArt {
  sky: Sky;
  moods: Readonly<Record<Mood, MoodShape>>;
  body(p: Pix, r: Rig): void;
  head(p: Pix, r: Rig): void;
  /** Optional layer in front of the head, in body space. */
  front?(p: Pix, r: Rig): void;
  /** Head tilt in radians about the neck (negative = towards the viewer's left), doc 29. */
  tilt?: number;
  /** The face's measurements (proportion checks, doc 29). */
  face?: FaceArt;
}

/** A hair style in any colour ramp `h` over the skin ramp `s` (presets and the builder share them, doc 29). */
export interface HairArt {
  /** Behind the suit: long hair down the back. */
  behind?(p: Pix, h: Ramp): void;
  /** Behind the face. */
  back?(p: Pix, h: Ramp, s: Ramp): void;
  /** In front of the face: fringe, locks, buns, braids. */
  front(p: Pix, h: Ramp, s: Ramp): void;
}

/** Where a tilted head turns: the top of the neck. */
export const TILT_PIVOT = 66;

const BASE_MOODS: Readonly<Record<Mood, MoodShape>> = {
  neutral: { browIn: 0, browOut: 0, arch: 0.4, lidTop: 0.2, lidLow: 0.05, pupil: 1, lift: 0.5, curv: 0, widen: 0, tilt: 0, nod: 0 },
  happy: { browIn: -0.6, browOut: -0.4, arch: 1, lidTop: 0.1, lidLow: 0.3, pupil: 1, lift: 1.9, curv: 1, widen: 0.8, tilt: 0, nod: -0.6 },
  stern: { browIn: 1.6, browOut: -0.6, arch: 0, lidTop: 0.36, lidLow: 0.18, pupil: 1, lift: -0.4, curv: 0, widen: -0.6, tilt: 0, nod: 0.8 },
  worried: { browIn: -1.9, browOut: 0.9, arch: 0.3, lidTop: 0, lidLow: 0, pupil: 1, lift: -1.1, curv: -0.6, widen: -0.5, tilt: 0, nod: 0.4 },
};

/** Resting eye shape: `squint` raises the lower lids (a smile in the eyes), `hood` lowers the upper lids (cool). */
export interface EyeRest { squint?: number; hood?: number }

/** The mood table with a resting smile added to every mood (negative = straighter). Built once per avatar. */
export function moods(smile: number, eyes: EyeRest = {}): Readonly<Record<Mood, MoodShape>> {
  const lid = (v: number, add = 0): number => Math.max(0, Math.min(0.5, v + add));
  const build = (m: MoodShape): MoodShape => ({
    ...m, lift: m.lift + smile, curv: m.curv + smile * 0.8, lidLow: lid(m.lidLow, eyes.squint), lidTop: lid(m.lidTop, eyes.hood),
  });
  return { neutral: build(BASE_MOODS.neutral), happy: build(BASE_MOODS.happy), stern: build(BASE_MOODS.stern), worried: build(BASE_MOODS.worried) };
}

const speck = (c: number, r: number): number => {
  const s = Math.sin(c * 12.9898 + r * 78.233) * 43758.5453;
  return s - Math.floor(s);
};

/** Subtle freckles over the nose bridge and both cheeks (`y` = their centre line): deterministic per pixel, never
 *  two touching; `density` 0..1, `tones` alternate. Skipped below 0.6 art px per unit. */
export function freckles(p: Pix, clip: Mask, tones: readonly number[], density: number, y: number): void {
  if (p.k < 0.6 || density <= 0) return;
  const zone = union(union(p.oval(-8.6, y, 4.6, 2.6), p.oval(8.6, y, 4.6, 2.6)), p.oval(0, y - 2.2, 2.6, 1.4));
  const placed = p.blank();
  const w = p.w;
  for (let i = w + 1; i < zone.length; i++) {
    if (!zone[i] || !clip[i] || placed[i - 1] || placed[i - w] || placed[i - w - 1] || placed[i - w + 1]) continue;
    const c = i % w;
    const v = speck(c - Math.round(p.ox), (i - c) / w);
    if (v >= density) continue;
    placed[i] = 1;
    p.data[i] = tones[Math.floor((v / density) * 7) % tones.length] ?? 0;
  }
}

/** Round chest patch: a ring and an inner disc for an emblem. */
export function roundPatch(p: Pix, x: number, y: number, r: number, ring: number, inner: number): void {
  p.paint(p.oval(x, y, r, r), ring);
  p.paint(p.oval(x, y, r * 0.72, r * 0.72), inner);
  if (p.k >= 0.7) p.paint(p.oval(x - r * 0.35, y - r * 0.45, r * 0.4, r * 0.18), PAL.white[2] ?? 0, p.oval(x, y, r, r));
}

const GOLD = PAL.gold;

/** Pulsing gold pixel frame with a dithered inner glow and a twinkling corner star, in compose pixels. */
export function selectionFrame(g: CanvasRenderingContext2D, v: ArtView): void {
  const pulse = Math.sin(v.t * 4.2) > 0;
  g.fillStyle = hexOf(GOLD[BASE] ?? 0);
  const glow = Math.max(2, Math.round(v.W * 0.05));
  for (let i = 0; i < glow; i++) {
    for (let x = i % 2; x < v.W; x += pulse ? 2 : 3) {
      g.fillRect(x, 2 + i, 1, 1);
      g.fillRect(x, v.H - 3 - i, 1, 1);
    }
    for (let y = i % 2; y < v.H; y += pulse ? 2 : 3) {
      g.fillRect(2 + i, y, 1, 1);
      g.fillRect(v.W - 3 - i, y, 1, 1);
    }
  }
  g.fillStyle = hexOf(GOLD[D1] ?? 0);
  g.fillRect(0, 0, v.W, 1); g.fillRect(0, v.H - 1, v.W, 1); g.fillRect(0, 0, 1, v.H); g.fillRect(v.W - 1, 0, 1, v.H);
  g.fillStyle = hexOf((pulse ? GOLD[5] : GOLD[L1]) ?? 0);
  g.fillRect(1, 1, v.W - 2, 1); g.fillRect(1, v.H - 2, v.W - 2, 1); g.fillRect(1, 1, 1, v.H - 2); g.fillRect(v.W - 2, 1, 1, v.H - 2);
  const s = Math.floor(v.t * 3) % 3;
  const cx = v.W - 7;
  const cy = 6;
  g.fillStyle = hexOf(GOLD[5] ?? 0);
  g.fillRect(cx - 1 - s, cy, 3 + s * 2, 1);
  g.fillRect(cx, cy - 1 - s, 1, 3 + s * 2);
}
