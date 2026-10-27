import type { TimeOfDay } from '../../data/photo-looks';
import type { BossId } from '../../data/types';
import { PAL } from '../pixel/palette';
import { path, type Path } from '../pixel/path';
import { bayer, checker, type Pix } from '../pixel/raster';
import { skyLook } from './sky';

// Picture wall (doc 32): what is behind the jet — on boss missions the boss going down (a battleship or the
// supercarrier listing on the horizon, the fortress on the coast, the bomber or flying wing falling out of the
// sky) with fire and a smoke column; otherwise our carrier on the horizon. Distant silhouettes in the time of
// day's far colours, painted into a transparent layer (photo units = art px).

type Shape = (x: number, y: number, s: number, f: number) => Path;

/** f = ±1 mirrors the shape (bow towards the jet's side or away). */
const pts = (x: number, y: number, s: number, f: number, list: readonly number[]): number[] =>
  list.map((v, i) => (i % 2 === 0 ? x + v * s * f : y + v * s));

const battleship: Shape = (x, y, s, f) => path()
  .lines(pts(x, y, s, f, [-38, -3, 40, -6, 36, 0, -34, 0])).close()
  .lines(pts(x, y, s, f, [-10, -4, 10, -4, 8, -12, -6, -12])).close()
  .lines(pts(x, y, s, f, [-2, -12, 3, -12, 2, -20, -1, -20])).close()
  .lines(pts(x, y, s, f, [-30, -4, -20, -4, -21, -7, -29, -7])).close()
  .lines(pts(x, y, s, f, [18, -5, 28, -5, 27, -8, 19, -8])).close()
  .lines(pts(x, y, s, f, [27, -7.5, 36, -9, 36, -8, 27, -6.5])).close();

const supercarrier: Shape = (x, y, s, f) => path()
  .lines(pts(x, y, s, f, [-46, -2, 44, -2, 50, -6, -48, -6, -48, -7, 50, -7])).close()
  .lines(pts(x, y, s, f, [-44, -2, 42, -2, 38, 0, -40, 0])).close()
  .lines(pts(x, y, s, f, [14, -7, 24, -7, 23, -17, 15, -17])).close()
  .lines(pts(x, y, s, f, [18, -17, 19, -17, 19, -24, 18, -24])).close();

const fortress: Shape = (x, y, s, f) => {
  const p = path().lines(pts(x, y, s, f, [-44, 0, 44, 0, 40, -9, -40, -9])).close()
    .lines(pts(x, y, s, f, [-38, -9, -28, -9, -28, -21, -38, -21])).close()
    .lines(pts(x, y, s, f, [26, -9, 36, -9, 36, -19, 26, -19])).close()
    .ellipse(x, y - 10 * s, 12 * s, 7 * s);
  for (let i = -36; i < 36; i += 8) p.lines(pts(x, y, s, f, [i, -9, i + 4, -9, i + 4, -12, i, -12])).close();
  return p;
};

const bomber: Shape = (x, y, s, f) => path()
  .lines(pts(x, y, s, f, [-32, 0, 26, 6, 32, 9, 26, 10, -30, 4])).close()
  .lines(pts(x, y, s, f, [-4, 4, -20, 16, -12, 16, 8, 6])).close()
  .lines(pts(x, y, s, f, [-26, 1, -36, -8, -31, -8, -22, 2])).close();

const flyingWing: Shape = (x, y, s, f) => path()
  .lines(pts(x, y, s, f, [-30, 0, -4, -6, 0, -6, 30, 4, 24, 6, 2, 1, -2, 1, -24, 6])).close();

const carrier: Shape = (x, y, s, f) => path()
  .lines(pts(x, y, s, f, [-26, -1, 26, -1, 29, -4, -28, -4])).close()
  .lines(pts(x, y, s, f, [-24, -1, 24, -1, 22, 0, -22, 0])).close()
  .lines(pts(x, y, s, f, [6, -4, 12, -4, 12, -10, 6, -10])).close();

function silhouette(p: Pix, shape: Path, time: TimeOfDay): void {
  const [body, shade, lit] = skyLook(time).far;
  const m = p.shape(shape);
  p.paint(m, body);
  p.paint(p.border(m, 'u'), lit);
  p.paint(p.border(m, 'd'), shade);
}

/** A smoke column leaning away from the wind, with fire at its base. */
function smoke(p: Pix, x: number, y: number, lean: number, height: number): void {
  const W = PAL.wall;
  for (let i = 11; i >= 0; i--) {
    const u = i / 11;
    const r = 2 + u * u * 9 + Math.sin(i * 1.7) * 0.8;
    const cx = x + lean * u * u * height * 0.45 + Math.sin(i * 2.3) * 1.5;
    const cy = y - u * height;
    const thin = i > 8 ? checker : undefined;
    p.paint(p.oval(cx, cy, r, r * 0.75), W[i < 4 ? 1 : 2] ?? 0, undefined, thin);
    p.paint(p.oval(cx - lean * r * 0.35, cy - r * 0.3, r * 0.55, r * 0.4), W[i < 4 ? 2 : 3] ?? 0, undefined, thin ?? bayer(0.6));
  }
  p.paint(p.oval(x, y + 1, 3.5, 2.5), PAL.orange[3] ?? 0);
  p.paint(p.oval(x, y + 1, 1.6, 1.4), PAL.yellow[4] ?? 0);
}

const SHAPES: Readonly<Record<BossId, { shape: Shape; air: boolean; s: number }>> = {
  ironclad: { shape: battleship, air: false, s: 0.8 },
  sandstorm: { shape: fortress, air: false, s: 0.7 },
  blackjack: { shape: bomber, air: true, s: 0.62 },
  typhoon: { shape: flyingWing, air: true, s: 0.7 },
  leviathan: { shape: supercarrier, air: false, s: 0.75 },
  // Map 2 (doc 35): stand-in silhouettes until its photos come (the wall shows map 1 only).
  kraken: { shape: fortress, air: false, s: 0.7 },
  condor: { shape: bomber, air: true, s: 0.62 },
  python: { shape: battleship, air: false, s: 0.8 },
  scorpion: { shape: fortress, air: false, s: 0.65 },
  colossus: { shape: flyingWing, air: true, s: 0.75 },
};

export interface PropsView { horizon: number; time: TimeOfDay; facing: 1 | -1 }

/** The boss going down behind the jet (on the side its tail points to). */
export function paintBoss(p: Pix, boss: BossId, v: PropsView): void {
  const def = SHAPES[boss];
  const x = v.facing > 0 ? (def.air ? 34 : 46) : def.air ? 166 : 154;
  const y = def.air ? 22 : v.horizon + 1;
  silhouette(p, def.shape(x, y, def.s, -v.facing), v.time);
  if (def.air) {
    for (let i = 1; i <= 6; i++) p.paint(p.oval(x + v.facing * i * 6, y - i * 2.4, 1.6 + i * 0.7, 1.4 + i * 0.5), PAL.wall[i < 3 ? 1 : 2] ?? 0, undefined, i > 4 ? checker : undefined);
    p.paint(p.oval(x + v.facing * 3, y + 1, 3, 2.2), PAL.orange[3] ?? 0);
  } else {
    smoke(p, x + 4 * v.facing, y - 8, -v.facing, 34);
  }
}

/** Our carrier on the horizon with its wake. */
export function paintCarrier(p: Pix, v: PropsView): void {
  const x = v.facing > 0 ? 50 : 150;
  silhouette(p, carrier(x, v.horizon + 1, 0.9, v.facing), v.time);
  const foam = PAL.white[3] ?? 0;
  for (let i = 0; i < 4; i++) p.set(Math.round(x - v.facing * (24 + i * 5)), v.horizon + 1 + (i % 2), foam);
}
