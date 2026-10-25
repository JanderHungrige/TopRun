import type { Vec } from '../../core/math';

// Piano Bar (doc 23): the club's battered upright in three-quarter view — its end panel towards us, the
// keyboard receding to the upper left. Piano-local units: u along the keyboard (0 = treble end, near us),
// v up from the floor, w from the front face (w < 0: keys, w > 0: the case). Drawn in two passes around the
// pilot: the back (case, keys, far leg, props) and the front (near leg, keyboard cheek, end panel).

/** Piano (and pilot) scale: piano units → logical px. */
export const S = 0.8;
const O = { x: 566, y: 652 };
const UX = -0.42;
const UY = -0.26;
const W = 250;
const D = 100;
const H = 225;
const KEY = 131;
const BED = 117;
const K = 52;
const NK = 26;

export const P = (u: number, v: number, w: number): Vec => ({ x: O.x + (w + u * UX) * S, y: O.y + (u * UY - v) * S });

/** The pilot's hip joint (seated, mid-keyboard) and the floor under the stool. */
export const SEAT = P(W / 2, 100, -K - 48);
export const SEAT_FLOOR = P(W / 2, 0, -K - 48).y;

type Pt = readonly [number, number, number];

function face(ctx: CanvasRenderingContext2D, pts: readonly Pt[], fill: string, stroke?: string): void {
  ctx.beginPath();
  for (const [u, v, w] of pts) {
    const p = P(u, v, w);
    ctx.lineTo(p.x, p.y);
  }
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}

/** A rectangle in a w = const plane (front faces). */
const wRect = (w: number, u0: number, u1: number, v0: number, v1: number): Pt[] => [[u0, v0, w], [u1, v0, w], [u1, v1, w], [u0, v1, w]];
/** A rectangle in a u = const plane (faces towards us). */
const uRect = (u: number, w0: number, w1: number, v0: number, v1: number): Pt[] => [[u, v0, w0], [u, v0, w1], [u, v1, w1], [u, v1, w0]];
/** A rectangle in a v = const plane (top surfaces). */
const vRect = (v: number, u0: number, u1: number, w0: number, w1: number): Pt[] => [[u0, v, w0], [u1, v, w0], [u1, v, w1], [u0, v, w1]];

export interface UprightView {
  /** Right-hand key glow per lane (0 … 1). */
  rh: readonly number[];
  /** Left-hand key pulse (0 … 1). */
  lh: number;
  glow: number;
}

/** Keyboard u range lit for each right-hand lane (lane 3 = top treble, nearest us) and the bass. */
const LANE_U: readonly (readonly [number, number])[] = [[86, 104], [64, 82], [42, 60], [20, 38]];
const BASS_U: readonly [number, number] = [150, 182];

function keys(ctx: CanvasRenderingContext2D, v: UprightView): void {
  face(ctx, wRect(-K - 2, 0, W, BED, KEY - 4), '#3a1d10');
  face(ctx, vRect(KEY, 0, W, -K, -6), '#efe7d3');
  face(ctx, wRect(-K, 0, W, KEY - 4, KEY), '#cfc3a6');
  const glow = (u: readonly [number, number], a: number, color: string): void => {
    if (a > 0.02) face(ctx, vRect(KEY + 0.5, u[0], u[1], -K, -6), color.replace('A', String(0.55 * a)));
  };
  v.rh.forEach((a, lane) => glow(LANE_U[lane] ?? [0, 0], a, 'rgba(255,200,90,A)'));
  glow(BASS_U, v.lh, 'rgba(255,170,90,A)');
  ctx.strokeStyle = 'rgba(70,50,35,0.55)';
  ctx.lineWidth = 0.8;
  for (let i = 1; i < NK; i++) {
    const a = P((i * W) / NK, KEY, -K);
    const b = P((i * W) / NK, KEY, -6);
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }
  for (let i = 0; i < NK - 1; i++) {
    if (i % 7 === 2 || i % 7 === 6) continue;
    const u = ((i + 1) * W) / NK;
    face(ctx, vRect(KEY + 2, u - 2.6, u + 2.6, -K * 0.5, -6), '#1b1210');
  }
  face(ctx, wRect(-6, 0, W, KEY, KEY + 13), '#26120a');
}

function frontBoard(ctx: CanvasRenderingContext2D): void {
  face(ctx, wRect(0, 0, W, KEY + 12, H), '#47251a');
  for (const [u0, u1] of [[16, W / 2 - 8], [W / 2 + 8, W - 16]] as const) {
    face(ctx, wRect(0, u0, u1, KEY + 70, H - 14), '#3a1d13', 'rgba(255,190,140,0.14)');
  }
  face(ctx, wRect(-9, 26, W - 26, KEY + 16, KEY + 27), '#5e3322', 'rgba(255,200,150,0.25)');
  face(ctx, wRect(-7, W * 0.3, W * 0.64, KEY + 27, KEY + 80), '#efe6cf');
  ctx.strokeStyle = 'rgba(40,30,30,0.55)';
  ctx.lineWidth = 0.7;
  for (const v0 of [KEY + 66, KEY + 48]) {
    for (let k = 0; k < 5; k++) {
      const a = P(W * 0.33, v0 + k * 2.4, -7);
      const b = P(W * 0.61, v0 + k * 2.4, -7);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
  }
  face(ctx, wRect(0, 0, W, 10, BED), '#331a0f');
  face(ctx, wRect(0, 30, W - 30, 22, BED - 14), '#2b150b', 'rgba(255,190,140,0.1)');
  for (const du of [-12, 0, 12]) face(ctx, vRect(6, W / 2 + du - 3, W / 2 + du + 3, -16, -2), '#c9a24a');
}

function leg(ctx: CanvasRenderingContext2D, u: number): void {
  face(ctx, uRect(u, -K + 1, -K + 11, 8, BED), '#4f2a19', 'rgba(0,0,0,0.3)');
  face(ctx, uRect(u, -K - 6, -K + 16, 0, 9), '#3d2013');
}

function props(ctx: CanvasRenderingContext2D, glow: number): void {
  const mug = P(W * 0.22, H, D * 0.45);
  ctx.fillStyle = 'rgba(232,170,60,0.85)';
  ctx.fillRect(mug.x - 6, mug.y - 18, 12, 18);
  ctx.fillStyle = '#f6f1e4';
  ctx.fillRect(mug.x - 7, mug.y - 22, 14, 5);
  ctx.strokeStyle = 'rgba(240,240,230,0.8)';
  ctx.lineWidth = 2;
  ctx.strokeRect(mug.x + 6, mug.y - 15, 4, 9);
  const jar = P(W * 0.62, H, D * 0.5);
  ctx.fillStyle = 'rgba(200,225,235,0.35)';
  ctx.fillRect(jar.x - 9, jar.y - 22, 18, 22);
  ctx.fillStyle = `rgba(214,176,74,${0.8 + 0.2 * glow})`;
  ctx.fillRect(jar.x - 7, jar.y - 7, 14, 6);
  ctx.fillStyle = '#7fbf6a';
  ctx.fillRect(jar.x - 3, jar.y - 20, 7, 12);
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.fillRect(jar.x - 8, jar.y - 21, 2, 18);
}

/** Case, keys, far leg and the props on the lid (before the pilot). */
export function drawUprightBack(ctx: CanvasRenderingContext2D, v: UprightView): void {
  face(ctx, vRect(0, -10, W + 10, -K - 12, D + 12), 'rgba(0,0,0,0.35)');
  face(ctx, vRect(H, 0, W, -5, D), v.glow > 0.5 ? '#6a3a24' : '#5c321f');
  face(ctx, wRect(-5, 0, W, H - 6, H), '#2e170c');
  frontBoard(ctx);
  keys(ctx, v);
  leg(ctx, W - 12);
  props(ctx, v.glow);
}

/** Near leg, the keyboard's end cheek and the end panel (after the pilot). */
export function drawUprightFront(ctx: CanvasRenderingContext2D): void {
  leg(ctx, 12);
  face(ctx, uRect(0, -K - 5, 0, BED - 3, KEY + 9), '#633823', 'rgba(255,200,150,0.25)');
  face(ctx, uRect(0, 0, D, 0, H), '#56301d');
  face(ctx, uRect(0, 12, D - 12, 22, KEY - 10), '#4a2817', 'rgba(255,200,150,0.16)');
  face(ctx, uRect(0, 12, D - 12, KEY + 14, H - 16), '#4a2817', 'rgba(255,200,150,0.16)');
  face(ctx, uRect(0, -5, D + 2, H - 7, H + 1), '#6e3e26');
  face(ctx, uRect(0, -1, D, 0, 8), '#2e170c');
}

/** The round piano stool under the pilot's seat. */
export function drawStool(ctx: CanvasRenderingContext2D): void {
  const x = SEAT.x - 6 * S;
  const seat = SEAT.y + 9 * S;
  const floor = SEAT_FLOOR;
  const r = 32 * S;
  ctx.fillStyle = '#1d0f08';
  ctx.fillRect(x - 4 * S, seat + 6, 8 * S, floor - seat - 10);
  ctx.fillStyle = '#2a160c';
  ctx.beginPath();
  ctx.ellipse(x, floor - 2, r * 0.85, 5 * S, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#3a1e10';
  ctx.fillRect(x - r, seat + 2, r * 2, 7 * S);
  ctx.fillStyle = '#8e2430';
  ctx.beginPath();
  ctx.ellipse(x, seat + 1, r, 6 * S, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,150,150,0.25)';
  ctx.beginPath();
  ctx.ellipse(x - 6 * S, seat - 1, r * 0.5, 2.5 * S, 0, 0, Math.PI * 2);
  ctx.fill();
}
