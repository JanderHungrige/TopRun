import type { Vec } from '../../core/math';
import type { AvatarLook } from '../../game/avatar-look';
import type { AvatarId } from '../../game/profiles';
import { playerPerson, restyle } from '../avatars/person';
import { BODY, drawSideFigure, solveLimb, tone, type ArmJoints, type LegJoints, type PersonLook, type SidePose } from '../people';
import type { Expression } from '../people/types';
import { CENTRE_X, DECK_Y } from './highfive-deck';
import { RIVAL_LOOK } from './pushups-looks';

// High Five (doc 42): the pilot and Duke in flight suits as people-kit side figures (doc 17) — where each one is
// during a rep and which key frame they show: run, crouch, rise, the slap up high, the half-circle swing of the arm,
// landing and the slap down low. Feet on the origin, facing +x; a key frame per step keeps the pixel cache hitting.

export const FIG = 0.5;
/** Jump height (logical px). */
const JUMP = 118;
const v = (x: number, y: number): Vec => ({ x, y });
const add = (a: Vec, b: Vec): Vec => ({ x: a.x + b.x, y: a.y + b.y });
const ang = (a: Vec, b: Vec): number => Math.atan2(b.y - a.y, b.x - a.x);

const OLIVE = tone('#5d6b3e', '#76864f', '#43502b');
const suit = (b: PersonLook, cloth = b.bottom): PersonLook => Object.freeze<PersonLook>({
  ...b, torso: 'flightSuit', top: cloth, bottom: cloth, trim: cloth.shadow, legs: 'trousers', feet: 'sneakers', tied: false, tags: false,
});
const DUKE = suit(RIVAL_LOOK, OLIVE);
export const pilotLook = (face: AvatarId | AvatarLook): PersonLook => restyle(playerPerson(face), 'deckSuit', (b) => suit(b));
export const dukeLook = (): PersonLook => DUKE;

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

interface Frame { hip: Vec; sh: Vec; feet: [Vec, Vec]; wrists: [Vec, Vec]; elbows?: [Vec, Vec]; foot?: number; head?: number }

const DOWN: [Vec, Vec] = [v(0, 30), v(0, 30)];
const BACK: [Vec, Vec] = [v(-24, 10), v(-24, 10)];

function build(f: Frame): SidePose {
  const [en, ef] = f.elbows ?? DOWN;
  return {
    hip: f.hip, shoulder: f.sh, head: f.head ?? 0,
    near: { arm: arm(f.sh, f.wrists[0], en), leg: leg(f.hip, f.feet[0], f.foot) },
    far: { arm: arm(add(f.sh, v(-4, -2)), f.wrists[1], ef), leg: leg(add(f.hip, v(-4, -2)), f.feet[1], f.foot) },
  };
}

function runFrame(i: number): Frame {
  const p = (i / 8) * Math.PI * 2;
  const hip = v(0, -158 - 5 * Math.abs(Math.sin(p)));
  const sh = add(hip, v(24, -92));
  const foot = (q: number): Vec => v(40 * Math.sin(q), -Math.max(0, Math.cos(q)) * 28);
  const wrist = (q: number): Vec => add(sh, v(-34 * Math.sin(q) + 14, 64));
  return { hip, sh, feet: [foot(p), foot(p + Math.PI)], wrists: [wrist(p), wrist(p + Math.PI)], elbows: BACK };
}

const CROUCH: Frame = { hip: v(-6, -128), sh: v(18, -216), feet: [v(16, 0), v(-20, 0)], wrists: [v(-30, -150), v(-34, -146)], elbows: BACK };
const RISE: Frame = { hip: v(0, -170), sh: v(4, -266), feet: [v(8, 6), v(-12, 0)], foot: 0.9, wrists: [v(52, -372), v(-20, -200)], elbows: [v(10, 0), v(0, 30)], head: -0.3 };
const HIGH: Frame = { hip: v(0, -170), sh: v(6, -266), feet: [v(10, -10), v(-14, -16)], foot: 0.7, wrists: [v(76, -384), v(-18, -196)], elbows: [v(12, 0), v(0, 30)], head: -0.35 };
const LAND: Frame = { hip: v(-4, -130), sh: v(16, -220), feet: [v(14, 0), v(-18, 0)], wrists: [v(80, -158), v(-10, -150)] };
const LOW: Frame = { hip: v(-6, -122), sh: v(26, -208), feet: [v(18, 0), v(-20, 0)], wrists: [v(86, -112), v(-8, -140)], head: 0.25 };

/** The arm's half circle from up high (−80°) to down low (+70°), in `n` steps. */
function swingFrame(k: number, n: number): Frame {
  const a = ((-80 + (150 * k) / (n - 1)) * Math.PI) / 180;
  const sh = v(10, -262);
  return { hip: v(0, -168), sh, feet: [v(10, -6), v(-14, -10)], foot: 0.6, wrists: [add(sh, v(Math.cos(a) * 80, Math.sin(a) * 96)), v(-18, -196)], elbows: [v(14, 0), v(0, 30)] };
}

const SWING = 5;
const FRAMES = {
  run: Array.from({ length: 8 }, (_, i) => build(runFrame(i))),
  crouch: build(CROUCH), rise: build(RISE), high: build(HIGH), land: build(LAND), low: build(LOW),
  swing: Array.from({ length: SWING }, (_, k) => build(swingFrame(k, SWING))),
};

/** Offset from the centre (px) of a runner coming from the − side, at fraction f of the rep. */
function offset(f: number): number {
  const lerp = (a: number, b: number, k: number): number => a + (b - a) * Math.max(0, Math.min(1, k));
  if (f < 0.42) return lerp(-300, -50, f / 0.42);
  if (f < 0.72) return lerp(-50, -44, (f - 0.42) / 0.3);
  if (f < 0.84) return lerp(-44, -46, (f - 0.72) / 0.12);
  return lerp(-46, 300, (f - 0.84) / 0.16);
}

function frameAt(f: number): { pose: SidePose; expression: Expression } {
  const run = (FRAMES.run[Math.floor(f * 30) % 8] ?? FRAMES.crouch);
  if (f < 0.36 || f >= 0.86) return { pose: run, expression: 'grin' };
  if (f < 0.42) return { pose: FRAMES.crouch, expression: 'effort' };
  if (f < 0.52) return { pose: FRAMES.rise, expression: 'effort' };
  if (f < 0.62) return { pose: FRAMES.high, expression: 'grin' };
  if (f < 0.72) return { pose: FRAMES.swing[Math.min(SWING - 1, Math.floor(((f - 0.62) / 0.1) * SWING))] ?? FRAMES.land, expression: 'grin' };
  if (f < 0.78) return { pose: FRAMES.land, expression: 'effort' };
  return { pose: FRAMES.low, expression: 'grin' };
}

export interface Figure { x: number; y: number; facing: 1 | -1; pose: SidePose; expression: Expression }

/** A runner at fraction f of the rep: `dir` +1 = coming from the left; `jumped` false keeps the feet on the deck. */
export function figureAt(f: number, dir: 1 | -1, jumped: boolean): Figure {
  const air = f >= 0.42 && f < 0.72 && jumped ? Math.sin((Math.PI * (f - 0.42)) / 0.3) * JUMP : 0;
  return { x: CENTRE_X + dir * offset(f), y: DECK_Y - air, facing: dir, ...frameAt(f) };
}

export function drawFigure(ctx: CanvasRenderingContext2D, look: PersonLook, fig: Figure, t: number): void {
  ctx.save();
  ctx.translate(Math.round(fig.x / 2) * 2, Math.round(fig.y / 2) * 2);
  ctx.scale(fig.facing * FIG, FIG);
  drawSideFigure(ctx, look, fig.pose, { expression: fig.expression, strain: 0, blink: 0, t });
  ctx.restore();
}

/** Where the hands meet for a beat (logical px): up high in the air, down low after landing, the take-off mark. */
export function meetPoint(kind: 'jump' | 'high' | 'low', dir: 1 | -1): Vec {
  if (kind === 'jump') return v(CENTRE_X - dir * 50, DECK_Y - 4);
  if (kind === 'high') return v(CENTRE_X, DECK_Y - JUMP - 388 * FIG);
  return v(CENTRE_X, DECK_Y - 112 * FIG);
}
