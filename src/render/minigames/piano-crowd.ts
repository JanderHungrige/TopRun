import { clamp, lerp } from '../../core/math';
import { BODY, drawFrontFigure, type Expression } from '../people';
import { CROWD_LOOKS } from './piano-looks';

// Piano Bar (doc 23): the squadron round the piano — people-kit three-quarter figures (doc 17) that walk in
// as the combo grows, bob on the beat, raise their glasses with the cheer (a toast at every 10 in a row) and
// wince when a combo breaks. Slots in arrival order; `front` draws the ones standing before the piano.

type Glass = 'mug' | 'tumbler';
interface Slot { x: number; foot: number; scale: number; turn: number; from: -1 | 1; glass: Glass; phase: number }

const SLOTS: readonly Slot[] = [
  { x: 630, foot: 592, scale: 0.7, turn: -0.35, from: 1, glass: 'mug', phase: 0 },
  { x: 328, foot: 604, scale: 0.73, turn: 0.4, from: -1, glass: 'mug', phase: 1.3 },
  { x: 718, foot: 656, scale: 0.8, turn: -0.42, from: 1, glass: 'mug', phase: 2.1 },
  { x: 548, foot: 562, scale: 0.66, turn: -0.2, from: 1, glass: 'tumbler', phase: 0.7 },
  { x: 205, foot: 630, scale: 0.78, turn: 0.42, from: -1, glass: 'mug', phase: 2.9 },
  { x: 402, foot: 550, scale: 0.64, turn: 0.25, from: -1, glass: 'tumbler', phase: 1.9 },
  { x: 82, foot: 662, scale: 0.84, turn: 0.45, from: -1, glass: 'tumbler', phase: 3.4 },
];
export const CROWD_SLOTS = SLOTS.length;
const FRONT_FOOT = 625;
const HIP_Y = -(BODY.ankle + BODY.shin + BODY.thigh);

export interface CrowdView {
  /** 0 = away … 1 = in place, per slot. */
  presence: readonly number[];
  /** 0 … 1 with the combo. */
  cheer: number;
  /** 1 at a toast, decaying. */
  toast: number;
  /** 1 when a combo breaks, decaying. */
  wince: number;
  beat: number;
  groove: number;
  t: number;
}

const blink = (t: number, phase: number): number => ((t + phase * 1.7) % 4.3 < 0.12 ? 1 : 0);

function glass(ctx: CanvasRenderingContext2D, x: number, y: number, k: number, kind: Glass): void {
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));
  ctx.scale(k, k);
  if (kind === 'mug') {
    ctx.fillStyle = '#e3a33a';
    ctx.fillRect(-7, -9, 14, 19);
    ctx.fillStyle = '#fbf6ea';
    ctx.fillRect(-8, -13, 16, 6);
    ctx.strokeStyle = '#f1ece0';
    ctx.lineWidth = 3;
    ctx.strokeRect(7, -5, 5, 10);
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.fillRect(-5, -7, 3, 15);
  } else {
    ctx.fillStyle = 'rgba(220,235,240,0.55)';
    ctx.fillRect(-7, -9, 14, 16);
    ctx.fillStyle = '#b8642a';
    ctx.fillRect(-6, -2, 12, 8);
    ctx.fillStyle = '#e8f4f8';
    ctx.fillRect(-4, -4, 5, 4);
  }
  ctx.restore();
}

function expressionOf(v: CrowdView): Expression {
  if (v.wince > 0.35) return 'strain';
  return v.cheer > 0.3 || v.toast > 0.2 ? 'grin' : 'calm';
}

function member(ctx: CanvasRenderingContext2D, i: number, s: Slot, v: CrowdView): void {
  const p = v.presence[i] ?? 0;
  const look = CROWD_LOOKS[i];
  if (p <= 0.01 || !look) return;
  const walking = p < 0.99;
  const x = s.x + (1 - p) * s.from * 170;
  const bounce = walking ? Math.abs(Math.sin(v.t * 9 + s.phase)) * 3 : Math.sin(((v.beat + s.phase * 0.1) % 1) * Math.PI) * (1 + 4 * v.groove);
  const side = s.turn > 0 ? 1 : -1;
  // Few pose frames per person (pixel cache, doc 20): glass at the chest / up / toast, the free arm down / pumping.
  // Each one reacts to a toast a little later than the last, so they never all re-render on the same frame.
  const toasting = v.toast > 0.25 && v.toast < 1 - s.phase * 0.04;
  const up = toasting ? 0.875 : v.cheer > 0.45 ? 0.5 : 0.25;
  const other = v.cheer > 0.75 && Math.floor((v.beat + s.phase) * 2) % 2 === 0 ? 0.5 : 0;
  const raise: readonly [number, number] = side > 0 ? [other, up] : [up, other];
  ctx.save();
  ctx.globalAlpha = clamp(p * 1.6, 0, 1);
  ctx.fillStyle = 'rgba(0,0,0,0.28)';
  ctx.beginPath();
  ctx.ellipse(x, s.foot, 26 * s.scale * 1.4, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.translate(x, s.foot - bounce);
  ctx.scale(s.scale, s.scale);
  drawFrontFigure(ctx, look, { turn: s.turn, raise, hands: 'fist' }, {
    expression: expressionOf(v), strain: 0, blink: blink(v.t, s.phase), t: v.t,
  });
  const k = Math.cos(s.turn);
  const wx = lerp(43, 42, up) + Math.sin(Math.PI * up) * 36;
  glass(ctx, side * (wx * k + 4), HIP_Y + lerp(14, -190, up) - 6, 1.1, s.glass);
  ctx.restore();
}

/** The crowd behind the piano (front = false) or standing before it (front = true). */
export function drawCrowd(ctx: CanvasRenderingContext2D, v: CrowdView, front: boolean): void {
  const order = SLOTS.map((s, i) => ({ s, i })).filter(({ s }) => (s.foot >= FRONT_FOOT) === front).sort((a, b) => a.s.foot - b.s.foot);
  for (const { s, i } of order) member(ctx, i, s, v);
}
