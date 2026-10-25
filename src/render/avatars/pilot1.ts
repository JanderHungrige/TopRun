import type { Rig } from '../portraits';
import {
  brows, eyes, face, LINE, mouth, nose, paint, poly, shaded, stroke,
  type Brows, type Eyes, type Face, type Mouth, type Skin,
} from '../portraits/parts';
import { ellipse } from '../shapes';
import { flightSuit, moods, roundPatch, type AvatarArt, type Suit } from './kit';

/** Pilot 1, the youngest flyer: shaggy golden bob with a side-swept fringe, big dark eyes, a lucky fang on a cord. Dawn patrol. */

const SKIN: Skin = { base: '#f4cba6', dark: '#dcab84', light: '#fde2c8', lip: '#b8645a' };
const FACE: Face = { w: 18.4, jaw: 12.8, top: 26, chin: 73.5 };
const EYES: Eyes = { x: 7.6, y: 52, rx: 4.2, ry: 3.4, iris: '#3b2416' };
const HAIR = '#e6bd5f';
const HAIR_DARK = '#bb8d36';
const HAIR_LIGHT = '#f8e09c';
const BROWS: Brows = { x0: 3, x1: 12, y: 45.6, th: 1.9, color: '#a87a2c', bias: -0.6 };
const MOUTH: Mouth = { y: 65.6, w: 5, lip: SKIN.lip, shade: SKIN.dark };
const SUIT: Suit = { base: '#e27a30', dark: '#b85c1e', light: '#f29c56', tee: '#f3efe4' };

function backPath(ctx: CanvasRenderingContext2D): void {
  ctx.beginPath();
  ctx.moveTo(-21.5, 70);
  ctx.bezierCurveTo(-28, 52, -27.5, 21, -12, 12.5);
  ctx.bezierCurveTo(-3, 7.5, 11, 7.5, 19.5, 13.5);
  ctx.bezierCurveTo(28.5, 21, 28, 52, 21.5, 70);
  ctx.closePath();
}

/** Lock from the parting down the left side, ending in shaggy tips below the jaw. */
function leftLockPath(ctx: CanvasRenderingContext2D): void {
  ctx.beginPath();
  ctx.moveTo(-6.4, 16.5);
  ctx.bezierCurveTo(-17, 17.5, -23.4, 31, -23, 50);
  ctx.lineTo(-23.8, 71.5);
  ctx.lineTo(-20.6, 67.6);
  ctx.lineTo(-18.6, 72.4);
  ctx.lineTo(-16.2, 66.2);
  ctx.bezierCurveTo(-16.8, 56, -17, 44, -14.2, 36);
  ctx.bezierCurveTo(-12.6, 31, -10.4, 27, -8.2, 25.4);
  ctx.closePath();
}

/** Crown sweeping right into the fringe: tips dip over the right brow, then the lock falls past the jaw. */
function fringePath(ctx: CanvasRenderingContext2D): void {
  ctx.beginPath();
  ctx.moveTo(-6.4, 16.5);
  ctx.bezierCurveTo(4, 12.5, 17, 16, 21.2, 27.5);
  ctx.bezierCurveTo(23.6, 36, 23, 50, 23.2, 60);
  ctx.lineTo(23.9, 71.5);
  ctx.lineTo(20.8, 67.6);
  ctx.lineTo(18.8, 72.4);
  ctx.lineTo(16.4, 66.2);
  ctx.bezierCurveTo(16.8, 58, 17.2, 53, 15.6, 48.6);
  ctx.lineTo(13.6, 51.6);
  ctx.lineTo(11.2, 46.4);
  ctx.lineTo(7.6, 49.4);
  ctx.lineTo(5.2, 43.6);
  ctx.bezierCurveTo(0, 38, -5.4, 33, -7.6, 27);
  ctx.bezierCurveTo(-8.2, 23, -7.8, 19, -6.4, 16.5);
  ctx.closePath();
}

function strands(ctx: CanvasRenderingContext2D): void {
  ctx.beginPath();
  ctx.moveTo(-4, 19);
  ctx.quadraticCurveTo(8, 18, 15, 30);
  ctx.moveTo(-2, 25);
  ctx.quadraticCurveTo(6, 30, 9.6, 44);
  ctx.moveTo(-12, 22);
  ctx.quadraticCurveTo(-19, 30, -19.6, 52);
  stroke(ctx, HAIR_LIGHT, 1);
  ctx.beginPath();
  ctx.moveTo(3, 29);
  ctx.quadraticCurveTo(11, 33, 13.4, 47);
  ctx.moveTo(19, 36);
  ctx.quadraticCurveTo(20.4, 52, 20.4, 66);
  ctx.moveTo(-16, 40);
  ctx.quadraticCurveTo(-18.4, 54, -18.8, 68);
  stroke(ctx, HAIR_DARK, 0.7);
}

function head(ctx: CanvasRenderingContext2D, r: Rig): void {
  shaded(ctx, backPath, HAIR, HAIR_DARK, 27, 46, 9, 30);
  face(ctx, SKIN, FACE, r);
  for (const s of [-1, 1]) ellipse(ctx, s * 11.4, 60.6, 3.6, 2.2, 'rgba(236,118,108,0.26)');
  eyes(ctx, r, EYES, SKIN);
  nose(ctx, SKIN, 55, 60, 2.2);
  mouth(ctx, r, MOUTH);
  shaded(ctx, leftLockPath, HAIR, HAIR_DARK, -26, 60, 5, 16);
  shaded(ctx, fringePath, HAIR, HAIR_DARK, 26, 52, 6, 20);
  strands(ctx);
  brows(ctx, r, BROWS); // drawn over the fringe, cartoon style, so the mood always reads
}

/** A lucky fang on a dark cord, swinging a little. */
function pendant(ctx: CanvasRenderingContext2D, t: number): void {
  const sway = Math.sin(t * 1.9) * 0.6;
  poly(ctx, [-6, 80.6, -2.6, 88, sway, 92.4, 2.6, 88, 6, 80.6], '#3a2a20', 0.8);
  ctx.save();
  ctx.translate(sway, 92.4);
  ctx.rotate(sway * -0.08);
  ctx.beginPath();
  ctx.moveTo(-1.5, 0);
  ctx.quadraticCurveTo(-1.8, 5.4, 0.9, 9.6);
  ctx.quadraticCurveTo(1.8, 4.6, 1.5, 0);
  ctx.closePath();
  paint(ctx, '#f2e7c9', LINE, 0.6);
  poly(ctx, [-0.6, 2, 0.2, 4.6], 'rgba(150,120,80,0.6)', 0.4);
  ellipse(ctx, 0, 0, 1.9, 1, '#2b1e16');
  ctx.restore();
}

function body(ctx: CanvasRenderingContext2D, r: Rig): void {
  flightSuit(ctx, SUIT, SKIN);
  roundPatch(ctx, -26, 99.5, 4.8, '#f0c23a', '#2d4f8e');
  ctx.beginPath(); // lightning bolt
  ctx.moveTo(-25.2, 96.2);
  ctx.lineTo(-27.6, 100);
  ctx.lineTo(-25.8, 100);
  ctx.lineTo(-26.8, 103);
  ctx.lineTo(-24, 98.8);
  ctx.lineTo(-25.8, 98.8);
  ctx.closePath();
  paint(ctx, '#ffe066');
  pendant(ctx, r.t);
}

export const PILOT1: AvatarArt = {
  sky: {
    top: '#4c6db2', mid: '#e7a2b6', low: '#ffd79c', sea: '#5c7aa6', cloud: 'rgba(255,236,240,0.7)',
    sun: '#fff1b8', glow: '255,214,150', sunX: -30, sunY: 74, sunR: 7, island: 1,
  },
  moods: moods(-0.25),
  tilt: 0,
  body,
  head,
};
