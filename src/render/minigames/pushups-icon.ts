import { circle, fillPoly } from '../shapes';
import { PLAYER_LOOKS } from './pushups-looks';
import { drawPushupPilot } from './pushups-pilot';

/** Hub / offer card icon (doc 12): a pilot doing push-ups on a mat, a stopwatch ticking. Within ±40 px. */
export function drawPushupIcon(ctx: CanvasRenderingContext2D, t: number): void {
  fillPoly(ctx, [-36, 18, 36, 18, 40, 26, -40, 26], '#2f63ad');
  const depth = 0.5 - 0.5 * Math.cos(t * 3.2);
  drawPushupPilot(ctx, PLAYER_LOOKS.pilot1, { depth, collapse: 0, strain: 0, t }, -35, 22, 1, 0.215);
  circle(ctx, 24, -22, 13, '#59616b');
  circle(ctx, 24, -22, 10.5, '#f4f1ea');
  ctx.fillStyle = '#59616b';
  ctx.fillRect(21.5, -39, 5, 5);
  const a = -Math.PI / 2 + t * 2;
  ctx.strokeStyle = '#e2382c';
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(24, -22);
  ctx.lineTo(24 + Math.cos(a) * 8, -22 + Math.sin(a) * 8);
  ctx.stroke();
}
