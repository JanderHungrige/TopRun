import { ellipse, fillPair, fillPoly } from '../shapes';
import type { CharacterArt, Frame, Rig } from './index';
import {
  brows, face, gesture, jawDrop, LINE, mouth, neck, nose, paint, poly, shaded, stroke, torso,
  type Brows, type Face, type Hand, type Mouth, type Skin,
} from './parts';

/** Admiral "Ace" Kincaid: gold aviators, big swept-back hair, choker dress whites dripping with gold. */

const SKIN: Skin = { base: '#d49a68', dark: '#b0784a', light: '#ecbd8e', lip: '#7c3e2c' };
const FACE: Face = { w: 17.5, jaw: 13.6, top: 28, chin: 77 };
const BROWS: Brows = { x0: 2.6, x1: 14.6, y: 41.2, th: 2.9, color: '#2e190e' };
const MOUTH: Mouth = { y: 67.5, w: 8.8, lip: SKIN.lip, shade: SKIN.dark, grin: true };
const HAIR = '#4a2b19';
const HAIR_DARK = '#2e190e';
const HAIR_LIGHT = '#82522e';
const WHITE = '#f4f3ee';
const WHITE_DARK = '#c7ccd4';
const GOLD = '#dcae3a';
const GOLD_DARK = '#9c731c';
const HAND: Hand = { skin: SKIN.base, dark: SKIN.dark, sleeve: WHITE, sleeveDark: WHITE_DARK };
const RIBBONS = ['#c8312a', '#2a4c9c', '#e8c01c', '#2e7d4a', '#7d2a6e', '#e2601c'] as const;

function background(ctx: CanvasRenderingContext2D, f: Frame, t: number): void {
  const g = ctx.createLinearGradient(0, f.t, 0, f.b);
  g.addColorStop(0, '#2c4c7c');
  g.addColorStop(1, '#0e1a30');
  ctx.fillStyle = g;
  ctx.fillRect(f.l, f.t, f.r - f.l, f.b - f.t);
  ctx.save();
  ctx.translate(0, 46);
  ctx.rotate(t * 0.04); // slow sunburst behind the head
  ctx.beginPath();
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, 150, a, a + 0.25);
    ctx.closePath();
  }
  paint(ctx, 'rgba(160,200,255,0.08)');
  ctx.restore();
}

function star(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, fill: string): void {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const d = i % 2 === 0 ? r : r * 0.42;
    ctx.lineTo(x + Math.cos(a) * d, y + Math.sin(a) * d);
  }
  ctx.closePath();
  paint(ctx, fill);
}

function collarPath(ctx: CanvasRenderingContext2D): void {
  ctx.beginPath();
  ctx.moveTo(-10.5, 78.5);
  ctx.quadraticCurveTo(0, 82.5, 10.5, 78.5);
  ctx.lineTo(12, 88);
  ctx.quadraticCurveTo(0, 92, -12, 88);
  ctx.closePath();
}

function button(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.beginPath();
  ctx.arc(x, y, 1.8, 0, Math.PI * 2);
  paint(ctx, GOLD, GOLD_DARK, 0.6);
  ellipse(ctx, x - 0.5, y - 0.6, 0.6, 0.5, 'rgba(255,255,230,0.85)');
}

/** Shoulder boards with stars, aviator wings and the ribbon bar. */
function insignia(ctx: CanvasRenderingContext2D): void {
  fillPair(ctx, [22, 87, 40.5, 88.8, 46, 95.5, 24.5, 92.2], GOLD, LINE);
  fillPair(ctx, [23.4, 91, 45.2, 94.2, 46, 95.5, 24.5, 92.2], GOLD_DARK);
  for (const s of [-1, 1]) {
    star(ctx, s * 37, 91.6, 2.1, '#fbf8ee');
    star(ctx, s * 30.5, 90.4, 1.7, '#fbf8ee');
  }
  ctx.save();
  ctx.translate(21, 98.4);
  fillPair(ctx, [1.4, -0.9, 9.6, -2.8, 8.6, -0.8, 5.8, 0.6, 1.4, 1.1], GOLD, GOLD_DARK);
  ellipse(ctx, 0, 0, 1.9, 2.3, GOLD_DARK);
  ellipse(ctx, 0, -0.2, 1.1, 1.4, GOLD);
  ctx.restore();
  for (let i = 0; i < 6; i++) {
    const x = 15.2 + (i % 3) * 3.9;
    const y = 102 + Math.floor(i / 3) * 2.4;
    ctx.fillStyle = RIBBONS[i] ?? GOLD;
    ctx.fillRect(x, y, 3.7, 2.2);
    ctx.fillStyle = 'rgba(255,255,255,0.65)';
    ctx.fillRect(x + 1.5, y, 0.7, 2.2);
  }
}

function body(ctx: CanvasRenderingContext2D): void {
  neck(ctx, SKIN, 8.6);
  torso(ctx, WHITE, WHITE_DARK);
  poly(ctx, [0, 88, 0, 124], 'rgba(110,118,130,0.55)', 0.6);
  shaded(ctx, collarPath, WHITE, WHITE_DARK, 16, 86, 6.5, 8);
  for (const s of [-1, 1]) star(ctx, s * 7.6, 85.6, 1.5, GOLD);
  for (let i = 0; i < 4; i++) button(ctx, 0, 95 + i * 8.5);
  insignia(ctx);
}

function hairBackPath(ctx: CanvasRenderingContext2D): void {
  ctx.beginPath();
  ctx.moveTo(-18.6, 56);
  ctx.bezierCurveTo(-25, 42, -26, 19, -14, 10.5);
  ctx.bezierCurveTo(-5, 4.5, 11, 4.5, 19.5, 11);
  ctx.bezierCurveTo(26.5, 18, 25.5, 42, 18.6, 56);
  ctx.closePath();
}

/** The pompadour: a big wave over the forehead swept back over the crown. */
function hairFrontPath(ctx: CanvasRenderingContext2D): void {
  ctx.beginPath();
  ctx.moveTo(-17.6, 43);
  ctx.bezierCurveTo(-19.6, 28, -17.5, 16.5, -7, 12);
  ctx.bezierCurveTo(5, 7.5, 18.5, 10.5, 20.8, 22);
  ctx.bezierCurveTo(21.6, 30, 19.4, 37, 17.6, 43);
  ctx.bezierCurveTo(16.6, 35, 13, 30.5, 7, 30);
  ctx.bezierCurveTo(1, 29.6, -4, 33.5, -9, 31.6);
  ctx.bezierCurveTo(-13.5, 30.2, -16.4, 36, -17.6, 43);
  ctx.closePath();
}

function hairFront(ctx: CanvasRenderingContext2D): void {
  fillPair(ctx, [15.4, 40, 17.8, 40, 17.6, 53, 16, 53], HAIR); // sideburns
  shaded(ctx, hairFrontPath, HAIR, HAIR_DARK, 20, 27, 6.5, 16);
  ctx.beginPath();
  ctx.moveTo(-11, 31);
  ctx.quadraticCurveTo(-9, 18, 5, 12.4);
  ctx.moveTo(-3, 30.6);
  ctx.quadraticCurveTo(0, 19, 13, 14.8);
  ctx.moveTo(5, 29.8);
  ctx.quadraticCurveTo(10, 22, 18, 20.8);
  ctx.moveTo(-19.4, 46);
  ctx.quadraticCurveTo(-22.6, 32, -19, 19); // swept back over the temples
  stroke(ctx, HAIR_LIGHT, 1.1);
  ctx.beginPath();
  ctx.moveTo(-15, 36);
  ctx.quadraticCurveTo(-15, 22, -5, 15.6);
  ctx.moveTo(19.6, 46);
  ctx.quadraticCurveTo(22.8, 32, 19.6, 19);
  stroke(ctx, HAIR_DARK, 0.8);
}

/** Teardrop lens; s = -1 / 1 picks the side. */
function lensPath(ctx: CanvasRenderingContext2D, s: number): void {
  ctx.beginPath();
  ctx.moveTo(s * 1.8, 46);
  ctx.bezierCurveTo(s * 6, 44, s * 13, 44, s * 16.6, 45);
  ctx.bezierCurveTo(s * 17.3, 49.5, s * 15.6, 55.5, s * 11, 57.2);
  ctx.bezierCurveTo(s * 6.4, 58.8, s * 2.4, 56, s * 1.8, 51);
  ctx.closePath();
}

function aviators(ctx: CanvasRenderingContext2D): void {
  const g = ctx.createLinearGradient(0, 44, 0, 58);
  g.addColorStop(0, '#0c1016');
  g.addColorStop(0.5, '#25313f');
  g.addColorStop(1, '#6f8698');
  for (const s of [-1, 1]) {
    lensPath(ctx, s);
    paint(ctx, g);
    ctx.save();
    ctx.clip();
    const cx = s * 9.4;
    fillPoly(ctx, [cx - 6.4, 57, cx - 3.4, 57, cx + 4.4, 44, cx + 1.4, 44], 'rgba(255,255,255,0.55)');
    fillPoly(ctx, [cx - 1.8, 57, cx - 0.7, 57, cx + 7, 44, cx + 5.9, 44], 'rgba(255,255,255,0.32)');
    ctx.restore();
    lensPath(ctx, s);
    stroke(ctx, GOLD, 1.25);
  }
  ctx.beginPath();
  ctx.moveTo(-1.9, 47);
  ctx.quadraticCurveTo(0, 45.2, 1.9, 47);
  ctx.moveTo(-5.5, 44.6);
  ctx.lineTo(5.5, 44.6);
  ctx.moveTo(16.6, 45.4);
  ctx.lineTo(19.6, 46.2);
  ctx.moveTo(-16.6, 45.4);
  ctx.lineTo(-19.6, 46.2);
  stroke(ctx, GOLD, 1);
}

function head(ctx: CanvasRenderingContext2D, r: Rig): void {
  shaded(ctx, hairBackPath, HAIR, HAIR_DARK, 23, 40, 9, 26);
  face(ctx, SKIN, FACE, r);
  poly(ctx, [0, 73.8 + jawDrop(r), 0, 75.8 + jawDrop(r)], SKIN.dark, 0.8); // chin cleft
  nose(ctx, SKIN, 50, 61, 3.4);
  mouth(ctx, r, MOUTH);
  brows(ctx, r, BROWS);
  hairFront(ctx);
  aviators(ctx);
}

export const ADMIRAL: CharacterArt = {
  background,
  body,
  head,
  gesture: (ctx, r) => gesture(ctx, r.gesture, HAND),
};
