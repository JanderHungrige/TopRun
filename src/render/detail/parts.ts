// The detail kit's parts (doc 113): the pieces the detailed vehicles, units and creatures are built from — bevelled
// plates lit from the upper left, bolts, grilles, mesh, hatches, cylinders, lenses, glows and antennas. Light comes from
// −x, −y of the frame the part is drawn in; flat point lists are x, y pairs.

type Ctx = CanvasRenderingContext2D;
export type Pts = readonly number[];

export const INK = 'rgba(14,12,10,0.85)';
export const LIGHT = 'rgba(255,255,255,0.3)';
export const DARK = 'rgba(0,0,0,0.36)';
const LX = -Math.SQRT1_2;
const LY = -Math.SQRT1_2;

export function path(pts: Pts, close = true): Path2D {
  const p = new Path2D();
  for (let i = 0; i < pts.length; i += 2) {
    if (i === 0) p.moveTo(pts[0] ?? 0, pts[1] ?? 0);
    else p.lineTo(pts[i] ?? 0, pts[i + 1] ?? 0);
  }
  if (close) p.closePath();
  return p;
}

/** Mirrors a right half (x ≥ 0, top to bottom) into a closed outline. */
export function sym(right: Pts): number[] {
  const out = [...right];
  for (let i = right.length - 2; i >= 0; i -= 2) if ((right[i] ?? 0) !== 0) out.push(-(right[i] ?? 0), right[i + 1] ?? 0);
  return out;
}

const area = (p: Pts): number => {
  let s = 0;
  for (let i = 0; i < p.length; i += 2) {
    const j = (i + 2) % p.length;
    s += (p[i] ?? 0) * (p[j + 1] ?? 0) - (p[j] ?? 0) * (p[i + 1] ?? 0);
  }
  return s;
};

/** Lights the edges of a polygon: a light line on the edges facing the light, a dark one on the others. */
export function edges(ctx: Ctx, pts: Pts, w = 0.5, light = LIGHT, dark = DARK): void {
  const turn = area(pts) > 0 ? 1 : -1;
  ctx.lineWidth = w;
  for (let i = 0; i < pts.length; i += 2) {
    const j = (i + 2) % pts.length;
    const x0 = pts[i] ?? 0, y0 = pts[i + 1] ?? 0, x1 = pts[j] ?? 0, y1 = pts[j + 1] ?? 0;
    const len = Math.hypot(x1 - x0, y1 - y0) || 1;
    const facing = ((y1 - y0) * turn * LX - (x1 - x0) * turn * LY) / len;
    if (Math.abs(facing) < 0.2) continue;
    ctx.strokeStyle = facing > 0 ? light : dark;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
  }
}

/** A plate: filled (null keeps what is under it), outlined, its edges lit. */
export function bevel(ctx: Ctx, pts: Pts, fill: string | null, ink = INK, w = 0.6): void {
  const p = path(pts);
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill(p);
  }
  edges(ctx, pts, w * 0.8);
  ctx.strokeStyle = ink;
  ctx.lineWidth = w;
  ctx.stroke(p);
}

export const rectPts = (x: number, y: number, w: number, h: number): number[] => [x, y, x + w, y, x + w, y + h, x, y + h];

export function plate(ctx: Ctx, x: number, y: number, w: number, h: number, fill: string | null, ink = INK, lw = 0.5): void {
  bevel(ctx, rectPts(x, y, w, h), fill, ink, lw);
}

/** A soft light-to-shade sheen over a shape (clipped to it): the shape reads as a solid lit from the upper left. */
export function sheen(ctx: Ctx, clip: Path2D, x0: number, y0: number, x1: number, y1: number, k = 1): void {
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  g.addColorStop(0, `rgba(255,255,255,${(0.22 * k).toFixed(3)})`);
  g.addColorStop(0.45, 'rgba(255,255,255,0)');
  g.addColorStop(1, `rgba(0,0,0,${(0.3 * k).toFixed(3)})`);
  ctx.save();
  ctx.clip(clip);
  ctx.fillStyle = g;
  ctx.fillRect(Math.min(x0, x1) - 1, Math.min(y0, y1) - 1, Math.abs(x1 - x0) + 2, Math.abs(y1 - y0) + 2);
  ctx.restore();
}

/** Round bolt heads at the given points. */
export function bolts(ctx: Ctx, pts: Pts, r = 0.45, fill = 'rgba(0,0,0,0.45)'): void {
  for (let i = 0; i < pts.length; i += 2) {
    const x = pts[i] ?? 0, y = pts[i + 1] ?? 0;
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fillRect(x - r * 0.7, y - r * 0.7, r * 0.6, r * 0.6);
  }
}

/** A grille of n slats across a box (slats run along x, or along y when `along` is 'y'). */
export function grille(ctx: Ctx, x: number, y: number, w: number, h: number, n: number, along: 'x' | 'y' = 'x', dark = 'rgba(0,0,0,0.5)'): void {
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fillRect(x, y, w, h);
  for (let k = 0; k < n; k++) {
    const f = (k + 0.5) / n;
    ctx.fillStyle = dark;
    if (along === 'x') ctx.fillRect(x + 0.3, y + f * h - 0.25, w - 0.6, 0.5);
    else ctx.fillRect(x + f * w - 0.25, y + 0.3, 0.5, h - 0.6);
    ctx.fillStyle = 'rgba(255,255,255,0.16)';
    if (along === 'x') ctx.fillRect(x + 0.3, y + f * h - 0.6, w - 0.6, 0.3);
    else ctx.fillRect(x + f * w - 0.6, y + 0.3, 0.3, h - 0.6);
  }
  plate(ctx, x, y, w, h, null, INK, 0.35);
}

/** Wire mesh (a stowage basket's sides): a frame and a lattice. */
export function mesh(ctx: Ctx, x: number, y: number, w: number, h: number, cell: number, wire = 'rgba(30,28,22,0.75)'): void {
  ctx.strokeStyle = wire;
  ctx.lineWidth = 0.25;
  ctx.beginPath();
  for (let u = x + cell; u < x + w; u += cell) {
    ctx.moveTo(u, y);
    ctx.lineTo(u, y + h);
  }
  for (let v = y + cell; v < y + h; v += cell) {
    ctx.moveTo(x, v);
    ctx.lineTo(x + w, v);
  }
  ctx.stroke();
  ctx.lineWidth = 0.6;
  ctx.strokeRect(x, y, w, h);
}

/** A round hatch: ring, lid, hinge and handle, lit from the upper left. */
export function hatch(ctx: Ctx, x: number, y: number, r: number, fill: string): void {
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.beginPath();
  ctx.arc(x, y, r + 0.35, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.14)';
  ctx.beginPath();
  ctx.arc(x, y, r * 0.78, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = LIGHT;
  ctx.lineWidth = 0.4;
  ctx.beginPath();
  ctx.arc(x, y, r * 0.8, Math.PI * 0.9, Math.PI * 1.6);
  ctx.stroke();
  ctx.strokeStyle = DARK;
  ctx.beginPath();
  ctx.arc(x, y, r * 0.8, Math.PI * 1.9, Math.PI * 2.6);
  ctx.stroke();
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(x + r * 0.62, y - r * 0.5, r * 0.24, r); // hinge at the side
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fillRect(x - r * 0.55, y - r * 0.08, r * 0.7, r * 0.16); // handle bar
}

/** A cylinder seen side-on in a box: its colour with a light stripe and a dark far edge across `axis`. */
export function cylinder(ctx: Ctx, x: number, y: number, w: number, h: number, fill: string, axis: 'x' | 'y' = 'y'): void {
  ctx.fillStyle = fill;
  ctx.fillRect(x, y, w, h);
  const g = axis === 'y' ? ctx.createLinearGradient(x, 0, x + w, 0) : ctx.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, 'rgba(0,0,0,0.35)');
  g.addColorStop(0.3, 'rgba(255,255,255,0.32)');
  g.addColorStop(0.55, 'rgba(255,255,255,0.05)');
  g.addColorStop(1, 'rgba(0,0,0,0.45)');
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 0.4;
  ctx.strokeRect(x, y, w, h);
}

/** A lens or lamp: dark rim, the glass, a white glint. */
export function lens(ctx: Ctx, x: number, y: number, r: number, glass: string): void {
  ctx.fillStyle = INK;
  ctx.beginPath();
  ctx.arc(x, y, r + 0.35, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = glass;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.beginPath();
  ctx.arc(x - r * 0.35, y - r * 0.35, r * 0.32, 0, Math.PI * 2);
  ctx.fill();
}

/** A soft round glow (`rgb` as "r,g,b"), strongest at the centre. */
export function glow(ctx: Ctx, x: number, y: number, r: number, rgb: string, a = 0.6): void {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, `rgba(${rgb},${a.toFixed(3)})`);
  g.addColorStop(1, `rgba(${rgb},0)`);
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
}

/** A whip antenna from its base: a dark mount and a thin rod leaning by `lean` (rad). */
export function antenna(ctx: Ctx, x: number, y: number, len: number, lean = 0): void {
  ctx.fillStyle = INK;
  ctx.beginPath();
  ctx.arc(x, y, 0.7, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(20,18,14,0.8)';
  ctx.lineWidth = 0.3;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + Math.sin(lean) * len, y - Math.cos(lean) * len);
  ctx.stroke();
}

/** A cable or hose along points, a dark line with a light thread. */
export function cable(ctx: Ctx, pts: Pts, w = 0.6, colour = '#2a2620'): void {
  const p = path(pts, false);
  ctx.strokeStyle = colour;
  ctx.lineWidth = w;
  ctx.stroke(p);
  ctx.strokeStyle = 'rgba(255,255,255,0.18)';
  ctx.lineWidth = w * 0.35;
  ctx.stroke(p);
}
