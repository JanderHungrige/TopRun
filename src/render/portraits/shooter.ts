import { ellipse } from '../shapes';
import type { CharacterArt, Frame, Rig } from './index';
import {
  arm, brows, eyes, face, gesture, LINE, mouth, neck, nose, paint, pointHand, poly, shaded, stroke, torso, torsoPath,
  type Brows, type Eyes, type Face, type Hand, type Mouth, type Skin,
} from './parts';

/** Lt. Sam "Shooter" Reyes, catapult officer: yellow deck jersey, white cranial with goggles, ear cups and boom mic. */

const SKIN: Skin = { base: '#c88b62', dark: '#a56b45', light: '#e2aa82', lip: '#8f4038' };
const FACE: Face = { w: 16, jaw: 10.4, top: 29, chin: 76 };
const EYES: Eyes = { x: 7.2, y: 50.6, rx: 3.4, ry: 2.5, iris: '#5b3a20', lash: true };
const BROWS: Brows = { x0: 2.3, x1: 12.6, y: 44.2, th: 2, color: '#2b1a12', bias: 0.7 };
const MOUTH: Mouth = { y: 67, w: 6.3, lip: SKIN.lip, shade: SKIN.dark, full: '#b2554c' };
const HAIR = '#2b1a12';
const YELLOW = '#f2c12e';
const YELLOW_DARK = '#c99516';
const SHELL = '#efefea';
const SHELL_DARK = '#c2c6c6';
const TAPE = '#dfe4e8';
const HAND: Hand = { skin: SKIN.base, dark: SKIN.dark, sleeve: YELLOW, sleeveDark: YELLOW_DARK };

/** Flight deck: hazy sky, grey deck, a yellow foul line and catapult steam drifting past. */
function background(ctx: CanvasRenderingContext2D, f: Frame, t: number): void {
  const g = ctx.createLinearGradient(0, f.t, 0, 92);
  g.addColorStop(0, '#5e9fd2');
  g.addColorStop(1, '#cfe5f2');
  ctx.fillStyle = g;
  ctx.fillRect(f.l, f.t, f.r - f.l, f.b - f.t);
  ctx.fillStyle = '#7a8288';
  ctx.fillRect(28, 58, 30, 34); // the carrier island in the haze
  ctx.fillRect(36, 44, 6, 14);
  ctx.fillStyle = '#5b6064';
  ctx.fillRect(f.l, 90, f.r - f.l, f.b - 90);
  ctx.fillStyle = '#e8c01c';
  ctx.fillRect(f.l, 96, f.r - f.l, 1.4);
  const a0 = ctx.globalAlpha; // respect a caller fading the portrait in
  for (let i = 0; i < 4; i++) {
    const k = ((t * 0.22 + i / 4) % 1 + 1) % 1;
    ctx.globalAlpha = a0 * (1 - k) * 0.5;
    ellipse(ctx, -46 + k * 30 + i * 3, 92 - k * 22, 6 + k * 12, 4 + k * 6, '#ffffff');
  }
  ctx.globalAlpha = a0;
}

function body(ctx: CanvasRenderingContext2D): void {
  neck(ctx, SKIN, 7.2);
  torso(ctx, YELLOW, YELLOW_DARK);
  ctx.save();
  torsoPath(ctx);
  ctx.clip();
  ctx.fillStyle = TAPE; // reflective tape on the float coat
  ctx.fillRect(-60, 105, 120, 3.4);
  ctx.fillStyle = 'rgba(120,130,140,0.6)';
  ctx.fillRect(-60, 106.4, 120, 0.6);
  ctx.restore();
  ctx.beginPath();
  ctx.moveTo(-9, 84.4);
  ctx.quadraticCurveTo(0, 91, 9, 84.4);
  stroke(ctx, YELLOW_DARK, 2.4);
  poly(ctx, [0, 90, 0, 104], 'rgba(120,80,10,0.5)', 0.7);
}

function cranialPath(ctx: CanvasRenderingContext2D): void {
  ctx.beginPath();
  ctx.moveTo(-19.6, 52);
  ctx.bezierCurveTo(-21.2, 30, -14, 15.5, 0, 15);
  ctx.bezierCurveTo(14, 15.5, 21.2, 30, 19.6, 52);
  ctx.lineTo(15.6, 48);
  ctx.bezierCurveTo(15.6, 38.5, 12, 34.5, 0, 34.4);
  ctx.bezierCurveTo(-12, 34.5, -15.6, 38.5, -15.6, 48);
  ctx.closePath();
}

/** White cranial, goggles pushed up, big ear cups, chin strap is drawn under the face. */
function cranial(ctx: CanvasRenderingContext2D): void {
  shaded(ctx, cranialPath, SHELL, SHELL_DARK, 20, 34, 8, 22);
  poly(ctx, [-15, 25, -6, 18, 6, 18, 15, 25], 'rgba(150,155,155,0.7)', 0.7); // shell seam
  ctx.beginPath();
  ctx.moveTo(-19.6, 33.6);
  ctx.quadraticCurveTo(0, 21, 19.6, 33.6);
  stroke(ctx, '#2a2c2e', 2.6);
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.roundRect(s > 0 ? 1.6 : -12.6, 23.6, 11, 7.2, 3.2);
    paint(ctx, '#86c4d6', '#2f3336', 1.3);
    ellipse(ctx, s * 5 - 2, 25.8, 2.2, 1, 'rgba(255,255,255,0.7)', -0.2);
  }
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(s * 19.4, 53, 6.4, 8.6, 0, 0, Math.PI * 2);
    paint(ctx, s > 0 ? SHELL_DARK : SHELL, LINE);
    ellipse(ctx, s * 19.8, 53, 3.4, 5.4, s > 0 ? '#a9adad' : '#d6d9d8');
  }
}

function boomMic(ctx: CanvasRenderingContext2D): void {
  ctx.beginPath();
  ctx.moveTo(19, 58.5);
  ctx.quadraticCurveTo(18, 70, 11.6, 70.4);
  stroke(ctx, '#2a2a2a', 1.3);
  ellipse(ctx, 10.6, 70.4, 2.3, 1.7, '#1d1d1d');
}

function head(ctx: CanvasRenderingContext2D, r: Rig): void {
  ellipse(ctx, 0, 47, 19.6, 22, HAIR); // hair tucked under the cranial
  ctx.beginPath(); // ponytail falling over the shoulder
  ctx.moveTo(-17, 56);
  ctx.bezierCurveTo(-25, 64, -22, 80, -27, 96);
  ctx.bezierCurveTo(-21, 90, -16, 76, -12.5, 64);
  ctx.closePath();
  paint(ctx, HAIR, LINE, 0.7);
  poly(ctx, [-19.5, 64, -21.5, 78], '#4a3426', 0.8);
  ctx.beginPath(); // chin strap, mostly hidden behind the jaw
  ctx.moveTo(-17, 60);
  ctx.quadraticCurveTo(-13, 77, 0, 78.6);
  ctx.quadraticCurveTo(13, 77, 17, 60);
  stroke(ctx, '#3a3a38', 1.6);
  face(ctx, SKIN, FACE, r);
  for (const s of [-1, 1]) ellipse(ctx, s * 9.6, 60, 3.4, 2, 'rgba(214,90,80,0.2)');
  eyes(ctx, r, EYES, SKIN);
  brows(ctx, r, BROWS);
  nose(ctx, SKIN, 50.5, 60, 2.8);
  mouth(ctx, r, MOUTH);
  ctx.beginPath(); // fringe peeking out under the shell
  ctx.moveTo(-15.6, 41);
  ctx.quadraticCurveTo(-13, 35, -6, 34.4);
  ctx.lineTo(-12, 36.6);
  ctx.closePath();
  paint(ctx, HAIR);
  cranial(ctx);
  boomMic(ctx);
}

/** The launch signal: arm thrust up and forward, finger pointing down the deck. */
function launch(ctx: CanvasRenderingContext2D): void {
  arm(ctx, [36, 130, 47, 84, 38, 56], HAND);
  pointHand(ctx, 37, 50, 9, -13, HAND);
  ctx.beginPath();
  ctx.moveTo(29, 31);
  ctx.lineTo(33, 25);
  ctx.moveTo(37, 22);
  ctx.lineTo(39, 15);
  stroke(ctx, 'rgba(255,255,255,0.85)', 1.1);
}

export const SHOOTER: CharacterArt = {
  background,
  body,
  head,
  gesture: (ctx, r) => (r.gesture === 'point' ? launch(ctx) : gesture(ctx, r.gesture, HAND)),
};
