import { path } from '../pixel/path';
import { minus, union } from '../pixel/raster';
import { map, quadPts, solid, stroke, val, type Painter } from './emblem-kit';
import { starPath } from './metal';
import { D1, L1 } from './palette';

// The world medals' emblems (doc 62): rig, peak, crescent moon, lightning, volcano, orbit, asteroid, ringed planet,
// rotor and rocket — the same unit-square drawing as emblems.ts.

/** An oil rig on stilts above two waves (North Sea). */
const rig: Painter = (p, x, y, r, ink, clip) => {
  let m = p.shape(path().rect(x - 0.62 * r, y - 0.18 * r, 1.24 * r, 0.22 * r));
  for (const lx of [-0.46, 0.46]) m = union(m, stroke(p, x, y, r, [lx, 0.04, lx * 0.8, 0.62], 0.08));
  m = union(m, stroke(p, x, y, r, [0.2, -0.18, 0.2, -0.86, 0.48, -0.86], 0.07));
  solid(p, m, ink.mark, x, y, r, clip);
  p.paint(p.oval(x + 0.52 * r, y - 0.92 * r, 0.12 * r, 0.12 * r), val(ink.accent), clip);
  p.paint(stroke(p, x, y, r, quadPts(-0.9, 0.78, 0, 0.6, 0.9, 0.78), 0.08), val(ink.accent), clip);
};

/** A snow-capped peak (Roof of the World, the highland passes). */
const peak: Painter = (p, x, y, r, ink, clip) => {
  const m = p.shape(path().lines(map(x, y, r, [-0.96, 0.7, -0.3, -0.36, 0, -0.06, 0.34, -0.8, 0.96, 0.7])).close());
  solid(p, m, ink.mark, x, y, r, clip);
  const snow = p.shape(path().lines(map(x, y, r, [0.34, -0.8, 0.12, -0.36, 0.26, -0.44, 0.4, -0.34, 0.56, -0.44])).close());
  p.paint(snow, val(ink.accent), clip);
  p.paint(p.border(m, 'ul'), val(ink.mark, L1), clip);
};

/** A crescent moon with a small star (desert night, the lunar front). */
const moon: Painter = (p, x, y, r, ink, clip) => {
  const m = minus(p.oval(x - 0.08 * r, y, 0.7 * r, 0.7 * r), p.oval(x + 0.26 * r, y - 0.16 * r, 0.58 * r, 0.58 * r));
  solid(p, m, ink.mark, x, y, 0.7 * r, clip);
  p.paint(p.shape(path().lines(starPath(x + 0.5 * r, y - 0.46 * r, 0.26 * r, 0.42)).close()), val(ink.accent), clip);
};

/** A lightning bolt out of a cloud (Thunderhead). */
const bolt: Painter = (p, x, y, r, ink, clip) => {
  const cloud = union(union(p.oval(x - 0.36 * r, y - 0.5 * r, 0.36 * r, 0.26 * r), p.oval(x + 0.1 * r, y - 0.62 * r, 0.42 * r, 0.32 * r)), p.oval(x + 0.5 * r, y - 0.46 * r, 0.32 * r, 0.24 * r));
  p.paint(cloud, val(ink.mark, D1), clip);
  const b = p.shape(path().lines(map(x, y, r, [0.06, -0.3, -0.34, 0.24, -0.02, 0.24, -0.22, 0.96, 0.34, 0.06, 0.02, 0.06, 0.22, -0.3])).close());
  solid(p, b, ink.accent, x, y, r, clip);
};

/** A volcano with a plume and glowing lava (Ash Island). */
const volcano: Painter = (p, x, y, r, ink, clip) => {
  const cone = p.shape(path().lines(map(x, y, r, [-0.96, 0.8, -0.24, -0.2, 0.24, -0.2, 0.96, 0.8])).close());
  solid(p, cone, ink.mark, x, y, r, clip);
  p.paint(stroke(p, x, y, r, [-0.04, -0.2, -0.14, 0.24, 0.02, 0.56], 0.09), val(ink.accent), cone);
  for (const [px, py, pr] of [[0, -0.42, 0.18], [0.2, -0.66, 0.22], [-0.06, -0.86, 0.16]] as const) p.paint(p.oval(x + px * r, y + py * r, pr * r, pr * r), val(ink.mark, D1), clip);
};

/** A planet with an orbit ring and a satellite on it (Low Orbit). */
const orbit: Painter = (p, x, y, r, ink, clip) => {
  solid(p, p.oval(x, y, 0.44 * r, 0.44 * r), ink.mark, x, y, 0.44 * r, clip);
  const ring = minus(p.oval(x, y, 0.92 * r, 0.36 * r), p.oval(x, y, 0.8 * r, 0.26 * r));
  p.paint(ring, val(ink.accent), clip);
  p.paint(p.oval(x + 0.82 * r, y - 0.16 * r, 0.12 * r, 0.12 * r), val(ink.accent, L1), clip);
};

/** A cratered asteroid with a small one behind (Asteroid Belt). */
const rock: Painter = (p, x, y, r, ink, clip) => {
  p.paint(p.oval(x + 0.6 * r, y - 0.6 * r, 0.2 * r, 0.16 * r), val(ink.accent), clip);
  const m = p.shape(path().lines(map(x, y, r, [-0.7, -0.2, -0.3, -0.66, 0.36, -0.56, 0.74, -0.06, 0.6, 0.52, 0.02, 0.76, -0.56, 0.5])).close());
  solid(p, m, ink.mark, x, y, r, clip);
  for (const [cx, cy, cr] of [[-0.2, -0.1, 0.16], [0.28, 0.22, 0.12], [0.2, -0.34, 0.08]] as const) p.paint(p.oval(x + cx * r, y + cy * r, cr * r, cr * r), val(ink.mark, D1), clip);
};

/** A ringed gas giant (Ring Giant). */
const planet: Painter = (p, x, y, r, ink, clip) => {
  const body = p.oval(x, y, 0.52 * r, 0.52 * r);
  solid(p, body, ink.mark, x, y, 0.52 * r, clip);
  p.paint(stroke(p, x, y, r, [-0.46, -0.12, 0.46, -0.2], 0.06), val(ink.mark, D1), body);
  const ring = minus(p.oval(x, y + 0.04 * r, 0.98 * r, 0.24 * r), p.oval(x, y + 0.04 * r, 0.84 * r, 0.14 * r));
  p.paint(minus(ring, p.shape(path().rect(x - r, y - r, 2 * r, 0.98 * r))), val(ink.accent), clip);
};

/** A four-blade rotor seen from above (the Low Level Medal). */
const rotor: Painter = (p, x, y, r, ink, clip) => {
  let m = p.oval(x, y, 0.18 * r, 0.18 * r);
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2 + Math.PI / 4;
    m = union(m, stroke(p, x, y, r, [Math.cos(a) * 0.12, Math.sin(a) * 0.12, Math.cos(a) * 0.94, Math.sin(a) * 0.94], 0.12));
  }
  solid(p, m, ink.mark, x, y, r, clip);
  p.paint(p.oval(x, y, 0.09 * r, 0.09 * r), val(ink.accent), clip);
};

/** A rocket climbing with a flame (the Deep Space Medal). */
const rocket: Painter = (p, x, y, r, ink, clip) => {
  const body = p.shape(path().lines(map(x, y, r, [0, -0.96, 0.22, -0.56, 0.22, 0.4, -0.22, 0.4, -0.22, -0.56])).close());
  const fins = union(p.shape(path().lines(map(x, y, r, [0.22, 0.04, 0.48, 0.52, 0.22, 0.4])).close()), p.shape(path().lines(map(x, y, r, [-0.22, 0.04, -0.48, 0.52, -0.22, 0.4])).close()));
  solid(p, union(body, fins), ink.mark, x, y, r, clip);
  p.paint(p.oval(x, y - 0.3 * r, 0.1 * r, 0.1 * r), val(ink.accent), clip);
  p.paint(p.shape(path().lines(map(x, y, r, [-0.14, 0.44, 0.14, 0.44, 0, 0.96])).close()), val(ink.accent), clip);
};

export const EXTRA_PAINTERS = { rig, peak, moon, bolt, volcano, orbit, rock, planet, rotor, rocket } as const;
