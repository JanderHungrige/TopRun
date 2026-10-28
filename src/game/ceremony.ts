// Medal ceremony timeline (doc 25). Pure: what the cast does when, which cues fire, and how input and time
// move the ceremony from medal to medal. The scene plays the cues and draws the beats.

/** Input is ignored this long after the ceremony starts (a held key from the previous screen). */
export const GUARD = 0.5;
/** …and this long after each close-up appears. */
export const CLOSEUP_GUARD = 0.35;
/** A close-up whose text is fully shown moves on by itself after this many seconds. */
export const AUTO_NEXT = 9;

export type Stage = 'scene' | 'closeup' | 'done';
export type CueId = 'pin' | 'fanfare' | 'salute' | 'closeup';

export interface CeremonyState {
  readonly count: number;
  /** The medal being awarded (0-based). */
  readonly index: number;
  readonly stage: Stage;
  /** Seconds into the current stage. */
  readonly t: number;
  /** Seconds since the ceremony started (input guard). */
  readonly age: number;
  /** Seconds the current close-up has waited with all its text shown. */
  readonly idle: number;
}

export interface CeremonyInput {
  confirm: boolean;
  back: boolean;
  /** The close-up's citation and the admiral's line are fully typed. */
  typed: boolean;
}

export interface CeremonyStep {
  state: CeremonyState;
  /** Cues crossed this step, in time order (a skip fires the ones it jumped over). */
  cues: CueId[];
  /** CONFIRM during typing: the scene completes the close-up's text. */
  finishText: boolean;
}

/** What the cast is doing at one moment of the scene stage. */
export interface Beat {
  /** Admiral walk-in: 0 = off-screen right … 1 = in front of the pilot. */
  walk: number;
  walking: boolean;
  /** 0 = beside the pilot facing them … 1 = stepped back, facing front. */
  back: number;
  /** Pinning arm: 0 = down … 1 = at the pilot's chest. */
  reach: number;
  /** The current medal is on the pilot's chest. */
  pinned: boolean;
  /** Salute of pilot and admiral: 0 = at attention … 1 = hand at the brow. */
  salute: number;
  /** The crew in the back salute once the two have finished (owner, 2026-10-28): 0 … 1. */
  crew: number;
}

interface Timeline {
  walk: readonly [number, number] | null;
  stepIn: readonly [number, number] | null;
  reachUp: readonly [number, number];
  pin: number;
  reachDown: readonly [number, number];
  stepBack: readonly [number, number];
  saluteUp: readonly [number, number] | null;
  saluteDown: readonly [number, number] | null;
  crewUp: readonly [number, number] | null;
  crewDown: readonly [number, number] | null;
  end: number;
}

/** The first medal: the admiral walks up, pins it, both salute, then the crew in the back salute (~9 s). */
export const FIRST: Timeline = {
  walk: [0.5, 2.5], stepIn: null, reachUp: [2.9, 3.6], pin: 3.6, reachDown: [3.6, 4.3], stepBack: [4.3, 4.7],
  saluteUp: [4.7, 4.95], saluteDown: [6.6, 6.9], crewUp: [6.9, 7.15], crewDown: [8.2, 8.45], end: 8.9,
};
/** Every further medal: a quick pin, then its close-up. */
export const MORE: Timeline = {
  walk: null, stepIn: [0, 0.3], reachUp: [0.3, 0.9], pin: 0.9, reachDown: [0.9, 1.5], stepBack: [1.5, 1.9],
  saluteUp: null, saluteDown: null, crewUp: null, crewDown: null, end: 2.4,
};

export const timelineOf = (index: number): Timeline => (index === 0 ? FIRST : MORE);
export const sceneLength = (index: number): number => timelineOf(index).end;

const smooth = (u: number): number => u * u * (3 - 2 * u);
/** 0 before the span, 1 after it, eased in between; a missing span counts as already done. */
function ramp(t: number, span: readonly [number, number] | null): number {
  if (!span) return 1;
  const [a, b] = span;
  return smooth(Math.max(0, Math.min(1, (t - a) / (b - a))));
}
const rampOrZero = (t: number, span: readonly [number, number] | null): number => (span ? ramp(t, span) : 0);

/** The cast's pose `t` seconds into the scene stage of medal `index`. */
export function beatAt(index: number, t: number): Beat {
  const tl = timelineOf(index);
  const walk = ramp(t, tl.walk);
  const stepIn = tl.stepIn ? ramp(t, tl.stepIn) : 1;
  return {
    walk,
    walking: tl.walk !== null && t > tl.walk[0] && t < tl.walk[1],
    back: Math.max(0, Math.min(1, (tl.stepIn ? 1 - stepIn : 0) + ramp(t, tl.stepBack))),
    reach: ramp(t, tl.reachUp) - ramp(t, tl.reachDown),
    pinned: t >= tl.pin,
    salute: rampOrZero(t, tl.saluteUp) - rampOrZero(t, tl.saluteDown),
    crew: rampOrZero(t, tl.crewUp) - rampOrZero(t, tl.crewDown),
  };
}

/** The cues of medal `index`'s scene stage that fall in (t0, t1]. */
export function cuesBetween(index: number, t0: number, t1: number): CueId[] {
  const tl = timelineOf(index);
  const marks: [number, CueId][] = [[tl.pin, 'pin']];
  if (index === 0) marks.push([tl.pin, 'fanfare']);
  if (tl.saluteUp) marks.push([tl.saluteUp[0], 'salute']);
  return marks.filter(([at]) => at > t0 && at <= t1).sort((a, b) => a[0] - b[0]).map(([, c]) => c);
}

export function startCeremony(count: number): CeremonyState {
  return { count, index: 0, stage: count > 0 ? 'scene' : 'done', t: 0, age: 0, idle: 0 };
}

function nextMedal(s: CeremonyState, age: number): CeremonyState {
  if (s.index + 1 >= s.count) return { ...s, stage: 'done', age };
  return { ...s, index: s.index + 1, stage: 'scene', t: 0, age, idle: 0 };
}

function stepScene(s: CeremonyState, dt: number, skip: boolean, age: number): CeremonyStep {
  const len = sceneLength(s.index);
  const t1 = skip ? Math.max(len, s.t) : s.t + dt;
  const cues = cuesBetween(s.index, s.t, t1);
  if (t1 < len) return { state: { ...s, t: t1, age }, cues, finishText: false };
  return { state: { ...s, stage: 'closeup', t: 0, age, idle: 0 }, cues: [...cues, 'closeup'], finishText: false };
}

function stepCloseup(s: CeremonyState, dt: number, inp: CeremonyInput, ready: boolean, age: number): CeremonyStep {
  const t = s.t + dt;
  const idle = inp.typed ? s.idle + dt : 0;
  if (inp.confirm && ready && t >= CLOSEUP_GUARD) {
    if (!inp.typed) return { state: { ...s, t, age, idle }, cues: [], finishText: true };
    return { state: nextMedal(s, age), cues: [], finishText: false };
  }
  if (idle >= AUTO_NEXT) return { state: nextMedal(s, age), cues: [], finishText: false };
  return { state: { ...s, t, age, idle }, cues: [], finishText: false };
}

/** Advances the ceremony by `dt` seconds with this frame's input. */
export function stepCeremony(s: CeremonyState, dt: number, inp: CeremonyInput): CeremonyStep {
  if (s.stage === 'done') return { state: s, cues: [], finishText: false };
  const age = s.age + dt;
  const ready = age >= GUARD;
  if (inp.back && ready) return { state: { ...s, stage: 'done', age }, cues: [], finishText: false };
  switch (s.stage) {
    case 'scene': return stepScene(s, dt, inp.confirm && ready, age);
    case 'closeup': return stepCloseup(s, dt, inp, ready, age);
    default: throw new Error(`unhandled: ${s.stage satisfies never}`);
  }
}
