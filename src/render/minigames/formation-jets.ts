import { TAU, type Vec } from '../../core/math';
import type { LiveryId } from '../../data/liveries';
import type { PlaneId } from '../../data/types';
import { INNER_R, OUTER_R, type Zone } from '../../game/minigames/formation';
import { drawPlaneTop } from '../draw-planes';
import { a10Silhouette } from '../planes/a10-top';
import { f14Silhouette } from '../planes/f14-top';
import { f16Silhouette } from '../planes/f16-top';
import { f35Silhouette } from '../planes/f35-top';
import { sr71Silhouette } from '../planes/sr71-top';
import { tornadoSilhouette } from '../planes/tornado-top';
import { COLORS } from '../text';

// Formation Flying (doc 14): the two jets with their shadows, the slot ghost with its rings, the prediction pip.

export const JET_SCALE = 1.35;
/** F-14 wings fairly forward at air-show speed. */
export const SWEEP = 0.25;
const SHADOW = { x: 26, y: 40 };
/** Where the smoke leaves each jet (tail) and its wingtips, in plane units from its centre. */
export const TAIL: Readonly<Record<PlaneId, number>> = { f16: 30, f14: 30, sr71: 36, a10: 30, f35: 33, tornado: 32 };
export const WINGTIP: Readonly<Record<PlaneId, Vec>> = {
  f16: { x: 25, y: 11 }, f14: { x: 33, y: 8 }, sr71: { x: 28, y: 22 }, a10: { x: 33, y: 2 }, f35: { x: 24, y: 11 }, tornado: { x: 26, y: 11 },
};

export interface JetPose {
  x: number;
  y: number;
  /** Nose angle from screen-up, rad (+ = right). */
  yaw: number;
  bank: number;
  scale: number;
  throttle: number;
  /** 0 … 1: the pitch-up (shadow further away and fainter). */
  alt: number;
}

/** A point given in plane units (x right, y back) on a jet at this pose, in screen px. */
export function onJet(p: JetPose, v: Vec): Vec {
  const c = Math.cos(p.yaw);
  const s = Math.sin(p.yaw);
  return { x: p.x + (v.x * c - v.y * s) * p.scale, y: p.y + (v.x * s + v.y * c) * p.scale };
}

/** The shadow on the sea; `sun` turns its offset with the ground (the sun stays put in a turn). */
export function drawJetShadow(ctx: CanvasRenderingContext2D, plane: PlaneId, p: JetPose, sun: number): void {
  const k = 1 + 1.7 * p.alt;
  const c = Math.cos(sun);
  const s = Math.sin(sun);
  ctx.save();
  ctx.globalAlpha = 1 - 0.55 * p.alt;
  ctx.translate(p.x + (SHADOW.x * c - SHADOW.y * s) * k, p.y + (SHADOW.x * s + SHADOW.y * c) * k);
  ctx.rotate(p.yaw);
  drawPlaneTop(ctx, plane, 0, 0, p.scale * (1 - 0.12 * p.alt), { bank: p.bank, sweep: SWEEP, shadow: true });
  ctx.restore();
}

export function drawJet(ctx: CanvasRenderingContext2D, plane: PlaneId, p: JetPose, t: number, livery?: LiveryId): void {
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.yaw);
  drawPlaneTop(ctx, plane, 0, 0, p.scale, { bank: p.bank, sweep: SWEEP, throttle: p.throttle, t, livery });
  ctx.restore();
}

function silhouette(plane: PlaneId): Path2D {
  switch (plane) {
    case 'f16': return f16Silhouette();
    case 'f14': return f14Silhouette(SWEEP);
    case 'sr71': return sr71Silhouette();
    case 'a10': return a10Silhouette();
    case 'f35': return f35Silhouette();
    case 'tornado': return tornadoSilhouette(SWEEP);
    default: throw new Error(`unhandled: ${plane satisfies never}`);
  }
}

function ring(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string, width: number, dash: readonly number[], offset = 0): void {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.setLineDash(dash);
  ctx.lineDashOffset = offset;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.stroke();
  ctx.restore();
}

/** Ghost outline of your jet at the slot (under the jets). */
export function drawSlotGhost(ctx: CanvasRenderingContext2D, plane: PlaneId, at: Vec, yaw: number, scale: number): void {
  ctx.save();
  ctx.translate(at.x, at.y);
  ctx.rotate(yaw);
  ctx.scale(scale, scale);
  const path = silhouette(plane);
  ctx.fillStyle = 'rgba(220,240,255,0.12)';
  ctx.fill(path);
  ctx.lineWidth = 1.3 / scale;
  ctx.setLineDash([4 / scale, 3 / scale]);
  ctx.strokeStyle = 'rgba(220,240,255,0.55)';
  ctx.stroke(path);
  ctx.restore();
}

/** The inner (tight) and outer (loose) rings over the jets; `zone` lights its ring. */
export function drawSlotRings(ctx: CanvasRenderingContext2D, at: Vec, zone: Zone, t: number): void {
  const pulse = 0.55 + 0.4 * Math.sin(t * 9);
  const outer = zone === 'outer' ? COLORS.amber : zone === 'out' ? `rgba(255,79,79,${pulse.toFixed(3)})` : 'rgba(255,255,255,0.35)';
  ring(ctx, at.x, at.y, OUTER_R, 'rgba(0,0,0,0.25)', 3.5, [7, 7], -t * 18);
  ring(ctx, at.x, at.y, OUTER_R, outer, zone === 'inner' ? 1.5 : 2.2, [7, 7], -t * 18);
  ring(ctx, at.x, at.y, INNER_R, 'rgba(0,0,0,0.25)', 3.5, []);
  ring(ctx, at.x, at.y, INNER_R, zone === 'inner' ? COLORS.gold : 'rgba(255,255,255,0.55)', zone === 'inner' ? 2.6 : 1.6, []);
  ctx.strokeStyle = 'rgba(255,255,255,0.7)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(at.x - 5, at.y);
  ctx.lineTo(at.x + 5, at.y);
  ctx.moveTo(at.x, at.y - 5);
  ctx.lineTo(at.x, at.y + 5);
  ctx.stroke();
}

/** Thin line from your jet to where it coasts to: a small cyan diamond. */
export function drawPip(ctx: CanvasRenderingContext2D, from: Vec, to: Vec): void {
  ctx.save();
  ctx.strokeStyle = 'rgba(95,212,255,0.6)';
  ctx.lineWidth = 1.4;
  ctx.setLineDash([3, 4]);
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(to.x, to.y);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(to.x, to.y - 6);
  ctx.lineTo(to.x + 6, to.y);
  ctx.lineTo(to.x, to.y + 6);
  ctx.lineTo(to.x - 6, to.y);
  ctx.closePath();
  ctx.fillStyle = 'rgba(95,212,255,0.35)';
  ctx.fill();
  ctx.strokeStyle = COLORS.cyan;
  ctx.lineWidth = 1.6;
  ctx.stroke();
  ctx.restore();
}
