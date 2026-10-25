import { TAU } from '../../core/math';
import { drawPlaneSide } from '../draw-planes-side';
import { drawBike, drawWindscreen, type BikeView } from './motorbike-bike';
import { drawRider, riderLook } from './motorbike-rider';

// Hub / offer card icon for Motorbike vs. Jet (doc 22): a sunset, a jet climbing off the runway and the bike
// racing beneath it on the back wheel. Within ±40 px.

const LOOK = riderLook('pilot1');

function backdrop(ctx: CanvasRenderingContext2D, t: number): void {
  const sky = ctx.createLinearGradient(0, -38, 0, 38);
  sky.addColorStop(0, '#2a2152');
  sky.addColorStop(0.42, '#b9485b');
  sky.addColorStop(0.6, '#ffc06a');
  sky.addColorStop(0.61, '#3e3846');
  sky.addColorStop(1, '#25212b');
  ctx.fillStyle = sky;
  ctx.fill();
  ctx.clip();
  ctx.fillStyle = '#fff1c4';
  ctx.beginPath();
  ctx.arc(18, 8, 9, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#3f2950';
  ctx.fillRect(-40, 8, 80, 2);
  ctx.fillStyle = '#e8b93a';
  for (let x = -40 + ((t * 40) % 16); x < 40; x += 16) ctx.fillRect(-x, 31, 8, 1.4);
}

export function drawMotorbikeIcon(ctx: CanvasRenderingContext2D, t: number): void {
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(-38, -38, 76, 76, 12);
  backdrop(ctx, t);
  const climb = 0.5 + 0.5 * Math.sin(t * 1.4);
  drawPlaneSide(ctx, 'f14', 2, -6 - climb * 8, 0.4, { pitch: 0.2, throttle: 1, gear: 1 - climb, t });
  const view: BikeView = { x: 0, y: 0, angle: 0.22 + 0.05 * Math.sin(t * 3), spin: t * 30, blur: 0.8, braking: false, flame: 0, t };
  ctx.translate(-30, 31);
  ctx.scale(0.36, 0.36);
  drawBike(ctx, view);
  drawRider(ctx, LOOK, { tuck: 0, back: 1, angle: view.angle, sway: 0, footDown: false });
  drawWindscreen(ctx, view);
  ctx.restore();
}
