import { clamp } from '../../core/math';
import type { LiveryId } from '../../data/liveries';
import type { PlaneId } from '../../data/types';
import { BOOST, GEARS, rpm } from '../../game/minigames/motorbike-bike';
import { COURSE, NEEDS, type Obstacle } from '../../game/minigames/motorbike-course';
import { BURNER_AT, jetAt, LIFTOFF_X } from '../../game/minigames/motorbike-jet';
import { raceGap, truckHint, type RaceState, type RideInput } from '../../game/minigames/motorbike';
import type { Params } from '../../i18n/i18n';
import { mt } from '../../i18n/minigame-text';
import { MOTORBIKE_TEXT, signedMetres, type MotorbikeKey } from '../../i18n/minigames/motorbike';
import { BIKE, type BikeView } from '../../render/minigames/motorbike-bike';
import type { MotorbikeFx } from '../../render/minigames/motorbike-fx';
import type { TachView } from '../../render/minigames/motorbike-gauge';
import type { PromptView, StripView } from '../../render/minigames/motorbike-hud';
import type { RiderLook } from '../../render/minigames/motorbike-rider';
import { leanAtY } from '../../render/minigames/motorbike-obstacles';
import { truckFrontY, TRUCK_DEPTH, TRUCK_HALF_W } from '../../render/minigames/motorbike-truck';
import type { RaceView } from '../../render/minigames/motorbike-view';
import { PX_PER_M, ROAD_Y } from '../../render/minigames/motorbike-world';

// Motorbike vs. Jet (doc 22): race state → what the renderer and the HUD draw (no outcome logic here).

export const tx = (k: MotorbikeKey, p?: Params): string => mt(MOTORBIKE_TEXT, k, p);
/** Warning signs stand this far (m) before each obstacle; the prompt shows this many seconds ahead. */
const SIGN_AHEAD = 150;
const PROMPT_TIME = 2.2;
/** Where the truck waits before it pulls out (screen y of its front). */
const TRUCK_PARKED_Y = 548;

export interface FrameCtx {
  /** Screen x of the front wheel. */
  frontSx: number;
  t: number;
  look: RiderLook;
  plane: PlaneId;
  livery: LiveryId;
  fx: MotorbikeFx;
  /** Mishap sway −1 … 1 and the bike's hop over a bump (px). */
  sway: number;
  hop: number;
  gateLift: readonly number[];
  input: RideInput;
}

export const camOf = (s: RaceState, frontSx: number): number => s.bike.x - frontSx / PX_PER_M;

function truckView(s: RaceState, camX: number): RaceView['truck'] {
  const o = COURSE.find((c) => c.kind === 'truck');
  if (!o) return null;
  const cx = (o.x - camX) * PX_PER_M + TRUCK_HALF_W;
  const gy = s.truckAt === null ? TRUCK_PARKED_Y : truckFrontY(s.t - s.truckAt);
  return gy === null ? null : { cx: cx + leanAtY(gy - TRUCK_DEPTH / 2), gy };
}

export function bikeView(s: RaceState, f: FrameCtx): BikeView {
  const b = s.bike;
  const bounce = Math.sin(f.t * 31) * 0.5 * clamp(b.v / 80, 0, 1);
  return {
    x: f.frontSx - BIKE.wheelbase, y: ROAD_Y + bounce - f.hop, angle: b.wheelie * BIKE.wheelie + f.sway * 0.05,
    spin: (b.x * PX_PER_M) / BIKE.wheelR, blur: clamp(b.v / 40, 0, 1), braking: f.input.brake && s.margin === null,
    flame: b.boost / BOOST.time, t: f.t,
  };
}

export function raceView(s: RaceState, f: FrameCtx): RaceView {
  const camX = camOf(s, f.frontSx);
  const sx = (x: number): number => (x - camX) * PX_PER_M;
  const j = jetAt(s.t);
  const b = s.bike;
  return {
    camX, t: f.t,
    obstacles: COURSE.map((o, i) => ({ kind: o.kind, sx: sx(o.x), sx1: sx(o.x + o.len), lift: f.gateLift[i] ?? 0 })),
    signs: COURSE.map((o) => ({ sx: sx(o.x - SIGN_AHEAD), kind: o.kind })),
    start: { sx: sx(0), label: tx('start') }, liftoff: { sx: sx(LIFTOFF_X), label: tx('liftoff') },
    jet: {
      plane: f.plane, livery: f.livery, noseX: sx(j.x), alt: j.alt * PX_PER_M, pitch: j.pitch, gear: j.gear,
      throttle: s.t >= BURNER_AT ? 1 : 0.62,
    },
    truck: truckView(s, camX),
    bike: bikeView(s, f),
    rider: { tuck: b.tuck, back: b.wheelie, angle: b.wheelie * BIKE.wheelie, sway: f.sway, footDown: b.v < 1.5 },
    look: f.look, fx: f.fx, streaks: clamp((b.v - 50) / 35, 0, 1),
  };
}

function needFor(o: Obstacle, s: RaceState, input: RideInput): Omit<PromptView, 'near' | 't'> {
  const b = s.bike;
  switch (o.kind) {
    case 'bump': return { what: tx('whatBump'), action: tx('needWheelie'), key: '←', ok: b.wheelie >= NEEDS.wheelie, danger: false };
    case 'gate': return { what: tx('whatGate'), action: tx('needTuck'), key: '→', ok: b.tuck >= NEEDS.tuck, danger: false };
    case 'oil': return { what: tx('whatOil'), action: tx('needCoast'), key: null, ok: input.throttle <= NEEDS.oilThrottle && !input.brake, danger: false };
    case 'truck': {
      const hint = truckHint(s);
      if (hint === 'go') return { what: tx('whatTruck'), action: tx('go'), key: null, ok: true, danger: false };
      return { what: tx('whatTruck'), action: tx('needBrake'), key: '↓', ok: false, danger: hint === 'brake' };
    }
    default: throw new Error(`unhandled: ${o.kind satisfies never}`);
  }
}

export function promptView(s: RaceState, input: RideInput, t: number): PromptView | null {
  if (s.margin !== null || s.stun > 0) return null;
  const o = COURSE[s.results.indexOf('pending')];
  if (!o) return null;
  const ahead = (o.x - s.bike.x) / Math.max(s.bike.v, 6);
  if (ahead > PROMPT_TIME) return null;
  return { ...needFor(o, s, input), near: clamp(1 - ahead / PROMPT_TIME, 0, 1), t };
}

export function stripView(s: RaceState, you: string): StripView {
  const gap = s.margin ?? raceGap(s);
  return {
    bike: s.bike.x / LIFTOFF_X, jet: jetAt(s.t).x / LIFTOFF_X, gap: `${signedMetres(gap)} m`, gapLabel: tx(gap >= 0 ? 'ahead' : 'behind'),
    ahead: gap >= 0, youLabel: you, jetLabel: tx('jet'),
  };
}

export function tachView(s: RaceState, flash: number, flashGood: boolean, t: number): TachView {
  const b = s.bike;
  return {
    rpm: rpm(b), gear: b.gear, kmh: b.v * 3.6, top: b.gear >= GEARS, limiter: b.limiter > 0,
    gearLabel: tx('gear'), kmhLabel: tx('kmh'), shiftLabel: tx('shiftLight'), flash, flashGood, t,
  };
}
