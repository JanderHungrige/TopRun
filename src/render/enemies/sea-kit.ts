import { plateShell } from '../detail/organic';
import { bolts, glow, path, sym, type Pts } from '../detail/parts';
import type { DetailArt } from '../detail/unit';
import { shade } from '../detail/color';
import { rgb, SEA_BOX, SEA_PAL, seaMono, type SeaKind, type SeaPal } from './sea-pal';

// Shared pieces of the sea's detailed machines (doc 120), bows down (+y), light from the upper left: a kind's art from
// its palette and box, the pressure hull (rounded by its light, framed, tiled, riveted), fins and sails, portholes, and
// the live parts — screws whose blades sweep round the hub, bubbles drifting back, lamp beams and blinking lights.

type Ctx = CanvasRenderingContext2D;

export const art = (kind: SeaKind, a: Pick<DetailArt<SeaPal>, 'body' | 'under' | 'over'>): DetailArt<SeaPal> =>
  ({ pal: SEA_PAL[kind], mono: seaMono, box: SEA_BOX[kind], ...a });

/** The mirror image of a polygon across the keel line. */
export const mirror = (pts: Pts): number[] => pts.map((v, i) => (i % 2 ? v : -v));

const xsOf = (pts: Pts): number[] => pts.filter((_, i) => i % 2 === 0);
const ysOf = (pts: Pts): number[] => pts.filter((_, i) => i % 2 === 1);

/** Light across a hull clipped to it: a lit band left of the keel, the right side falling into shade, the ends dimmed. */
function rounding(ctx: Ctx, w: number, y0: number, y1: number): void {
  const g = ctx.createLinearGradient(-w, 0, w, 0);
  g.addColorStop(0, 'rgba(0,0,0,0.32)');
  g.addColorStop(0.2, 'rgba(255,255,255,0.1)');
  g.addColorStop(0.36, 'rgba(255,255,255,0.3)');
  g.addColorStop(0.52, 'rgba(255,255,255,0.04)');
  g.addColorStop(0.8, 'rgba(0,0,0,0.26)');
  g.addColorStop(1, 'rgba(0,0,0,0.56)');
  ctx.fillStyle = g;
  ctx.fillRect(-w, y0, 2 * w, y1 - y0);
  const v = ctx.createLinearGradient(0, y0, 0, y1);
  v.addColorStop(0, 'rgba(0,0,0,0.34)');
  v.addColorStop(0.18, 'rgba(0,0,0,0)');
  v.addColorStop(0.85, 'rgba(255,255,255,0)');
  v.addColorStop(1, 'rgba(255,255,255,0.14)');
  ctx.fillStyle = v;
  ctx.fillRect(-w, y0, 2 * w, y1 - y0);
}

/** Seams across a hull at the given y: a dark groove, its far wall lit. */
export function frames(ctx: Ctx, w: number, ys: readonly number[], lw: number): void {
  for (const y of ys) {
    ctx.fillStyle = 'rgba(0,0,0,0.38)';
    ctx.fillRect(-w, y - lw / 2, 2 * w, lw);
    ctx.fillStyle = 'rgba(255,255,255,0.13)';
    ctx.fillRect(-w, y + lw / 2, 2 * w, lw * 0.7);
  }
}

/** Anechoic tiles: a faint grid of cells over the hull. */
function tiles(ctx: Ctx, w: number, y0: number, y1: number, cell: number): void {
  ctx.strokeStyle = 'rgba(0,0,0,0.13)';
  ctx.lineWidth = cell * 0.08;
  ctx.beginPath();
  for (let y = y0 + cell; y < y1; y += cell) {
    ctx.moveTo(-w, y);
    ctx.lineTo(w, y);
  }
  for (let x = -w + cell * 0.5; x < w; x += cell) for (let y = y0; y < y1; y += cell * 2) {
    const off = (Math.round((y - y0) / (cell * 2)) % 2) * cell * 0.5;
    ctx.moveTo(x + off, y);
    ctx.lineTo(x + off, y + cell * 2);
  }
  ctx.stroke();
}

export interface HullOpts { frames?: readonly number[]; tile?: number; seam?: number }

/** A pressure hull seen from above (a right half, bow at +y): its paint rounded by the light, frames, tiles, outline. */
export function hull(ctx: Ctx, right: Pts, p: SeaPal, o: HullOpts = {}): Path2D {
  const outline = path(sym(right));
  const w = Math.max(...xsOf(right));
  const y0 = Math.min(...ysOf(right)), y1 = Math.max(...ysOf(right));
  ctx.fillStyle = p.hull;
  ctx.fill(outline);
  ctx.save();
  ctx.clip(outline);
  if (o.tile) tiles(ctx, w, y0, y1, o.tile);
  rounding(ctx, w, y0, y1);
  frames(ctx, w, o.frames ?? [], o.seam ?? Math.max(0.35, w * 0.035));
  ctx.restore();
  ctx.strokeStyle = p.ink;
  ctx.lineWidth = Math.max(0.6, w * 0.05);
  ctx.stroke(outline);
  return outline;
}

/** A fin or plane (polygon) in the hull's dark paint, lit from its upper-left corner, with a lit leading edge. */
export function fin(ctx: Ctx, pts: Pts, p: SeaPal, w = 0.5): void {
  plateShell(ctx, pts, { base: p.dark, dark: shade(p.dark, -0.45), light: shade(p.hull, 0.25), ink: p.ink }, w);
}

/** A fin and its mirror image. */
export function finPair(ctx: Ctx, pts: Pts, p: SeaPal, w = 0.5): void {
  fin(ctx, pts, p, w);
  fin(ctx, mirror(pts), p, w);
}

/** A sail (conning tower) from above: its top in a gradient, the bridge well forward, masts in a row behind it. */
export function sail(ctx: Ctx, right: Pts, p: SeaPal, masts: readonly number[], fill = p.dark): void {
  const outline = sym(right);
  const ys = ysOf(right);
  const top = Math.max(...ys), w = Math.max(...xsOf(right));
  plateShell(ctx, outline, { base: fill, dark: shade(fill, -0.45), light: shade(fill, 0.35), ink: p.ink }, Math.max(0.4, w * 0.12));
  ctx.fillStyle = 'rgba(0,0,0,0.42)'; // the bridge well
  ctx.beginPath();
  ctx.ellipse(0, top - w * 1.2, w * 0.36, w * 0.42, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#9ad0e0'; // its windscreen
  ctx.fillRect(-w * 0.32, top - w * 0.72, w * 0.64, w * 0.12);
  masts.forEach((y, i) => {
    const r = w * (i === 0 ? 0.26 : 0.2);
    ctx.fillStyle = p.ink;
    ctx.beginPath();
    ctx.arc(0, y, r + w * 0.06, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = shade(fill, 0.25);
    ctx.beginPath();
    ctx.arc(0, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fillRect(-r * 0.6, y - r * 0.6, r * 0.5, r * 0.5);
  });
}

/** A porthole: a bolted rim, the glass (lit or dark), a glint. */
export function port(ctx: Ctx, x: number, y: number, r: number, p: SeaPal, glass: string): void {
  ctx.fillStyle = p.ink;
  ctx.beginPath();
  ctx.arc(x, y, r * 1.45, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = shade(p.hull, 0.2);
  ctx.beginPath();
  ctx.arc(x, y, r * 1.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = glass;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.beginPath();
  ctx.arc(x - r * 0.35, y - r * 0.35, r * 0.3, 0, Math.PI * 2);
  ctx.fill();
}

/** Rows of rivets along the hull sides at ±x from y0 to y1. */
export function rivets(ctx: Ctx, x: number, y0: number, y1: number, step: number, r: number): void {
  const pts: number[] = [];
  for (let y = y0; y <= y1; y += step) pts.push(-x, y, x, y);
  bolts(ctx, pts, r);
}

/** A turning screw at (x, y), radius w, its axis along y: blades sweeping round the hub, the blur, the hub cone. */
export function screw(ctx: Ctx, p: SeaPal, x: number, y: number, w: number, t: number, n = 5): void {
  if (p.mono) {
    ctx.fillStyle = p.hull;
    ctx.beginPath();
    ctx.ellipse(x, y, w * 0.32, w * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  ctx.fillStyle = 'rgba(200,228,238,0.16)';
  ctx.beginPath();
  ctx.ellipse(x, y, w, w * 0.3, 0, 0, Math.PI * 2);
  ctx.fill();
  for (const front of [false, true]) for (let i = 0; i < n; i++) {
    const a = t * 18 + (i / n) * Math.PI * 2;
    const s = Math.sin(a), c = Math.cos(a);
    if (c > 0 !== front) continue;
    const ch = w * 0.34 * (0.4 + 0.6 * Math.abs(c));
    const blade = [x, y - ch * 0.45, x + s * w * 0.8, y - ch, x + s * w, y - ch * 0.2, x + s * w * 0.75, y + ch * 0.55, x, y + ch * 0.45];
    plateShell(ctx, blade, { base: front ? p.metal : shade(p.metal, -0.4), dark: shade(p.metal, -0.5), light: shade(p.metal, 0.45), ink: p.ink }, w * 0.05);
  }
  plateShell(ctx, [x - w * 0.2, y + w * 0.12, x + w * 0.2, y + w * 0.12, x + w * 0.1, y - w * 0.3, x, y - w * 0.36, x - w * 0.1, y - w * 0.3],
    { base: shade(p.metal, -0.15), dark: shade(p.metal, -0.55), light: shade(p.metal, 0.5), ink: p.ink }, w * 0.05);
}

/** Bubbles drifting back (−y) from a point and wobbling, smaller to larger, fading. */
export function bubbles(ctx: Ctx, p: SeaPal, x: number, y: number, t: number, n: number, drift: number, size: number): void {
  if (p.mono) return;
  for (let i = 0; i < n; i++) {
    const k = (((t * 0.9 + i / n) % 1) + 1) % 1;
    const bx = x + Math.sin(t * 5 + i * 2.3) * (1 + k * drift * 0.12);
    const by = y - k * drift;
    const r = size * (0.45 + k * 0.9);
    const a = 0.6 * (1 - k);
    ctx.fillStyle = `rgba(210,240,255,${(a * 0.3).toFixed(3)})`;
    ctx.strokeStyle = `rgba(225,248,255,${a.toFixed(3)})`;
    ctx.lineWidth = Math.max(0.25, r * 0.22);
    ctx.beginPath();
    ctx.arc(bx, by, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = `rgba(255,255,255,${a.toFixed(3)})`;
    ctx.fillRect(bx - r * 0.5, by - r * 0.5, r * 0.35, r * 0.35);
  }
}

/** A lamp's beam reaching ahead (+y) from (x, y) into the water. */
export function beam(ctx: Ctx, p: SeaPal, x: number, y: number, len: number, w: number, a = 0.28): void {
  if (p.mono) return;
  const g = ctx.createLinearGradient(0, y, 0, y + len);
  g.addColorStop(0, `rgba(${rgb(p.glow)},${a.toFixed(3)})`);
  g.addColorStop(1, `rgba(${rgb(p.glow)},0)`);
  ctx.fillStyle = g;
  ctx.fill(path([x - w * 0.25, y, x + w * 0.25, y, x + w, y + len, x - w, y + len]));
}

/** A small light: a soft halo and a hot core, at strength `on` (0…1). */
export function lamp(ctx: Ctx, p: SeaPal, x: number, y: number, r: number, colour: string, on: number): void {
  if (p.mono || on <= 0) return;
  glow(ctx, x, y, r * 3.2, rgb(colour), 0.55 * on);
  ctx.fillStyle = colour;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = `rgba(255,255,255,${(0.85 * on).toFixed(3)})`;
  ctx.beginPath();
  ctx.arc(x - r * 0.25, y - r * 0.25, r * 0.45, 0, Math.PI * 2);
  ctx.fill();
}
