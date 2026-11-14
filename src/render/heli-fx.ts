import { TAU } from '../core/math';
import { SONIC } from '../data/heli-arms';
import { NET } from '../data/sub-arms';
import { fillPoly } from './shapes';

// The helicopters' arsenal on screen (doc 99): laser pulses, sonic waves, the drone swarm, stunned enemies' circling
// rings and the red brackets of painted targets. Playfield-local.

interface ZapView { x1: number; y1: number; x2: number; y2: number; t: number; electric?: boolean }
interface WaveView { x: number; y: number; t: number; reach: number; cone: number }
interface UnitView { x: number; y: number; radius: number; dead: boolean; stun: number; paintT: number }
interface DroneView { kind: string; x: number; y: number; heading: number; ttl: number }
interface DecoyView { x: number; y: number; vx: number; vy: number; ttl: number }
interface NetView { x: number; y: number; r: number; t: number }
export interface HeliFxView {
  zaps: readonly ZapView[];
  decoy: DecoyView | null;
  nets: readonly NetView[];
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
  const glow = z.electric ? '90,170,255' : '255,80,200'; // an electric arc (doc 101) or a laser pulse
  for (const [w, c] of [[6, `rgba(${glow},${(0.35 * a).toFixed(2)})`], [1.6, `rgba(240,248,255,${a.toFixed(2)})`]] as const) {
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
    const a = -Math.PI / 2 - w.cone + (2 * w.cone * s) / 24;
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

/** A torpedo of the subs' swarm (doc 101): a small dark torpedo with a spinning screw. */
function miniTorpedo(ctx: CanvasRenderingContext2D, d: DroneView): void {
  ctx.save();
  ctx.translate(d.x, d.y);
  ctx.rotate(d.heading);
  ctx.fillStyle = '#2b333c';
  ctx.fillRect(-1.3, -5, 2.6, 9);
  ctx.fillStyle = '#ffb03a';
  ctx.fillRect(-1.6, 4, 3.2, Math.sin(d.ttl * 40) > 0 ? 1.2 : 0.6);
  ctx.restore();
}

/** The decoy drone (doc 101): a little sub with a blinking light and the ripples of its noise. */
function decoyDrone(ctx: CanvasRenderingContext2D, d: DecoyView, t: number): void {
  ctx.fillStyle = '#2f3a44';
  ctx.beginPath();
  ctx.ellipse(d.x, d.y, 3, 8, Math.atan2(d.vx, -d.vy), 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = Math.sin(t * 14) > 0 ? '#ffe36a' : '#5a5020';
  ctx.fillRect(d.x - 1, d.y - 2, 2, 2);
  ctx.strokeStyle = `rgba(190,235,255,${(0.5 * ((t * 2) % 1 > 0.5 ? 1 : 0.4)).toFixed(2)})`;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(d.x, d.y, 10 + ((t * 30) % 14), 0, Math.PI * 2);
  ctx.stroke();
}

/** A drift net (doc 101): a criss-cross mesh in a ring, fading as it sinks. */
function driftNet(ctx: CanvasRenderingContext2D, n: NetView): void {
  ctx.save();
  ctx.globalAlpha = Math.min(1, n.t / NET.seconds + 0.3);
  ctx.beginPath();
  ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(210,200,160,0.7)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.clip();
  ctx.strokeStyle = 'rgba(210,200,160,0.4)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let k = -n.r * 2; k <= n.r * 2; k += 9) {
    ctx.moveTo(n.x + k - n.r, n.y - n.r);
    ctx.lineTo(n.x + k + n.r, n.y + n.r);
    ctx.moveTo(n.x + k + n.r, n.y - n.r);
    ctx.lineTo(n.x + k - n.r, n.y + n.r);
  }
  ctx.stroke();
  ctx.restore();
}

export function drawHeliFx(ctx: CanvasRenderingContext2D, v: HeliFxView, t: number): void {
  ctx.save();
  for (const n of v.nets) driftNet(ctx, n);
  if (v.decoy) decoyDrone(ctx, v.decoy, t);
  for (const m of v.missiles) {
    if (m.kind === 'drone') drone(ctx, m);
    else if (m.kind === 'minitorp') miniTorpedo(ctx, m);
  }
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
