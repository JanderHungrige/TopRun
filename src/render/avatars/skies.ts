import type { SkyId } from '../../game/avatar-look';
import { puff, type ArtView } from '../pixel/bust';
import { glow, rect, vgrad } from '../pixel/fx';
import { PAL, type Ramp } from '../pixel/palette';
import { bayer, type Pix } from '../pixel/raster';
import { BASE, D1, L1 } from '../portraits/parts';
import type { Frame } from '../portraits/types';

/**
 * The carrier deck behind the pilot avatars (doc 08 / 20 / 29): a banded, dithered sky, a sun (or moon) with a
 * banded glow and its glitter on the sea, the island on one side, the deck with a foul line; clouds drift by.
 */

export interface Sky {
  /** Gradient from the top of the sky down to the horizon (palette indices from `ramp`). */
  grad: readonly number[];
  ramp: Ramp;
  sea: Ramp;
  sun: number; cloud: number;
  sunX: number; sunY: number; sunR: number;
  island: -1 | 1; // which side the carrier island stands on
  /** Deck and island colours (default steel). */
  deck?: Ramp;
  /** A few fixed stars (night). */
  stars?: boolean;
}

const at = (r: Ramp, ...i: number[]): number[] => i.map((n) => r[n] ?? 0);

export const SKIES: Readonly<Record<SkyId, Sky>> = {
  dawn: {
    grad: at(PAL.dawn, 1, 2, 3, 4, 5), ramp: PAL.dawn, sea: PAL.seaDawn, sun: PAL.dawn[6] ?? 0, cloud: PAL.dawn[4] ?? 0,
    sunX: -30, sunY: 74, sunR: 7, island: 1,
  },
  day: {
    grad: at(PAL.sky, 2, 3, 4, 5, 6), ramp: PAL.sky, sea: PAL.sea, sun: PAL.sky[7] ?? 0, cloud: PAL.white[3] ?? 0,
    sunX: 34, sunY: 14, sunR: 5, island: -1,
  },
  sunset: {
    grad: at(PAL.dusk, 1, 2, 3, 4, 5), ramp: PAL.dusk, sea: PAL.seaDusk, sun: PAL.lamp[3] ?? 0, cloud: PAL.dusk[4] ?? 0,
    sunX: 30, sunY: 76, sunR: 9, island: -1,
  },
  night: {
    grad: at(PAL.night, 1, 2, 3, 4, 5), ramp: PAL.night, sea: PAL.seaNight, sun: PAL.white[3] ?? 0, cloud: PAL.night[5] ?? 0,
    sunX: -28, sunY: 20, sunR: 4.6, island: 1, deck: PAL.wall, stars: true,
  },
};

const STARS: readonly number[] = [-40, 8, -14, 5, 6, 12, 22, 4, 38, 15, 44, 30, -44, 36, 14, 26, -6, 30, 30, 44, -36, 52];

/** Carrier deck at sea under the sky: dithered sky, sun with a dithered halo, horizon, island, deck. */
export function deckBackdrop(p: Pix, f: Frame, k: Sky): void {
  vgrad(p, k.grad, f.t, 78);
  if (k.stars) for (let i = 0; i < STARS.length; i += 2) p.set(p.col(STARS[i] ?? 0), p.row(STARS[i + 1] ?? 0), PAL.white[i % 4 === 0 ? 4 : 2] ?? 0);
  glow(p, k.sunX, k.sunY, k.sunR * 1.7, k.ramp, 2, 1);
  p.paint(p.oval(k.sunX, k.sunY, k.sunR, k.sunR), k.sun);
  const w = f.r - f.l;
  rect(p, f.l, 78, w, 13, k.sea[BASE] ?? 0);
  rect(p, f.l, 78, w, 1, k.sea[L1] ?? 0);
  rect(p, f.l, 84, w, 7, k.sea[D1] ?? 0, undefined, bayer(0.5));
  for (let i = 0; i < 4; i++) rect(p, k.sunX - 7 + i * 1.6, 80.4 + i * 2.6, 14 - i * 3.2, 0.9, k.sun);
  const ix = k.island * 36;
  const grey = k.deck ?? PAL.steel;
  rect(p, ix - 8, 74, 16, 17, grey[2] ?? 0);
  rect(p, ix - 4.4, 67.6, 8.8, 6.6, grey[2] ?? 0);
  rect(p, ix - 3.6, 69.2, 7.2, 1.6, grey[1] ?? 0);
  p.line(ix, 67.6, ix, 60.6, grey[2] ?? 0);
  p.line(ix - 2, 61.2, ix + 3, 60.4, grey[2] ?? 0);
  if (k.stars) p.set(p.col(ix + 2.6), p.row(69.8), PAL.lamp[4] ?? 0); // a lit bridge window
  rect(p, f.l, 90.5, w, f.b - 90.5, grey[2] ?? 0);
  rect(p, f.l, 90.5, w, 1.2, grey[3] ?? 0);
  p.paint(p.thick([f.l, 104, f.r, 95], 0.5), PAL.yellow[3] ?? 0);
}

/** Clouds drifting slowly across the sky (ambient layer). */
export function skyClouds(g: CanvasRenderingContext2D, v: ArtView, k: Sky): void {
  const l = -v.ox / v.k;
  const span = 2 * -l + 50;
  for (let i = 0; i < 3; i++) {
    const x = l - 25 + ((((v.t * 2.2 + i * 47) % span) + span) % span);
    puff(g, v, v.ox + x * v.k, v.oy + (14 + i * 17) * v.k, (12 + i * 3) * v.k, 2.6 * v.k, k.cloud);
    puff(g, v, v.ox + (x + 5) * v.k, v.oy + (12.2 + i * 17) * v.k, 6.5 * v.k, 2.4 * v.k, k.cloud);
  }
}
