import type { Pal, UnitFn } from '../draw-ground-units';
import { circle, ellipse } from '../shapes';

// The jungle planet's machines (doc 81), fronts down (+y): the enemy walker and the brute (a walker three times its
// size), the hover tank on its skirt of dust, the artillery gun, the gun drone and the dropship. Their guns turn with
// `aim` (0 = up, clockwise); legs stride and rotors spin with time.

type JungleMachine = 'walker' | 'hovertank' | 'artillery' | 'gundrone' | 'dropship' | 'brute';

function rect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, fill: string, line?: string): void {
  if (line) {
    ctx.fillStyle = line;
    ctx.fillRect(x - 0.8, y - 0.8, w + 1.6, h + 1.6);
  }
  ctx.fillStyle = fill;
  ctx.fillRect(x, y, w, h);
}

/** A two-legged walker scaled by `k`: striding feet, a hull that turns to aim, twin guns. */
function walkerBody(ctx: CanvasRenderingContext2D, p: Pal, t: number, aim: number, k: number): void {
  const step = Math.sin(t * 4) * 5 * k;
  for (const side of [-1, 1]) {
    const fy = (side < 0 ? step : -step) - 2 * k;
    rect(ctx, side * 8 * k - 3 * k, fy - 5 * k, 6 * k, 10 * k, p.dark, p.line);
    ctx.strokeStyle = p.trim;
    ctx.lineWidth = 3 * k;
    ctx.beginPath();
    ctx.moveTo(side * 5 * k, 0);
    ctx.lineTo(side * 8 * k, fy);
    ctx.stroke();
  }
  ctx.save();
  ctx.rotate(aim - Math.PI);
  rect(ctx, -10 * k, -8 * k, 20 * k, 15 * k, p.body, p.line);
  rect(ctx, -10 * k, -8 * k, 20 * k, 3 * k, p.light);
  for (const side of [-1, 1]) rect(ctx, side * 12 * k - 2 * k, -2 * k, 4 * k, 14 * k, p.dark, p.line);
  if (!p.mono) {
    rect(ctx, -4 * k, 3 * k, 8 * k, 4 * k, p.glass);
    circle(ctx, 0, 5 * k, 1.2 * k, p.red);
  }
  ctx.restore();
}

const walker: UnitFn = (ctx, p, t, aim) => walkerBody(ctx, p, t, aim, 1);
const brute: UnitFn = (ctx, p, t, aim) => {
  walkerBody(ctx, p, t * 0.6, aim, 2.6);
  if (p.mono) return;
  for (const side of [-1, 1]) {
    rect(ctx, side * 18 - 8, -30, 16, 14, p.trim, p.line); // missile racks on the shoulders
    for (let i = 0; i < 3; i++) circle(ctx, side * 18 - 4 + i * 4, -23, 1.4, p.red);
  }
};

const hovertank: UnitFn = (ctx, p, t, aim) => {
  ellipse(ctx, 0, 0, 17, 21, p.mono ? p.body : 'rgba(200,170,120,0.35)'); // the dust skirt
  ctx.fillStyle = p.line;
  ctx.beginPath();
  ctx.roundRect(-13, -17, 26, 34, 8);
  ctx.fill();
  ctx.fillStyle = p.body;
  ctx.beginPath();
  ctx.roundRect(-12, -16, 24, 32, 7);
  ctx.fill();
  if (!p.mono) {
    for (const y of [-10, 10]) rect(ctx, -12, y, 24, 2, p.dark);
    circle(ctx, -8, 14 + Math.sin(t * 20), 1.5, '#ffb84a');
    circle(ctx, 8, 14 + Math.cos(t * 20), 1.5, '#ffb84a');
  }
  ctx.save();
  ctx.rotate(aim - Math.PI);
  circle(ctx, 0, 0, 7, p.dark);
  for (const dx of [-2.5, 2.5]) rect(ctx, dx - 1, 2, 2, 14, p.trim, p.line);
  ctx.restore();
};

const artillery: UnitFn = (ctx, p, _t, aim) => {
  ctx.fillStyle = p.line;
  ctx.beginPath();
  ctx.arc(0, 0, 17, 0, Math.PI * 2);
  ctx.fill();
  circle(ctx, 0, 0, 16, p.mono ? p.body : '#7a6a48'); // the sandbag ring
  if (!p.mono) for (let i = 0; i < 10; i++) circle(ctx, Math.cos(i * 0.63) * 13, Math.sin(i * 0.63) * 13, 3.4, '#9a8a5e');
  circle(ctx, 0, 0, 9, p.body);
  ctx.save();
  ctx.rotate(aim - Math.PI);
  rect(ctx, -3, 0, 6, 22, p.dark, p.line);
  rect(ctx, -4, 18, 8, 4, p.trim);
  ctx.restore();
};

const gundrone: UnitFn = (ctx, p, t) => {
  for (const [x, y] of [[-9, -9], [9, -9], [-9, 9], [9, 9]] as const) {
    circle(ctx, x, y, 5.5, p.mono ? p.body : 'rgba(200,210,200,0.25)');
    if (!p.mono) {
      ctx.strokeStyle = p.light;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x + Math.cos(t * 40) * 5, y + Math.sin(t * 40) * 5);
      ctx.lineTo(x - Math.cos(t * 40) * 5, y - Math.sin(t * 40) * 5);
      ctx.stroke();
    }
  }
  ctx.strokeStyle = p.dark;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-9, -9);
  ctx.lineTo(9, 9);
  ctx.moveTo(9, -9);
  ctx.lineTo(-9, 9);
  ctx.stroke();
  circle(ctx, 0, 0, 6, p.body);
  if (!p.mono) circle(ctx, 0, 3, 2, p.red);
};

const dropship: UnitFn = (ctx, p, t) => {
  ctx.fillStyle = p.line;
  ctx.beginPath();
  ctx.moveTo(0, 30);
  ctx.lineTo(16, 12);
  ctx.lineTo(30, 4);
  ctx.lineTo(30, -12);
  ctx.lineTo(14, -16);
  ctx.lineTo(10, -30);
  ctx.lineTo(-10, -30);
  ctx.lineTo(-14, -16);
  ctx.lineTo(-30, -12);
  ctx.lineTo(-30, 4);
  ctx.lineTo(-16, 12);
  ctx.closePath();
  ctx.fill();
  ctx.save();
  ctx.scale(0.93, 0.93);
  ctx.fillStyle = p.body;
  ctx.fill();
  ctx.restore();
  if (p.mono) return;
  rect(ctx, -6, 8, 12, 10, p.glass);
  for (const side of [-1, 1]) {
    rect(ctx, side * 22 - 4, -10, 8, 12, p.dark);
    circle(ctx, side * 22, -14, 3 + Math.sin(t * 30) * 0.6, '#ffb84a');
  }
  rect(ctx, -8, -28, 16, 4, p.trim);
};

export const JUNGLE_UNITS: Readonly<Record<JungleMachine, UnitFn>> = { walker, hovertank, artillery, gundrone, dropship, brute };
