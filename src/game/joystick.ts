import type { Action } from '../core/input';
import type { Vec } from '../core/math';

// Joystick / HOTAS mapping rules (doc 01): which controller button and axis means what. Pure.

export type JoyAction = 'fire' | 'missile' | 'flare' | 'special' | 'switch' | 'pause';
export const JOY_ACTIONS: readonly JoyAction[] = Object.freeze(['fire', 'missile', 'flare', 'special', 'switch', 'pause'] as const);

export const JOY_ACTION_INPUTS: Readonly<Record<JoyAction, readonly Action[]>> = {
  fire: ['fire', 'confirm'], missile: ['secondary', 'back'], flare: ['flare'], special: ['special'],
  switch: ['switchWeapon'], pause: ['pause'],
};

/** A button on one controller, identified by the browser's `Gamepad.id`. */
export interface ButtonBind {
  pad: string;
  index: number;
}

export interface AxisBind {
  pad: string;
  index: number;
  invert: boolean;
}

export interface JoyProfile {
  x: AxisBind;
  y: AxisBind;
  throttle: AxisBind | null;
  buttons: Record<JoyAction, ButtonBind | null>;
}

/** One controller as read this tick. */
export interface PadFrame {
  id: string;
  /** The browser reports `mapping: 'standard'` (Xbox / PlayStation layout). */
  standard: boolean;
  axes: readonly number[];
  buttons: readonly boolean[];
}

export interface PadInputs {
  kind: 'gamepad' | 'joystick';
  buttons: Array<[number, readonly Action[]]>;
  stick: Vec;
  /** 0 idle … 1 full, or null without a bound throttle axis. */
  throttle: number | null;
}

export const PAD_DEADZONE = 0.3;
export const JOY_DEADZONE = 0.12;
export const MAX_PAD_ID = 200;
export const MAX_INDEX = 63;

// Standard gamepad mapping: 0 A, 1 B, 2 X, 3 Y, 4 LB, 5 RB, 8 Back, 9 Start, 12–15 d-pad.
const STANDARD_BUTTONS: Readonly<Record<number, readonly Action[]>> = {
  0: ['fire', 'confirm'], 1: ['secondary', 'back'], 2: ['flare'], 3: ['special'],
  4: ['switchWeapon'], 5: ['switchWeapon'], 8: ['back'], 9: ['pause'],
  12: ['up'], 13: ['down'], 14: ['left'], 15: ['right'],
};

/** Mapping for a non-standard controller nobody has set up: trigger fires, buttons 1–5 in order. */
export function defaultProfile(pad: string): JoyProfile {
  const b = (index: number): ButtonBind => ({ pad, index });
  return {
    x: { pad, index: 0, invert: false },
    y: { pad, index: 1, invert: false },
    throttle: null,
    buttons: { fire: b(0), missile: b(1), flare: b(2), special: b(3), switch: b(4), pause: b(5) },
  };
}

export function deadzone(v: number, dz: number): number {
  if (Math.abs(v) < dz) return 0;
  return Math.sign(v) * Math.min(1, (Math.abs(v) - dz) / (1 - dz));
}

export function throttleOf(v: number, invert: boolean): number {
  return Math.min(1, Math.max(0, (invert ? 1 - v : 1 + v) / 2));
}

const names = (p: JoyProfile): string[] =>
  [p.x.pad, p.y.pad, p.throttle?.pad, ...JOY_ACTIONS.map((a) => p.buttons[a]?.pad)].filter((x): x is string => !!x);

function standardInputs(pad: PadFrame): PadInputs {
  const buttons: Array<[number, readonly Action[]]> = [];
  pad.buttons.forEach((down, i) => {
    const acts = STANDARD_BUTTONS[i];
    if (down && acts) buttons.push([i, acts]);
  });
  const stick = { x: deadzone(pad.axes[0] ?? 0, PAD_DEADZONE), y: deadzone(pad.axes[1] ?? 0, PAD_DEADZONE) };
  return { kind: 'gamepad', buttons, stick, throttle: null };
}

function profileInputs(pad: PadFrame, p: JoyProfile): PadInputs {
  const axis = (b: AxisBind): number =>
    b.pad === pad.id ? deadzone(pad.axes[b.index] ?? 0, JOY_DEADZONE) * (b.invert ? -1 : 1) : 0;
  const buttons: Array<[number, readonly Action[]]> = [];
  for (const a of JOY_ACTIONS) {
    const b = p.buttons[a];
    if (b && b.pad === pad.id && pad.buttons[b.index]) buttons.push([b.index, JOY_ACTION_INPUTS[a]]);
  }
  buttons.sort((l, r) => l[0] - r[0]);
  const t = p.throttle;
  const throttle = t && t.pad === pad.id ? throttleOf(pad.axes[t.index] ?? 0, t.invert) : null;
  return { kind: 'joystick', buttons, stick: { x: axis(p.x), y: axis(p.y) }, throttle };
}

/** What one controller contributes this tick: the profile if it names it, else standard / default. */
export function padInputs(pad: PadFrame, profile: JoyProfile | null): PadInputs {
  if (profile && names(profile).includes(pad.id)) return profileInputs(pad, profile);
  if (pad.standard) return standardInputs(pad);
  return profileInputs(pad, defaultProfile(pad.id));
}

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

function parseButton(v: unknown): ButtonBind {
  if (!isRecord(v)) throw new Error('bind');
  const { pad, index } = v;
  if (typeof pad !== 'string' || pad.length === 0 || pad.length > MAX_PAD_ID) throw new Error('pad');
  if (typeof index !== 'number' || !Number.isInteger(index) || index < 0 || index > MAX_INDEX) throw new Error('index');
  return { pad, index };
}

function parseAxis(v: unknown): AxisBind {
  const b = parseButton(v);
  if (!isRecord(v) || typeof v.invert !== 'boolean') throw new Error('axis');
  return { ...b, invert: v.invert };
}

/** Untrusted settings JSON → profile; anything malformed → null (back to the defaults). */
export function parseJoyProfile(v: unknown): JoyProfile | null {
  if (!isRecord(v)) return null;
  try {
    const raw = isRecord(v.buttons) ? v.buttons : {};
    const buttons = {} as Record<JoyAction, ButtonBind | null>;
    for (const a of JOY_ACTIONS) buttons[a] = raw[a] === undefined || raw[a] === null ? null : parseButton(raw[a]);
    const throttle = v.throttle === null || v.throttle === undefined ? null : parseAxis(v.throttle);
    return { x: parseAxis(v.x), y: parseAxis(v.y), throttle, buttons };
  } catch {
    return null;
  }
}
