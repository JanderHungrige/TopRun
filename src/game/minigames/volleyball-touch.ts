import {
  facingOf, PARTNER, sideSign, TEAM_IDS, TEAM_OF, type Athlete, type AthleteId, type Mood, type SwingKind,
} from './volleyball-athlete';
import { assignNext, canTouch, replan, shotFor, touchNo } from './volleyball-ai';
import { ballAt, isIn, speedOf, yAt, type Ball } from './volleyball-ball';
import { blocks, contactQuality, deflect, REACH, strike, type Aim, type HitKind } from './volleyball-hit';
import { nextServe, otherTeam, rand, type Team } from './volleyball-score';
import { setAthlete, type PointReason, type Squad, type VbStats, type Work } from './volleyball-state';

// Beach Volleyball (doc 21): what a contact does — the kind of hit, its accuracy and target, the touch count,
// the block at the net — and how a rally ends (in / out, the reason, the point, the next server).

/** After any change of the ball's path: assign the next touch and let the AI re-plan. */
export function newPath(w: Work): void {
  w.assigned = assignNext(w);
  replan(w);
}

/** Setter's spot and the attack spot (metres from the net); passes and sets to you go where you are, within range. */
export const SPOTS = Object.freeze({ setter: 1.3, attack: 1.4, youMin: 1.0, youMax: 2.6 });

function passTarget(w: Work, id: AthleteId, kind: HitKind): number {
  if (PARTNER[id] === 'you') return Math.max(-SPOTS.youMax, Math.min(-SPOTS.youMin, w.athletes.you.x));
  return sideSign(TEAM_OF[id]) * (kind === 'set' ? SPOTS.attack : SPOTS.setter);
}

function kindOf(a: Athlete, swing: SwingKind, n: number, aim: Aim): HitKind {
  switch (swing) {
    case 'serve': return 'serve';
    case 'air': return aim === 'short' ? 'tip' : 'spike';
    case 'ground':
      if (n === 1) return a.dive > 0 ? 'dig' : 'pass';
      return n === 2 ? 'set' : 'lob';
    default: throw new Error(`unhandled: ${swing satisfies never}`);
  }
}

/** You: the geometric contact quality; the AI: its rolled accuracy. Hard balls and dives make it worse. */
function accuracy(w: Work, a: Athlete, d: number, r: number): number {
  const speed = speedOf(w.ball);
  const base = a.id === 'you' ? contactQuality(d, r, speed) : w.ai[a.id].acc * contactQuality(0, 1, speed);
  return base * (a.dive > 0 ? 0.6 : 1);
}

/** The athlete connects with the ball `d` from the centre of a zone of radius `r`. */
export function applyHit(w: Work, a: Athlete, d: number, r: number): void {
  const team = TEAM_OF[a.id];
  const n = touchNo(w.touches, team);
  const { aim, depth } = a.id === 'you' ? { aim: w.aim, depth: undefined } : shotFor(w, w.ai[a.id], team);
  const kind = kindOf(a, a.swing?.kind ?? 'ground', n, aim);
  const acc = accuracy(w, a, d, r);
  const [u1, s1] = rand(w.seed);
  const [u2, s2] = rand(s1);
  w.seed = s2;
  const target = kind === 'pass' || kind === 'dig' || kind === 'set' ? passTarget(w, a.id, kind) : 0;
  const at = w.ball;
  w.ball = strike({ kind, x: at.x, y: at.y, dir: facingOf(team), aim, depth, acc, target }, u1, u2);
  w.touches = { team, count: kind === 'serve' ? 3 : n, last: a.id };
  w.lastHit = { who: a.id, kind };
  w.netSinceTouch = false;
  w.athletes = setAthlete(w.athletes, { ...a, swing: a.swing ? { ...a.swing, hit: true } : null, pose: kind, poseT: 0 });
  w.events.push({ type: 'hit', who: a.id, kind, quality: acc, touch: kind === 'serve' ? 0 : n, x: at.x, y: at.y });
  newPath(w);
}

/** A ball that crossed the net this step meets an airborne blocker's hands (never a serve). */
export function tryBlock(w: Work, prev: Ball): void {
  if (prev.vx === 0 || Math.sign(prev.x) === Math.sign(w.ball.x) || w.lastHit?.kind === 'serve') return;
  const tc = -prev.x / prev.vx;
  const crossY = yAt(prev, tc);
  const team: Team = w.ball.x < 0 ? 'home' : 'away';
  for (const id of TEAM_IDS[team]) {
    const b = w.athletes[id];
    if (!blocks(b, crossY) || !canTouch(w.touches, id)) continue;
    const top = b.y + REACH.block.top;
    w.ball = deflect(ballAt(prev, tc), crossY, top);
    w.touches = { team, count: touchNo(w.touches, team), last: id };
    w.lastHit = { who: id, kind: 'block' };
    w.netSinceTouch = false;
    w.athletes = setAthlete(w.athletes, { ...b, pose: 'block', poseT: 0 });
    w.events.push({ type: 'block', who: id, stuff: crossY <= top - REACH.block.soft, x: 0, y: crossY });
    newPath(w);
    return;
  }
}

function moods(sq: Squad, winner: Team): Squad {
  const mood = (id: AthleteId): Mood => (TEAM_OF[id] === winner ? 'cheer' : 'slump');
  return {
    you: { ...sq.you, mood: mood('you') }, duke: { ...sq.duke, mood: mood('duke') },
    breaker: { ...sq.breaker, mood: mood('breaker') }, riptide: { ...sq.riptide, mood: mood('riptide') },
  };
}

function tally(st: VbStats, reason: PointReason): VbStats {
  switch (reason) {
    case 'kill': return { ...st, kills: st.kills + 1 };
    case 'ace': return { ...st, aces: st.aces + 1 };
    case 'block': return { ...st, blocks: st.blocks + 1 };
    case 'out':
    case 'net':
    case 'fault':
    case 'drop': return st;
    default: throw new Error(`unhandled: ${reason satisfies never}`);
  }
}

export function awardPoint(w: Work, team: Team, reason: PointReason, by: AthleteId | null): void {
  w.score = team === 'home' ? { ...w.score, home: w.score.home + 1 } : { ...w.score, away: w.score.away + 1 };
  w.events.push({ type: 'point', team, reason, by });
  w.lastPoint = { team, reason, by };
  if (by === 'you' && team === 'home') w.stats = tally(w.stats, reason);
  w.order = nextServe(w.order, team);
  w.phase = 'dead';
  w.phaseT = 0;
  w.held = false;
  w.assigned = null;
  w.athletes = moods(w.athletes, team);
}

function reasonFor(w: Work, inside: boolean, land: Team, winner: Team): PointReason {
  if (!inside) return 'out';
  if (w.netSinceTouch && w.touches.team === land) return 'net';
  const h = w.lastHit;
  if (!h || TEAM_OF[h.who] !== winner) return 'drop';
  switch (h.kind) {
    case 'serve': return 'ace';
    case 'spike':
    case 'tip': return 'kill';
    case 'block': return 'block';
    case 'pass':
    case 'dig':
    case 'set':
    case 'lob': return 'drop';
    default: throw new Error(`unhandled: ${h.kind satisfies never}`);
  }
}

/** The ball is down at x: in → the other side scores; out → the team that touched it last loses the point. */
export function endRally(w: Work, x: number): void {
  const inside = isIn(x);
  const land: Team = x < 0 ? 'home' : 'away';
  const winner = inside ? otherTeam(land) : otherTeam(w.touches.team ?? w.order.team);
  w.events.push({ type: 'bounce', x, inside });
  awardPoint(w, winner, reasonFor(w, inside, land, winner), w.lastHit?.who ?? null);
}
