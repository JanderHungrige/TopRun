import { clamp, lerp, type Vec } from '../../core/math';
import { BALL, BODY, drawSideFigure, solveLimb, type Expression, type PersonLook, type SideLimbs } from '../people';
import { circle, ellipse } from '../shapes';

// Push-up figure (doc 12): maps the push-up pose onto a people-kit side figure (doc 17). Drawn facing
// right with the ankle pivot at the origin's left and the floor at y = 0; `facing = -1` mirrors it.

export type PilotLook = PersonLook;

export interface PilotPose {
  /** 0 = arms straight … 1 = chest down. */
  depth: number;
  /** 0 … 1 = flat on the mat (burnout, lost the duel). */
  collapse: number;
  /** 0 … 1: effort → strain face, flush, sweat (low stamina). */
  strain: number;
  t: number;
  /** Won the duel: grins. */
  grin?: boolean;
}

const LB = BODY.shin + BODY.thigh + BODY.spine; // ankle → shoulder, 255
const ANKLE_UP = -31;
const ANKLE_FLAT = -12;
const UP_H = 112;
const DOWN_H = 40;
const FLAT_H = 22;
const HAND_X = 250;

/** Foot angle that puts the sole under the ball of the foot on the floor, the heel up. */
function footAngle(look: PersonLook, ankleY: number): number {
  const bx = BALL.x;
  const by = look.feet === 'sneakers' ? BALL.sole : 9.5;
  const r = Math.hypot(bx, by);
  return Math.PI - Math.asin(clamp(-ankleY / r, -1, 1)) - Math.atan2(by, bx);
}

interface Rig { theta: number; near: SideLimbs; far: SideLimbs; hip: Vec; shoulder: Vec; at: (d: number) => Vec }

function rig(look: PersonLook, p: PilotPose): Rig {
  const ankleY = lerp(ANKLE_UP, ANKLE_FLAT, p.collapse);
  const h = lerp(lerp(UP_H, DOWN_H, p.depth), FLAT_H, p.collapse);
  const theta = Math.asin(clamp((h + ankleY) / LB, -1, 1));
  const at = (d: number, dx = 0, dy = 0): Vec => ({ x: Math.cos(theta) * d + dx, y: ankleY - Math.sin(theta) * d + dy });
  const foot = lerp(footAngle(look, ANKLE_UP), 2.85, p.collapse);
  const toe = lerp(-foot * 0.85, 0, p.collapse);
  const upper = BODY.upperArm * lerp(1, 0.7, Math.max(p.depth, p.collapse)); // elbows flare: the side view foreshortens
  const limbs = (dx: number, dy: number, sdx: number, sdy: number, wdx: number): SideLimbs => {
    const shoulder = at(LB, sdx, sdy);
    const wrist = { x: HAND_X + 30 * p.collapse + wdx, y: -7 };
    return {
      arm: { shoulder, elbow: solveLimb(shoulder, wrist, upper, BODY.forearm, -1), wrist, hand: 0 },
      leg: { hip: at(BODY.shin + BODY.thigh, dx, dy), knee: at(BODY.shin, dx, dy), ankle: at(0, dx, dy), foot, toe },
    };
  };
  return { theta, near: limbs(0, 0, 0, 0, 0), far: limbs(5, -3, -3, -3, 10), hip: at(BODY.shin + BODY.thigh), shoulder: at(LB), at };
}

function expression(p: PilotPose): Expression {
  if (p.grin) return 'grin';
  if (p.collapse > 0.5) return 'out';
  if (p.strain > 0.62) return 'strain';
  if (p.strain > 0.25 || p.depth > 0.45) return 'effort';
  return 'calm';
}

function blinkAt(t: number): number {
  const ph = t % 3.7;
  return ph < 0.14 ? 1 - Math.abs(ph / 0.07 - 1) : 0;
}

function dizzy(ctx: CanvasRenderingContext2D, at: Vec, amount: number, t: number): void {
  for (let i = 0; i < 3; i++) {
    const a = t * 4 + (i * Math.PI * 2) / 3;
    const x = at.x + Math.cos(a) * 26;
    const y = at.y - 48 + Math.sin(a) * 7;
    ctx.globalAlpha = amount;
    circle(ctx, x, y, 3.2, '#ffd84a');
    circle(ctx, x, y, 1.4, '#fff6c8');
    ctx.globalAlpha = 1;
  }
}

/** Draws one pilot doing push-ups; (x, floorY) is the ankle pivot on the floor. */
export function drawPushupPilot(ctx: CanvasRenderingContext2D, look: PilotLook, p: PilotPose, x: number, floorY: number, facing: 1 | -1, scale = 1): void {
  const k = rig(look, p);
  ctx.save();
  ctx.translate(x, floorY);
  ctx.scale(facing * scale, scale);
  ellipse(ctx, 140, 2, 150, 5, 'rgba(0,0,0,0.22)');
  const look01 = lerp(0.55, 0.95, p.collapse); // collapsed: chin on the mat, face to the camera side
  drawSideFigure(ctx, look, { hip: k.hip, shoulder: k.shoulder, head: Math.PI / 2 - k.theta - look01, near: k.near, far: k.far }, {
    expression: expression(p), strain: p.strain, blink: blinkAt(p.t), t: p.t,
  });
  if (p.collapse > 0.05 && !p.grin) dizzy(ctx, k.at(LB + 34), p.collapse, p.t);
  ctx.restore();
}
