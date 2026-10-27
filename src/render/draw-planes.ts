import type { LiveryId } from '../data/liveries';
import type { PlaneId } from '../data/types';
import { liveryLook } from './livery-art';
import { a10Silhouette, drawA10Top } from './planes/a10-top';
import { drawF14Top, f14Silhouette } from './planes/f14-top';
import { drawF16Top, f16Silhouette } from './planes/f16-top';
import { drawF35Top, f35Silhouette } from './planes/f35-top';
import { drawSR71Top, sr71Silhouette } from './planes/sr71-top';
import { drawTornadoTop, tornadoSilhouette } from './planes/tornado-top';
import type { TopOpts } from './planes/surface';

/** Top-down player jets, nose pointing up (-y), drawn around (0, 0). Airframes live in ./planes/. */

export interface PlaneDrawOpts {
  bank?: number; // -1 (rolling left) .. 1 (rolling right)
  sweep?: number; // F-14 wing sweep 0 (forward) .. 1 (fully swept)
  throttle?: number; // afterburner 0..1
  t?: number;
  flash?: boolean; // solid white silhouette (ignores the livery)
  shadow?: boolean; // solid translucent black silhouette (ignores the livery)
  livery?: LiveryId; // paint job, default 'standard'
}

const SHADOW = 'rgba(0,0,0,0.28)';

function silhouette(id: PlaneId, sweep: number): Path2D {
  switch (id) {
    case 'f16': return f16Silhouette();
    case 'f14': return f14Silhouette(sweep);
    case 'sr71': return sr71Silhouette();
    case 'a10': return a10Silhouette();
    case 'f35': return f35Silhouette();
    case 'tornado': return tornadoSilhouette(sweep);
    default: throw new Error(`unhandled: ${id satisfies never}`);
  }
}

/** The jet's outline only (F-35 stealth, doc 36): a thin line around the silhouette. */
export function drawPlaneOutline(
  ctx: CanvasRenderingContext2D, id: PlaneId, x: number, y: number, scale: number, color: string, sweep = 0.3,
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.3 / scale;
  ctx.lineJoin = 'round';
  ctx.stroke(silhouette(id, sweep));
  ctx.restore();
}

export function drawPlaneTop(
  ctx: CanvasRenderingContext2D, id: PlaneId, x: number, y: number, scale: number, o: PlaneDrawOpts = {},
): void {
  const bank = Math.max(-1, Math.min(1, o.bank ?? 0));
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale * (1 - Math.abs(bank) * 0.32), scale);
  if (o.shadow || o.flash) {
    ctx.fillStyle = o.shadow ? SHADOW : '#ffffff';
    ctx.fill(silhouette(id, o.sweep ?? 0.3));
    ctx.restore();
    return;
  }
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  const look = liveryLook(id, o.livery ?? 'standard');
  const opts: TopOpts = { bank, sweep: o.sweep ?? 0.3, throttle: o.throttle ?? 0.4, t: o.t ?? 0 };
  switch (id) {
    case 'f16': drawF16Top(ctx, look, opts); break;
    case 'f14': drawF14Top(ctx, look, opts); break;
    case 'sr71': drawSR71Top(ctx, look, opts); break;
    case 'a10': drawA10Top(ctx, look, opts); break;
    case 'f35': drawF35Top(ctx, look, opts); break;
    case 'tornado': drawTornadoTop(ctx, look, opts); break;
    default: throw new Error(`unhandled: ${id satisfies never}`);
  }
  ctx.restore();
}
