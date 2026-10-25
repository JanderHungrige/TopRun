import { PAL, type Ramp } from '../pixel/palette';
import { path, type Path } from '../pixel/path';
import type { Pix } from '../pixel/raster';
import { brows, eyes, mouth, nose, type Brows, type Eyes, type Mouth } from '../portraits/features';
import { part } from '../portraits/hands';
import { blush, D1, face, L1, L2, piece, quadPts, shaded, strand, type Face } from '../portraits/parts';
import type { Rig } from '../portraits/types';
import { flightSuit, moods, roundPatch, type AvatarArt, type HairArt } from './kit';
import { SKIES } from './skies';

/**
 * Pilot 3 in pixel art (doc 08 / 29): thick, tousled honey-copper hair with a heavy fringe swept to the right over
 * both brows and flyaway strands on the crown, the left ear peeking out; a round face with full, very rosy cheeks;
 * relaxed hazel eyes; a cheeky smirk; the head tilted towards the viewer's left. Striped aviator scarf. Dusk.
 */

const SKIN = PAL.skinPale;
const HAIR = PAL.hairStrawberry;
const FACE: Face = { w: 18.8, jaw: 13.4, top: 26, chin: 74.2 };
const EYES: Eyes = { x: 7.6, y: 53, rx: 4, ry: 2.9, iris: PAL.irisHazel };
const BROWS: Brows = { x0: 3, x1: 12, y: 46.4, th: 1.7, color: HAIR[1] ?? 0 };
const MOUTH: Mouth = { y: 66.6, w: 5.4, smirk: 2.4, lower: PAL.rose[2] ?? 0 };
const SCARF = PAL.teeth;
const STRIPES = [PAL.red[3] ?? 0, PAL.navy[3] ?? 0, PAL.green[2] ?? 0] as const;

/** Soft tufts across the crown, left to right, then the fringe from the right side across the forehead: long
 *  chunks over the right eye's corner, shorter ones over the left brow, ending above the left ear. */
const CROWN: readonly number[] = [-7.6, 5.4, -3.4, 10, 1.4, 3.2, 5.6, 9.4, 11.4, 5, 13.4, 11.4, 18.8, 11];
const FRINGE: readonly number[] = [
  26.2, 52, 26.8, 61, 22, 55.4, 20.4, 62, 17.4, 51.6, 15.6, 54.4, 13.2, 44.6, 10.8, 50.4, 8, 43.8, 5.2, 48.8, 2.6, 42.2,
  -0.8, 47.2, -3.4, 41.6, -6.6, 46.8, -9.4, 40.8, -12.2, 46.2, -14.6, 41.6, -16.8, 47.8, -19.6, 46.4, -21.8, 50.2, -24.6, 48.6,
];

const mopShape = (): Path => path().move(-24.6, 48.6).cubic(-28.6, 34, -25, 17, -10.4, 10.6).lines(CROWN)
  .cubic(24, 14.6, 28.4, 30, 26.2, 52).lines(FRINGE).close();

function mopFront(p: Pix, h: Ramp): void {
  const m = piece(p, mopShape(), h, [25, 34, 7, 24], [-12, 20, 6, 4]);
  if (p.k >= 0.6) {
    for (const q of [[-1, 13, -3, 30, -8.4, 44], [3, 11, 5, 30, 1.6, 45], [8, 12.4, 12.6, 28, 9, 46], [16, 18, 20, 30, 19.4, 52]]) {
      strand(p, q, h[D1] ?? 0, m);
    }
    strand(p, [-8, 15, -15.6, 22, -17.6, 40], h[L1] ?? 0, m);
    strand(p, [2, 16, 9, 22, 13, 40], h[L1] ?? 0, m);
    p.paint(p.oval(-6, 16, 4, 1.4, -0.3), h[L2] ?? 0, m);
  }
  p.paint(p.thick(quadPts([-1.2, 8.4, -4.6, 2.2, 0.8, 1]), 1), h[3] ?? 0); // a cowlick that will not lie down
  if (p.k >= 0.7) {
    strand(p, [4, 7, 6.4, 2.2, 10, 1.4], h[L1] ?? 0); // flyaway strands
    strand(p, [-9, 8.4, -12.6, 3.6, -15.4, 4.4], h[L1] ?? 0);
  }
}

/** The tousled mop with a heavy fringe of pilot 3 in any colour (also the builder's "mop"). */
export const MOP: HairArt = {
  back: (p, h) => {
    shaded(p, path().move(-22.5, 58).cubic(-29, 42, -28, 14, -12, 8.6).cubic(-2, 3.6, 14, 4.4, 21.6, 11)
      .cubic(30, 19, 29.6, 46, 23, 64).close(), h, [26, 44, 8, 26]);
  },
  front: mopFront,
};

function head(p: Pix, r: Rig): void {
  MOP.back?.(p, HAIR, SKIN);
  const fm = face(p, SKIN, FACE, r);
  blush(p, 11.2, 60.6, 4.8, 3, PAL.rose[2] ?? 0, fm, 0.65);
  eyes(p, r, EYES, SKIN);
  nose(p, SKIN, 56, 60.8, 2.2);
  mouth(p, r, MOUTH, SKIN);
  MOP.front(p, HAIR, SKIN);
  brows(p, r, BROWS); // over the fringe, cartoon style, so the mood always reads
}

/** One end of the scarf hanging from the knot at angle `a`, striped, with a fringe. */
function tail(p: Pix, x: number, y: number, a: number, len: number): void {
  const c = Math.cos(a);
  const s = Math.sin(a);
  const at = (u: number, v: number): [number, number] => [x + u * c - v * s, y + u * s + v * c];
  const m = p.shape(path().move(...at(-3, 0)).line(...at(3, 0)).line(...at(3.4, len)).line(...at(-2.8, len)).close());
  part(p, m, SCARF, p.blank());
  const bands = p.k >= 0.7 ? [STRIPES[0], STRIPES[1]] : [STRIPES[0]];
  for (let y0 = 3; y0 < len - 3; y0 += 6.5) bands.forEach((col, i) => p.line(...at(-3, y0 + i * 1.6), ...at(3.2, y0 + i * 1.6), col, m));
}

/** The striped aviator scarf (pilot 3; also the builder's "scarf"), its tails fluttering between two frames. */
export function scarf(p: Pix, phase: number): void {
  const band = p.shape(path().move(-12.4, 76.6).quad(0, 85, 12.4, 76.6).line(13.4, 83.4).quad(0, 92.4, -13.4, 83.4).close());
  piece(p, band, SCARF, [15, 84, 5, 8]);
  const rows = p.k >= 0.9 ? STRIPES : [STRIPES[0]];
  rows.forEach((c, i) => p.paint(p.thick(quadPts([-14, 79.6 + i * 1.6, 0, 88 + i * 1.6, 14, 79.6 + i * 1.6]), 0), c, band));
  const flutter = phase === 1 ? 0.05 : -0.03;
  tail(p, -6.4, 86.6, -0.1 + flutter, 14);
  tail(p, -8.6, 86, 0.24 + flutter, 19);
  part(p, p.oval(-7.6, 86.2, 3.4, 2.8, 0.3), SCARF, p.blank());
  p.line(-10.2, 86.4, -5, 85.4, STRIPES[0], p.oval(-7.6, 86.2, 3.4, 2.8, 0.3));
}

function body(p: Pix, r: Rig): void {
  flightSuit(p, { ramp: PAL.sage, tee: PAL.teeth[3] ?? 0 }, SKIN);
  roundPatch(p, -26, 99.5, 4.8, PAL.navy[3] ?? 0, PAL.red[3] ?? 0);
  p.fill(path().lines([-29, 101, -26, 96.6, -23, 101, -26, 99.4]).close(), PAL.white[3] ?? 0);
  scarf(p, r.phase);
}

export const PILOT3: AvatarArt = {
  sky: SKIES.sunset,
  moods: moods(0.5, { hood: 0.12 }),
  body,
  head,
  tilt: -0.2,
};
