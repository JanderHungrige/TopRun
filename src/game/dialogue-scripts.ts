import { BOSSES } from '../data/bosses';
import { MISSIONS } from '../data/missions';
import type { MissionDef, MissionResult, Objective } from '../data/types';
import { enemyName, theaterName } from '../i18n/content';
import type { Params } from '../i18n/i18n';
import type { LineKey } from '../i18n/lines-en';
import type { CharacterId, Gesture, Mood } from '../render/portraits';
import { HULL_BONUS_RATIO } from './economy';

// Which character says what, when (doc 06). Pure: returns line references, never text.

export interface LineRef {
  speaker: CharacterId;
  key: LineKey;
  params?: Params;
  mood: Mood;
  gesture: Gesture;
}

const ref = (speaker: CharacterId, key: LineKey, mood: Mood, gesture: Gesture, params?: Params): LineRef =>
  ({ speaker, key, mood, gesture, ...(params ? { params } : {}) });

export interface DebriefInput {
  mission: MissionDef;
  result: MissionResult;
  stars: number;
  /** Already formatted, e.g. "$1,800". */
  totalText: string;
  campaignDone: boolean;
}

function opening(r: MissionResult, stars: number): LineRef {
  if (r.aborted) return ref('admiral', 'adm.aborted', 'neutral', 'none');
  if (!r.success) {
    return r.hullRatio <= 0 ? ref('admiral', 'adm.shotDown', 'stern', 'facepalm') : ref('admiral', 'adm.objFailed', 'stern', 'point');
  }
  if (stars >= 3) return ref('admiral', 'adm.open3', 'happy', 'thumbsUp');
  if (stars === 2) return ref('admiral', 'adm.open2', 'happy', 'none');
  return ref('admiral', 'adm.open1', 'neutral', 'none');
}

function detail(m: MissionDef, r: MissionResult): LineRef {
  if (r.bossKilled && m.objective.type === 'boss') {
    return ref('admiral', 'adm.boss', 'happy', 'point', { boss: BOSSES[m.objective.boss].name });
  }
  if (r.takeoff === 'perfect') return ref('admiral', 'adm.perfectLaunch', 'happy', 'none');
  if (r.hullRatio >= HULL_BONUS_RATIO && r.hullRatio >= 0.99) return ref('admiral', 'adm.cleanHull', 'happy', 'none');
  return ref('admiral', 'adm.kills', 'neutral', 'none', { kills: r.kills });
}

/** The admiral's debrief: opening by outcome, one detail on success, the pay, then theater/campaign news. */
export function debriefScript(d: DebriefInput): LineRef[] {
  const { mission: m, result: r } = d;
  const lines: LineRef[] = [opening(r, d.stars)];
  if (r.success) lines.push(detail(m, r));
  lines.push(r.success
    ? ref('admiral', 'adm.pay', 'happy', 'none', { total: d.totalText })
    : ref('admiral', 'adm.salvage', 'neutral', 'none', { total: d.totalText }));
  if (r.success && d.campaignDone && m.number === MISSIONS.length) {
    lines.push(ref('admiral', 'adm.finale', 'happy', 'salute'));
  } else if (r.success && m.objective.type === 'boss') {
    const next = MISSIONS[m.number];
    if (next) lines.push(ref('admiral', 'adm.nextTheater', 'neutral', 'salute', { theater: theaterName(next.theater) }));
  }
  return lines;
}

export type ChiefEvent =
  | 'hello' | 'helloRich' | 'helloBroke' | 'buyPlane' | 'buyGun' | 'buySecondary' | 'buyEquipment'
  | 'mount' | 'unmount' | 'select' | 'denied' | 'restricted' | 'idle';

export const CHIEF_EVENTS: Readonly<Record<ChiefEvent, { key: LineKey; mood: Mood; gesture: Gesture }>> = {
  hello: { key: 'chief.hello', mood: 'neutral', gesture: 'none' },
  helloRich: { key: 'chief.helloRich', mood: 'happy', gesture: 'thumbsUp' },
  helloBroke: { key: 'chief.helloBroke', mood: 'stern', gesture: 'none' },
  buyPlane: { key: 'chief.buyPlane', mood: 'happy', gesture: 'thumbsUp' },
  buyGun: { key: 'chief.buyGun', mood: 'happy', gesture: 'point' },
  buySecondary: { key: 'chief.buySecondary', mood: 'happy', gesture: 'none' },
  buyEquipment: { key: 'chief.buyEquipment', mood: 'happy', gesture: 'point' },
  mount: { key: 'chief.mount', mood: 'neutral', gesture: 'thumbsUp' },
  unmount: { key: 'chief.unmount', mood: 'neutral', gesture: 'none' },
  select: { key: 'chief.select', mood: 'happy', gesture: 'thumbsUp' },
  denied: { key: 'chief.denied', mood: 'stern', gesture: 'point' },
  restricted: { key: 'chief.restricted', mood: 'stern', gesture: 'point' },
  idle: { key: 'chief.idle', mood: 'neutral', gesture: 'none' },
};

export function chiefLine(ev: ChiefEvent, params?: Params): LineRef {
  const e = CHIEF_EVENTS[ev];
  return ref('chief', e.key, e.mood, e.gesture, params);
}

export type ShooterEvent = 'spool' | 'green' | 'overspeed' | 'launch' | 'edge' | 'perfect' | 'good' | 'early' | 'late' | 'ditched';

export const SHOOTER_EVENTS: Readonly<Record<ShooterEvent, { key: LineKey; mood: Mood; gesture: Gesture }>> = {
  spool: { key: 'sh.spool', mood: 'neutral', gesture: 'point' },
  green: { key: 'sh.green', mood: 'neutral', gesture: 'none' },
  overspeed: { key: 'sh.overspeed', mood: 'worried', gesture: 'none' },
  launch: { key: 'sh.launch', mood: 'happy', gesture: 'point' },
  edge: { key: 'sh.edge', mood: 'worried', gesture: 'none' },
  perfect: { key: 'sh.perfect', mood: 'happy', gesture: 'thumbsUp' },
  good: { key: 'sh.good', mood: 'happy', gesture: 'salute' },
  early: { key: 'sh.early', mood: 'neutral', gesture: 'none' },
  late: { key: 'sh.late', mood: 'worried', gesture: 'facepalm' },
  ditched: { key: 'sh.ditched', mood: 'worried', gesture: 'facepalm' },
};

export function shooterLine(ev: ShooterEvent): LineRef {
  const e = SHOOTER_EVENTS[ev];
  return ref('shooter', e.key, e.mood, e.gesture);
}

export type WingmanEvent =
  | 'startPatrol' | 'startIntercept' | 'startStrike' | 'startBoss' | 'halfway' | 'objectiveDone'
  | 'bossWarning' | 'hullLow' | 'special' | 'victory';

export const WINGMAN_EVENTS: Readonly<Record<WingmanEvent, { key: LineKey; mood: Mood; gesture: Gesture }>> = {
  startPatrol: { key: 'wing.startPatrol', mood: 'neutral', gesture: 'thumbsUp' },
  startIntercept: { key: 'wing.startIntercept', mood: 'neutral', gesture: 'none' },
  startStrike: { key: 'wing.startStrike', mood: 'neutral', gesture: 'point' },
  startBoss: { key: 'wing.startBoss', mood: 'stern', gesture: 'none' },
  halfway: { key: 'wing.halfway', mood: 'happy', gesture: 'none' },
  objectiveDone: { key: 'wing.objectiveDone', mood: 'happy', gesture: 'thumbsUp' },
  bossWarning: { key: 'wing.bossWarning', mood: 'worried', gesture: 'point' },
  hullLow: { key: 'wing.hullLow', mood: 'worried', gesture: 'none' },
  special: { key: 'wing.special', mood: 'happy', gesture: 'thumbsUp' },
  victory: { key: 'wing.victory', mood: 'happy', gesture: 'thumbsUp' },
};

export function wingmanLine(ev: WingmanEvent, params?: Params): LineRef {
  const e = WINGMAN_EVENTS[ev];
  return ref('wingman', e.key, e.mood, e.gesture, params);
}

/** The wingman's opening call, flavoured by the mission objective. */
export function wingmanStart(o: Objective): LineRef {
  switch (o.type) {
    case 'patrol': return wingmanLine('startPatrol');
    case 'intercept': return wingmanLine('startIntercept', { n: o.count });
    case 'strike': return wingmanLine('startStrike', { n: o.count, targets: enemyName(o.target, o.count) });
    case 'boss': return wingmanLine('startBoss', { boss: BOSSES[o.boss].name });
    default: throw new Error(`unhandled: ${o satisfies never}`);
  }
}
