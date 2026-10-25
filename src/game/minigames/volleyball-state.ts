import {
  facingOf, makeAthlete, sideSign, TEAM_IDS, TEAM_OF, type Athlete, type AthleteId, type SwingKind,
} from './volleyball-athlete';
import type { Ball } from './volleyball-ball';
import type { Aim, HitKind } from './volleyball-hit';
import type { MatchScore, ServeOrder, Team } from './volleyball-score';

// Beach Volleyball (doc 21): the round's state, its events and input, the shared timing constants and where
// everyone stands for a serve. Types and small pure helpers only.

export const VB_RULES = Object.freeze({
  /** AI servers toss after this long; your serve tosses by itself after autoToss. */
  serveDelay: 1.1,
  autoToss: 4,
  /** Pause after a point; everyone walks back to the serve positions from walkFrom. */
  deadTime: 2.0,
  walkFrom: 0.9,
  walkSpeed: 3.4,
  serverX: 7.8,
  partnerX: 1.8,
  frontX: 2.0,
  backX: 5.0,
  /** SPACE hits instead of jumping when the ball will be in reach within this many seconds. */
  nearT: 0.4,
  /** The toss: from this height, this fast up, a little forward; caught again below catchY. */
  tossY: 1.6,
  tossV: 4.4,
  tossVx: 0.3,
  catchY: 0.9,
  /** Safety: a rally never lasts longer. */
  rallyMax: 40,
});
const R = VB_RULES;

export type VbPhase = 'serve' | 'live' | 'dead' | 'over';
export type PointReason = 'ace' | 'kill' | 'block' | 'out' | 'net' | 'fault' | 'drop';

export interface Touches {
  /** The team that touched the ball last (null before the serve). */
  team: Team | null;
  count: number;
  last: AthleteId | null;
}

export interface LastHit {
  who: AthleteId;
  kind: HitKind;
}

/** What an AI athlete decided when the ball last changed its path (rolled once, seeded). */
export interface AiMem {
  /** Seconds until it reacts. */
  react: number;
  /** Where it heads while reacting. */
  goal: number;
  /** Goes up for the block against the coming attack. */
  block: boolean;
  /** Seconds after the attacker's take-off it jumps for the block. */
  blockDelay: number;
  /** Dives for a ball it can't reach on its feet. */
  dive: boolean;
  /** Aims at the open spot (else at `aim`). */
  smart: boolean;
  aim: Aim;
  /** Accuracy of its next touch, before the hard-ball penalty. */
  acc: number;
  /** Back-court spot it covers against the coming attack (metres from the net). */
  cover: number;
  /** Gets a hand to a hard ball this time. */
  dig: boolean;
}

export type VbEvent =
  | { type: 'serve'; who: AthleteId }
  | { type: 'toss'; who: AthleteId }
  | { type: 'catch'; who: AthleteId }
  | { type: 'swing'; who: AthleteId; kind: SwingKind }
  | { type: 'hit'; who: AthleteId; kind: HitKind; quality: number; touch: number; x: number; y: number }
  | { type: 'jump'; who: AthleteId; x: number }
  | { type: 'dive'; who: AthleteId; x: number }
  | { type: 'land'; who: AthleteId; x: number }
  | { type: 'net'; x: number; y: number }
  | { type: 'block'; who: AthleteId; stuff: boolean; x: number; y: number }
  | { type: 'bounce'; x: number; inside: boolean }
  | { type: 'point'; team: Team; reason: PointReason; by: AthleteId | null }
  | { type: 'over'; winner: Team };

/** One tick of your input: run direction −1 … 1, jump pressed, SPACE / tap pressed. */
export interface VbInput {
  move: number;
  jump: boolean;
  act: boolean;
}
export const NO_INPUT: VbInput = Object.freeze({ move: 0, jump: false, act: false });

export type Squad = Readonly<Record<AthleteId, Athlete>>;
export type Minds = Readonly<Record<AthleteId, AiMem>>;

export interface VbStats {
  kills: number;
  aces: number;
  blocks: number;
}

export interface VbState {
  t: number;
  seed: number;
  phase: VbPhase;
  phaseT: number;
  ball: Ball;
  /** The server holds the ball (serve phase, before the toss). */
  held: boolean;
  athletes: Squad;
  ai: Minds;
  touches: Touches;
  /** Who plays the next touch; null = nobody (an AI leaving a ball it judges out, no touch left). */
  assigned: AthleteId | null;
  lastHit: LastHit | null;
  /** The ball touched the net since the last hit. */
  netSinceTouch: boolean;
  score: MatchScore;
  order: ServeOrder;
  /** Missed tosses in this serve. */
  tosses: number;
  lastPoint: { team: Team; reason: PointReason; by: AthleteId | null } | null;
  /** Rallies started (1 = the first serve). */
  rally: number;
  /** The rivals' skill this rally. */
  skill: number;
  /** Your aim (from the held direction) this tick. */
  aim: Aim;
  /** Your points by kind. */
  stats: VbStats;
  events: readonly VbEvent[];
}

/** A step's working copy: top-level fields are replaced, nested objects never mutated. */
export type Work = Omit<VbState, 'events'> & { events: VbEvent[] };

export const serverOf = (o: ServeOrder): AthleteId => TEAM_IDS[o.team][o[o.team]];

/** Who receives at the net (the other one receives deep). */
const RECEIVE_FRONT: Readonly<Record<Team, AthleteId>> = { home: 'duke', away: 'breaker' };

/** Where an athlete stands for the serve. */
export function serveSpot(o: ServeOrder, id: AthleteId): number {
  const team = TEAM_OF[id];
  const side = sideSign(team);
  if (team === o.team) return side * (id === serverOf(o) ? R.serverX : R.partnerX);
  return side * (id === RECEIVE_FRONT[team] ? R.frontX : R.backX);
}

/** The ball in the server's hand. */
export function heldBall(server: Athlete): Ball {
  return { x: server.x + facingOf(TEAM_OF[server.id]) * 0.25, y: 1.15, vx: 0, vy: 0 };
}

export const setAthlete = (sq: Squad, a: Athlete): Squad => ({ ...sq, [a.id]: a });
export const setMind = (m: Minds, id: AthleteId, mem: AiMem): Minds => ({ ...m, [id]: mem });

export const FRESH_MIND: AiMem = Object.freeze({
  react: 0, goal: 0, block: false, blockDelay: 0, dive: false, smart: false, aim: 'mid', acc: 0.5, cover: 4.6, dig: true,
});

export function squadAt(o: ServeOrder): Squad {
  const a = (id: AthleteId): Athlete => makeAthlete(id, serveSpot(o, id));
  return { you: a('you'), duke: a('duke'), breaker: a('breaker'), riptide: a('riptide') };
}
