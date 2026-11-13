import { TAU } from '../core/math';
import { SONIC } from '../data/heli-arms';
import { fillPoly } from './shapes';

// The helicopters' arsenal on screen (doc 99): laser pulses, sonic waves, the drone swarm, stunned enemies' circling
// rings and the red brackets of painted targets. Playfield-local.

interface ZapView { x1: number; y1: number; x2: number; y2: number; t: number }
interface WaveView { x: number; y: number; t: number; reach: number }
interface UnitView { x: number; y: number; radius: number; dead: boolean; stun: number; paintT: number }
interface DroneView { kind: string; x: number; y: number; heading: number; ttl: number }
export interface HeliFxView {
  zaps: readonly ZapView[];
  waves: readonly WaveView[];
  enemies: readonly UnitView[];
  missiles: readonly DroneView[];
  bossPaintT: number;
  boss: { active: boolean; aimPoint(): { x: number; y: number } } | null;
}

/** A pulse's beam: a pink glow round a white-hot core, fading out within its 0.07 s. */
function zap(ctx: CanvasRenderingContext2D, z: ZapView): void {
  const a = Math.max(0, 1 - z.t / 0.07);
  ctx.lineCap = 'round';
  for (const [w, c] of [[6, `rgba(255,80,200,${(0.35 * a).toFixed(2)})`], [1.6, `rgba(255,240,250,${a.toFixed(2)})`]] as const) {
    ctx.strokeStyle = c;
    ctx.lineWidth = w;
    ctx.beginPath();
    ctx.moveTo(z.x1, z.y1);
    ctx.lineTo(z.x2, z.y2);
    ctx.stroke();
  }
}

/** A sonic wave: three pale arcs running out ahead, wobbling — each a wide cyan glow round a white core. */
function wave(ctx: CanvasRenderingContext2D, w: WaveView, t: number): void {
  const k = Math.min(1, w.t / SONIC.time);
  for (let i = 0; i < 3; i++) {
    const r = w.reach * k - i * 10;
    if (r <= 4) continue;
    const a = (1 - k * 0.6) * (1 - i * 0.25);
    for (const [lw, c] of [[7, `rgba(120,230,255,${(0.28 * a).toFixed(2)})`], [2, `rgba(240,252,255,${(0.9 * a).toFixed(2)})`]] as const) {
      ctx.strokeStyle = c;
      ctx.lineWidth = lw;
      arc(ctx, w, r, t);
    }
  }
}

function arc(ctx: CanvasRenderingContext2D, w: WaveView, r: number, t: number): void {
  ctx.beginPath();
  for (let s = 0; s <= 24; s++) {
    const a = -Math.PI / 2 - SONIC.cone + (2 * SONIC.cone * s) / 24;
    const rr = r + Math.sin(a * 14 + t * 40) * 1.5;
    if (s === 0) ctx.moveTo(w.x + Math.cos(a) * rr, w.y + Math.sin(a) * rr);
    else ctx.lineTo(w.x + Math.cos(a) * rr, w.y + Math.sin(a) * rr);
  }
  ctx.stroke();
}

/** A drone of the swarm: a small dark delta with a blinking light. */
function drone(ctx: CanvasRenderingContext2D, d: DroneView): void {
  ctx.save();
  ctx.translate(d.x, d.y);
  ctx.rotate(d.heading);
  fillPoly(ctx, [0, -7, 6, 5, 0, 3, -6, 5], '#3c434b', '#20252a');
  ctx.fillStyle = Math.sin(d.ttl * 18) > 0 ? '#ff4a3a' : '#5a2020';
  ctx.fillRect(-1, -1, 2, 2);
  ctx.restore();
}

/** Red corner brackets round a painted target. */
function brackets(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, t: number): void {
  const s = r + 5 + Math.sin(t * 10) * 1.2;
  const l = Math.max(4, s * 0.4);
  ctx.strokeStyle = 'rgba(255,60,50,0.9)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (const [dx, dy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]] as const) {
    ctx.moveTo(x + dx * s, y + dy * (s - l));
    ctx.lineTo(x + dx * s, y + dy * s);
    ctx.lineTo(x + dx * (s - l), y + dy * s);
  }
  ctx.stroke();
}

/** Two little rings circling over a stunned enemy. */
function stunned(ctx: CanvasRenderingContext2D, e: UnitView, t: number): void {
  ctx.strokeStyle = 'rgba(200,245,255,0.85)';
  ctx.lineWidth = 1.2;
  for (let k = 0; k < 2; k++) {
    const a = t * 7 + k * Math.PI;
    ctx.beginPath();
    ctx.arc(e.x + Math.cos(a) * e.radius * 0.7, e.y - e.radius - 4 + Math.sin(a) * 3, 2.5, 0, TAU);
    ctx.stroke();
  }
}

export function drawHeliFx(ctx: CanvasRenderingContext2D, v: HeliFxView, t: number): void {
  ctx.save();
  for (const m of v.missiles) if (m.kind === 'drone') drone(ctx, m);
  for (const e of v.enemies) {
    if (e.dead) continue;
    if (e.paintT > 0) brackets(ctx, e.x, e.y, e.radius, t);
    if (e.stun > 0) stunned(ctx, e, t);
  }
  if (v.bossPaintT > 0 && v.boss?.active) {
    const a = v.boss.aimPoint();
    brackets(ctx, a.x, a.y, 34, t);
  }
  for (const w of v.waves) wave(ctx, w, t);
  for (const z of v.zaps) zap(ctx, z);
  ctx.restore();
}
