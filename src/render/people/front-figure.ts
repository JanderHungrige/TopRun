import { lerp, type Vec } from '../../core/math';
import { BODY, PARTS } from './anatomy';
import { frontFoot, frontHand, LW, type Pass } from './extremities';
import { frontShorts, frontTorso, frontTorsoFill, frontTorsoLine, type FrontTorso } from './front-body';
import { frontEars, frontFace, frontHeadPath, frontHeadSkin, headMap, type HeadMap } from './front-head';
import { jawDrop } from './face-profile';
import { earShows, frontHair, frontTail } from './hair';
import { LINE } from './palette';
import { enterBone, litOf, outline, paintPart, type Part } from './paths';
import { solveLimb } from './side-figure';
import type { FaceState, PersonLook, Tone } from './types';

// People kit (doc 17): a standing three-quarter figure (spectators, crowds). Origin on the floor between
// the feet, height ≈ 328 units; light from the upper left.

export interface FrontPose {
  /** Body turn about the vertical axis (rad, + = towards +x), about −0.5 … 0.5. */
  turn: number;
  /** Extra head turn on top of the body's. */
  headTurn?: number;
  /** Arms raised: 0 = hanging … 1 = over the head; [screen-left, screen-right]. */
  raise: readonly [number, number];
  hands: 'open' | 'fist';
}

export interface FrontExtras {
  /** Drawn in the head frame after the hair (caps, shades). */
  head?: (ctx: CanvasRenderingContext2D, m: HeadMap) => void;
  /** Drawn in the torso frame after the clothes (whistle, towel). */
  chest?: (ctx: CanvasRenderingContext2D, t: FrontTorso) => void;
  /** Pixel-cache key for what `head` / `chest` draw (doc 20); needed when they are closures over changing state. */
  key?: string;
}

const HIP_Y = -(BODY.ankle + BODY.shin + BODY.thigh);
const LX = -0.45;
const LY = -0.89;
const ang = (a: Vec, b: Vec): number => Math.atan2(b.y - a.y, b.x - a.x);

/** Front-view limbs are a little slimmer than the side-view parts they reuse. */
const GIRTH = 0.86;

function seg(ctx: CanvasRenderingContext2D, pass: Pass, p: Part, a: Vec, b: Vec, len: number, tone: Tone, flip: boolean): void {
  const angle = ang(a, b);
  ctx.save();
  enterBone(ctx, a.x, a.y, angle, Math.hypot(b.x - a.x, b.y - a.y) / len, flip, GIRTH);
  if (pass === 'line') outline(ctx, p.body, LW);
  else paintPart(ctx, p, tone, litOf(angle, flip, LX, LY));
  ctx.restore();
}

function arm(ctx: CanvasRenderingContext2D, look: PersonLook, pose: FrontPose, side: 1 | -1): void {
  const k = Math.cos(pose.turn);
  const u = side < 0 ? pose.raise[0] : pose.raise[1];
  const sh = { x: side * 37 * k, y: -94 };
  const wx = lerp(43, 42, u) + Math.sin(Math.PI * u) * 36;
  const wr = { x: side * wx * k, y: lerp(14, -190, u) };
  const mid = { x: (sh.x + wr.x) / 2, y: (sh.y + wr.y) / 2 };
  const score = (e: Vec): number => (e.x - mid.x) * side + (e.y - mid.y) * 0.8; // elbows out and down
  const a = solveLimb(sh, wr, BODY.upperArm, BODY.forearm, 1);
  const b = solveLimb(sh, wr, BODY.upperArm, BODY.forearm, -1);
  const el = score(a) >= score(b) ? a : b;
  const flip = side < 0;
  for (const pass of ['line', 'fill'] as const) {
    ctx.save();
    enterBone(ctx, wr.x, wr.y, ang(el, wr), 1, flip);
    frontHand(ctx, pass, look.skin, pose.hands === 'open');
    ctx.restore();
    seg(ctx, pass, PARTS.forearm(), el, wr, BODY.forearm, look.skin, flip);
    seg(ctx, pass, PARTS.upperArm(), sh, el, BODY.upperArm, look.skin, flip);
    if (look.torso === 'tshirt' && pass === 'fill') {
      seg(ctx, 'fill', PARTS.sleeve(), sh, el, BODY.upperArm, look.top, flip);
      seg(ctx, 'line', PARTS.sleeve(), sh, el, BODY.upperArm, look.top, flip);
    }
  }
}

function legs(ctx: CanvasRenderingContext2D, look: PersonLook, pose: FrontPose): void {
  const k = Math.cos(pose.turn);
  const shift = 10 * Math.sin(pose.turn);
  for (const pass of ['line', 'fill'] as const) {
    for (const side of [-1, 1] as const) {
      const hip = { x: side * 17 * k + shift, y: 0 };
      const knee = { x: side * 18 * k + shift, y: BODY.thigh };
      const ankle = { x: side * 19 * k + shift, y: BODY.thigh + BODY.shin };
      const flip = side < 0;
      ctx.save();
      ctx.translate(ankle.x, ankle.y);
      frontFoot(ctx, pass, look, side);
      ctx.restore();
      const trousers = look.legs === 'trousers';
      seg(ctx, pass, trousers ? PARTS.trouserShin() : PARTS.shin(), knee, ankle, BODY.shin, trousers ? look.bottom : look.skin, flip);
      seg(ctx, pass, trousers ? PARTS.trouserThigh() : PARTS.thigh(), hip, knee, BODY.thigh, trousers ? look.bottom : look.skin, flip);
    }
  }
}

function neck(ctx: CanvasRenderingContext2D, look: PersonLook, shift: number, pass: Pass): void {
  ctx.beginPath();
  ctx.moveTo(-9 + shift * 0.6, -104);
  ctx.quadraticCurveTo(-7 + shift, -112, -7.4 + shift, -121);
  ctx.lineTo(7.4 + shift, -121);
  ctx.quadraticCurveTo(7 + shift, -112, 9 + shift * 0.6, -104);
  ctx.closePath();
  if (pass === 'line') {
    ctx.lineWidth = LW;
    ctx.strokeStyle = LINE;
    ctx.stroke();
    return;
  }
  ctx.fillStyle = look.skin.base;
  ctx.fill();
  ctx.save();
  ctx.clip();
  ctx.fillStyle = look.skin.shadow;
  ctx.globalAlpha = 0.6;
  ctx.fillRect(-10 + shift, -121, 22, 5);
  ctx.fillRect(3 + shift, -121, 8, 20);
  ctx.restore();
}

function head(ctx: CanvasRenderingContext2D, look: PersonLook, pose: FrontPose, face: FaceState, extras: FrontExtras | undefined, shift: number): void {
  const turn = pose.turn + (pose.headTurn ?? 0);
  const m = headMap(turn);
  const path = frontHeadPath(m, jawDrop(face.expression));
  ctx.save();
  ctx.translate(shift * 0.5, -121);
  if (turn < 0) ctx.scale(-1, 1);
  frontTail(ctx, look.hair, m, face.t);
  ctx.lineWidth = LW + 0.2;
  ctx.strokeStyle = LINE;
  ctx.stroke(path);
  frontHeadSkin(ctx, look, m, path, turn < 0 ? -1 : 1);
  frontFace(ctx, look, m, face);
  const ears = earShows(look.hair.style);
  frontHair(ctx, look.hair, look.skin, m);
  if (ears) frontEars(ctx, look, m);
  extras?.head?.(ctx, m);
  ctx.restore();
}

/** Draws a standing three-quarter person in the current transform as vector art (pixel.ts pixelates it). */
export function drawFrontVector(ctx: CanvasRenderingContext2D, look: PersonLook, pose: FrontPose, face: FaceState, extras?: FrontExtras): void {
  const ft = frontTorso(pose.turn);
  const shift = 7 * Math.sin(pose.turn);
  const far: 1 | -1 = pose.turn >= 0 ? 1 : -1;
  ctx.save();
  ctx.translate(0, HIP_Y);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  arm(ctx, look, pose, far);
  legs(ctx, look, pose);
  frontTorsoLine(ctx, ft, LW);
  neck(ctx, look, shift, 'line');
  frontTorsoFill(ctx, ft, look);
  frontShorts(ctx, ft, look, 'line');
  frontShorts(ctx, ft, look, 'fill');
  neck(ctx, look, shift, 'fill');
  extras?.chest?.(ctx, ft);
  head(ctx, look, pose, face, extras, shift);
  arm(ctx, look, pose, far === 1 ? -1 : 1);
  ctx.restore();
}
