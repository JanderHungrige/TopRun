import type { MechId } from '../../data/types';
import { defaultPaint, type Paint } from '../../game/mech-paint';
import { camoFill } from './mech-camo';

// The mechs from the side (doc 80), facing right (+x), feet on y = 0: reverse-jointed legs, the torso in the mech's camo
// (doc 87) with the cockpit glass at the front, the autocannon arm reaching forward, shoulder pods on the heavier ones.
// For the hangar, the paint shop and the photos.

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

function limb(ctx: CanvasRenderingContext2D, pts: ReadonlyArray<readonly [number, number]>, w: number): void {
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (const [color, lw] of [[INK, w + 2], [METAL, w]] as const) {
    ctx.strokeStyle = color;
    ctx.lineWidth = lw;
    ctx.beginPath();
    pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.stroke();
  }
}

/** One leg: hip, knee forward, ankle back, the foot flat on the ground; `step` −1…1 swings it. */
function leg(ctx: CanvasRenderingContext2D, b: SideBuild, dx: number, step: number): void {
  const hip = -b.leg;
  const fx = dx + step * 6;
  const lift = Math.max(0, step) * 4;
  limb(ctx, [[dx, hip], [fx + 7, hip * 0.55 - lift], [fx - 3, -5 - lift]], 5);
  ctx.fillStyle = INK;
  ctx.fillRect(fx - 9, -4 - lift, 16, 5);
  ctx.fillStyle = DARK;
  ctx.fillRect(fx - 8, -3 - lift, 14, 3);
}

/** A mech from the side, feet on y = 0; `stride` swings the legs as in the top view. */
export function drawMechSide(ctx: CanvasRenderingContext2D, id: MechId, o: { t: number; stride?: number; paint?: Paint | null }): void {
  const b = SIDE[id];
  const s = Math.sin((o.stride ?? 0) * Math.PI);
  const camo = camoFill(ctx, o.paint ?? defaultPaint(id), 2.5);
  leg(ctx, b, -6, -s);
  const top = -b.leg - b.h;
  const x0 = -b.w / 2;
  ctx.fillStyle = INK;
  ctx.fillRect(x0 - 1.5, top - 1.5, b.w + 3 + b.nose, b.h + 3);
  ctx.fillStyle = camo;
  ctx.beginPath();
  ctx.moveTo(x0, top);
  ctx.lineTo(x0 + b.w, top);
  ctx.lineTo(x0 + b.w + b.nose, top + b.h * 0.45);
  ctx.lineTo(x0 + b.w, top + b.h);
  ctx.lineTo(x0, top + b.h);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,240,0.15)';
  ctx.fillRect(x0, top, b.w, 2);
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.fillRect(x0, top + b.h - 3, b.w, 3);
  ctx.fillStyle = '#1e3a44';
  ctx.fillRect(x0 + b.w - 8, top + 3, 9 + b.nose * 0.6, b.h * 0.35); // the cockpit glass
  ctx.fillStyle = `rgba(160,255,200,${(0.45 + Math.sin(o.t * 3) * 0.2).toFixed(2)})`;
  ctx.fillRect(x0 + b.w - 6, top + 4, 3, 2);
  if (b.hump) {
    ctx.fillStyle = INK;
    ctx.fillRect(x0 - 8, top + 3, 10, b.h - 6);
    ctx.fillStyle = DARK;
    ctx.fillRect(x0 - 7, top + 4, 8, b.h - 8);
  }
  if (b.pods) {
    ctx.fillStyle = INK;
    ctx.fillRect(x0 + 3, top - 9, 14, 9);
    ctx.fillStyle = camo;
    ctx.fillRect(x0 + 4, top - 8, 12, 7);
    ctx.fillStyle = '#c84a2a';
    for (let k = 0; k < 3; k++) ctx.fillRect(x0 + 14, top - 7 + k * 2, 2, 1.5);
  }
  leg(ctx, b, 4, s);
  limb(ctx, [[2, top + b.h * 0.5], [10, top + b.h * 0.7]], 5); // the arm
  ctx.fillStyle = INK;
  ctx.fillRect(6, top + b.h * 0.7 - 4, b.gun + 2, 7);
  ctx.fillStyle = DARK;
  ctx.fillRect(7, top + b.h * 0.7 - 3, b.gun, 5);
  ctx.fillStyle = METAL;
  ctx.fillRect(7, top + b.h * 0.7 - 3, b.gun, 1.5);
}

/** The mech's outline from the side, for shadows. */
export function mechSideSilhouette(id: MechId): Path2D {
  const b = SIDE[id];
  const p = new Path2D();
  p.rect(-b.w / 2 - 1, -b.leg - b.h - 1, b.w + b.nose + 2, b.h + 2);
  p.rect(-12, -b.leg, 24, b.leg);
  return p;
}
