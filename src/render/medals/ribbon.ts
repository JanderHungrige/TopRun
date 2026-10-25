import { MEDALS, type MedalId } from '../../data/medals';
import { path } from '../pixel/path';
import { union, type Mask, type Pix } from '../pixel/raster';
import { bevel, frameOf, glint, poly, starPath } from './metal';
import { BASE, D1, D2, hexRamp, INK, L1, L2, METAL, type Ramp } from './palette';

// Medal art (doc 25): the striped ribbon a medal hangs from, its brooch bar and suspension ring, and the
// small ribbon bar for a uniform's chest rows. Stripes are listed from the outside in and mirrored.

/** Stripe ramps from the outer edge to the centre. */
export const stripesOf = (id: MedalId): Ramp[] => MEDALS[id].look.ribbon.map(hexRamp);

const WEIGHTS = new Map<number, number[]>();

/** Where each stripe ends, walking in from the edge (u = 1) to the centre (u = 0). Outer stripes are wider. */
function bounds(n: number): number[] {
  const hit = WEIGHTS.get(n);
  if (hit) return hit;
  const w = Array.from({ length: n }, (_, i) => (i === 0 ? 2.2 : i === n - 1 ? 1.15 : 1.4));
  const total = w.reduce((a, b) => a + b, 0);
  let edge = 1;
  const out = w.map((v) => (edge -= v / total));
  WEIGHTS.set(n, out);
  return out;
}

/** The stripe at distance u from the centre line (0 = centre … 1 = edge). */
export function stripeAt(n: number, u: number): number {
  if (n <= 1) return 0;
  const b = bounds(n);
  for (let i = 0; i < n; i++) if (u >= (b[i] ?? 0)) return i;
  return n - 1;
}

/** Paints vertical stripes into `m` (half-width `half` about x = 0); `slot` shades a frame point. */
function stripes(p: Pix, m: Mask, list: readonly Ramp[], half: number, slot: (x: number, y: number) => number): void {
  for (let i = 0; i < m.length; i++) {
    if (!m[i]) continue;
    const [x, y] = frameOf(p, i);
    const ramp = list[stripeAt(list.length, Math.min(1, Math.abs(x) / half))] ?? list[0];
    if (ramp) p.data[i] = ramp[slot(x, y)] ?? 0;
  }
}

/** Cloth light: lit left edge, shaded right edge, a shadow under the brooch and on the turned-away folds. */
function clothSlot(half: number, foldY: number) {
  return (x: number, y: number): number => {
    if (y < 5.4) return D1;
    if (x < -half + 1.6) return L1;
    if (x > half - 1.6) return D1;
    if (y > foldY && x > 0) return D1;
    return BASE;
  };
}

/** The short drape of a hanging medal (brooch at y 0 … ring at y ≈ 41). */
export function shortDrape(p: Pix, list: readonly Ramp[]): Mask {
  const m = p.shape(path().lines([-11, 2, 11, 2, 11, 31, 0, 40.5, -11, 31]).close());
  stripes(p, m, list, 11, clothSlot(11, 30));
  return m;
}

/** The long campaign ribbon with swallowtail ends (to y ≈ 92). */
export function longDrape(p: Pix, list: readonly Ramp[]): Mask {
  const m = p.shape(path().lines([-13, 2, 13, 2, 13, 92, 0, 81, -13, 92]).close());
  stripes(p, m, list, 13, clothSlot(13, 74));
  return m;
}

/** The brooch bar across the top of the ribbon (the pin), with knobbed ends. */
export function brooch(p: Pix, metal: Ramp, half: number): Mask {
  const bar = p.shape(path().rect(-half, 0, half * 2, 4.4));
  const ends = union(p.oval(-half, 2.2, 2.4, 2.6), p.oval(half, 2.2, 2.4, 2.6));
  const m = union(bar, ends);
  bevel(p, m, metal, 0, 2.2, 6);
  p.paint(p.border(bar, 'u'), metal[L2] ?? 0);
  p.paint(p.border(bar, 'd'), metal[D2] ?? 0);
  glint(p, -half + 0.4, 1.4, metal);
  return m;
}

/** The suspension ring joining the ribbon to the medal. */
export function ring(p: Pix, metal: Ramp, y: number): Mask {
  const outer = p.oval(0, y, 3.8, 3.4);
  const hole = p.oval(0, y, 1.6, 1.3);
  const m = outer.map((v, i) => (v && !hole[i] ? 1 : 0));
  bevel(p, m, metal, 0, y, 3.6);
  return m;
}

/** Ribbon bar devices: a metal star (star medals) or a pair of tiny wings (wings medals). */
function barDevice(p: Pix, id: MedalId): void {
  const look = MEDALS[id].look;
  const metal = METAL[look.metal];
  const cx = p.w / 2;
  const cy = p.h / 2;
  const s = (p.h - 4) / 2;
  if (look.shape === 'star') {
    poly(p, starPath(cx, cy + 0.2, s + 0.4, 0.45), metal[L1] ?? 0);
    p.set(Math.floor(cx), Math.floor(cy), metal[L2] ?? 0);
  } else if (look.shape === 'wings') {
    poly(p, [cx - s * 2.4, cy - s * 0.5, cx, cy - s * 0.1, cx + s * 2.4, cy - s * 0.5, cx + s * 1.2, cy + s * 0.6, cx, cy + s * 0.3, cx - s * 1.2, cy + s * 0.6], metal[L1] ?? 0);
    p.paint(p.oval(cx, cy, s * 0.55, s * 0.55), metal[BASE] ?? 0);
  }
}

/** The ribbon bar filling the whole buffer (k = 1: frame units are art pixels). */
export function paintRibbonBar(p: Pix, id: MedalId): void {
  const list = stripesOf(id);
  const { w, h } = p;
  for (let r = 0; r < h; r++) {
    for (let c = 0; c < w; c++) {
      const ramp = list[stripeAt(list.length, Math.min(1, Math.abs(c + 0.5 - w / 2) / (w / 2)))] ?? list[0];
      if (!ramp) continue;
      const edge = r === 0 || c === 0 || r === h - 1 || c === w - 1;
      const slot = edge ? INK : h > 4 && r === 1 ? L1 : h > 4 && r === h - 2 ? D1 : BASE;
      p.set(c, r, ramp[slot] ?? 0);
    }
  }
  if (h >= 7) barDevice(p, id);
}
