import { MEDALS, type MedalId } from '../../data/medals';
import { deviceScale, SpriteCache } from '../pixel/blit';
import { shiftRamp } from '../pixel/fx';
import { path } from '../pixel/path';
import { Pix, union, type Mask } from '../pixel/raster';
import { DESIGNS, type Paint } from './designs';
import { bevel } from './metal';
import { hexRamp, METAL, outline, toCanvas, type Ramp } from './palette';
import { badge, clasp, cross, disc, star, wings, type Paints } from './pendants';
import { brooch, longDrape, paintRibbonBar, ring, shortDrape, stripesOf } from './ribbon';

/**
 * Medal art (doc 25): every medal of the catalogue as pixel art hanging from its striped ribbon, and the small
 * ribbon bar for a uniform's chest rows. Used by the ceremony and the locker. Designed in a 64 × 96 unit frame
 * (origin = top centre of the brooch bar, y down), rasterised per size with the pixel pipeline, cached, and
 * blitted crisply at whole device pixels.
 */

export { paintRibbonBar } from './ribbon';
export const MEDAL_W = 64;
export const MEDAL_H = 96;
/** Width ÷ height of the medal frame. */
export const MEDAL_ASPECT = MEDAL_W / MEDAL_H;
const SHINE_FRAMES = 12;

/** How far down the frame each shape reaches (for centring a medal by its art rather than its frame). */
export function medalBottom(id: MedalId): number {
  switch (MEDALS[id].look.shape) {
    case 'ribbon': return 92;
    case 'star': return 92;
    case 'cross': return 90;
    case 'disc': return 88;
    case 'wings': return 72;
    case 'pin': return 85;
    default: throw new Error(`unhandled: ${MEDALS[id].look.shape satisfies never}`);
  }
}

function paintsOf(id: MedalId): Paints {
  const metal = METAL[MEDALS[id].look.metal];
  const d = DESIGNS[id];
  const res = (c: Paint): Ramp => (c === 'metal' ? metal : hexRamp(c));
  return { metal, enamel: hexRamp(d.enamel), mark: res(d.mark), accent: res(d.accent) };
}

/** A short metal stem from the ring down to a pendant that hangs lower (wings). */
function stem(p: Pix, metal: Ramp, y0: number, y1: number): Mask {
  const m = p.shape(path().rect(-1.7, y0, 3.4, y1 - y0));
  bevel(p, m, metal, 0, (y0 + y1) / 2, 3);
  return m;
}

function pendant(p: Pix, id: MedalId, pt: Paints): Mask {
  const d = DESIGNS[id];
  switch (MEDALS[id].look.shape) {
    case 'ribbon': return disc(p, pt, d, 61, 16.5);
    case 'star': return star(p, pt, d, 67, 24.5);
    case 'cross': return cross(p, pt, d, 67, 23);
    case 'disc': return disc(p, pt, d, 66, 22);
    case 'wings': return union(stem(p, pt.metal, 43, 56), wings(p, pt, d, 62));
    case 'pin': return badge(p, pt, d, 65);
    default: throw new Error(`unhandled: ${MEDALS[id].look.shape satisfies never}`);
  }
}

/** Paints medal `id` with its ribbon into `p` (art = (ox, oy) + frame · k); returns the metal mask. */
export function paintMedal(p: Pix, id: MedalId): Mask {
  const pt = paintsOf(id);
  const stripes = stripesOf(id);
  if (MEDALS[id].look.shape === 'ribbon') {
    longDrape(p, stripes);
    const top = union(brooch(p, pt.metal, 15), clasp(p, pt.metal, 30));
    return union(top, pendant(p, id, pt));
  }
  shortDrape(p, stripes);
  const top = union(brooch(p, pt.metal, 13), ring(p, pt.metal, 41.5));
  return union(top, pendant(p, id, pt));
}

/** A diagonal light sweep over the metal at position u (0 … 1). */
function sweep(p: Pix, metal: Mask, ramp: Ramp, u: number): void {
  const centre = -0.15 + u * 1.3;
  const band = metal.map((v, i) => {
    const c = i % p.w;
    const d = (c + (i - c) / p.w) / (p.w + p.h) - centre;
    return v && Math.abs(d) < 0.055 ? 1 : 0;
  });
  shiftRamp(p, band, ramp, 2);
}

const cache = new SpriteCache(220);

function renderMedal(id: MedalId, W: number, H: number, k: number, shine: number): HTMLCanvasElement | null {
  const p = new Pix(W, H, k, W / 2, 1);
  const metal = paintMedal(p, id);
  if (shine >= 0) sweep(p, metal, METAL[MEDALS[id].look.metal], shine / SHINE_FRAMES);
  outline(p);
  return toCanvas(p);
}

/** Draws an art canvas with its top-left at (x, y), L logical units per art pixel, snapped to device pixels. */
function blit(ctx: CanvasRenderingContext2D, art: HTMLCanvasElement, x: number, y: number, L: number): void {
  const m = ctx.getTransform();
  const sx = m.a !== 0 ? (Math.round(m.a * x + m.e) - m.e) / m.a : x;
  const sy = m.d !== 0 ? (Math.round(m.d * y + m.f) - m.f) / m.d : y;
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(art, sx, sy, art.width * L, art.height * L);
  ctx.restore();
}

export interface MedalOpts {
  /** Logical units per art pixel (default ≈ size / 96, at least 2); always whole device pixels. */
  px?: number;
  /** 0 … 1: position of a diagonal shine over the metal (12 frames); omit for none. */
  shine?: number;
}

/** The medal hanging from its ribbon: (x, y) = top centre of the brooch bar, `size` = height in logical units. */
export function drawMedal(ctx: CanvasRenderingContext2D, id: MedalId, x: number, y: number, size: number, o: MedalOpts = {}): void {
  if (!(size > 0)) return;
  const s = deviceScale(ctx);
  const D = Math.max(1, Math.round((o.px ?? Math.max(2, size / MEDAL_H)) * s));
  const L = D / s;
  const k = Math.max(1 / 32, Math.round((size / MEDAL_H / L) * 32) / 32);
  const W = 2 * Math.ceil((MEDAL_W / 2) * k) + 2;
  const H = Math.ceil(MEDAL_H * k) + 3;
  const shine = o.shine === undefined ? -1 : Math.round(Math.max(0, Math.min(1, o.shine)) * SHINE_FRAMES);
  const art = cache.get(`${id}|${k}|${shine}`, () => renderMedal(id, W, H, k, shine));
  if (art) blit(ctx, art, x - (W / 2) * L, y - L, L);
}

/** The ribbon bar for a uniform's chest rows: (x, y) = top-left, w × h logical units. */
export function drawRibbonBar(ctx: CanvasRenderingContext2D, id: MedalId, x: number, y: number, w: number, h: number, o: { px?: number } = {}): void {
  if (!(w > 0 && h > 0)) return;
  const s = deviceScale(ctx);
  const D = Math.max(1, Math.round((o.px ?? h / 9) * s));
  const L = D / s;
  const W = Math.max(3, Math.round(w / L));
  const H = Math.max(2, Math.round(h / L));
  const art = cache.get(`bar|${id}|${W}x${H}`, () => {
    const p = new Pix(W, H);
    paintRibbonBar(p, id);
    return toCanvas(p);
  });
  if (art) blit(ctx, art, x, y, L);
}
