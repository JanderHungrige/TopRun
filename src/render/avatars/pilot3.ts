import { PAL, type Ramp } from '../pixel/palette';
import { path, type Path } from '../pixel/path';
import type { Pix } from '../pixel/raster';
import { L1, quadPts, strand } from '../portraits/parts';
import type { Rig } from '../portraits/types';
import { clumps, hairPiece, sheen } from './hair-kit';
import { drawFace, KID_HEAD, type FaceArt } from './head';
import { flightSuit, moods, roundPatch, type AvatarArt, type HairArt } from './kit';
import { litPiece } from './light';
import { SKIES } from './skies';

/**
 * Pilot 3 (doc 08 / 29): thick, tousled honey-copper hair with a heavy fringe swept to the right over the brows,
 * flyaway strands on the crown and the left ear lobe showing; a round face with warm, ruddy cheeks; relaxed
 * hazel-brown eyes; a cheeky half-smirk; the head tilted towards the viewer's left. Striped aviator scarf. Dusk.
 */

const SKIN = PAL.skinPale;
const HAIR = PAL.hairStrawberry;
const SCARF = PAL.teeth;
/** The scarf's off-white wool has only four tones (the teeth ramp). */
const CLOTH: readonly number[] = [1, 2, 3, 3];
const STRIPES = [PAL.red[3] ?? 0, PAL.navy[3] ?? 0, PAL.green[2] ?? 0] as const;

const FACE: FaceArt = {
  head: { ...KID_HEAD, temple: 14.8, cheek: 15.8, cheekY: 46, jaw: 13, chin: 6.2, chinY: 65.4 },
  skin: SKIN,
  eye: { x: 7.4, y: 43.8, w: 6.4, h: 2.4, iris: PAL.irisHazel, lid: PAL.hairStrawberry[0] ?? 0 },
  brow: { x0: 3, x1: 11.4, y: 38.8, th: 1.4, color: HAIR[1] ?? 0, attitude: 0.3 },
  nose: { y0: 43.4, tip: 51.8, w: 2 },
  mouth: { y: 58, w: 4.6, line: SKIN[1] ?? 0, upper: SKIN[2] ?? 0, lower: PAL.rose[2] ?? 0, smirk: 3 },
  warmth: { tint: PAL.rose[3] ?? 0, level: 1.2 },
};

/** Tufts across the crown, then the fringe from the right side across the forehead (long over the right eye's
 *  corner, shorter over the left brow) ending above the left ear. */
const CROWN: readonly number[] = [-6.6, 9.8, -3, 12.8, 1, 8.4, 4.8, 12.2, 10, 9.4, 11.8, 13.4, 16.6, 13.4];
const FRINGE: readonly number[] = [
  23.2, 50, 23.6, 56.4, 19.6, 51.6, 18, 57, 15.2, 47.6, 13.8, 46, 12, 38.6, 9.8, 42, 7.4, 37, 4.8, 41.2, 2.4, 36.2,
  -0.6, 40.2, -3, 35.6, -5.8, 40, -8.4, 35.4, -11, 39.4, -13.4, 36, -15.6, 41, -18, 39.6, -19.6, 43.6, -21.6, 44.6,
];

const mopShape = (): Path => path().move(-21.6, 44.6).cubic(-25.4, 32, -22.4, 18, -9.6, 13).lines(CROWN)
  .cubic(22, 16, 25.6, 28, 22.6, 47).lines(FRINGE).close();

function mopFront(p: Pix, h: Ramp): void {
  const m = hairPiece(p, mopShape(), h);
  sheen(p, m, h, [-15, 23, -6, 15.4, 6, 15]);
  clumps(p, m, h, [[-1, 14, -3, 27, -8, 38], [3, 13, 5, 27, 2, 39], [8, 14, 12.6, 26, 9.6, 41], [15, 17, 20, 29, 19, 50], [-9, 18, -15, 25, -17, 40]],
    [[-6, 16, -13, 22, -16.4, 36], [2, 17, 8, 23, 11, 36]]);
  p.paint(p.thick(quadPts([-1.2, 11.2, -4.4, 6.4, 0.4, 5]), 0.9), h[3] ?? 0); // a cowlick that will not lie down
  if (p.k >= 0.7) {
    strand(p, [4, 10, 6.4, 6, 9.6, 5.4], h[L1] ?? 0); // flyaway strands
    strand(p, [-9, 11.4, -12.4, 7.4, -15, 8], h[L1] ?? 0);
  }
}

/** The tousled mop with a heavy fringe of pilot 3 in any colour (also the builder's "mop"). */
export const MOP: HairArt = {
  back: (p, h) => {
    hairPiece(p, path().move(-21, 52).cubic(-26, 38, -25, 17, -11, 12.4).cubic(-2, 9, 13, 9.4, 19.6, 14.6)
      .cubic(27, 21, 26.6, 40, 21, 56).close(), h);
  },
  front: mopFront,
};

function head(p: Pix, r: Rig): void {
  MOP.back?.(p, HAIR, SKIN);
  drawFace(p, r, FACE);
  MOP.front(p, HAIR, SKIN);
}

/** One end of the scarf hanging from the knot at angle `a`, striped, with a fringe. */
function tail(p: Pix, x: number, y: number, a: number, len: number): void {
  const c = Math.cos(a);
  const s = Math.sin(a);
  const at = (u: number, v: number): [number, number] => [x + u * c - v * s, y + u * s + v * c];
  const m = p.shape(path().move(...at(-3, 0)).line(...at(3, 0)).line(...at(3.4, len)).line(...at(-2.8, len)).close());
  litPiece(p, m, SCARF, { cx: x - 3, cy: y, rx: 6, ry: len + 4 }, { tones: CLOTH });
  const bands = p.k >= 0.7 ? [STRIPES[0], STRIPES[1]] : [STRIPES[0]];
  for (let y0 = 3; y0 < len - 3; y0 += 6.5) bands.forEach((col, i) => p.line(...at(-3, y0 + i * 1.6), ...at(3.2, y0 + i * 1.6), col, m));
}

/** The striped aviator scarf (pilot 3; also the builder's "scarf"), its tails fluttering between two frames. */
export function scarf(p: Pix, phase: number): void {
  const band = p.shape(path().move(-13, 74.2).quad(0, 82.6, 13, 74.2).line(14, 81).quad(0, 90, -14, 81).close());
  litPiece(p, band, SCARF, { cx: -6, cy: 76, rx: 22, ry: 12 }, { tones: CLOTH, lo: -0.4 });
  const rows = p.k >= 0.9 ? STRIPES : [STRIPES[0]];
  rows.forEach((c, i) => p.paint(p.thick(quadPts([-14.6, 77.2 + i * 1.6, 0, 85.6 + i * 1.6, 14.6, 77.2 + i * 1.6]), 0), c, band));
  const flutter = phase === 1 ? 0.05 : -0.03;
  tail(p, -6.4, 84.2, -0.1 + flutter, 14);
  tail(p, -8.6, 83.6, 0.24 + flutter, 19);
  const knot = p.oval(-7.6, 83.8, 3.4, 2.8, 0.3);
  litPiece(p, knot, SCARF, { cx: -9, cy: 82.6, rx: 4, ry: 3.4 }, { tones: CLOTH });
  p.line(-10.2, 84, -5, 83, STRIPES[0], knot);
}

function body(p: Pix, r: Rig): void {
  flightSuit(p, { ramp: PAL.sage, tee: PAL.teeth[3] ?? 0 }, SKIN);
  roundPatch(p, -26, 99.5, 4.8, PAL.navy[3] ?? 0, PAL.red[3] ?? 0);
  p.fill(path().lines([-29, 101, -26, 96.6, -23, 101, -26, 99.4]).close(), PAL.white[3] ?? 0);
  scarf(p, r.phase);
}

export const PILOT3: AvatarArt = {
  sky: SKIES.sunset,
  moods: moods(0.3, { hood: 0.1 }),
  body,
  head,
  tilt: -0.2,
  face: FACE,
};
