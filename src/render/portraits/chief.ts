import { glow, rect, shiftRamp, vgrad } from '../pixel/fx';
import { PAL } from '../pixel/palette';
import { path } from '../pixel/path';
import { bayer, type Pix } from '../pixel/raster';
import { brows, eyes, mouth, nose, type Brows, type Eyes, type Mouth } from './features';
import { arm, fist, gesture, part, type Hand } from './hands';
import { BASE, blush, D1, D2, face, L1, L2, neck, piece, strand, torso, type Face } from './parts';
import type { CharacterArt, Frame, Rig } from './types';

/** Chief "Wrench" Kowalski in pixel art: grey flat-top, bushy mustache, ruddy and greasy, brown deck jersey, ear defenders. */

const SKIN = PAL.skinRuddy;
const GREY = PAL.hairGrey;
const JERSEY = PAL.jersey;
const STEEL = PAL.steel;
const CUP = PAL.cup;
const FACE: Face = { w: 18.6, jaw: 14.4, top: 29, chin: 77.5 };
const EYES: Eyes = { x: 7.8, y: 50.5, rx: 2.9, ry: 2.1, iris: PAL.irisBlue };
const BROWS: Brows = { x0: 2.2, x1: 14.2, y: 45, th: 3.9, color: GREY[D1] ?? 0 };
const MOUTH: Mouth = { y: 69.2, w: 6.6 };
const HAND: Hand = { skin: SKIN, sleeve: JERSEY };

/** Corrugated hangar wall lit by a warm work lamp from the upper left. */
function background(p: Pix, f: Frame): void {
  const w = PAL.wall;
  vgrad(p, [w[5] ?? 0, w[4] ?? 0, w[3] ?? 0, w[2] ?? 0], f.t, f.b);
  for (let x = Math.floor(f.l / 9) * 9; x < f.r; x += 9) shiftRamp(p, p.shape(path().rect(x, f.t, 4.5, f.b - f.t)), w, -1);
  glow(p, -36, 2, 16, w, 3, 0.85);
}

/** Ear defenders hanging round the neck: black cushions facing up, green shells, a steel yoke each. */
function earDefenders(p: Pix): void {
  for (const s of [-1, 1]) {
    p.line(s * 11.5, 84, s * 15.5, 86.4, STEEL[D1] ?? 0);
    const cup = p.oval(s * 17, 93, 6.6, 7.8, s * 0.35);
    part(p, cup, CUP, p.oval(s * 17 + 4, 96, 4, 6, s * 0.35));
    p.paint(p.oval(s * 17.6, 95, 2.6, 3.4, s * 0.35), CUP[L1] ?? 0, cup);
    const cushion = p.oval(s * 14.4, 90.4, 5, 6.2, s * 0.35);
    part(p, cushion, PAL.wall, p.oval(s * 14.4, 90.4, 2.6, 3.6, s * 0.35));
    p.paint(p.oval(s * 14.4, 90.4, 2.6, 3.6, s * 0.35), PAL.wall[1] ?? 0, cushion);
  }
}

function body(p: Pix): void {
  const band: number[] = [];
  for (let i = 0; i <= 8; i++) {
    const t = i / 8;
    band.push(-15 + 30 * t, 87 - 26 * t * (1 - t));
  }
  p.paint(p.thick(band, 1.5), CUP[1] ?? 0);
  neck(p, SKIN, 9.8, FACE.chin);
  torso(p, JERSEY);
  const collar: number[] = [];
  for (let i = 0; i <= 8; i++) collar.push(-10.4 + 20.8 * (i / 8), 84.4 + 17.2 * (i / 8) * (1 - i / 8));
  p.paint(p.thick(collar, 1.3), JERSEY[D2] ?? 0);
  p.paint(p.oval(-27, 112, 4, 1.6, -0.4), JERSEY[D2] ?? 0, undefined, bayer(0.5));
  earDefenders(p);
}

function flatTop(p: Pix): void {
  const m = piece(p, path().move(-18.4, 44).line(-18.9, 26).quad(-18.7, 19.4, -13, 19).line(13, 19).quad(18.7, 19.4, 18.9, 26)
    .line(18.4, 44).line(16.9, 44).line(16.4, 34.5).quad(10, 30.8, 0, 31.4).quad(-10, 30.8, -16.4, 34.5).line(-16.9, 44).close(),
  GREY, [22, 30, 7, 16]);
  rect(p, -13, 19.2, 24, 1.8, GREY[L1] ?? 0, m);
  if (p.k < 0.65) return;
  for (let x = -12; x <= 12; x += 3) p.line(x, 22.4, x + 0.4, 25.6, GREY[D1] ?? 0, m);
  rect(p, -14, 20.6, 4, 1.2, GREY[L2] ?? 0, m);
}

/** Forehead lines, crow's feet, ruddy cheeks and nose, and the grease smudge. */
function weathering(p: Pix, faceMask: Uint8Array): void {
  const line = SKIN[D1] ?? 0;
  if (p.k >= 0.7) {
    strand(p, [-8, 36.4, 0, 35, 8, 36.4], line, faceMask);
    strand(p, [-6, 39.4, 0, 38.2, 6, 39.4], line, faceMask);
    for (const s of [-1, 1]) p.line(s * 12, 52.4, s * 13.6, 53.4, line, faceMask);
  }
  blush(p, 10.6, 60, 4.2, 2.6, PAL.rose[2] ?? 0, faceMask, 0.5);
  p.paint(p.oval(0, 60.4, 2.4, 1.4), PAL.rose[2] ?? 0, faceMask, bayer(0.5));
  if (p.k < 0.7) return;
  const smudge = p.shape(path().move(-15, 58).quad(-12, 55.4, -8.6, 57.6).quad(-10, 61.6, -13.6, 61.4).close());
  p.paint(smudge, SKIN[D2] ?? 0, faceMask, bayer(0.5));
}

function mustache(p: Pix, r: Rig): void {
  const y = 62.6 - ([0, 0.4, 0.8][r.mouth] ?? 0) - r.m.lift * 0.3;
  const m = piece(p, path().move(0, y).cubic(4, y - 1.8, 10, y - 0.8, 12.4, y + 6.8).cubic(9, y + 5.6, 5, y + 4.4, 0, y + 4.8)
    .cubic(-5, y + 4.4, -9, y + 5.6, -12.4, y + 6.8).cubic(-10, y - 0.8, -4, y - 1.8, 0, y).close(), GREY, [9, y + 6, 5, 3]);
  if (p.k >= 0.6) for (let i = -2; i <= 2; i++) p.line(i * 3, y + 1.2, i * 3.6, y + 4.4, GREY[D1] ?? 0, m);
  p.line(-7, y + 0.4, -2.4, y - 0.4, GREY[L2] ?? 0, m);
}

function head(p: Pix, r: Rig): void {
  const fm = face(p, SKIN, FACE, r);
  weathering(p, fm);
  eyes(p, r, EYES, SKIN);
  brows(p, r, BROWS);
  nose(p, SKIN, 50.5, 62, 4.4);
  mouth(p, r, MOUTH, SKIN);
  mustache(p, r);
  flatTop(p);
}

/** A big open-end wrench whose handle runs from (x, y) along the angle `a` (0 = straight up). */
function wrench(p: Pix, x: number, y: number, a: number): void {
  const c = Math.cos(a);
  const s = Math.sin(a);
  const at = (u: number, v: number): [number, number] => [x + u * c - v * s, y + u * s + v * c];
  const pa = path();
  for (const [u, v] of [[-2.3, -27], [2.3, -27], [2.3, 9], [-2.3, 9]] as const) pa.line(...at(u, v));
  const handle = p.shape(pa.close());
  part(p, handle, STEEL, p.shape(path().move(...at(0.6, -25)).line(...at(2.3, -25)).line(...at(2.3, 9)).line(...at(0.6, 9)).close()));
  const [hx, hy] = at(0, -31);
  const jaw = p.oval(hx, hy, 6.6, 6.6);
  const slot = p.shape(path().move(...at(-2.6, -40)).line(...at(2.6, -40)).line(...at(2.6, -30.2)).line(...at(-2.6, -30.2)).close());
  part(p, jaw.map((v, i) => (v && !slot[i] ? 1 : 0)), STEEL, p.oval(hx + 3, hy + 2, 4, 4));
  p.paint(p.oval(...at(-3.4, -32), 1, 2.2), STEEL[L2] ?? 0, jaw);
}

function point(p: Pix): void {
  arm(p, [40, 140, 31, 105], HAND);
  wrench(p, 27, 100, 0.42);
  fist(p, 27, 99, HAND);
  p.paint(p.thick([32, 97.6, 26, 99.6], 2), SKIN[BASE] ?? 0);
}

export const CHIEF: CharacterArt = {
  background,
  body,
  head,
  gesture: (p, r) => (r.gesture === 'point' ? point(p) : gesture(p, r.gesture, HAND)),
};
