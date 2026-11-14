import type { TankId } from '../../data/types';
import { paintFleet } from '../fleet-paint';
import type { Look } from '../livery-art';
import { lazy, polys, stroke, sym, type Pts } from '../planes/geom';

// The tanks and buggies from above (doc 104), front up (−y), drawn around the hull's middle (0, 0): the tanks on two
// tracks whose links run with the ground covered, the hull in the vehicle's paint (doc 112) with its engine deck, the
// turret turned toward `turret` (rad, relative to the hull) with the barrel; the buggies on four knobbly wheels with a
// roll cage, two seats and their gun (the Jackal's pintle gun, the Viper's rocket rack). `driven` (px) turns tracks and
// wheels.

export interface TankTopOpts {
  t: number;
  driven: number;
  turret: number;
}

const INK = '#1a140a';
const TRACK = '#2a2520';
const LINK = '#4a4236';
const RUBBER = '#1c1a18';
const STEEL = '#6a6a62';

interface TankBuild { hull: Pts; track: { x: number; w: number; len: number }; turretR: number; barrel: number; bore: number; brake: boolean }

const TANKS = {
  lynx: { hull: [7, -21, 10, -18, 10, 18, 8, 21], track: { x: 11, w: 5, len: 22 }, turretR: 7.5, barrel: 17, bore: 1.6, brake: false },
  bison: { hull: [9, -25, 13, -21, 13, 22, 10, 25], track: { x: 14.5, w: 6.5, len: 26 }, turretR: 10.5, barrel: 24, bore: 2.2, brake: true },
} as const satisfies Record<string, TankBuild>;

const tankGeo = lazy(() => ({
  lynx: polys(sym(TANKS.lynx.hull)),
  bison: polys(sym(TANKS.bison.hull)),
}));

export const isTankBody = (id: TankId): id is 'lynx' | 'bison' => id === 'lynx' || id === 'bison';

/** The outline for the shadow and the flash: hull and tracks (or chassis and wheels). */
export function tankTopSilhouette(id: TankId): Path2D {
  const p = new Path2D();
  if (isTankBody(id)) {
    const b = TANKS[id];
    p.roundRect(-b.track.x - b.track.w / 2, -b.track.len, (b.track.x + b.track.w / 2) * 2, b.track.len * 2, 3);
    p.arc(0, 0, b.turretR, 0, Math.PI * 2);
    return p;
  }
  const len = id === 'viper' ? 23 : 20;
  p.roundRect(-13, -len, 26, len * 2, 5);
  return p;
}

/** One track: a dark belt, its links sliding back as the vehicle drives, the road wheels showing as bumps. */
function track(ctx: CanvasRenderingContext2D, x: number, w: number, len: number, driven: number): void {
  ctx.fillStyle = INK;
  ctx.fillRect(x - w / 2 - 0.8, -len - 0.8, w + 1.6, len * 2 + 1.6);
  ctx.fillStyle = TRACK;
  ctx.fillRect(x - w / 2, -len, w, len * 2);
  ctx.fillStyle = LINK;
  const off = driven % 3.2;
  for (let y = -len + off; y < len; y += 3.2) ctx.fillRect(x - w / 2, y, w, 1.1);
}

export function drawTankTop(ctx: CanvasRenderingContext2D, id: 'lynx' | 'bison', look: Look, o: TankTopOpts): void {
  const b = TANKS[id];
  const hull = tankGeo()[id];
  for (const side of [-1, 1]) track(ctx, side * b.track.x, b.track.w, b.track.len, o.driven);
  ctx.fillStyle = look.base;
  ctx.fill(hull);
  paintFleet(ctx, look, hull, { x: -14, y: -26, w: 28, h: 52 }, `${id}-top`, 'top');
  stroke(ctx, hull, look.ink, 0.8);
  // Engine deck: louvres at the back, a light glacis at the front.
  ctx.fillStyle = 'rgba(0,0,0,0.28)';
  for (let k = 0; k < 4; k++) ctx.fillRect(-b.track.x + 4, b.track.len - 8 + k * 2, (b.track.x - 4) * 2, 1);
  ctx.fillStyle = 'rgba(255,255,255,0.14)';
  ctx.fillRect(-b.track.x + 3, -b.track.len + 2, (b.track.x - 3) * 2, 3);
  turret(ctx, b, look, o.turret);
}

function turret(ctx: CanvasRenderingContext2D, b: TankBuild, look: Look, angle: number): void {
  ctx.save();
  ctx.rotate(angle);
  ctx.fillStyle = INK;
  ctx.fillRect(-b.bore - 0.8, -b.turretR - b.barrel - 0.8, b.bore * 2 + 1.6, b.barrel + 1.6);
  ctx.fillStyle = STEEL;
  ctx.fillRect(-b.bore, -b.turretR - b.barrel, b.bore * 2, b.barrel);
  if (b.brake) {
    ctx.fillStyle = INK;
    ctx.fillRect(-b.bore - 1.6, -b.turretR - b.barrel - 1, b.bore * 2 + 3.2, 4);
  }
  ctx.fillStyle = INK;
  ctx.beginPath();
  ctx.arc(0, 1, b.turretR + 0.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = look.under;
  ctx.beginPath();
  ctx.arc(0, 1, b.turretR, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  ctx.beginPath();
  ctx.arc(-b.turretR * 0.3, -b.turretR * 0.2, b.turretR * 0.45, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#2a241a'; // the commander's hatch
  ctx.beginPath();
  ctx.arc(b.turretR * 0.35, b.turretR * 0.3, b.turretR * 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** One knobbly wheel seen from above, its tread blocks running with the ground covered. */
function wheel(ctx: CanvasRenderingContext2D, x: number, y: number, driven: number): void {
  ctx.fillStyle = INK;
  ctx.fillRect(x - 3.6, y - 5.8, 7.2, 11.6);
  ctx.fillStyle = RUBBER;
  ctx.fillRect(x - 3, y - 5.2, 6, 10.4);
  ctx.fillStyle = '#3a3630';
  const off = driven % 2.6;
  for (let k = -5.2 + off; k < 5.2; k += 2.6) ctx.fillRect(x - 3, y + k, 6, 0.9);
}

const buggyGeo = lazy(() => ({
  jackal: polys(sym([4, -19, 7, -16, 7, 15, 5, 18])),
  viper: polys(sym([4, -22, 7, -19, 7, 19, 5, 22])),
}));

export function drawBuggyTop(ctx: CanvasRenderingContext2D, id: 'jackal' | 'viper', look: Look, o: TankTopOpts): void {
  const len = id === 'viper' ? 22 : 19;
  for (const sx of [-10, 10]) for (const sy of [-len + 6, len - 6]) wheel(ctx, sx, sy, o.driven);
  const body = buggyGeo()[id];
  ctx.fillStyle = look.base;
  ctx.fill(body);
  paintFleet(ctx, look, body, { x: -8, y: -len - 1, w: 16, h: len * 2 + 2 }, `${id}-top`, 'top');
  stroke(ctx, body, look.ink, 0.8);
  ctx.fillStyle = '#2a2018'; // two seats
  ctx.fillRect(-5.5, -4, 4.5, 6);
  ctx.fillRect(1, -4, 4.5, 6);
  ctx.strokeStyle = '#c8c8c0'; // the roll cage
  ctx.lineWidth = 1.2;
  ctx.strokeRect(-6.5, -7, 13, 12);
  ctx.beginPath();
  ctx.moveTo(-6.5, -7);
  ctx.lineTo(6.5, 5);
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,240,180,0.85)'; // headlights
  ctx.fillRect(-5, -len + 0.5, 2.4, 1.4);
  ctx.fillRect(2.6, -len + 0.5, 2.4, 1.4);
  if (id === 'viper') rocketRack(ctx, len);
  else pintleGun(ctx, o.turret);
}

function pintleGun(ctx: CanvasRenderingContext2D, angle: number): void {
  ctx.save();
  ctx.translate(0, 8);
  ctx.rotate(angle);
  ctx.fillStyle = INK;
  ctx.fillRect(-1.6, -15, 3.2, 15);
  ctx.fillStyle = STEEL;
  ctx.fillRect(-1, -14.4, 2, 14);
  ctx.fillStyle = '#3a3a34';
  ctx.fillRect(-2.6, -2.6, 5.2, 5.2);
  ctx.restore();
}

function rocketRack(ctx: CanvasRenderingContext2D, len: number): void {
  ctx.fillStyle = INK;
  ctx.fillRect(-7, len - 15, 14, 11);
  ctx.fillStyle = '#4a5030';
  ctx.fillRect(-6.4, len - 14.4, 12.8, 9.8);
  ctx.fillStyle = '#1a1a14';
  for (let c = 0; c < 4; c++) for (let r = 0; r < 2; r++) {
    ctx.beginPath();
    ctx.arc(-4.5 + c * 3, len - 11.6 + r * 4.4, 1.1, 0, Math.PI * 2);
    ctx.fill();
  }
}
