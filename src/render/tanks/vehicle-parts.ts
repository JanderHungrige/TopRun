import type { Look } from '../livery-art';
import { cylinder, INK, lens, mesh, plate } from '../detail/parts';

// Parts the motor pool's vehicles share (doc 114): jerrycans, stowage baskets, smoke dischargers, light bars, crew
// helmets, tyres and track links — in their own colours, lit from the upper left like the detail kit's parts.

type Ctx = CanvasRenderingContext2D;

export const C = {
  track: '#211f1b',
  link: '#4b463d',
  linkHi: '#79736a',
  rubber: '#1d1b19',
  steel: '#5b5d57',
  steelHi: '#9a9c94',
  gun: '#4a4d46',
  can: '#5d6640',
  fatigue: '#6b6648',
  helmet: '#6f6a4c',
  tarp: '#7a7356',
  glass: '#4f8296',
  amber: '#ffcf6a',
  red: '#c8312a',
} as const;

const keys = new WeakMap<Look, string>();
let looks = 0;

/** A stable key for a look (the paint jobs are module constants), for the sprite cache. */
export function lookKey(look: Look): string {
  let k = keys.get(look);
  if (!k) keys.set(look, (k = `look${(looks += 1)}`));
  return k;
}

/** A jerrycan from above (w × h, the handle end toward −y) or the side: olive, the X pressed into it, the cap. */
export function jerrycan(ctx: Ctx, x: number, y: number, w: number, h: number): void {
  plate(ctx, x, y, w, h, C.can, INK, 0.35);
  ctx.strokeStyle = 'rgba(0,0,0,0.3)';
  ctx.lineWidth = 0.25;
  ctx.beginPath();
  ctx.moveTo(x + w * 0.2, y + h * 0.3);
  ctx.lineTo(x + w * 0.8, y + h * 0.9);
  ctx.moveTo(x + w * 0.8, y + h * 0.3);
  ctx.lineTo(x + w * 0.2, y + h * 0.9);
  ctx.stroke();
  ctx.fillStyle = '#2a2a1e';
  ctx.fillRect(x + w * 0.15, y - 0.35, w * 0.3, 0.6); // the cap
  ctx.fillRect(x + w * 0.55, y + 0.05, w * 0.3, 0.35); // the handle
}

/** A stowage basket: a mesh frame with rolled tarps and bags in it. */
export function basket(ctx: Ctx, x: number, y: number, w: number, h: number): void {
  ctx.fillStyle = 'rgba(20,18,14,0.55)';
  ctx.fillRect(x, y, w, h);
  for (let k = 0; k < 3; k++) {
    const bx = x + 0.6 + (k * (w - 1.2)) / 3;
    cylinder(ctx, bx, y + 0.5, (w - 1.2) / 3 - 0.3, h - 1, k === 1 ? C.can : C.tarp, 'x');
  }
  mesh(ctx, x, y, w, h, 1.2);
}

/** A bank of n smoke dischargers: short tubes in a row along x, their mouths toward −y. */
export function smokeBank(ctx: Ctx, x: number, y: number, n: number, gap = 1.05): void {
  for (let k = 0; k < n; k++) {
    cylinder(ctx, x + k * gap, y, 0.8, 1.9, '#4a4a40', 'y');
    ctx.fillStyle = '#121210';
    ctx.fillRect(x + k * gap + 0.15, y, 0.5, 0.35);
  }
}

/** A light bar with n lamps across x (top view or side), lit. */
export function lightBar(ctx: Ctx, x: number, y: number, w: number, n: number): void {
  cylinder(ctx, x, y - 0.5, w, 1, '#2c2c28', 'x');
  for (let k = 0; k < n; k++) lens(ctx, x + ((k + 0.5) * w) / n, y, 0.45, '#f4e8b8');
}

/** A crew member from above: shoulders in fatigues and the helmet with its goggles band. */
export function crewTop(ctx: Ctx, x: number, y: number, r = 1.8): void {
  ctx.fillStyle = INK;
  ctx.beginPath();
  ctx.ellipse(x, y + r * 0.4, r * 1.55, r * 0.95, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = C.fatigue;
  ctx.beginPath();
  ctx.ellipse(x, y + r * 0.4, r * 1.4, r * 0.8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = INK;
  ctx.beginPath();
  ctx.arc(x, y, r + 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = C.helmet;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.28)';
  ctx.beginPath();
  ctx.arc(x - r * 0.35, y - r * 0.35, r * 0.45, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#2a2a22';
  ctx.fillRect(x - r * 0.75, y - r * 0.8, r * 1.5, r * 0.35); // goggles band at the front
}

/** A tyre from above: rubber with lugs sliding by `off` (0 … 2.2), the sidewall's light edge on the outer side. */
export function tyreTop(ctx: Ctx, x: number, y: number, w: number, l: number, off: number): void {
  ctx.fillStyle = INK;
  ctx.beginPath();
  ctx.roundRect(x - w / 2 - 0.4, y - l / 2 - 0.4, w + 0.8, l + 0.8, 2);
  ctx.fill();
  ctx.fillStyle = C.rubber;
  ctx.beginPath();
  ctx.roundRect(x - w / 2, y - l / 2, w, l, 1.8);
  ctx.fill();
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x - w / 2, y - l / 2, w, l, 1.8);
  ctx.clip();
  ctx.fillStyle = '#3d3a35';
  for (let v = y - l / 2 - 2.2 + off; v < y + l / 2 + 1; v += 2.2) {
    ctx.fillRect(x - w / 2 + 0.4, v, w * 0.42, 0.9); // staggered lugs
    ctx.fillRect(x + 0.2, v + 1.1, w * 0.42, 0.9);
  }
  ctx.fillStyle = 'rgba(255,255,255,0.1)';
  ctx.fillRect(x - w / 2, y - l / 2, w * 0.25, l);
  ctx.restore();
}

/** A tyre from the side: tread lugs round it (turning with `turn`), the sidewall, the rim with bolts and the hub. */
export function tyreSide(ctx: Ctx, x: number, y: number, r: number, turn: number): void {
  ctx.fillStyle = INK;
  ctx.beginPath();
  ctx.arc(x, y, r + 0.5, 0, Math.PI * 2);
  ctx.fill();
  for (let k = 0; k < 16; k++) {
    const a = turn + (k * Math.PI) / 8;
    ctx.fillStyle = '#2c2a26';
    ctx.save();
    ctx.translate(x + Math.cos(a) * r, y + Math.sin(a) * r);
    ctx.rotate(a);
    ctx.fillRect(-0.55, -0.9, 1.1, 1.8);
    ctx.restore();
  }
  ctx.fillStyle = C.rubber;
  ctx.beginPath();
  ctx.arc(x, y, r - 0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.arc(x, y, r - 1.2, Math.PI * 1.05, Math.PI * 1.6);
  ctx.stroke();
  rim(ctx, x, y, r * 0.52, turn);
}

/** A wheel rim: steel disc, a ring of bolts turning with `turn`, the hub cap. */
export function rim(ctx: Ctx, x: number, y: number, r: number, turn: number): void {
  ctx.fillStyle = C.steel;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  const g = ctx.createRadialGradient(x - r * 0.4, y - r * 0.4, 0, x, y, r);
  g.addColorStop(0, 'rgba(255,255,255,0.35)');
  g.addColorStop(1, 'rgba(0,0,0,0.35)');
  ctx.fillStyle = g;
  ctx.fill();
  ctx.fillStyle = '#2a2a26';
  for (let k = 0; k < 6; k++) {
    const a = turn + (k * Math.PI) / 3;
    ctx.beginPath();
    ctx.arc(x + Math.cos(a) * r * 0.62, y + Math.sin(a) * r * 0.62, Math.max(0.25, r * 0.13), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = C.steelHi;
  ctx.beginPath();
  ctx.arc(x, y, r * 0.3, 0, Math.PI * 2);
  ctx.fill();
}
