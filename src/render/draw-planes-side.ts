import type { LiveryId } from '../data/liveries';
import type { PlaneId } from '../data/types';
import { liveryLook } from './livery-art';
import { drawA10Side } from './planes/a10-side';
import { drawF14Side } from './planes/f14-side';
import { drawF16Side } from './planes/f16-side';
import { drawF35Side } from './planes/f35-side';
import { drawSR71Side } from './planes/sr71-side';
import { drawTornadoSide } from './planes/tornado-side';
import type { SideOpts } from './planes/surface';

/** Side-view jets for the carrier scene. Nose points right; origin is the main-gear deck contact point. */

export interface SideDrawOpts {
  pitch?: number; // radians, nose up positive
  throttle?: number;
  t?: number;
  gear?: number; // 1 = down, 0 = retracted
  hook?: boolean; // arrestor hook lowered
  livery?: LiveryId; // paint job, default 'standard'
}

export function drawPlaneSide(
  ctx: CanvasRenderingContext2D, id: PlaneId, x: number, y: number, scale: number, o: SideDrawOpts = {},
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-(o.pitch ?? 0));
  ctx.scale(scale, scale);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  const look = liveryLook(id, o.livery ?? 'standard');
  const opts: SideOpts = { throttle: o.throttle ?? 0, t: o.t ?? 0, gear: o.gear ?? 1, hook: o.hook ?? false };
  switch (id) {
    case 'f16': drawF16Side(ctx, look, opts); break;
    case 'f14': drawF14Side(ctx, look, opts); break;
    case 'sr71': drawSR71Side(ctx, look, opts); break;
    case 'a10': drawA10Side(ctx, look, opts); break;
    case 'f35': drawF35Side(ctx, look, opts); break;
    case 'tornado': drawTornadoSide(ctx, look, opts); break;
    default: throw new Error(`unhandled: ${id satisfies never}`);
  }
  ctx.restore();
}

/** Nozzle x offset (unscaled) for exhaust heat / steam effects. */
export const SIDE_TAIL_X: Readonly<Record<PlaneId, number>> = { f16: -44, f14: -46, sr71: -52, a10: -34, f35: -44, tornado: -41 };
