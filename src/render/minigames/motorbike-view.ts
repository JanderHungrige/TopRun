import { TAU } from '../../core/math';
import type { LiveryId } from '../../data/liveries';
import type { PlaneId } from '../../data/types';
import type { ObstacleKind } from '../../game/minigames/motorbike-course';
import { drawPlaneSide } from '../draw-planes-side';
import { drawBike, drawBikeShadow, drawWindscreen, type BikeView } from './motorbike-bike';
import { drawSpeedStreaks, type MotorbikeFx } from './motorbike-fx';
import {
  drawBump, drawGateBack, drawGateFront, drawLiftoffBoard, drawOil, drawSign, drawStartLine,
} from './motorbike-obstacles';
import { drawRider, type RiderLook, type RiderPose } from './motorbike-rider';
import { drawTruck } from './motorbike-truck';
import { drawForeground, drawWorld, ROAD_Y, RUNWAY_Y } from './motorbike-world';

// Motorbike vs. Jet (doc 22): one frame of the race in depth order — world, roadside boards, the jet on the
// runway, things on the road, the truck behind / in front of the bike's lane, the bike and rider, foreground.

/** Jet drawing scale and each jet's nose ahead of its main gear (plane units). */
export const JET_SCALE = 2.1;
const NOSE: Readonly<Record<PlaneId, number>> = { f16: 69, f14: 82, sr71: 95, a10: 59, f35: 69, tornado: 75 };

export interface ObstacleView {
  kind: ObstacleKind;
  /** Screen x where the front wheel meets it, and its end (oil). */
  sx: number;
  sx1: number;
  /** Barrier knocked up 0 … 1. */
  lift: number;
}

export interface JetView {
  plane: PlaneId;
  livery: LiveryId;
  /** Screen x of the nose; height of the main gear above the runway (px). */
  noseX: number;
  alt: number;
  pitch: number;
  gear: number;
  throttle: number;
}

export interface RaceView {
  camX: number;
  t: number;
  obstacles: readonly ObstacleView[];
  signs: readonly { sx: number; kind: ObstacleKind }[];
  start: { sx: number; label: string };
  liftoff: { sx: number; label: string };
  jet: JetView;
  truck: { cx: number; gy: number } | null;
  bike: BikeView;
  rider: RiderPose;
  look: RiderLook;
  fx: MotorbikeFx;
  streaks: number;
}

function jet(ctx: CanvasRenderingContext2D, j: JetView, t: number): void {
  const x = j.noseX - NOSE[j.plane] * JET_SCALE;
  if (x > 1500 || x < -400) return;
  const a = Math.max(0, 0.4 - j.alt / 500);
  if (a > 0) {
    ctx.fillStyle = `rgba(10,6,14,${a.toFixed(3)})`;
    ctx.beginPath();
    ctx.ellipse(x - 10, RUNWAY_Y + 3, 120 + j.alt * 0.2, 5, 0, 0, TAU);
    ctx.fill();
  }
  drawPlaneSide(ctx, j.plane, x, RUNWAY_Y - j.alt, JET_SCALE, { pitch: j.pitch, throttle: j.throttle, gear: j.gear, t, livery: j.livery });
}

function onRoad(ctx: CanvasRenderingContext2D, v: RaceView): void {
  for (const o of v.obstacles) {
    if (o.sx1 < -80 || o.sx > 1400) continue;
    switch (o.kind) {
      case 'bump': drawBump(ctx, o.sx); break;
      case 'oil': drawOil(ctx, o.sx, o.sx1, v.t); break;
      case 'gate': drawGateBack(ctx, o.sx, o.lift, v.t); break;
      case 'truck': break;
      default: throw new Error(`unhandled: ${o.kind satisfies never}`);
    }
  }
}

function bikeAndRider(ctx: CanvasRenderingContext2D, v: RaceView): void {
  const b = v.bike;
  drawBikeShadow(ctx, b.x, ROAD_Y, v.rider.back);
  drawBike(ctx, b);
  ctx.save();
  ctx.translate(b.x, b.y);
  drawRider(ctx, v.look, v.rider);
  ctx.restore();
  drawWindscreen(ctx, b);
}

export function drawRace(ctx: CanvasRenderingContext2D, v: RaceView): void {
  drawWorld(ctx, v.camX, v.t);
  for (const s of v.signs) if (s.sx > -40 && s.sx < 1320) drawSign(ctx, s.sx, s.kind);
  drawStartLine(ctx, v.start.sx, v.start.label);
  drawLiftoffBoard(ctx, v.liftoff.sx, v.liftoff.label);
  jet(ctx, v.jet, v.t);
  onRoad(ctx, v);
  const truck = v.truck;
  if (truck && truck.gy < ROAD_Y) drawTruck(ctx, truck.cx, truck.gy, v.t);
  bikeAndRider(ctx, v);
  for (const o of v.obstacles) if (o.kind === 'gate' && o.sx > -80 && o.sx < 1400) drawGateFront(ctx, o.sx, o.lift);
  if (truck && truck.gy >= ROAD_Y) drawTruck(ctx, truck.cx, truck.gy, v.t);
  v.fx.draw(ctx, v.camX);
  drawForeground(ctx, v.camX);
  drawSpeedStreaks(ctx, v.camX, v.streaks);
}
