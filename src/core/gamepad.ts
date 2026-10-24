import type { Action } from './input';
import type { Vec } from './math';

// Standard gamepad mapping: 0 A, 1 B, 2 X, 3 Y, 4 LB, 5 RB, 8 Back, 9 Start, 12–15 d-pad.
const BUTTONS: Readonly<Record<number, readonly Action[]>> = {
  0: ['fire', 'confirm'], 1: ['secondary', 'back'], 2: ['flare'], 3: ['special'],
  4: ['switchWeapon'], 5: ['switchWeapon'], 8: ['back'], 9: ['pause'],
  12: ['up'], 13: ['down'], 14: ['left'], 15: ['right'],
};

const DEADZONE = 0.3;
const STICK_DIGITAL = 0.55;

export interface PadPoll {
  active: boolean;
  down: Array<[string, readonly Action[]]>;
  up: string[];
  stick: Vec;
}

let prev = new Set<string>();

function deadzone(v: number): number {
  if (Math.abs(v) < DEADZONE) return 0;
  return Math.sign(v) * ((Math.abs(v) - DEADZONE) / (1 - DEADZONE));
}

function collect(pad: Gamepad, now: Map<string, readonly Action[]>): Vec {
  pad.buttons.forEach((b, i) => {
    const acts = BUTTONS[i];
    if (acts && b.pressed) now.set(`pad:${pad.index}:b${i}`, acts);
  });
  const x = deadzone(pad.axes[0] ?? 0);
  const y = deadzone(pad.axes[1] ?? 0);
  // Digital directions from the stick drive menu navigation.
  if (x < -STICK_DIGITAL) now.set(`pad:${pad.index}:sl`, ['left']);
  if (x > STICK_DIGITAL) now.set(`pad:${pad.index}:sr`, ['right']);
  if (y < -STICK_DIGITAL) now.set(`pad:${pad.index}:su`, ['up']);
  if (y > STICK_DIGITAL) now.set(`pad:${pad.index}:sd`, ['down']);
  return { x, y };
}

export function pollGamepad(): PadPoll {
  const empty: PadPoll = { active: false, down: [], up: [...prev], stick: { x: 0, y: 0 } };
  if (typeof navigator === 'undefined' || !navigator.getGamepads) return empty;
  const now = new Map<string, readonly Action[]>();
  let stick: Vec = { x: 0, y: 0 };
  for (const pad of navigator.getGamepads()) {
    if (!pad || !pad.connected) continue;
    const s = collect(pad, now);
    if (Math.abs(s.x) + Math.abs(s.y) > Math.abs(stick.x) + Math.abs(stick.y)) stick = s;
  }
  const down = [...now].filter(([k]) => !prev.has(k));
  const up = [...prev].filter((k) => !now.has(k));
  prev = new Set(now.keys());
  // moveVector() normalises, so digital stick directions plus the analog value never exceed 1.
  const active = down.length > 0 || Math.abs(stick.x) + Math.abs(stick.y) > 0;
  return { active, down, up, stick };
}
