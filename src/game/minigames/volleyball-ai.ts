import {
  BODY_RULES as B, facingOf, grounded, PARTNER, sideSign, TEAM_IDS, TEAM_OF, type Athlete, type AthleteId, type SwingKind,
} from './volleyball-athlete';
import { apexOf, ballAt, landingX, netCrossHeight, timeToHeight, VB, xAt, type Ball } from './volleyball-ball';
import { airDist, blocks, diveDir, groundDist, groundR, hardBall, REACH, strike, type Aim } from './volleyball-hit';
import { DUKE_SKILL, otherTeam, rand, type Team } from './volleyball-score';
import type { AiMem, Touches, VbState, Work } from './volleyball-state';

// Beach Volleyball (doc 21): who plays the next touch, where everyone else stands, and what the AI athletes
// (Duke, Breaker, Riptide) do each tick. Decisions that need luck are rolled once per ball path (replan).

const AIMS: readonly Aim[] = ['short', 'mid', 'deep'];
/** Defence against an attack: the net player blocks or drops off to `short`; the back player guesses mid or deep. */
export const COVER = Object.freeze({ short: 2.0, mid: 3.4, deep: 5.4 });
/** Height the AI attacks the ball at (its air zone at the top of the jump). */
export const ATTACK_H = 3.2;
/** Attacks only within this distance of the net. */
export const ATTACK_RANGE = 4.2;
const T_APEX = B.jumpV / B.g;

export const touchNo = (t: Touches, team: Team): number => (t.team === team ? t.count : 0) + 1;
/** Three touches per team, never the same athlete twice in a row. */
export const canTouch = (t: Touches, id: AthleteId): boolean => touchNo(t, TEAM_OF[id]) <= 3 && t.last !== id;
export const skillOf = (s: Pick<VbState, 'skill'>, id: AthleteId): number => (id === 'duke' ? DUKE_SKILL : id === 'you' ? 1 : s.skill);
export const reactTime = (skill: number): number => 0.32 - 0.22 * skill;
export const runSpeed = (id: AthleteId, skill: number): number => (id === 'you' ? B.run : 4.2 + 1.6 * skill);
export const blockChance = (skill: number): number => 0.04 + 0.22 * skill;
/** Chance to get a hand to a hard ball (spike, fast serve) that comes into reach at all. */
export const digChance = (skill: number): number => 0.2 + 0.55 * skill;

export function intercept(b: Ball, h: number): { t: number; x: number } | null {
  const t = timeToHeight(b, h);
  return t === null ? null : { t, x: xAt(b, t) };
}

/** Where the athlete will be after t seconds (ballistic in the air, drifting on the sand). */
function athleteAt(a: Athlete, t: number): Athlete {
  if (grounded(a)) return { ...a, x: a.x + a.vx * t };
  return { ...a, x: a.x + a.vx * t, y: Math.max(0, a.y + a.vy * t - 0.5 * B.g * t * t) };
}

/** The ball comes within `r` of the athlete's zone within `within` seconds (the net ignored). */
export function closing(a: Athlete, b: Ball, dist: (a: Athlete, b: Ball) => number, r: number, within: number): boolean {
  for (let t = 0; t <= within + 1e-9; t += 1 / 30) if (dist(athleteAt(a, t), ballAt(b, t)) <= r) return true;
  return false;
}

/** The next touch after the ball changed its path: the partner, or the receiver closer to where it comes down. */
export function assignNext(w: Work): AthleteId | null {
  const land = landingX(w.ball);
  const team: Team = land < 0 ? 'home' : 'away';
  if (w.touches.team === team) {
    const last = w.touches.last;
    return w.touches.count >= 3 || !last ? null : PARTNER[last];
  }
  const cx = intercept(w.ball, 1.0)?.x ?? land;
  const [a, b] = TEAM_IDS[team];
  const who = Math.abs(w.athletes[a].x - cx) <= Math.abs(w.athletes[b].x - cx) ? a : b;
  if (who === 'you') return who;
  const [u, seed] = rand(w.seed);
  w.seed = seed;
  const err = (1 - skillOf(w, who)) * 0.9 * (2 * u - 1);
  return Math.abs(land) > VB.half + VB.ballR + err ? null : who;
}

/** Rolls every AI athlete's decisions for the new ball path. */
export function replan(w: Work): void {
  let seed = w.seed;
  const roll = (): number => {
    const [u, next] = rand(seed);
    seed = next;
    return u;
  };
  const ai: Record<AthleteId, AiMem> = { ...w.ai };
  for (const id of ['duke', 'breaker', 'riptide'] as const) {
    const k = skillOf(w, id);
    ai[id] = {
      react: reactTime(k), goal: w.athletes[id].x, block: roll() < blockChance(k), blockDelay: 0.05 + (1 - k) * 0.6 * roll(),
      dive: roll() < k, smart: roll() < k, aim: AIMS[Math.floor(roll() * 3)] ?? 'mid', acc: Math.max(0.05, Math.min(1, k - 0.25 + 0.35 * roll())),
      cover: roll() < 0.5 ? COVER.mid : COVER.deep, dig: roll() < digChance(k),
    };
  }
  w.ai = ai;
  w.seed = seed;
}

/**
 * How far an attack with this aim stays out of the defenders' reach along its whole path (they can still run
 * after reacting; a tip gives them time). A block in the way rules the aim out.
 */
function pathMargin(s: Pick<VbState, 'athletes' | 'ball'>, team: Team, shot: Shot): number {
  const { aim, depth } = shot;
  const b = strike({ kind: aim === 'short' ? 'tip' : 'spike', x: s.ball.x, y: s.ball.y, dir: facingOf(team), aim, depth, acc: 0.8, target: 0 }, 0.5, 0.5);
  const opp = TEAM_IDS[otherTeam(team)].map((id) => s.athletes[id]);
  const cross = netCrossHeight(b);
  if (cross !== null && opp.some((o) => blocks(o, cross))) return -20;
  const land = timeToHeight(b, VB.ballR) ?? 0;
  let margin = Infinity;
  for (let t = 0; t <= land; t += 1 / 30) {
    const p = ballAt(b, t);
    for (const o of opp) margin = Math.min(margin, groundDist(o, p) - groundR(p) - 5 * Math.max(0, t - 0.2));
  }
  return margin;
}

/** An attack choice: the aim, and for the AI any landing depth. */
export interface Shot { aim: Aim; depth?: number }
const PRESETS: readonly Shot[] = AIMS.map((aim) => ({ aim }));
/** The AI reads the court finer than the three key aims. */
const AI_SHOTS: readonly Shot[] = [{ aim: 'short' }, ...[2.4, 2.9, 3.4, 3.9, 4.6, 5.3, 6.0, 6.5].map((depth): Shot => ({ aim: 'mid', depth }))];

function bestShot(s: Pick<VbState, 'athletes' | 'ball'>, team: Team, shots: readonly Shot[]): Shot {
  let best: Shot = { aim: 'mid' };
  let top = -Infinity;
  for (const shot of shots) {
    const m = pathMargin(s, team, shot);
    if (m > top) [top, best] = [m, shot];
  }
  return best;
}

/** Of the three aims, the one whose path stays farthest from the defence (the tip when a blocker is up). */
export const openAim = (s: Pick<VbState, 'athletes' | 'ball'>, team: Team): Aim => bestShot(s, team, PRESETS).aim;

/** The AI's attack: read the defence (smart) or its rolled aim. */
export const shotFor = (s: Pick<VbState, 'athletes' | 'ball'>, mem: AiMem, team: Team): Shot => (mem.smart ? bestShot(s, team, AI_SHOTS) : { aim: mem.aim });

/** The athlete of a team who plays at the net while defending. */
export function frontOf(s: Pick<VbState, 'athletes'>, team: Team): AthleteId {
  if (team === 'away') return 'breaker';
  return Math.abs(s.athletes.you.x) < 2.2 ? 'you' : 'duke';
}

export interface Intent {
  want: number;
  jump: boolean;
  swing: SwingKind | null;
  dive: -1 | 0 | 1;
}
const IDLE: Intent = Object.freeze({ want: 0, jump: false, swing: null, dive: 0 });

const toward = (x: number, goal: number, speed: number): number => Math.max(-speed, Math.min(speed, (goal - x) * 8));

function attackIntent(s: Work, a: Athlete, hi: { t: number; x: number }, speed: number): Intent {
  const goal = hi.x - facingOf(TEAM_OF[a.id]) * REACH.air.ahead;
  if (grounded(a)) return { ...IDLE, want: toward(a.x, goal, speed), jump: hi.t <= T_APEX + 0.02 && Math.abs(goal - a.x) < 0.9 };
  return { ...IDLE, want: toward(a.x, goal, speed), swing: closing(a, s.ball, airDist, REACH.air.r * 0.8, 0.1) ? 'air' : null };
}

function playIntent(s: Work, a: Athlete, mem: AiMem, speed: number): Intent {
  const team = TEAM_OF[a.id];
  const n = touchNo(s.touches, team);
  const hi = n === 3 ? intercept(s.ball, ATTACK_H) : null;
  if (hi && Math.abs(hi.x) < ATTACK_RANGE) return attackIntent(s, a, hi, speed);
  const h = n === 2 && apexOf(s.ball) > 2.3 ? 2.0 : 1.1;
  const at = intercept(s.ball, h) ?? intercept(s.ball, 0.5) ?? { t: 0, x: s.ball.x };
  const goal = at.x - facingOf(team) * REACH.ground.ahead;
  const beaten = hardBall(s.ball) && !mem.dig;
  const swing = !beaten && grounded(a) && closing(a, s.ball, groundDist, groundR(s.ball) * 0.85, 0.1) ? 'ground' : null;
  const late = at.t < 0.35 && Math.abs(goal - a.x) > 0.5;
  return { want: toward(a.x, goal, speed), jump: false, swing, dive: !swing && late && mem.dive ? diveDir(a, s.ball) : 0 };
}

function supportGoal(s: Work, id: AthleteId): number {
  const team = TEAM_OF[id];
  const side = sideSign(team);
  if (s.assigned === PARTNER[id]) {
    const n = touchNo(s.touches, team);
    return side * (n === 1 ? 1.3 : n === 2 ? 2.9 : 2.4);
  }
  const opp = otherTeam(team);
  const attack = s.assigned !== null && TEAM_OF[s.assigned] === opp && touchNo(s.touches, opp) >= 2;
  const mem = s.ai[id];
  if (frontOf(s, team) === id) return side * (!attack ? 1.6 : mem.block ? 0.45 : COVER.short);
  return side * (attack ? mem.cover : 4.6);
}

/** Keeps a support spot at least SPACE metres from the partner (in front of or behind them, whichever is nearer). */
const SPACE = 1.2;
function spaced(s: Work, id: AthleteId, goal: number): number {
  const p = s.athletes[PARTNER[id]].x;
  if (Math.abs(goal - p) >= SPACE) return goal;
  const side = sideSign(TEAM_OF[id]);
  const back = p + side * SPACE;
  const front = p - side * SPACE;
  if (Math.abs(front) < B.minGap + 0.2) return back;
  return Math.abs(goal - front) < Math.abs(goal - back) ? front : back;
}

/** Goes up for the block once the opposing attacker has been in the air for the rolled delay. */
function blockJump(s: Work, a: Athlete, mem: AiMem): boolean {
  if (!mem.block || !grounded(a) || Math.abs(a.x) > REACH.block.near) return false;
  const opp = s.assigned;
  if (!opp || TEAM_OF[opp] === TEAM_OF[a.id]) return false;
  const att = s.athletes[opp];
  if (grounded(att) || Math.abs(att.x) > ATTACK_RANGE) return false;
  return (B.jumpV - att.vy) / B.g >= mem.blockDelay;
}

/** What an AI athlete does this tick of a rally. */
export function aiIntent(s: Work, id: AthleteId): Intent {
  const a = s.athletes[id];
  const mem = s.ai[id];
  const speed = runSpeed(id, skillOf(s, id));
  if (a.dive > 0) return IDLE;
  if (mem.react > 0) return { ...IDLE, want: toward(a.x, mem.goal, speed) };
  if (s.assigned === id && canTouch(s.touches, id)) return playIntent(s, a, mem, speed);
  return { ...IDLE, want: toward(a.x, spaced(s, id, supportGoal(s, id)), speed), jump: blockJump(s, a, mem) };
}
