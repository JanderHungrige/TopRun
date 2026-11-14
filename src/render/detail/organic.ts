import { path, type Pts } from './parts';

// The detail kit's organic parts (docs 113, 115): glossy segmented shells, chitin plates, jointed limbs, glowing eyes,
// veins, spines and wing membranes for creatures and alien machines. Light from the upper left (−x, −y); colours come
// from the caller, so a one-colour palette draws a clean silhouette.

type Ctx = CanvasRenderingContext2D;

export interface ShellInk {
  base: string;
  dark: string;
  light: string;
  ink: string;
}

/** A glossy shell: the ellipse in a gradient from its lit edge to its shadow, segment seams across it, a highlight. */
export function shell(ctx: Ctx, x: number, y: number, rx: number, ry: number, c: ShellInk, segments = 0, rot = 0): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.fillStyle = c.ink;
  ctx.beginPath();
  ctx.ellipse(0, 0, rx + 0.6, ry + 0.6, 0, 0, Math.PI * 2);
  ctx.fill();
  const g = ctx.createRadialGradient(-rx * 0.35, -ry * 0.4, 0, 0, 0, Math.max(rx, ry) * 1.05);
  g.addColorStop(0, c.light);
  g.addColorStop(0.45, c.base);
  g.addColorStop(1, c.dark);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.clip();
  ctx.strokeStyle = c.dark;
  ctx.lineWidth = Math.max(0.35, Math.min(rx, ry) * 0.06);
  for (let k = 1; k < segments + 1; k++) {
    const sy = -ry + (k * 2 * ry) / (segments + 1);
    ctx.beginPath();
    ctx.ellipse(0, sy - ry * 0.25, rx * 1.05, ry * 0.42, 0, Math.PI * 0.08, Math.PI * 0.92);
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(255,255,255,0.32)';
  ctx.beginPath();
  ctx.ellipse(-rx * 0.38, -ry * 0.42, rx * 0.28, ry * 0.16, -0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** A chitin or armour plate (polygon) in a gradient from its lit corner, outlined. */
export function plateShell(ctx: Ctx, pts: Pts, c: ShellInk, w = 0.6): void {
  const p = path(pts);
  const xs = pts.filter((_, i) => i % 2 === 0);
  const ys = pts.filter((_, i) => i % 2 === 1);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  g.addColorStop(0, c.light);
  g.addColorStop(0.5, c.base);
  g.addColorStop(1, c.dark);
  ctx.fillStyle = g;
  ctx.fill(p);
  ctx.strokeStyle = c.ink;
  ctx.lineWidth = w;
  ctx.stroke(p);
}

/** A jointed limb along points (hip → knee → … → foot): dark outline, its colour, a lit thread, round joints. */
export function limb(ctx: Ctx, pts: Pts, w: number, c: ShellInk): void {
  const p = path(pts, false);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = c.ink;
  ctx.lineWidth = w + 1;
  ctx.stroke(p);
  ctx.strokeStyle = c.base;
  ctx.lineWidth = w;
  ctx.stroke(p);
  ctx.save();
  ctx.translate(-w * 0.18, -w * 0.18);
  ctx.strokeStyle = c.light;
  ctx.lineWidth = Math.max(0.3, w * 0.28);
  ctx.stroke(p);
  ctx.restore();
  for (let i = 2; i < pts.length - 2; i += 2) {
    ctx.fillStyle = c.dark;
    ctx.beginPath();
    ctx.arc(pts[i] ?? 0, pts[i + 1] ?? 0, w * 0.62, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** Glowing eyes at the points: a dark socket, the coloured eye, a hot core (and a halo when `halo`). */
export function eyes(ctx: Ctx, pts: Pts, r: number, colour: string, core: string, halo = false): void {
  for (let i = 0; i < pts.length; i += 2) {
    const x = pts[i] ?? 0, y = pts[i + 1] ?? 0;
    if (halo) {
      const g = ctx.createRadialGradient(x, y, 0, x, y, r * 3);
      g.addColorStop(0, colour);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.globalAlpha *= 0.45;
      ctx.fillStyle = g;
      ctx.fillRect(x - r * 3, y - r * 3, r * 6, r * 6);
      ctx.globalAlpha /= 0.45;
    }
    ctx.fillStyle = 'rgba(10,6,12,0.9)';
    ctx.beginPath();
    ctx.arc(x, y, r * 1.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = colour;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = core;
    ctx.beginPath();
    ctx.arc(x - r * 0.25, y - r * 0.25, r * 0.4, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** Veins as curves from a root: each entry is the control and end point (cx, cy, x, y). */
export function veins(ctx: Ctx, x: number, y: number, list: Pts, colour: string, w = 0.6): void {
  ctx.strokeStyle = colour;
  ctx.lineWidth = w;
  ctx.lineCap = 'round';
  for (let i = 0; i < list.length; i += 4) {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(list[i] ?? 0, list[i + 1] ?? 0, list[i + 2] ?? 0, list[i + 3] ?? 0);
    ctx.stroke();
  }
}

/** Spines: triangles from base point (x, y) pointing along angle a, length l, width w — groups of x, y, a, l, w. */
export function spines(ctx: Ctx, list: Pts, c: ShellInk): void {
  for (let i = 0; i < list.length; i += 5) {
    const [x, y, a, l, w] = [0, 1, 2, 3, 4].map((k) => list[i + k] ?? 0) as [number, number, number, number, number];
    const tx = x + Math.cos(a) * l, ty = y + Math.sin(a) * l;
    const nx = -Math.sin(a) * w, ny = Math.cos(a) * w;
    ctx.fillStyle = c.ink;
    ctx.beginPath();
    ctx.moveTo(x + nx * 1.3, y + ny * 1.3);
    ctx.lineTo(tx, ty);
    ctx.lineTo(x - nx * 1.3, y - ny * 1.3);
    ctx.fill();
    ctx.fillStyle = c.light;
    ctx.beginPath();
    ctx.moveTo(x + nx, y + ny);
    ctx.lineTo(tx, ty);
    ctx.lineTo(x, y);
    ctx.fill();
  }
}

/** A wing membrane: the outline filled translucent over a gradient, its ribs from the root to the edge points. */
export function membrane(ctx: Ctx, outline: Pts, rootX: number, rootY: number, ribs: Pts, c: ShellInk, skin: string): void {
  const p = path(outline);
  ctx.fillStyle = c.ink;
  ctx.fill(p);
  ctx.save();
  ctx.clip(p);
  ctx.fillStyle = skin;
  ctx.fill(p);
  const xs = outline.filter((_, i) => i % 2 === 0);
  const g = ctx.createLinearGradient(Math.min(...xs), 0, Math.max(...xs), 0);
  g.addColorStop(0, 'rgba(255,255,255,0.18)');
  g.addColorStop(1, 'rgba(0,0,0,0.3)');
  ctx.fillStyle = g;
  ctx.fill(p);
  ctx.restore();
  ctx.strokeStyle = c.base;
  ctx.lineWidth = 1;
  for (let i = 0; i < ribs.length; i += 2) {
    ctx.beginPath();
    ctx.moveTo(rootX, rootY);
    ctx.lineTo(ribs[i] ?? 0, ribs[i + 1] ?? 0);
    ctx.stroke();
  }
  ctx.strokeStyle = c.ink;
  ctx.lineWidth = 0.6;
  ctx.stroke(p);
}
