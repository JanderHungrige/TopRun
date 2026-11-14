import { path } from '../pixel/path';
import { union } from '../pixel/raster';
import { map, quadPts, solid, stroke, val, type Painter } from './emblem-kit';
import { D1, L1 } from './palette';

// Map 7's medal emblems (doc 110): a tuft of grass, a salt crystal, a butte (`butte`; `mesa` is the canyon's), a standing
// stone, a ringed crater and a tank — the same unit-square drawing as emblems.ts.

/** A tuft of tall grass bending in the wind (the Sea of Grass). */
const tuft: Painter = (p, x, y, r, ink, clip) => {
  let m = stroke(p, x, y, r, quadPts(0, 0.9, 0.05, 0.1, 0.3, -0.9), 0.12);
  for (const [bx, tx, ty] of [[-0.2, -0.7, -0.5], [0.15, 0.8, -0.6], [-0.1, -0.3, -0.86], [0.1, 0.62, -0.1]] as const) {
    m = union(m, stroke(p, x, y, r, quadPts(bx, 0.9, (bx + tx) / 2 + 0.1, 0.2, tx, ty), 0.1));
  }
  solid(p, m, ink.mark, x, y, r, clip);
  for (const [cx, cy] of [[0.3, -0.9], [-0.3, -0.86]] as const) p.paint(p.oval(x + cx * r, y + cy * r, 0.09 * r, 0.14 * r), val(ink.accent), clip);
};

/** A six-sided salt crystal with its facets (the Salt Flats). */
const crystal: Painter = (p, x, y, r, ink, clip) => {
  const outline = p.shape(path().lines(map(x, y, r, [0, -0.9, 0.5, -0.44, 0.5, 0.44, 0, 0.9, -0.5, 0.44, -0.5, -0.44])).close());
  solid(p, outline, ink.mark, x, y, r, clip);
  const face = p.shape(path().lines(map(x, y, r, [0, -0.9, 0.5, -0.44, 0, 0, -0.5, -0.44])).close());
  p.paint(face, val(ink.accent, L1), clip);
  p.paint(stroke(p, x, y, r, [0, 0, 0, 0.9], 0.05), val(ink.mark, D1), clip);
};

/** A flat-topped butte over the dust (the Red Badlands). */
const butte: Painter = (p, x, y, r, ink, clip) => {
  let m = p.shape(path().lines(map(x, y, r, [-0.5, -0.5, 0.42, -0.5, 0.62, 0.5, -0.7, 0.5])).close());
  m = union(m, p.shape(path().rect(x - 0.92 * r, y + 0.46 * r, 1.84 * r, 0.3 * r)));
  solid(p, m, ink.mark, x, y, r, clip);
  for (const cy of [-0.2, 0.12]) p.paint(p.shape(path().rect(x - 0.56 * r, y + cy * r, 1.1 * r, 0.06 * r)), val(ink.mark, D1), clip);
  p.paint(p.oval(x + 0.6 * r, y - 0.66 * r, 0.18 * r, 0.18 * r), val(ink.accent), clip);
};

/** A standing stone with a carved ring (the Barrow Fields). */
const stone: Painter = (p, x, y, r, ink, clip) => {
  let m = p.shape(path().move(x - 0.36 * r, y + 0.86 * r).line(x - 0.42 * r, y - 0.5 * r).quad(x, y - 1.0 * r, x + 0.4 * r, y - 0.56 * r).line(x + 0.36 * r, y + 0.86 * r).close());
  m = union(m, p.shape(path().rect(x - 0.86 * r, y + 0.74 * r, 1.72 * r, 0.18 * r)));
  solid(p, m, ink.mark, x, y, r, clip);
  p.paint(p.oval(x, y - 0.1 * r, 0.22 * r, 0.22 * r), val(ink.accent), clip);
  p.paint(p.oval(x, y - 0.1 * r, 0.1 * r, 0.1 * r), val(ink.mark), clip);
};

/** A crater with its glowing ring (the Crater). */
const crater: Painter = (p, x, y, r, ink, clip) => {
  solid(p, p.oval(x, y + 0.14 * r, 0.9 * r, 0.52 * r), ink.mark, x, y, r, clip);
  p.paint(p.oval(x, y + 0.2 * r, 0.6 * r, 0.3 * r), val(ink.mark, D1), clip);
  p.paint(stroke(p, x, y, r, quadPts(-0.94, -0.3, 0, -0.9, 0.94, -0.3), 0.08), val(ink.accent), clip);
  p.paint(p.oval(x, y + 0.2 * r, 0.22 * r, 0.12 * r), val(ink.accent, L1), clip);
};

/** A tank side on, gun forward (the Steppe Medal). */
const tank: Painter = (p, x, y, r, ink, clip) => {
  let m = p.shape(path().lines(map(x, y, r, [-0.86, 0.1, 0.86, 0.1, 0.72, 0.62, -0.72, 0.62])).close());
  m = union(m, p.shape(path().lines(map(x, y, r, [-0.4, 0.1, -0.3, -0.3, 0.32, -0.3, 0.42, 0.1])).close()));
  m = union(m, p.shape(path().rect(x + 0.3 * r, y - 0.22 * r, 0.64 * r, 0.12 * r)));
  solid(p, m, ink.mark, x, y, r, clip);
  for (const cx of [-0.54, -0.18, 0.18, 0.54]) p.paint(p.oval(x + cx * r, y + 0.42 * r, 0.12 * r, 0.12 * r), val(ink.accent), clip);
};

export const STEPPE_PAINTERS = { tuft, crystal, butte, stone, crater, tank } as const;
