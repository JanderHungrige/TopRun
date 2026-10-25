import { drawSideFigure } from '../people';
import { pixelRect } from '../pixel/frame';
import { athleteLook } from './volleyball-looks';
import { spikePose } from './volleyball-poses';

// Beach Volleyball hub / offer card icon (doc 21): a sunset panel — striped sun on the sea, sand, the net — and a
// shirtless spiker in the air hitting the ball, in pixel art. Within ±40 px of the origin.

const SKY = ['#43225a', '#8a3262', '#d65561', '#f99456', '#ffd27a'] as const;
const BALL: readonly (readonly [number, number, number, number, string])[] = [
  [-3, -5, 6, 10, '#3a2232'], [-5, -3, 10, 6, '#3a2232'], [-3, -3, 6, 6, '#f2c12e'], [-1, -3, 2, 6, '#f4f1ea'], [-3, 1, 6, 2, '#2f63ad'],
];

function backdrop(ctx: CanvasRenderingContext2D): void {
  pixelRect(ctx, -40, -36, 80, 68, '#1a0c18');
  SKY.forEach((c, i) => pixelRect(ctx, -38, -34 + i * 8, 76, 8, c));
  for (let y = -8; y < 6; y += 2) {
    const half = Math.sqrt(Math.max(0, 144 - (y - 6) ** 2));
    if (y === 0 || y === 4) continue;
    pixelRect(ctx, 18 - half, y, half * 2, 2, y < -2 ? '#ffeab0' : '#ffd57a');
  }
  pixelRect(ctx, -38, 6, 76, 8, '#6c3c6c');
  pixelRect(ctx, 10, 8, 16, 2, '#ffd98a');
  pixelRect(ctx, 14, 12, 8, 2, '#ffb466');
  pixelRect(ctx, -38, 14, 76, 16, '#e8b27c');
  pixelRect(ctx, -38, 14, 76, 2, '#f6dccb');
}

function net(ctx: CanvasRenderingContext2D): void {
  pixelRect(ctx, 4, -6, 2, 30, '#3a2a36');
  pixelRect(ctx, 14, -12, 2, 30, '#3a2a36');
  for (let i = 0; i < 5; i++) pixelRect(ctx, 6 + i * 2, -6 - i, 2, 12, 'rgba(26,12,24,0.55)');
  for (let i = 0; i < 5; i++) pixelRect(ctx, 6 + i * 2, -8 - i, 2, 2, '#fbf6ee');
}

export function drawVolleyballIcon(ctx: CanvasRenderingContext2D, t: number): void {
  backdrop(ctx);
  net(ctx);
  const hop = Math.round(Math.sin(t * 3) * 1.5) * 2;
  ctx.save();
  ctx.translate(-16, 12 + hop);
  ctx.scale(0.13, 0.13);
  drawSideFigure(ctx, athleteLook('you', 'pilot1'), spikePose(), { expression: 'effort', strain: 0, blink: 0, t: 0 });
  ctx.restore();
  const bx = -10 + Math.round(Math.sin(t * 3 + 0.4)) * 2;
  const by = -36 + hop;
  for (const [x, y, w, h, c] of BALL) pixelRect(ctx, bx + x, by + y, w, h, c);
}
