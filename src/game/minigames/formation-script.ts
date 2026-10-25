import { clamp } from '../../core/math';

// Formation Flying (doc 14): Duke's air-show routine as keyframed channels. Pure and deterministic.

/** Where the lead's centre rests on screen. */
export const LEAD_HOME = { x: 560, y: 400 } as const;
/** Ground speed of the formation in px/s (sea scroll, lead yaw). */
export const GROUND_SPEED = 600;
export const SHOW_START = 4;
export const SHOW_END = 58;
export const SMOKE_ON = 44;
export const SMOKE_OFF = 58;
export const ROUND_END = 61;

export type SegmentId = 'join' | 'weaves' | 'closure' | 'turn' | 'pitch' | 'smoke' | 'break';
export interface Segment {
  id: SegmentId;
  from: number;
  to: number;
}

export const SEGMENTS: readonly Segment[] = [
  { id: 'join', from: 0, to: 4 },
  { id: 'weaves', from: 4, to: 16 },
  { id: 'closure', from: 16, to: 25 },
  { id: 'turn', from: 25, to: 34 },
  { id: 'pitch', from: 34, to: 43 },
  { id: 'smoke', from: 43, to: 58 },
  { id: 'break', from: 58, to: ROUND_END },
];

export type CallId =
  | 'join' | 'showStart' | 'weaves' | 'powerBack' | 'powerUp' | 'turn' | 'pitchCall' | 'pitchNow' | 'smokeOn' | 'smokeOff' | 'end';

/** Duke's scripted radio calls (seconds after GO). */
export const CALLS: readonly { t: number; id: CallId }[] = [
  { t: 0.4, id: 'join' }, { t: 3.2, id: 'showStart' }, { t: 4.6, id: 'weaves' }, { t: 16, id: 'powerBack' },
  { t: 20.2, id: 'powerUp' }, { t: 24.4, id: 'turn' }, { t: 33.6, id: 'pitchCall' }, { t: 35.6, id: 'pitchNow' },
  { t: 42.6, id: 'smokeOn' }, { t: 57.6, id: 'smokeOff' }, { t: 58.6, id: 'end' },
];

type Ease = 'spline' | 'smooth' | 'linear';
interface Channel {
  ease: Ease;
  keys: readonly (readonly [number, number])[];
}

/** Lead x / y on screen: weaves, closure (power back / up), pitch-up slide, smoke curve, break. */
const X: Channel = {
  ease: 'spline',
  keys: [[0, 560], [4, 560], [5.5, 470], [8.5, 650], [11.5, 470], [14.5, 650], [16.5, 560], [19, 575], [22.5, 550],
    [25, 560], [34, 560], [38, 572], [42, 560], [47, 604], [52, 536], [57, 572], [58, 560], [61, 250]],
};
const Y: Channel = {
  ease: 'spline',
  keys: [[0, 400], [4, 400], [8.5, 392], [14.5, 404], [16.5, 400], [19, 495], [20.5, 500], [22.5, 330], [25, 395],
    [28, 400], [36, 400], [37.5, 452], [39.5, 440], [41.5, 382], [43, 400], [50, 386], [58, 400], [61, 330]],
};
/** 0 = show height, 1 = top of the pitch-up (closer to the camera). */
const ALT: Channel = { ease: 'smooth', keys: [[0, 0], [36, 0], [37.5, 1], [40, 1], [42, 0], [ROUND_END, 0]] };
/** Turn rate in rad/s, + = right: the 180° left turn, the gentle right curve with smoke, the break. */
const TURN: Channel = {
  ease: 'linear',
  keys: [[0, 0], [25, 0], [26.5, -0.42], [32.5, -0.42], [34, 0], [44, 0], [46, 0.1], [56, 0.1], [58, 0], [59, -0.6], [ROUND_END, -0.6]],
};
/** Ground speed factor: the pitch-up bleeds speed. */
const GROUND: Channel = { ease: 'linear', keys: [[0, 1], [36, 1], [37.5, 0.72], [40, 0.72], [42, 1], [ROUND_END, 1]] };

const key = (ch: Channel, i: number): readonly [number, number] => {
  const k = ch.keys[clamp(i, 0, ch.keys.length - 1)];
  if (!k) throw new Error('empty channel');
  return k;
};

/** Catmull-Rom tangent at key i (zero at both ends: the lead starts steady). */
function tangent(ch: Channel, i: number): number {
  if (i <= 0 || i >= ch.keys.length - 1) return 0;
  const [ta, a] = key(ch, i - 1);
  const [tb, b] = key(ch, i + 1);
  return (b - a) / (tb - ta);
}

function blend(ch: Channel, i: number, s: number, h: number): number {
  const a = key(ch, i)[1];
  const b = key(ch, i + 1)[1];
  switch (ch.ease) {
    case 'linear': return a + (b - a) * s;
    case 'smooth': return a + (b - a) * s * s * (3 - 2 * s);
    case 'spline': {
      const s2 = s * s;
      const s3 = s2 * s;
      return (2 * s3 - 3 * s2 + 1) * a + (s3 - 2 * s2 + s) * h * tangent(ch, i) + (3 * s2 - 2 * s3) * b + (s3 - s2) * h * tangent(ch, i + 1);
    }
    default: throw new Error(`unhandled: ${ch.ease satisfies never}`);
  }
}

function sample(ch: Channel, t: number): number {
  const last = ch.keys.length - 1;
  if (t <= key(ch, 0)[0]) return key(ch, 0)[1];
  if (t >= key(ch, last)[0]) return key(ch, last)[1];
  let i = 0;
  while (i < last - 1 && key(ch, i + 1)[0] <= t) i++;
  const t0 = key(ch, i)[0];
  const h = key(ch, i + 1)[0] - t0;
  return blend(ch, i, (t - t0) / h, h);
}

export const turnRate = (t: number): number => sample(TURN, t);
export const smokeOn = (t: number): boolean => t >= SMOKE_ON && t < SMOKE_OFF;

export function segmentAt(t: number): SegmentId {
  const seg = SEGMENTS.find((g) => t < g.to) ?? SEGMENTS[SEGMENTS.length - 1];
  if (!seg) throw new Error('no segments');
  return seg.id;
}

/** Calls whose time lies in (from, to]. */
export const callsBetween = (from: number, to: number): CallId[] => CALLS.filter((c) => c.t > from && c.t <= to).map((c) => c.id);

export interface LeadPose {
  x: number;
  y: number;
  /** Screen velocity and lateral acceleration (px/s, px/s²). */
  vx: number;
  vy: number;
  ax: number;
  /** 0 … 1, the pitch-up. */
  alt: number;
  /** Nose angle from screen-up in rad, + = right (small: from the lateral speed). */
  yaw: number;
  /** -1 … 1, + = rolled right. */
  bank: number;
  /** Turn rate of the formation in rad/s, + = right. */
  turn: number;
  /** Ground speed factor. */
  ground: number;
  smoke: boolean;
}

const D = 1 / 120;

export function leadPose(t: number): LeadPose {
  const x = sample(X, t);
  const y = sample(Y, t);
  const vx = (sample(X, t + D) - sample(X, t - D)) / (2 * D);
  const vy = (sample(Y, t + D) - sample(Y, t - D)) / (2 * D);
  const ax = (sample(X, t + D) - 2 * x + sample(X, t - D)) / (D * D);
  const turn = turnRate(t);
  const ground = sample(GROUND, t);
  return {
    x, y, vx, vy, ax, turn, ground, alt: sample(ALT, t), smoke: smokeOn(t),
    yaw: Math.atan2(vx, GROUND_SPEED * ground - vy),
    bank: clamp(turn / 0.45 + ax / 320, -1, 1),
  };
}
