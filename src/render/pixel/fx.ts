import type { Ramp } from './palette';
import { path } from './path';
import { bayer, minus, type Mask, type Pattern, type Pix } from './raster';

// Pixel pipeline (doc 20): background helpers — ordered-dither gradients, recolouring along a ramp, rects.

/** Vertical gradient through `colors` (palette indices) from frame y0 to y1 as flat bands joined by short
 *  ordered-dither seams (about `seam` px wide); rows above / below take the end colours. Fills the buffer width. */
export function vgrad(p: Pix, colors: readonly number[], y0: number, y1: number, clip?: Mask, seam = 4): void {
  const r0 = p.Y(y0);
  const r1 = p.Y(y1);
  const n = colors.length - 1;
  const band = Math.max(1, r1 - r0) / Math.max(1, n);
  for (let r = 0; r < p.h; r++) {
    const t = Math.max(0, Math.min(1, (r + 0.5 - r0) / Math.max(1, r1 - r0))) * n;
    const i = Math.min(n - 1, Math.floor(t));
    const lvl = Math.max(0, Math.min(1, (t - i - 0.5) * (band / seam) + 0.5));
    const a = colors[i] ?? 0;
    const b = colors[i + 1] ?? a;
    for (let c = 0; c < p.w; c++) {
      if (clip && !clip[r * p.w + c]) continue;
      p.data[r * p.w + c] = bayer(lvl)(c, r) ? b : a;
    }
  }
}

/** Moves every pixel of `mask` that is painted in `ramp` by `steps` along it (lighter > 0, darker < 0). */
export function shiftRamp(p: Pix, mask: Mask, ramp: Ramp, steps: number, pattern?: Pattern): void {
  for (let i = 0; i < mask.length; i++) {
    if (!mask[i]) continue;
    if (pattern && !pattern(i % p.w, Math.floor(i / p.w))) continue;
    const at = ramp.indexOf(p.data[i] ?? 0);
    if (at < 0) continue;
    p.data[i] = ramp[Math.max(1, Math.min(ramp.length - 1, at + steps))] ?? p.data[i] ?? 0;
  }
}

/** Banded light around (x, y): `steps` nested discs, each lightening what lies under it one step along `ramp`,
 *  with a one-pixel dithered rim; the innermost disc has radius r. */
export function glow(p: Pix, x: number, y: number, r: number, ramp: Ramp, steps: number, spread = 0.9): void {
  for (let s = steps; s >= 1; s--) {
    const rad = r * (1 + (s - 1) * spread);
    const core = p.oval(x, y, rad, rad);
    shiftRamp(p, minus(p.oval(x, y, rad + 1.4 / p.k, rad + 1.4 / p.k), core), ramp, 1, bayer(0.5));
    shiftRamp(p, core, ramp, 1);
  }
}

/** Frame-unit rectangle. */
export function rect(p: Pix, x: number, y: number, w: number, h: number, v: number, clip?: Mask, pattern?: Pattern): Mask {
  const m = p.shape(path().rect(x, y, w, h));
  p.paint(m, v, clip, pattern);
  return m;
}

/** Sunburst wedges around (cx, cy): `n` rays of angular width `wide` starting at `a0`. */
export function rays(p: Pix, cx: number, cy: number, n: number, wide: number, a0: number, reach = 200): Mask {
  const pa = path();
  for (let i = 0; i < n; i++) {
    const a = a0 + (i / n) * Math.PI * 2;
    pa.move(cx, cy).line(cx + Math.cos(a) * reach, cy + Math.sin(a) * reach)
      .line(cx + Math.cos(a + wide) * reach, cy + Math.sin(a + wide) * reach).close();
  }
  return p.shape(pa);
}
