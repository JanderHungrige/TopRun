import { clamp, wrapAngle, type Vec } from '../../core/math';
import { BODY, NECK_BASE, PARTS } from './anatomy';
import { LW, sideFoot, sideHand, type Pass } from './extremities';
import { jawDrop, profileFace } from './face-profile';
import { dogTags, shortsStripe, tiedSleeves, torsoGarments } from './garments';
import { earShows, profileHair, profileTail } from './hair';
import { ear, headLine, headPathFor, headSkin, neck, type NeckPoints } from './head-profile';
import { enterBone, lazy, litOf, outline, paintPart, shapes, taper, type Part } from './paths';
import { longSleeved, type FaceState, type PersonLook, type Tone } from './types';

// People kit (doc 17): a side-view figure facing +x from world joint positions (world down = +y; mirror
// with ctx.scale(-1, 1) first). Order: far arm, far leg, near leg, torso + neck + head, near arm.

export interface ArmJoints { shoulder: Vec; elbow: Vec; wrist: Vec; /** Hand angle (wrist → fingers). */ hand: number }
export interface LegJoints { hip: Vec; knee: Vec; ankle: Vec; /** Foot angle along the sole. */ foot: number; /** Toe bend at the ball (rad). */ toe: number }
export interface SideLimbs { arm: ArmJoints; leg: LegJoints }

export interface SidePose {
  /** Torso: hip joint → shoulder joint (the torso stretches to fit). */
  hip: Vec;
  shoulder: Vec;
  /** Head rotation, 0 = upright, face towards +x. */
  head: number;
  near: SideLimbs;
  far: SideLimbs;
}

const ang = (a: Vec, b: Vec): number => Math.atan2(b.y - a.y, b.x - a.x);
const dist = (a: Vec, b: Vec): number => Math.hypot(b.x - a.x, b.y - a.y);

/** Two-bone IK: the middle joint for a root, an end and the two bone lengths; `bend` picks the side. */
export function solveLimb(root: Vec, end: Vec, upper: number, lower: number, bend: 1 | -1): Vec {
  const d = clamp(dist(root, end), Math.abs(upper - lower) + 0.01, upper + lower - 0.01);
  const base = ang(end, root);
  const beta = Math.acos(clamp((lower * lower + d * d - upper * upper) / (2 * lower * d), -1, 1));
  return { x: end.x + Math.cos(base + bend * beta) * lower, y: end.y + Math.sin(base + bend * beta) * lower };
}

/** One bone: a part from `a` towards `b`, stretched to the joint distance. */
function bone(ctx: CanvasRenderingContext2D, pass: Pass, p: Part, a: Vec, b: Vec, len: number, tone: Tone, far: boolean): void {
  const angle = ang(a, b);
  ctx.save();
  enterBone(ctx, a.x, a.y, angle, dist(a, b) / len);
  if (pass === 'fill') paintPart(ctx, p, tone, litOf(angle, false), far);
  else outline(ctx, p.body, LW);
  ctx.restore();
}

function arm(ctx: CanvasRenderingContext2D, pass: Pass, look: PersonLook, a: ArmJoints, far: boolean): void {
  ctx.save();
  enterBone(ctx, a.wrist.x, a.wrist.y, a.hand);
  sideHand(ctx, pass, look.skin, litOf(a.hand, false), far);
  ctx.restore();
  const cover = longSleeved(look.torso) ? look.top : look.skin;
  bone(ctx, pass, PARTS.forearm(), a.elbow, a.wrist, BODY.forearm, cover, far);
  bone(ctx, pass, PARTS.upperArm(), a.shoulder, a.elbow, BODY.upperArm, cover, far);
  if (look.torso === 'tshirt') garmentBone(ctx, pass, PARTS.sleeve(), a.shoulder, a.elbow, BODY.upperArm, look.top, far);
}

/** Clothing over a limb: filled, an optional detail clipped to it, then outlined on top (hem and sides). */
function garmentBone(ctx: CanvasRenderingContext2D, pass: Pass, p: Part, a: Vec, b: Vec, len: number, tone: Tone, far: boolean, detail?: () => void): void {
  if (pass === 'line') return;
  bone(ctx, pass, p, a, b, len, tone, far);
  if (detail && !far) {
    ctx.save();
    enterBone(ctx, a.x, a.y, ang(a, b), dist(a, b) / len);
    ctx.clip(p.body);
    detail();
    ctx.restore();
  }
  bone(ctx, 'line', p, a, b, len, tone, far);
}

function leg(ctx: CanvasRenderingContext2D, pass: Pass, look: PersonLook, l: LegJoints, far: boolean): void {
  ctx.save();
  enterBone(ctx, l.ankle.x, l.ankle.y, l.foot);
  sideFoot(ctx, pass, look, litOf(l.foot, false), far, l.toe);
  ctx.restore();
  if (look.legs === 'trousers') {
    bone(ctx, pass, PARTS.trouserShin(), l.knee, l.ankle, BODY.shin, look.bottom, far);
    bone(ctx, pass, PARTS.trouserThigh(), l.hip, l.knee, BODY.thigh, look.bottom, far);
    return;
  }
  bone(ctx, pass, PARTS.shin(), l.knee, l.ankle, BODY.shin, look.skin, far);
  bone(ctx, pass, PARTS.thigh(), l.hip, l.knee, BODY.thigh, look.skin, far);
  garmentBone(ctx, pass, PARTS.shortsLeg(), l.hip, l.knee, BODY.thigh, look.bottom, far, () => shortsStripe(ctx, look.trim));
}

const SHEEN = lazy(() => shapes([taper([8, 17, 20, 19.5, 30, 19], 1.6), taper([40, 15.5, 50, 13.6], 1.3), taper([82, 19, 92, 22.5], 1.6), taper([4, -21, 14, -23.5], 1.4)]));

interface Frames { tb: number; ts: number; pivot: Vec; head: number; neck: NeckPoints }

function frames(p: SidePose): Frames {
  const tb = ang(p.shoulder, p.hip);
  const ts = dist(p.shoulder, p.hip) / BODY.spine;
  const c = Math.cos(tb);
  const s = Math.sin(tb);
  const T = (x: number, y: number): Vec => ({ x: p.shoulder.x + x * ts * c - y * s, y: p.shoulder.y + x * ts * s + y * c });
  const base = T(NECK_BASE.x, NECK_BASE.y);
  const up = tb + Math.PI;
  const nd = up + wrapAngle(p.head - Math.PI / 2 - up) / 2;
  const pivot = { x: base.x + Math.cos(nd) * BODY.neck, y: base.y + Math.sin(nd) * BODY.neck };
  const hc = Math.cos(p.head);
  const hs = Math.sin(p.head);
  const H = (x: number, y: number): Vec => ({ x: pivot.x + x * hc - y * hs, y: pivot.y + x * hs + y * hc });
  return { tb, ts, pivot, head: p.head, neck: { back: T(-19, 5), front: T(-18, -8), nape: H(-11, -1), throat: H(4, 8.1), mastoid: H(-8, -9) } };
}

function torsoFill(ctx: CanvasRenderingContext2D, look: PersonLook, f: Frames, face: FaceState): void {
  const lit = litOf(f.tb, false);
  paintPart(ctx, PARTS.torso(), look.skin, lit);
  if (face.strain > 0.3) {
    ctx.fillStyle = '#ffffff';
    ctx.globalAlpha = Math.min(0.7, (face.strain - 0.3) * 1.1);
    ctx.fill(SHEEN());
    ctx.globalAlpha = 1;
  }
}

function clothes(ctx: CanvasRenderingContext2D, look: PersonLook, f: Frames, t: number): void {
  const gx = Math.sin(f.tb);
  const gy = Math.cos(f.tb);
  torsoGarments(ctx, look, litOf(f.tb, false));
  if (look.legs === 'trousers' && look.tied) tiedSleeves(ctx, look.bottom, gx, gy, Math.sin(t * 2.2) * 2);
  if (look.torso === 'shirtless' && look.tags) dogTags(ctx, gx, gy);
}

function head(ctx: CanvasRenderingContext2D, look: PersonLook, f: Frames, face: FaceState, path: Path2D): void {
  const lx = -Math.sin(f.head);
  const ly = -Math.cos(f.head);
  headSkin(ctx, path, look.skin, lx, ly);
  profileFace(ctx, look, face, -lx, -ly);
  profileHair(ctx, look.hair, look.skin);
  if (earShows(look.hair.style)) ear(ctx, look.skin);
}

function inTorso(ctx: CanvasRenderingContext2D, p: SidePose, f: Frames, draw: () => void): void {
  ctx.save();
  enterBone(ctx, p.shoulder.x, p.shoulder.y, f.tb, f.ts);
  draw();
  ctx.restore();
}

function inHead(ctx: CanvasRenderingContext2D, f: Frames, draw: () => void): void {
  ctx.save();
  enterBone(ctx, f.pivot.x, f.pivot.y, f.head);
  draw();
  ctx.restore();
}

/** Torso, neck and head: outlines first so the seams between them disappear, then the fills. */
function core(ctx: CanvasRenderingContext2D, look: PersonLook, p: SidePose, face: FaceState): void {
  const f = frames(p);
  const path = headPathFor(jawDrop(face.expression));
  inTorso(ctx, p, f, () => outline(ctx, PARTS.torso().body, LW));
  neck(ctx, 'line', look.skin, f.neck);
  inHead(ctx, f, () => {
    profileTail(ctx, look.hair, Math.sin(f.head), Math.cos(f.head), face.t);
    headLine(ctx, path);
  });
  inTorso(ctx, p, f, () => torsoFill(ctx, look, f, face));
  neck(ctx, 'fill', look.skin, f.neck);
  inTorso(ctx, p, f, () => clothes(ctx, look, f, face.t));
  inHead(ctx, f, () => head(ctx, look, f, face, path));
}

/** Draws a side-view person in the current transform as vector art (pixel.ts pixelates it). */
export function drawSideVector(ctx: CanvasRenderingContext2D, look: PersonLook, pose: SidePose, face: FaceState): void {
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (const pass of ['line', 'fill'] as const) arm(ctx, pass, look, pose.far.arm, true);
  for (const pass of ['line', 'fill'] as const) leg(ctx, pass, look, pose.far.leg, true);
  for (const pass of ['line', 'fill'] as const) leg(ctx, pass, look, pose.near.leg, false);
  core(ctx, look, pose, face);
  for (const pass of ['line', 'fill'] as const) arm(ctx, pass, look, pose.near.arm, false);
  ctx.restore();
}
