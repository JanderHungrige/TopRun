import { circle, ellipse, fillPair, fillPoly } from '../shapes';
import type { CharacterArt, Frame, Rig } from './index';
import {
  brows, eyes, face, gesture, limb, LINE, mouth, neck, nose, paint, poly, shaded, stroke, torso,
  type Brows, type Eyes, type Face, type Hand, type Mouth, type Skin,
} from './parts';

/** Lt. "Duke" Carter, your wingman: grey helmet with a red stripe, visor up, mask dangling, olive flight suit. */

const SKIN: Skin = { base: '#e6b48e', dark: '#c48f6a', light: '#f6cfac', lip: '#9c5a4c' };
const FACE: Face = { w: 16.8, jaw: 12, top: 28, chin: 76 };
const EYES: Eyes = { x: 7.3, y: 50, rx: 3.2, ry: 2.3, iris: '#4f7f5a' };
const BROWS: Brows = { x0: 2.4, x1: 13, y: 43.6, th: 2.4, color: '#6b4426' };
const MOUTH: Mouth = { y: 66.6, w: 7.4, lip: SKIN.lip, shade: SKIN.dark, grin: true, smirk: 1.4 };
const HELM = '#9ba3a9';
const HELM_DARK = '#6f787e';
const HELM_LIGHT = '#c8ced2';
const RED = '#c8312a';
const OLIVE = '#5f6b3f';
const OLIVE_DARK = '#454e2c';
const OLIVE_LIGHT = '#77844f';
const STRAP = '#2f3329';
const RUBBER = '#3c433a';
const HAND: Hand = { skin: '#b89c6c', dark: '#95794d', sleeve: OLIVE, sleeveDark: OLIVE_DARK }; // flight gloves

/** In the cockpit: sky and clouds streaming past the canopy, the canopy bow overhead. */
function background(ctx: CanvasRenderingContext2D, f: Frame, t: number): void {
  const g = ctx.createLinearGradient(0, f.t, 0, f.b);
  g.addColorStop(0, '#24578f');
  g.addColorStop(1, '#8cbfe2');
  ctx.fillStyle = g;
  ctx.fillRect(f.l, f.t, f.r - f.l, f.b - f.t);
  for (let i = 0; i < 3; i++) {
    const x = ((((t * 18 + i * 47) % 150) + 150) % 150) - 75;
    ellipse(ctx, -x, 24 + i * 22, 16 + i * 4, 3.4, 'rgba(255,255,255,0.45)');
  }
  ctx.beginPath(); // canopy bow
  ctx.moveTo(f.l - 4, 62);
  ctx.quadraticCurveTo(0, -26, f.r + 4, 62);
  stroke(ctx, '#353a3f', 7);
  stroke(ctx, '#565d64', 2);
}

function harness(ctx: CanvasRenderingContext2D): void {
  for (const s of [-1, 1]) poly(ctx, [s * 22, 87, s * 17, 104, s * 14, 126], STRAP, 4.4);
  poly(ctx, [-17, 109, 17, 109], STRAP, 3.4);
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.roundRect(s * 15.5 - 3, 106.4, 6, 5.2, 1.2);
    paint(ctx, '#b9bec1', LINE, 0.6);
  }
  circle(ctx, -27, 99, 4.4, '#e8c01c'); // squadron patch
  circle(ctx, -27, 99, 3.1, RED);
  fillPoly(ctx, [-27, 96.6, -25.4, 100.4, -28.6, 100.4], '#f4f0e0');
  ctx.beginPath();
  ctx.roundRect(21, 97.5, 10, 4.6, 0.8); // name tag
  paint(ctx, '#5a3a24', LINE, 0.5);
  poly(ctx, [23, 99.4, 29, 99.4], '#d6b25a', 0.7);
}

function body(ctx: CanvasRenderingContext2D): void {
  neck(ctx, SKIN, 8);
  torso(ctx, OLIVE, OLIVE_DARK);
  fillPoly(ctx, [-8.4, 84.4, 8.4, 84.4, 0, 97], '#d8d2bf'); // undershirt in the open collar
  fillPoly(ctx, [-8.4, 84.4, 8.4, 84.4, 0, 91], SKIN.dark);
  fillPair(ctx, [8, 83.6, 17, 86, 12.4, 97, 2, 97.6], OLIVE_LIGHT, LINE); // collar points
  poly(ctx, [0, 97.6, 0, 126], '#2a2f22', 0.8);
  harness(ctx);
}

function helmetPath(ctx: CanvasRenderingContext2D): void {
  ctx.beginPath();
  ctx.moveTo(-15.4, 64);
  ctx.lineTo(-15.4, 48);
  ctx.bezierCurveTo(-15, 38.5, -10, 35.2, 0, 35.2);
  ctx.bezierCurveTo(10, 35.2, 15, 38.5, 15.4, 48);
  ctx.lineTo(15.4, 64);
  ctx.quadraticCurveTo(18, 69.5, 20.6, 67);
  ctx.bezierCurveTo(23.2, 56, 23.6, 42, 22.6, 32);
  ctx.bezierCurveTo(21.6, 16, 13, 8.6, 0, 8.6);
  ctx.bezierCurveTo(-13, 8.6, -21.6, 16, -22.6, 32);
  ctx.bezierCurveTo(-23.6, 42, -23.2, 56, -20.6, 67);
  ctx.quadraticCurveTo(-18, 69.5, -15.4, 64);
  ctx.closePath();
}

/** Shell with the face opening, red callsign stripe, raised visor in its housing. */
function helmet(ctx: CanvasRenderingContext2D): void {
  shaded(ctx, helmetPath, HELM, HELM_DARK, 25, 44, 10, 30);
  fillPoly(ctx, [-2.8, 8.9, 2.8, 8.9, 3.6, 22, -3.6, 22], RED);
  fillPair(ctx, [3.6, 9.4, 4.4, 9.6, 5.4, 22, 4.4, 22], '#f2f2ee');
  ellipse(ctx, -11, 18, 4, 2.2, HELM_LIGHT, -0.6);
  const g = ctx.createLinearGradient(0, 21, 0, 31);
  g.addColorStop(0, '#1b2129');
  g.addColorStop(1, '#4a5868');
  ctx.beginPath();
  ctx.moveTo(-19.6, 33);
  ctx.quadraticCurveTo(0, 15.4, 19.6, 33);
  ctx.lineTo(19.8, 28);
  ctx.quadraticCurveTo(0, 11.6, -19.8, 28);
  ctx.closePath();
  paint(ctx, g, LINE);
  poly(ctx, [-12, 25.6, -5, 22.4], 'rgba(255,255,255,0.55)', 1.2);
  ctx.beginPath();
  ctx.moveTo(-20, 27.6);
  ctx.quadraticCurveTo(0, 10.4, 20, 27.6);
  stroke(ctx, HELM_DARK, 2.2);
  for (const s of [-1, 1]) circle(ctx, s * 20.6, 40, 1.6, HELM_DARK);
}

/** Oxygen mask unclipped on one side, hanging by its strap beside the jaw. */
function mask(ctx: CanvasRenderingContext2D, r: Rig): void {
  const swing = Math.sin(r.t * 1.3) * 0.06;
  limb(ctx, [-25, 88, -33, 104, -31, 128], 3, RUBBER);
  for (let y = 91; y < 124; y += 3) {
    const cx = y < 104 ? -25 - (y - 88) * 0.5 : -33 + (y - 104) / 12; // follow the hose centreline
    poly(ctx, [cx - 2.6, y - 0.8, cx + 2.6, y + 0.4], '#262b25', 0.7);
  }
  poly(ctx, [-19.6, 62, -20.8, 69], STRAP, 1.8);
  ctx.save();
  ctx.translate(-22, 79);
  ctx.rotate(0.42 + swing);
  ctx.beginPath();
  ctx.moveTo(0, -10);
  ctx.bezierCurveTo(7.6, -10, 8.6, 2.6, 5.8, 7.6);
  ctx.quadraticCurveTo(0, 10.6, -5.8, 7.6);
  ctx.bezierCurveTo(-8.6, 2.6, -7.6, -10, 0, -10);
  ctx.closePath();
  paint(ctx, '#7c877e', RUBBER, 1.6);
  ellipse(ctx, -2.2, -4, 2, 3.4, 'rgba(255,255,255,0.32)', 0.3);
  circle(ctx, 0, 4, 2.8, '#2b302a');
  circle(ctx, 0, 4, 1.2, '#5d665e');
  ctx.restore();
}

function head(ctx: CanvasRenderingContext2D, r: Rig): void {
  face(ctx, SKIN, FACE, r);
  eyes(ctx, r, EYES, SKIN);
  brows(ctx, r, BROWS);
  nose(ctx, SKIN, 50, 60.4, 3);
  mouth(ctx, r, MOUTH);
  helmet(ctx);
  mask(ctx, r);
}

export const WINGMAN: CharacterArt = {
  background,
  body,
  head,
  gesture: (ctx, r) => gesture(ctx, r.gesture, HAND),
};
