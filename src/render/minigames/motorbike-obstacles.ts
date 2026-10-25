import { clamp, TAU } from '../../core/math';
import type { ObstacleKind } from '../../game/minigames/motorbike-course';
import { fillPoly } from '../shapes';
import { text } from '../text';
import { ROAD_FAR, ROAD_NEAR, ROAD_Y } from './motorbike-world';

// Motorbike vs. Jet (doc 22): what lies on and beside the perimeter road. `sx` is the screen x where the front
// wheel meets the obstacle in the bike's lane; things across the road lean slightly with depth.

/** Depth 0 = far kerb … 1 = near kerb; the bike's lane sits at LANE. */
const LANE = (ROAD_Y - ROAD_FAR) / (ROAD_NEAR - ROAD_FAR);
/** Oblique projection: the far side of the road is drawn this much further right than the near side. */
const SHEAR = 56;
const roadY = (d: number): number => ROAD_FAR + (ROAD_NEAR - ROAD_FAR) * d;
const lean = (d: number): number => (LANE - d) * SHEAR;
/** Height of the barrier boom's lower edge above the bike's lane (px): over a tucked helmet, under an upright one. */
export const BOOM_CLEAR = 110;

export function drawBump(ctx: CanvasRenderingContext2D, sx: number): void {
  const steps = 7;
  for (let i = 0; i < steps; i++) {
    const d0 = i / steps;
    const d1 = (i + 1) / steps;
    const y0 = roadY(d0) + 1;
    const y1 = roadY(d1) - 1;
    fillPoly(ctx, [sx - 8 + lean(d0), y0, sx + 8 + lean(d0), y0, sx + 8 + lean(d1), y1, sx - 8 + lean(d1), y1], i % 2 ? '#1b1a1e' : '#f1c232');
  }
  ctx.fillStyle = 'rgba(255,230,180,0.35)';
  ctx.fillRect(sx - 8 + lean(0), roadY(0) + 1, 16, 1.5);
  ctx.fillStyle = '#e0b02c';
  ctx.beginPath();
  ctx.ellipse(sx + lean(1), ROAD_NEAR, 10, 4, 0, Math.PI, TAU);
  ctx.fill();
}

/** Horizontal offset of something on the ground at screen y (the oblique depth), 0 in the bike's lane. */
export const leanAtY = (y: number): number => lean((y - ROAD_FAR) / (ROAD_NEAR - ROAD_FAR));

export function drawOil(ctx: CanvasRenderingContext2D, sx0: number, sx1: number, t: number): void {
  const cx = (sx0 + sx1) / 2;
  const rx = (sx1 - sx0) / 2;
  ctx.fillStyle = 'rgba(14,10,18,0.92)';
  ctx.beginPath();
  ctx.ellipse(cx, ROAD_Y - 3, rx, 11, 0, 0, TAU);
  ctx.ellipse(cx - rx * 0.45, ROAD_Y - 10, rx * 0.4, 6, 0.1, 0, TAU);
  ctx.fill();
  const sheen: readonly [number, number, string][] = [[-0.3, -5, 'rgba(120,80,200,0.35)'], [0.1, -1, 'rgba(60,190,190,0.28)'], [0.35, -6, 'rgba(255,150,90,0.4)']];
  for (const [fx, dy, c] of sheen) {
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.ellipse(cx + fx * rx + Math.sin(t * 2 + fx * 5) * 3, ROAD_Y + dy, rx * 0.32, 2.4, 0, 0, TAU);
    ctx.fill();
  }
}

/** Guard booth and the far end of the boom (behind the bike). `lift` 0 = half-open … 1 = knocked up. */
export function drawGateBack(ctx: CanvasRenderingContext2D, sx: number, lift: number, t: number): void {
  const bx = sx + lean(0) + 14;
  fillPoly(ctx, [bx, ROAD_FAR - 2, bx + 38, ROAD_FAR - 2, bx + 38, ROAD_FAR - 44, bx, ROAD_FAR - 44], '#d9a982');
  fillPoly(ctx, [bx - 4, ROAD_FAR - 44, bx + 42, ROAD_FAR - 44, bx + 38, ROAD_FAR - 50, bx, ROAD_FAR - 50], '#3a2a3a');
  ctx.fillStyle = '#ffd88a';
  ctx.fillRect(bx + 6, ROAD_FAR - 36, 26, 14);
  ctx.fillStyle = Math.floor(t * 3) % 2 ? '#ff4a3a' : '#7a2020';
  ctx.fillRect(bx + 16, ROAD_FAR - 55, 6, 5);
  boom(ctx, sx, 0, LANE, lift);
}

/** Near post and the near end of the boom (in front of the bike). */
export function drawGateFront(ctx: CanvasRenderingContext2D, sx: number, lift: number): void {
  boom(ctx, sx, LANE, 1, lift);
  const px = sx + lean(1);
  ctx.fillStyle = '#2b2a30';
  ctx.fillRect(px - 4, ROAD_NEAR - BOOM_CLEAR - 18, 8, BOOM_CLEAR + 22);
  ctx.fillStyle = '#e8e2d6';
  ctx.fillRect(px - 7, ROAD_NEAR - BOOM_CLEAR - 22, 14, 12);
  ctx.fillStyle = '#c4162b';
  ctx.fillRect(px - 7, ROAD_NEAR - BOOM_CLEAR - 16, 14, 3);
}

/** The striped boom between depths d0 … d1; knocked up it swings towards vertical about the near post. */
function boom(ctx: CanvasRenderingContext2D, sx: number, d0: number, d1: number, lift: number): void {
  const segs = 8;
  const at = (d: number): { x: number; y: number } => {
    const up = Math.sin(clamp(lift, 0, 1) * 1.3) * 90 * (1 - d);
    return { x: sx + lean(d) - up * 0.4, y: roadY(d) - BOOM_CLEAR - 3 - up };
  };
  for (let i = 0; i < segs; i++) {
    const a = at(d0 + ((d1 - d0) * i) / segs);
    const b = at(d0 + ((d1 - d0) * (i + 1)) / segs);
    const red = Math.floor((d0 + ((d1 - d0) * i) / segs) * 10) % 2 === 0;
    ctx.strokeStyle = red ? '#d8202e' : '#f4efe4';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }
}

function signIcon(ctx: CanvasRenderingContext2D, kind: ObstacleKind, x: number, y: number): void {
  ctx.fillStyle = '#16141a';
  switch (kind) {
    case 'bump':
      ctx.beginPath();
      ctx.ellipse(x, y + 4, 7, 5, 0, Math.PI, TAU);
      ctx.fill();
      ctx.fillRect(x - 9, y + 4, 18, 2);
      return;
    case 'oil':
      ctx.beginPath();
      ctx.moveTo(x, y - 6);
      ctx.quadraticCurveTo(x + 6, y + 2, x, y + 6);
      ctx.quadraticCurveTo(x - 6, y + 2, x, y - 6);
      ctx.fill();
      return;
    case 'gate':
      ctx.fillRect(x - 8, y - 3, 3, 10);
      fillPoly(ctx, [x - 6, y - 2, x + 9, y - 6, x + 9, y - 3, x - 6, y + 1], '#16141a');
      return;
    case 'truck':
      ctx.fillRect(x - 7, y - 5, 14, 9);
      ctx.fillRect(x - 8, y + 4, 4, 3);
      ctx.fillRect(x + 4, y + 4, 4, 3);
      return;
    default: throw new Error(`unhandled: ${kind satisfies never}`);
  }
}

/** Yellow warning diamond on the far roadside. */
export function drawSign(ctx: CanvasRenderingContext2D, sx: number, kind: ObstacleKind): void {
  const y = ROAD_FAR - 34;
  ctx.fillStyle = '#5b5560';
  ctx.fillRect(sx - 1.5, y, 3, 34);
  fillPoly(ctx, [sx, y - 15, sx + 15, y, sx, y + 15, sx - 15, y], '#16141a');
  fillPoly(ctx, [sx, y - 12.5, sx + 12.5, y, sx, y + 12.5, sx - 12.5, y], '#f2c43a');
  signIcon(ctx, kind, sx, y);
}

export function drawStartLine(ctx: CanvasRenderingContext2D, sx: number, label: string): void {
  for (let i = 0; i < 6; i++) {
    const d0 = i / 6;
    const d1 = (i + 1) / 6;
    fillPoly(ctx, [sx - 3 + lean(d0), roadY(d0), sx + 3 + lean(d0), roadY(d0), sx + 3 + lean(d1), roadY(d1), sx - 3 + lean(d1), roadY(d1)], i % 2 ? '#1b1a1e' : '#f4f0e8');
  }
  board(ctx, sx + lean(0), label, false);
}

export function drawLiftoffBoard(ctx: CanvasRenderingContext2D, sx: number, label: string): void {
  board(ctx, sx + lean(0), label, true);
}

function board(ctx: CanvasRenderingContext2D, x: number, label: string, flag: boolean): void {
  const top = ROAD_FAR - 92;
  ctx.fillStyle = '#26232b';
  ctx.fillRect(x - 2, top, 4, 92);
  ctx.fillStyle = '#16141a';
  ctx.fillRect(x - 44, top - 28, 88, 30);
  if (flag) {
    for (let i = 0; i < 8; i++) for (let k = 0; k < 2; k++) {
      ctx.fillStyle = (i + k) % 2 ? '#16141a' : '#f4f0e8';
      ctx.fillRect(x - 42 + i * 10.5, top - 4 + k * 3, 10.5, 3);
    }
  }
  text(ctx, label, x, top - 9, { size: 15, display: true, align: 'center', color: flag ? '#ffd27c' : '#f4f0e8', maxWidth: 82 });
}
