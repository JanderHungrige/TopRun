import {
  ATHLETE_IDS, BODY_RULES as B, grounded, jumpAthlete, runAthlete, startDive, startSwing, swingLive, tickSwing,
  type Athlete, type AthleteId, type SwingKind,
} from './volleyball-athlete';
import { aiIntent, canTouch, closing, type Intent } from './volleyball-ai';
import { ballAt, flyBall, VB, type Ball } from './volleyball-ball';
import { airDist, diveDir, diveDist, groundDist, groundR, REACH, serveDist, type Aim } from './volleyball-hit';
import { setAthlete, setMind, VB_RULES as R, type VbInput, type Work } from './volleyball-state';
import { applyHit, endRally, newPath, tryBlock } from './volleyball-touch';

// Beach Volleyball (doc 21): one tick of a rally — your input and the AI's intents, contacts, movement, the
// ball's flight (net, block) and the landing.

export type Wants = Record<AthleteId, number>;
const AI_IDS = ['duke', 'breaker', 'riptide'] as const;

export const aimOf = (move: number): Aim => (move > 0.3 ? 'deep' : move < -0.3 ? 'short' : 'mid');

export function doJump(w: Work, id: AthleteId): void {
  const a = w.athletes[id];
  const j = jumpAthlete(a);
  if (j === a) return;
  w.athletes = setAthlete(w.athletes, j);
  w.events.push({ type: 'jump', who: id, x: a.x });
}

export function doSwing(w: Work, id: AthleteId, kind: SwingKind, aim: Aim): void {
  const a = w.athletes[id];
  const s = startSwing(a, kind, aim);
  if (s === a) return;
  w.athletes = setAthlete(w.athletes, s);
  w.events.push({ type: 'swing', who: id, kind });
}

function doDive(w: Work, id: AthleteId, dir: -1 | 1): void {
  const a = w.athletes[id];
  const d = startDive(a, dir);
  if (d === a) return;
  w.athletes = setAthlete(w.athletes, d);
  w.events.push({ type: 'dive', who: id, x: a.x });
}

/** SPACE: in the air a spike; on the sand a hit when the ball is near, a dive when it is low and just out of reach, else a jump. */
function humanControl(w: Work, input: VbInput): number {
  const a = w.athletes.you;
  w.aim = aimOf(input.move);
  if (input.jump) doJump(w, 'you');
  if (input.act) {
    if (!grounded(a)) doSwing(w, 'you', 'air', w.aim);
    else if (closing(a, w.ball, groundDist, groundR(w.ball) + 0.1, R.nearT)) doSwing(w, 'you', 'ground', w.aim);
    else {
      const dir = diveDir(a, w.ball);
      if (dir !== 0 && canTouch(w.touches, 'you')) doDive(w, 'you', dir);
      else doJump(w, 'you');
    }
  }
  return w.athletes.you.dive > 0 ? 0 : input.move * B.run;
}

function applyIntent(w: Work, id: AthleteId, it: Intent): number {
  if (it.jump) doJump(w, id);
  if (it.swing) doSwing(w, id, it.swing, w.ai[id].aim);
  if (it.dive !== 0) doDive(w, id, it.dive);
  return it.want;
}

function controls(w: Work, input: VbInput, dt: number): Wants {
  const wants: Wants = { you: humanControl(w, input), duke: 0, breaker: 0, riptide: 0 };
  for (const id of AI_IDS) {
    wants[id] = applyIntent(w, id, aiIntent(w, id));
    const mem = w.ai[id];
    if (mem.react > 0) w.ai = setMind(w.ai, id, { ...mem, react: Math.max(0, mem.react - dt) });
  }
  return wants;
}

function zoneOf(a: Athlete, b: Ball): { dist: (a: Athlete, b: Ball) => number; r: number } {
  if (a.dive > 0) return { dist: diveDist, r: REACH.dive.r };
  const kind = a.swing?.kind ?? 'ground';
  switch (kind) {
    case 'air': return { dist: airDist, r: REACH.air.r };
    case 'serve': return { dist: serveDist, r: REACH.serve.r };
    case 'ground': return { dist: groundDist, r: groundR(b) };
    default: throw new Error(`unhandled: ${kind satisfies never}`);
  }
}

/** Every live swing connects at the ball's closest point inside its zone; the closest athlete wins a tie. */
export function contacts(w: Work, dt: number): void {
  let best: { a: Athlete; d: number; r: number } | null = null;
  for (const id of ATHLETE_IDS) {
    const a = w.athletes[id];
    if (!swingLive(a) || !a.swing) continue;
    const zone = zoneOf(a, w.ball);
    const d = zone.dist(a, w.ball);
    if (d > zone.r) continue;
    const closest = zone.dist(a, ballAt(w.ball, dt)) >= d || d < 0.12 || a.swing.t + dt > B.swingActive;
    if (!closest || (a.swing.kind !== 'serve' && !canTouch(w.touches, id))) continue;
    if (!best || d < best.d) best = { a, d, r: zone.r };
  }
  if (best) applyHit(w, best.a, best.d, best.r);
}

export function moveAll(w: Work, wants: Wants, dt: number): void {
  let sq = w.athletes;
  for (const id of ATHLETE_IDS) {
    const a = sq[id];
    const n = tickSwing(runAthlete(a, wants[id], dt), dt);
    if (a.y > 0 && n.y <= 0) w.events.push({ type: 'land', who: id, x: n.x });
    sq = setAthlete(sq, n);
  }
  w.athletes = sq;
}

function fly(w: Work, dt: number): void {
  const prev = w.ball;
  const r = flyBall(prev, dt);
  w.ball = r.ball;
  if (r.net) {
    w.netSinceTouch = true;
    w.events.push({ type: 'net', x: r.ball.x, y: r.ball.y });
    newPath(w);
    return;
  }
  tryBlock(w, prev);
}

export function stepLive(w: Work, input: VbInput, dt: number): void {
  const wants = controls(w, input, dt);
  contacts(w, dt);
  moveAll(w, wants, dt);
  fly(w, dt);
  if (w.ball.y <= VB.ballR || Math.abs(w.ball.x) > 14 || w.phaseT > R.rallyMax) endRally(w, w.ball.x);
}
