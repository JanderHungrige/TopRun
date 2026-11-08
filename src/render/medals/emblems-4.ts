import { path } from '../pixel/path';
import { union } from '../pixel/raster';
import { map, quadPts, solid, stroke, val, type Painter } from './emblem-kit';
import { D1, L1 } from './palette';

// Map 6's medal emblems (doc 85): a boot print, a palm tree (`palmtree`; `palm` is the off-duty star's), a reed-fringed eye, a step pyramid, a hive's cells and a
// walking mech — the same unit-square drawing as emblems.ts.

/** A boot print in the mud (the Landing Zone). */
const boot: Painter = (p, x, y, r, ink, clip) => {
  const sole = p.oval(x, y - 0.2 * r, 0.42 * r, 0.56 * r);
  const heel = p.oval(x + 0.04 * r, y + 0.62 * r, 0.3 * r, 0.26 * r);
  solid(p, union(sole, heel), ink.mark, x, y, r, clip);
  for (const cy of [-0.5, -0.2, 0.1]) p.paint(p.shape(path().rect(x - 0.3 * r, y + cy * r, 0.6 * r, 0.08 * r)), val(ink.accent), clip);
};

/** A palm tree (the Rainforest Canopy). */
const palmtree: Painter = (p, x, y, r, ink, clip) => {
  let m = stroke(p, x, y, r, quadPts(0.1, 0.92, -0.1, 0.2, 0, -0.5), 0.14);
  for (const [ex, ey] of [[-0.86, -0.2], [-0.6, -0.86], [0.6, -0.86], [0.86, -0.2], [0, -0.96]] as const) {
    m = union(m, stroke(p, x, y, r, quadPts(0, -0.5, (ex * 0.6), -0.9, ex, ey), 0.12));
  }
  solid(p, m, ink.mark, x, y, r, clip);
  for (const cx of [-0.1, 0.12]) p.paint(p.oval(x + cx * r, y - 0.42 * r, 0.1 * r, 0.1 * r), val(ink.accent), clip);
};

/** A reptile's eye between reeds (the Mangrove Swamp). */
const eye: Painter = (p, x, y, r, ink, clip) => {
  solid(p, p.oval(x, y, 0.82 * r, 0.46 * r), ink.mark, x, y, r, clip);
  p.paint(p.oval(x, y, 0.4 * r, 0.4 * r), val(ink.accent), clip);
  p.paint(p.shape(path().rect(x - 0.05 * r, y - 0.36 * r, 0.1 * r, 0.72 * r)), val(ink.mark, D1), clip);
  for (const sx of [-0.8, 0.8]) p.paint(stroke(p, x, y, r, [sx, 0.96, sx * 0.9, 0.4], 0.08), val(ink.accent, D1), clip);
};

/** A stepped temple pyramid (the Temple Ruins). */
const pyramid: Painter = (p, x, y, r, ink, clip) => {
  let m = p.shape(path().rect(x - 0.86 * r, y + 0.5 * r, 1.72 * r, 0.32 * r));
  m = union(m, p.shape(path().rect(x - 0.62 * r, y + 0.18 * r, 1.24 * r, 0.34 * r)));
  m = union(m, p.shape(path().rect(x - 0.4 * r, y - 0.16 * r, 0.8 * r, 0.36 * r)));
  m = union(m, p.shape(path().rect(x - 0.2 * r, y - 0.5 * r, 0.4 * r, 0.36 * r)));
  solid(p, m, ink.mark, x, y, r, clip);
  p.paint(p.shape(path().rect(x - 0.08 * r, y + 0.5 * r, 0.16 * r, 0.32 * r)), val(ink.accent), clip);
};

/** Six cells of a hive round a glowing one (the Hive). */
const hive: Painter = (p, x, y, r, ink, clip) => {
  const cell = (cx: number, cy: number, s: number): ReturnType<typeof p.shape> =>
    p.shape(path().lines(map(x, y, r, [cx - s, cy, cx - s / 2, cy - s * 0.87, cx + s / 2, cy - s * 0.87, cx + s, cy, cx + s / 2, cy + s * 0.87, cx - s / 2, cy + s * 0.87])).close());
  let m = cell(0, 0, 0.3);
  for (let k = 0; k < 6; k++) m = union(m, cell(Math.cos((k * Math.PI) / 3) * 0.56, Math.sin((k * Math.PI) / 3) * 0.56, 0.24));
  solid(p, m, ink.mark, x, y, r, clip);
  p.paint(cell(0, 0, 0.2), val(ink.accent, L1), clip);
};

/** A walking mech (the Jungle Medal). */
const mech: Painter = (p, x, y, r, ink, clip) => {
  let m = p.shape(path().rect(x - 0.44 * r, y - 0.62 * r, 0.88 * r, 0.6 * r));
  m = union(m, stroke(p, x, y, r, [-0.24, 0, -0.42, 0.42, -0.24, 0.86], 0.14));
  m = union(m, stroke(p, x, y, r, [0.24, 0, 0.42, 0.42, 0.24, 0.86], 0.14));
  m = union(m, p.shape(path().rect(x + 0.4 * r, y - 0.44 * r, 0.5 * r, 0.16 * r)));
  solid(p, m, ink.mark, x, y, r, clip);
  p.paint(p.shape(path().rect(x + 0.04 * r, y - 0.52 * r, 0.3 * r, 0.16 * r)), val(ink.accent), clip);
};

export const JUNGLE_PAINTERS = { boot, palmtree, eye, pyramid, hive, mech } as const;
