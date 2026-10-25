import { SpriteCache, type Rect } from './blit';
import { makeCanvas } from './post';
import { pixelize } from './quantize';

// Pixel pipeline (doc 20): pixel art from vector drawings that animate continuously (the people kit). The
// drawing is rendered small — about ART_UNITS drawing units per art pixel, snapped so one art pixel is a whole
// number of device pixels — then cleaned up (quantize.ts), cached per state and blitted with hard edges in the
// caller's transform (mirroring included).

/** Drawing units per art pixel at one device pixel per unit (the push-up figures at DPR 1). */
const ART_UNITS = 3;
const cache = new SpriteCache(700);
let work: { canvas: HTMLCanvasElement; g: CanvasRenderingContext2D } | null = null;

function workCanvas(w: number, h: number): CanvasRenderingContext2D | null {
  if (!work) {
    const canvas = makeCanvas(w, h);
    const g = canvas.getContext('2d', { willReadFrequently: true });
    if (!g) return null;
    work = { canvas, g };
  }
  makeCanvas(w, h, work.canvas);
  work.g.setTransform(1, 0, 0, 1, 0, 0);
  work.g.clearRect(0, 0, w, h);
  return work.g;
}

function render(bounds: Rect, G: number, draw: (g: CanvasRenderingContext2D) => void): HTMLCanvasElement | null {
  const w = Math.ceil(bounds.w / G) + 2;
  const h = Math.ceil(bounds.h / G) + 2;
  const g = workCanvas(w, h);
  if (!g) return null;
  g.setTransform(1 / G, 0, 0, 1 / G, 1 - bounds.x / G, 1 - bounds.y / G);
  draw(g);
  const img = g.getImageData(0, 0, w, h);
  pixelize(img.data, w, h);
  const out = makeCanvas(w, h);
  out.getContext('2d')?.putImageData(img, 0, 0);
  return out;
}

/** Art grid: drawing units per art pixel at one device pixel per unit, and the smallest device pixel size. */
export interface PixelOpts { units?: number; minD?: number }

/**
 * Draws `draw` (vector art in the current transform's units, inside `bounds`) as pixel art. `key` must identify
 * everything the drawing depends on; the same key always shows the cached frame.
 */
export function drawPixelated(
  ctx: CanvasRenderingContext2D, key: string, bounds: Rect, draw: (g: CanvasRenderingContext2D) => void, o: PixelOpts = {},
): void {
  const m = ctx.getTransform();
  const s = Math.hypot(m.a, m.b);
  if (!(s > 0)) return;
  const D = Math.max(o.minD ?? 2, Math.round((o.units ?? ART_UNITS) * s));
  const G = D / s;
  const art = cache.get(`${key}|${D}|${Math.round(s * 512)}`, () => render(bounds, G, draw));
  if (!art) return;
  const x = bounds.x - G;
  const y = bounds.y - G;
  const X = m.a * x + m.c * y + m.e;
  const Y = m.b * x + m.d * y + m.f;
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(art, x + (m.a ? (Math.round(X) - X) / m.a : 0), y + (m.d ? (Math.round(Y) - Y) / m.d : 0), art.width * G, art.height * G);
  ctx.restore();
}
