import { makeCanvas } from './post';

// Pixel pipeline (doc 20): caches and the final blit. Art buffers are painted once per state into offscreen
// canvases (an LRU cache); each frame only composes them and draws the result scaled up with
// imageSmoothingEnabled = false, at a whole number of device pixels per art pixel so every pixel is the same size.

export interface Rect { x: number; y: number; w: number; h: number }

/** Least-recently-used cache of rendered art canvases. */
export class SpriteCache {
  private readonly map = new Map<string, HTMLCanvasElement | null>();

  constructor(private readonly max: number) {}

  get size(): number { return this.map.size; }

  get(key: string, make: () => HTMLCanvasElement | null): HTMLCanvasElement | null {
    const hit = this.map.get(key);
    if (hit !== undefined) {
      this.map.delete(key);
      this.map.set(key, hit);
      return hit;
    }
    const made = make();
    this.map.set(key, made);
    if (this.map.size > this.max) {
      const oldest = this.map.keys().next();
      if (!oldest.done) this.map.delete(oldest.value);
    }
    return made;
  }
}

/** Device pixels per logical unit under the current transform. */
export function deviceScale(ctx: CanvasRenderingContext2D): number {
  const m = ctx.getTransform();
  return Math.hypot(m.a, m.b) || 1;
}

/** How a frame of art is laid onto a box: D device px per art px, k art px per frame unit, the art buffer
 *  size W × H (W even, so x = 0 sits on a pixel boundary) and L logical units per art px. */
export interface Fit { D: number; k: number; W: number; H: number; L: number }

/**
 * Picks the art grid for a box that shows a frame of `frameW × frameH` units contain-fitted. `preferK` gives the
 * wanted art resolution for the box's logical scale; the grid is then snapped to whole device pixels and the
 * resulting k (quantised to 1/32 so caches stay small) adapts to the display.
 */
export function fitBox(ctx: CanvasRenderingContext2D, box: Rect, frameW: number, frameH: number, preferK: (fs: number) => number): Fit {
  const s = deviceScale(ctx);
  const fs = Math.min(box.w / frameW, box.h / frameH);
  let D = Math.max(1, Math.round((fs * s) / preferK(fs)));
  while ((fs * s) / D > 1.1) D++;
  const k = Math.max(1 / 32, Math.round(((fs * s) / D) * 32) / 32);
  const L = D / s;
  return { D, k, W: 2 * Math.ceil(box.w / L / 2), H: Math.ceil(box.h / L), L };
}

/** Draws a composed art canvas into the box: centred, bottom-aligned, clipped, snapped to device pixels. */
export function blitBox(ctx: CanvasRenderingContext2D, art: CanvasImageSource, box: Rect, f: Fit): void {
  const m = ctx.getTransform();
  const w = f.W * f.L;
  const h = f.H * f.L;
  const x0 = box.x + (box.w - w) / 2;
  const y0 = box.y + box.h - h;
  const sx = m.a !== 0 ? (Math.round(m.a * x0 + m.e) - m.e) / m.a : x0;
  const sy = m.d !== 0 ? (Math.round(m.d * y0 + m.f) - m.f) / m.d : y0;
  ctx.save();
  ctx.beginPath();
  ctx.rect(box.x, box.y, box.w, box.h);
  ctx.clip();
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(art, 0, 0, f.W, f.H, sx, sy, w, h);
  ctx.restore();
}

const scratches = new Map<string, { canvas: HTMLCanvasElement; g: CanvasRenderingContext2D }>();

/** A cleared compose canvas of the given art size (reused across frames; one per size). */
export function scratch(w: number, h: number): { canvas: HTMLCanvasElement; g: CanvasRenderingContext2D } | null {
  const key = `${w}x${h}`;
  let s = scratches.get(key);
  if (!s) {
    const canvas = makeCanvas(w, h);
    const g = canvas.getContext('2d');
    if (!g) return null;
    if (scratches.size > 12) scratches.clear();
    s = { canvas, g };
    scratches.set(key, s);
  }
  s.g.setTransform(1, 0, 0, 1, 0, 0);
  s.g.globalAlpha = 1;
  s.g.globalCompositeOperation = 'source-over';
  s.g.imageSmoothingEnabled = false;
  s.g.clearRect(0, 0, w, h);
  return s;
}
