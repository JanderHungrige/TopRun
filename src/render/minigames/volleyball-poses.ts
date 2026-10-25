import type { Vec } from '../../core/math';
import { BODY_RULES, type Athlete } from '../../game/minigames/volleyball-athlete';
import { BODY, solveLimb, type ArmJoints, type Expression, type LegJoints, type SidePose } from '../people';

// Beach Volleyball (doc 21): an athlete's state → a people-kit side pose (doc 17), facing +x with the feet on
// the origin. Every pose is a fixed key frame (the run cycle has 8), so the pixel cache (doc 20) keeps hitting.

const v = (x: number, y: number): Vec => ({ x, y });
const add = (a: Vec, b: Vec): Vec => ({ x: a.x + b.x, y: a.y + b.y });
const ang = (a: Vec, b: Vec): number => Math.atan2(b.y - a.y, b.x - a.x);

/** Two-bone IK with the elbow on the side of `prefer` (relative to the shoulder). */
function arm(sh: Vec, wr: Vec, prefer: Vec): ArmJoints {
  const target = add(sh, prefer);
  const a = solveLimb(sh, wr, BODY.upperArm, BODY.forearm, 1);
  const b = solveLimb(sh, wr, BODY.upperArm, BODY.forearm, -1);
  const elbow = Math.hypot(a.x - target.x, a.y - target.y) <= Math.hypot(b.x - target.x, b.y - target.y) ? a : b;
  return { shoulder: sh, elbow, wrist: wr, hand: ang(elbow, wr) };
}

function leg(hip: Vec, foot: Vec, angle = 0): LegJoints {
  const ankle = v(foot.x, foot.y - BODY.ankle);
  return { hip, knee: solveLimb(hip, ankle, BODY.thigh, BODY.shin, 1), ankle, foot: angle, toe: 0 };
}

interface Frame {
  hip: Vec;
  sh: Vec;
  feet: [Vec, Vec];
  wrists: [Vec, Vec];
  /** Elbow side per arm (near, far). */
  elbows?: [Vec, Vec];
  foot?: number;
  head?: number;
}

const DOWN: [Vec, Vec] = [v(0, 30), v(0, 30)];
const BACK: [Vec, Vec] = [v(-24, 10), v(-24, 10)];

function build(f: Frame, head: number): SidePose {
  const [en, ef] = f.elbows ?? DOWN;
  const dx = 4; // the far side sits a little behind the near one
  return {
    hip: f.hip, shoulder: f.sh, head: f.head ?? head,
    near: { arm: arm(f.sh, f.wrists[0], en), leg: leg(f.hip, f.feet[0], f.foot) },
    far: { arm: arm(add(f.sh, v(-dx, -2)), f.wrists[1], ef), leg: leg(add(f.hip, v(-dx, -2)), f.feet[1], f.foot) },
  };
}

const READY: Frame = { hip: v(-10, -146), sh: v(14, -238), feet: [v(14, 0), v(-26, 0)], wrists: [v(52, -150), v(46, -152)] };
const IDLE: Frame = { hip: v(0, -166), sh: v(4, -262), feet: [v(10, 0), v(-10, 0)], wrists: [v(8, -164), v(-6, -166)], elbows: BACK };
const BUMP: Frame = { hip: v(-20, -122), sh: v(12, -214), feet: [v(26, 0), v(-36, 0)], wrists: [v(70, -132), v(66, -130)] };
const SET: Frame = { hip: v(-6, -150), sh: v(4, -250), feet: [v(12, 0), v(-22, 0)], wrists: [v(30, -338), v(22, -334)], elbows: [v(34, -6), v(30, -6)] };
const BLOCK: Frame = { hip: v(0, -170), sh: v(2, -266), feet: [v(4, 2), v(-8, 0)], wrists: [v(26, -394), v(16, -390)], foot: 0.9, elbows: [v(10, 0), v(10, 0)] };
const RISE: Frame = { hip: v(-2, -170), sh: v(0, -266), feet: [v(6, 4), v(-10, 0)], wrists: [v(32, -388), v(16, -382)], foot: 0.9, elbows: [v(10, 0), v(10, 0)] };
const FALL: Frame = { hip: v(-4, -166), sh: v(6, -262), feet: [v(12, -16), v(-14, -8)], wrists: [v(44, -204), v(34, -198)], foot: 0.5 };
const CHEER: Frame = { hip: v(0, -166), sh: v(2, -262), feet: [v(10, 0), v(-10, 0)], wrists: [v(46, -382), v(-28, -384)], elbows: [v(20, 0), v(-20, 0)], head: -0.3 };
const SLUMP: Frame = { hip: v(-18, -150), sh: v(30, -226), feet: [v(16, 0), v(-18, 0)], wrists: [v(32, -98), v(24, -96)], head: 0.5 };
const HOLD: Frame = { hip: v(0, -166), sh: v(2, -262), feet: [v(14, 0), v(-14, 0)], wrists: [v(-18, -172), v(40, -198)], elbows: [v(-20, 10), v(0, 30)] };
const TOSS: Frame = { hip: v(0, -168), sh: v(-2, -264), feet: [v(14, 0), v(-14, 0)], wrists: [v(-32, -300), v(24, -372)], elbows: [v(-10, -30), v(10, 0)], head: -0.4 };
const TUCK = { hip: v(0, -168), feet: [v(14, -12), v(-18, -20)] as [Vec, Vec], foot: 0.7 };
const SPIKE: readonly Frame[] = [
  { ...TUCK, sh: v(-6, -264), wrists: [v(-34, -332), v(46, -360)], elbows: [v(20, -34), v(10, 0)], head: -0.35 },
  { ...TUCK, sh: v(6, -264), wrists: [v(30, -392), v(30, -196)], elbows: [v(10, 0), v(0, 30)], head: -0.25 },
  { ...TUCK, sh: v(18, -258), wrists: [v(78, -262), v(8, -186)], head: 0.1 },
];
const TIP: Frame = { ...TUCK, sh: v(4, -266), wrists: [v(24, -396), v(34, -220)], elbows: [v(10, 0), v(0, 30)], head: -0.35 };
const SERVE: readonly Frame[] = [
  { hip: v(0, -168), sh: v(-2, -264), feet: [v(16, 0), v(-14, 0)], wrists: [v(40, -380), v(30, -200)], elbows: [v(10, 0), v(0, 30)], head: -0.3 },
  { hip: v(2, -166), sh: v(16, -258), feet: [v(18, 0), v(-12, 0)], wrists: [v(76, -256), v(10, -186)], head: 0 },
];
const DIVE: readonly Frame[] = [
  { hip: v(-60, -70), sh: v(36, -98), feet: [v(-150, -44), v(-142, -32)], wrists: [v(132, -72), v(126, -66)], foot: Math.PI, head: 0.75, elbows: [v(0, -10), v(0, -10)] },
  { hip: v(-60, -26), sh: v(36, -34), feet: [v(-150, -8), v(-142, -6)], wrists: [v(128, -16), v(122, -12)], foot: Math.PI, head: 0.95, elbows: [v(0, -10), v(0, -10)] },
];

function runFrame(i: number, back: boolean): Frame {
  const p = (i / 8) * Math.PI * 2;
  const stride = back ? 24 : 40;
  const lift = back ? 14 : 28;
  const hip = v(0, -158 - 5 * Math.abs(Math.sin(p)));
  const sh = add(hip, v(back ? 4 : 24, -92));
  const foot = (q: number): Vec => v(stride * Math.sin(q), -Math.max(0, Math.cos(q)) * lift);
  const wrist = (q: number): Vec => add(sh, v(-34 * Math.sin(q) + 14, 64));
  return { hip, sh, feet: [foot(p), foot(p + Math.PI)], wrists: [wrist(p), wrist(p + Math.PI)], elbows: BACK };
}

export interface PoseCtx {
  /** Rally running (ready stance) vs. between points (standing). */
  live: boolean;
  /** This athlete holds the ball to serve / has just tossed it. */
  holding: boolean;
  tossing: boolean;
  /** Ball height relative to the feet (m) and in front (+) / behind (−) of the athlete. */
  ballUp: number;
  ballAhead: number;
  /** Seconds, for the run cycle. */
  t: number;
}

export interface AthletePose { pose: SidePose; expression: Expression; blink: boolean; flip: boolean }

const RECENT = 0.34;

function airFrame(a: Athlete): { f: Frame; e: Expression } {
  if (a.swing?.kind === 'air') {
    const k = a.swing.hit ? 2 : a.swing.t < 0.09 ? 0 : 1;
    return { f: a.swing.aim === 'short' && k > 0 ? TIP : SPIKE[k] ?? RISE, e: 'effort' };
  }
  if (a.pose === 'spike' && a.poseT < RECENT) return { f: SPIKE[2] ?? FALL, e: 'effort' };
  if (a.pose === 'block' || (Math.abs(a.x) < 0.9 && a.y > 0.15)) return { f: BLOCK, e: 'effort' };
  return { f: a.vy > -0.5 ? RISE : FALL, e: 'calm' };
}

function groundFrame(a: Athlete, facing: 1 | -1, c: PoseCtx): { f: Frame; e: Expression; blink: boolean } {
  if (c.holding) return { f: HOLD, e: 'calm', blink: true };
  if (a.swing?.kind === 'serve' || (a.pose === 'serve' && a.poseT < RECENT)) return { f: SERVE[a.swing && !a.swing.hit ? 0 : 1] ?? HOLD, e: 'effort', blink: false };
  if (c.tossing) return { f: TOSS, e: 'calm', blink: false };
  const hit = a.poseT < RECENT && (a.pose === 'pass' || a.pose === 'dig' || a.pose === 'lob' || a.pose === 'set');
  if (hit) return { f: a.pose === 'set' ? SET : BUMP, e: 'effort', blink: false };
  if (a.swing?.kind === 'ground') return { f: c.ballUp > 1.7 ? SET : BUMP, e: 'effort', blink: false };
  if (Math.abs(a.vx) > 0.5) {
    const back = Math.sign(a.vx) !== facing;
    const i = Math.floor((c.t * Math.abs(a.vx) * 1.5) % 8);
    return { f: runFrame(back ? 7 - i : i, back), e: 'calm', blink: false };
  }
  return { f: c.live ? READY : IDLE, e: 'calm', blink: true };
}

/** Head tilt towards the ball, in three steps. */
const lookAt = (c: PoseCtx): number => (c.ballAhead < 0 ? 0 : c.ballUp > 2.6 ? -0.35 : c.ballUp < 1.0 ? 0.15 : -0.1);

/** The spike at contact (hub icon). */
export const spikePose = (): SidePose => build(SPIKE[1] ?? RISE, -0.25);

export function athletePose(a: Athlete, facing: 1 | -1, c: PoseCtx): AthletePose {
  const head = lookAt(c);
  if (a.dive > 0) {
    const f = DIVE[a.dive > BODY_RULES.diveTime - 0.28 ? 0 : 1] ?? IDLE;
    return { pose: build(f, head), expression: 'effort', blink: false, flip: Math.sign(a.vx) !== facing && a.vx !== 0 };
  }
  if (a.mood === 'cheer') return { pose: build(CHEER, head), expression: 'grin', blink: false, flip: false };
  if (a.mood === 'slump') return { pose: build(SLUMP, head), expression: 'exhausted', blink: true, flip: false };
  if (a.y > 0.02) {
    const r = airFrame(a);
    return { pose: build(r.f, head), expression: r.e, blink: false, flip: false };
  }
  const r = groundFrame(a, facing, c);
  return { pose: build(r.f, head), expression: r.e, blink: r.blink, flip: false };
}
