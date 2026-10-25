// Pixel pipeline (doc 20): turns an anti-aliased RGBA capture into clean pixel art — hard alpha, a small
// palette of the capture's own dominant flat colours (so soft shading collapses into a few clusters), every
// pixel snapped to its nearest palette colour, and a 1-px dark outline around the silhouette. Pure functions
// on RGBA byte arrays (unit-tested).

const ALPHA_CUT = 110;

export type Rgb = readonly [number, number, number];

function dist2(a: Rgb, r: number, g: number, b: number): number {
  const dr = a[0] - r;
  const dg = a[1] - g;
  const db = a[2] - b;
  return 2 * dr * dr + 4 * dg * dg + 3 * db * db;
}

/** The dominant colours of the opaque pixels: 4-bit bins by popularity, bin means, near-duplicates skipped. */
export function dominantColors(rgba: Uint8ClampedArray, max = 18, minGap = 900): Rgb[] {
  const count = new Map<number, [number, number, number, number]>();
  for (let i = 0; i < rgba.length; i += 4) {
    if ((rgba[i + 3] ?? 0) < ALPHA_CUT) continue;
    const r = rgba[i] ?? 0;
    const g = rgba[i + 1] ?? 0;
    const b = rgba[i + 2] ?? 0;
    const key = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4);
    const e = count.get(key) ?? [0, 0, 0, 0];
    e[0] += 1; e[1] += r; e[2] += g; e[3] += b;
    count.set(key, e);
  }
  const bins = [...count.values()].sort((a, b) => b[0] - a[0]);
  const out: Rgb[] = [];
  for (const [n, r, g, b] of bins) {
    if (out.length >= max) break;
    const c: Rgb = [Math.round(r / n), Math.round(g / n), Math.round(b / n)];
    if (out.every((o) => dist2(o, c[0], c[1], c[2]) > minGap)) out.push(c);
  }
  return out;
}

/** Snaps every opaque pixel to its nearest colour in `pal` and clears the rest (hard alpha), in place. */
export function snapToPalette(rgba: Uint8ClampedArray, pal: readonly Rgb[]): void {
  for (let i = 0; i < rgba.length; i += 4) {
    if ((rgba[i + 3] ?? 0) < ALPHA_CUT || pal.length === 0) {
      rgba[i + 3] = 0;
      continue;
    }
    const r = rgba[i] ?? 0;
    const g = rgba[i + 1] ?? 0;
    const b = rgba[i + 2] ?? 0;
    let best = pal[0] ?? [0, 0, 0];
    let bd = Infinity;
    for (const c of pal) {
      const d = dist2(c, r, g, b);
      if (d < bd) { bd = d; best = c; }
    }
    rgba[i] = best[0]; rgba[i + 1] = best[1]; rgba[i + 2] = best[2]; rgba[i + 3] = 255;
  }
}

/** A 1-px outline into transparent pixels touching the silhouette: the neighbour's colour darkened towards ink. */
export function outlineRgba(rgba: Uint8ClampedArray, w: number, h: number): void {
  const src = rgba.slice();
  const opaque = (c: number, r: number): number => (c >= 0 && r >= 0 && c < w && r < h && (src[(r * w + c) * 4 + 3] ?? 0) > 0 ? (r * w + c) * 4 : -1);
  for (let r = 0; r < h; r++) {
    for (let c = 0; c < w; c++) {
      const i = (r * w + c) * 4;
      if ((src[i + 3] ?? 0) > 0) continue;
      const n = Math.max(opaque(c - 1, r), opaque(c + 1, r), opaque(c, r - 1), opaque(c, r + 1));
      if (n < 0) continue;
      rgba[i] = Math.round((src[n] ?? 0) * 0.28 + 8);
      rgba[i + 1] = Math.round((src[n + 1] ?? 0) * 0.22 + 4);
      rgba[i + 2] = Math.round((src[n + 2] ?? 0) * 0.3 + 12);
      rgba[i + 3] = 255;
    }
  }
}

/** The full clean-up: dominant palette, snap, outline. */
export function pixelize(rgba: Uint8ClampedArray, w: number, h: number): void {
  snapToPalette(rgba, dominantColors(rgba));
  outlineRgba(rgba, w, h);
}
