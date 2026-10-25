import { clamp, TAU } from '../../core/math';
import { TRUCK } from '../../game/minigames/motorbike-course';
import { fillPoly } from '../shapes';
import { ROAD_Y } from './motorbike-world';

// Motorbike vs. Jet (doc 22): the airfield fuel truck crossing the perimeter road towards the camera, seen from
// the front (cab, grille, headlights, the tank's round end behind the cab, an amber beacon). Its front reaches
// the bike's lane at TRUCK.blockFrom and its tail leaves it at TRUCK.blockTo.

/** Truck length in screen depth (px) and its speed towards the camera (px/s). */
export const TRUCK_DEPTH = 58;
const SPEED = TRUCK_DEPTH / (TRUCK.blockTo - TRUCK.blockFrom);
/** Half the truck's drawn width at the lane (m from its left side to the centre is the obstacle offset). */
export const TRUCK_HALF_W = 46;

/** Ground y of the truck's front at `t` s after it pulled out, or null once it is gone. */
export function truckFrontY(t: number): number | null {
  const y = ROAD_Y + 4 + SPEED * (t - TRUCK.blockFrom);
  return y > 800 ? null : y;
}

/** Draws the truck with its front bumper on ground y `gy`, centred at `cx`. */
export function drawTruck(ctx: CanvasRenderingContext2D, cx: number, gy: number, t: number): void {
  const k = clamp(0.95 + (gy - 560) / 300, 0.8, 1.6);
  ctx.save();
  ctx.translate(cx, gy);
  ctx.scale(k, k);
  ctx.fillStyle = 'rgba(8,6,12,0.4)';
  ctx.beginPath();
  ctx.ellipse(0, 1, 44, 6, 0, 0, TAU);
  ctx.fill();
  fillPoly(ctx, [-40, -60, -36, -82, -20, -92, 20, -92, 36, -82, 40, -60], '#c9ccd2');
  fillPoly(ctx, [-30, -84, -14, -90, 14, -90, 4, -84], '#eef0f3');
  ctx.fillStyle = '#16141a';
  for (const x of [-30, 22]) ctx.fillRect(x, -10, 8, 12);
  fillPoly(ctx, [-34, -14, 34, -14, 34, -58, 28, -66, -28, -66, -34, -58], '#e7b52c');
  fillPoly(ctx, [-28, -62, 28, -62, 30, -42, -30, -42], '#2a2f45');
  fillPoly(ctx, [-26, -60, -2, -60, -2, -44, -28, -44], '#ff9d5a');
  fillPoly(ctx, [2, -60, 26, -60, 28, -44, 2, -44], '#c25d6a');
  fillPoly(ctx, [-20, -58, -12, -58, -22, -46, -26, -46], 'rgba(255,240,210,0.6)');
  ctx.fillStyle = '#1d1b22';
  ctx.fillRect(-16, -36, 32, 16);
  ctx.fillStyle = '#9da3ad';
  for (let i = 0; i < 4; i++) ctx.fillRect(-14, -34 + i * 4, 28, 1.5);
  ctx.fillStyle = '#8a8f98';
  ctx.fillRect(-36, -16, 72, 6);
  headlights(ctx);
  ctx.fillStyle = '#2b2a30';
  ctx.fillRect(-40, -54, 5, 10);
  ctx.fillRect(35, -54, 5, 10);
  fillPoly(ctx, [0, -76, 7, -70, 0, -64, -7, -70], '#c4162b');
  fillPoly(ctx, [0, -74, 5, -70, 0, -66, -5, -70], '#f4efe4');
  beacon(ctx, t);
  ctx.restore();
}

function headlights(ctx: CanvasRenderingContext2D): void {
  for (const x of [-25, 25]) {
    ctx.fillStyle = 'rgba(255,236,170,0.3)';
    ctx.beginPath();
    ctx.arc(x, -28, 11, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#fff4cf';
    ctx.beginPath();
    ctx.arc(x, -28, 4.5, 0, TAU);
    ctx.fill();
  }
}

function beacon(ctx: CanvasRenderingContext2D, t: number): void {
  const on = 0.5 + 0.5 * Math.sin(t * 14);
  ctx.fillStyle = '#5a3a10';
  ctx.fillRect(-5, -72, 10, 6);
  ctx.fillStyle = `rgba(255,170,40,${(0.5 + 0.5 * on).toFixed(3)})`;
  ctx.fillRect(-4, -76, 8, 5);
  ctx.fillStyle = `rgba(255,180,60,${(0.35 * on).toFixed(3)})`;
  ctx.beginPath();
  ctx.arc(0, -74, 16, 0, TAU);
  ctx.fill();
}
