import type { MechId } from '../../data/types';
import { defaultPaint, type Paint } from '../../game/mech-paint';
import { camoFill } from './mech-camo';

// The mechs from above (doc 80), front up (−y), drawn around the hip (0, 0) at about a helicopter's size: two legs that
// stride in turn under the hip, the torso in the mech's camo (doc 87) with the cockpit glass at the front, an
// autocannon arm on each side, shoulder pods on the heavier ones. `stride` is the gait's phase (one step per whole
// number); `leap` 0–1 how high the Strider's jump jets have lifted it.

export interface MechTopOpts {
  t: number;
  stride: number;
  leap: number;
  paint: Paint | null;
}

interface MechBuild {
  /** Torso half-width, front and back (y). */
  w: number;
  front: number;
  back: number;
  /** Arm x, arm length forward, the guns' barrels. */
  armX: number;
  reach: number;
  barrels: 1 | 2;
  legX: number;
  foot: number;
  pods: boolean;
  head: 'round' | 'box' | 'wedge';
  hump: boolean;
}

const BUILD: Readonly<Record<MechId, MechBuild>> = {
  strider: { w: 9, front: -12, back: 7, armX: 13, reach: 20, barrels: 1, legX: 8, foot: 6, pods: false, head: 'round', hump: false },
  ranger: { w: 11, front: -12, back: 9, armX: 15, reach: 20, barrels: 2, legX: 9, foot: 7, pods: true, head: 'box', hump: false },
  hornet: { w: 8, front: -15, back: 6, armX: 12, reach: 23, barrels: 1, legX: 7, foot: 5, pods: false, head: 'wedge', hump: false },
  titan: { w: 14, front: -12, back: 12, armX: 19, reach: 19, barrels: 2, legX: 11, foot: 8, pods: true, head: 'box', hump: true },
};

const INK = '#141a0e';
/** Mechs are drawn a little bigger than the outline numbers below: big machines on foot. */
const SIZE = 1.3;
const METAL = '#5a6048';
const DARK = '#2c3024';

function box(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, fill: string | CanvasPattern): void {
  ctx.fillStyle = INK;
  ctx.fillRect(x - 1, y - 1, w + 2, h + 2);
  ctx.fillStyle = fill;
  ctx.fillRect(x, y, w, h);
}

/** The torso's outline: tapered at the front for the Hornet, square for the others. */
function torsoPath(b: MechBuild): Path2D {
  const p = new Path2D();
  const nose = b.head === 'wedge' ? b.w * 0.4 : b.w * 0.8;
  p.moveTo(-nose, b.front);
  p.lineTo(nose, b.front);
  p.lineTo(b.w, b.front + 5);
  p.lineTo(b.w, b.back);
  p.lineTo(-b.w, b.back);
  p.lineTo(-b.w, b.front + 5);
  p.closePath();
  return p;
}

/** Both legs: the stepping foot swings forward, the other pushes back; thighs from the hip to the feet. */
function legs(ctx: CanvasRenderingContext2D, b: MechBuild, stride: number): void {
  const swing = Math.sin(stride * Math.PI);
  for (const side of [-1, 1] as const) {
    const ahead = (side < 0 ? swing : -swing) * 7;
    const fx = side * b.legX;
    const fy = 6 - ahead;
    ctx.strokeStyle = INK;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(side * (b.legX - 2), 3);
    ctx.lineTo(fx, fy);
    ctx.stroke();
    ctx.strokeStyle = METAL;
    ctx.lineWidth = 3;
    ctx.stroke();
    box(ctx, fx - b.foot / 2, fy - b.foot * 0.8, b.foot, b.foot * 1.6, DARK);
    ctx.fillStyle = METAL;
    ctx.fillRect(fx - b.foot / 2, fy - b.foot * 0.8, b.foot, 2);
  }
}

function arms(ctx: CanvasRenderingContext2D, b: MechBuild, camo: string | CanvasPattern): void {
  for (const side of [-1, 1] as const) {
    const x = side * b.armX;
    box(ctx, x - 3.5, -6, 7, 12, camo);
    for (let k = 0; k < b.barrels; k++) {
      const bx = x + (b.barrels === 2 ? (k ? 1.5 : -2.5) : -1);
      box(ctx, bx, -b.reach, 2, b.reach - 6, DARK);
    }
    ctx.fillStyle = METAL;
    ctx.fillRect(x - 3.5, -6, 7, 2);
  }
}

function pods(ctx: CanvasRenderingContext2D, b: MechBuild, camo: string | CanvasPattern): void {
  for (const side of [-1, 1] as const) {
    const x = side * (b.w - 1) - (side > 0 ? 6 : 0);
    box(ctx, x, b.front + 2, 6, 7, camo);
    ctx.fillStyle = '#c84a2a';
    for (let k = 0; k < 2; k++) ctx.fillRect(x + 1 + k * 3, b.front + 3, 1.5, 1.5);
  }
}

function cockpit(ctx: CanvasRenderingContext2D, b: MechBuild, t: number): void {
  ctx.fillStyle = INK;
  if (b.head === 'round') {
    ctx.beginPath();
    ctx.arc(0, b.front + 4, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1e3a44';
    ctx.beginPath();
    ctx.arc(0, b.front + 4, 3.8, 0, Math.PI * 2);
    ctx.fill();
  } else {
    const w = b.head === 'wedge' ? 3 : 5;
    ctx.fillRect(-w - 1, b.front - 1, w * 2 + 2, 7);
    ctx.fillStyle = '#1e3a44';
    ctx.fillRect(-w, b.front, w * 2, 5);
  }
  ctx.fillStyle = `rgba(160,255,200,${(0.5 + Math.sin(t * 3) * 0.25).toFixed(2)})`;
  ctx.fillRect(-2, b.front + 1, 2, 1.5);
}

/** A mech from above, the hip at (0, 0). */
export function drawMechTop(ctx: CanvasRenderingContext2D, id: MechId, o: MechTopOpts): void {
  const b = BUILD[id];
  const camo = camoFill(ctx, o.paint ?? defaultPaint(id), 1.5);
  const lift = (1 + o.leap * 0.25) * SIZE;
  ctx.save();
  ctx.scale(lift, lift);
  if (o.leap < 0.05) legs(ctx, b, o.stride);
  else legs(ctx, b, 0.5);
  ctx.translate(Math.sin(o.stride * Math.PI) * 0.8, 0); // the body sways over the planted foot
  arms(ctx, b, camo);
  const torso = torsoPath(b);
  ctx.fillStyle = INK;
  ctx.lineWidth = 2;
  ctx.strokeStyle = INK;
  ctx.stroke(torso);
  ctx.fillStyle = camo;
  ctx.fill(torso);
  ctx.fillStyle = 'rgba(255,255,240,0.12)';
  ctx.fillRect(-b.w + 1, b.front + 5, b.w * 2 - 2, 2);
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.fillRect(-b.w + 1, b.back - 3, b.w * 2 - 2, 3);
  if (b.hump) box(ctx, -6, b.back - 8, 12, 10, DARK);
  if (b.pods) pods(ctx, b, camo);
  cockpit(ctx, b, o.t);
  ctx.restore();
}

/** The mech's outline for shadows, flashes and the camo field's shimmer. */
export function mechTopSilhouette(id: MechId): Path2D {
  const b = BUILD[id];
  const p = new Path2D();
  p.addPath(torsoPath(b));
  for (const side of [-1, 1]) {
    p.rect(side * b.armX - 3.5, -b.reach, 7, b.reach + 6);
    p.rect(side * b.legX - b.foot / 2, 1, b.foot, b.foot * 1.6);
  }
  const scaled = new Path2D();
  scaled.addPath(p, new DOMMatrix().scaleSelf(SIZE, SIZE));
  return scaled;
}
