import { puff, type ArtView } from '../pixel/bust';
import { rect, vgrad } from '../pixel/fx';
import { PAL } from '../pixel/palette';
import { path } from '../pixel/path';
import type { Pix } from '../pixel/raster';
import { brows, eyes, mouth, nose, type Brows, type Eyes, type Mouth } from './features';
import { arm, gesture, pointHand, type Hand } from './hands';
import { BASE, blush, D1, D2, face, L1, L2, neck, piece, shaded, strand, torso, torsoPath, type Face } from './parts';
import type { CharacterArt, Frame, Rig } from './types';

/** Lt. Sam "Shooter" Reyes, catapult officer, in pixel art: yellow deck jersey, white cranial with goggles, ear cups and boom mic. */

const SKIN = PAL.skinOlive;
const HAIR = PAL.hairBlack;
const YELLOW = PAL.yellow;
const SHELL = PAL.white;
const FACE: Face = { w: 16, jaw: 10.4, top: 29, chin: 76 };
const EYES: Eyes = { x: 7.2, y: 50.6, rx: 3.4, ry: 2.5, iris: PAL.irisBrown, lash: true };
const BROWS: Brows = { x0: 2.3, x1: 12.6, y: 44.2, th: 2, color: HAIR[BASE] ?? 0, bias: 0.7 };
const MOUTH: Mouth = { y: 67, w: 6.3, full: PAL.mouth[3] ?? 0 };
const HAND: Hand = { skin: SKIN, sleeve: YELLOW };
const DARK = PAL.ink[2] ?? 0;

/** Flight deck: hazy sky, the carrier island, grey deck and a yellow foul line (steam drifts past in ambient). */
function background(p: Pix, f: Frame): void {
  const s = PAL.sky;
  vgrad(p, [s[4] ?? 0, s[5] ?? 0, s[6] ?? 0], f.t, 92);
  rect(p, 28, 58, 30, 34, PAL.steel[3] ?? 0);
  rect(p, 36, 44, 6, 14, PAL.steel[3] ?? 0);
  rect(p, 30, 62, 26, 2, PAL.steel[2] ?? 0);
  rect(p, f.l, 90, f.r - f.l, f.b - 90, PAL.steel[2] ?? 0);
  rect(p, f.l, 90, f.r - f.l, 1, PAL.steel[3] ?? 0);
  rect(p, f.l, 96, f.r - f.l, 1.4, YELLOW[BASE] ?? 0);
}

function steam(g: CanvasRenderingContext2D, v: ArtView): void {
  for (let i = 0; i < 4; i++) {
    const k = ((v.t * 0.22 + i / 4) % 1 + 1) % 1;
    puff(g, v, v.ox + (-46 + k * 30 + i * 3) * v.k, v.oy + (92 - k * 22) * v.k, (6 + k * 12) * v.k, (4 + k * 6) * v.k, SHELL[L1] ?? 0, (1 - k) * 0.55);
  }
}

function body(p: Pix): void {
  neck(p, SKIN, 7.2, FACE.chin);
  const m = torso(p, YELLOW);
  rect(p, -60, 105, 120, 3.4, SHELL[BASE] ?? 0, m);
  rect(p, -60, 107.2, 120, 0.8, SHELL[D1] ?? 0, m);
  const neckline: number[] = [];
  for (let i = 0; i <= 8; i++) neckline.push(-9 + 18 * (i / 8), 84.4 + 13.2 * (i / 8) * (1 - i / 8));
  p.paint(p.thick(neckline, 1.2), YELLOW[D2] ?? 0);
  p.line(0, 91, 0, 104, YELLOW[D1] ?? 0, p.shape(torsoPath()));
}

/** White cranial, goggles pushed up, big ear cups. */
function cranial(p: Pix): void {
  const m = piece(p, path().move(-19.6, 52).cubic(-21.2, 30, -14, 15.5, 0, 15).cubic(14, 15.5, 21.2, 30, 19.6, 52)
    .line(15.6, 48).cubic(15.6, 38.5, 12, 34.5, 0, 34.4).cubic(-12, 34.5, -15.6, 38.5, -15.6, 48).close(), SHELL, [20, 34, 8, 22], [-9, 20, 4, 2]);
  p.line(-15, 25, -6, 18, SHELL[D1] ?? 0, m);
  p.line(6, 18, 15, 25, SHELL[D1] ?? 0, m);
  const band: number[] = [];
  for (let i = 0; i <= 10; i++) band.push(-19.6 + 39.2 * (i / 10), 33.6 - 25.2 * (i / 10) * (1 - i / 10));
  p.paint(p.thick(band, 1.3), DARK);
  for (const s of [-1, 1]) {
    const x = s > 0 ? 1.6 : -12.6;
    const g = p.shape(path().move(x + 2, 23.6).line(x + 9, 23.6).quad(x + 11, 23.6, x + 11, 26).line(x + 11, 28.6)
      .quad(x + 11, 30.8, x + 9, 30.8).line(x + 2, 30.8).quad(x, 30.8, x, 28.6).line(x, 26).quad(x, 23.6, x + 2, 23.6).close());
    p.paint(g, DARK);
    const lens = p.shape(path().rect(x + 1.4, 25, 8.2, 4.4));
    vgrad(p, [PAL.lens[2] ?? 0, PAL.lens[3] ?? 0, PAL.lens[4] ?? 0], 25, 29.4, lens);
    p.paint(p.oval(x + 3.6, 26.2, 1.6, 0.7), PAL.lens[5] ?? 0, lens);
  }
  for (const s of [-1, 1]) {
    const cup = p.oval(s * 19.4, 53, 6.4, 8.6);
    p.paint(cup, (s > 0 ? SHELL[D1] : SHELL[BASE]) ?? 0);
    p.paint(p.oval(s * 19.8, 53, 3.4, 5.4), (s > 0 ? SHELL[D2] : SHELL[D1]) ?? 0, cup);
  }
}

function boomMic(p: Pix): void {
  const pts: number[] = [];
  for (let i = 0; i <= 6; i++) {
    const t = i / 6;
    const u = 1 - t;
    pts.push(u * u * 19 + 2 * u * t * 18 + t * t * 11.6, u * u * 58.5 + 2 * u * t * 70 + t * t * 70.4);
  }
  p.paint(p.thick(pts, 0.7), DARK);
  p.paint(p.oval(10.6, 70.4, 2.3, 1.7), PAL.ink[1] ?? 0);
}

function head(p: Pix, r: Rig): void {
  shaded(p, p.oval(0, 47, 19.6, 22), HAIR, [14, 50, 6, 20]);
  piece(p, path().move(-17, 56).cubic(-25, 64, -22, 80, -27, 96).cubic(-21, 90, -16, 76, -12.5, 64).close(), HAIR, [-15, 80, 4, 20], [-22, 70, 1.4, 6]);
  strand(p, [-17, 60, -13, 77, 0, 78.6], DARK);
  strand(p, [0, 78.6, 13, 77, 17, 60], DARK);
  const fm = face(p, SKIN, FACE, r);
  blush(p, 9.6, 60, 3.4, 2, PAL.rose[2] ?? 0, fm, 0.3);
  eyes(p, r, EYES, SKIN);
  brows(p, r, BROWS);
  nose(p, SKIN, 50.5, 60, 2.8);
  mouth(p, r, MOUTH, SKIN);
  p.fill(path().move(-15.6, 41).quad(-13, 35, -6, 34.4).line(-12, 36.6).close(), HAIR[BASE] ?? 0);
  cranial(p);
  boomMic(p);
}

/** The launch signal: arm thrust up and forward, finger pointing down the deck. */
function launch(p: Pix): void {
  arm(p, [36, 130, 47, 84, 38, 56], HAND);
  pointHand(p, 37, 50, 9, -13, HAND);
  p.line(29, 31, 33, 25, SHELL[L2] ?? 0);
  p.line(37, 22, 39, 15, SHELL[L2] ?? 0);
}

export const SHOOTER: CharacterArt = {
  background,
  ambient: steam,
  body,
  head,
  gesture: (p, r) => (r.gesture === 'point' ? launch(p) : gesture(p, r.gesture, HAND)),
};
