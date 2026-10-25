import { createRng, type Rng } from '../../src/core/rng';
import { createVolleyball, NO_INPUT, stepVolleyball, type VbInput, type VbState } from '../../src/game/minigames/volleyball';
import { openAim } from '../../src/game/minigames/volleyball-ai';
import { landingX, timeToHeight, VB, xAt, type Ball } from '../../src/game/minigames/volleyball-ball';
import { hardBall, REACH, type Aim } from '../../src/game/minigames/volleyball-hit';
import { vbScore } from '../../src/game/minigames/volleyball-score';

// Beach Volleyball balance (doc 21): simulated human players that read the ball like a person would — late
// (reaction time), imprecisely (timing and positioning noise, sampled once per touch) — and press keys.

export interface BotSkill {
  /** Seconds before the bot reacts to a new ball (hit, net, block). */
  react: number;
  /** Std. dev. of the moment SPACE is pressed (s). */
  timing: number;
  /** Std. dev. of where the bot stands (m). */
  place: number;
  /** Std. dev. of the jump moment (s). */
  jumpErr: number;
  /** Chance to attack (jump + spike) when the second / third touch allows it, else a ground hit. */
  attack: number;
  /** Chance to aim at the open spot instead of the middle. */
  smart: number;
}

export const BOTS = {
  novice: { react: 0.34, timing: 0.11, place: 0.45, jumpErr: 0.14, attack: 0.5, smart: 0 },
  casual: { react: 0.26, timing: 0.075, place: 0.3, jumpErr: 0.09, attack: 0.8, smart: 0.3 },
  good: { react: 0.2, timing: 0.05, place: 0.18, jumpErr: 0.06, attack: 1, smart: 0.6 },
  pro: { react: 0.14, timing: 0.03, place: 0.1, jumpErr: 0.035, attack: 1, smart: 0.9 },
} as const satisfies Readonly<Record<string, BotSkill>>;
export type BotName = keyof typeof BOTS;

const gauss = (rng: Rng): number => Math.sqrt(-2 * Math.log(1 - rng.next())) * Math.cos(2 * Math.PI * rng.next());

interface Plan { air: boolean; smart: boolean; dx: number; dt: number; jt: number; aim: Aim; pressed: boolean; jumped: boolean }

const nextTouch = (s: VbState): number => (s.touches.team === 'home' ? s.touches.count : 0) + 1;

/** Where the ball comes down through height h, and when. */
function intercept(b: Ball, h: number): { t: number; x: number } | null {
  const t = timeToHeight(b, h);
  return t === null ? null : { t, x: xAt(b, t) };
}

/** A smart player reads the defence like the AI does: the aim whose path stays out of their reach. */
const readDefence = (s: VbState): Aim => openAim(s, 'home');

function plan(s: VbState, k: BotSkill, rng: Rng): Plan {
  const n = nextTouch(s);
  const hi = intercept(s.ball, 3.2);
  const air = n >= 2 && hi !== null && hi.x > -4.2 && hi.x < -0.3 && rng.chance(k.attack);
  const smart = air && rng.chance(k.smart);
  const aim: Aim = smart ? readDefence(s) : 'mid';
  return { air, smart, dx: gauss(rng) * k.place, dt: gauss(rng) * k.timing, jt: gauss(rng) * k.jumpErr, aim, pressed: false, jumped: false };
}

const steer = (from: number, to: number): number => Math.max(-1, Math.min(1, (to - from) * 4));
const aimMove = (aim: Aim): number => (aim === 'deep' ? 1 : aim === 'short' ? -1 : 0);

function playGround(s: VbState, p: Plan): VbInput {
  const you = s.athletes.you;
  const at = intercept(s.ball, 1.2) ?? intercept(s.ball, 0.5);
  if (!at) return NO_INPUT;
  const goal = at.x - REACH.ground.ahead + p.dx;
  const press = !p.pressed && at.t <= 0.12 + p.dt;
  if (press) p.pressed = true;
  return { move: Math.abs(goal - you.x) < 0.05 ? 0 : steer(you.x, goal), jump: false, act: press };
}

function playAir(s: VbState, p: Plan): VbInput {
  const you = s.athletes.you;
  const at = intercept(s.ball, 3.2);
  if (!at) return playGround(s, p);
  const goal = at.x - REACH.air.ahead + p.dx;
  if (you.y <= 0 && !p.jumped) {
    const jump = at.t <= 0.4 + p.jt;
    if (jump) p.jumped = true;
    return { move: steer(you.x, goal), jump, act: false };
  }
  const press = !p.pressed && you.y > 0 && at.t <= 0.1 + p.dt;
  if (press) p.pressed = true;
  if (p.smart) p.aim = readDefence(s);
  return { move: aimMove(p.aim), jump: false, act: press };
}

function support(s: VbState): VbInput {
  const you = s.athletes.you;
  const ours = landingX(s.ball) < 0 || s.ball.x < 0;
  const goal = ours && s.assigned === 'duke' ? -2.8 : -4.4;
  return { move: Math.abs(goal - you.x) < 0.1 ? 0 : steer(you.x, goal) * 0.8, jump: false, act: false };
}

function serve(s: VbState, k: BotSkill, rng: Rng, mem: { serveAt: number | null }): VbInput {
  if (s.held) {
    mem.serveAt = null;
    return { ...NO_INPUT, act: s.phaseT >= 0.6 };
  }
  mem.serveAt ??= 0.06 + gauss(rng) * k.timing;
  const tApex = s.ball.vy / VB.g;
  return { ...NO_INPUT, act: tApex <= mem.serveAt && s.ball.y > 1.6 };
}

export type Pilot = (s: VbState) => VbInput;

export function makeBot(k: BotSkill, seed: number): Pilot {
  const rng = createRng(seed);
  const mem = { serveAt: null as number | null, wait: 0, plan: null as Plan | null, key: '' };
  return (s) => {
    if (s.phase === 'serve') return s.order.team === 'home' && s.order.home === 0 ? serve(s, k, rng, mem) : NO_INPUT;
    if (s.phase !== 'live') return NO_INPUT;
    if (s.events.some((e) => e.type === 'hit' || e.type === 'net' || e.type === 'block')) mem.wait = k.react * (hardBall(s.ball) ? 1.6 : 1);
    mem.wait = Math.max(0, mem.wait - 1 / 60);
    if (mem.wait > 0) return NO_INPUT;
    if (s.assigned !== 'you') {
      mem.plan = null;
      return support(s);
    }
    const key = `${s.touches.team}${s.touches.count}${s.touches.last}${s.rally}`;
    if (!mem.plan || mem.key !== key) {
      mem.plan = plan(s, k, rng);
      mem.key = key;
    }
    return mem.plan.air ? playAir(s, mem.plan) : playGround(s, mem.plan);
  };
}

export interface MatchResult { home: number; away: number; score: number; seconds: number }

/** Plays one full match with the pilot (null = a player who does nothing). */
export function playMatch(seed: number, pilot: Pilot | null, maxSeconds = 1200): MatchResult {
  let s = createVolleyball(seed);
  const steps = maxSeconds * 60;
  for (let i = 0; i < steps && s.phase !== 'over'; i++) s = stepVolleyball(s, pilot ? pilot(s) : NO_INPUT, 1 / 60);
  return { home: s.score.home, away: s.score.away, score: vbScore(s.score), seconds: s.t };
}
