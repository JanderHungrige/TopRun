import { BODY_RULES as B, facingOf, runAthlete, tickSwing, TEAM_OF, type AthleteId } from './volleyball-athlete';
import { closing, replan } from './volleyball-ai';
import { ballAt, VB } from './volleyball-ball';
import { REACH, serveDist } from './volleyball-hit';
import { aimOf, contacts, doSwing, moveAll, stepLive, type Wants } from './volleyball-rally';
import { FIRST_SERVE, matchWinner, otherTeam, rivalSkill } from './volleyball-score';
import {
  FRESH_MIND, heldBall, serverOf, serveSpot, squadAt, VB_RULES as R, type VbInput, type VbState, type Work,
} from './volleyball-state';
import { awardPoint } from './volleyball-touch';

// Beach Volleyball (doc 21): the round — serve → rally → point → … → match over. createVolleyball /
// stepVolleyball are pure and deterministic for a seed; each step lists its events for the scene.

export { NO_INPUT, VB_RULES } from './volleyball-state';
export type { PointReason, VbEvent, VbInput, VbPhase, VbState } from './volleyball-state';
export { VB_MEDALS } from './volleyball-score';

const still = (): Wants => ({ you: 0, duke: 0, breaker: 0, riptide: 0 });

function startServe(w: Work): void {
  const id = serverOf(w.order);
  w.phase = 'serve';
  w.phaseT = 0;
  w.held = true;
  w.tosses = 0;
  w.rally += 1;
  w.skill = rivalSkill(w.score);
  w.athletes = squadAt(w.order);
  w.ball = heldBall(w.athletes[id]);
  w.touches = { team: null, count: 0, last: null };
  w.assigned = null;
  w.lastHit = null;
  w.netSinceTouch = false;
  replan(w);
  w.events.push({ type: 'serve', who: id });
}

export function createVolleyball(seed: number): VbState {
  const w: Work = {
    t: 0, seed: (seed ^ 0x51ed270b) >>> 0, phase: 'serve', phaseT: 0, ball: { x: 0, y: 0, vx: 0, vy: 0 }, held: true,
    athletes: squadAt(FIRST_SERVE), ai: { you: FRESH_MIND, duke: FRESH_MIND, breaker: FRESH_MIND, riptide: FRESH_MIND },
    touches: { team: null, count: 0, last: null }, assigned: null, lastHit: null, netSinceTouch: false,
    score: { home: 0, away: 0 }, order: FIRST_SERVE, tosses: 0, lastPoint: null, rally: 0, skill: 0, aim: 'mid',
    stats: { kills: 0, aces: 0, blocks: 0 }, events: [],
  };
  startServe(w);
  return w;
}

function toss(w: Work, id: AthleteId): void {
  const a = w.athletes[id];
  const f = facingOf(TEAM_OF[id]);
  w.held = false;
  w.ball = { x: a.x + f * 0.15, y: R.tossY, vx: f * R.tossVx, vy: R.tossV };
  w.events.push({ type: 'toss', who: id });
}

/** The toss came down untouched: caught the first time, a serve fault the second. */
function caught(w: Work, id: AthleteId): void {
  w.tosses += 1;
  if (w.tosses >= 2) return awardPoint(w, otherTeam(w.order.team), 'fault', id);
  w.held = true;
  w.phaseT = 0;
  w.ball = heldBall(w.athletes[id]);
  w.events.push({ type: 'catch', who: id });
}

function stepServe(w: Work, input: VbInput, dt: number): void {
  const id = serverOf(w.order);
  w.aim = aimOf(input.move);
  if (w.held) {
    const go = id === 'you' ? input.act || w.phaseT >= R.autoToss : w.phaseT >= R.serveDelay;
    if (go) toss(w, id);
  } else if (id === 'you' ? input.act : closing(w.athletes[id], w.ball, serveDist, REACH.serve.r * 0.6, 0.08)) {
    doSwing(w, id, 'serve', id === 'you' ? w.aim : w.ai[id].aim);
  }
  const wants = still();
  if (id !== 'you') wants.you = input.move * B.run;
  if (!w.held) contacts(w, dt);
  moveAll(w, wants, dt);
  if (w.lastHit?.kind === 'serve') {
    w.phase = 'live';
    w.phaseT = 0;
    return;
  }
  if (w.held) return;
  w.ball = ballAt(w.ball, dt);
  if (w.ball.y < R.catchY && w.ball.vy < 0) caught(w, id);
}

function stepDead(w: Work, dt: number): void {
  if (w.phaseT >= R.deadTime) {
    const winner = matchWinner(w.score);
    if (!winner) return startServe(w);
    w.phase = 'over';
    w.phaseT = 0;
    w.events.push({ type: 'over', winner });
    return;
  }
  const wants = still();
  if (w.phaseT >= R.walkFrom) {
    for (const id of ['you', 'duke', 'breaker', 'riptide'] as const) {
      const d = serveSpot(w.order, id) - w.athletes[id].x;
      wants[id] = Math.abs(d) < 0.05 ? 0 : Math.sign(d) * Math.min(R.walkSpeed, Math.abs(d) * 6);
    }
  }
  moveAll(w, wants, dt);
  rest(w, dt);
}

/** The ball after the rally: rolls out on the sand. */
function rest(w: Work, dt: number): void {
  const b = w.ball;
  if (b.y > VB.ballR) {
    w.ball = ballAt(b, dt);
    if (w.ball.y < VB.ballR) w.ball = { ...w.ball, y: VB.ballR, vy: 0 };
    return;
  }
  w.ball = { x: b.x + b.vx * dt, y: VB.ballR, vx: b.vx * Math.exp(-3 * dt), vy: 0 };
}

function stepOver(w: Work, dt: number): void {
  let sq = w.athletes;
  for (const id of ['you', 'duke', 'breaker', 'riptide'] as const) sq = { ...sq, [id]: tickSwing(runAthlete(sq[id], 0, dt), dt) };
  w.athletes = sq;
  rest(w, dt);
}

export function stepVolleyball(s: VbState, input: VbInput, dt: number): VbState {
  const w: Work = { ...s, t: s.t + dt, phaseT: s.phaseT + dt, events: [] };
  switch (w.phase) {
    case 'serve': stepServe(w, input, dt); break;
    case 'live': stepLive(w, input, dt); break;
    case 'dead': stepDead(w, dt); break;
    case 'over': stepOver(w, dt); break;
    default: throw new Error(`unhandled: ${w.phase satisfies never}`);
  }
  return w;
}
