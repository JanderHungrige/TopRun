import type { PlaneId } from '../data/types';
import { ellipse, fillPoly, flame } from './shapes';

/** Side-view jets for the carrier scene. Nose points right; origin is the main-gear deck contact point. */

export interface SideDrawOpts {
  pitch?: number; // radians, nose up positive
  throttle?: number;
  t?: number;
  gear?: number; // 1 = down, 0 = retracted
  hook?: boolean;
}

const LINE = 'rgba(15,20,28,0.6)';

function nozzleFlame(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, power: number, t: number): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(Math.PI / 2);
  ctx.scale(1, 1.6);
  flame(ctx, 0, 0, w, power, t);
  ctx.restore();
}

function gearLeg(ctx: CanvasRenderingContext2D, x: number, topY: number, len: number, wheel: number): void {
  ctx.strokeStyle = '#3a3f46';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, topY);
  ctx.lineTo(x, topY + len);
  ctx.stroke();
  ellipse(ctx, x, topY + len, wheel, wheel, '#1c1f24');
  ellipse(ctx, x, topY + len, wheel * 0.45, wheel * 0.45, '#8a929c');
}

function drawF16Side(ctx: CanvasRenderingContext2D, o: SideDrawOpts): void {
  const g = o.gear ?? 1;
  if (g > 0.05) {
    gearLeg(ctx, 30, -10, 6 * g, 3.5);
    gearLeg(ctx, -6, -11, 7 * g, 4);
  }
  nozzleFlame(ctx, -53, -16, 7, o.throttle ?? 0, o.t ?? 0);
  fillPoly(ctx, [-30, -22, -44, -46, -52, -46, -50, -22], '#9aa5b1', LINE); // fin
  fillPoly(ctx, [52, -17, 44, -20, 30, -23, 10, -24, -20, -22, -50, -21, -54, -18, -54, -14, -40, -12, 8, -12, 24, -11, 40, -13], '#b7c1cb', LINE);
  fillPoly(ctx, [8, -13, 24, -13, 22, -8, 10, -8], '#7d8995', LINE); // ventral intake
  fillPoly(ctx, [-22, -16, 6, -17, 10, -15, -24, -14], '#7d8995'); // wing edge-on
  fillPoly(ctx, [-40, -16, -54, -17, -54, -15, -42, -14], '#7d8995'); // stabilator
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(22, -24, 11, 5, -0.05, Math.PI, Math.PI * 2);
  ctx.fillStyle = '#e9b949';
  ctx.fill();
  ctx.restore();
  ellipse(ctx, 19, -26, 4, 1.2, 'rgba(255,255,255,0.6)');
  fillPoly(ctx, [52, -17, 46, -19.5, 46, -14.5], '#5a6673'); // radome tip
}

function drawF14Side(ctx: CanvasRenderingContext2D, o: SideDrawOpts): void {
  const g = o.gear ?? 1;
  if (g > 0.05) {
    gearLeg(ctx, 40, -11, 7 * g, 3.8);
    gearLeg(ctx, -12, -12, 8 * g, 4.6);
  }
  nozzleFlame(ctx, -60, -18, 8, o.throttle ?? 0, o.t ?? 0);
  fillPoly(ctx, [-30, -27, -46, -58, -56, -58, -54, -27], '#7f8a96', LINE); // far fin
  fillPoly(ctx, [-34, -27, -50, -56, -60, -56, -58, -27], '#a9b3bd', LINE);
  fillPoly(ctx, [-53, -52, -59, -52, -60, -56, -50, -56], '#e8c01c'); // tail band
  fillPoly(ctx, [62, -20, 54, -24, 36, -28, 14, -29, -20, -28, -56, -26, -62, -22, -62, -16, -40, -12, 20, -12, 44, -14], '#a9b3bd', LINE);
  fillPoly(ctx, [-8, -23, 26, -23, 22, -9, -10, -9], '#8d98a4', LINE); // intake box
  fillPoly(ctx, [-8, -23, -1, -23, -3, -9, -10, -9], '#2b3036'); // intake mouth shadow
  fillPoly(ctx, [-26, -21, 10, -24, 14, -21, -28, -19], '#7f8a96'); // glove / wing root
  fillPoly(ctx, [-44, -19, -62, -20, -62, -17, -46, -16], '#7f8a96');
  ctx.beginPath();
  ctx.ellipse(32, -28, 17, 5.5, -0.04, Math.PI, Math.PI * 2);
  ctx.fillStyle = '#7fc6e8';
  ctx.fill();
  ctx.fillStyle = 'rgba(20,30,40,0.5)';
  ctx.fillRect(31, -33, 1.2, 5);
  ellipse(ctx, 26, -30, 5, 1.3, 'rgba(255,255,255,0.55)');
  fillPoly(ctx, [62, -20, 54, -23, 54, -16], '#5f6a76');
}

function drawSR71Side(ctx: CanvasRenderingContext2D, o: SideDrawOpts): void {
  const g = o.gear ?? 1;
  if (g > 0.05) {
    gearLeg(ctx, 48, -12, 7 * g, 3.6);
    gearLeg(ctx, -10, -13, 8 * g, 4.6);
  }
  nozzleFlame(ctx, -66, -17, 9, o.throttle ?? 0, o.t ?? 0);
  fillPoly(ctx, [-40, -22, -54, -44, -63, -44, -62, -22], '#1c1f24', LINE); // canted fin
  fillPoly(ctx, [-64, -22, 10, -22, 14, -20, 14, -13, -64, -12], '#2a2e35', LINE); // nacelle
  fillPoly(ctx, [14, -20, 26, -17, 14, -14], '#4b525d'); // inlet spike
  fillPoly(ctx, [80, -18, 60, -21, 42, -24, 30, -24, -30, -23, -66, -21, -66, -18, -20, -16, 40, -15, 66, -16], '#23262d', LINE);
  fillPoly(ctx, [76, -18, 40, -19.5, -60, -19.5, -60, -18.5, 40, -18], '#3d4450'); // chine highlight
  ctx.beginPath();
  ctx.ellipse(44, -24, 9, 3.2, -0.02, Math.PI, Math.PI * 2);
  ctx.fillStyle = '#5d7f99';
  ctx.fill();
  ellipse(ctx, 42, -25.5, 3, 0.8, 'rgba(255,255,255,0.45)');
  ctx.fillStyle = '#b23a3a';
  ctx.fillRect(-30, -22.5, 20, 0.8);
}

export function drawPlaneSide(
  ctx: CanvasRenderingContext2D, id: PlaneId, x: number, y: number, scale: number, o: SideDrawOpts = {},
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-(o.pitch ?? 0));
  ctx.scale(scale, scale);
  ctx.lineWidth = 0.8;
  ctx.lineJoin = 'round';
  switch (id) {
    case 'f16': drawF16Side(ctx, o); break;
    case 'f14': drawF14Side(ctx, o); break;
    case 'sr71': drawSR71Side(ctx, o); break;
    default: throw new Error(`unhandled: ${id satisfies never}`);
  }
  ctx.restore();
}

/** Nozzle x offset (unscaled) for exhaust heat / steam effects. */
export const SIDE_TAIL_X: Readonly<Record<PlaneId, number>> = { f16: -54, f14: -62, sr71: -66 };
