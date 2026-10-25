import type { Vec } from '../../core/math';
import type { Rect } from '../pixel/blit';
import { drawPixelated, type PixelOpts } from '../pixel/capture';
import { drawFrontVector, type FrontExtras, type FrontPose } from './front-figure';
import { drawSideVector, type ArmJoints, type LegJoints, type SidePose } from './side-figure';
import type { FaceState, PersonLook } from './types';

// People kit (doc 17) in the pixel look (doc 20): the public figure functions keep their signatures but draw
// through the pixel pipeline — the pose and face are quantised to animation frames, each frame is rendered
// once at art resolution, cleaned up into flat colour clusters with an outline, cached and blitted crisply.

const q = (v: number, step: number): number => Math.round(v / step) * step;

const ids = new WeakMap<object, number>();
let nextId = 1;
function idOf(o: object | undefined): number {
  if (!o) return 0;
  let id = ids.get(o);
  if (id === undefined) {
    id = nextId++;
    ids.set(o, id);
  }
  return id;
}

/** Face quantised to frames; time only matters for a swinging ponytail or (side view) sweat drops. */
function faceFrame(face: FaceState, look: PersonLook, side: boolean): FaceState {
  const timed = look.hair.style === 'long' || (side && face.strain > 0.3);
  return {
    expression: face.expression,
    strain: q(face.strain, 0.25),
    blink: face.blink > 0.66 ? 1 : face.blink > 0.25 ? 0.5 : 0,
    t: timed ? q(((face.t % 2.5) + 2.5) % 2.5, 0.3125) : 0,
  };
}
const faceKey = (f: FaceState): string => `${f.expression}|${f.strain}|${f.blink}|${f.t}`;

/** Front figure reach around its floor origin (arms raised over the head included). */
const FRONT_BOUNDS: Rect = { x: -135, y: -415, w: 270, h: 432 };

const qReach = (v: Vec | null | undefined): Vec | null => (v ? qv(v) : null);
const reachKey = (r: FrontPose['reach']): string => (r ? r.map((v) => (v ? `${v.x},${v.y}` : '-')).join(';') : '');

/** Draws a standing three-quarter person in the current transform (pixel art, cached per frame). `opts` sets the
 *  art grid (drawing units per art pixel, smallest device pixel size) — e.g. to keep small figures on the same
 *  pixel size as big ones. */
export function drawFrontFigure(
  ctx: CanvasRenderingContext2D, look: PersonLook, pose: FrontPose, face: FaceState, extras?: FrontExtras, opts?: PixelOpts,
): void {
  const p: FrontPose = {
    turn: q(pose.turn, 0.02), headTurn: q(pose.headTurn ?? 0, 0.02),
    raise: [q(pose.raise[0], 0.125), q(pose.raise[1], 0.125)], hands: pose.hands,
    ...(pose.reach ? { reach: [qReach(pose.reach[0]), qReach(pose.reach[1])] as const } : {}),
  };
  const f = faceFrame(face, look, false);
  const ex = extras ? extras.key ?? `${idOf(extras.head)}.${idOf(extras.chest)}` : '';
  const key = `F|${idOf(look)}|${p.turn}|${p.headTurn}|${p.raise[0]}|${p.raise[1]}|${p.hands}|${reachKey(p.reach)}|${faceKey(f)}|${ex}`;
  drawPixelated(ctx, key, FRONT_BOUNDS, (g) => drawFrontVector(g, look, p, f, extras), opts);
}

const qv = (v: Vec): Vec => ({ x: q(v.x, 1.5), y: q(v.y, 1.5) });
const qArm = (a: ArmJoints): ArmJoints => ({ shoulder: qv(a.shoulder), elbow: qv(a.elbow), wrist: qv(a.wrist), hand: q(a.hand, 0.04) });
const qLeg = (l: LegJoints): LegJoints => ({ hip: qv(l.hip), knee: qv(l.knee), ankle: qv(l.ankle), foot: q(l.foot, 0.04), toe: q(l.toe, 0.04) });

function sideFrame(p: SidePose): SidePose {
  return {
    hip: qv(p.hip), shoulder: qv(p.shoulder), head: q(p.head, 0.02),
    near: { arm: qArm(p.near.arm), leg: qLeg(p.near.leg) }, far: { arm: qArm(p.far.arm), leg: qLeg(p.far.leg) },
  };
}

function sidePoints(p: SidePose): Vec[] {
  const limbs = [p.near, p.far].flatMap((s) => [s.arm.shoulder, s.arm.elbow, s.arm.wrist, s.leg.hip, s.leg.knee, s.leg.ankle]);
  return [p.hip, p.shoulder, ...limbs];
}

/** Draws a side-view person in the current transform (pixel art, cached per frame). */
export function drawSideFigure(ctx: CanvasRenderingContext2D, look: PersonLook, pose: SidePose, face: FaceState): void {
  const p = sideFrame(pose);
  const f = faceFrame(face, look, true);
  const pts = sidePoints(p);
  const x0 = Math.min(...pts.map((v) => v.x)) - 80;
  const y0 = Math.min(...pts.map((v) => v.y)) - 80;
  const bounds = { x: x0, y: y0, w: Math.max(...pts.map((v) => v.x)) + 80 - x0, h: Math.max(...pts.map((v) => v.y)) + 80 - y0 };
  const key = `S|${idOf(look)}|${pts.map((v) => `${v.x},${v.y}`).join(';')}|${p.head}|${[p.near, p.far].map((s) => `${s.arm.hand},${s.leg.foot},${s.leg.toe}`).join(';')}|${faceKey(f)}`;
  drawPixelated(ctx, key, bounds, (g) => drawSideVector(g, look, p, f));
}
