import { path } from '../pixel/path';
import { minus, union, type Mask, type Pix } from '../pixel/raster';
import type { EmblemId } from './designs';
import { bevel, poly, starPath } from './metal';
import { BASE, D1, L1, L2, type Ramp } from './palette';

// Medal art (doc 25): the small emblems on medal fields, seals and medallions. Each is laid out in a unit
// square (−1 … 1) around (x, y) scaled by r, painted in the design's mark / accent ramps and kept inside `clip`.

export interface EmblemInk { mark: Ramp; accent: Ramp }

type Painter = (p: Pix, x: number, y: number, r: number, ink: EmblemInk, clip: Mask) => void;

const val = (ramp: Ramp, slot = BASE): number => ramp[slot] ?? 0;
/** Unit-square points around (x, y) at scale r → frame units. */
const map = (x: number, y: number, r: number, pts: readonly number[]): number[] => pts.map((q, i) => (i % 2 === 0 ? x + q * r : y + q * r));
const stroke = (p: Pix, x: number, y: number, r: number, pts: readonly number[], w: number): Mask => p.thick(map(x, y, r, pts), w * r);

function quadPts(x0: number, y0: number, cx: number, cy: number, x1: number, y1: number): number[] {
  const out: number[] = [];
  for (let i = 0; i <= 8; i++) {
    const t = i / 8;
    const u = 1 - t;
    out.push(u * u * x0 + 2 * u * t * cx + t * t * x1, u * u * y0 + 2 * u * t * cy + t * t * y1);
  }
  return out;
}

/** A shaded shape: base colour, light towards the upper left. */
function solid(p: Pix, m: Mask, ramp: Ramp, x: number, y: number, r: number, clip: Mask): void {
  const inside = m.map((v, i) => (v && clip[i] ? 1 : 0));
  bevel(p, inside, ramp, x, y, r);
}

const JET = [0, -1, 0.12, -0.7, 0.14, -0.28, 0.84, 0.18, 0.84, 0.34, 0.14, 0.24, 0.12, 0.56, 0.42, 0.8, 0.42, 0.93, 0, 0.84];
/** A jet seen from above, nose up. */
function jet(p: Pix, x: number, y: number, s: number, ramp: Ramp, clip: Mask): void {
  const right = map(x, y, s, JET);
  const left: number[] = [];
  for (let i = right.length - 2; i >= 0; i -= 2) left.push(2 * x - (right[i] ?? 0), right[i + 1] ?? 0);
  const m = p.shape(path().move(right[0] ?? 0, right[1] ?? 0).lines([...right.slice(2), ...left]).close());
  solid(p, m, ramp, x, y, s, clip);
  if (p.k * s >= 5) p.paint(p.oval(x, y - 0.5 * s, 0.07 * s, 0.17 * s), val(ramp, D1), clip);
}

const wave: Painter = (p, x, y, r, ink, clip) => {
  p.paint(p.oval(x + 0.42 * r, y - 0.52 * r, 0.2 * r, 0.2 * r), val(ink.accent), clip);
  for (const row of [-0.08, 0.34]) {
    const pts: number[] = [];
    for (let i = 0; i <= 18; i++) {
      const u = -0.9 + (i / 18) * 1.8;
      pts.push(u, row + Math.sin(u * 7) * 0.13);
    }
    p.paint(stroke(p, x, y, r, pts, 0.1), val(ink.mark), clip);
  }
};

const sun: Painter = (p, x, y, r, ink, clip) => {
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    p.paint(stroke(p, x, y, r, [Math.cos(a) * 0.48, -0.14 + Math.sin(a) * 0.48, Math.cos(a) * 0.72, -0.14 + Math.sin(a) * 0.72], 0.07), val(ink.mark), clip);
  }
  solid(p, p.oval(x, y - 0.14 * r, 0.36 * r, 0.36 * r), ink.mark, x, y - 0.14 * r, 0.36 * r, clip);
  const dune = path().move(x - r, y + 0.44 * r).quad(x - 0.3 * r, y + 0.14 * r, x + 0.15 * r, y + 0.42 * r)
    .quad(x + 0.55 * r, y + 0.62 * r, x + r, y + 0.36 * r).line(x + r, y + r * 1.2).line(x - r, y + r * 1.2).close();
  const m = p.shape(dune);
  p.paint(m, val(ink.accent), clip);
  p.paint(p.border(m, 'u'), val(ink.accent, L2), clip);
};

const flake: Painter = (p, x, y, r, ink, clip) => {
  const arms: number[][] = [];
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3 - Math.PI / 2;
    arms.push([0, 0, Math.cos(a) * 0.86, Math.sin(a) * 0.86]);
    for (const s of [-1, 1]) {
      const b = a + s * 0.8;
      const bx = Math.cos(a) * 0.48;
      const by = Math.sin(a) * 0.48;
      arms.push([bx, by, bx + Math.cos(b) * 0.28, by + Math.sin(b) * 0.28]);
    }
  }
  for (const a of arms) p.paint(stroke(p, x, y, r, a, 0.075), val(ink.mark), clip);
  p.paint(p.oval(x, y, 0.16 * r, 0.16 * r), val(ink.accent), clip);
};

const mesa: Painter = (p, x, y, r, ink, clip) => {
  p.paint(p.oval(x + 0.3 * r, y - 0.08 * r, 0.36 * r, 0.36 * r), val(ink.accent), clip);
  const m = poly(p, map(x, y, r, [-1, 0.62, -0.72, 0.62, -0.6, 0.02, -0.12, 0.02, -0.04, 0.3, 0.3, 0.3, 0.38, -0.14, 0.76, -0.14, 0.88, 0.62, 1, 0.62, 1, 1.3, -1, 1.3]), val(ink.mark), clip);
  p.paint(p.border(m, 'ul'), val(ink.mark, L1), clip);
  p.paint(stroke(p, x, y, r, [-0.56, 0.24, -0.14, 0.24], 0.04), val(ink.mark, D1), clip);
};

const trident: Painter = (p, x, y, r, ink, clip) => {
  let m = stroke(p, x, y, r, [0, -0.86, 0, 0.88], 0.085);
  m = union(m, stroke(p, x, y, r, [-0.5, -0.74, -0.5, -0.44, -0.3, -0.27, 0, -0.23, 0.3, -0.27, 0.5, -0.44, 0.5, -0.74], 0.075));
  for (const tx of [-0.5, 0, 0.5]) m = union(m, p.shape(path().lines(map(x, y, r, [tx - 0.15, tx === 0 ? -0.78 : -0.66, tx, tx === 0 ? -1.04 : -0.92, tx + 0.15, tx === 0 ? -0.78 : -0.66])).close()));
  m = union(m, p.oval(x, y + 0.9 * r, 0.13 * r, 0.11 * r));
  solid(p, m, ink.mark, x, y, r, clip);
};

const star: Painter = (p, x, y, r, ink, clip) => {
  solid(p, p.shape(path().lines(starPath(x, y + 0.06 * r, 0.96 * r, 0.42)).close()), ink.mark, x, y, r, clip);
};

const stars3: Painter = (p, x, y, r, ink, clip) => {
  for (const [sx, sy, s] of [[0, -0.42, 0.5], [-0.5, 0.36, 0.42], [0.5, 0.36, 0.42]] as const) {
    solid(p, p.shape(path().lines(starPath(x + sx * r, y + sy * r, s * r, 0.42)).close()), ink.mark, x + sx * r, y + sy * r, s * r, clip);
  }
};

const jetUp: Painter = (p, x, y, r, ink, clip) => {
  jet(p, x, y - 0.04 * r, 0.9 * r, ink.mark, clip);
};

/** A palm on a little island against a low sun (off duty). */
const palm: Painter = (p, x, y, r, ink, clip) => {
  p.paint(p.oval(x + 0.3 * r, y + 0.1 * r, 0.42 * r, 0.42 * r), val(ink.accent), clip);
  p.paint(p.oval(x - 0.05 * r, y + 1.02 * r, 0.8 * r, 0.3 * r), val(ink.mark), clip);
  p.paint(stroke(p, x, y, r, quadPts(-0.2, 0.86, -0.3, 0.2, 0.02, -0.36), 0.09), val(ink.mark), clip);
  const crown = [0.02, -0.38] as const;
  for (const [tx, ty, lift] of [[-0.78, 0.0, 0.3], [-0.56, -0.74, 0.12], [0.12, -0.9, 0.1], [0.72, -0.6, 0.14], [0.82, -0.02, 0.3]] as const) {
    const pts = quadPts(crown[0], crown[1], (crown[0] + tx) / 2, (crown[1] + ty) / 2 - lift, tx, ty);
    p.paint(stroke(p, x, y, r, pts, 0.085), val(ink.mark), clip);
  }
};

const sword: Painter = (p, x, y, r, ink, clip) => {
  solid(p, p.shape(path().lines(map(x, y, r, [-0.12, -0.6, 0, -0.96, 0.12, -0.6, 0.12, 0.32, -0.12, 0.32])).close()), ink.mark, x, y, r, clip);
  p.paint(stroke(p, x, y, r, [-0.48, 0.38, 0.48, 0.38], 0.095), val(ink.accent), clip);
  p.paint(stroke(p, x, y, r, [0, 0.44, 0, 0.72], 0.07), val(ink.mark, D1), clip);
  p.paint(p.oval(x, y + 0.82 * r, 0.13 * r, 0.13 * r), val(ink.accent), clip);
};

const reticle: Painter = (p, x, y, r, ink, clip) => {
  const ringM = minus(p.oval(x, y, 0.64 * r, 0.64 * r), p.oval(x, y, 0.47 * r, 0.47 * r));
  let m = ringM;
  for (const l of [[0, -0.98, 0, -0.3], [0, 0.3, 0, 0.98], [-0.98, 0, -0.3, 0], [0.3, 0, 0.98, 0]]) m = union(m, stroke(p, x, y, r, l, 0.075));
  m = union(m, p.oval(x, y, 0.13 * r, 0.13 * r));
  p.paint(m, val(ink.mark), clip);
};

const shield: Painter = (p, x, y, r, ink, clip) => {
  const s = path().move(x - 0.64 * r, y - 0.74 * r).line(x + 0.64 * r, y - 0.74 * r).line(x + 0.64 * r, y)
    .cubic(x + 0.64 * r, y + 0.44 * r, x + 0.3 * r, y + 0.7 * r, x, y + 0.9 * r)
    .cubic(x - 0.3 * r, y + 0.7 * r, x - 0.64 * r, y + 0.44 * r, x - 0.64 * r, y).close();
  const m = p.shape(s);
  solid(p, m, ink.mark, x, y, r, clip);
  p.paint(stroke(p, x, y, r, [-0.38, -0.14, 0, 0.2, 0.38, -0.14], 0.12), val(ink.accent), m);
};

function laurel(p: Pix, x: number, y: number, r: number, ramp: Ramp, clip: Mask): void {
  for (const side of [-1, 1]) {
    for (let j = 0; j < 6; j++) {
      const a = Math.PI / 2 + side * (0.42 + j * 0.4);
      const lx = x + Math.cos(a) * 0.74 * r;
      const ly = y + Math.sin(a) * 0.74 * r;
      p.paint(p.oval(lx, ly, 0.2 * r, 0.09 * r, a + (side * Math.PI) / 2 + side * 0.55), val(ramp, j % 2 ? L1 : BASE), clip);
    }
  }
}

const laurelStar: Painter = (p, x, y, r, ink, clip) => {
  laurel(p, x, y, r, ink.mark, clip);
  solid(p, p.shape(path().lines(starPath(x, y + 0.04 * r, 0.46 * r, 0.42)).close()), ink.accent, x, y, 0.46 * r, clip);
};

const helmet: Painter = (p, x, y, r, ink, clip) => {
  const dome = minus(p.oval(x, y - 0.04 * r, 0.62 * r, 0.74 * r), p.shape(path().rect(x - r, y + 0.5 * r, 2 * r, r)));
  solid(p, dome, ink.mark, x, y - 0.3 * r, 0.7 * r, clip);
  const visor = p.shape(path().move(x - 0.52 * r, y - 0.12 * r).line(x + 0.52 * r, y - 0.12 * r).line(x + 0.44 * r, y + 0.22 * r).quad(x, y + 0.32 * r, x - 0.44 * r, y + 0.22 * r).close());
  p.paint(visor, val(ink.accent), dome);
  p.paint(p.border(visor, 'u'), val(ink.accent, L2), dome);
  p.paint(stroke(p, x, y, r, [0, -0.74, 0, -0.18], 0.05), val(ink.mark, D1), dome);
};

const chevronJet: Painter = (p, x, y, r, ink, clip) => {
  jet(p, x, y - 0.22 * r, 0.62 * r, ink.mark, clip);
  p.paint(stroke(p, x, y, r, [-0.56, 0.5, 0, 0.8, 0.56, 0.5], 0.11), val(ink.accent), clip);
};

const trio: Painter = (p, x, y, r, ink, clip) => {
  jet(p, x, y - 0.44 * r, 0.46 * r, ink.accent, clip);
  jet(p, x - 0.5 * r, y + 0.36 * r, 0.42 * r, ink.mark, clip);
  jet(p, x + 0.5 * r, y + 0.36 * r, 0.42 * r, ink.mark, clip);
};

const PAINTERS: Readonly<Record<EmblemId, Painter>> = {
  wave, sun, flake, mesa, trident, star, stars3, jet: jetUp, palm, sword, reticle, shield, laurelStar, helmet, chevronJet, trio,
};

/** Paints emblem `id` of radius r (frame units) at (x, y), inside `clip`. Too small to read → nothing. */
export function paintEmblem(p: Pix, id: EmblemId, x: number, y: number, r: number, ink: EmblemInk, clip: Mask): void {
  if (r * p.k < 3.2) return;
  PAINTERS[id](p, x, y, r, ink, clip);
}
