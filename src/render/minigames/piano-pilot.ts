import { lerp, type Vec } from '../../core/math';
import { BODY, drawSideFigure, solveLimb, type Expression, type PersonLook, type SideLimbs } from '../people';
import { S, SEAT } from './piano-upright';

// Piano Bar (doc 23): the pilot on the stool at the keys — a people-kit side figure (doc 17) facing the piano.
// The right hand (near us, treble) strikes on every hit and moves along the keys with the lane; the left hand
// (far side, bass) rolls the boogie in time; the head bobs on the beat and the near foot taps.

export interface PilotPlay {
  /** 0 … 1 through the current beat. */
  beat: number;
  /** 0 … 1 through the current eighth (left-hand roll). */
  eighth: number;
  /** Right-hand position, 0 (lane 0) … 3 (lane 3), smoothed. */
  lane: number;
  /** 1 at a hit, decaying. */
  strike: number;
  /** 0 … 1: how much the pilot moves with the music. */
  groove: number;
  expression: Expression;
  t: number;
}

/** Hip joint on screen (the stool at mid-keyboard) at the piano's scale; the keys relative to the hip, figure units. */
const PILOT = { x: SEAT.x, y: SEAT.y, scale: S } as const;
const KEYS = { x: 52, y: -36 };

const blinkAt = (t: number): number => (t % 3.9 < 0.12 ? 1 : 0);

function arm(shoulder: Vec, wrist: Vec, hand: number): SideLimbs['arm'] {
  return { shoulder, elbow: solveLimb(shoulder, wrist, BODY.upperArm, BODY.forearm, 1), wrist, hand };
}

function legs(tap: number): { near: SideLimbs['leg']; far: SideLimbs['leg'] } {
  return {
    near: { hip: { x: 0, y: 0 }, knee: { x: 80, y: 4 }, ankle: { x: 84, y: 86 }, foot: 0.06 - 0.24 * tap, toe: 0 },
    far: { hip: { x: 3, y: -3 }, knee: { x: 83, y: 0 }, ankle: { x: 92, y: 83 }, foot: 0.05, toe: 0 },
  };
}

/** Draws the seated pilot; the stool and the piano are drawn by the caller around it. */
export function drawPianoPilot(ctx: CanvasRenderingContext2D, look: PersonLook, p: PilotPlay): void {
  // Two frames per motion so the pixel cache (doc 20) holds them all.
  const bob = p.groove > 0.2 && p.beat < 0.35 ? 1 : 0;
  const tap = p.groove > 0.3 && p.beat > 0.15 && p.beat < 0.45 ? 1 : 0;
  const shoulder = { x: 12 + 4 * bob, y: -94 + 2 * bob };
  const down = p.strike > 0.45 ? 1 : 0;
  const lane = Math.round(p.lane);
  const rh = { x: KEYS.x + 2 + lane * 3.2, y: KEYS.y - 7 * (1 - down) + lane * 1.4 };
  const roll = Math.sin(p.eighth * Math.PI) > 0.6 ? 4 : 0;
  const lh = { x: KEYS.x - 6 + (p.beat < 0.5 ? 0 : 3), y: KEYS.y - 3 - roll };
  const lg = legs(tap);
  ctx.save();
  ctx.translate(PILOT.x, PILOT.y);
  ctx.scale(PILOT.scale, PILOT.scale);
  drawSideFigure(ctx, look, {
    hip: { x: 0, y: 0 }, shoulder, head: 0.16 + 0.1 * bob,
    near: { arm: arm(shoulder, rh, lerp(0.55, 0.9, down)), leg: lg.near },
    far: { arm: arm({ x: shoulder.x + 4, y: shoulder.y - 3 }, lh, 0.7), leg: lg.far },
  }, { expression: p.expression, strain: 0, blink: blinkAt(p.t), t: p.t });
  ctx.restore();
}
