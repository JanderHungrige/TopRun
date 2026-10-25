import { facingOf, grounded, TEAM_OF, type Athlete } from './volleyball-athlete';
import { drive, lob, netCrossHeight, VB, type Ball } from './volleyball-ball';

// Beach Volleyball (doc 21): where an athlete can reach the ball, how clean the contact is, and where every
// kind of hit sends it (with seeded error that grows with a poor touch). Pure.

export type HitKind = 'pass' | 'set' | 'lob' | 'spike' | 'tip' | 'serve' | 'dig' | 'block';
export type Aim = 'short' | 'mid' | 'deep';

export const REACH = Object.freeze({
  /**
   * Bump / set: a capsule in front of the body between `low` and `high` above the feet. A hard ball (≥ hardFrom
   * m/s: spikes, fast serves) can only be dug low: the capsule ends at hardHigh with radius hardR.
   */
  ground: { ahead: 0.3, low: 0.35, high: 2.3, r: 0.75, hardFrom: 12, hardHigh: 1.0, hardR: 0.55 },
  /** Spike / tip: around a point above the head (moves with the jump). */
  air: { ahead: 0.35, up: 2.45, r: 0.9 },
  serve: { ahead: 0.3, up: 2.55, r: 0.5 },
  /** A dive starts for a ball below `below` within `range`; the diving body reaches around a point ahead. */
  dive: { below: 1.0, range: 2.1, ahead: 0.5, up: 0.35, r: 0.6 },
  /** In the air within `near` of the net, feet ≥ `lift` up; hands from the tape to `top` above the feet. */
  block: { near: 0.7, lift: 0.4, top: 2.25, soft: 0.25 },
});

/** Landing distance past the net per aim. */
export const AIM_DIST: Readonly<Record<Aim, number>> = { short: 1.8, mid: 3.6, deep: 6.0 };

export const HIT = Object.freeze({
  passApex: 4.3,
  /** Height the pass comes down to (the setter's hands) and the set (the spiker's contact). */
  passTo: 2.0,
  setApex: 5.2,
  setTo: 3.1,
  lobApex: 4.6,
  tipLift: 0.7,
  spikeBase: 13,
  spikeGain: 7,
  serveBase: 8.5,
  serveGain: 3.5,
  /** Error scales: target metres per (1 − accuracy)², apex metres per (1 − accuracy). */
  passErr: 3.0,
  lobErr: 2.2,
  spikeErr: 3.2,
  serveErr: 3.0,
  apexErr: 1.0,
  /** Below this accuracy a touch is shanked, a serve goes into the net. */
  shank: 0.2,
  serveNet: 0.15,
  /** Margin over the tape that attacks and serves are aimed to clear by. */
  clear: 0.12,
  /** A hard incoming ball (m/s) lowers the contact quality, up to hardMax. */
  hardFrom: 9,
  hardSpan: 9,
  hardMax: 0.45,
});

const fwd = (a: Athlete): number => facingOf(TEAM_OF[a.id]);

export const hardBall = (b: Ball): boolean => Math.hypot(b.vx, b.vy) >= REACH.ground.hardFrom;
/** Radius of the ground zone for this ball. */
export const groundR = (b: Ball): number => (hardBall(b) ? REACH.ground.hardR : REACH.ground.r);

export function groundDist(a: Athlete, b: Ball): number {
  const g = REACH.ground;
  const cy = Math.max(a.y + g.low, Math.min(a.y + (hardBall(b) ? g.hardHigh : g.high), b.y));
  return Math.hypot(b.x - (a.x + fwd(a) * g.ahead), b.y - cy);
}

export function airDist(a: Athlete, b: Ball): number {
  return Math.hypot(b.x - (a.x + fwd(a) * REACH.air.ahead), b.y - (a.y + REACH.air.up));
}

/** The diving body's reach: low, ahead in the direction of the lunge. */
export function diveDist(a: Athlete, b: Ball): number {
  const k = REACH.dive;
  return Math.hypot(b.x - (a.x + Math.sign(a.vx) * k.ahead), b.y - k.up);
}

export function serveDist(a: Athlete, b: Ball): number {
  return Math.hypot(b.x - (a.x + fwd(a) * REACH.serve.ahead), b.y - (a.y + REACH.serve.up));
}

/** 1 at the centre of the zone, falling off with the square of the distance to 0 at its edge; a hard ball takes some off. */
export function contactQuality(dist: number, r: number, speed: number): number {
  const base = Math.max(0, 1 - (dist / r) ** 2);
  const hard = Math.min(1, Math.max(0, (speed - HIT.hardFrom) / HIT.hardSpan)) * HIT.hardMax;
  return base * (1 - hard);
}

/** Direction of a possible dive at a low ball the ground zone can't reach; 0 = no dive. */
export function diveDir(a: Athlete, b: Ball): -1 | 0 | 1 {
  if (!grounded(a) || a.dive > 0 || b.y > REACH.dive.below) return 0;
  if (groundDist(a, b) <= groundR(b)) return 0;
  const dx = b.x - a.x;
  if (Math.abs(dx) > REACH.dive.range) return 0;
  return dx > 0 ? 1 : -1;
}

/** The athlete's hands are in the way of a ball crossing the net at `crossY`. */
export function blocks(a: Athlete, crossY: number): boolean {
  const k = REACH.block;
  return a.y >= k.lift && Math.abs(a.x) <= k.near && crossY >= VB.netH && crossY <= a.y + k.top;
}

/** A blocked ball: off the fingertips it pops up on the blocking side, otherwise it is stuffed back down. */
export function deflect(b: Ball, crossY: number, top: number): Ball {
  const dir = Math.sign(b.vx) || 1;
  const off = VB.ballR + VB.netW + 0.02;
  if (crossY > top - REACH.block.soft) return { x: dir * off, y: crossY, vx: b.vx * 0.3, vy: 3.2 };
  return { x: -dir * off, y: crossY, vx: -b.vx * 0.35, vy: -Math.abs(b.vy) * 0.3 - 0.5 };
}

export interface Strike {
  kind: HitKind;
  /** Contact point. */
  x: number;
  y: number;
  /** Towards the net. */
  dir: 1 | -1;
  aim: Aim;
  /** Accuracy 0 … 1. */
  acc: number;
  /** Target x for a pass / dig / set (the partner). */
  target: number;
  /** Landing distance past the net for a spike / lob / serve, overriding the aim's (the AI picks any depth). */
  depth?: number;
}

const sym = (u: number): number => 2 * u - 1;
const clears = (b: Ball): boolean => (netCrossHeight(b) ?? 0) >= VB.netH + VB.ballR + HIT.clear;

function shank(s: Strike, u1: number, u2: number): Ball {
  return lob(s.x, s.y, s.x - s.dir * (1 + 3 * u1), VB.ballR, s.y + 1 + 2 * u2);
}

function toPartner(s: Strike, apex: number, toY: number, u1: number, u2: number): Ball {
  if (s.acc < HIT.shank) return shank(s, u1, u2);
  const miss = 1 - s.acc;
  return lob(s.x, s.y, s.target + miss * miss * HIT.passErr * sym(u1), toY, apex + miss * HIT.apexErr * sym(u2));
}

/** A high ball over the net to `land`, raised until it clears the tape. */
function arcOver(s: Strike, land: number, apex: number): Ball {
  let top = apex;
  let b = lob(s.x, s.y, land, VB.ballR, top);
  for (let i = 0; i < 16 && !clears(b); i++) b = lob(s.x, s.y, land, VB.ballR, (top += 0.3));
  return b;
}

const depthOf = (s: Strike): number => s.depth ?? AIM_DIST[s.aim];

function lobOver(s: Strike, u1: number, u2: number): Ball {
  if (s.acc < HIT.shank) return shank(s, u1, u2);
  const miss = 1 - s.acc;
  return arcOver(s, s.dir * (depthOf(s) + miss * miss * HIT.lobErr * sym(u1)), HIT.lobApex + miss * HIT.apexErr * sym(u2));
}

function tip(s: Strike, u1: number, u2: number): Ball {
  const miss = 1 - s.acc;
  return arcOver(s, s.dir * (AIM_DIST.short + miss * miss * HIT.lobErr * sym(u1)), s.y + HIT.tipLift + miss * 0.5 * sym(u2));
}

/** Spikes keep their speed and land deeper until they clear; from far back they slow down too. */
function spikeDepth(s: Strike, want: number, speed: number): { depth: number; speed: number } {
  for (let v = speed; v >= 6; v -= 1.5) {
    for (let d = want; d <= Math.max(want, VB.half - 0.2); d += 0.2) if (clears(drive(s.x, s.y, s.dir * d, v))) return { depth: d, speed: v };
  }
  return { depth: Math.max(want, VB.half - 0.2), speed: 6 };
}

/** Serves keep their depth and float slower until they clear; deeper if even that fails. */
function serveDepth(s: Strike, want: number, speed: number): { depth: number; speed: number } {
  for (let d = want; d <= Math.max(want, VB.half - 0.2); d += 0.2) {
    for (let v = speed; v >= 5; v -= 0.5) if (clears(drive(s.x, s.y, s.dir * d, v))) return { depth: d, speed: v };
  }
  return { depth: want, speed: 5 };
}

/** A mishit attack or serve: it never gets over the tape. */
const intoNet = (s: Strike, speed: number): Ball => drive(s.x, s.y, s.dir * 0.6, speed);

function attack(s: Strike, u1: number): Ball {
  const speed = HIT.spikeBase + HIT.spikeGain * s.acc;
  if (s.acc < HIT.shank) return intoNet(s, speed);
  const miss = 1 - s.acc;
  const shot = spikeDepth(s, depthOf(s) + miss * miss * HIT.spikeErr * sym(u1), speed);
  return drive(s.x, s.y, s.dir * shot.depth, shot.speed);
}

function serve(s: Strike, u1: number): Ball {
  const speed = HIT.serveBase + HIT.serveGain * s.acc;
  if (s.acc < HIT.serveNet) return intoNet(s, speed);
  const miss = 1 - s.acc;
  const shot = serveDepth(s, depthOf(s) + miss * miss * HIT.serveErr * sym(u1), speed);
  return drive(s.x, s.y, s.dir * shot.depth, shot.speed);
}

/** The ball after a hit; u1, u2 are seeded uniform numbers in [0, 1). */
export function strike(s: Strike, u1: number, u2: number): Ball {
  switch (s.kind) {
    case 'pass':
    case 'dig': return toPartner(s, HIT.passApex, HIT.passTo, u1, u2);
    case 'set': return toPartner(s, HIT.setApex, HIT.setTo, u1, u2);
    case 'lob': return lobOver(s, u1, u2);
    case 'spike': return attack(s, u1);
    case 'tip': return tip(s, u1, u2);
    case 'serve': return serve(s, u1);
    case 'block': return { x: s.x, y: s.y, vx: 0, vy: 0 };
    default: throw new Error(`unhandled: ${s.kind satisfies never}`);
  }
}
