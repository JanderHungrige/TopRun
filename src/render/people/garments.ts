import { chestFront, PARTS } from './anatomy';
import { LINE, METAL } from './palette';
import { closedPath, lazy, paintPart, shapes, taper, type Pts } from './paths';
import type { PersonLook, Tone, TorsoWear } from './types';

// People kit (doc 17): side-view clothing on the torso frame (shoulder joint at 0, hip joint at x = 96,
// front on −y). Garments are a region clipped to the body silhouette, painted with the torso's shading.

function region(list: readonly Pts[]): Path2D {
  const p = new Path2D();
  for (const pts of list) {
    for (let i = 0; i < pts.length; i += 2) p.lineTo(pts[i] ?? 0, pts[i + 1] ?? 0);
    p.closePath();
  }
  return p;
}

const STRAP: Pts = [-7, -17, -18, -11, -21, -2, -18, 8, -8, 15, -4, 13, -13, 6, -15, -2, -12, -9, -3, -14];
const ARMHOLE: Pts = [6, -14, 20, -12, 29, -2, 27, 9, 12, 14, 0, 15, -6, 17];

const REGIONS = lazy(() => ({
  tank: region([[130, -50, 4, -50, -3, -25, -7, -17, ...ARMHOLE, -8, 50, 130, 50], STRAP]),
  sportsTop: region([[42, -50, 4, -50, -3, -25, -7, -17, ...ARMHOLE, -8, 50, 42, 50], STRAP]),
  tshirt: region([[130, -50, -9, -50, -13, -24, -16, -6, -17, 6, -14, 50, 130, 50]]),
  pelvis: region([[79, -50, 79, 50, 140, 50, 140, -50]]),
  band: region([[79, -50, 79, 50, 85, 50, 85, -50]]),
  cropBand: region([[35, -50, 35, 50, 42, 50, 42, -50]]),
  stripe: region([[84, -1.4, 116, -1.4, 116, 1.4, 84, 1.4]]),
  folds: shapes([taper([50, -14, 60, -6, 66, 4], 3), taper([56, 6, 64, 12, 70, 16], 2.6)]),
}));

function topRegion(w: TorsoWear): Path2D | null {
  const r = REGIONS();
  switch (w) {
    case 'shirtless': return null;
    case 'tank': return r.tank;
    case 'sportsTop': return r.sportsTop;
    case 'tshirt': return r.tshirt;
    case 'dressWhites': return r.tshirt;
    case 'flightSuit': return r.tshirt;
    default: throw new Error(`unhandled: ${w satisfies never}`);
  }
}

/** Paints `tone` over the body inside `area`, with the torso's light and shadow but no muscle lines. */
function cloth(ctx: CanvasRenderingContext2D, area: Path2D, tone: Tone, lit: number): void {
  const body = PARTS.torso().body;
  ctx.save();
  ctx.clip(area);
  paintPart(ctx, PARTS.torso(), tone, lit, false, false);
  ctx.clip(body);
  ctx.lineWidth = 1.3;
  ctx.strokeStyle = LINE;
  ctx.stroke(area);
  ctx.restore();
}

/** Top, then shorts / trousers over the pelvis (in the torso frame). */
export function torsoGarments(ctx: CanvasRenderingContext2D, look: PersonLook, lit: number): void {
  const r = REGIONS();
  const top = topRegion(look.torso);
  if (top) {
    cloth(ctx, top, look.top, lit);
    ctx.save();
    ctx.clip(PARTS.torso().body);
    ctx.clip(top);
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = look.top.shadow;
    ctx.fill(r.folds);
    ctx.globalAlpha = 1;
    if (look.torso === 'sportsTop') {
      ctx.fillStyle = look.trim;
      ctx.fill(r.cropBand);
    }
    ctx.restore();
  }
  cloth(ctx, r.pelvis, look.bottom, lit);
  ctx.save();
  ctx.clip(PARTS.torso().body);
  ctx.fillStyle = look.bottom.shadow;
  ctx.fill(r.band);
  if (look.legs === 'shorts') {
    ctx.fillStyle = look.trim;
    ctx.fill(r.stripe);
  }
  ctx.restore();
}

const SHORTS_STRIPE = lazy(() => region([[-16, -1.4, 46, -1.4, 46, 1.4, -16, 1.4]]));

/** The side stripe down a shorts leg (thigh frame, after the leg is painted). */
export function shortsStripe(ctx: CanvasRenderingContext2D, trim: string): void {
  ctx.fillStyle = trim;
  ctx.fill(SHORTS_STRIPE());
}

const ROLL = lazy(() => ({
  band: closedPath([67, -21.5, 76, -23, 85, -21.5, 87, 0, 85, 23, 76, 22.5, 67, 18.5, 69, 0]),
  folds: shapes([taper([70, -18, 73, -4, 71, 10], 2.4), taper([79, -19, 81, -2, 80, 16], 2.2)]),
}));

/** One sleeve end hanging from the knot along gravity: a flat, tapering piece of cloth with a cuff. */
function sleeveEnd(ctx: CanvasRenderingContext2D, t: Tone, x: number, y: number, ex: number, ey: number): void {
  const len = Math.hypot(ex, ey) || 1;
  const nx = -ey / len;
  const ny = ex / len;
  ctx.beginPath();
  ctx.moveTo(x + nx * 4, y + ny * 4);
  ctx.quadraticCurveTo(x + ex * 0.5 + nx * 5, y + ey * 0.5 + ny * 5, x + ex + nx * 3.2, y + ey + ny * 3.2);
  ctx.lineTo(x + ex - nx * 3.2, y + ey - ny * 3.2);
  ctx.quadraticCurveTo(x + ex * 0.5 - nx * 3, y + ey * 0.5 - ny * 3, x - nx * 4, y - ny * 4);
  ctx.closePath();
  ctx.fillStyle = t.base;
  ctx.fill();
  ctx.lineWidth = 1.2;
  ctx.strokeStyle = LINE;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x + ex * 0.82 + nx * 3.4, y + ey * 0.82 + ny * 3.4);
  ctx.lineTo(x + ex * 0.82 - nx * 3.4, y + ey * 0.82 - ny * 3.4);
  ctx.strokeStyle = t.shadow;
  ctx.lineWidth = 1.6;
  ctx.stroke();
}

/** The flight suit's top half rolled down, sleeves knotted at the front; the ends hang along gravity (gx, gy). */
export function tiedSleeves(ctx: CanvasRenderingContext2D, t: Tone, gx: number, gy: number, sway: number): void {
  const r = ROLL();
  ctx.fillStyle = t.base;
  ctx.fill(r.band);
  ctx.globalAlpha = 0.6;
  ctx.fillStyle = t.shadow;
  ctx.fill(r.folds);
  ctx.globalAlpha = 1;
  ctx.lineWidth = 1.3;
  ctx.strokeStyle = LINE;
  ctx.stroke(r.band);
  const kx = 76;
  const ky = -23;
  sleeveEnd(ctx, t, kx + 2, ky, gx * 15 + gy * sway + 3, gy * 15 - gx * sway);
  sleeveEnd(ctx, t, kx - 2, ky, gx * 13 - gy * sway - 3, gy * 13 + gx * sway);
  ctx.beginPath();
  ctx.ellipse(kx, ky, 4.6, 3.8, 0, 0, Math.PI * 2);
  ctx.fillStyle = t.shadow;
  ctx.fill();
  ctx.stroke();
}

/** Blank dog tags on a ball chain: they hang along gravity and rest on the chest when it points inwards. */
export function dogTags(ctx: CanvasRenderingContext2D, gx: number, gy: number): void {
  const ax = -9;
  const ay = -16;
  let tx = ax + gx * 17;
  let ty = ay + gy * 17;
  const surface = -chestFront(tx) - 1.5;
  if (ty > surface) ty = surface;
  tx = Math.max(tx, ax + 4);
  ctx.beginPath();
  ctx.moveTo(-16, 6);
  ctx.quadraticCurveTo(-12, -14, ax, ay);
  ctx.lineTo(tx, ty);
  ctx.strokeStyle = METAL.shadow;
  ctx.lineWidth = 0.9;
  ctx.stroke();
  const a = Math.atan2(ty - ay, tx - ax) - Math.PI / 2;
  for (const [ox, c] of [[2.2, METAL.shadow], [0, METAL.base]] as const) {
    ctx.save();
    ctx.translate(tx, ty);
    ctx.rotate(a + ox * 0.08);
    ctx.beginPath();
    ctx.roundRect(-2.6 + ox, 0, 5.2, 8.4, 1.6);
    ctx.fillStyle = c;
    ctx.fill();
    ctx.strokeStyle = LINE;
    ctx.lineWidth = 0.6;
    ctx.stroke();
    ctx.fillStyle = METAL.light;
    ctx.fillRect(-1.6 + ox, 1, 1, 6);
    ctx.restore();
  }
}
