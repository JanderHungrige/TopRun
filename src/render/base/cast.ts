import type { Vec } from '../../core/math';
import { PILOT_FLOOR_Y, WALK_FRAMES } from '../../data/base-areas';
import { walkFrame, type Walker } from '../../game/base-hangar';
import type { AvatarId } from '../../game/profiles';
import { CREW, crewExtras } from '../ceremony-looks';
import { PLAYER_LOOKS } from '../minigames/pushups-looks';
import {
  BODY, drawFrontFigure, drawSideFigure, solveLimb, type ArmJoints, type FaceState, type FrontPose, type LegJoints,
  type PersonLook, type SidePose,
} from '../people';
import { hexOf, PAL } from '../pixel/palette';
import { MECH, PILOT_SCALE } from './layout';
import { col } from './paint';

// Hangar base (doc 30): the people — the active pilot in a flight suit (the avatar's skin, hair and eyes, the
// suit in the avatar's colour) walking the floor in an 8-frame side-view cycle or standing three-quarter and
// blinking, and the plane captain in a brown jersey polishing the jet's nose. People-kit figures (doc 17) on
// the scene's art grid; their floor shadows go onto the art layer before it is blitted.

const v = (x: number, y: number): Vec => ({ x, y });
const ang = (a: Vec, b: Vec): number => Math.atan2(b.y - a.y, b.x - a.x);

const suits = new Map<AvatarId, PersonLook>();

/** The pilot in a flight suit (built once per avatar so the pixel cache keys stay put). */
function pilotLook(avatar: AvatarId): PersonLook {
  let look = suits.get(avatar);
  if (!look) {
    const base = PLAYER_LOOKS[avatar];
    look = Object.freeze<PersonLook>({
      ...base, torso: 'flightSuit', top: base.bottom, trim: base.bottom.shadow, legs: 'trousers', tied: false, tags: false,
    });
    suits.set(avatar, look);
  }
  return look;
}

function leg(hip: Vec, foot: Vec, lift: number): LegJoints {
  const ankle = v(foot.x, foot.y - BODY.ankle);
  return { hip, knee: solveLimb(hip, ankle, BODY.thigh, BODY.shin, 1), ankle, foot: lift > 0 ? 0.25 : 0, toe: 0 };
}

/** Two-bone arm with the elbow behind the body. */
function arm(sh: Vec, wr: Vec): ArmJoints {
  const a = solveLimb(sh, wr, BODY.upperArm, BODY.forearm, 1);
  const b = solveLimb(sh, wr, BODY.upperArm, BODY.forearm, -1);
  const elbow = a.x <= b.x ? a : b;
  return { shoulder: sh, elbow, wrist: wr, hand: ang(elbow, wr) };
}

function walkPose(f: number): SidePose {
  const ph = (f / WALK_FRAMES) * Math.PI * 2;
  const hip = v(0, -166 + 5 * Math.abs(Math.sin(ph)));
  const sh = v(hip.x + 8, hip.y - 94);
  const foot = (q: number): { at: Vec; lift: number } => {
    const lift = Math.max(0, Math.cos(q)) * 16;
    return { at: v(30 * Math.sin(q), -lift), lift };
  };
  const wrist = (q: number, s: Vec): Vec => v(s.x - 24 * Math.sin(q) + 4, s.y + 100);
  const nf = foot(ph);
  const ff = foot(ph + Math.PI);
  const farHip = v(hip.x - 4, hip.y - 2);
  const farSh = v(sh.x - 4, sh.y - 2);
  return {
    hip, shoulder: sh, head: 0,
    near: { arm: arm(sh, wrist(ph + Math.PI, sh)), leg: leg(hip, nf.at, nf.lift) },
    far: { arm: arm(farSh, wrist(ph, farSh)), leg: leg(farHip, ff.at, ff.lift) },
  };
}

const WALK: readonly SidePose[] = Array.from({ length: WALK_FRAMES }, (_, f) => walkPose(f));

function blink(t: number, phase: number): number {
  const ph = (t + phase) % 3.9;
  return ph < 0.14 ? 1 - Math.abs(ph / 0.07 - 1) : 0;
}

const face = (t: number, phase: number): FaceState => ({ expression: 'calm', strain: 0, blink: blink(t, phase), t });

/** Floor x snapped to the art grid, so a walking figure moves in whole art pixels. */
const snap = (x: number, G: number): number => Math.round(x / G) * G;

export interface CastView { t: number; walker: Walker; avatar: AvatarId }

function drawPilot(ctx: CanvasRenderingContext2D, G: number, view: CastView): void {
  const w = view.walker;
  const look = pilotLook(view.avatar);
  const opts = { units: 3 / PILOT_SCALE };
  ctx.save();
  ctx.translate(snap(w.x, G), PILOT_FLOOR_Y);
  if (w.moving) {
    ctx.scale(PILOT_SCALE * w.facing, PILOT_SCALE);
    drawSideFigure(ctx, look, WALK[walkFrame(w)] ?? WALK[0] ?? walkPose(0), face(view.t, 0), opts);
  } else {
    ctx.scale(PILOT_SCALE, PILOT_SCALE);
    const pose: FrontPose = { turn: 0.22 * w.facing, raise: [0, 0], hands: 'open' };
    drawFrontFigure(ctx, look, pose, face(view.t, 0), undefined, opts);
  }
  ctx.restore();
}

const CAPTAIN = CREW[7] ?? CREW[0];
/** The rag's circle on the fuselage side, in the hip frame (shoulders at y −94). */
const RAG: readonly Vec[] = [v(62, -100), v(70, -92), v(62, -84), v(54, -92)];

function drawCaptain(ctx: CanvasRenderingContext2D, G: number, t: number): void {
  if (!CAPTAIN) return;
  const cycle = t % 4.2;
  const polishing = cycle < 3;
  const reach = polishing ? RAG[Math.floor(t * 6) % RAG.length] ?? null : null;
  const pose: FrontPose = { turn: 0.42, headTurn: polishing ? 0 : -0.5, raise: [0, 0], hands: 'open', reach: [null, reach] };
  ctx.save();
  ctx.translate(snap(MECH.x, G), MECH.foot);
  ctx.scale(MECH.scale, MECH.scale);
  drawFrontFigure(ctx, CAPTAIN.look, pose, face(t, 1.7), crewExtras(CAPTAIN.helmet), { units: 3 / MECH.scale });
  ctx.restore();
}

/** Both figures, in front of the composed hangar layer (logical units). */
export function drawCast(ctx: CanvasRenderingContext2D, G: number, view: CastView): void {
  drawCaptain(ctx, G, view.t);
  drawPilot(ctx, G, view);
}

/** Soft floor shadows under the figures, on the art layer (art px). */
export function drawCastShadows(g: CanvasRenderingContext2D, G: number, walker: Walker): void {
  g.fillStyle = hexOf(col(PAL.ink, 0));
  g.globalAlpha = 0.45;
  for (const [x, y, w] of [[walker.x, PILOT_FLOOR_Y, 50], [MECH.x, MECH.foot, 40]] as const) {
    const c = Math.round(x / G);
    const r = Math.round(y / G);
    const half = Math.round(w / G / 2);
    g.fillRect(c - half + 2, r - 1, half * 2 - 4, 1);
    g.fillRect(c - half, r, half * 2, 1);
    g.fillRect(c - half + 2, r + 1, half * 2 - 4, 1);
  }
  g.globalAlpha = 1;
}
