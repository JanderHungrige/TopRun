import { lerp, wrapAngle, type Vec } from '../../core/math';
import { lookKey, type AvatarLook } from '../../game/avatar-look';
import type { AvatarId } from '../../game/profiles';
import { playerPerson } from '../avatars/person';
import { BODY, solveLimb, tone, type PersonLook, type SidePose, type Tone } from '../people';
import { drawSideVector } from '../people/side-figure';
import { drawPixelated } from '../pixel/capture';
import { BIKE } from './motorbike-bike';

// Motorbike vs. Jet (doc 22): the rider — a seated people-kit side figure (doc 17) in a flight jacket and a
// helmet, rendered through the pixel pipeline (doc 20) and cached per pose frame. Joints are posed on the bike
// in its local frame, then turned with the wheelie, so the sprite itself is never rotated.

/** Kit units → screen px. */
export const RIDER_SCALE = 0.4;
const JACKET = { base: '#6e4a2c', light: '#93683f', shadow: '#4a301c', collar: '#d2b48a', knit: '#2e2620' };
const GLOVE = '#1f1c1e';

export interface RiderLook {
  /** Pixel-cache namespace: the preset id or `look:<key>` of a custom look (doc 29). */
  id: string;
  person: PersonLook;
  /** White shell with a stripe in the avatar's flight-suit colour. */
  helmet: Tone;
  stripe: string;
}

/** The avatar's skin and suit colour (doc 08 / 12 / 29) with riding gear. */
export function riderLook(face: AvatarId | AvatarLook): RiderLook {
  const base = playerPerson(face);
  const person: PersonLook = {
    ...base, torso: 'tshirt', top: tone(JACKET.base, JACKET.light, JACKET.shadow), legs: 'trousers', tied: false, tags: false,
    shoe: tone('#2a2522', '#4a403a', '#171412'), sole: '#141112',
  };
  const id = typeof face === 'string' ? face : `look:${lookKey(face)}`;
  return { id, person, helmet: tone('#ece8df', '#ffffff', '#a9a49c'), stripe: base.bottom.base };
}

export interface RiderPose {
  /** 0 … 1 each. */
  tuck: number;
  back: number;
  /** Bike nose-up angle (rad). */
  angle: number;
  /** Mishap sway, −1 … 1 (0 = none). */
  sway: number;
  /** Foot down on the road (standing still). */
  footDown: boolean;
}

const q = (v: number, step: number): number => Math.round(v / step) * step;
const rot = (p: Vec, a: number): Vec => ({ x: p.x * Math.cos(a) + p.y * Math.sin(a), y: -p.x * Math.sin(a) + p.y * Math.cos(a) });
const kit = (p: Vec, a: number): Vec => rot({ x: p.x / RIDER_SCALE, y: p.y / RIDER_SCALE }, a);

/** Joint positions in kit units around the bike origin. */
export function riderJoints(p: RiderPose): SidePose {
  const lean = lerp(lerp(0.55, 1.1, p.tuck), 0.35, p.back) + 0.14 * p.sway;
  const hipPx = { x: BIKE.hip.x - 8 * p.tuck - 2 * p.back + 1.5 * p.sway, y: BIKE.hip.y + p.tuck };
  const spine = BODY.spine * RIDER_SCALE;
  const shoulderPx = { x: hipPx.x + Math.sin(lean) * spine, y: hipPx.y - Math.cos(lean) * spine };
  const hip = kit(hipPx, p.angle);
  const shoulder = kit(shoulderPx, p.angle);
  const wrist = kit(BIKE.grip, p.angle);
  const ankle = kit(p.footDown ? { x: BIKE.peg.x + 12, y: -3 } : BIKE.peg, p.angle);
  const elbow = solveLimb(shoulder, wrist, BODY.upperArm, BODY.forearm, 1);
  const knee = solveLimb(hip, ankle, BODY.thigh, BODY.shin, 1);
  const hand = Math.atan2(wrist.y - elbow.y, wrist.x - elbow.x) + 0.25;
  const arm = { shoulder, elbow, wrist, hand };
  const leg = { hip, knee, ankle, foot: (p.footDown ? 0.05 : 0.2) - p.angle, toe: 0 };
  return { hip, shoulder, head: 0.08 - 0.15 * p.tuck - 0.6 * p.angle + 0.1 * p.sway, near: { arm, leg }, far: { arm, leg } };
}

function torsoFrame(p: SidePose): (x: number, y: number) => Vec {
  const tb = Math.atan2(p.hip.y - p.shoulder.y, p.hip.x - p.shoulder.x);
  const ts = Math.hypot(p.hip.x - p.shoulder.x, p.hip.y - p.shoulder.y) / BODY.spine;
  const c = Math.cos(tb);
  const s = Math.sin(tb);
  return (x, y) => ({ x: p.shoulder.x + x * ts * c - y * s, y: p.shoulder.y + x * ts * s + y * c });
}

function headFrame(p: SidePose): (x: number, y: number) => Vec {
  const T = torsoFrame(p);
  const tb = Math.atan2(p.hip.y - p.shoulder.y, p.hip.x - p.shoulder.x);
  const base = T(-15, -2);
  const up = tb + Math.PI;
  const nd = up + wrapAngle(p.head - Math.PI / 2 - up) / 2;
  const pivot = { x: base.x + Math.cos(nd) * BODY.neck, y: base.y + Math.sin(nd) * BODY.neck };
  const c = Math.cos(p.head);
  const s = Math.sin(p.head);
  return (x, y) => ({ x: pivot.x + x * c - y * s, y: pivot.y + x * s + y * c });
}

function poly(ctx: CanvasRenderingContext2D, f: (x: number, y: number) => Vec, pts: readonly number[], color: string): void {
  ctx.beginPath();
  for (let i = 0; i < pts.length; i += 2) {
    const v = f(pts[i] ?? 0, pts[i + 1] ?? 0);
    ctx.lineTo(v.x, v.y);
  }
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

function jacket(ctx: CanvasRenderingContext2D, p: SidePose): void {
  const T = torsoFrame(p);
  poly(ctx, T, [-20, -8, -10, -20, 8, -26, 30, -28, 56, -25, 82, -22, 100, -19, 102, 18, 84, 22, 58, 18, 32, 23, 8, 24, -10, 18, -20, 6], JACKET.base);
  poly(ctx, T, [-8, -18, 8, -24, 30, -26, 56, -23, 80, -20, 80, -12, 50, -14, 20, -14, 0, -10], JACKET.light);
  poly(ctx, T, [20, 16, 50, 14, 82, 17, 84, 22, 58, 18, 32, 23], JACKET.shadow);
  poly(ctx, T, [92, -20, 102, -19, 103, 18, 93, 20], JACKET.knit);
  poly(ctx, T, [-25, -11, -14, -18, -6, -6, -11, 10, -23, 8], JACKET.collar);
  const a = p.near.arm;
  ctx.lineCap = 'round';
  ctx.strokeStyle = JACKET.base;
  ctx.lineWidth = 23;
  ctx.beginPath();
  ctx.moveTo(a.shoulder.x, a.shoulder.y);
  ctx.lineTo(a.elbow.x, a.elbow.y);
  ctx.stroke();
  ctx.lineWidth = 19;
  ctx.beginPath();
  ctx.moveTo(a.elbow.x, a.elbow.y);
  const d = Math.hypot(a.wrist.x - a.elbow.x, a.wrist.y - a.elbow.y) || 1;
  const cuff = { x: a.wrist.x - ((a.wrist.x - a.elbow.x) / d) * 7, y: a.wrist.y - ((a.wrist.y - a.elbow.y) / d) * 7 };
  ctx.lineTo(cuff.x, cuff.y);
  ctx.stroke();
  ctx.strokeStyle = JACKET.knit;
  ctx.lineWidth = 15;
  ctx.beginPath();
  ctx.moveTo(cuff.x, cuff.y);
  ctx.lineTo(a.wrist.x, a.wrist.y);
  ctx.stroke();
  ctx.fillStyle = GLOVE;
  ctx.beginPath();
  ctx.ellipse(a.wrist.x + Math.cos(a.hand) * 13, a.wrist.y + Math.sin(a.hand) * 13, 14, 10, a.hand, 0, Math.PI * 2);
  ctx.fill();
}

function helmet(ctx: CanvasRenderingContext2D, p: SidePose, look: RiderLook): void {
  const H = headFrame(p);
  const h = look.helmet;
  const shell: number[] = [];
  for (let i = 0; i < 20; i++) {
    const a = (i / 20) * Math.PI * 2;
    shell.push(-1 + Math.cos(a) * 27, -17 + Math.sin(a) * 25);
  }
  poly(ctx, H, shell, h.base);
  poly(ctx, H, [-27, -10, -20, 2, -6, 8, 12, 8, 24, 2, 27, -8, 10, -6, -10, -4], h.shadow);
  poly(ctx, H, [-20, -32, -8, -40, 8, -41, 18, -35, 4, -37, -10, -35], h.light);
  poly(ctx, H, [-27, -22, -16, -38, -4, -42, -2, -36, -14, -32, -24, -15], look.stripe);
  poly(ctx, H, [4, -31, 22, -30, 29, -20, 28, -10, 6, -12], '#1e1a30');
  poly(ctx, H, [7, -29, 21, -28, 26, -21, 8, -22], '#ff9d52');
  poly(ctx, H, [7, -22, 26, -21, 27, -14, 8, -15], '#7a3a6a');
  poly(ctx, H, [12, -28, 17, -27, 14, -24, 10, -25], '#fff1d0');
}

/** Draws the rider for a bike whose local origin is at the current transform's origin (1 unit = 1 px). */
export function drawRider(ctx: CanvasRenderingContext2D, look: RiderLook, pose: RiderPose): void {
  const p: RiderPose = {
    tuck: q(pose.tuck, 0.25), back: q(pose.back, 0.25), angle: q(pose.angle, 0.05), sway: q(pose.sway, 0.5), footDown: pose.footDown,
  };
  const j = riderJoints(p);
  const pts = [j.hip, j.shoulder, j.near.arm.elbow, j.near.arm.wrist, j.near.leg.knee, j.near.leg.ankle];
  const x0 = Math.min(...pts.map((v) => v.x)) - 70;
  const y0 = Math.min(...pts.map((v) => v.y)) - 90;
  const bounds = { x: x0, y: y0, w: Math.max(...pts.map((v) => v.x)) + 70 - x0, h: Math.max(...pts.map((v) => v.y)) + 60 - y0 };
  const key = `MBR|${look.id}|${p.tuck}|${p.back}|${p.angle}|${p.sway}|${p.footDown ? 1 : 0}`;
  ctx.save();
  ctx.scale(RIDER_SCALE, RIDER_SCALE);
  drawPixelated(ctx, key, bounds, (g) => {
    drawSideVector(g, look.person, j, { expression: 'calm', strain: 0, blink: 0, t: 0 });
    jacket(g, j);
    helmet(g, j, look);
  });
  ctx.restore();
}
