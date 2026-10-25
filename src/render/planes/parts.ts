import { flame } from '../shapes';

/** Detail parts shared by the jets: nozzles with petals, missiles, landing gear, helmets, canopy glare. */

const METAL = '#5b6169';
const PETAL = 'rgba(18,22,28,0.55)';

/** Top-view nozzle: tube from y0 to y1 centred on cx, radius r0 → r1, serrated petal end. */
export function nozzleTop(ctx: CanvasRenderingContext2D, cx: number, y0: number, y1: number, r0: number, r1: number): void {
  const n = 6;
  ctx.beginPath();
  ctx.moveTo(cx - r0, y0);
  ctx.lineTo(cx + r0, y0);
  for (let i = n; i >= 0; i--) ctx.lineTo(cx - r1 + (2 * r1 * i) / n, i % 2 === 0 ? y1 - 0.45 : y1);
  ctx.closePath();
  ctx.fillStyle = METAL;
  ctx.fill();
  const len = y1 - y0;
  ctx.fillStyle = 'rgba(255,255,255,0.24)';
  ctx.fillRect(cx - r0 * 0.72, y0, r0 * 0.42, len * 0.85);
  ctx.fillStyle = 'rgba(0,0,0,0.28)';
  ctx.fillRect(cx + r0 * 0.38, y0, r0 * 0.5, len * 0.85);
  ctx.strokeStyle = PETAL;
  ctx.lineWidth = 0.22;
  ctx.beginPath();
  ctx.moveTo(cx - r0, y0 + len * 0.35);
  ctx.lineTo(cx + r0, y0 + len * 0.35);
  for (const k of [-0.6, -0.2, 0.2, 0.6]) {
    ctx.moveTo(cx + k * r0, y0 + len * 0.35);
    ctx.lineTo(cx + k * r1, y1 - 0.3);
  }
  ctx.stroke();
}

/** Side-view nozzle from x0 (attached) to x1 (exit, further aft), centre height cy, radius r0 → r1. */
export function nozzleSide(ctx: CanvasRenderingContext2D, x0: number, x1: number, cy: number, r0: number, r1: number): void {
  ctx.beginPath();
  ctx.moveTo(x0, cy - r0);
  ctx.lineTo(x1, cy - r1);
  ctx.lineTo(x1, cy + r1);
  ctx.lineTo(x0, cy + r0);
  ctx.closePath();
  ctx.fillStyle = METAL;
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.22)';
  ctx.fillRect(Math.min(x0, x1), cy - r0 * 0.78, Math.abs(x1 - x0), r0 * 0.36);
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fillRect(Math.min(x0, x1), cy + r0 * 0.35, Math.abs(x1 - x0), r0 * 0.55);
  const seam = x0 + (x1 - x0) * 0.35;
  ctx.strokeStyle = PETAL;
  ctx.lineWidth = 0.25;
  ctx.beginPath();
  ctx.moveTo(seam, cy - r0);
  ctx.lineTo(seam, cy + r0);
  for (const k of [-0.62, -0.22, 0.2, 0.6]) {
    ctx.moveTo(seam, cy + k * r0);
    ctx.lineTo(x1, cy + k * r1);
  }
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(x1, cy, r1 * 0.22, r1, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#2a2d33';
  ctx.fill();
}

/** Exhaust flame pointing aft (-x) from the side-view nozzle exit. */
export function flameSide(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, power: number, t: number): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(Math.PI / 2);
  ctx.scale(1, 1.6);
  flame(ctx, 0, 0, w, power, t);
  ctx.restore();
}

/** Short-range missile seen from above, nose up, from y to y + len. */
export function missileTop(ctx: CanvasRenderingContext2D, x: number, y: number, len: number, r: number): void {
  ctx.fillStyle = '#7d8790';
  ctx.beginPath();
  for (const [fy, span] of [[0.16, 2.2], [0.86, 2.8]] as const) {
    ctx.moveTo(x, y + len * fy - r);
    ctx.lineTo(x + r * span, y + len * fy + r * 1.4);
    ctx.lineTo(x - r * span, y + len * fy + r * 1.4);
    ctx.closePath();
  }
  ctx.fill();
  ctx.fillStyle = '#e4e7ea';
  ctx.fillRect(x - r, y + r, r * 2, len - r);
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.fillRect(x + r * 0.2, y + r, r * 0.8, len - r);
  ctx.fillStyle = '#b8862e';
  ctx.fillRect(x - r, y + len * 0.3, r * 2, r * 0.6);
  ctx.beginPath();
  ctx.ellipse(x, y + r, r, r, 0, Math.PI, Math.PI * 2);
  ctx.fillStyle = '#56626e';
  ctx.fill();
}

/** Missile seen from the side, nose pointing +x, from x back to x - len. */
export function missileSide(ctx: CanvasRenderingContext2D, x: number, y: number, len: number, r: number): void {
  ctx.fillStyle = '#7d8790';
  ctx.beginPath();
  for (const [fx, h] of [[0.16, 2.2], [0.88, 2.8]] as const) {
    ctx.moveTo(x - len * fx + r, y);
    ctx.lineTo(x - len * fx - r * 1.4, y - r * h);
    ctx.lineTo(x - len * fx - r * 1.4, y + r * h);
    ctx.closePath();
  }
  ctx.fill();
  ctx.fillStyle = '#e4e7ea';
  ctx.fillRect(x - len, y - r, len - r, r * 2);
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.fillRect(x - len, y + r * 0.1, len - r, r * 0.9);
  ctx.fillStyle = '#b8862e';
  ctx.fillRect(x - len * 0.32, y - r, r * 0.6, r * 2);
  ctx.beginPath();
  ctx.ellipse(x - r, y, r, r, 0, -Math.PI / 2, Math.PI / 2);
  ctx.fillStyle = '#56626e';
  ctx.fill();
}

export function wheel(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, far = false): void {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = far ? '#121417' : '#1b1e22';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x, y, r * 0.56, 0, Math.PI * 2);
  ctx.fillStyle = far ? '#5d646c' : '#9aa2ab';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x, y, r * 0.22, 0, Math.PI * 2);
  ctx.fillStyle = '#454b52';
  ctx.fill();
}

export interface GearOpts {
  door: string; // door colour (the livery's lower-surface colour)
  doorSide: 1 | -1; // door hinge ahead (1) or behind (-1) the leg
  wheels?: readonly number[]; // x offsets of extra wheels (bogie / twin)
  far?: boolean; // the extra wheels sit on the far side (twin nose wheels) and are drawn darker
  rake?: number; // strut top x offset (raked legs)
}

/** Landing gear leg with oleo, door and wheel(s). `g` 1 = down (wheel on the deck at y = 0), 0 = stowed. */
export function gearLeg(ctx: CanvasRenderingContext2D, x: number, belly: number, wr: number, g: number, o: GearOpts): void {
  if (g <= 0.05) return;
  const stowed = belly - wr - 1;
  const cy = stowed + (-wr - stowed) * g;
  const hx = x + o.doorSide * wr * 1.3;
  const a = g * Math.PI * 0.46;
  const dl = wr * 2.4;
  ctx.lineCap = 'round';
  ctx.strokeStyle = 'rgba(20,24,30,0.6)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(hx, belly);
  ctx.lineTo(hx - o.doorSide * Math.cos(a) * dl, belly + Math.sin(a) * dl);
  ctx.stroke();
  ctx.strokeStyle = o.door;
  ctx.lineWidth = 0.75;
  ctx.stroke();
  const top = x + (o.rake ?? 0);
  ctx.strokeStyle = '#555c65';
  ctx.lineWidth = wr * 0.42;
  ctx.beginPath();
  ctx.moveTo(top, belly - 1);
  ctx.lineTo(x, cy);
  ctx.stroke();
  ctx.strokeStyle = '#c7cdd3';
  ctx.lineWidth = wr * 0.24;
  ctx.beginPath();
  ctx.moveTo(x + (top - x) * 0.45, cy + (belly - 1 - cy) * 0.45);
  ctx.lineTo(x, cy);
  ctx.stroke();
  const extra = o.wheels ?? [];
  if (extra.length > 0 && !o.far) {
    ctx.strokeStyle = '#555c65';
    ctx.lineWidth = wr * 0.5;
    ctx.beginPath();
    ctx.moveTo(x + Math.min(...extra), cy);
    ctx.lineTo(x + Math.max(...extra), cy);
    ctx.stroke();
  }
  for (const dx of extra) wheel(ctx, x + dx, cy, wr, o.far === true);
  wheel(ctx, x, cy, wr);
}

/** Pilot helmet seen from the side, facing +x. */
export function helmet(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, shell: string, visor: string): void {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = shell;
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(x + r * 0.42, y + r * 0.08, r * 0.62, r * 0.5, 0, -Math.PI / 2, Math.PI / 2);
  ctx.fillStyle = visor;
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(x - r * 0.25, y - r * 0.45, r * 0.38, r * 0.18, -0.3, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.fill();
}

export function glare(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, rot: number, alpha: number): void {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(255,255,255,${alpha})`;
  ctx.fill();
}
