import type { Ramp } from '../pixel/palette';
import { path, type Path } from '../pixel/path';
import { bayer, minus, type Mask, type Pix } from '../pixel/raster';
import type { Rig } from './types';

/**
 * Shared pixel-art portrait pieces (doc 06 / doc 20): frame 100×120 units (x -50..50, y 0..120, eyes near
 * y = 50), light from the upper left. Colours are palette ramps (palette.ts): shading uses the ramp's darker
 * steps as clean clusters with a one-pixel dithered seam, never gradients.
 */

/** Ramp slots: ink (outline), deep shadow, shadow, base, light, highlight. */
export const INK = 0;
export const D2 = 1;
export const D1 = 2;
export const BASE = 3;
export const L1 = 4;
export const L2 = 5;

export interface Face { w: number; jaw: number; top: number; chin: number }
/** An ellipse in frame units: centre, radii. */
export type Oval = readonly [number, number, number, number];

export const jawDrop = (r: Rig): number => [0, 1.1, 2.2][r.mouth] ?? 0;

/** Fills a shape in the ramp's base colour, a shadow cluster (the oval, clipped to the shape) with a dithered
 *  one-pixel seam, and an optional highlight cluster. Returns the shape's mask. */
export function shaded(p: Pix, shape: Path | Mask, r: Ramp, shade: Oval, light?: Oval): Mask {
  const m = shape instanceof Uint8Array ? shape : p.shape(shape);
  p.paint(m, r[BASE] ?? 0);
  const grow = 1.2 / p.k;
  const dark = p.oval(shade[0], shade[1], shade[2], shade[3]);
  p.paint(minus(p.oval(shade[0], shade[1], shade[2] + grow, shade[3] + grow), dark), r[D1] ?? 0, m, bayer(0.5));
  p.paint(dark, r[D1] ?? 0, m);
  if (light) p.paint(p.oval(light[0], light[1], light[2], light[3]), r[L1] ?? 0, m);
  return m;
}

/** Like shaded(), plus a dark seam wherever the piece overlaps earlier paint (collars, hair over the face). */
export function piece(p: Pix, shape: Path | Mask, r: Ramp, shade: Oval, light?: Oval, seamTone = D2): Mask {
  const m = shape instanceof Uint8Array ? shape : p.shape(shape);
  const seam = p.seam(m);
  shaded(p, m, r, shade, light);
  p.paint(seam, r[seamTone] ?? 0);
  return m;
}

/** Points along a quadratic curve [x0, y0, cx, cy, x1, y1] as a flat list. */
export function quadPts(q: readonly number[], n = 8): number[] {
  const pts: number[] = [];
  const [x0 = 0, y0 = 0, cx = 0, cy = 0, x1 = 0, y1 = 0] = q;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const u = 1 - t;
    pts.push(u * u * x0 + 2 * u * t * cx + t * t * x1, u * u * y0 + 2 * u * t * cy + t * t * y1);
  }
  return pts;
}

/** A 1-px pixel line along a quadratic curve [x0, y0, cx, cy, x1, y1] (hair strands, creases). */
export function strand(p: Pix, q: readonly number[], v: number, clip?: Mask): void {
  p.paint(p.thick(quadPts(q), 0), v, clip);
}

export function torsoPath(): Path {
  return path().move(-10, 84).cubic(-22, 86.5, -38, 87, -45, 96).lines([-60, 128, 60, 128, 45, 96])
    .cubic(38, 87, 22, 86.5, 10, 84).close();
}

export function torso(p: Pix, r: Ramp): Mask {
  return shaded(p, torsoPath(), r, [54, 114, 27, 36]);
}

/** Neck with the jaw's shadow across its top (chin = the y the jaw ends at). */
export function neck(p: Pix, s: Ramp, hw: number, chin = 77): void {
  const m = p.shape(path().rect(-hw, 62, hw * 2, 28));
  p.paint(m, s[BASE] ?? 0);
  p.paint(p.shape(path().rect(-hw, 62, hw * 2, chin + 3.5 - 62)), s[D1] ?? 0, m);
  p.paint(p.shape(path().rect(hw * 0.35, 62, hw, 28)), s[D1] ?? 0, m);
}

function headPath(f: Face, drop: number): Path {
  const c = f.chin + drop;
  return path().move(0, f.top)
    .cubic(f.w * 0.78, f.top, f.w, f.top + 9, f.w, 50)
    .cubic(f.w, 61, f.jaw + 2.5, c - 7, f.jaw, c - 3)
    .quad(f.jaw * 0.55, c, 0, c)
    .quad(-f.jaw * 0.55, c, -f.jaw, c - 3)
    .cubic(-f.jaw - 2.5, c - 7, -f.w, 61, -f.w, 50)
    .cubic(-f.w, f.top + 9, -f.w * 0.78, f.top, 0, f.top)
    .close();
}

function ears(p: Pix, s: Ramp, f: Face): void {
  for (const sd of [-1, 1]) {
    const ear = p.oval(sd * (f.w - 0.2), 53, 3.4, 5.8, sd * 0.12);
    p.paint(ear, (sd > 0 ? s[D1] : s[BASE]) ?? 0);
    p.paint(p.oval(sd * (f.w + 0.6), 53.6, 1.2, 3), s[D2] ?? 0, ear);
  }
}

/** Ears + head with a shadow cluster down the right cheek, a dithered seam and a forehead highlight.
 *  The chin drops while the mouth opens. Returns the head mask (for clipping blush, stubble …). */
export function face(p: Pix, s: Ramp, f: Face, r: Rig): Mask {
  ears(p, s, f);
  const m = shaded(p, headPath(f, jawDrop(r)), s, [f.w * 1.12, 58, f.w * 0.42, 34], [-f.w * 0.42, f.top + 7, 3.6, 2]);
  p.paint(p.oval(-f.w * 0.5, f.top + 6.4, 1.6, 0.8), s[L2] ?? 0, m);
  p.paint(p.border(m, 'd'), s[D1] ?? 0); // a darker jaw line reads as the chin's underside
  return m;
}

/** Rosy cheeks: a small solid cluster of a warm tint with a dithered rim (`level` = rim density). */
export function blush(p: Pix, x: number, y: number, rx: number, ry: number, tint: number, clip: Mask, level = 0.5): void {
  for (const sd of [-1, 1]) {
    const core = p.oval(sd * x, y, rx * 0.62, ry * 0.5);
    p.paint(minus(p.oval(sd * x, y, rx, ry * 0.8), core), tint, clip, bayer(level));
    p.paint(core, tint, clip);
  }
}
