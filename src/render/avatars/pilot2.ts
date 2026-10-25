import type { Rig } from '../portraits';
import {
  brows, eyes, face, LINE, mouth, nose, paint, shaded, stroke,
  type Brows, type Eyes, type Face, type Mouth, type Skin,
} from '../portraits/parts';
import { circle, ellipse } from '../shapes';
import { flightSuit, moods, roundPatch, type AvatarArt, type Suit } from './kit';

/** Pilot 2: long straight blond hair, freckles, blue-grey eyes, an easy smile, navy suit with a guitar patch. Blue-sky day. */

const SKIN: Skin = { base: '#f2c6a0', dark: '#d9a580', light: '#fcdcc0', lip: '#b46458' };
const FACE: Face = { w: 18, jaw: 12.4, top: 26, chin: 74.5 };
const EYES: Eyes = { x: 7.6, y: 52, rx: 4, ry: 3, iris: '#6d8ea8' };
const HAIR = '#ecd08a';
const HAIR_DARK = '#c4a258';
const HAIR_LIGHT = '#fbecbc';
const BROWS: Brows = { x0: 3, x1: 12, y: 45.6, th: 1.7, color: '#b08646' };
const MOUTH: Mouth = { y: 66, w: 5.8, lip: SKIN.lip, shade: SKIN.dark };
const SUIT: Suit = { base: '#2c3d68', dark: '#1f2b4c', light: '#43588f', tee: '#e8e2d2' };
const FRECKLES: readonly number[] = [
  -13.2, 57.6, -11, 59.4, -9, 57, -12, 61.6, -8.4, 60.6, -6.6, 58.2, -2.4, 56.4, -1.2, 54.4,
  1.4, 54.8, 2.4, 56.6, 6.8, 58.4, 8.6, 60.8, 9.2, 57, 11.2, 59.6, 13, 57.8, 12.2, 61.8,
];

/** Long hair hanging behind the shoulders (body space, so the suit covers it). */
function backPath(ctx: CanvasRenderingContext2D): void {
  ctx.beginPath();
  ctx.moveTo(-25.5, 108);
  ctx.bezierCurveTo(-28.5, 80, -28, 28, -14, 14.5);
  ctx.bezierCurveTo(-5, 7, 9, 7, 17, 14.5);
  ctx.bezierCurveTo(28, 28, 28.5, 80, 25.5, 108);
  ctx.closePath();
}

/** Left lock: from the parting down past the shoulder, in front of the suit. */
function leftLockPath(ctx: CanvasRenderingContext2D): void {
  ctx.beginPath();
  ctx.moveTo(-2, 15.6);
  ctx.bezierCurveTo(-13, 14.5, -22.4, 22, -23, 40);
  ctx.bezierCurveTo(-24, 60, -23, 82, -26.6, 104);
  ctx.lineTo(-23, 100.4);
  ctx.lineTo(-20.8, 105.4);
  ctx.lineTo(-18.8, 98.8);
  ctx.lineTo(-16.8, 101.6);
  ctx.bezierCurveTo(-16.4, 84, -17.8, 62, -16.6, 47);
  ctx.bezierCurveTo(-15.4, 34, -9, 27, -2, 25);
  ctx.closePath();
}

/** Right lock: resting on the shoulder, so the name tape stays visible. */
function rightLockPath(ctx: CanvasRenderingContext2D): void {
  ctx.beginPath();
  ctx.moveTo(-2, 15.6);
  ctx.bezierCurveTo(10, 14.5, 21.5, 22, 22.4, 40);
  ctx.bezierCurveTo(23.2, 58, 24, 76, 28.6, 92);
  ctx.lineTo(25, 89.6);
  ctx.lineTo(22.6, 93.6);
  ctx.lineTo(20.6, 87.6);
  ctx.lineTo(18.4, 90.4);
  ctx.bezierCurveTo(17, 76, 17.6, 60, 16.4, 47);
  ctx.bezierCurveTo(15.4, 35, 9, 27, -2, 25);
  ctx.closePath();
}

function strands(ctx: CanvasRenderingContext2D): void {
  ctx.beginPath();
  ctx.moveTo(-6, 18);
  ctx.quadraticCurveTo(-19, 22, -20.4, 46);
  ctx.lineTo(-21.4, 96);
  ctx.moveTo(4, 18);
  ctx.quadraticCurveTo(17, 22, 19.6, 46);
  ctx.lineTo(22.4, 84);
  stroke(ctx, HAIR_LIGHT, 1);
  ctx.beginPath();
  ctx.moveTo(-18.6, 52);
  ctx.lineTo(-19.4, 98);
  ctx.moveTo(19, 54);
  ctx.lineTo(21, 86);
  ctx.moveTo(-2, 16.4);
  ctx.lineTo(-2, 24.4);
  stroke(ctx, HAIR_DARK, 0.7);
}

function head(ctx: CanvasRenderingContext2D, r: Rig): void {
  face(ctx, SKIN, FACE, r);
  for (const s of [-1, 1]) ellipse(ctx, s * 11.4, 61, 3.4, 2, 'rgba(236,120,110,0.2)');
  ctx.fillStyle = 'rgba(178,96,60,0.6)';
  for (let i = 0; i < FRECKLES.length; i += 2) {
    ctx.beginPath();
    ctx.arc(FRECKLES[i] ?? 0, FRECKLES[i + 1] ?? 0, 0.55, 0, Math.PI * 2);
    ctx.fill();
  }
  eyes(ctx, r, EYES, SKIN);
  brows(ctx, r, BROWS);
  nose(ctx, SKIN, 55, 60.4, 2.3);
  mouth(ctx, r, MOUTH);
  shaded(ctx, leftLockPath, HAIR, HAIR_DARK, -28, 70, 6, 30);
  shaded(ctx, rightLockPath, HAIR, HAIR_DARK, 28, 62, 7, 30);
  strands(ctx);
}

function guitarPatch(ctx: CanvasRenderingContext2D): void {
  roundPatch(ctx, -8.6, 99.6, 4.4, '#e9c25a', '#1c2a4c');
  ctx.save();
  ctx.translate(-8.6, 99.8);
  ctx.rotate(-0.7);
  ctx.fillStyle = '#9a6234';
  ctx.fillRect(-0.35, -3.6, 0.7, 3.6);
  ctx.fillRect(-0.65, -4.3, 1.3, 1);
  ellipse(ctx, 0, 0.4, 1.4, 1.1, '#e0493c');
  ellipse(ctx, 0, 1.8, 1.9, 1.5, '#e0493c');
  circle(ctx, 0, 1, 0.4, '#1c2a4c');
  ctx.restore();
}

function body(ctx: CanvasRenderingContext2D): void {
  shaded(ctx, backPath, HAIR, HAIR_DARK, 30, 60, 8, 40);
  flightSuit(ctx, SUIT, SKIN);
  guitarPatch(ctx);
}

/** A white flight helmet with a sky-blue stripe, held at the side in a gloved hand. */
function helmet(ctx: CanvasRenderingContext2D): void {
  ctx.save();
  ctx.translate(-36, 109);
  ctx.rotate(-0.2);
  ctx.beginPath();
  ctx.arc(0, 0, 12, 0, Math.PI * 2);
  paint(ctx, '#eef1f4', LINE);
  ctx.save();
  ctx.clip();
  ellipse(ctx, 9, 7, 8, 13, '#c3cad1');
  ctx.restore();
  ctx.beginPath();
  ctx.ellipse(0, 2, 11, 9.6, 0, Math.PI * 1.08, Math.PI * 1.92);
  stroke(ctx, '#4fb0e6', 2.8);
  ctx.beginPath();
  ctx.ellipse(5.6, 3.2, 6.2, 5.2, 0.2, 0, Math.PI * 2);
  paint(ctx, '#26303c', LINE, 0.6);
  ellipse(ctx, 3.6, 1.2, 2.2, 1.2, 'rgba(255,255,255,0.45)', -0.4);
  ctx.beginPath();
  ctx.arc(0, 0, 11.4, 0.5, 2.5);
  stroke(ctx, '#3a4048', 1.8);
  ctx.restore();
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.roundRect(-29.6 + i * 2.7, 116.4 + i * 0.6, 2.6, 6, 1.3);
    paint(ctx, '#c8a878', LINE, 0.5);
  }
}

export const PILOT2: AvatarArt = {
  sky: {
    top: '#2a78cc', mid: '#7cbcec', low: '#d6edf9', sea: '#2f6ea6', cloud: 'rgba(255,255,255,0.85)',
    sun: '#fffbe6', glow: '255,250,215', sunX: 34, sunY: 14, sunR: 5, island: -1,
  },
  moods: moods(0.9),
  tilt: 0,
  body,
  head,
  front: helmet,
};
