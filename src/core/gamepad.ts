import { padInputs, type JoyProfile, type PadFrame } from '../game/joystick';
import type { Action } from './input';
import type { Vec } from './math';

// Reads every controller (gamepads, flight sticks, HOTAS) and applies its mapping (doc 01).

const STICK_DIGITAL = 0.55;

export interface PadPoll {
  active: boolean;
  kind: 'gamepad' | 'joystick';
  down: Array<[string, readonly Action[]]>;
  up: string[];
  stick: Vec;
  throttle: number | null;
}

let prev = new Set<string>();

/** Raw state of every connected controller (the setup screen reads this directly). */
export function readPads(): PadFrame[] {
  if (typeof navigator === 'undefined' || !navigator.getGamepads) return [];
  const out: PadFrame[] = [];
  for (const pad of navigator.getGamepads()) {
    if (!pad || !pad.connected) continue;
    out.push({ id: pad.id, standard: pad.mapping === 'standard', axes: [...pad.axes], buttons: pad.buttons.map((b) => b.pressed) });
  }
  return out;
}

/** Index-qualified so two identical sticks don't share sources. */
const source = (i: number, s: string): string => `pad:${i}:${s}`;

function collect(i: number, frame: PadFrame, profile: JoyProfile | null, now: Map<string, readonly Action[]>): ReturnType<typeof padInputs> {
  const got = padInputs(frame, profile);
  for (const [b, acts] of got.buttons) now.set(source(i, `b${b}`), acts);
  // Digital directions from the stick drive menu navigation.
  const { x, y } = got.stick;
  if (x < -STICK_DIGITAL) now.set(source(i, 'sl'), ['left']);
  if (x > STICK_DIGITAL) now.set(source(i, 'sr'), ['right']);
  if (y < -STICK_DIGITAL) now.set(source(i, 'su'), ['up']);
  if (y > STICK_DIGITAL) now.set(source(i, 'sd'), ['down']);
  return got;
}

/**
 * `suspended` (the JOYSTICK setup screen): controllers produce no game actions. Held buttons are
 * still tracked, so one held when the screen closes doesn't fire a fresh press afterwards.
 */
export function pollGamepad(profile: JoyProfile | null, suspended: boolean): PadPoll {
  const now = new Map<string, readonly Action[]>();
  let stick: Vec = { x: 0, y: 0 };
  let throttle: number | null = null;
  let kind: PadPoll['kind'] = 'gamepad';
  readPads().forEach((frame, i) => {
    const got = collect(i, frame, profile, now);
    if (Math.abs(got.stick.x) + Math.abs(got.stick.y) > Math.abs(stick.x) + Math.abs(stick.y)) stick = got.stick;
    if (got.kind === 'joystick') kind = 'joystick';
    throttle ??= got.throttle;
  });
  const before = prev;
  prev = new Set(now.keys());
  if (suspended) return { active: false, kind, down: [], up: [...before], stick: { x: 0, y: 0 }, throttle: null };
  const down = [...now].filter(([k]) => !before.has(k));
  const up = [...before].filter((k) => !now.has(k));
  // moveVector() normalises, so digital stick directions plus the analog value never exceed 1.
  const active = down.length > 0 || Math.abs(stick.x) + Math.abs(stick.y) > 0;
  return { active, kind, down, up, stick, throttle };
}
