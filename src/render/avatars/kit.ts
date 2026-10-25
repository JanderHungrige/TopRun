import { puff, type ArtView } from '../pixel/bust';
import { glow, rect, vgrad } from '../pixel/fx';
import { hexOf, PAL, type Ramp } from '../pixel/palette';
import { path } from '../pixel/path';
import { bayer, type Pix } from '../pixel/raster';
import { part } from '../portraits/hands';
import { BASE, D1, D2, L1, neck, piece } from '../portraits/parts';
import type { Frame, Mood, MoodShape, Rig } from '../portraits/types';

/**
 * Shared pieces of the pixel-art player avatars (doc 08 / doc 20): a kid-proportioned mood table, the flight
 * suit with harness and a blank name tape, the carrier deck under a per-avatar sky, drifting clouds and the gold
 * "selected" frame. Same 100×120 frame as the portraits.
 */

export interface Sky {
  /** Gradient from the top of the sky down to the horizon (palette indices from `ramp`). */
  grad: readonly number[];
  ramp: Ramp;
  sea: Ramp;
  sun: number; cloud: number;
  sunX: number; sunY: number; sunR: number;
  island: -1 | 1; // which side the carrier island stands on
}
export interface Suit { ramp: Ramp; tee: number }
export interface AvatarArt {
  sky: Sky;
  moods: Readonly<Record<Mood, MoodShape>>;
  body(p: Pix, r: Rig): void;
  head(p: Pix, r: Rig): void;
  /** Optional layer in front of the head, in body space. */
  front?(p: Pix, r: Rig): void;
}

const BASE_MOODS: Readonly<Record<Mood, MoodShape>> = {
  neutral: { browIn: 0, browOut: 0, arch: 0.8, lidTop: 0.08, lidLow: 0.05, pupil: 1, lift: 0.4, curv: 0.5, widen: 0, tilt: 0, nod: 0 },
  happy: { browIn: -1.2, browOut: -0.6, arch: 1.4, lidTop: 0.04, lidLow: 0.34, pupil: 1, lift: 2.1, curv: 1.6, widen: 1.2, tilt: 0.04, nod: -0.6 },
  stern: { browIn: 2.2, browOut: -0.8, arch: 0.1, lidTop: 0.26, lidLow: 0.12, pupil: 0.95, lift: -0.5, curv: -0.1, widen: -1, tilt: 0, nod: 0.8 },
  worried: { browIn: -2.4, browOut: 1.1, arch: 0.3, lidTop: 0, lidLow: 0, pupil: 0.75, lift: -1.4, curv: -0.7, widen: -0.8, tilt: -0.05, nod: 0.4 },
};

/** The kid mood table with a resting smile added to every mood (negative = straighter). Built once per avatar. */
export function moods(smile: number): Readonly<Record<Mood, MoodShape>> {
  const build = (m: MoodShape): MoodShape => ({ ...m, lift: m.lift + smile, curv: m.curv + smile * 0.8 });
  return { neutral: build(BASE_MOODS.neutral), happy: build(BASE_MOODS.happy), stern: build(BASE_MOODS.stern), worried: build(BASE_MOODS.worried) };
}

/** Carrier deck at sea under the avatar's sky: dithered sky, sun with a dithered halo, horizon, island, deck. */
export function deckBackdrop(p: Pix, f: Frame, k: Sky): void {
  vgrad(p, k.grad, f.t, 78);
  glow(p, k.sunX, k.sunY, k.sunR * 1.7, k.ramp, 2, 1);
  p.paint(p.oval(k.sunX, k.sunY, k.sunR, k.sunR), k.sun);
  const w = f.r - f.l;
  rect(p, f.l, 78, w, 13, k.sea[BASE] ?? 0);
  rect(p, f.l, 78, w, 1, k.sea[L1] ?? 0);
  rect(p, f.l, 84, w, 7, k.sea[D1] ?? 0, undefined, bayer(0.5));
  for (let i = 0; i < 4; i++) rect(p, k.sunX - 7 + i * 1.6, 80.4 + i * 2.6, 14 - i * 3.2, 0.9, k.sun);
  const ix = k.island * 36;
  const grey = PAL.steel;
  rect(p, ix - 8, 74, 16, 17, grey[2] ?? 0);
  rect(p, ix - 4.4, 67.6, 8.8, 6.6, grey[2] ?? 0);
  rect(p, ix - 3.6, 69.2, 7.2, 1.6, grey[1] ?? 0);
  p.line(ix, 67.6, ix, 60.6, grey[2] ?? 0);
  p.line(ix - 2, 61.2, ix + 3, 60.4, grey[2] ?? 0);
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

const STRAP = PAL.olive[1] ?? 0;

function harness(p: Pix): void {
  for (const sd of [-1, 1]) p.paint(p.thick([sd * 18.5, 84.5, sd * 14.6, 104, sd * 12.6, 126], 1.9), STRAP);
  p.paint(p.thick([-14.6, 108.6, 14.6, 108.6], 1.5), STRAP);
  for (const sd of [-1, 1]) part(p, p.shape(path().rect(sd * 14.2 - 2.7, 106.3, 5.4, 4.8)), PAL.steel, p.oval(sd * 14.2 + 2.7, 111, 2.6, 2));
}

/** Neck, flight suit with open collar, zip, harness and a blank name tape (the game prints the callsign elsewhere). */
export function flightSuit(p: Pix, s: Suit, skin: Ramp): void {
  neck(p, skin, 6.6, 74);
  const r = s.ramp;
  piece(p, path().move(-8, 80).cubic(-18, 82.6, -32, 84, -38.5, 93).line(-52, 128).line(52, 128).line(38.5, 93)
    .cubic(32, 84, 18, 82.6, 8, 80).close(), r, [46, 114, 22, 34], [-30, 98, 5, 4]);
  p.fill(path().move(-6.6, 80.6).line(6.6, 80.6).line(0, 91.6).close(), s.tee);
  p.fill(path().move(-6.6, 80.6).line(6.6, 80.6).line(0, 86.4).close(), skin[D1] ?? 0);
  const collar = p.shape(path().pair([6.2, 80, 14, 82.2, 10.6, 92, 1.4, 92.4]));
  const seam = p.seam(collar);
  p.paint(collar, r[L1] ?? 0);
  p.paint(seam, r[D2] ?? 0);
  p.line(0, 93, 0, 126, r[D2] ?? 0);
  harness(p);
  part(p, p.shape(path().rect(19.6, 95.4, 11.6, 4.8)), PAL.leather, p.blank());
}

/** Round chest patch: a ring and an inner disc for an emblem. */
export function roundPatch(p: Pix, x: number, y: number, r: number, ring: number, inner: number): void {
  p.paint(p.oval(x, y, r, r), ring);
  p.paint(p.oval(x, y, r * 0.72, r * 0.72), inner);
}

const GOLD = PAL.gold;

/** Pulsing gold pixel frame with a dithered inner glow and a twinkling corner star, in compose pixels. */
export function selectionFrame(g: CanvasRenderingContext2D, v: ArtView): void {
  const pulse = Math.sin(v.t * 4.2) > 0;
  g.fillStyle = hexOf(GOLD[BASE] ?? 0);
  const glow = Math.max(2, Math.round(v.W * 0.05));
  for (let i = 0; i < glow; i++) {
    for (let x = i % 2; x < v.W; x += pulse ? 2 : 3) {
      g.fillRect(x, 2 + i, 1, 1);
      g.fillRect(x, v.H - 3 - i, 1, 1);
    }
    for (let y = i % 2; y < v.H; y += pulse ? 2 : 3) {
      g.fillRect(2 + i, y, 1, 1);
      g.fillRect(v.W - 3 - i, y, 1, 1);
    }
  }
  g.fillStyle = hexOf(GOLD[D1] ?? 0);
  g.fillRect(0, 0, v.W, 1); g.fillRect(0, v.H - 1, v.W, 1); g.fillRect(0, 0, 1, v.H); g.fillRect(v.W - 1, 0, 1, v.H);
  g.fillStyle = hexOf((pulse ? GOLD[5] : GOLD[L1]) ?? 0);
  g.fillRect(1, 1, v.W - 2, 1); g.fillRect(1, v.H - 2, v.W - 2, 1); g.fillRect(1, 1, 1, v.H - 2); g.fillRect(v.W - 2, 1, 1, v.H - 2);
  const s = Math.floor(v.t * 3) % 3;
  const cx = v.W - 7;
  const cy = 6;
  g.fillStyle = hexOf(GOLD[5] ?? 0);
  g.fillRect(cx - 1 - s, cy, 3 + s * 2, 1);
  g.fillRect(cx, cy - 1 - s, 1, 3 + s * 2);
}
