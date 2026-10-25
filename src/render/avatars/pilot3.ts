import { PAL } from '../pixel/palette';
import { path, type Path } from '../pixel/path';
import type { Pix } from '../pixel/raster';
import { brows, eyes, mouth, nose, type Brows, type Eyes, type Mouth } from '../portraits/features';
import { part } from '../portraits/hands';
import { blush, D1, face, L1, piece, quadPts, shaded, strand, type Face } from '../portraits/parts';
import type { Rig } from '../portraits/types';
import { flightSuit, moods, roundPatch, type AvatarArt } from './kit';

/** Pilot 3 in pixel art: messy strawberry-blond hair with a heavy fringe, a cheeky smirk, rosy cheeks, a striped aviator scarf. Dusk. */

const SKIN = PAL.skinPale;
const HAIR = PAL.hairGinger;
const FACE: Face = { w: 18.2, jaw: 12.8, top: 26, chin: 74 };
const EYES: Eyes = { x: 7.5, y: 52.4, rx: 3.9, ry: 3, iris: PAL.irisBrown };
const BROWS: Brows = { x0: 3, x1: 12, y: 46, th: 1.9, color: HAIR[1] ?? 0 };
const MOUTH: Mouth = { y: 66, w: 5.6, smirk: 1.8 };
const SCARF = PAL.teeth;
const STRIPES = [PAL.red[3] ?? 0, PAL.navy[3] ?? 0, PAL.green[2] ?? 0] as const;

/** Soft tufts across the crown, left to right, then floppy fringe chunks from the right side across the forehead. */
const CROWN: readonly number[] = [-7.6, 5.6, -3.4, 10.2, 1.4, 3.6, 5.6, 9.6, 11.4, 5.4, 13.4, 11.6, 18.6, 11.4];
const FRINGE: readonly number[] = [
  25.4, 49, 27, 58.4, 21.4, 53, 19.8, 60, 16.6, 48.6, 14.4, 50.6, 12.4, 39.6, 9.6, 48, 7.2, 40.6,
  4, 50, 1.8, 39.2, -1.8, 47.6, -3.8, 40.4, -7, 50.4, -9.6, 39.2, -12.6, 48.2, -14.8, 42, -16.8, 47,
  -19.8, 59.6, -21.4, 53.6, -26.8, 58, -25.2, 49,
];

function front(): Path {
  return path().move(-25.2, 49).cubic(-28.4, 34, -25, 17, -10.4, 11).lines(CROWN).cubic(24, 15, 28, 30, 25.4, 45).lines(FRINGE).close();
}

function head(p: Pix, r: Rig): void {
  shaded(p, path().move(-22.5, 62).cubic(-29, 44, -28, 16, -12, 9.6).cubic(-2, 4.6, 14, 5.4, 21.6, 12)
    .cubic(30, 20, 29, 44, 22.5, 62).close(), HAIR, [26, 44, 8, 26]);
  const fm = face(p, SKIN, FACE, r);
  blush(p, 11.6, 60.6, 4, 2.6, PAL.rose[2] ?? 0, fm, 0.5);
  eyes(p, r, EYES, SKIN);
  nose(p, SKIN, 55.4, 60.6, 2.4);
  mouth(p, r, MOUTH, SKIN);
  const m = piece(p, front(), HAIR, [25, 34, 7, 22], [-12, 20, 6, 4]);
  if (p.k >= 0.6) {
    for (const q of [[-1, 13, -3, 30, -8.4, 44], [3, 11, 5, 30, 1.6, 44.6], [8, 12.4, 12.6, 28, 8.8, 44.4], [16, 18, 20, 30, 19.4, 50]]) {
      strand(p, q, HAIR[D1] ?? 0, m);
    }
    strand(p, [-8, 15, -15.6, 22, -17.6, 40], HAIR[L1] ?? 0, m);
  }
  p.paint(p.thick(quadPts([-1.2, 8.6, -4.6, 2.4, 0.8, 1.2]), 1), HAIR[3] ?? 0); // a cowlick that will not lie down
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

function scarf(p: Pix, phase: number): void {
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
  sky: {
    grad: [PAL.dusk[1] ?? 0, PAL.dusk[2] ?? 0, PAL.dusk[3] ?? 0, PAL.dusk[4] ?? 0, PAL.dusk[5] ?? 0],
    ramp: PAL.dusk, sea: PAL.seaDusk, sun: PAL.lamp[3] ?? 0, cloud: PAL.dusk[4] ?? 0,
    sunX: 30, sunY: 76, sunR: 9, island: -1,
  },
  moods: moods(0.5),
  body,
  head,
};
