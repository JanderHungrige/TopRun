import { ellipse } from '../shapes';
import type { CharacterArt, Frame, Rig } from './index';
import {
  arm, brows, eyes, face, fist, gesture, limb, LINE, mouth, neck, nose, paint, poly, shaded, stroke, torso,
  type Brows, type Eyes, type Face, type Hand, type Mouth, type Skin,
} from './parts';

/** Chief "Wrench" Kowalski: grey flat-top, bushy mustache, ruddy and greasy, brown deck jersey, ear defenders. */

const SKIN: Skin = { base: '#dc8e6c', dark: '#b86a4c', light: '#f3b496', lip: '#84402f' };
const FACE: Face = { w: 18.6, jaw: 14.4, top: 29, chin: 77.5 };
const EYES: Eyes = { x: 7.8, y: 50.5, rx: 2.9, ry: 2.1, iris: '#3f6f98' };
const BROWS: Brows = { x0: 2.2, x1: 14.2, y: 45, th: 3.9, color: '#8b9195' };
const MOUTH: Mouth = { y: 69.2, w: 6.6, lip: SKIN.lip, shade: SKIN.dark };
const GREY = '#a7acaf';
const GREY_DARK = '#757b7f';
const GREY_LIGHT = '#d3d7d9';
const JERSEY = '#6e4527';
const JERSEY_DARK = '#4f301a';
const CUP = '#3d4a3c';
const STEEL = '#b9c0c6';
const STEEL_DARK = '#7d868e';
const GREASE = 'rgba(46,34,26,0.55)';
const HAND: Hand = { skin: SKIN.base, dark: SKIN.dark, sleeve: JERSEY, sleeveDark: JERSEY_DARK };

function background(ctx: CanvasRenderingContext2D, f: Frame): void {
  const g = ctx.createLinearGradient(0, f.t, 0, f.b);
  g.addColorStop(0, '#5f6264');
  g.addColorStop(1, '#2a2d2f');
  ctx.fillStyle = g;
  ctx.fillRect(f.l, f.t, f.r - f.l, f.b - f.t);
  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  for (let x = Math.floor(f.l / 9) * 9; x < f.r; x += 9) ctx.fillRect(x, f.t, 4.5, f.b - f.t); // corrugated wall
  const glow = ctx.createRadialGradient(-32, 8, 2, -32, 8, 75);
  glow.addColorStop(0, 'rgba(255,178,92,0.5)');
  glow.addColorStop(1, 'rgba(255,178,92,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(f.l, f.t, f.r - f.l, f.b - f.t);
}

/** Ear defenders hanging round the neck: black cushions facing up, green shells, a steel yoke each. */
function earDefenders(ctx: CanvasRenderingContext2D): void {
  for (const s of [-1, 1]) {
    poly(ctx, [s * 11.5, 84, s * 15.5, 86.4], STEEL_DARK, 1.4);
    ctx.beginPath();
    ctx.ellipse(s * 17, 93, 6.6, 7.8, s * 0.35, 0, Math.PI * 2);
    paint(ctx, CUP, LINE);
    ellipse(ctx, s * 18.2, 94.4, 3.4, 4.6, '#55644f', s * 0.35);
    ctx.beginPath();
    ctx.ellipse(s * 14.4, 90.4, 5, 6.2, s * 0.35, 0, Math.PI * 2);
    paint(ctx, '#1d201d', LINE, 0.7);
    ellipse(ctx, s * 14.4, 90.4, 2.6, 3.6, '#3a3d3a', s * 0.35);
  }
}

function body(ctx: CanvasRenderingContext2D): void {
  ctx.beginPath(); // headband of the ear defenders, behind the neck
  ctx.moveTo(-15, 87);
  ctx.quadraticCurveTo(0, 74, 15, 87);
  stroke(ctx, '#262c25', 3);
  neck(ctx, SKIN, 9.8);
  torso(ctx, JERSEY, JERSEY_DARK);
  ctx.beginPath();
  ctx.moveTo(-10.4, 84.4);
  ctx.quadraticCurveTo(0, 93, 10.4, 84.4);
  stroke(ctx, JERSEY_DARK, 2.6);
  ellipse(ctx, -27, 112, 4, 1.6, 'rgba(30,20,12,0.3)', -0.4); // a grease wipe on the jersey
  earDefenders(ctx);
}

function flatTopPath(ctx: CanvasRenderingContext2D): void {
  ctx.beginPath();
  ctx.moveTo(-18.4, 44);
  ctx.lineTo(-18.9, 26);
  ctx.quadraticCurveTo(-18.7, 19.4, -13, 19);
  ctx.lineTo(13, 19);
  ctx.quadraticCurveTo(18.7, 19.4, 18.9, 26);
  ctx.lineTo(18.4, 44);
  ctx.lineTo(16.9, 44);
  ctx.lineTo(16.4, 34.5);
  ctx.quadraticCurveTo(10, 30.8, 0, 31.4);
  ctx.quadraticCurveTo(-10, 30.8, -16.4, 34.5);
  ctx.lineTo(-16.9, 44);
  ctx.closePath();
}

function flatTop(ctx: CanvasRenderingContext2D): void {
  shaded(ctx, flatTopPath, GREY, GREY_DARK, 22, 30, 7, 16);
  ctx.fillStyle = GREY_LIGHT;
  ctx.fillRect(-13, 19.2, 24, 1.6);
  ctx.beginPath();
  for (let x = -13.5; x <= 13.5; x += 3) {
    ctx.moveTo(x, 21.6);
    ctx.lineTo(x + 0.4, 25.2);
  }
  stroke(ctx, GREY_DARK, 0.6);
}

/** Forehead lines, crow's feet, ruddy cheeks and the grease smudge. */
function weathering(ctx: CanvasRenderingContext2D): void {
  ctx.beginPath();
  ctx.moveTo(-8, 36.4);
  ctx.quadraticCurveTo(0, 35, 8, 36.4);
  ctx.moveTo(-6, 39.2);
  ctx.quadraticCurveTo(0, 38, 6, 39.2);
  for (const s of [-1, 1]) {
    ctx.moveTo(s * 11.4, 49);
    ctx.lineTo(s * 13.4, 48);
    ctx.moveTo(s * 11.4, 51.4);
    ctx.lineTo(s * 13.4, 52.4);
  }
  stroke(ctx, 'rgba(150,72,48,0.55)', 0.7);
  for (const s of [-1, 1]) ellipse(ctx, s * 10.6, 60, 4.4, 2.8, 'rgba(214,64,52,0.24)');
  ctx.beginPath();
  ctx.moveTo(-15, 58);
  ctx.quadraticCurveTo(-12, 55.4, -8.6, 57.6);
  ctx.quadraticCurveTo(-10, 61.6, -13.6, 61.4);
  ctx.closePath();
  paint(ctx, GREASE);
  poly(ctx, [-14.6, 55.6, -9.4, 57], GREASE, 0.9);
}

function mustache(ctx: CanvasRenderingContext2D, r: Rig): void {
  const y = 62.6 - r.mouth * 0.8 - r.m.lift * 0.3;
  ctx.beginPath();
  ctx.moveTo(0, y);
  ctx.bezierCurveTo(4, y - 1.8, 10, y - 0.8, 12.4, y + 6.8);
  ctx.bezierCurveTo(9, y + 5.6, 5, y + 4.4, 0, y + 4.8);
  ctx.bezierCurveTo(-5, y + 4.4, -9, y + 5.6, -12.4, y + 6.8);
  ctx.bezierCurveTo(-10, y - 0.8, -4, y - 1.8, 0, y);
  ctx.closePath();
  paint(ctx, GREY, LINE, 0.8);
  ctx.beginPath();
  for (let i = -3; i <= 3; i++) {
    ctx.moveTo(i * 2.6, y + 0.8);
    ctx.lineTo(i * 3.1, y + 4.2);
  }
  stroke(ctx, GREY_DARK, 0.6);
  poly(ctx, [-7, y + 0.2, -2, y - 0.6], GREY_LIGHT, 0.8);
}

function head(ctx: CanvasRenderingContext2D, r: Rig): void {
  face(ctx, SKIN, FACE, r);
  weathering(ctx);
  eyes(ctx, r, EYES, SKIN);
  brows(ctx, r, BROWS);
  nose(ctx, SKIN, 50.5, 62, 4.4);
  ellipse(ctx, 0, 60, 3.4, 2.4, 'rgba(206,70,60,0.3)');
  mouth(ctx, r, MOUTH);
  mustache(ctx, r);
  flatTop(ctx);
}

/** A big open-end wrench whose handle runs from (x, y) along the angle `a` (0 = straight up). */
function wrench(ctx: CanvasRenderingContext2D, x: number, y: number, a: number): void {
  const d = Math.asin(2.6 / 6.6);
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(a);
  ctx.beginPath();
  ctx.roundRect(-2.3, -27, 4.6, 36, 2.2);
  paint(ctx, STEEL, LINE);
  ctx.fillStyle = STEEL_DARK;
  ctx.fillRect(0.6, -25, 1.2, 32);
  ctx.beginPath();
  ctx.arc(0, -31, 6.6, -Math.PI / 2 + d, Math.PI * 1.5 - d);
  ctx.lineTo(-2.6, -30.2);
  ctx.lineTo(2.6, -30.2);
  ctx.closePath();
  paint(ctx, STEEL, LINE);
  ellipse(ctx, -2.6, -32.6, 1.2, 2.4, 'rgba(255,255,255,0.6)', 0.4);
  ctx.restore();
}

function point(ctx: CanvasRenderingContext2D): void {
  arm(ctx, [40, 140, 31, 105], HAND);
  wrench(ctx, 27, 100, 0.42);
  fist(ctx, 27, 99, HAND);
  limb(ctx, [32, 97.6, 26, 99.6], 2, SKIN.base);
}

export const CHIEF: CharacterArt = {
  background,
  body,
  head,
  gesture: (ctx, r) => (r.gesture === 'point' ? point(ctx) : gesture(ctx, r.gesture, HAND)),
};
