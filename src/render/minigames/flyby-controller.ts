import { clamp, TAU } from '../../core/math';
import { drawPixelated } from '../pixel/capture';

// The controller in the Tower Flyby cab (doc 13): an original cartoon with a headset, a moustache and a
// coffee mug, shown as pixel art (doc 20). Drawn in local units: origin = top of his console, y up is negative.

export type ControllerMood = 'idle' | 'spill' | 'flinch' | 'duck';

export interface ControllerView {
  mood: ControllerMood;
  /** Seconds since the mood started. */
  moodT: number;
  t: number;
  /** -1 … 1: where he looks (the jet's side). */
  look: number;
  /** Coffee he has spilled on himself so far. */
  stains: number;
}

type Eyes = 'open' | 'wide' | 'shut';
type Mouth = 'smile' | 'o' | 'grr';

interface Pose {
  dy: number;
  hand: [number, number];
  cup: number; // mug tilt, radians, positive = top to the right
  eyes: Eyes;
  mouth: Mouth;
  hair: number; // 0 … 1 standing on end
  fist: number; // other arm raised and shaking, 0 … 1
  cupGone: boolean;
}

const SKIN = '#e2ae86';
const COFFEE = '#6b3c1c';
const SPILL_AT = 0.12;
const smooth = (a: number, b: number, v: number): number => {
  const x = clamp((v - a) / (b - a), 0, 1);
  return x * x * (3 - 2 * x);
};

function idlePose(t: number): Pose {
  const sip = smooth(0.62, 0.7, (t % 5) / 5) * (1 - smooth(0.86, 0.94, (t % 5) / 5));
  return {
    dy: 0, hand: [11 - sip * 7, -12 - sip * 15], cup: -0.9 * sip, eyes: 'open', mouth: 'smile', hair: 0, fist: 0, cupGone: false,
  };
}

function spillPose(m: number, t: number): Pose {
  const jolt = m < 0.08 ? m / 0.08 : Math.exp(-(m - 0.08) * 3.5);
  const angry = smooth(1.1, 1.3, m);
  return {
    dy: -6 * jolt, hand: [14, -16 - 4 * jolt], cup: 2.1 * smooth(0.04, 0.26, m) - 1.2 * angry, eyes: angry > 0.5 ? 'open' : 'wide',
    mouth: angry > 0.5 ? 'grr' : 'o', hair: Math.max(jolt, 0.25 * (1 - angry)), fist: angry * (0.85 + 0.15 * Math.sin(t * 22)), cupGone: false,
  };
}

function pose(v: ControllerView): Pose {
  const m = v.moodT;
  switch (v.mood) {
    case 'idle': return idlePose(v.t);
    case 'spill': return spillPose(m, v.t);
    case 'flinch': {
      const k = Math.exp(-m * 3);
      return { dy: 5 * k, hand: [10, -12], cup: 0.45 * Math.sin(m * 18) * k, eyes: m < 0.6 ? 'shut' : 'open', mouth: m < 0.6 ? 'grr' : 'o', hair: 0.4 * k, fist: 0, cupGone: false };
    }
    case 'duck': {
      const down = smooth(0, 0.12, m) * (1 - smooth(1.5, 1.9, m));
      return { dy: 30 * down, hand: [10, -12], cup: 0, eyes: 'wide', mouth: 'o', hair: 1 - smooth(1.6, 2.2, m), fist: 0, cupGone: true };
    }
    default: throw new Error(`unhandled: ${v.mood satisfies never}`);
  }
}

function body(ctx: CanvasRenderingContext2D, stains: number): void {
  ctx.fillStyle = '#9cc3e4';
  ctx.beginPath();
  ctx.moveTo(-15, 4);
  ctx.lineTo(-13, -14);
  ctx.quadraticCurveTo(-12, -21, -5, -22);
  ctx.lineTo(5, -22);
  ctx.quadraticCurveTo(12, -21, 13, -14);
  ctx.lineTo(15, 4);
  ctx.fill();
  ctx.fillStyle = '#7fa6c9';
  ctx.fillRect(-13, -19, 5, 2.5); // epaulettes
  ctx.fillRect(8, -19, 5, 2.5);
  ctx.fillStyle = '#2b3d5c';
  ctx.beginPath();
  ctx.moveTo(-1.6, -21);
  ctx.lineTo(1.6, -21);
  ctx.lineTo(2.4, -8);
  ctx.lineTo(0, -5);
  ctx.lineTo(-2.4, -8);
  ctx.fill();
  ctx.fillStyle = 'rgba(107,60,28,0.75)';
  for (let i = 0; i < Math.min(3, stains); i++) {
    ctx.beginPath();
    ctx.ellipse(4 - i * 6, -12 + i * 3, 3.4, 2.4, i, 0, TAU);
    ctx.fill();
  }
}

function eyes(ctx: CanvasRenderingContext2D, e: Eyes, look: number): void {
  for (const ex of [-3.6, 3.6]) {
    if (e === 'shut') {
      ctx.strokeStyle = '#2a1d14';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(ex - 2, -33);
      ctx.lineTo(ex + 2, -32.4);
      ctx.stroke();
      continue;
    }
    const r = e === 'wide' ? 2.8 : 2;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(ex, -33, r, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#1d232b';
    ctx.beginPath();
    ctx.arc(ex + look * (r - 1), -33, e === 'wide' ? 1 : 1.2, 0, TAU);
    ctx.fill();
  }
}

function face(ctx: CanvasRenderingContext2D, p: Pose, look: number): void {
  ctx.fillStyle = SKIN;
  ctx.beginPath();
  ctx.ellipse(0, -32, 8.6, 9.8, 0, 0, TAU);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(-8.6, -31, 2.2, 0, TAU);
  ctx.fill();
  eyes(ctx, p.eyes, look);
  ctx.strokeStyle = '#3d2718';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  const brow = p.mouth === 'grr' ? 1.2 : p.eyes === 'wide' ? -1.4 : 0;
  ctx.moveTo(-6, -37 - brow * 0.2);
  ctx.lineTo(-1.5, -37 + brow);
  ctx.moveTo(6, -37 - brow * 0.2);
  ctx.lineTo(1.5, -37 + brow);
  ctx.stroke();
  ctx.fillStyle = '#d09670';
  ctx.beginPath();
  ctx.arc(0.6, -29.6, 1.8, 0, TAU);
  ctx.fill();
  mouth(ctx, p.mouth);
  ctx.fillStyle = '#4a3222';
  ctx.beginPath();
  ctx.ellipse(-2.4, -26.6, 3.4, 1.6, 0.2, 0, TAU);
  ctx.ellipse(2.8, -26.6, 3.4, 1.6, -0.2, 0, TAU);
  ctx.fill(); // moustache
}

function mouth(ctx: CanvasRenderingContext2D, m: Mouth): void {
  ctx.fillStyle = '#5a1f1a';
  ctx.strokeStyle = '#5a1f1a';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  switch (m) {
    case 'smile': ctx.arc(0, -25.6, 2.6, 0.2, Math.PI - 0.2); ctx.stroke(); break;
    case 'o': ctx.ellipse(0.4, -23.6, 2, 2.6, 0, 0, TAU); ctx.fill(); break;
    case 'grr': ctx.fillRect(-3, -24.6, 6.4, 2.2); ctx.fillStyle = '#fff'; ctx.fillRect(-2.6, -24.4, 5.6, 0.9); break;
    default: throw new Error(`unhandled: ${m satisfies never}`);
  }
}

function hairAndHeadset(ctx: CanvasRenderingContext2D, hair: number): void {
  ctx.fillStyle = '#4a3222';
  ctx.beginPath();
  ctx.ellipse(0, -38.6, 8.4, 4.4, 0, Math.PI, TAU);
  ctx.fill();
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const x = -6 + i * 3;
    const h = 2 + hair * (5 + (i % 2) * 3);
    ctx.moveTo(x - 1.6, -40.5);
    ctx.lineTo(x + (i - 2) * hair * 0.8, -40.5 - h);
    ctx.lineTo(x + 1.6, -40.5);
  }
  ctx.fill();
  ctx.strokeStyle = '#1f2328';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.arc(0, -33, 9.6, Math.PI * 1.08, Math.PI * 1.92);
  ctx.stroke();
  ctx.fillStyle = '#2a2f36';
  ctx.beginPath();
  ctx.roundRect(-11.4, -35, 4, 7, 1.6);
  ctx.fill();
  ctx.strokeStyle = '#2a2f36';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-9.6, -29);
  ctx.quadraticCurveTo(-8, -23, -3.6, -23.4);
  ctx.stroke();
}

function mug(ctx: CanvasRenderingContext2D, x: number, y: number, tilt: number, full: boolean): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(tilt);
  ctx.fillStyle = '#f4f1ea';
  ctx.fillRect(-3.2, -7, 6.4, 8);
  ctx.strokeStyle = '#f4f1ea';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.arc(4, -3, 2.2, -1.2, 1.2);
  ctx.stroke();
  ctx.fillStyle = '#d94a3a';
  ctx.fillRect(-3.2, -4.6, 6.4, 1.6);
  if (full) {
    ctx.fillStyle = COFFEE;
    ctx.fillRect(-2.6, -7, 5.2, 1.2);
  }
  ctx.restore();
}

function arm(ctx: CanvasRenderingContext2D, from: [number, number], to: [number, number]): void {
  ctx.strokeStyle = '#9cc3e4';
  ctx.lineWidth = 4.2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(from[0], from[1]);
  ctx.lineTo(to[0], to[1]);
  ctx.stroke();
  ctx.fillStyle = SKIN;
  ctx.beginPath();
  ctx.arc(to[0], to[1], 2.4, 0, TAU);
  ctx.fill();
}

/** Coffee flying out of the mug after a spill (parametric drops, local units). */
function drops(ctx: CanvasRenderingContext2D, v: ControllerView, rim: [number, number]): void {
  const tau = v.moodT - SPILL_AT;
  const n = v.mood === 'spill' ? 14 : v.mood === 'flinch' ? 4 : 0;
  if (tau <= 0 || tau > 1.1 || n === 0) return;
  ctx.fillStyle = COFFEE;
  if (v.mood === 'spill' && tau < 0.18) {
    ctx.beginPath();
    ctx.ellipse(rim[0] + 6 + tau * 40, rim[1] - 4 - tau * 20, 5 + tau * 30, 2.4 + tau * 8, -0.5, 0, TAU);
    ctx.fill(); // the first gush
  }
  for (let i = 0; i < n; i++) {
    const vx = 26 + (i % 5) * 18;
    const vy = -95 + (i % 4) * 26 - (i % 3) * 8;
    const x = rim[0] + vx * tau;
    const y = rim[1] + vy * tau + 230 * tau * tau;
    if (y > 2) continue;
    const r = 1.8 + (i % 3) * 0.7;
    ctx.beginPath();
    ctx.ellipse(x, y, r * 1.3, r, Math.atan2(vy + 460 * tau, vx), 0, TAU);
    ctx.fill();
  }
}

/** A mug knocked flying when the controller ducks. */
function flyingMug(ctx: CanvasRenderingContext2D, m: number): void {
  if (m > 0.9) return;
  mug(ctx, 10 + 40 * m, -12 - 150 * m + 330 * m * m, m * 14, false);
}

const BOUNDS = { x: -26, y: -56, w: 62, h: 64 };
const qn = (v: number, step: number): number => Math.round(v / step) * step;

function figure(ctx: CanvasRenderingContext2D, p: Pose, look: number, full: boolean, stains: number): void {
  body(ctx, stains);
  face(ctx, p, look);
  hairAndHeadset(ctx, p.hair);
  if (p.fist > 0) arm(ctx, [-10, -17], [-14 - 4 * p.fist, -20 - 18 * p.fist]);
  if (p.cupGone) return;
  arm(ctx, [10, -17], p.hand);
  mug(ctx, p.hand[0] + 1, p.hand[1] + 1, p.cup, full);
}

/** The controller as pixel art (doc 20): his pose is quantised to frames and cached; coffee drops stay particles. */
export function drawController(ctx: CanvasRenderingContext2D, x: number, y: number, v: ControllerView): void {
  const raw = pose(v);
  const p: Pose = { ...raw, hand: [qn(raw.hand[0], 1), qn(raw.hand[1], 1)], cup: qn(raw.cup, 0.15), hair: qn(raw.hair, 0.25), fist: qn(raw.fist, 0.25) };
  const look = qn(v.look, 0.5);
  const full = v.mood === 'idle' || v.moodT < SPILL_AT || v.mood === 'flinch';
  const stains = Math.ceil(Math.min(3, v.stains));
  ctx.save();
  ctx.translate(x, y + Math.round(raw.dy));
  const key = `ctl|${p.hand.join()}|${p.cup}|${p.eyes}|${p.mouth}|${p.hair}|${p.fist}|${p.cupGone}|${look}|${full}|${stains}`;
  drawPixelated(ctx, key, BOUNDS, (g) => figure(g, p, look, full, stains), { units: 1.3, minD: 1 });
  if (!p.cupGone) drops(ctx, v, [raw.hand[0] + 3, raw.hand[1] - 6]);
  ctx.restore();
  if (p.cupGone) {
    ctx.save();
    ctx.translate(x, y);
    flyingMug(ctx, v.moodT);
    ctx.restore();
  }
}
