import { COLORS, text } from '../text';
import { circle } from '../shapes';

// Push-up Challenge scoreboard (doc 12): the player's and the rival's counters around the round clock.

export interface BoardView {
  you: string;
  reps: number;
  rival: string;
  rivalReps: number;
  /** Seconds left in the round. */
  left: number;
  roundTime: number;
  t: number;
}

const X = 420;
const Y = 70;
const W = 440;
const H = 150;
const CX = 640;
const CY = 145;
const LED = '#ffb43d';

function frame(ctx: CanvasRenderingContext2D): void {
  ctx.beginPath();
  ctx.roundRect(X - 6, Y - 6, W + 12, H + 12, 14);
  ctx.fillStyle = '#59616b';
  ctx.fill();
  ctx.beginPath();
  ctx.roundRect(X, Y, W, H, 10);
  ctx.fillStyle = '#07090d';
  ctx.fill();
  for (const [sx, sy] of [[X + 10, Y + 10], [X + W - 10, Y + 10], [X + 10, Y + H - 10], [X + W - 10, Y + H - 10]] as const) {
    circle(ctx, sx, sy, 3, '#8b939c');
  }
}

function counter(ctx: CanvasRenderingContext2D, x: number, label: string, n: number, lead: boolean): void {
  text(ctx, label, x, Y + 34, { size: 16, display: true, align: 'center', color: lead ? COLORS.gold : COLORS.dim, maxWidth: 140 });
  text(ctx, '88', x, Y + 118, { size: 62, display: true, align: 'center', color: 'rgba(255,180,61,0.06)' });
  ctx.save();
  ctx.shadowColor = LED;
  ctx.shadowBlur = 14;
  text(ctx, String(n).padStart(2, '0'), x, Y + 118, { size: 62, display: true, align: 'center', color: LED });
  ctx.restore();
}

function clock(ctx: CanvasRenderingContext2D, left: number, total: number, t: number): void {
  const hurry = left <= 5 && left > 0;
  const pulse = hurry ? 0.5 + 0.5 * Math.sin(t * 12) : 0;
  circle(ctx, CX, CY, 62, hurry ? `rgba(255,70,50,${0.4 + pulse * 0.5})` : '#2a3038');
  circle(ctx, CX, CY, 57, '#f4f1ea');
  const frac = Math.max(0, left / total);
  ctx.beginPath();
  ctx.moveTo(CX, CY);
  ctx.arc(CX, CY, 46, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * frac);
  ctx.closePath();
  ctx.fillStyle = hurry ? '#e2382c' : 'rgba(214,52,40,0.82)';
  ctx.fill();
  ctx.strokeStyle = '#1b1f25';
  for (let i = 0; i < total; i++) {
    const a = -Math.PI / 2 + (i / total) * Math.PI * 2;
    const r0 = i % 5 === 0 ? 47 : 51;
    ctx.lineWidth = i % 5 === 0 ? 3 : 1.4;
    ctx.beginPath();
    ctx.moveTo(CX + Math.cos(a) * r0, CY + Math.sin(a) * r0);
    ctx.lineTo(CX + Math.cos(a) * 55, CY + Math.sin(a) * 55);
    ctx.stroke();
  }
  const a = -Math.PI / 2 + Math.PI * 2 * frac;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(CX, CY);
  ctx.lineTo(CX + Math.cos(a) * 50, CY + Math.sin(a) * 50);
  ctx.stroke();
  circle(ctx, CX, CY, 5, '#1b1f25');
  text(ctx, String(Math.ceil(left)), CX, CY + 13, { size: 36, display: true, align: 'center', color: '#ffffff', stroke: '#1b1f25', strokeWidth: 6 });
}

export function drawScoreboard(ctx: CanvasRenderingContext2D, v: BoardView): void {
  frame(ctx);
  counter(ctx, X + 75, v.you, v.reps, v.reps > v.rivalReps);
  counter(ctx, X + W - 75, v.rival, v.rivalReps, v.rivalReps > v.reps);
  clock(ctx, v.left, v.roundTime, v.t);
}
