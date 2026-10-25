import { clamp, TAU } from '../../core/math';
import { COLORS, text } from '../text';

// Missile Evasion (doc 16): threat displays in screen space — the RWR ring around the jet, the
// flare decoy cone behind it and markers at the screen edge for launches and off-screen missiles.

export const RWR_RADIUS = 80;
/** How close a missile is: far (amber), near (red, break window), now (flashing red). */
export type Urgency = 'far' | 'near' | 'now';
export interface RwrBlip { bearing: number; urgency: Urgency; label: string; flareable: boolean }
export interface RwrLaunch { bearing: number; label: string; progress: number }

const URGENT: Readonly<Record<Urgency, { color: string; size: number }>> = {
  far: { color: COLORS.amber, size: 7 },
  near: { color: COLORS.red, size: 9 },
  now: { color: '#ff2a2a', size: 11 },
};

const onRing = (x: number, y: number, bearing: number, r: number): [number, number] =>
  [x + Math.sin(bearing) * r, y - Math.cos(bearing) * r];

function ringFrame(ctx: CanvasRenderingContext2D, x: number, y: number, alert: boolean, t: number): void {
  ctx.strokeStyle = alert && Math.sin(t * 14) > 0 ? 'rgba(255,90,80,0.55)' : 'rgba(120,255,170,0.32)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(x, y, RWR_RADIUS, 0, TAU);
  ctx.stroke();
  ctx.beginPath();
  for (let i = 0; i < 12; i++) {
    const [ax, ay] = onRing(x, y, (i * TAU) / 12, RWR_RADIUS);
    const [bx, by] = onRing(x, y, (i * TAU) / 12, RWR_RADIUS - (i % 3 === 0 ? 8 : 4));
    ctx.moveTo(ax, ay);
    ctx.lineTo(bx, by);
  }
  ctx.stroke();
}

function blip(ctx: CanvasRenderingContext2D, x: number, y: number, b: RwrBlip, t: number): void {
  const u = URGENT[b.urgency];
  if (b.urgency === 'now' && Math.sin(t * 24) < -0.2) return;
  const [px, py] = onRing(x, y, b.bearing, RWR_RADIUS + 2);
  ctx.save();
  ctx.translate(px, py);
  ctx.rotate(b.bearing);
  ctx.fillStyle = u.color;
  ctx.beginPath();
  ctx.moveTo(0, u.size);
  ctx.lineTo(-u.size * 0.8, -u.size * 0.6);
  ctx.lineTo(u.size * 0.8, -u.size * 0.6);
  ctx.closePath();
  ctx.fill();
  if (b.flareable) {
    ctx.strokeStyle = COLORS.green;
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  ctx.restore();
  const [lx, ly] = onRing(x, y, b.bearing, RWR_RADIUS + 18);
  text(ctx, b.label, lx, ly + 4, { size: 10, display: true, align: 'center', color: u.color, stroke: 'rgba(0,0,0,0.6)', strokeWidth: 3 });
}

/** The RWR ring: a blip per tracking missile, pulsing arcs for announced launches. */
export function drawRwr(ctx: CanvasRenderingContext2D, x: number, y: number, blips: readonly RwrBlip[], launches: readonly RwrLaunch[], t: number): void {
  ringFrame(ctx, x, y, blips.some((b) => b.urgency !== 'far'), t);
  for (const l of launches) {
    const a = 0.45 + 0.45 * Math.sin(t * 18);
    ctx.strokeStyle = `rgba(255,200,80,${a.toFixed(3)})`;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(x, y, RWR_RADIUS + 9, l.bearing - Math.PI / 2 - 0.22, l.bearing - Math.PI / 2 + 0.22);
    ctx.stroke();
  }
  for (const b of blips) blip(ctx, x, y, b, t);
}

/**
 * The flare decoy cone behind the jet: bright up to `cone` off the tail, faint to the beam.
 * `hot` = a tracking missile sits in it and a flare is ready.
 */
export function drawDecoyCone(
  ctx: CanvasRenderingContext2D, x: number, y: number, heading: number, range: number, cone: number, hot: boolean, t: number,
): void {
  const tail = heading + Math.PI / 2;
  const glow = hot ? 0.2 + 0.08 * Math.sin(t * 12) : 0.08;
  const g = ctx.createRadialGradient(x, y, 20, x, y, range);
  g.addColorStop(0, `rgba(110,255,150,${(glow * 1.4).toFixed(3)})`);
  g.addColorStop(1, 'rgba(110,255,150,0)');
  const wedge = (half: number): void => {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.arc(x, y, range, tail - half, tail + half);
    ctx.closePath();
  };
  ctx.fillStyle = g;
  wedge(cone);
  ctx.fill();
  ctx.globalAlpha = 0.45;
  wedge(Math.PI / 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.strokeStyle = `rgba(120,255,160,${hot ? 0.55 : 0.22})`;
  ctx.lineWidth = 1.2;
  ctx.setLineDash([6, 8]);
  wedge(cone);
  ctx.stroke();
  ctx.setLineDash([]);
}

/** Field edges in screen space (inside the shell's top bar). */
const EDGE = { x0: 26, x1: 1254, y0: 82, y1: 694 };

/** Marker at the screen edge towards an off-screen point: a launch warning or a missile. */
export function drawEdgeMarker(
  ctx: CanvasRenderingContext2D, sx: number, sy: number, label: string, warn: boolean, progress: number, t: number,
): void {
  if (sx > EDGE.x0 && sx < EDGE.x1 && sy > EDGE.y0 && sy < EDGE.y1) return;
  const x = clamp(sx, EDGE.x0, EDGE.x1);
  const y = clamp(sy, EDGE.y0, EDGE.y1);
  const a = Math.atan2(sx - x, -(sy - y));
  const color = warn ? COLORS.gold : COLORS.red;
  ctx.save();
  ctx.translate(x, y);
  ctx.globalAlpha = warn ? 0.6 + 0.4 * Math.sin(t * 16) : 0.85;
  ctx.rotate(a);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, -12);
  ctx.lineTo(-9, 4);
  ctx.lineTo(9, 4);
  ctx.closePath();
  ctx.fill();
  if (warn) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, -2, 17, -Math.PI / 2, -Math.PI / 2 + TAU * progress);
    ctx.stroke();
  }
  ctx.restore();
  const lx = clamp(x, 60, 1220);
  const ly = clamp(y, 108, 670);
  text(ctx, label, lx + (x < 640 ? 18 : -18), ly + (y < 388 ? 22 : -14), { size: 11, display: true, align: x < 640 ? 'left' : 'right', color, stroke: 'rgba(0,0,0,0.6)', strokeWidth: 3 });
}
