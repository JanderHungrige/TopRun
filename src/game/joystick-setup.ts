import {
  defaultProfile, JOY_ACTIONS, withCenter, type AxisBind, type ButtonBind, type JoyAction, type JoyProfile, type PadFrame,
} from './joystick';

// JOYSTICK setup screen logic (doc 01): detects the stick axes, throttle and buttons step by step
// from raw controller frames. Pure state machine.

export type SetupStep = 'right' | 'back' | 'fire' | 'throttle' | 'missile' | 'flare' | 'special' | 'switch' | 'cycle' | 'pause' | 'done';
export const SETUP_STEPS: readonly Exclude<SetupStep, 'done'>[] = Object.freeze([
  'right', 'back', 'fire', 'throttle', 'missile', 'flare', 'special', 'switch', 'cycle', 'pause',
] as const);

/** How far an axis must move from where it was when the step started to count as the stick. */
export const AXIS_MOVE = 0.3;
/** End-to-end travel a throttle axis must show during its step. */
export const THROTTLE_TRAVEL = 0.8;

export type SetupError = { kind: 'used'; by: JoyAction } | { kind: 'noThrottle' };

type Values = Readonly<Record<string, number>>;

export interface SetupState {
  step: SetupStep;
  x: AxisBind | null;
  y: AxisBind | null;
  throttle: AxisBind | null;
  buttons: Record<JoyAction, ButtonBind | null>;
  /** Per `pad#axis`: value when the step started, and the lowest / highest value seen since. */
  baseline: Values;
  lo: Values;
  hi: Values;
  prevButtons: Readonly<Record<string, boolean>>;
  error: SetupError | null;
}

interface AxisRead {
  key: string;
  pad: string;
  index: number;
  v: number;
}

const keyOf = (pad: string, index: number): string => `${pad}#${index}`;
const same = (a: { pad: string; index: number } | null, b: { pad: string; index: number }): boolean =>
  a !== null && a.pad === b.pad && a.index === b.index;

function axesOf(frames: readonly PadFrame[]): AxisRead[] {
  return frames.flatMap((f) => f.axes.map((v, index) => ({ key: keyOf(f.id, index), pad: f.id, index, v })));
}

function pressedKeys(frames: readonly PadFrame[]): Record<string, boolean> {
  const out: Record<string, boolean> = {};
  for (const f of frames) f.buttons.forEach((down, i) => { out[keyOf(f.id, i)] = down; });
  return out;
}

function risingEdges(prev: Readonly<Record<string, boolean>>, frames: readonly PadFrame[]): ButtonBind[] {
  return frames.flatMap((f) => f.buttons.flatMap((down, index) => (down && !prev[keyOf(f.id, index)] ? [{ pad: f.id, index }] : [])));
}

function startStep(s: SetupState, step: SetupStep, frames: readonly PadFrame[]): SetupState {
  const now = Object.fromEntries(axesOf(frames).map((a) => [a.key, a.v]));
  return { ...s, step, baseline: now, lo: now, hi: now, error: null };
}

function nextStep(step: SetupStep): SetupStep {
  const i = SETUP_STEPS.findIndex((x) => x === step);
  return i < 0 ? 'done' : SETUP_STEPS[i + 1] ?? 'done';
}

export function createSetup(frames: readonly PadFrame[]): SetupState {
  const buttons = { fire: null, missile: null, flare: null, special: null, switch: null, cycle: null, pause: null };
  const blank: SetupState = {
    step: 'right', x: null, y: null, throttle: null, buttons, baseline: {}, lo: {}, hi: {},
    prevButtons: pressedKeys(frames), error: null,
  };
  return startStep(blank, 'right', frames);
}

/** Folds this frame's axis values into baseline (first sight) and the lo / hi travel. */
function track(s: SetupState, axes: readonly AxisRead[]): Pick<SetupState, 'baseline' | 'lo' | 'hi'> {
  const baseline = { ...s.baseline };
  const lo = { ...s.lo };
  const hi = { ...s.hi };
  for (const a of axes) {
    baseline[a.key] ??= a.v;
    lo[a.key] = Math.min(lo[a.key] ?? a.v, a.v);
    hi[a.key] = Math.max(hi[a.key] ?? a.v, a.v);
  }
  return { baseline, lo, hi };
}

/** The axis that moved furthest from its baseline (≥ AXIS_MOVE), ignoring `exclude`. */
function movedAxis(s: SetupState, axes: readonly AxisRead[], exclude: AxisBind | null): AxisBind | null {
  let best: AxisBind | null = null;
  let bestAbs = AXIS_MOVE;
  for (const a of axes) {
    if (same(exclude, a)) continue;
    const rest = s.baseline[a.key] ?? a.v;
    const d = a.v - rest;
    if (Math.abs(d) >= bestAbs) {
      best = withCenter({ pad: a.pad, index: a.index, invert: d < 0 }, rest);
      bestAbs = Math.abs(d);
    }
  }
  return best;
}

/** The non-stick axis with the most travel this step; full is the end it rests at now. */
function throttleAxis(s: SetupState, axes: readonly AxisRead[]): AxisBind | null {
  let best: AxisBind | null = null;
  let bestTravel = THROTTLE_TRAVEL;
  for (const a of axes) {
    if (same(s.x, a) || same(s.y, a)) continue;
    const lo = s.lo[a.key] ?? a.v;
    const hi = s.hi[a.key] ?? a.v;
    if (hi - lo >= bestTravel) {
      best = { pad: a.pad, index: a.index, invert: a.v - lo < hi - a.v };
      bestTravel = hi - lo;
    }
  }
  return best;
}

function detectThrottle(s: SetupState, axes: readonly AxisRead[], edges: readonly ButtonBind[], frames: readonly PadFrame[]): SetupState {
  const fire = s.buttons.fire;
  const confirmed = edges.some((e) => fire === null || same(fire, e));
  if (!confirmed) return s;
  const throttle = throttleAxis(s, axes);
  if (!throttle) return { ...s, error: { kind: 'noThrottle' } };
  return startStep({ ...s, throttle }, nextStep('throttle'), frames);
}

function detectButton(s: SetupState, action: JoyAction, edges: readonly ButtonBind[], frames: readonly PadFrame[]): SetupState {
  const b = edges[0];
  if (!b) return s;
  const by = JOY_ACTIONS.find((a) => same(s.buttons[a], b));
  if (by) return { ...s, error: { kind: 'used', by } };
  return startStep({ ...s, buttons: { ...s.buttons, [action]: b } }, nextStep(action), frames);
}

/** One tick of the setup screen. `skip` (S / SKIP) leaves the current step unbound. */
export function stepSetup(s: SetupState, frames: readonly PadFrame[], skip: boolean): SetupState {
  if (s.step === 'done') return s;
  const axes = axesOf(frames);
  const edges = risingEdges(s.prevButtons, frames);
  const t: SetupState = { ...s, ...track(s, axes), prevButtons: pressedKeys(frames) };
  if (skip) return startStep(t, nextStep(s.step), frames);
  switch (t.step) {
    case 'right': {
      const x = movedAxis(t, axes, null);
      return x ? startStep({ ...t, x }, 'back', frames) : t;
    }
    case 'back': {
      const y = movedAxis(t, axes, t.x);
      return y ? startStep({ ...t, y }, 'fire', frames) : t;
    }
    case 'throttle': return detectThrottle(t, axes, edges, frames);
    case 'fire':
    case 'missile':
    case 'flare':
    case 'special':
    case 'switch':
    case 'cycle':
    case 'pause': return detectButton(t, t.step, edges, frames);
    case 'done': return t;
    default: throw new Error(`unhandled: ${t.step satisfies never}`);
  }
}

/** The profile to save; skipped stick axes fall back to axis 0 / 1 of the stick's controller. */
export function setupProfile(s: SetupState, fallbackPad: string): JoyProfile {
  const d = defaultProfile(s.x?.pad ?? s.y?.pad ?? fallbackPad);
  return { x: s.x ?? d.x, y: s.y ?? d.y, throttle: s.throttle, buttons: { ...s.buttons } };
}
