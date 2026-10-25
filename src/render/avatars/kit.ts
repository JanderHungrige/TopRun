import type { ArtView } from '../pixel/bust';
import { hexOf, PAL, type Ramp } from '../pixel/palette';
import { path } from '../pixel/path';
import { union, type Mask, type Pix } from '../pixel/raster';
import { part } from '../portraits/hands';
import { BASE, D1, D2, L1, neck, piece } from '../portraits/parts';
import type { Mood, MoodShape, Rig } from '../portraits/types';
import type { Sky } from './skies';

/**
 * Shared pieces of the pixel-art player avatars (doc 08 / doc 20 / doc 29): a kid-proportioned mood table, the
 * flight suit with harness and a blank name tape, round chest patches and the gold "selected" frame. Same
 * 100×120 frame as the portraits.
 */

export type { Sky } from './skies';
export interface Suit { ramp: Ramp; tee: number }
export interface AvatarArt {
  sky: Sky;
  moods: Readonly<Record<Mood, MoodShape>>;
  body(p: Pix, r: Rig): void;
  head(p: Pix, r: Rig): void;
  /** Optional layer in front of the head, in body space. */
  front?(p: Pix, r: Rig): void;
  /** Head tilt in radians about the neck (negative = towards the viewer's left), doc 29. */
  tilt?: number;
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
export const TILT_PIVOT = 72;

const BASE_MOODS: Readonly<Record<Mood, MoodShape>> = {
  neutral: { browIn: 0, browOut: 0, arch: 0.8, lidTop: 0.08, lidLow: 0.05, pupil: 1, lift: 0.4, curv: 0.5, widen: 0, tilt: 0, nod: 0 },
  happy: { browIn: -1.2, browOut: -0.6, arch: 1.4, lidTop: 0.04, lidLow: 0.34, pupil: 1, lift: 2.1, curv: 1.6, widen: 1.2, tilt: 0.04, nod: -0.6 },
  stern: { browIn: 2.2, browOut: -0.8, arch: 0.1, lidTop: 0.26, lidLow: 0.12, pupil: 0.95, lift: -0.5, curv: -0.1, widen: -1, tilt: 0, nod: 0.8 },
  worried: { browIn: -2.4, browOut: 1.1, arch: 0.3, lidTop: 0, lidLow: 0, pupil: 0.75, lift: -1.4, curv: -0.7, widen: -0.8, tilt: -0.05, nod: 0.4 },
};

/** Resting eye shape: `squint` raises the lower lids (a smiling face), `hood` lowers the upper lids (relaxed). */
export interface EyeRest { squint?: number; hood?: number }

/** The kid mood table with a resting smile added to every mood (negative = straighter). Built once per avatar. */
export function moods(smile: number, eyes: EyeRest = {}): Readonly<Record<Mood, MoodShape>> {
  const lid = (v: number, add = 0): number => Math.max(0, Math.min(0.5, v + add));
  const build = (m: MoodShape): MoodShape => ({
    ...m, lift: m.lift + smile, curv: m.curv + smile * 0.8, lidLow: lid(m.lidLow, eyes.squint), lidTop: lid(m.lidTop, eyes.hood),
  });
  return { neutral: build(BASE_MOODS.neutral), happy: build(BASE_MOODS.happy), stern: build(BASE_MOODS.stern), worried: build(BASE_MOODS.worried) };
}

const STRAP = PAL.olive[1] ?? 0;

function harness(p: Pix): void {
  for (const sd of [-1, 1]) p.paint(p.thick([sd * 18.5, 84.5, sd * 14.6, 104, sd * 12.6, 126], 1.9), STRAP);
  p.paint(p.thick([-14.6, 108.6, 14.6, 108.6], 1.5), STRAP);
  for (const sd of [-1, 1]) part(p, p.shape(path().rect(sd * 14.2 - 2.7, 106.3, 5.4, 4.8)), PAL.steel, p.oval(sd * 14.2 + 2.7, 111, 2.6, 2));
}

/** Neck, flight suit with open collar, zip, harness and a blank name tape (the game prints the callsign elsewhere). */
export function flightSuit(p: Pix, s: Suit, skin: Ramp): void {
  neck(p, skin, 6.6, 74);
  const r = s.ramp;
  piece(p, path().move(-8, 80).cubic(-18, 82.6, -32, 84, -38.5, 93).line(-52, 128).line(52, 128).line(38.5, 93)
    .cubic(32, 84, 18, 82.6, 8, 80).close(), r, [46, 114, 22, 34], [-30, 98, 5, 4]);
  p.fill(path().move(-6.6, 80.6).line(6.6, 80.6).line(0, 91.6).close(), s.tee);
  p.fill(path().move(-6.6, 80.6).line(6.6, 80.6).line(0, 86.4).close(), skin[D1] ?? 0);
  const collar = p.shape(path().pair([6.2, 80, 14, 82.2, 10.6, 92, 1.4, 92.4]));
  const seam = p.seam(collar);
  p.paint(collar, r[L1] ?? 0);
  p.paint(seam, r[D2] ?? 0);
  p.line(0, 93, 0, 126, r[D2] ?? 0);
  harness(p);
  part(p, p.shape(path().rect(19.6, 95.4, 11.6, 4.8)), PAL.leather, p.blank());
}

const speck = (c: number, r: number): number => {
  const s = Math.sin(c * 12.9898 + r * 78.233) * 43758.5453;
  return s - Math.floor(s);
};

/** Freckles over the nose bridge and both cheeks (`y` = their centre line): deterministic per pixel, never two
 *  touching; `density` 0..1, `tones` alternate. Skipped below 0.6 art px per unit. */
export function freckles(p: Pix, clip: Mask, tones: readonly number[], density: number, y = 58): void {
  if (p.k < 0.6 || density <= 0) return;
  const zone = union(union(p.oval(-10, y, 5.8, 3.2), p.oval(10, y, 5.8, 3.2)), p.oval(0, y - 2, 3.4, 1.8));
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
