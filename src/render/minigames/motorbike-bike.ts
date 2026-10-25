import { TAU } from '../../core/math';
import { fillPoly } from '../shapes';

// Motorbike vs. Jet (doc 22): a generic sport bike in side view (clean vector, no brand, no logo). Local frame:
// origin at the rear wheel's ground contact, +x forward, −y up; a wheelie rotates everything about the origin.

export const BIKE = {
  wheelbase: 88,
  wheelR: 17,
  /** Rider joints on the bike (px in the local frame). */
  hip: { x: 25, y: -60 },
  grip: { x: 69, y: -66 },
  peg: { x: 31, y: -28 },
  exhaust: { x: -9, y: -43 },
  /** Wheelie angle at a full wheelie (rad). */
  wheelie: 0.42,
} as const;

export interface BikeView {
  /** Screen position of the rear wheel's ground contact. */
  x: number;
  y: number;
  /** Nose-up rotation (rad). */
  angle: number;
  /** Wheel rotation (rad) and 0 … 1 motion blur. */
  spin: number;
  blur: number;
  braking: boolean;
  /** 0 … 1: exhaust flame (perfect-shift boost). */
  flame: number;
  t: number;
}

const PAINT = { base: '#c4162b', light: '#ef4a4f', dark: '#7d0d1c', white: '#f3efe6' };

function wheel(ctx: CanvasRenderingContext2D, cx: number, cy: number, disc: number, v: BikeView): void {
  const r = BIKE.wheelR;
  ctx.fillStyle = '#141318';
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = '#3a3940';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(cx, cy, r - 1.5, 0, TAU);
  ctx.stroke();
  ctx.fillStyle = '#25242b';
  ctx.beginPath();
  ctx.arc(cx, cy, r - 4.5, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#a7adb6';
  ctx.beginPath();
  ctx.arc(cx, cy, disc, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = `rgba(214,218,224,${(1 - 0.75 * v.blur).toFixed(3)})`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let k = 0; k < 5; k++) {
    const a = v.spin + (k * TAU) / 5;
    ctx.moveTo(cx + Math.cos(a) * 3, cy + Math.sin(a) * 3);
    ctx.lineTo(cx + Math.cos(a + 0.25) * (r - 5), cy + Math.sin(a + 0.25) * (r - 5));
  }
  ctx.stroke();
  if (v.blur > 0.2) {
    ctx.fillStyle = `rgba(150,154,162,${(0.35 * v.blur).toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(cx, cy, r - 5, 0, TAU);
    ctx.fill();
  }
  ctx.fillStyle = '#e2e5ea';
  ctx.beginPath();
  ctx.arc(cx, cy, 2.2, 0, TAU);
  ctx.fill();
}

function chassis(ctx: CanvasRenderingContext2D): void {
  fillPoly(ctx, [0, -19, 34, -31, 36, -26, 2, -14], '#2b2c33');
  ctx.strokeStyle = '#111014';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, -17);
  ctx.lineTo(36, -24);
  ctx.stroke();
  fillPoly(ctx, [33, -20, 63, -21, 68, -38, 44, -47, 30, -35], '#34353d');
  ctx.fillStyle = '#8f959e';
  ctx.beginPath();
  ctx.ellipse(48, -28, 8, 6, 0, 0, TAU);
  ctx.fill();
  fillPoly(ctx, [36, -38, 74, -62, 78, -58, 40, -32], '#c7ccd4');
  fillPoly(ctx, [9, -30, 30, -26, 28, -21, 7, -25], '#9aa0a8');
  fillPoly(ctx, [-11, -38, 9, -30, 7, -25, -12, -32], '#b9bec6');
  fillPoly(ctx, [-13, -39, -9, -37, -11, -31, -15, -33], '#2a2a2e');
}

function bodywork(ctx: CanvasRenderingContext2D, v: BikeView): void {
  fillPoly(ctx, [42, -51, 50, -60, 66, -60, 74, -55, 70, -49, 44, -47], PAINT.base);
  fillPoly(ctx, [50, -59, 64, -59, 66, -56, 52, -56], PAINT.light);
  fillPoly(ctx, [14, -56, 42, -52, 42, -49, 16, -51], '#1a191e');
  fillPoly(ctx, [-12, -62, 4, -60, 22, -55, 42, -52, 40, -48, 16, -47, -6, -52, -13, -58], PAINT.base);
  fillPoly(ctx, [-6, -58, 14, -55, 13, -53, -5, -55], PAINT.white);
  ctx.fillStyle = v.braking ? '#ff3b3b' : '#a41622';
  ctx.fillRect(-14, -61, 3, 5);
  if (v.braking) {
    ctx.fillStyle = 'rgba(255,60,60,0.35)';
    ctx.beginPath();
    ctx.arc(-14, -58, 7, 0, TAU);
    ctx.fill();
  }
  fillPoly(ctx, [44, -24, 82, -30, 100, -45, 98, -60, 84, -70, 72, -60, 60, -46, 42, -40], PAINT.base);
  fillPoly(ctx, [62, -44, 86, -48, 96, -58, 90, -62, 78, -54, 64, -49], PAINT.light);
  fillPoly(ctx, [48, -29, 78, -33, 76, -30, 50, -26], PAINT.white);
  fillPoly(ctx, [56, -38, 70, -40, 66, -34, 56, -33], PAINT.dark);
}

function front(ctx: CanvasRenderingContext2D): void {
  ctx.strokeStyle = '#d6a634';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(BIKE.wheelbase, -BIKE.wheelR);
  ctx.lineTo(77, -64);
  ctx.stroke();
  ctx.strokeStyle = '#1b1b20';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(72, -66);
  ctx.lineTo(BIKE.grip.x - 2, BIKE.grip.y + 1);
  ctx.stroke();
  fillPoly(ctx, [80, -16, 96, -16, 92, -23, 82, -24], PAINT.base);
  ctx.fillStyle = '#c62a2a';
  ctx.fillRect(83, -22, 4, 6);
}

function headlight(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = 'rgba(255,236,190,0.25)';
  ctx.beginPath();
  ctx.ellipse(104, -52, 12, 6, 0, 0, TAU);
  ctx.fill();
  fillPoly(ctx, [92, -55, 99, -54, 99, -49, 93, -50], '#fff3cf');
}

function flame(ctx: CanvasRenderingContext2D, v: BikeView): void {
  if (v.flame <= 0.02) return;
  const { x, y } = BIKE.exhaust;
  const len = (10 + 10 * Math.sin(v.t * 60)) * v.flame;
  fillPoly(ctx, [x - 2, y - 3, x - 6 - len, y - 2 - len * 0.35, x - 2, y + 3], `rgba(255,170,60,${(0.85 * v.flame).toFixed(3)})`);
  fillPoly(ctx, [x - 2, y - 1.5, x - 4 - len * 0.45, y - 1 - len * 0.15, x - 2, y + 1.5], `rgba(120,190,255,${(0.9 * v.flame).toFixed(3)})`);
}

/** Shadow under the bike (no rotation, stays on the road). */
export function drawBikeShadow(ctx: CanvasRenderingContext2D, x: number, y: number, lift: number): void {
  ctx.fillStyle = `rgba(10,6,14,${(0.42 - 0.2 * lift).toFixed(3)})`;
  ctx.beginPath();
  ctx.ellipse(x + 48, y + 1.5, 62, 4, 0, 0, TAU);
  ctx.fill();
}

/** Everything behind the rider. */
export function drawBike(ctx: CanvasRenderingContext2D, v: BikeView): void {
  ctx.save();
  ctx.translate(v.x, v.y);
  ctx.rotate(-v.angle);
  ctx.lineJoin = 'round';
  flame(ctx, v);
  wheel(ctx, 0, -BIKE.wheelR, 6, v);
  chassis(ctx);
  wheel(ctx, BIKE.wheelbase, -BIKE.wheelR, 8, v);
  front(ctx);
  bodywork(ctx, v);
  headlight(ctx);
  ctx.restore();
}

/** The smoked windscreen, drawn over the rider's hands. */
export function drawWindscreen(ctx: CanvasRenderingContext2D, v: BikeView): void {
  ctx.save();
  ctx.translate(v.x, v.y);
  ctx.rotate(-v.angle);
  fillPoly(ctx, [76, -66, 86, -71, 92, -66, 84, -78, 74, -72], 'rgba(40,46,66,0.78)');
  fillPoly(ctx, [80, -71, 84, -76, 85, -74, 81, -70], 'rgba(255,214,170,0.55)');
  ctx.restore();
}

/** A point of the bike's local frame on screen. */
export function bikePoint(v: Pick<BikeView, 'x' | 'y' | 'angle'>, px: number, py: number): { x: number; y: number } {
  const c = Math.cos(v.angle);
  const s = Math.sin(v.angle);
  return { x: v.x + px * c + py * s, y: v.y - px * s + py * c };
}
