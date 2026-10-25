import { TAU } from '../../core/math';
import { project, v3, VIEW, type Cam, type Pt } from './refuel-view';

// The receiver's cockpit (doc 15): refuelling probe on the right of the nose (fixed in the view), the
// canopy bow and the glareshield along the bottom.

/** The eye relative to the probe tip. */
const EYE: Cam = { x: VIEW.eyeX, y: VIEW.eyeY, z: VIEW.eyeZ };
const BASE = v3(0.5, -0.46, -2.7);
const NOZZLE = 0.3;
export const GLARE_TOP = 646;

function probeAt(u: number): Pt {
  return project(EYE, v3(BASE.x * (1 - u), BASE.y * (1 - u), BASE.z * (1 - u)));
}

/** A tapered tube between u0 and u1 (0 = base, 1 = tip) with radius r (m). */
function tube(ctx: CanvasRenderingContext2D, u0: number, u1: number, r: number, light: string, dark: string): void {
  const a = probeAt(u0);
  const b = probeAt(u1);
  const len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
  const nx = -(b.y - a.y) / len;
  const ny = (b.x - a.x) / len;
  ctx.beginPath();
  ctx.moveTo(a.x + nx * r * a.s, a.y + ny * r * a.s);
  ctx.lineTo(b.x + nx * r * b.s, b.y + ny * r * b.s);
  ctx.lineTo(b.x - nx * r * b.s, b.y - ny * r * b.s);
  ctx.lineTo(a.x - nx * r * a.s, a.y - ny * r * a.s);
  ctx.closePath();
  const g = ctx.createLinearGradient(b.x + nx * r * b.s, b.y + ny * r * b.s, b.x - nx * r * b.s, b.y - ny * r * b.s);
  g.addColorStop(0, dark);
  g.addColorStop(0.35, light);
  g.addColorStop(0.55, light);
  g.addColorStop(1, dark);
  ctx.fillStyle = g;
  ctx.fill();
}

/** The probe from off-screen lower right to its nozzle at PROBE_TIP. */
export function drawProbe(ctx: CanvasRenderingContext2D): void {
  const len = Math.hypot(BASE.x, BASE.y, BASE.z);
  const n0 = 1 - NOZZLE / len;
  tube(ctx, 0, n0, 0.07, '#c9cfd5', '#4c535b');
  tube(ctx, n0 - 0.012, n0 + 0.012, 0.082, '#9aa2aa', '#30353b');
  tube(ctx, n0, 0.995, 0.06, '#dfe3e7', '#5e656d');
  const tip = probeAt(1);
  ctx.beginPath();
  ctx.arc(tip.x, tip.y, 0.06 * tip.s, 0, TAU);
  ctx.fillStyle = '#7d858d';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(tip.x - 0.012 * tip.s, tip.y - 0.012 * tip.s, 0.032 * tip.s, 0, TAU);
  ctx.fillStyle = '#e9edf0';
  ctx.fill();
}

/** Canopy bow, faint reflections on the glass and the glareshield. */
export function drawCanopy(ctx: CanvasRenderingContext2D): void {
  ctx.save();
  ctx.fillStyle = 'rgba(140,180,220,0.08)';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, 560);
  ctx.quadraticCurveTo(90, 120, 640, 70);
  ctx.quadraticCurveTo(1190, 120, 1280, 560);
  ctx.lineTo(1280, 0);
  ctx.closePath();
  ctx.fill();
  ctx.lineCap = 'round';
  for (const [w, color] of [[18, '#1a1f25'], [3, '#4d565f']] as const) {
    ctx.strokeStyle = color;
    ctx.lineWidth = w;
    ctx.beginPath();
    ctx.moveTo(-10, 580);
    ctx.quadraticCurveTo(80, 112, 640, 62);
    ctx.quadraticCurveTo(1200, 112, 1290, 580);
    ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(255,255,255,0.05)';
  ctx.lineWidth = 40;
  ctx.beginPath();
  ctx.moveTo(250, 640);
  ctx.lineTo(430, 120);
  ctx.moveTo(1010, 620);
  ctx.lineTo(1120, 330);
  ctx.stroke();
  ctx.restore();
  drawGlareshield(ctx);
}

function drawGlareshield(ctx: CanvasRenderingContext2D): void {
  ctx.beginPath();
  ctx.moveTo(0, 720);
  ctx.lineTo(0, GLARE_TOP + 34);
  ctx.quadraticCurveTo(640, GLARE_TOP - 34, 1280, GLARE_TOP + 34);
  ctx.lineTo(1280, 720);
  ctx.closePath();
  const g = ctx.createLinearGradient(0, GLARE_TOP - 20, 0, 720);
  g.addColorStop(0, '#2a3038');
  g.addColorStop(0.2, '#171b20');
  g.addColorStop(1, '#0c0e11');
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = 'rgba(160,175,190,0.35)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, GLARE_TOP + 34);
  ctx.quadraticCurveTo(640, GLARE_TOP - 34, 1280, GLARE_TOP + 34);
  ctx.stroke();
}
