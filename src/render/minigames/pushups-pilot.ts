import { clamp, lerp, type Vec } from '../../core/math';
import { circle, ellipse } from '../shapes';
import { drawHead, type HeadLook } from './pushups-head';

// Side-view push-up figure (doc 12): T-shirt, flight-suit trousers, sneakers. Drawn facing right with
// the ankle pivot at the origin's left and the floor at y = 0; `facing = -1` mirrors it.

export interface PilotLook extends HeadLook {
  shirt: string;
  shirtDark: string;
  trousers: string;
  trousersDark: string;
  shoe: string;
  sole: string;
}

export interface PilotPose {
  /** 0 = arms straight … 1 = chest down. */
  depth: number;
  /** 0 … 1 = flat on the mat (burnout, lost the duel). */
  collapse: number;
  /** 0 … 1: red face, gritted teeth, sweat (low stamina). */
  strain: number;
  t: number;
}

const LINE = 'rgba(28,16,10,0.6)';
const LB = 255; // ankle → shoulder
const ANKLE_Y = -30;
const UP_H = 106;
const DOWN_H = 40;
const FLAT_H = 22;
const HAND_X = 250;
const FORE = 54;

interface Skeleton { theta: number; shoulder: Vec; wrist: Vec; upper: number }

function skeleton(p: PilotPose): Skeleton {
  const h = lerp(lerp(UP_H, DOWN_H, p.depth), FLAT_H, p.collapse);
  const theta = Math.asin(clamp((h + ANKLE_Y) / LB, -1, 1));
  return {
    theta,
    shoulder: { x: LB * Math.cos(theta), y: -h },
    wrist: { x: HAND_X + 30 * p.collapse, y: -6 },
    upper: lerp(54, 40, Math.max(p.depth, p.collapse)), // elbows flare out: the side view foreshortens the upper arm
  };
}

/** Two-bone IK, elbow bending back towards the feet. */
function elbowFor(s: Vec, w: Vec, a1: number, a2: number): Vec {
  const d = clamp(Math.hypot(s.x - w.x, s.y - w.y), Math.abs(a1 - a2) + 0.01, a1 + a2 - 0.01);
  const base = Math.atan2(s.y - w.y, s.x - w.x);
  const beta = Math.acos(clamp((a2 * a2 + d * d - a1 * a1) / (2 * a2 * d), -1, 1));
  return { x: w.x + Math.cos(base - beta) * a2, y: w.y + Math.sin(base - beta) * a2 };
}

function limb(ctx: CanvasRenderingContext2D, pts: readonly Vec[], w: number, color: string): void {
  ctx.beginPath();
  pts.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
  ctx.strokeStyle = LINE;
  ctx.lineWidth = w + 2;
  ctx.stroke();
  ctx.strokeStyle = color;
  ctx.lineWidth = w;
  ctx.stroke();
}

function arm(ctx: CanvasRenderingContext2D, look: PilotLook, k: Skeleton, near: boolean): void {
  const dx = near ? 0 : 9;
  const s = { x: k.shoulder.x - (near ? 0 : 3), y: k.shoulder.y - (near ? 0 : 2) };
  const w = { x: k.wrist.x + dx, y: k.wrist.y };
  const e = elbowFor(s, w, k.upper, FORE);
  const skin = near ? look.skin : look.skinDark;
  limb(ctx, [s, e, w], near ? 12 : 11, skin);
  const sleeve = { x: lerp(s.x, e.x, 0.42), y: lerp(s.y, e.y, 0.42) };
  limb(ctx, [s, sleeve], 16, near ? look.shirt : look.shirtDark);
  ctx.beginPath();
  ctx.ellipse(w.x + 7, -3.4, 10, 3.6, 0, 0, Math.PI * 2);
  ctx.fillStyle = skin;
  ctx.fill();
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 1;
  ctx.stroke();
}

/** Sneaker standing on its toes, heel up: upper, thick sole along the back, laces on the instep. */
function shoe(ctx: CanvasRenderingContext2D, look: PilotLook, dx: number, far: boolean): void {
  ctx.save();
  ctx.translate(dx, 0);
  ctx.beginPath();
  ctx.moveTo(-11, -42);
  ctx.lineTo(5, -37);
  ctx.quadraticCurveTo(15, -16, 13, -2);
  ctx.lineTo(2, 0);
  ctx.quadraticCurveTo(-9, -16, -13, -38);
  ctx.closePath();
  ctx.fillStyle = far ? look.trousersDark : look.shoe;
  ctx.fill();
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(3, 1);
  ctx.quadraticCurveTo(-10, -16, -14, -39);
  ctx.strokeStyle = far ? 'rgba(0,0,0,0.35)' : look.sole;
  ctx.lineWidth = 5;
  ctx.stroke();
  if (!far) {
    ctx.beginPath();
    for (const [x, y] of [[7, -31], [10, -25], [12, -19]] as const) {
      ctx.moveTo(x - 4, y - 1);
      ctx.lineTo(x + 1, y + 1);
    }
    ctx.strokeStyle = look.sole;
    ctx.lineWidth = 1.6;
    ctx.stroke();
  }
  ctx.restore();
}

/** Legs and torso along +x in the body frame (ankle at 0, shoulder at LB; -y = back, +y = belly). */
function trunk(ctx: CanvasRenderingContext2D, look: PilotLook, strain: number): void {
  ctx.beginPath();
  ctx.moveTo(-2, -8);
  ctx.quadraticCurveTo(60, -11, 112, -15);
  ctx.quadraticCurveTo(125, -20, 136, -14);
  ctx.lineTo(136, 13);
  ctx.quadraticCurveTo(70, 13, -2, 8);
  ctx.closePath();
  ctx.fillStyle = look.trousers;
  ctx.fill();
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 1.2;
  ctx.stroke();
  ctx.fillStyle = look.trousersDark;
  ctx.fillRect(78, -3, 24, 9); // leg pocket
  ctx.beginPath();
  ctx.moveTo(56, 10);
  ctx.quadraticCurveTo(62, 4, 70, 11);
  ctx.strokeStyle = look.trousersDark;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  const g = ctx.createLinearGradient(0, -18, 0, 19);
  g.addColorStop(0, look.shirt);
  g.addColorStop(0.55, look.shirt);
  g.addColorStop(1, look.shirtDark);
  ctx.beginPath();
  ctx.moveTo(124, -15);
  ctx.quadraticCurveTo(190, -17, 238, -18);
  ctx.quadraticCurveTo(262, -17, 263, 0);
  ctx.quadraticCurveTo(262, 17, 238, 19);
  ctx.quadraticCurveTo(190, 19, 124, 14);
  ctx.closePath();
  ctx.fillStyle = g;
  ctx.fill();
  ctx.stroke();
  if (strain > 0.3) ellipse(ctx, 205, -9, 26, 6, `rgba(0,0,0,${(strain - 0.3) * 0.25})`); // sweat patch
  ctx.beginPath();
  ctx.moveTo(258, -5);
  ctx.lineTo(276, -5);
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 11;
  ctx.stroke();
  ctx.strokeStyle = look.skin;
  ctx.lineWidth = 9;
  ctx.stroke();
}

const toWorld = (theta: number, x: number, y: number): Vec => ({
  x: x * Math.cos(theta) + y * Math.sin(theta),
  y: ANKLE_Y - x * Math.sin(theta) + y * Math.cos(theta),
});

function dizzy(ctx: CanvasRenderingContext2D, at: Vec, amount: number, t: number): void {
  for (let i = 0; i < 3; i++) {
    const a = t * 4 + (i * Math.PI * 2) / 3;
    const x = at.x + Math.cos(a) * 26;
    const y = at.y - 30 + Math.sin(a) * 7;
    ctx.globalAlpha = amount;
    circle(ctx, x, y, 3.2, '#ffd84a');
    circle(ctx, x, y, 1.4, '#fff6c8');
    ctx.globalAlpha = 1;
  }
}

/** Draws one pilot doing push-ups; (x, floorY) is the ankle pivot on the floor. */
export function drawPushupPilot(ctx: CanvasRenderingContext2D, look: PilotLook, p: PilotPose, x: number, floorY: number, facing: 1 | -1, scale = 1): void {
  const k = skeleton(p);
  ctx.save();
  ctx.translate(x, floorY);
  ctx.scale(facing * scale, scale);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ellipse(ctx, 140, 2, 150, 5, 'rgba(0,0,0,0.22)');
  arm(ctx, look, k, false);
  shoe(ctx, look, 6, true);
  shoe(ctx, look, 0, false);
  ctx.save();
  ctx.translate(0, ANKLE_Y);
  ctx.rotate(-k.theta);
  trunk(ctx, look, p.strain);
  ctx.translate(LB + 30, -9);
  const look01 = lerp(0.55, -0.25, p.collapse);
  const headRot = Math.PI / 2 - look01;
  ctx.rotate(headRot);
  drawHead(ctx, look, { strain: p.strain, out: p.collapse, t: p.t, down: -k.theta + headRot });
  ctx.restore();
  arm(ctx, look, k, true);
  if (p.collapse > 0.05) dizzy(ctx, toWorld(k.theta, LB + 30, -9), p.collapse, p.t);
  ctx.restore();
}
