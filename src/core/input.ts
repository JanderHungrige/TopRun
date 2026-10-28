import type { JoyProfile } from '../game/joystick';
import { toLogical, type Viewport } from './canvas';
import type { Vec } from './math';
import { pollGamepad } from './gamepad';

export type Action =
  | 'up' | 'down' | 'left' | 'right' | 'fire' | 'secondary' | 'groundWeapon' | 'weaponSwitch' | 'flare' | 'special'
  | 'confirm' | 'back' | 'pause' | 'mute' | 'skip' | 'hangar' | 'base' | 'delete' | 'globe' | 'upgrade';

export type Device = 'keyboard' | 'mouse' | 'touch' | 'gamepad' | 'joystick';

const KEYMAP: Readonly<Record<string, readonly Action[]>> = {
  ArrowUp: ['up'], KeyW: ['up'], ArrowDown: ['down'], KeyS: ['down', 'skip'],
  ArrowLeft: ['left'], KeyA: ['left'], ArrowRight: ['right'], KeyD: ['right'],
  Space: ['fire', 'confirm'], KeyJ: ['fire'], Enter: ['confirm'], NumpadEnter: ['confirm'],
  // 'secondary' = the AIR weapon key, 'groundWeapon' = the GROUND weapon key, 'weaponSwitch' picks the next ground weapon (doc 05).
  KeyR: ['secondary'], KeyK: ['secondary'], // never Shift: 5× Shift opens the Windows Sticky Keys prompt
  // L is also the LOADOUT key (action 'hangar', doc 02) on the map and the debrief; no mission reads 'hangar'.
  KeyQ: ['groundWeapon'], KeyL: ['groundWeapon', 'hangar'], KeyX: ['weaponSwitch'], KeyO: ['weaponSwitch'], KeyF: ['flare'], KeyE: ['special'],
  Escape: ['back', 'pause'], Backspace: ['back'], Delete: ['delete'], KeyP: ['pause'], KeyM: ['mute'], KeyH: ['hangar'], KeyB: ['base'],
  KeyG: ['globe'], // the campaign map's globe: switch between map 1 and map 2 (doc 35)
  KeyU: ['upgrade'], // the LOADOUT's weapon mark upgrade (doc 43)
};

/** Pure action bookkeeping: sources (keys, pad buttons) map to actions; presses are latched per tick. */
export class ActionState {
  private down = new Map<string, readonly Action[]>();
  private latched = new Set<Action>();
  private heldSet = new Set<Action>();
  private pressedSet = new Set<Action>();

  press(source: string, actions: readonly Action[]): void {
    if (this.down.has(source)) return;
    this.down.set(source, actions);
    for (const a of actions) this.latched.add(a);
  }

  release(source: string): void {
    this.down.delete(source);
  }

  releaseAll(): void {
    this.down.clear();
  }

  tick(): void {
    this.heldSet = new Set([...this.down.values()].flat());
    this.pressedSet = this.latched;
    this.latched = new Set();
  }

  held(a: Action): boolean {
    return this.heldSet.has(a);
  }

  pressed(a: Action): boolean {
    return this.pressedSet.has(a);
  }

  clearPressed(): void {
    this.pressedSet.clear();
    this.latched.clear();
  }
}

interface PointerTrack {
  startX: number;
  startY: number;
  x: number;
  y: number;
}

export class Input {
  readonly actions = new ActionState();
  readonly pointer: Vec & { down: boolean } = { x: -1, y: -1, down: false };
  stick: Vec = { x: 0, y: 0 };
  taps: Vec[] = [];
  device: Device = 'keyboard';
  /** Joystick throttle axis, 0 idle … 1 full; null without a bound throttle (doc 01). */
  throttle: number | null = null;
  /** Saved JOYSTICK setup, applied to the controllers it names. */
  joystick: JoyProfile | null = null;
  /** True while the JOYSTICK setup screen reads controllers raw. */
  padSuspended = false;
  private pendingTaps: Vec[] = [];
  private tracks = new Map<number, PointerTrack>();
  private dragAcc = new Map<number, Vec>();
  private drag = new Map<number, Vec>();
  private gestureCallbacks: Array<() => void> = [];

  constructor(target: HTMLElement, private viewport: () => Viewport) {
    window.addEventListener('keydown', (e) => this.onKey(e, true));
    window.addEventListener('keyup', (e) => this.onKey(e, false));
    window.addEventListener('blur', () => this.actions.releaseAll());
    target.addEventListener('pointerdown', (e) => this.onPointerDown(e));
    target.addEventListener('pointermove', (e) => this.onPointerMove(e));
    target.addEventListener('pointerup', (e) => this.onPointerUp(e));
    target.addEventListener('pointercancel', (e) => this.onPointerUp(e));
    target.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  onFirstGesture(cb: () => void): void {
    this.gestureCallbacks.push(cb);
  }

  held(a: Action): boolean {
    return this.actions.held(a);
  }

  pressed(a: Action): boolean {
    return this.actions.pressed(a);
  }

  /** Call once at the start of every fixed update. */
  tick(): void {
    const pad = pollGamepad(this.joystick, this.padSuspended);
    if (pad.active) this.device = pad.kind;
    for (const [source, acts] of pad.down) this.actions.press(source, acts);
    for (const source of pad.up) this.actions.release(source);
    this.stick = pad.stick;
    this.throttle = pad.throttle;
    this.actions.tick();
    this.taps = this.pendingTaps;
    this.pendingTaps = [];
    this.drag = this.dragAcc;
    this.dragAcc = new Map();
  }

  clearPressed(): void {
    this.actions.clearPressed();
    this.taps = [];
    this.pendingTaps = [];
  }

  /** Normalised movement from keys / d-pad and the analog stick. */
  moveVector(): Vec {
    let x = (this.held('right') ? 1 : 0) - (this.held('left') ? 1 : 0) + this.stick.x;
    let y = (this.held('down') ? 1 : 0) - (this.held('up') ? 1 : 0) + this.stick.y;
    const len = Math.hypot(x, y);
    if (len > 1) {
      x /= len;
      y /= len;
    }
    return { x, y };
  }

  /** Sum of drag movement this tick for pointers whose touch started inside the region. */
  dragDelta(region: { x: number; y: number; w: number; h: number }): Vec {
    const out = { x: 0, y: 0 };
    for (const [id, d] of this.drag) {
      const t = this.tracks.get(id);
      const start = t ?? { startX: -1, startY: -1 };
      const inside = start.startX >= region.x && start.startX <= region.x + region.w
        && start.startY >= region.y && start.startY <= region.y + region.h;
      if (inside || !t) {
        out.x += d.x;
        out.y += d.y;
      }
    }
    return out;
  }

  /** True while any pointer that started inside the region is still down. */
  touchingIn(region: { x: number; y: number; w: number; h: number }): boolean {
    for (const t of this.tracks.values()) {
      if (t.startX >= region.x && t.startX <= region.x + region.w && t.startY >= region.y && t.startY <= region.y + region.h) {
        return true;
      }
    }
    return false;
  }

  private gesture(): void {
    const cbs = this.gestureCallbacks;
    this.gestureCallbacks = [];
    for (const cb of cbs) cb();
  }

  private onKey(e: KeyboardEvent, down: boolean): void {
    // Typing into a DOM text field (the callsign) is not game input.
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
    const acts = KEYMAP[e.code];
    if (!acts) return;
    if (!e.metaKey && !e.ctrlKey) e.preventDefault();
    this.device = 'keyboard';
    if (down) {
      this.actions.press(`key:${e.code}`, acts);
      this.gesture();
    } else {
      this.actions.release(`key:${e.code}`);
    }
  }

  private logical(e: PointerEvent): Vec {
    return toLogical(this.viewport(), e.clientX, e.clientY);
  }

  private onPointerDown(e: PointerEvent): void {
    const p = this.logical(e);
    this.device = e.pointerType === 'touch' ? 'touch' : 'mouse';
    this.tracks.set(e.pointerId, { startX: p.x, startY: p.y, x: p.x, y: p.y });
    this.pendingTaps.push(p);
    Object.assign(this.pointer, p, { down: true });
    (e.target as Element).setPointerCapture?.(e.pointerId);
    this.gesture();
  }

  private onPointerMove(e: PointerEvent): void {
    const p = this.logical(e);
    Object.assign(this.pointer, p);
    const t = this.tracks.get(e.pointerId);
    if (!t) return;
    const acc = this.dragAcc.get(e.pointerId) ?? { x: 0, y: 0 };
    acc.x += p.x - t.x;
    acc.y += p.y - t.y;
    this.dragAcc.set(e.pointerId, acc);
    t.x = p.x;
    t.y = p.y;
  }

  private onPointerUp(e: PointerEvent): void {
    this.tracks.delete(e.pointerId);
    if (this.tracks.size === 0) this.pointer.down = false;
  }
}
