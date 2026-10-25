import type { Rig } from '../portraits';
import {
  brows, curve, eyes, face, LINE, mouth, nose, paint, poly, shaded, stroke,
  type Brows, type Eyes, type Face, type Mouth, type Skin,
} from '../portraits/parts';
import { ellipse, fillPoly } from '../shapes';
import { flightSuit, moods, roundPatch, smooth, type AvatarArt, type Suit } from './kit';

/** Pilot 3: messy strawberry-blond hair with a heavy fringe, a cheeky smirk, rosy cheeks, a striped aviator scarf. Dusk. */

const SKIN: Skin = { base: '#f3c7a2', dark: '#dba67f', light: '#fde0c6', lip: '#b45e54' };
const FACE: Face = { w: 18.2, jaw: 12.8, top: 26, chin: 74 };
const EYES: Eyes = { x: 7.5, y: 52.4, rx: 3.9, ry: 3, iris: '#6b4428' };
const HAIR = '#cf8f4f';
const HAIR_DARK = '#9e632e';
const HAIR_LIGHT = '#ecb57c';
const BROWS: Brows = { x0: 3, x1: 12, y: 46, th: 1.9, color: '#91572a' };
const MOUTH: Mouth = { y: 66, w: 5.6, lip: SKIN.lip, shade: SKIN.dark, smirk: 1.8 };
const SUIT: Suit = { base: '#647044', dark: '#4a5330', light: '#7d8a56', tee: '#e9e4d6' };
const SCARF = '#efe5cf';
const SCARF_DARK = '#d1c4a5';
const STRIPES = ['#b9423a', '#2d3f69', '#58804c'] as const;

function backPath(ctx: CanvasRenderingContext2D): void {
  ctx.beginPath();
  ctx.moveTo(-22.5, 62);
  ctx.bezierCurveTo(-29, 44, -28, 16, -12, 9.6);
  ctx.bezierCurveTo(-2, 4.6, 14, 5.4, 21.6, 12);
  ctx.bezierCurveTo(30, 20, 29, 44, 22.5, 62);
  ctx.closePath();
}

/** Soft tufts across the crown, left to right. */
const CROWN: readonly (readonly [number, number])[] = [[-7.6, 5.6], [-3.4, 10.2], [1.4, 3.6], [5.6, 9.6], [11.4, 5.4], [13.4, 11.6], [18.6, 11.4]];
/** Floppy chunks from the right side, across the forehead, down the left side (rounded by smooth()). */
const FRINGE: readonly (readonly [number, number])[] = [
  [25.4, 49], [27, 58.4], [21.4, 53], [19.8, 60], [16.6, 48.6], [14.4, 50.6], [12.4, 39.6], [9.6, 48], [7.2, 40.6],
  [4, 50], [1.8, 39.2], [-1.8, 47.6], [-3.8, 40.4], [-7, 50.4], [-9.6, 39.2], [-12.6, 48.2], [-14.8, 42], [-16.8, 47],
  [-19.8, 59.6], [-21.4, 53.6], [-26.8, 58], [-25.2, 49],
];

/** Messy crown with soft tufts and a heavy, chunky fringe down to the brows. */
function frontPath(ctx: CanvasRenderingContext2D): void {
  ctx.beginPath();
  ctx.moveTo(-25.2, 49);
  ctx.bezierCurveTo(-28.4, 34, -25, 17, -10.4, 11);
  smooth(ctx, CROWN);
  ctx.bezierCurveTo(24, 15, 28, 30, 25.4, 45);
  smooth(ctx, FRINGE);
  ctx.closePath();
}

function strands(ctx: CanvasRenderingContext2D): void {
  ctx.beginPath();
  ctx.moveTo(-1, 13);
  ctx.quadraticCurveTo(-3, 30, -8.4, 44);
  ctx.moveTo(3, 11);
  ctx.quadraticCurveTo(5, 30, 1.6, 44.6);
  ctx.moveTo(8, 12.4);
  ctx.quadraticCurveTo(12.6, 28, 8.8, 44.4);
  ctx.moveTo(16, 18);
  ctx.quadraticCurveTo(20, 30, 19.4, 50);
  stroke(ctx, HAIR_DARK, 0.7);
  ctx.beginPath();
  ctx.moveTo(-8, 15);
  ctx.quadraticCurveTo(-15.6, 22, -17.6, 40);
  ctx.moveTo(-3.4, 16);
  ctx.quadraticCurveTo(-7.6, 24, -9.4, 34);
  stroke(ctx, HAIR_LIGHT, 1);
  ctx.beginPath(); // a cowlick that will not lie down
  ctx.moveTo(-1.2, 8.6);
  ctx.quadraticCurveTo(-4.6, 2.4, 0.8, 1.2);
  stroke(ctx, LINE, 2.2);
  stroke(ctx, HAIR, 1.3);
}

function head(ctx: CanvasRenderingContext2D, r: Rig): void {
  shaded(ctx, backPath, HAIR, HAIR_DARK, 26, 44, 8, 26);
  face(ctx, SKIN, FACE, r);
  for (const s of [-1, 1]) ellipse(ctx, s * 11.6, 60.6, 4, 2.6, 'rgba(232,90,90,0.34)');
  eyes(ctx, r, EYES, SKIN);
  nose(ctx, SKIN, 55.4, 60.6, 2.4);
  mouth(ctx, r, MOUTH);
  shaded(ctx, frontPath, HAIR, HAIR_DARK, 25, 34, 7, 22);
  strands(ctx);
  brows(ctx, r, BROWS); // over the fringe, cartoon style, so the mood always reads
}

function bandPath(ctx: CanvasRenderingContext2D): void {
  ctx.beginPath();
  ctx.moveTo(-12.4, 76.6);
  ctx.quadraticCurveTo(0, 85, 12.4, 76.6);
  ctx.lineTo(13.4, 83.4);
  ctx.quadraticCurveTo(0, 92.4, -13.4, 83.4);
  ctx.closePath();
}

/** One end of the scarf hanging from the knot at angle `a`, striped, with a fringe. */
function tail(ctx: CanvasRenderingContext2D, x: number, y: number, a: number, len: number): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(a);
  fillPoly(ctx, [-3, 0, 3, 0, 3.4, len, -2.8, len], SCARF, LINE);
  for (let y0 = 3; y0 < len - 3; y0 += 5.4) {
    STRIPES.forEach((c, i) => poly(ctx, [-3, y0 + i * 1.2, 3.2, y0 + i * 1.2], c, 0.6));
  }
  for (let fx = -2.4; fx <= 3; fx += 1.1) poly(ctx, [fx, len, fx + 0.2, len + 2.2], SCARF_DARK, 0.5);
  ctx.restore();
}

function scarf(ctx: CanvasRenderingContext2D, t: number): void {
  shaded(ctx, bandPath, SCARF, SCARF_DARK, 15, 84, 5, 8);
  ctx.save();
  bandPath(ctx);
  ctx.clip();
  STRIPES.forEach((c, i) => {
    curve(ctx, -14, 78.4 + i * 1.7, 0, 86.8 + i * 1.7, 14, 78.4 + i * 1.7);
    stroke(ctx, c, 0.8);
  });
  ctx.restore();
  const flutter = Math.sin(t * 2.1);
  tail(ctx, -6.4, 86.6, -0.1 + flutter * 0.04, 14);
  tail(ctx, -8.6, 86, 0.24 + flutter * 0.05, 19);
  ctx.beginPath();
  ctx.ellipse(-7.6, 86.2, 3.4, 2.8, 0.3, 0, Math.PI * 2);
  paint(ctx, SCARF, LINE, 0.6);
  poly(ctx, [-10.2, 86.4, -5, 85.4], STRIPES[0], 0.7);
}

function body(ctx: CanvasRenderingContext2D, r: Rig): void {
  flightSuit(ctx, SUIT, SKIN);
  roundPatch(ctx, -26, 99.5, 4.8, '#2d3f69', '#b9423a');
  fillPoly(ctx, [-29, 101, -26, 96.6, -23, 101, -26, 99.4], '#f6efe0'); // little delta jet
  scarf(ctx, r.t);
}

export const PILOT3: AvatarArt = {
  sky: {
    top: '#33296a', mid: '#b04f80', low: '#f59a5c', sea: '#4a3f74', cloud: 'rgba(255,186,200,0.5)',
    sun: '#ffb44a', glow: '255,150,80', sunX: 30, sunY: 76, sunR: 9, island: -1,
  },
  moods: moods(0.5),
  tilt: -0.07,
  body,
  head,
};
