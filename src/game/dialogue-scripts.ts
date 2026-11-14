import { BOSSES } from '../data/bosses';
import type { MedalId } from '../data/medals';
import { campaignMissions } from '../data/missions';
import type { CampaignId, MissionDef, MissionResult, Objective } from '../data/types';
import { enemyName, medalName, theaterName } from '../i18n/content';
import type { Params } from '../i18n/i18n';
import type { LineKey } from '../i18n/lines-en';
import type { CharacterId, Gesture, Mood } from '../render/portraits';
import type { DiveGrade } from './dive-launch';
import { HULL_BONUS_RATIO } from './economy';
import type { SeparationGrade } from './rocket-launch';
import type { DropGrade } from './drop-launch';

// Which character says what, when (doc 06). Pure: returns line references, never text.

export interface LineRef {
  speaker: CharacterId;
  key: LineKey;
  params?: Params;
  mood: Mood;
  gesture: Gesture;
}

/** The admiral's line when a map's finale is won (docs 35, 48, 65). */
const FINALE: Readonly<Record<CampaignId, LineKey>> = {
  1: 'adm.finale', 2: 'adm.finale2', 3: 'adm.finale3', 4: 'adm.finale4', 5: 'adm.finale5', 6: 'adm.finale6', 7: 'adm.finale7',
};

const ref = (speaker: CharacterId, key: LineKey, mood: Mood, gesture: Gesture, params?: Params): LineRef =>
  ({ speaker, key, mood, gesture, ...(params ? { params } : {}) });

export interface DebriefInput {
  mission: MissionDef;
  result: MissionResult;
  stars: number;
  /** Already formatted, e.g. "$1,800". */
  totalText: string;
  campaignDone: boolean;
  /** Paint jobs this mission unlocked (doc 09), names already in the player's language. */
  liveries?: ReadonlyArray<{ name: string; rare: boolean }>;
  /** The pilot's challenge level went up with this mission (doc 38). */
  challengeUp?: boolean;
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
  for (const l of d.liveries ?? []) {
    lines.push(ref('admiral', l.rare ? 'adm.liveryRare' : 'adm.livery', 'happy', l.rare ? 'thumbsUp' : 'point', { livery: l.name }));
  }
  if (d.challengeUp) lines.push(ref('admiral', 'adm.challengeUp', 'stern', 'point'));
  const list = campaignMissions(m.campaign);
  if (r.success && d.campaignDone && m.id === list[list.length - 1]?.id && m.number % 30 === 0) { // a map ends at m30, m60, …, m210
    lines.push(ref('admiral', FINALE[m.campaign], 'happy', 'salute'));
    if (m.campaign === 1) {
      lines.push(ref('admiral', 'adm.globe', 'neutral', 'point')); // map 2 is open now (doc 35)
      lines.push(ref('admiral', 'adm.newJets', 'happy', 'point')); // and its jets are on sale (doc 36)
    }
    if (m.campaign === 2) lines.push(ref('admiral', 'adm.lowLevel', 'neutral', 'point')); // map 3 is open now (doc 48)
    if (m.campaign === 3) lines.push(ref('admiral', 'adm.deepWater', 'neutral', 'point')); // map 4, under the sea, is open now (doc 74)
    if (m.campaign === 4) lines.push(ref('admiral', 'adm.space', 'neutral', 'point')); // map 5, space, is open now (doc 74)
    if (m.campaign === 5) lines.push(ref('admiral', 'adm.jungle', 'neutral', 'point')); // map 6, the jungle planet (doc 78)
    if (m.campaign === 6) lines.push(ref('admiral', 'adm.steppe', 'neutral', 'point')); // map 7, the alien steppe (doc 102)
  } else if (r.success && m.objective.type === 'boss') {
    const next = list[list.indexOf(m) + 1];
    if (next) lines.push(ref('admiral', 'adm.nextTheater', 'neutral', 'salute', { theater: theaterName(next.theater) }));
  }
  return lines;
}

/** The admiral at the medal ceremony (doc 25): presents the first medal, then "one more" for each further one. */
export function medalLine(index: number, medal: MedalId): LineRef {
  const params = { medal: medalName(medal) };
  return index === 0 ? ref('admiral', 'adm.medal', 'happy', 'salute', params) : ref('admiral', 'adm.medalMore', 'happy', 'thumbsUp', params);
}

export type ChiefEvent =
  | 'hello' | 'helloRich' | 'helloBroke' | 'helloNewJets' | 'helloHelis' | 'helloSubs' | 'helloMechs' | 'helloTanks' | 'buyPlane' | 'buyGun' | 'buySecondary' | 'buyEquipment'
  | 'mount' | 'unmount' | 'select' | 'denied' | 'restricted' | 'idle' | 'painted';

export const CHIEF_EVENTS: Readonly<Record<ChiefEvent, { key: LineKey; mood: Mood; gesture: Gesture }>> = {
  hello: { key: 'chief.hello', mood: 'neutral', gesture: 'none' },
  helloRich: { key: 'chief.helloRich', mood: 'happy', gesture: 'thumbsUp' },
  helloBroke: { key: 'chief.helloBroke', mood: 'stern', gesture: 'none' },
  helloNewJets: { key: 'chief.helloNewJets', mood: 'happy', gesture: 'point' },
  helloHelis: { key: 'chief.helloHelis', mood: 'happy', gesture: 'point' },
  helloSubs: { key: 'chief.helloSubs', mood: 'happy', gesture: 'point' },
  helloMechs: { key: 'chief.helloMechs', mood: 'happy', gesture: 'point' },
  helloTanks: { key: 'chief.helloTanks', mood: 'happy', gesture: 'thumbsUp' },
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
  painted: { key: 'chief.painted', mood: 'happy', gesture: 'thumbsUp' },
};

export function chiefLine(ev: ChiefEvent, params?: Params): LineRef {
  const e = CHIEF_EVENTS[ev];
  return ref('chief', e.key, e.mood, e.gesture, params);
}

/** Major Brennan at the ground base and Dr. Moreau in the lab (docs 82, 83). */
export const majorLine = (key: LineKey, params?: Params): LineRef => ref('major', key, 'happy', 'point', params);
/** Captain Ortega on the radio in a defence (doc 106). */
export const ortegaLine = (key: LineKey, params?: Params): LineRef => ref('ortega', key, 'stern', 'point', params);
/** Dr. Novak in the steppe lab (doc 107). */
export const novakLine = (key: LineKey, params?: Params): LineRef => ref('novak', key, 'happy', 'none', params);
export const docLine = (key: LineKey, params?: Params): LineRef => ref('doc', key, 'happy', 'none', params);

export type ShooterEvent =
  | 'spool' | 'green' | 'notYet' | 'overspeed' | 'locked' | 'waitForIt' | 'go' | 'launch' | 'perfect' | 'good' | 'late'
  // the sub's dive (map 4) and the rocket launch (map 5), doc 76
  | 'flood' | 'dive' | 'divePerfect' | 'diveGood' | 'diveShallow' | 'diveDeep'
  | 'countdown' | 'liftoff' | 'sepPerfect' | 'sepGood' | 'sepEarly' | 'sepLate' | 'orbit'
  // the mech's drop (map 6), doc 84
  | 'bayOpen' | 'drop' | 'dropPerfect' | 'dropGood' | 'dropEarly' | 'dropLate'
  // the ramp start (map 7), doc 109
  | 'rampOpen' | 'rampLights' | 'rampPerfect' | 'rampGood' | 'rampEarly' | 'rampLate';

export const SHOOTER_EVENTS: Readonly<Record<ShooterEvent, { key: LineKey; mood: Mood; gesture: Gesture }>> = {
  spool: { key: 'sh.spool', mood: 'neutral', gesture: 'point' },
  green: { key: 'sh.green', mood: 'happy', gesture: 'thumbsUp' },
  notYet: { key: 'sh.notYet', mood: 'stern', gesture: 'none' },
  overspeed: { key: 'sh.overspeed', mood: 'worried', gesture: 'none' },
  locked: { key: 'sh.locked', mood: 'neutral', gesture: 'salute' },
  waitForIt: { key: 'sh.waitForIt', mood: 'stern', gesture: 'none' },
  go: { key: 'sh.go', mood: 'happy', gesture: 'point' },
  launch: { key: 'sh.launch', mood: 'happy', gesture: 'point' },
  perfect: { key: 'sh.perfect', mood: 'happy', gesture: 'thumbsUp' },
  good: { key: 'sh.good', mood: 'happy', gesture: 'salute' },
  late: { key: 'sh.late', mood: 'neutral', gesture: 'none' },
  flood: { key: 'sh.flood', mood: 'neutral', gesture: 'none' },
  dive: { key: 'sh.dive', mood: 'neutral', gesture: 'point' },
  divePerfect: { key: 'sh.divePerfect', mood: 'happy', gesture: 'thumbsUp' },
  diveGood: { key: 'sh.diveGood', mood: 'happy', gesture: 'salute' },
  diveShallow: { key: 'sh.diveShallow', mood: 'worried', gesture: 'none' },
  diveDeep: { key: 'sh.diveDeep', mood: 'worried', gesture: 'none' },
  countdown: { key: 'sh.countdown', mood: 'neutral', gesture: 'none' },
  liftoff: { key: 'sh.liftoff', mood: 'happy', gesture: 'point' },
  sepPerfect: { key: 'sh.sepPerfect', mood: 'happy', gesture: 'thumbsUp' },
  sepGood: { key: 'sh.sepGood', mood: 'happy', gesture: 'none' },
  sepEarly: { key: 'sh.sepEarly', mood: 'worried', gesture: 'none' },
  sepLate: { key: 'sh.sepLate', mood: 'neutral', gesture: 'none' },
  orbit: { key: 'sh.orbit', mood: 'happy', gesture: 'salute' },
  bayOpen: { key: 'sh.bayOpen', mood: 'neutral', gesture: 'point' },
  drop: { key: 'sh.drop', mood: 'neutral', gesture: 'point' },
  dropPerfect: { key: 'sh.dropPerfect', mood: 'happy', gesture: 'thumbsUp' },
  dropGood: { key: 'sh.dropGood', mood: 'happy', gesture: 'salute' },
  dropEarly: { key: 'sh.dropEarly', mood: 'worried', gesture: 'none' },
  dropLate: { key: 'sh.dropLate', mood: 'worried', gesture: 'none' },
  rampOpen: { key: 'sh.rampOpen', mood: 'neutral', gesture: 'point' },
  rampLights: { key: 'sh.rampLights', mood: 'stern', gesture: 'none' },
  rampPerfect: { key: 'sh.rampPerfect', mood: 'happy', gesture: 'thumbsUp' },
  rampGood: { key: 'sh.rampGood', mood: 'happy', gesture: 'salute' },
  rampEarly: { key: 'sh.rampEarly', mood: 'worried', gesture: 'none' },
  rampLate: { key: 'sh.rampLate', mood: 'worried', gesture: 'none' },
};

export function shooterLine(ev: ShooterEvent): LineRef {
  const e = SHOOTER_EVENTS[ev];
  return ref('shooter', e.key, e.mood, e.gesture);
}

/** Shooter's word on a dive through the gap and on a stage separation (doc 76). */
export const DIVE_CALL: Readonly<Record<DiveGrade, ShooterEvent>> = { perfect: 'divePerfect', good: 'diveGood', early: 'diveShallow', late: 'diveDeep' };
export const SEPARATION_CALL: Readonly<Record<SeparationGrade, ShooterEvent>> = { perfect: 'sepPerfect', good: 'sepGood', early: 'sepEarly', late: 'sepLate' };
export const DROP_CALL: Readonly<Record<DropGrade, ShooterEvent>> = { perfect: 'dropPerfect', good: 'dropGood', early: 'dropEarly', late: 'dropLate' };

export type WingmanEvent =
  | 'startPatrol' | 'startIntercept' | 'startStrike' | 'startBoss' | 'startDefend' | 'halfway' | 'objectiveDone'
  | 'bossWarning' | 'hullLow' | 'special' | 'victory'
  /** First jammer / stealth fighter of the sortie (doc 44). */
  | 'jammer' | 'stealth'
  | 'base' | 'baseLocked' | 'offer' | 'offerNew';

export const WINGMAN_EVENTS: Readonly<Record<WingmanEvent, { key: LineKey; mood: Mood; gesture: Gesture }>> = {
  startPatrol: { key: 'wing.startPatrol', mood: 'neutral', gesture: 'thumbsUp' },
  startIntercept: { key: 'wing.startIntercept', mood: 'neutral', gesture: 'none' },
  startStrike: { key: 'wing.startStrike', mood: 'neutral', gesture: 'point' },
  startBoss: { key: 'wing.startBoss', mood: 'stern', gesture: 'none' },
  startDefend: { key: 'wing.startDefend', mood: 'stern', gesture: 'point' },
  halfway: { key: 'wing.halfway', mood: 'happy', gesture: 'none' },
  objectiveDone: { key: 'wing.objectiveDone', mood: 'happy', gesture: 'thumbsUp' },
  bossWarning: { key: 'wing.bossWarning', mood: 'worried', gesture: 'point' },
  hullLow: { key: 'wing.hullLow', mood: 'worried', gesture: 'none' },
  jammer: { key: 'wing.jammer', mood: 'worried', gesture: 'point' },
  stealth: { key: 'wing.stealth', mood: 'stern', gesture: 'point' },
  special: { key: 'wing.special', mood: 'happy', gesture: 'thumbsUp' },
  victory: { key: 'wing.victory', mood: 'happy', gesture: 'thumbsUp' },
  base: { key: 'wing.base', mood: 'happy', gesture: 'none' },
  baseLocked: { key: 'wing.baseLocked', mood: 'neutral', gesture: 'point' },
  offer: { key: 'wing.offer', mood: 'happy', gesture: 'thumbsUp' },
  offerNew: { key: 'wing.offerNew', mood: 'happy', gesture: 'point' },
};

export function wingmanLine(ev: WingmanEvent, params?: Params): LineRef {
  const e = WINGMAN_EVENTS[ev];
  return ref('wingman', e.key, e.mood, e.gesture, params);
}

/** The wingman off duty: BASE hub and after-mission offers (doc 11). */
export const baseLine = (ev: 'base' | 'baseLocked' | 'offer' | 'offerNew', params?: Params): LineRef => wingmanLine(ev, params);

/** The wingman's opening call, flavoured by the mission objective. */
export function wingmanStart(o: Objective): LineRef {
  switch (o.type) {
    case 'patrol': return wingmanLine('startPatrol');
    case 'intercept': return wingmanLine('startIntercept', { n: o.count });
    case 'strike': return wingmanLine('startStrike', { n: o.count, targets: enemyName(o.target, o.count) });
    case 'boss': return wingmanLine('startBoss', { boss: BOSSES[o.boss].name });
    case 'defend': return wingmanLine('startDefend', { n: o.waves });
    default: throw new Error(`unhandled: ${o satisfies never}`);
  }
}

/** The admiral at a world's celebration (doc 64). */
const CELEBRATE: Readonly<Record<CampaignId, LineKey>> = {
  1: 'adm.celebrate1', 2: 'adm.celebrate2', 3: 'adm.celebrate3', 4: 'adm.celebrate4', 5: 'adm.celebrate5', 6: 'adm.celebrate6', 7: 'adm.celebrate7',
};
export const celebrationLine = (world: CampaignId): LineRef => ref('admiral', CELEBRATE[world], 'happy', 'salute');


/** Duke's lines in a world's welcome film (doc 97), one per shot. */
const INTRO_LINES: Readonly<Partial<Record<CampaignId, readonly LineKey[]>>> = {
  2: ['duke.intro2a', 'duke.intro2b', 'duke.intro2c', 'duke.intro2d'],
  3: ['duke.intro3a', 'duke.intro3b', 'duke.intro3c', 'duke.intro3d'],
  4: ['duke.intro4a', 'duke.intro4b', 'duke.intro4c', 'duke.intro4d'],
  5: ['duke.intro5a', 'duke.intro5b', 'duke.intro5c', 'duke.intro5d'],
  6: ['duke.intro6a', 'duke.intro6b', 'duke.intro6c', 'duke.intro6d'],
  7: ['duke.intro7a', 'duke.intro7b', 'duke.intro7c', 'duke.intro7d'],
};
/** Duke's line for shot `shot` (0–3) of a world's welcome film; null where there is none. */
export function introLine(world: CampaignId, shot: number): LineRef | null {
  const key = INTRO_LINES[world]?.[shot];
  return key ? ref('wingman', key, 'happy', 'none') : null;
}
