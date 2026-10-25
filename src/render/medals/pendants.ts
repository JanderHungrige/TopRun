import { path, type Path } from '../pixel/path';
import { and, minus, union, type Mask, type Pix } from '../pixel/raster';
import type { Design } from './designs';
import { paintEmblem, type EmblemInk } from './emblems';
import { bevel, enamel, facet, frameOf, glint, rim, starPath } from './metal';
import { D1, D2, hexRamp, L1, L2, type Ramp } from './palette';

// Medal art (doc 25): the metal bodies hanging from the ribbon — disc, faceted star, enamelled cross, wings,
// badge — plus the campaign clasp. Frame units, medal centre line x = 0; each returns its metal mask (for the
// shine sweep).

export interface Paints extends EmblemInk {
  metal: Ramp;
  enamel: Ramp;
}

/** Enough art pixels for fine lines (feathers, beads, rivets). */
const fine = (p: Pix): boolean => p.k >= 0.45;

/** Round medal: bevelled rim, recessed enamel field, emblem; rivets or a bead ring on the rim. */
export function disc(p: Pix, pt: Paints, d: Design, cy: number, r: number): Mask {
  const outer = p.oval(0, cy, r, r);
  const fieldR = r * 0.76;
  const field = p.oval(0, cy, fieldR, fieldR);
  const metal = minus(outer, field);
  bevel(p, outer, pt.metal, 0, cy, r);
  rim(p, outer, pt.metal);
  enamel(p, field, pt.enamel);
  const lip = minus(p.oval(0, cy, fieldR + 1 / p.k, fieldR + 1 / p.k), field);
  for (let i = 0; i < lip.length; i++) {
    if (!lip[i]) continue;
    const [x, y] = frameOf(p, i);
    p.data[i] = pt.metal[x + y - cy < 0 ? D2 : L2] ?? 0;
  }
  if (fine(p)) {
    const n = d.rivets ? 10 : 0;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 - Math.PI / 2;
      const x = Math.cos(a) * (r + fieldR) / 2;
      const y = cy + Math.sin(a) * (r + fieldR) / 2;
      p.paint(p.oval(x, y, 1.2, 1.2), pt.metal[D2] ?? 0);
      p.set(p.col(x - 0.4), p.row(y - 0.4), pt.metal[L2] ?? 0);
    }
  }
  paintEmblem(p, d.emblem, 0, cy, fieldR * 0.8, pt, field);
  glint(p, -r * 0.55, cy - r * 0.62, pt.metal);
  return metal;
}

/** Short rays between the points (glory) or the minor diagonal points of a 4-point compass star. */
function minorRays(p: Pix, pt: Paints, cy: number, R: number, n: number): Mask {
  let m = p.blank();
  for (let i = 0; i < n; i++) {
    const a = -Math.PI / 2 + ((i + 0.5) * Math.PI * 2) / n;
    const len = n === 4 ? R * 0.56 : R * 0.84;
    const w = n === 4 ? 0.28 : 0.17;
    const tip = [Math.cos(a) * len, cy + Math.sin(a) * len];
    m = union(m, facet(p, [0, cy, Math.cos(a - w) * R * 0.3, cy + Math.sin(a - w) * R * 0.3, ...tip], pt.metal, a - Math.PI / 2));
    m = union(m, facet(p, [0, cy, Math.cos(a + w) * R * 0.3, cy + Math.sin(a + w) * R * 0.3, ...tip], pt.metal, a + Math.PI / 2));
  }
  return m;
}

/** Faceted star: every point is two facets lit by which way they face; enamel centre with an emblem. */
export function star(p: Pix, pt: Paints, d: Design, cy: number, R: number): Mask {
  const n = d.points ?? 5;
  const inner = n >= 8 ? 0.36 : n === 6 ? 0.5 : n === 4 ? 0.27 : 0.42;
  let metal = d.rays === 'glory' || n === 4 ? minorRays(p, pt, cy, R, n) : p.blank();
  for (let i = 0; i < n; i++) {
    const a = -Math.PI / 2 + (i * Math.PI * 2) / n;
    const len = d.rays === 'radiant' && i % 2 === 1 ? R * 0.7 : n === 4 && i % 2 === 1 ? R * 0.8 : R;
    const tip = [Math.cos(a) * len, cy + Math.sin(a) * len];
    const side = Math.PI / n;
    for (const s of [-1, 1]) {
      const b = a + s * side;
      metal = union(metal, facet(p, [0, cy, Math.cos(b) * R * inner, cy + Math.sin(b) * R * inner, ...tip], pt.metal, a + (s * Math.PI) / 2));
    }
  }
  const cr = R * (n >= 8 ? 0.42 : 0.37);
  const boss = p.oval(0, cy, cr + 1.4, cr + 1.4);
  bevel(p, boss, pt.metal, 0, cy, cr + 1.4);
  const field = p.oval(0, cy, cr, cr);
  enamel(p, field, pt.enamel);
  paintEmblem(p, d.emblem, 0, cy, cr * 0.82, pt, field);
  glint(p, -R * 0.12, cy - R * 0.62, pt.metal);
  return minus(union(metal, boss), field);
}

/** A point `u` along / `v` across a cross arm pointing along angle a. */
function armPoint(cy: number, a: number, u: number, v: number): [number, number] {
  return [u * Math.cos(a) - v * Math.sin(a), cy + u * Math.sin(a) + v * Math.cos(a)];
}

/** One flared cross arm with a slightly convex end, pointing along angle a. */
function armPath(cy: number, a: number, w0: number, w1: number, from: number, to: number): number[] {
  const pt = (u: number, v: number): [number, number] => armPoint(cy, a, u, v);
  return [...pt(from, -w0), ...pt(to - 1, -w1), ...pt(to, -w1 * 0.5), ...pt(to + 0.4, 0), ...pt(to, w1 * 0.5), ...pt(to - 1, w1), ...pt(from, w0)];
}

/** Cross with flared, ball-tipped arms in enamel on metal, diagonal rays and an enamelled medallion. */
export function cross(p: Pix, pt: Paints, d: Design, cy: number, L: number): Mask {
  let metal = p.blank();
  for (let i = 0; i < 4; i++) {
    const a = Math.PI / 4 + (i * Math.PI) / 2;
    const tip = [Math.cos(a) * L * 0.74, cy + Math.sin(a) * L * 0.74];
    metal = union(metal, facet(p, [0, cy, Math.cos(a - 0.2) * L * 0.3, cy + Math.sin(a - 0.2) * L * 0.3, ...tip], pt.metal, a - Math.PI / 2));
    metal = union(metal, facet(p, [0, cy, Math.cos(a + 0.2) * L * 0.3, cy + Math.sin(a + 0.2) * L * 0.3, ...tip], pt.metal, a + Math.PI / 2));
  }
  let arms = p.blank();
  let enamelM = p.blank();
  const reach = L - 3;
  for (let i = 0; i < 4; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 2;
    arms = union(arms, p.shape(path().lines(armPath(cy, a, 3.8, 7.4, 0, reach)).close()));
    arms = union(arms, p.oval(...armPoint(cy, a, reach + 1.6, 0), 2.5, 2.5));
    enamelM = union(enamelM, p.shape(path().lines(armPath(cy, a, 1.9, 5.1, 6, reach - 2.2)).close()));
  }
  bevel(p, arms, pt.metal, 0, cy, L);
  rim(p, arms, pt.metal);
  enamel(p, enamelM, pt.enamel);
  const med = p.oval(0, cy, 9.8, 9.8);
  bevel(p, med, pt.metal, 0, cy, 9.8);
  rim(p, med, pt.metal, D2, L2);
  const field = p.oval(0, cy, 7.4, 7.4);
  enamel(p, field, d.field ? hexRamp(d.field) : pt.enamel);
  paintEmblem(p, d.emblem, 0, cy, 6.6, pt, field);
  glint(p, -L * 0.18, cy - L * 0.84, pt.metal);
  return minus(union(union(metal, arms), med), union(enamelM, field));
}

const FEATHERS = 6;

/** The wing's leading edge height at distance x from the centre line. */
const leadY = (cy: number, span: number, x: number): number => cy - 5 - Math.sin(((x - 5) / (span - 5)) * Math.PI * 0.62) * 8.5;

/** Where feather j's notch sits on the trailing edge (j = 0 at the tip … FEATHERS at the body). */
function notch(cy: number, span: number, j: number): [number, number] {
  const u = j / FEATHERS;
  return [span - u * (span - 6), leadY(cy, span, span) + 2 + u * (cy + 5 - leadY(cy, span, span) - 2)];
}

/** One wing (right side; mirrored with −1): leading edge up to the tip, a trailing edge of rounded feathers. */
function wingPath(cy: number, span: number, side: number): Path {
  const pa = path().move(5 * side, cy - 5);
  for (let i = 1; i <= 8; i++) {
    const x = 5 + ((span - 5) * i) / 8;
    pa.line(x * side, leadY(cy, span, x));
  }
  let [x0, y0] = notch(cy, span, 0);
  pa.line(x0 * side, y0);
  for (let j = 1; j <= FEATHERS; j++) {
    const [x1, y1] = notch(cy, span, j);
    pa.quad(((x0 + x1) / 2 + 0.8) * side, Math.max(y0, y1) + 3.6, x1 * side, y1);
    [x0, y0] = [x1, y1];
  }
  return pa.line(5 * side, cy + 5).close();
}

/** Feather lines from each notch up towards the leading edge, and the covert line(s) across. */
function featherLines(p: Pix, pt: Paints, w: Mask, cy: number, span: number, side: number, tiers: number): void {
  const ink = pt.metal[D1] ?? 0;
  for (let j = 1; j < FEATHERS; j++) {
    const [x, y] = notch(cy, span, j);
    p.paint(p.thick([x * side, y, (x + 2.6) * side, leadY(cy, span, x + 2.6) + 4.4], 0.3), ink, w);
  }
  for (let t = 1; t < tiers; t++) {
    const pts: number[] = [];
    for (let i = 0; i <= 8; i++) {
      const x = 6 + ((span - 6) * i) / 8;
      pts.push(x * side, leadY(cy, span, x) + 2.6 + t * 1.8 + (i / 8) * 1.2);
    }
    p.paint(p.thick(pts, 0.3), ink, w);
  }
}

/** Spread wings with feather tiers and an enamel boss (a star above it on the larger wings). */
export function wings(p: Pix, pt: Paints, d: Design, cy: number): Mask {
  const tiers = d.tiers ?? 2;
  const span = tiers >= 3 ? 31.5 : 28.5;
  let metal = p.blank();
  for (const side of [-1, 1]) {
    const w = p.shape(wingPath(cy, span, side));
    bevel(p, w, pt.metal, side * span * 0.4, cy - 8, span * 0.55);
    rim(p, w, pt.metal, D2, L1);
    if (fine(p)) featherLines(p, pt, w, cy, span, side, tiers);
    metal = union(metal, w);
  }
  if (tiers >= 3) metal = union(metal, starOnTop(p, pt, cy - 13));
  const boss = p.oval(0, cy, 7.6, 7.6);
  bevel(p, boss, pt.metal, 0, cy, 7.6);
  const field = p.oval(0, cy, 5.6, 5.6);
  enamel(p, field, pt.enamel);
  paintEmblem(p, d.emblem, 0, cy, 4.6, pt, field);
  glint(p, -span * 0.4, cy - 11, pt.metal);
  return minus(union(metal, boss), field);
}

function starOnTop(p: Pix, pt: Paints, y: number): Mask {
  const m = p.shape(path().lines(starPath(0, y, 5, 0.44)).close());
  bevel(p, m, pt.metal, 0, y, 5);
  return m;
}

/** Badge outline: a heater shield or a downward triangle, scaled about its centre. */
function badgePath(kind: Design['badge'], cy: number, s: number): number[] {
  const at = (pts: readonly number[]): number[] => pts.map((v, i) => (i % 2 === 0 ? v * s : cy + v * s));
  if (kind === 'triangle') return at([-18, -14, 18, -14, 2.4, 17, -2.4, 17]);
  const pts = [-14.5, -15, 14.5, -15, 14.5, 1];
  for (let i = 1; i <= 6; i++) {
    const t = i / 6;
    pts.push(14.5 * Math.cos((t * Math.PI) / 2), 1 + 18.5 * Math.sin((t * Math.PI) / 2) ** 1.3);
  }
  for (let i = 5; i >= 0; i--) {
    const t = i / 6;
    pts.push(-14.5 * Math.cos((t * Math.PI) / 2), 1 + 18.5 * Math.sin((t * Math.PI) / 2) ** 1.3);
  }
  return at(pts);
}

/** A pin badge: bevelled metal outline, inset enamel field, emblem. */
export function badge(p: Pix, pt: Paints, d: Design, cy: number): Mask {
  const eye = minus(p.oval(0, cy - 17.5, 2.6, 3.4), p.oval(0, cy - 17.8, 1.1, 1.6));
  bevel(p, eye, pt.metal, 0, cy - 17.5, 3);
  const outer = p.shape(path().lines(badgePath(d.badge, cy, 1)).close());
  const field = p.shape(path().lines(badgePath(d.badge, cy, 0.78)).close());
  bevel(p, outer, pt.metal, 0, cy, 18);
  rim(p, outer, pt.metal);
  enamel(p, field, pt.enamel);
  const tri = d.badge === 'triangle';
  paintEmblem(p, d.emblem, 0, cy - (tri ? 3.4 : 0.5), tri ? 11 : 11.5, pt, field);
  glint(p, -11, cy - 12, pt.metal);
  return union(eye, minus(outer, field));
}

/** The campaign clasp across the long ribbon: a bar with rivets. */
export function clasp(p: Pix, metal: Ramp, y: number): Mask {
  const m = union(p.shape(path().rect(-15.5, y - 3.8, 31, 7.6)), union(p.oval(-15.5, y, 2.6, 3.8), p.oval(15.5, y, 2.6, 3.8)));
  bevel(p, m, metal, 0, y, 9);
  rim(p, m, metal);
  const groove = p.shape(path().rect(-12, y - 1.2, 24, 2.4));
  p.paint(and(groove, m), metal[D1] ?? 0);
  p.paint(p.border(groove, 'd'), metal[L1] ?? 0);
  if (fine(p)) for (const x of [-13.5, 13.5]) p.paint(p.oval(x, y, 1, 1), metal[L2] ?? 0);
  return m;
}
