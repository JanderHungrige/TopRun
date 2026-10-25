import { path } from '../pixel/path';
import type { Mask, Pix } from '../pixel/raster';
import { BASE, D1, D2, L1, L2, L3, type Ramp } from './palette';

// Medal art (doc 25): metal shading. The light comes from the upper left: bevelled shapes get light bands on
// that side and shade on the other, facets a flat shade by which way they face, edges a lit/dark rim and a few
// specular pixels. All positions are in the medal frame (x = 0 is the medal's centre line).

const LIGHT_X = -Math.SQRT1_2;
const LIGHT_Y = -Math.SQRT1_2;

/** The ramp slot for a brightness of −1 (facing away) … 1 (facing the light). */
export function shadeSlot(b: number): number {
  return b > 0.55 ? L2 : b > 0.18 ? L1 : b > -0.25 ? BASE : b > -0.62 ? D1 : D2;
}

/** Frame coordinates of pixel i's centre. */
export function frameOf(p: Pix, i: number): [number, number] {
  const c = i % p.w;
  const r = (i - c) / p.w;
  return [(c + 0.5 - p.ox) / p.k, (r + 0.5 - p.oy) / p.k];
}

/** A domed shape around (cx, cy) of radius r: banded light towards the upper left (`invert` = recessed). */
export function bevel(p: Pix, m: Mask, ramp: Ramp, cx: number, cy: number, r: number, invert = false): void {
  for (let i = 0; i < m.length; i++) {
    if (!m[i]) continue;
    const [x, y] = frameOf(p, i);
    const b = ((x - cx) * LIGHT_X + (y - cy) * LIGHT_Y) / Math.max(1, r);
    p.data[i] = ramp[shadeSlot(invert ? -b * 1.4 : b * 1.25)] ?? 0;
  }
}

/** Lit border on the upper left, dark border on the lower right. */
export function rim(p: Pix, m: Mask, ramp: Ramp, dark = D2, light = L2): void {
  p.paint(p.border(m, 'dr'), ramp[dark] ?? 0);
  p.paint(p.border(m, 'ul'), ramp[light] ?? 0);
}

/** A flat facet whose outward normal points along angle `a` (rad, screen space). */
export function facet(p: Pix, pts: readonly number[], ramp: Ramp, a: number): Mask {
  const m = p.shape(path().move(pts[0] ?? 0, pts[1] ?? 0).lines(pts.slice(2)).close());
  p.paint(m, ramp[shadeSlot(Math.cos(a) * LIGHT_X + Math.sin(a) * LIGHT_Y)] ?? 0);
  return m;
}

/** A specular glint: one white-hot pixel, a small cross on larger art. */
export function glint(p: Pix, x: number, y: number, ramp: Ramp): void {
  const c = p.col(x);
  const r = p.row(y);
  const v = ramp[L3] ?? ramp[L2] ?? 0;
  p.set(c, r, v);
  if (p.k < 0.9) return;
  for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) p.set(c + dc, r + dr, ramp[L2] ?? v);
}

/** An enamel field: flat colour with a recessed edge (shadow upper left, light lower right). */
export function enamel(p: Pix, m: Mask, ramp: Ramp): void {
  p.paint(m, ramp[BASE] ?? 0);
  p.paint(p.border(m, 'dr'), ramp[L1] ?? 0);
  p.paint(p.border(m, 'ul'), ramp[D1] ?? 0);
}

/** A 5-point (or n-point) star outline around (cx, cy). */
export function starPath(cx: number, cy: number, R: number, inner: number, n = 5, rot = -Math.PI / 2): number[] {
  const pts: number[] = [];
  for (let i = 0; i < n * 2; i++) {
    const a = rot + (i * Math.PI) / n;
    const d = i % 2 === 0 ? R : R * inner;
    pts.push(cx + Math.cos(a) * d, cy + Math.sin(a) * d);
  }
  return pts;
}

/** Fills a flat polygon given as x,y pairs. */
export function poly(p: Pix, pts: readonly number[], v: number, clip?: Mask): Mask {
  return p.fill(path().move(pts[0] ?? 0, pts[1] ?? 0).lines(pts.slice(2)).close(), v, clip);
}
