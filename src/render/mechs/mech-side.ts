import type { MechId } from '../../data/types';
import { defaultPaint, type Paint } from '../../game/mech-paint';
import { camoFill } from './mech-camo';

// The mechs from the side (doc 80), facing right (+x), feet on y = 0: reverse-jointed legs with armoured thighs and
// clawed feet, the torso in the mech's camo (doc 87) with its plates, rivets and cockpit glass, the shoulder armour over
// the autocannon arm, rocket pods on the heavier ones. For the mech bay, the paint shop, the drop and the base.

interface SideBuild { h: number; w: number; leg: number; gun: number; pods: boolean; hump: boolean; nose: number }

const SIDE: Readonly<Record<MechId, SideBuild>> = {
  strider: { h: 20, w: 26, leg: 30, gun: 24, pods: false, hump: false, nose: 6 },
  ranger: { h: 24, w: 30, leg: 30, gun: 24, pods: true, hump: false, nose: 4 },
  hornet: { h: 18, w: 28, leg: 34, gun: 28, pods: false, hump: false, nose: 10 },
  titan: { h: 30, w: 36, leg: 28, gun: 22, pods: true, hump: true, nose: 4 },
};

const INK = '#141a0e';
const METAL = '#5a6048';
const DARK = '#2c3024';
const LIGHT = '#7a8064';

type Fill = string | CanvasPattern;

function poly(ctx: CanvasRenderingContext2D, pts: readonly number[], fill: Fill): void {
  ctx.beginPath();
  for (let i = 0; i < pts.length; i += 2) {
    const x = pts[i] ?? 0;
    const y = pts[i + 1] ?? 0;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.lineWidth = 2;
  ctx.strokeStyle = INK;
  ctx.stroke();
  ctx.fillStyle = fill;
  ctx.fill();
}

function joint(ctx: CanvasRenderingContext2D, x: number, y: number, r: number): void {
  ctx.fillStyle = INK;
  ctx.beginPath();
  ctx.arc(x, y, r + 1, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = METAL;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = LIGHT;
  ctx.fillRect(x - r * 0.5, y - r * 0.5, r * 0.5, r * 0.5);
}

/** One leg: an armoured thigh from the hip forward to the knee, the shin back to the ankle, a clawed foot. `step`
 *  −1…1 swings it, `camo` paints the thigh plate, `shade` darkens the far leg. */
function leg(ctx: CanvasRenderingContext2D, b: SideBuild, dx: number, step: number, camo: Fill, shade: boolean): void {
  const hip = -b.leg;
  const fx = dx + step * 7;
  const lift = Math.max(0, step) * 5;
  const knee = { x: fx + 9, y: hip * 0.5 - lift };
  const ankle = { x: fx - 2, y: -6 - lift };
  poly(ctx, [knee.x - 3, knee.y - 2, knee.x + 3, knee.y + 2, ankle.x + 3, ankle.y, ankle.x - 3, ankle.y - 1], shade ? DARK : METAL);
  poly(ctx, [dx - 5, hip - 3, dx + 5, hip - 4, knee.x + 4, knee.y, knee.x - 4, knee.y + 3], camo);
  joint(ctx, knee.x, knee.y, 3.5);
  poly(ctx, [fx - 11, -lift, fx - 7, -6 - lift, fx + 6, -6 - lift, fx + 12, -lift], shade ? DARK : METAL);
  ctx.fillStyle = INK;
  for (const tx of [fx - 9, fx + 9]) ctx.fillRect(tx, -2 - lift, 3, 2); // the claws
  if (shade) {
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(Math.min(dx, ankle.x) - 12, hip - 4, 30, -hip + 4);
  }
}

function torso(ctx: CanvasRenderingContext2D, b: SideBuild, camo: Fill, t: number): void {
  const top = -b.leg - b.h;
  const x0 = -b.w / 2;
  if (b.hump) poly(ctx, [x0 - 8, top + 4, x0 + 2, top + 2, x0 + 2, top + b.h - 3, x0 - 8, top + b.h - 6], DARK);
  poly(ctx, [x0, top + 3, x0 + 3, top, x0 + b.w, top, x0 + b.w + b.nose, top + b.h * 0.45, x0 + b.w, top + b.h, x0 + 2, top + b.h], camo);
  ctx.fillStyle = 'rgba(255,255,240,0.18)';
  ctx.fillRect(x0 + 3, top + 1, b.w - 3, 2);
  ctx.fillStyle = 'rgba(0,0,0,0.28)';
  ctx.fillRect(x0 + 2, top + b.h - 4, b.w - 2, 4);
  ctx.fillStyle = INK;
  for (let k = 0; k < 3; k++) ctx.fillRect(x0 + 4 + k * 3, top + b.h * 0.55, 2, b.h * 0.3); // the vents
  for (const [rx, ry] of [[x0 + 3, top + 4], [x0 + b.w - 4, top + b.h - 6], [x0 + 3, top + b.h - 6]] as const) ctx.fillRect(rx, ry, 1.5, 1.5);
  poly(ctx, [x0 + b.w - 9, top + 3, x0 + b.w + b.nose * 0.7, top + 3 + b.nose * 0.3, x0 + b.w + b.nose * 0.4, top + b.h * 0.42, x0 + b.w - 9, top + b.h * 0.42], '#1e3a44');
  ctx.fillStyle = `rgba(160,255,200,${(0.45 + Math.sin(t * 3) * 0.2).toFixed(2)})`;
  ctx.fillRect(x0 + b.w - 6, top + 5, 3, 2);
  if (b.pods) {
    poly(ctx, [x0 + 3, top - 9, x0 + 17, top - 9, x0 + 17, top + 1, x0 + 3, top + 1], camo);
    ctx.fillStyle = '#c84a2a';
    for (let k = 0; k < 3; k++) ctx.fillRect(x0 + 15, top - 7 + k * 3, 2, 1.5);
  }
}

function arm(ctx: CanvasRenderingContext2D, b: SideBuild, camo: Fill): void {
  const top = -b.leg - b.h;
  const y = top + b.h * 0.72;
  poly(ctx, [4, y - 4, 10 + b.gun, y - 4, 10 + b.gun, y + 3, 4, y + 3], DARK);
  ctx.fillStyle = LIGHT;
  ctx.fillRect(6, y - 4, b.gun + 2, 1.5);
  ctx.fillStyle = INK;
  ctx.fillRect(10 + b.gun - 2, y - 3, 3, 5); // the muzzle
  poly(ctx, [4, y + 3, 12, y + 3, 12, y + 8, 4, y + 8], METAL); // the ammo box
  poly(ctx, [-4, top + b.h * 0.3, 8, top + b.h * 0.26, 10, y - 2, -2, y + 1], camo); // the shoulder armour
  joint(ctx, 3, top + b.h * 0.5, 3);
}

/** A mech from the side, feet on y = 0; `stride` swings the legs as in the top view. */
export function drawMechSide(ctx: CanvasRenderingContext2D, id: MechId, o: { t: number; stride?: number; paint?: Paint | null }): void {
  const b = SIDE[id];
  const s = Math.sin((o.stride ?? 0) * Math.PI);
  const camo = camoFill(ctx, o.paint ?? defaultPaint(id), 2.5);
  ctx.lineJoin = 'round';
  leg(ctx, b, -6, -s, camo, true);
  torso(ctx, b, camo, o.t);
  joint(ctx, 2, -b.leg, 4);
  leg(ctx, b, 4, s, camo, false);
  arm(ctx, b, camo);
}

/** The mech's outline from the side, for shadows. */
export function mechSideSilhouette(id: MechId): Path2D {
  const b = SIDE[id];
  const p = new Path2D();
  p.rect(-b.w / 2 - 1, -b.leg - b.h - 1, b.w + b.nose + 2, b.h + 2);
  p.rect(-12, -b.leg, 24, b.leg);
  return p;
}
