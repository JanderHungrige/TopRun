import type { Ramp } from '../pixel/palette';
import { path, type Path } from '../pixel/path';
import { bayer, shifted, union, type Mask, type Pix } from '../pixel/raster';
import { BASE, D1, D2, L1 } from '../portraits/parts';
import type { Rig } from '../portraits/types';
import { brows, eyes, mouth, nose, type BrowSpec, type EyeSpec, type MouthSpec, type NoseSpec } from './face';
import { freckles } from './kit';
import { FOUR, glaze, litPiece } from './light';

/**
 * The pilots' head (doc 29, style rules doc 20): realistic proportions in the 100 × 120 frame — skull top ≈ 18,
 * eyes ≈ 43 (the vertical middle of hair-top … chin), chin ≈ 68, cheekbones ≈ ±15, a defined, softly rounded jaw,
 * ears at eye-to-nose height — shaded as a lit volume with eye sockets, cheekbones, chin and the jaw's shadow on
 * the neck. Each pilot varies the measurements.
 */

export interface HeadSpec {
  /** Skull top (hidden by most hair). */
  top: number;
  /** Half-widths: temples, cheekbones (the widest point, at cheekY), jaw angle (at jawY), chin (at chinY). */
  temple: number; cheek: number; cheekY: number; jaw: number; jawY: number; chin: number; chinY: number;
  /** Ear centre height and half-height. */
  earY: number; earH: number;
}

/** A kid's head: slightly larger cranium, full cheeks, a soft but defined jaw. */
export const KID_HEAD: HeadSpec = {
  top: 17.5, temple: 14.4, cheek: 15.2, cheekY: 45, jaw: 12.4, jawY: 56.8, chin: 5.8, chinY: 65.8, earY: 47.6, earH: 4.7,
};

/** Where the features sit (shared by modelling, eyes, nose, mouth). */
export interface Marks { eyeX: number; eyeY: number; browY: number; noseY: number; mouthY: number }

/** How far the chin drops per talking frame. */
export const JAW: readonly number[] = [0, 0.9, 1.8];

type Seg = readonly [number, number, number, number, number, number];

/** The face outline: crown → temple → cheekbone → jaw angle → chin, mirrored. `drop` lowers the jaw and chin. */
export function faceOutline(h: HeadSpec, drop = 0): Path {
  const cy = h.chinY + drop;
  const jy = h.jawY + drop * 0.6;
  const right: readonly Seg[] = [
    [h.temple * 0.62, h.top, h.temple, h.top + 5, h.temple, h.top + 12.5],
    [h.temple, h.cheekY - 8, h.cheek, h.cheekY - 4.5, h.cheek, h.cheekY],
    [h.cheek, h.cheekY + 6, h.jaw + 1.8, jy - 4, h.jaw, jy],
    [h.jaw - 1.4, jy + 3.8, h.chin + 2.8, cy - 0.8, h.chin, cy - 0.2],
    [h.chin * 0.55, cy + 0.6, h.chin * 0.2, cy + 0.7, 0, cy + 0.7],
  ];
  const ends: (readonly [number, number])[] = [[0, h.top], ...right.map((s): readonly [number, number] => [s[4], s[5]])];
  const p = path().move(0, h.top);
  for (const s of right) p.cubic(s[0], s[1], s[2], s[3], s[4], s[5]);
  for (let i = right.length - 1; i >= 0; i--) {
    const s = right[i];
    const from = ends[i];
    if (s && from) p.cubic(-s[2], s[3], -s[0], s[1], -from[0], from[1]);
  }
  return p.close();
}

/** Pixels currently painted in ramp `r` (to shade only what is already there, e.g. the neck). */
export function inRamp(p: Pix, r: Ramp): Mask {
  const set = new Set(r);
  const out = p.blank();
  for (let i = 0; i < out.length; i++) if (set.has(p.data[i] ?? 0)) out[i] = 1;
  return out;
}

function ears(p: Pix, h: HeadSpec, s: Ramp): void {
  const dome = { cx: -h.cheek * 0.3, cy: h.cheekY, rx: h.cheek * 1.5, ry: 30 };
  for (const sd of [-1, 1]) {
    const cx = sd * (h.cheek + 0.7);
    const m = p.shape(path().ellipse(cx, h.earY, 2.5, h.earH, sd * 0.16));
    litPiece(p, m, s, dome, { tones: FOUR });
    if (p.k < 0.6) continue;
    p.paint(p.thick([cx + sd * 0.1, h.earY - h.earH * 0.55, cx + sd * 1.2, h.earY - h.earH * 0.1, cx + sd * 0.4, h.earY + h.earH * 0.55], 0), s[D1] ?? 0, m);
    p.paint(p.oval(cx - sd * 0.4, h.earY + 0.4, 0.7, 1.3), s[D2] ?? 0, m);
  }
}

/** The jaw's cast shadow on the neck (light from the upper left: it falls down and to the right). */
function jawShadow(p: Pix, h: HeadSpec, s: Ramp, drop: number): void {
  const neck = inRamp(p, s);
  const face = p.shape(faceOutline(h, drop));
  const k = p.k;
  p.paint(shifted(face, p.w, Math.round(1.2 * k), Math.round(3.6 * k)), s[D1] ?? 0, neck);
  p.paint(shifted(face, p.w, Math.round(0.8 * k), Math.round(1.8 * k)), s[D2] ?? 0, neck);
}

/** Ears, the jaw's shadow on the neck, and the lit face. Returns the face mask (clip for warmth and freckles). */
export function headBase(p: Pix, h: HeadSpec, s: Ramp, r: Rig): Mask {
  const drop = JAW[r.mouth] ?? 0;
  jawShadow(p, h, s, drop);
  ears(p, h, s);
  const m = p.shape(faceOutline(h, drop));
  const dome = { cx: -1.6, cy: h.cheekY - 3, rx: h.cheek * 1.1, ry: (h.chinY - h.top) * 0.8, flat: 2.2 };
  litPiece(p, m, s, dome, { lo: -0.45, hi: 1.2, seam: 10 });
  return m;
}

/** Form on the face: eye sockets, the lit brow ridge and cheekbone, the hollow under the shadow-side cheekbone,
 *  the chin's highlight. */
export function modelFace(p: Pix, h: HeadSpec, f: Marks, s: Ramp, fm: Mask): void {
  for (const sd of [-1, 1]) {
    glaze(p, p.oval(sd * (f.eyeX + 0.3), f.eyeY - 1, 4.2, 2.4), s[D1] ?? 0, sd < 0 ? 0.2 : 0.38, fm);
  }
  if (p.k < 0.6) return;
  p.paint(p.oval(-f.eyeX - 0.8, f.browY - 1.9, 2.6, 0.6), s[L1] ?? 0, fm);
  p.paint(p.oval(-h.cheek * 0.56, f.eyeY + 5.2, 2.8, 1, -0.2), s[L1] ?? 0, fm);
  p.paint(p.oval(-1.3, h.chinY - 2.6, 1.8, 0.8), s[L1] ?? 0, fm);
}

/** Faint warmth over the cheekbones (no blush circles): a sparse ordered dither of a slightly warmer `tint` over
 *  the mid-tone skin only, so the shading stays; `level` 0 … ~1.2 sets area and density. */
export function warmth(p: Pix, h: HeadSpec, f: Marks, s: Ramp, tint: number, level: number, fm: Mask): void {
  if (level <= 0) return;
  const base = s[BASE] ?? 0;
  const oval = (sd: number): Mask => p.oval(sd * h.cheek * 0.58, f.eyeY + 7, 2.6 * level + 1.6, 2 * level + 1);
  const zone = union(oval(-1), oval(1));
  const dots = bayer(Math.min(0.5, level * 0.4));
  for (let i = 0; i < zone.length; i++) {
    if (zone[i] && fm[i] && p.data[i] === base && dots(i % p.w, Math.floor(i / p.w))) p.data[i] = tint;
  }
}

/** Everything a pilot's face is made of (presets and custom looks). */
export interface FaceArt {
  head: HeadSpec;
  skin: Ramp;
  eye: EyeSpec;
  brow: BrowSpec;
  nose: NoseSpec;
  mouth: MouthSpec;
  warmth: { tint: number; level: number };
  freckles?: { tones: readonly number[]; density: number };
}

/** The face from skull to chin (ears, jaw shadow, volume, warmth, freckles, form, eyes, brows, nose, mouth); hair,
 *  glasses and hats go on top. Returns the face mask. */
export function drawFace(p: Pix, r: Rig, f: FaceArt): Mask {
  const marks: Marks = { eyeX: f.eye.x, eyeY: f.eye.y, browY: f.brow.y, noseY: f.nose.tip, mouthY: f.mouth.y };
  const fm = headBase(p, f.head, f.skin, r);
  warmth(p, f.head, marks, f.skin, f.warmth.tint, f.warmth.level, fm);
  if (f.freckles) freckles(p, fm, f.freckles.tones, f.freckles.density, f.eye.y + 6);
  modelFace(p, f.head, marks, f.skin, fm);
  eyes(p, r, f.eye, f.skin);
  brows(p, r, f.brow);
  nose(p, f.nose, f.skin);
  mouth(p, r, f.mouth, f.skin);
  return fm;
}
