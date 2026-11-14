import { shade } from '../detail/color';
import { bolts, cylinder, lens, path, sym } from '../detail/parts';
import type { ShipPal } from './space-pal';

// Space's gun turrets in detail (doc 119): the ring each one turns on (static, in the cached body) and the turret itself,
// turned to the aim live — its barrels with jackets and muzzle brakes, the armoured housing shaded in the frame's light
// however it turns, a seam, the sight and a hatch. Plain in one colour.

type Ctx = CanvasRenderingContext2D;

/** The turret ring on the deck at (x, y): a dark well, a bolted collar. */
export function turretRing(ctx: Ctx, x: number, y: number, r: number, p: ShipPal): void {
  ctx.fillStyle = p.ink;
  ctx.beginPath();
  ctx.arc(x, y, r + 0.5, 0, Math.PI * 2);
  ctx.fill();
  const g = ctx.createLinearGradient(x - r, y - r, x + r, y + r);
  g.addColorStop(0, shade(p.metal, 0.3));
  g.addColorStop(1, shade(p.metal, -0.45));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.beginPath();
  ctx.arc(x, y, r * 0.78, 0, Math.PI * 2);
  ctx.fill();
  const n = Math.max(6, Math.round(r * 1.2));
  const pts: number[] = [];
  for (let k = 0; k < n; k++) pts.push(x + Math.cos((k / n) * Math.PI * 2) * r * 0.89, y + Math.sin((k / n) * Math.PI * 2) * r * 0.89);
  bolts(ctx, pts, Math.max(0.25, r * 0.06));
}

function barrel(ctx: Ctx, p: ShipPal, x: number, y0: number, len: number, w: number): void {
  if (p.mono) {
    ctx.fillStyle = p.metal;
    ctx.fillRect(x - w / 2, y0, w, len);
    ctx.fillRect(x - w * 0.75, y0 + len - w * 1.1, w * 1.5, w * 1.1);
    return;
  }
  cylinder(ctx, x - w / 2, y0, w, len, p.metal, 'y');
  ctx.fillStyle = 'rgba(0,0,0,0.38)';
  ctx.fillRect(x - w / 2, y0 + len * 0.42, w, w * 0.45); // the jacket's band
  ctx.fillStyle = p.ink;
  ctx.fillRect(x - w * 0.75, y0 + len - w * 1.1, w * 1.5, w * 1.1); // muzzle brake
  ctx.fillStyle = 'rgba(255,255,255,0.28)';
  ctx.fillRect(x - w * 0.75, y0 + len - w * 1.1, w * 0.5, w * 1.1);
}

function housingShade(ctx: Ctx, shape: Path2D, r: number, turn: number): void {
  ctx.save();
  ctx.clip(shape);
  ctx.rotate(-turn); // the light stays put while the turret turns
  const g = ctx.createRadialGradient(-r * 0.4, -r * 0.4, 0, 0, 0, r * 1.15);
  g.addColorStop(0, 'rgba(255,255,255,0.42)');
  g.addColorStop(0.45, 'rgba(255,255,255,0.04)');
  g.addColorStop(1, 'rgba(0,0,0,0.42)');
  ctx.fillStyle = g;
  ctx.fillRect(-r * 1.2, -r * 1.2, r * 2.4, r * 2.4);
  ctx.restore();
}

/** A gun turret at the origin turned to `aim` (0 = up, clockwise; the barrels along +y after the turn): `n` barrels
 *  `len`·r long, the armoured housing, its sight and hatch. */
export function turret(ctx: Ctx, p: ShipPal, r: number, n: number, len: number, aim: number): void {
  const turn = aim - Math.PI;
  ctx.save();
  ctx.rotate(turn);
  const bw = Math.max(1.1, r * 0.19);
  for (let i = 0; i < n; i++) barrel(ctx, p, (i - (n - 1) / 2) * r * 0.4, r * 0.3, r * len, bw);
  const shape = path(sym([0, r * 0.84, r * 0.6, r * 0.8, r * 0.95, r * 0.14, r * 0.84, -r * 0.6, r * 0.46, -r * 0.92, 0, -r * 0.96]));
  ctx.fillStyle = p.hull;
  ctx.fill(shape);
  if (!p.mono) {
    ctx.fillStyle = shade(p.hull, 0.18);
    ctx.fill(path(sym([0, r * 0.84, r * 0.6, r * 0.8, r * 0.7, r * 0.42, 0, r * 0.4])));
    housingShade(ctx, shape, r, turn);
    ctx.strokeStyle = 'rgba(0,0,0,0.4)';
    ctx.lineWidth = Math.max(0.25, r * 0.05);
    ctx.beginPath();
    ctx.moveTo(-r * 0.86, -r * 0.28);
    ctx.lineTo(r * 0.86, -r * 0.28);
    ctx.stroke();
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(-r * 0.2, -r * 0.8, r * 0.4, r * 0.3); // the vent at the back
    lens(ctx, r * 0.5, r * 0.36, r * 0.13, p.glass); // the sight
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.arc(-r * 0.36, -r * 0.05, r * 0.2, 0, Math.PI * 2); // the hatch
    ctx.fill();
  }
  ctx.strokeStyle = p.ink;
  ctx.lineWidth = Math.max(0.4, r * 0.07);
  ctx.stroke(shape);
  ctx.restore();
}
