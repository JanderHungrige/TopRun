import { shade } from '../detail/color';
import { cylinder, plate, type Pts } from '../detail/parts';
import { plating } from './space-kit';
import type { ShipPal } from './space-pal';

// The equipment space's ships carry (doc 119), drawn into their cached bodies: missiles in a cradle, launch cells,
// solar wings, sensor dishes and lit windows. Light from the upper left, sterns up (−y).

type Ctx = CanvasRenderingContext2D;

/** Missiles in a cradle at (x, y), tips aft (−y): the cradle plate, white bodies with red tips and dark fins. */
export function rack(ctx: Ctx, x: number, y: number, n: number, len: number, p: ShipPal): void {
  const w = len * 0.17;
  const half = ((n - 1) / 2) * w * 1.45;
  plating(ctx, [x - half - w, y - len * 0.3, x + half + w, y - len * 0.3, x + half + w, y + len * 0.58, x - half - w, y + len * 0.58], p.dark, p, 0.5);
  for (let i = 0; i < n; i++) {
    const mx = x - half + i * w * 1.45;
    ctx.fillStyle = p.ink;
    ctx.fillRect(mx - w * 0.85, y + len * 0.36, w * 1.7, len * 0.12); // fins
    cylinder(ctx, mx - w / 2, y - len * 0.36, w, len * 0.86, '#e4e6e0');
    ctx.fillStyle = '#c8312a';
    ctx.beginPath();
    ctx.moveTo(mx - w / 2, y - len * 0.36);
    ctx.lineTo(mx, y - len * 0.58);
    ctx.lineTo(mx + w / 2, y - len * 0.36);
    ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(mx - w / 2, y - len * 0.1, w, len * 0.06);
  }
}

/** Launch cells: a dark deck plate with `cols` × `rows` hatches of size `s`. */
export function cells(ctx: Ctx, x: number, y: number, cols: number, rows: number, s: number, p: ShipPal): void {
  plating(ctx, [x - 0.6, y - 0.6, x + cols * s + 0.6, y - 0.6, x + cols * s + 0.6, y + rows * s + 0.6, x - 0.6, y + rows * s + 0.6], p.dark, p, 0.45);
  for (let c = 0; c < cols; c++) for (let r = 0; r < rows; r++) {
    plate(ctx, x + c * s + s * 0.12, y + r * s + s * 0.12, s * 0.76, s * 0.76, shade(p.hull, -0.15), p.ink, 0.25);
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(x + c * s + s * 0.42, y + r * s + s * 0.42, s * 0.16, s * 0.16);
  }
}

/** A solar wing in a box: the frame, the cells reflecting the sky, their grid and a glint. */
export function solar(ctx: Ctx, x: number, y: number, w: number, h: number, cols: number, p: ShipPal): void {
  plating(ctx, [x, y, x + w, y, x + w, y + h, x, y + h], p.metal, p, 0.5);
  const g = ctx.createLinearGradient(x, y, x + w, y + h);
  g.addColorStop(0, shade(p.cell, 0.35));
  g.addColorStop(0.5, p.cell);
  g.addColorStop(1, shade(p.cell, -0.4));
  ctx.fillStyle = g;
  ctx.fillRect(x + 0.6, y + 0.6, w - 1.2, h - 1.2);
  ctx.strokeStyle = 'rgba(160,190,240,0.4)';
  ctx.lineWidth = 0.22;
  ctx.beginPath();
  for (let c = 1; c < cols; c++) {
    ctx.moveTo(x + 0.6 + ((w - 1.2) * c) / cols, y + 0.6);
    ctx.lineTo(x + 0.6 + ((w - 1.2) * c) / cols, y + h - 0.6);
  }
  ctx.moveTo(x + 0.6, y + h / 2);
  ctx.lineTo(x + w - 0.6, y + h / 2);
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.16)';
  ctx.beginPath();
  ctx.moveTo(x + w * 0.15, y + 0.6);
  ctx.lineTo(x + w * 0.35, y + 0.6);
  ctx.lineTo(x + w * 0.2, y + h - 0.6);
  ctx.lineTo(x + w * 0.02 + 0.6, y + h - 0.6);
  ctx.fill();
}

/** A sensor dish seen from above: the rim, the bowl in shade toward the light, struts and the feed horn. */
export function dish(ctx: Ctx, x: number, y: number, r: number, p: ShipPal): void {
  ctx.fillStyle = p.ink;
  ctx.beginPath();
  ctx.arc(x, y, r + 0.4, 0, Math.PI * 2);
  ctx.fill();
  const g = ctx.createRadialGradient(x + r * 0.3, y + r * 0.3, 0, x, y, r);
  g.addColorStop(0, '#f0f2f4');
  g.addColorStop(0.6, shade(p.light, -0.05));
  g.addColorStop(1, shade(p.hull, -0.35));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(30,34,40,0.7)';
  ctx.lineWidth = Math.max(0.2, r * 0.08);
  ctx.beginPath();
  for (const a of [0.5, 2.6, 4.7]) {
    ctx.moveTo(x + Math.cos(a) * r * 0.9, y + Math.sin(a) * r * 0.9);
    ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.fillStyle = p.metal;
  ctx.beginPath();
  ctx.arc(x, y, r * 0.2, 0, Math.PI * 2);
  ctx.fill();
}

/** Lit windows: tiny warm squares at the points. */
export function windows(ctx: Ctx, pts: Pts, s = 0.7, colour = '#ffe6a0'): void {
  for (let i = 0; i < pts.length; i += 2) {
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect((pts[i] ?? 0) - s * 0.65, (pts[i + 1] ?? 0) - s * 0.65, s * 1.3, s * 1.3);
    ctx.fillStyle = colour;
    ctx.fillRect((pts[i] ?? 0) - s / 2, (pts[i + 1] ?? 0) - s / 2, s, s);
  }
}
