import { circle, ellipse } from '../shapes';
import { cached, type AirPal } from './kit';

/** Animated propellers and rotors. Everything is driven by `t`; silhouettes get a flat translucent disc. */

const BLADE = '#24251f';

/**
 * Propeller seen edge-on from above at (x, y): the disc is perpendicular to the flight path, so it
 * reads as a thin band of radius r. `sets` = 2 gives contra-rotating pairs (Tu-95).
 */
export function prop(ctx: CanvasRenderingContext2D, a: AirPal, x: number, y: number, r: number, t: number, sets: number, blades: number): void {
  const a0 = ctx.globalAlpha;
  const span = (sets - 1) * 0.55;
  ctx.globalAlpha = a0 * (a.mono ? 0.35 : 0.11);
  ellipse(ctx, x, y, r, r * 0.13 + span, a.mono ? a.dark : '#0f1113');
  ctx.globalAlpha = a0;
  if (a.mono) return;
  ctx.lineWidth = 0.95;
  ctx.lineCap = 'round';
  ctx.strokeStyle = 'rgba(24,26,28,0.62)';
  ctx.beginPath();
  for (let k = 0; k < sets; k++) {
    const spin = t * (k ? -37 : 41) + k * 0.4;
    const dy = sets > 1 ? (k ? -span : span) : 0;
    for (let b = 0; b < blades; b++) {
      const ang = spin + (b * Math.PI * 2) / blades;
      ctx.moveTo(x, y + dy);
      ctx.lineTo(x + Math.cos(ang) * r, y + dy + Math.sin(ang) * r * 0.13);
    }
  }
  ctx.stroke();
  ctx.lineCap = 'butt';
  ctx.lineWidth = 0.25;
  ctx.strokeStyle = 'rgba(230,232,228,0.1)';
  ctx.beginPath();
  ctx.ellipse(x, y, r, r * 0.13 + span, 0, 0, Math.PI * 2);
  ctx.stroke();
}

function disc(ctx: CanvasRenderingContext2D, r: number): CanvasGradient {
  return cached(ctx, `rotor${r}`, () => {
    const g = ctx.createRadialGradient(0, 0, r * 0.1, 0, 0, r);
    g.addColorStop(0, 'rgba(18,18,14,0.02)');
    g.addColorStop(0.7, 'rgba(18,18,14,0.08)');
    g.addColorStop(0.95, 'rgba(18,18,14,0.2)');
    g.addColorStop(1, 'rgba(18,18,14,0.06)');
    return g;
  });
}

function blade(ctx: CanvasRenderingContext2D, b: number, r: number, w: number): void {
  const c = Math.cos(b);
  const s = Math.sin(b);
  ctx.moveTo(c * 1.6 + s * w * 0.8, s * 1.6 - c * w * 0.8);
  ctx.lineTo(c * r + s * w, s * r - c * w);
  ctx.lineTo(c * r - s * w, s * r + c * w);
  ctx.lineTo(c * 1.6 - s * w * 0.8, s * 1.6 + c * w * 0.8);
  ctx.closePath();
}

/** Main rotor around (0, 0) with blur disc, two motion ghosts and the hub. `ang` grows clockwise. */
export function mainRotor(ctx: CanvasRenderingContext2D, a: AirPal, r: number, ang: number, blades: number): void {
  const a0 = ctx.globalAlpha;
  ctx.globalAlpha = a0 * (a.mono ? 0.3 : 1);
  ctx.fillStyle = a.mono ? a.dark : disc(ctx, r);
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  if (!a.mono) {
    ctx.lineWidth = 0.3;
    ctx.strokeStyle = 'rgba(235,235,225,0.09)';
    ctx.stroke();
  }
  // a cached shadow (mono, not live) only shows the disc: frozen blades would not turn with the rotor
  for (let ghost = 2; ghost >= 0 && (a.live || !a.mono); ghost--) {
    ctx.globalAlpha = a0 * (a.mono ? 1 : [0.62, 0.22, 0.1][ghost] ?? 1);
    ctx.beginPath();
    for (let i = 0; i < blades; i++) blade(ctx, ang - ghost * 0.14 + (i * Math.PI * 2) / blades, r, 0.72);
    ctx.fillStyle = a.mono ? a.dark : BLADE;
    ctx.fill();
  }
  ctx.globalAlpha = a0;
  circle(ctx, 0, 0, 2.3, a.mono ? a.dark : '#3a3b33');
  if (!a.mono) circle(ctx, -0.5, -0.5, 1.1, '#5d5f55');
}

/** Tail rotor seen from above: its disc contains the fore-aft axis, so it shows as a thin vertical band. */
export function tailRotor(ctx: CanvasRenderingContext2D, a: AirPal, x: number, y: number, r: number, ang: number): void {
  const a0 = ctx.globalAlpha;
  ctx.globalAlpha = a0 * (a.mono ? 0.35 : 0.22);
  ellipse(ctx, x, y, r * 0.15, r, a.mono ? a.dark : '#121210');
  ctx.globalAlpha = a0;
  if (a.mono) return;
  ctx.lineWidth = 0.6;
  ctx.strokeStyle = 'rgba(30,30,26,0.8)';
  ctx.beginPath();
  for (let b = 0; b < 3; b++) {
    const k = ang + (b * Math.PI * 2) / 3;
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.sin(k) * r * 0.15, y + Math.cos(k) * r);
  }
  ctx.stroke();
  circle(ctx, x, y, 0.55, '#3a3b33');
}
