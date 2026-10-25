import { clamp, TAU } from '../../core/math';
import type { Vec3 } from '../../game/minigames/refuel';
import { project, v3, type Cam, type Pt } from './refuel-view';

// Hose and drogue basket (doc 15) in perspective: we look into the open end of the shuttlecock — the ring,
// canvas panels and ribs converge on the coupling the probe latches into.

export const DROGUE = Object.freeze({ ringR: 0.38, couplingR: 0.12, depth: 0.75, hoseR: 0.065 });
const PANELS = 16;

/** Quadratic sagging hose from the pod to the back of the coupling. */
export function drawHose(ctx: CanvasRenderingContext2D, cam: Cam, from: Vec3, to: Vec3, sag: number): void {
  const mid = v3((from.x + to.x) / 2, (from.y + to.y) / 2 - sag, (from.z + to.z) / 2);
  const at = (u: number): Pt => {
    const a = (1 - u) * (1 - u);
    const b = 2 * u * (1 - u);
    const c = u * u;
    return project(cam, v3(a * from.x + b * mid.x + c * to.x, a * from.y + b * mid.y + c * to.y, a * from.z + b * mid.z + c * to.z));
  };
  const pts = Array.from({ length: 25 }, (_, i) => at(i / 24));
  ctx.save();
  ctx.lineCap = 'round';
  for (const [color, scale, lift] of [['#1d2125', 1, 0], ['#59616a', 0.32, -0.3]] as const) {
    ctx.strokeStyle = color;
    for (let i = 1; i < pts.length; i++) {
      const p = pts[i - 1] as Pt;
      const q = pts[i] as Pt;
      const w = Math.max(1.2, DROGUE.hoseR * 2 * q.s * scale);
      ctx.lineWidth = w;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y + lift * w);
      ctx.lineTo(q.x, q.y + lift * w);
      ctx.stroke();
    }
  }
  // push-distance markings near the basket
  ctx.lineCap = 'butt';
  ctx.strokeStyle = '#e8e2d2';
  for (const u of [0.8, 0.86, 0.92]) {
    const p = at(u);
    const q = at(u + 0.008);
    ctx.lineWidth = Math.max(1.4, DROGUE.hoseR * 2.1 * q.s);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(q.x, q.y);
    ctx.stroke();
  }
  ctx.restore();
}

function quad(ctx: CanvasRenderingContext2D, a: Pt, b: Pt, c: Pt, d: Pt, fill: string): void {
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.lineTo(c.x, c.y);
  ctx.lineTo(d.x, d.y);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}

/** Canvas panel shade: lit from above, alternating panels. */
function panelColor(theta: number, odd: boolean): string {
  const k = 0.88 + 0.1 * Math.sin(theta) - (odd ? 0.09 : 0);
  const c = (v: number): number => Math.round(clamp(v * k, 0, 255));
  return `rgb(${c(236)},${c(240)},${c(244)})`;
}

/** The basket with its ring centred on `ring`; `lean` shifts the coupling (m) as the basket trails its motion. */
export function drawBasket(ctx: CanvasRenderingContext2D, cam: Cam, ring: Vec3, spin: number, lean: { x: number; y: number }): void {
  const c3 = v3(ring.x + lean.x, ring.y + lean.y, ring.z + DROGUE.depth);
  const theta = (i: number): number => (i / PANELS) * TAU + spin;
  const rim = (i: number, base: Vec3, r: number): Pt => project(cam, v3(base.x + Math.cos(theta(i)) * r, base.y + Math.sin(theta(i)) * r, base.z));
  const outer = Array.from({ length: PANELS + 1 }, (_, i) => rim(i, ring, DROGUE.ringR));
  const inner = Array.from({ length: PANELS + 1 }, (_, i) => rim(i, c3, DROGUE.couplingR));
  const c = project(cam, c3);
  ctx.beginPath();
  ctx.arc(c.x, c.y, DROGUE.couplingR * 1.15 * c.s, 0, TAU);
  ctx.fillStyle = '#3b4148';
  ctx.fill();
  for (let i = 0; i < PANELS; i++) {
    quad(ctx, outer[i] as Pt, outer[i + 1] as Pt, inner[i + 1] as Pt, inner[i] as Pt, panelColor(theta(i + 0.5), i % 2 === 1));
  }
  const r = project(cam, ring);
  ctx.strokeStyle = 'rgba(70,78,88,0.6)';
  ctx.lineWidth = Math.max(0.6, 0.01 * r.s);
  ctx.beginPath();
  for (let i = 0; i < PANELS; i++) {
    ctx.moveTo((outer[i] as Pt).x, (outer[i] as Pt).y);
    ctx.lineTo((inner[i] as Pt).x, (inner[i] as Pt).y);
  }
  ctx.stroke();
  drawCoupling(ctx, c);
  drawRing(ctx, outer, r);
}

function drawCoupling(ctx: CanvasRenderingContext2D, c: Pt): void {
  ctx.beginPath();
  ctx.arc(c.x, c.y, DROGUE.couplingR * c.s, 0, TAU);
  ctx.fillStyle = '#5a626b';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(c.x, c.y, DROGUE.couplingR * 0.55 * c.s, 0, TAU);
  ctx.fillStyle = '#101215';
  ctx.fill();
  ctx.strokeStyle = 'rgba(220,228,236,0.55)';
  ctx.lineWidth = Math.max(0.8, 0.012 * c.s);
  ctx.beginPath();
  ctx.arc(c.x, c.y, DROGUE.couplingR * 0.85 * c.s, Math.PI * 1.1, Math.PI * 1.75);
  ctx.stroke();
}

function drawRing(ctx: CanvasRenderingContext2D, outer: Pt[], r: Pt): void {
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.beginPath();
  outer.forEach((q, i) => (i === 0 ? ctx.moveTo(q.x, q.y) : ctx.lineTo(q.x, q.y)));
  ctx.closePath();
  ctx.strokeStyle = '#23282d';
  ctx.lineWidth = Math.max(2, 0.06 * r.s);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(170,180,190,0.7)';
  ctx.lineWidth = Math.max(0.8, 0.015 * r.s);
  ctx.stroke();
  ctx.fillStyle = '#f4f1e6';
  for (let i = 0; i < outer.length - 1; i += 4) {
    const q = outer[i] as Pt;
    ctx.beginPath();
    ctx.arc(q.x, q.y, Math.max(1, 0.018 * r.s), 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}
