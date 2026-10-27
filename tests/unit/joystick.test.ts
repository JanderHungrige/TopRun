import { describe, it, expect } from 'vitest';
import {
  defaultProfile, JOY_DEADZONE, padInputs, parseJoyProfile, throttleOf, type JoyProfile, type PadFrame,
} from '../../src/game/joystick';
import { createSetup, setupProfile, stepSetup, type SetupState } from '../../src/game/joystick-setup';
import { defaultSettings, parseSettings } from '../../src/game/settings';

const frame = (id: string, axes: number[], pressed: number[] = [], standard = false): PadFrame => ({
  id, standard, axes, buttons: Array.from({ length: 12 }, (_, i) => pressed.includes(i)),
});

const STICK = 'Logitech Extreme 3D (Vendor: 046d Product: c215)';
const THR = 'Thrustmaster TWCS Throttle';

const profile = (): JoyProfile => ({
  x: { pad: STICK, index: 0, invert: false },
  y: { pad: STICK, index: 1, invert: true },
  throttle: { pad: STICK, index: 2, invert: true },
  buttons: {
    fire: { pad: STICK, index: 0 }, missile: { pad: STICK, index: 1 }, flare: { pad: STICK, index: 4 },
    special: { pad: STICK, index: 7 }, switch: null, cycle: { pad: STICK, index: 9 }, pause: { pad: STICK, index: 11 },
  },
});

/** Feeds frames one by one (no skip). */
function feed(s: SetupState, ...frames: PadFrame[][]): SetupState {
  return frames.reduce((st, f) => stepSetup(st, f, false), s);
}

const rest = (pressed: number[] = []): PadFrame[] => [frame(STICK, [0, 0, 0.5], pressed)];

/** A setup that has detected X (axis 0) and Y (axis 1) and waits for the trigger. */
function atFire(): SetupState {
  const s = feed(createSetup(rest()), [frame(STICK, [0.95, 0, 0.5])], rest(), [frame(STICK, [0, 0.9, 0.5])], rest());
  expect(s.step).toBe('fire');
  return s;
}

describe('Joystick', () => {
  describe('padInputs', () => {
    it('uses the standard gamepad mapping with a 0.3 dead zone for standard pads', () => {
      const out = padInputs(frame('Xbox Controller', [0.2, -1], [0], true), null);
      expect(out.kind).toBe('gamepad');
      expect(out.buttons).toEqual([[0, ['fire', 'confirm']]]);
      expect(out.stick).toEqual({ x: 0, y: -1 });
      expect(out.throttle).toBeNull();
    });

    it('splits the shoulder buttons: RB fires the ground weapon, LB switches it (doc 05)', () => {
      expect(padInputs(frame('Xbox Controller', [0, 0], [5], true), null).buttons).toEqual([[5, ['groundWeapon']]]);
      expect(padInputs(frame('Xbox Controller', [0, 0], [4], true), null).buttons).toEqual([[4, ['weaponSwitch']]]);
    });

    it('maps the switch button: default joystick button 7, and the profile binding', () => {
      expect(defaultProfile(STICK).buttons.cycle).toEqual({ pad: STICK, index: 6 });
      expect(padInputs(frame('Other Stick', [0, 0], [6]), null).buttons).toEqual([[6, ['weaponSwitch']]]);
      expect(padInputs(frame(STICK, [0, 0, 0], [9]), profile()).buttons).toEqual([[9, ['weaponSwitch']]]);
    });

    it('applies the default joystick mapping to an unknown non-standard stick', () => {
      const out = padInputs(frame(STICK, [0.5, 0, 0.3], [2, 5]), null);
      expect(out.kind).toBe('joystick');
      expect(out.buttons).toEqual([[2, ['flare']], [5, ['pause']]]);
      expect(out.stick.x).toBeCloseTo((0.5 - JOY_DEADZONE) / (1 - JOY_DEADZONE), 6);
      expect(out.throttle).toBeNull();
      expect(defaultProfile(STICK).buttons.fire).toEqual({ pad: STICK, index: 0 });
    });

    it('follows the saved profile: inverted axes, moved buttons, throttle', () => {
      const out = padInputs(frame(STICK, [0, 0.6, -1], [0, 7]), profile());
      expect(out.kind).toBe('joystick');
      expect(out.buttons).toEqual([[0, ['fire', 'confirm']], [7, ['special']]]);
      expect(out.stick.y).toBeCloseTo(-(0.6 - JOY_DEADZONE) / (1 - JOY_DEADZONE), 6);
      expect(out.throttle).toBe(1);
    });

    it('reads a split HOTAS: the throttle device contributes only what is bound to it', () => {
      const p: JoyProfile = { ...profile(), throttle: { pad: THR, index: 0, invert: false }, buttons: { ...profile().buttons, flare: { pad: THR, index: 3 } } };
      const thr = padInputs(frame(THR, [0.5, 0.9], [3, 0]), p);
      expect(thr.kind).toBe('joystick');
      expect(thr.buttons).toEqual([[3, ['flare']]]);
      expect(thr.stick).toEqual({ x: 0, y: 0 });
      expect(thr.throttle).toBe(0.75);
    });

    it('falls back to the standard or default mapping for controllers the profile does not name', () => {
      expect(padInputs(frame('Xbox Controller', [0, 0], [1], true), profile()).buttons).toEqual([[1, ['secondary', 'back']]]);
      expect(padInputs(frame('Other Stick', [0, 0], [4]), profile()).buttons).toEqual([[4, ['groundWeapon']]]);
    });

    it('normalises a throttle axis to 0 idle … 1 full', () => {
      expect(throttleOf(-1, false)).toBe(0);
      expect(throttleOf(1, false)).toBe(1);
      expect(throttleOf(-1, true)).toBe(1);
      expect(throttleOf(0, true)).toBe(0.5);
      expect(throttleOf(1.3, false)).toBe(1);
    });
  });

  describe('parseJoyProfile', () => {
    it('round-trips a valid profile and returns null for anything else', () => {
      expect(parseJoyProfile(JSON.parse(JSON.stringify(profile())))).toEqual(profile());
      expect(parseJoyProfile(null)).toBeNull();
      expect(parseJoyProfile('stick')).toBeNull();
      expect(parseJoyProfile({ ...profile(), x: { pad: STICK, index: -1, invert: false } })).toBeNull();
      expect(parseJoyProfile({ ...profile(), y: { pad: STICK, index: 1.5, invert: false } })).toBeNull();
      expect(parseJoyProfile({ ...profile(), x: { pad: 'x'.repeat(201), index: 0, invert: false } })).toBeNull();
      expect(parseJoyProfile({ ...profile(), buttons: { ...profile().buttons, flare: { pad: STICK, index: 64 } } })).toBeNull();
    });

    it('treats missing buttons as unbound', () => {
      const { pause: _pause, ...rest } = profile().buttons;
      expect(parseJoyProfile({ ...profile(), buttons: rest })?.buttons.pause).toBeNull();
    });

    it('keeps a setup saved before the switch button existed, switch unbound', () => {
      const { cycle: _cycle, ...old } = profile().buttons;
      const p = parseJoyProfile({ ...profile(), buttons: old });
      expect(p?.buttons.cycle).toBeNull();
      expect(p?.buttons.missile).toEqual({ pad: STICK, index: 1 });
    });

    it('is stored in the device settings, default none', () => {
      expect(defaultSettings().joystick).toBeNull();
      expect(parseSettings({ ...defaultSettings(), joystick: profile() }).joystick).toEqual(profile());
      expect(parseSettings({ ...defaultSettings(), joystick: { x: 1 } }).joystick).toBeNull();
    });
  });

  describe('setup', () => {
    it('detects stick X from the axis pushed right, inverted when it reads negative', () => {
      const small = feed(createSetup(rest()), [frame(STICK, [0.2, 0, 0.5])]);
      expect(small.step).toBe('right');
      const s = feed(createSetup(rest()), [frame(STICK, [0.95, 0.1, 0.5])]);
      expect(s.step).toBe('back');
      expect(s.x).toEqual({ pad: STICK, index: 0, invert: false });
      expect(feed(createSetup(rest()), [frame(STICK, [-0.9, 0, 0.5])]).x?.invert).toBe(true);
    });

    it('detects stick Y without picking the X axis again', () => {
      const s = feed(createSetup(rest()), [frame(STICK, [1, 0, 0.5])], [frame(STICK, [-1, -0.8, 0.5])]);
      expect(s.step).toBe('fire');
      expect(s.y).toEqual({ pad: STICK, index: 1, invert: true });
    });

    it('binds the trigger on a fresh press only', () => {
      let s = createSetup(rest([3]));
      s = stepSetup(stepSetup(s, rest([3]), true), rest([3]), true);
      expect(s.step).toBe('fire');
      s = feed(s, rest([3]));
      expect(s.buttons.fire).toBeNull();
      s = feed(s, rest(), rest([3]));
      expect(s.buttons.fire).toEqual({ pad: STICK, index: 3 });
      expect(s.step).toBe('throttle');
    });

    it('takes the throttle from the axis with the most travel, full at the end it rests on', () => {
      let s = feed(atFire(), rest([0]), rest());
      expect(s.step).toBe('throttle');
      s = feed(s, [frame(STICK, [1, 1, 1])], [frame(STICK, [-1, 0, -1])], [frame(STICK, [0, 0, -1])]);
      s = feed(s, [frame(STICK, [0, 0, -1], [0])]);
      expect(s.throttle).toEqual({ pad: STICK, index: 2, invert: true });
      expect(s.step).toBe('missile');
    });

    it('reports no throttle when nothing travelled and finds one on a second device', () => {
      let s = feed(atFire(), rest([0]), rest(), rest([0]));
      expect(s.step).toBe('throttle');
      expect(s.error).toEqual({ kind: 'noThrottle' });
      const both = (ax: number, pressed: number[] = []): PadFrame[] => [frame(STICK, [0, 0, 0.5], pressed), frame(THR, [ax])];
      s = feed(s, both(-1), both(1), both(1, [0]));
      expect(s.throttle).toEqual({ pad: THR, index: 0, invert: false });
      expect(s.error).toBeNull();
    });

    it('refuses a button that is already bound, then accepts a free one', () => {
      let s = feed(atFire(), rest([0]), rest());
      s = stepSetup(s, rest(), true);
      expect(s.step).toBe('missile');
      s = feed(s, rest([0]));
      expect(s.error).toEqual({ kind: 'used', by: 'fire' });
      expect(s.step).toBe('missile');
      s = feed(s, rest(), rest([1]));
      expect(s.buttons.missile).toEqual({ pad: STICK, index: 1 });
      expect(s.error).toBeNull();
      expect(s.step).toBe('flare');
    });

    it('skips steps and builds a complete profile', () => {
      let s = createSetup(rest());
      for (let i = 0; i < 10; i++) s = stepSetup(s, rest(), true);
      expect(s.step).toBe('done');
      const p = setupProfile(s, STICK);
      expect(p).toEqual({
        ...defaultProfile(STICK), buttons: { fire: null, missile: null, flare: null, special: null, switch: null, cycle: null, pause: null },
      });
      expect(parseJoyProfile(p)).toEqual(p);
    });
  });

  describe('axis calibration (sticks reporting 0…1, resting at 0.5)', () => {
    const HALF = 'Generic   USB  Joystick';

    it('detects such a stick in the setup and stores its centre', () => {
      const s = feed(createSetup([frame(HALF, [0.5, 0.5, 0])]), [frame(HALF, [1, 0.5, 0])]);
      expect(s.step).toBe('back');
      expect(s.x).toEqual({ pad: HALF, index: 0, invert: false, center: 0.5, span: 0.5 });
      const y = feed(s, [frame(HALF, [0.5, 1, 0])]);
      expect(y.y).toEqual({ pad: HALF, index: 1, invert: false, center: 0.5, span: 0.5 });
    });

    it('reads a calibrated axis full left, centred and full right', () => {
      const p: JoyProfile = { ...profile(), x: { pad: STICK, index: 0, invert: false, center: 0.5, span: 0.5 } };
      expect(padInputs(frame(STICK, [0, 0, 0]), p).stick.x).toBe(-1);
      expect(padInputs(frame(STICK, [0.5, 0, 0]), p).stick.x).toBe(0);
      expect(padInputs(frame(STICK, [1, 0, 0]), p).stick.x).toBe(1);
    });

    it('centres an unknown stick on the values it first reported', () => {
      const firstSeen = [0.5, 0.5];
      expect(padInputs(frame(HALF, [0, 0.5]), null, firstSeen).stick.x).toBe(-1);
      expect(padInputs(frame(HALF, [0.5, 0.5]), null, firstSeen).stick).toEqual({ x: 0, y: 0 });
      expect(padInputs(frame(HALF, [0.5, 1]), null, firstSeen).stick.y).toBe(1);
    });

    it('keeps the calibration in saved profiles and rejects nonsense', () => {
      const p: JoyProfile = { ...profile(), x: { pad: STICK, index: 0, invert: false, center: 0.5, span: 0.5 } };
      expect(parseJoyProfile(JSON.parse(JSON.stringify(p)))).toEqual(p);
      expect(parseJoyProfile({ ...p, x: { ...p.x, span: 0 } })).toBeNull();
      expect(parseJoyProfile({ ...p, x: { ...p.x, center: 3 } })).toBeNull();
    });
  });
});
