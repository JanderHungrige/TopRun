import { path } from '../pixel/path';
import { minus, union } from '../pixel/raster';
import { map, quadPts, solid, stroke, val, type Painter } from './emblem-kit';
import { D1, L1 } from './palette';

// Map 5's medal emblems (doc 72): coral, kelp, anchor, a downward chevron, a glowing lure and a submarine — the same
// unit-square drawing as emblems.ts.

/** A branching coral head (Coral Reef). */
const coral: Painter = (p, x, y, r, ink, clip) => {
  let m = stroke(p, x, y, r, [0, 0.9, 0, 0.1], 0.16);
  for (const b of [[0, 0.3, -0.5, -0.2, -0.56, -0.7], [0, 0.1, 0.46, -0.36, 0.4, -0.86], [0, 0.4, 0.62, 0.06], [-0.3, 0.06, -0.08, -0.6]] as const) {
    m = union(m, stroke(p, x, y, r, b, 0.13));
  }
  solid(p, m, ink.mark, x, y, r, clip);
  for (const [cx, cy] of [[-0.56, -0.74], [0.4, -0.9], [0.62, 0.04], [-0.08, -0.64]] as const) p.paint(p.oval(x + cx * r, y + cy * r, 0.11 * r, 0.11 * r), val(ink.accent), clip);
};

/** Two swaying kelp fronds with leaf blades (Kelp Forest). */
const kelp: Painter = (p, x, y, r, ink, clip) => {
  let m = union(stroke(p, x, y, r, quadPts(-0.3, 0.92, -0.6, 0, -0.2, -0.9), 0.1), stroke(p, x, y, r, quadPts(0.26, 0.92, 0.56, 0.1, 0.24, -0.76), 0.1));
  for (const [cx, cy, s] of [[-0.48, 0.3, -1], [-0.36, -0.36, 1], [0.48, 0.4, 1], [0.38, -0.3, -1]] as const) {
    m = union(m, p.oval(x + (cx + s * 0.14) * r, y + cy * r, 0.16 * r, 0.07 * r));
  }
  solid(p, m, ink.mark, x, y, r, clip);
  p.paint(p.shape(path().rect(x - 0.9 * r, y + 0.84 * r, 1.8 * r, 0.14 * r)), val(ink.accent), clip);
};

/** A ship's anchor (Wreck Field). */
const anchor: Painter = (p, x, y, r, ink, clip) => {
  let m = stroke(p, x, y, r, [0, -0.6, 0, 0.72], 0.14);
  m = union(m, stroke(p, x, y, r, [-0.36, -0.36, 0.36, -0.36], 0.12));
  m = union(m, stroke(p, x, y, r, quadPts(-0.74, 0.3, -0.5, 0.92, 0, 0.78), 0.12));
  m = union(m, stroke(p, x, y, r, quadPts(0.74, 0.3, 0.5, 0.92, 0, 0.78), 0.12));
  m = union(m, minus(p.oval(x, y - 0.78 * r, 0.2 * r, 0.2 * r), p.oval(x, y - 0.78 * r, 0.1 * r, 0.1 * r)));
  solid(p, m, ink.mark, x, y, r, clip);
  for (const sx of [-1, 1]) p.paint(p.shape(path().lines(map(x, y, r, [sx * 0.74, 0.3, sx * 0.86, 0.16, sx * 0.62, 0.18])).close()), val(ink.accent), clip);
};

/** Two chevrons pointing down into the dark (the Trench). */
const chevron: Painter = (p, x, y, r, ink, clip) => {
  const upper = stroke(p, x, y, r, [-0.8, -0.7, 0, 0.0, 0.8, -0.7], 0.2);
  const lower = stroke(p, x, y, r, [-0.8, -0.05, 0, 0.65, 0.8, -0.05], 0.2);
  solid(p, upper, ink.mark, x, y, r, clip);
  p.paint(lower, val(ink.accent), clip);
};

/** An angler's glowing lure on its stalk (the Abyss). */
const lure: Painter = (p, x, y, r, ink, clip) => {
  p.paint(stroke(p, x, y, r, quadPts(-0.6, 0.86, -0.5, -0.4, 0.2, -0.36), 0.08), val(ink.mark, D1), clip);
  p.paint(p.oval(x + 0.3 * r, y - 0.3 * r, 0.5 * r, 0.5 * r), val(ink.accent, D1), clip);
  solid(p, p.oval(x + 0.3 * r, y - 0.3 * r, 0.3 * r, 0.3 * r), ink.accent, x + 0.3 * r, y - 0.3 * r, 0.3 * r, clip);
  p.paint(p.oval(x + 0.22 * r, y - 0.4 * r, 0.1 * r, 0.1 * r), val(ink.accent, L1), clip);
};

/** A submarine seen from the side (the Deep Water Medal). */
const sub: Painter = (p, x, y, r, ink, clip) => {
  const hull = p.oval(x, y + 0.12 * r, 0.92 * r, 0.3 * r);
  const sail = p.shape(path().lines(map(x, y, r, [-0.22, -0.16, -0.16, -0.5, 0.18, -0.5, 0.24, -0.16])).close());
  const tail = p.shape(path().lines(map(x, y, r, [-0.78, 0.1, -1, -0.24, -1, 0.44])).close());
  solid(p, union(union(hull, sail), tail), ink.mark, x, y, r, clip);
  for (const cx of [-0.3, 0.1, 0.5]) p.paint(p.oval(x + cx * r, y + 0.1 * r, 0.06 * r, 0.06 * r), val(ink.accent), clip);
};

export const DEEP_PAINTERS = { coral, kelp, anchor, chevron, lure, sub } as const;
