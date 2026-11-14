import { shell, type ShellInk } from '../detail/organic';
import { bevel, glow, path, sheen, type Pts } from '../detail/parts';
import { drawCached, type Box, type Variant } from '../detail/sprite';
import { BURNT_PARTS } from '../detail/unit';
import type { JunglePal } from './jungle-pal';

// Shared pieces of the jungle planet's detailed enemies (doc 117): cached moving parts (a turret, a hull that turns, a jaw,
// a leaf — painted once, drawn in the variant the palette asks for), glows that stay out of the one-colour passes,
// tapering tails and tendrils, overlapping scales, warts, worn paint, shaded armour plates and insect wings.

type Ctx = CanvasRenderingContext2D;

/** The cache variant a moving part asks for: a part in the wreck's colour (BURNT_PARTS) is drawn sooted, like the body. */
export const variantFor = (p: JunglePal): Variant =>
  !p.mono ? { kind: 'live' } : p.body === BURNT_PARTS ? { kind: 'burnt' } : { kind: 'mono', colour: p.body };

/** A moving part that keeps its shape, painted once through the sprite cache in the live colours `live`. */
export function cachedPart(ctx: Ctx, key: string, box: Box, p: JunglePal, live: JunglePal, paint: (g: Ctx, a: JunglePal) => void): void {
  drawCached(ctx, `jungle-${key}`, box, (g) => paint(g, live), variantFor(p));
}

/** "r,g,b" of a #rrggbb colour, for the kit's glow. */
export function rgb(hex: string): string {
  const n = Number.parseInt(hex.replace('#', '').slice(0, 6), 16);
  return Number.isFinite(n) ? `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}` : '255,255,255';
}

/** A soft glow in the palette's glow colour (or `colour`); nothing in a one-colour pass. */
export function glowOf(ctx: Ctx, p: JunglePal, x: number, y: number, r: number, a = 0.6, colour = p.glow): void {
  if (!p.mono) glow(ctx, x, y, r, rgb(colour), a);
}

/** A shaded armour plate: bevelled edges lit from the upper left and a sheen across it. */
export function armour(ctx: Ctx, pts: Pts, fill: string, ink: string, w = 0.6): void {
  bevel(ctx, pts, fill, ink, w);
  const xs = pts.filter((_, i) => i % 2 === 0);
  const ys = pts.filter((_, i) => i % 2 === 1);
  sheen(ctx, path(pts), Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys), 0.8);
}

/** A tapering tail or tendril along a curve (x0, y0, cx, cy, x1, y1) from width w0 to w1: outline, colour, lit thread. */
export function taper(ctx: Ctx, q: Pts, w0: number, w1: number, c: ShellInk): void {
  const [x0, y0, cx, cy, x1, y1] = [0, 1, 2, 3, 4, 5].map((i) => q[i] ?? 0) as [number, number, number, number, number, number];
  const left: number[] = [];
  const right: number[] = [];
  const mid: number[] = [];
  for (let i = 0; i <= 12; i++) {
    const u = i / 12, v = 1 - u;
    const x = v * v * x0 + 2 * v * u * cx + u * u * x1, y = v * v * y0 + 2 * v * u * cy + u * u * y1;
    const dx = v * (cx - x0) + u * (x1 - cx), dy = v * (cy - y0) + u * (y1 - cy);
    const k = (w0 + (w1 - w0) * u) / 2 / (Math.hypot(dx, dy) || 1);
    left.push(x - dy * k, y + dx * k);
    right.unshift(x + dy * k, y - dx * k);
    mid.push(x, y);
  }
  const outline = path([...left, ...right]);
  ctx.fillStyle = c.base;
  ctx.fill(outline);
  ctx.strokeStyle = c.ink;
  ctx.lineWidth = 0.6;
  ctx.stroke(outline);
  ctx.save();
  ctx.translate(-w0 * 0.14, -w0 * 0.14);
  ctx.strokeStyle = c.light;
  ctx.lineWidth = Math.max(0.3, w0 * 0.16);
  ctx.lineCap = 'round';
  ctx.stroke(path(mid, false));
  ctx.restore();
}

/** A point and direction on a quadratic curve (x0, y0, cx, cy, x1, y1) at u. */
export function quadAt(q: Pts, u: number): [number, number, number] {
  const v = 1 - u;
  const at = (i: number): number => v * v * (q[i] ?? 0) + 2 * v * u * (q[i + 2] ?? 0) + u * u * (q[i + 4] ?? 0);
  const dx = v * ((q[2] ?? 0) - (q[0] ?? 0)) + u * ((q[4] ?? 0) - (q[2] ?? 0));
  const dy = v * ((q[3] ?? 0) - (q[1] ?? 0)) + u * ((q[5] ?? 0) - (q[3] ?? 0));
  return [at(0), at(1), Math.atan2(dy, dx)];
}

/** A glossy shell for a moving part; a plain ellipse in a one-colour pass, so no highlight leaks into it. */
export function orb(ctx: Ctx, p: JunglePal, x: number, y: number, rx: number, ry: number, c: ShellInk, segments = 0, rot = 0): void {
  if (!p.mono) return shell(ctx, x, y, rx, ry, c, segments, rot);
  ctx.fillStyle = p.body;
  ctx.beginPath();
  ctx.ellipse(x, y, rx + 0.6, ry + 0.6, rot, 0, Math.PI * 2);
  ctx.fill();
}

/** A horn, beak, crest or fang: a shaded cone from its base (x, y) along angle a, length l, half width w. */
export function fang(ctx: Ctx, x: number, y: number, a: number, l: number, w: number, c: ShellInk): void {
  const tx = x + Math.cos(a) * l, ty = y + Math.sin(a) * l;
  const nx = -Math.sin(a) * w, ny = Math.cos(a) * w;
  const lit = nx * -Math.SQRT1_2 + ny * -Math.SQRT1_2 > 0 ? 1 : -1;
  const cone = new Path2D();
  cone.moveTo(x + nx, y + ny);
  cone.quadraticCurveTo(x + nx * 0.6 + (tx - x) * 0.55, y + ny * 0.6 + (ty - y) * 0.55, tx, ty);
  cone.quadraticCurveTo(x - nx * 0.6 + (tx - x) * 0.55, y - ny * 0.6 + (ty - y) * 0.55, x - nx, y - ny);
  cone.closePath();
  const g = ctx.createLinearGradient(x + nx * lit, y + ny * lit, x - nx * lit, y - ny * lit);
  g.addColorStop(0, c.light);
  g.addColorStop(0.45, c.base);
  g.addColorStop(1, c.dark);
  ctx.fillStyle = g;
  ctx.fill(cone);
  ctx.strokeStyle = c.ink;
  ctx.lineWidth = Math.max(0.35, w * 0.25);
  ctx.stroke(cone);
}

/** Overlapping scales over an area (rows of arcs, their free edges toward the tail, −y), clipped to `clip`. */
export function scaleRows(ctx: Ctx, clip: Path2D, x0: number, y0: number, x1: number, y1: number, s: number, colour: string): void {
  ctx.save();
  ctx.clip(clip);
  ctx.strokeStyle = colour;
  ctx.lineWidth = Math.max(0.25, s * 0.13);
  let row = 0;
  for (let y = y0; y <= y1; y += s * 0.62, row++) {
    for (let x = x0 - (row % 2 ? s / 2 : 0); x <= x1 + s; x += s) {
      ctx.beginPath();
      ctx.arc(x, y, s / 2, Math.PI * 1.1, Math.PI * 1.9);
      ctx.stroke();
    }
  }
  ctx.restore();
}

/** Warts or spots (groups of x, y, r): a dark rim, the colour, a lit cap. */
export function warts(ctx: Ctx, list: Pts, base: string, light: string, dark = 'rgba(0,0,0,0.35)'): void {
  for (let i = 0; i < list.length; i += 3) {
    const x = list[i] ?? 0, y = list[i + 1] ?? 0, r = list[i + 2] ?? 1;
    ctx.fillStyle = dark;
    ctx.beginPath();
    ctx.arc(x + r * 0.2, y + r * 0.25, r * 1.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = base;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = light;
    ctx.beginPath();
    ctx.arc(x - r * 0.3, y - r * 0.3, r * 0.45, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** Worn paint: chips and scratches along x0, y0, x1, y1 groups, light metal showing through. */
export function wear(ctx: Ctx, list: Pts, w = 0.35): void {
  ctx.lineCap = 'round';
  for (let i = 0; i < list.length; i += 4) {
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.lineWidth = w * 1.6;
    ctx.beginPath();
    ctx.moveTo((list[i] ?? 0) + w * 0.4, (list[i + 1] ?? 0) + w * 0.4);
    ctx.lineTo((list[i + 2] ?? 0) + w * 0.4, (list[i + 3] ?? 0) + w * 0.4);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(230,226,200,0.55)';
    ctx.lineWidth = w;
    ctx.beginPath();
    ctx.moveTo(list[i] ?? 0, list[i + 1] ?? 0);
    ctx.lineTo(list[i + 2] ?? 0, list[i + 3] ?? 0);
    ctx.stroke();
  }
}

/** An insect wing along +x from its root (0, 0), `len` long and `w` wide: veined translucent skin, a dark leading edge
 *  and a stigma spot; a plain shape in a one-colour pass. */
export function insectWing(ctx: Ctx, p: JunglePal, len: number, w: number, alpha = 0.5): void {
  const outline = new Path2D();
  outline.moveTo(0, -w * 0.25);
  outline.bezierCurveTo(len * 0.35, -w * 0.75, len * 0.9, -w * 0.6, len, -w * 0.1);
  outline.bezierCurveTo(len * 1.02, w * 0.45, len * 0.5, w * 0.7, 0, w * 0.3);
  outline.closePath();
  if (p.mono) {
    ctx.fillStyle = p.body;
    ctx.fill(outline);
    return;
  }
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.fillStyle = p.skin;
  ctx.fill(outline);
  ctx.globalAlpha /= alpha;
  ctx.clip(outline);
  ctx.strokeStyle = 'rgba(30,40,40,0.45)';
  ctx.lineWidth = 0.3;
  for (let k = 0; k < 5; k++) { // the veins and their cross-links
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(len * 0.5, -w * 0.45 + k * w * 0.22, len, -w * 0.3 + k * w * 0.2);
    ctx.stroke();
  }
  for (let k = 1; k < 6; k++) {
    ctx.beginPath();
    ctx.moveTo(len * k * 0.16, -w * 0.6);
    ctx.lineTo(len * k * 0.16 + w * 0.1, w * 0.6);
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(255,255,255,0.28)';
  ctx.fillRect(0, -w, len, w * 0.5);
  ctx.restore();
  ctx.strokeStyle = 'rgba(20,24,20,0.7)';
  ctx.lineWidth = 0.5;
  ctx.stroke(outline);
  ctx.fillStyle = 'rgba(40,40,30,0.7)';
  ctx.beginPath();
  ctx.ellipse(len * 0.82, -w * 0.38, len * 0.06, w * 0.1, 0, 0, Math.PI * 2);
  ctx.fill();
}
