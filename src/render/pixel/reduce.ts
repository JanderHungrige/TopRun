// Image portraits (doc 33): pixel art shown smaller than its own grid. Instead of a nearest-neighbour shrink (which
// drops whole rows and columns) the image is reduced by area — every target pixel averages the source pixels it
// covers — and snapped back onto the image's own palette, so the result is still hard-edged pixel art in the
// owner's colours. Also the green radio-feed remap. Pure functions on RGBA byte arrays (unit-tested).

/** Packed 0xRRGGBB. */
export type Packed = number;

const pack = (r: number, g: number, b: number): Packed => (r << 16) | (g << 8) | b;

/** The distinct opaque colours of an image (the indexed PNGs have at most 64). */
export function imagePalette(rgba: Uint8ClampedArray, max = 256): Packed[] {
  const seen = new Set<Packed>();
  for (let i = 0; i < rgba.length && seen.size < max; i += 4) {
    if ((rgba[i + 3] ?? 0) >= 128) seen.add(pack(rgba[i] ?? 0, rgba[i + 1] ?? 0, rgba[i + 2] ?? 0));
  }
  return [...seen];
}

function nearest(pal: readonly Packed[], r: number, g: number, b: number): Packed {
  let best = pal[0] ?? 0;
  let bd = Infinity;
  for (const c of pal) {
    const dr = ((c >> 16) & 255) - r;
    const dg = ((c >> 8) & 255) - g;
    const db = (c & 255) - b;
    const d = 2 * dr * dr + 4 * dg * dg + 3 * db * db;
    if (d < bd) {
      bd = d;
      best = c;
    }
  }
  return best;
}

/** One target pixel: the coverage-weighted mean of the source pixels under it (RGB weighted by alpha). */
function areaMean(src: Uint8ClampedArray, sw: number, x0: number, x1: number, y0: number, y1: number): [number, number, number, number] {
  let r = 0, g = 0, b = 0, a = 0, w = 0;
  for (let y = Math.floor(y0); y < Math.ceil(y1); y++) {
    const wy = Math.min(y + 1, y1) - Math.max(y, y0);
    for (let x = Math.floor(x0); x < Math.ceil(x1); x++) {
      const wx = Math.min(x + 1, x1) - Math.max(x, x0);
      const i = (y * sw + x) * 4;
      const ww = wx * wy;
      const al = (src[i + 3] ?? 0) / 255;
      r += (src[i] ?? 0) * ww * al;
      g += (src[i + 1] ?? 0) * ww * al;
      b += (src[i + 2] ?? 0) * ww * al;
      a += al * ww;
      w += ww;
    }
  }
  return a > 0 ? [r / a, g / a, b / a, (a / w) * 255] : [0, 0, 0, 0];
}

/** Reduces an sw × sh image to dw × dh (dw ≤ sw, dh ≤ sh) by area, snapping every pixel to `pal`. */
export function reduceImage(src: Uint8ClampedArray, sw: number, sh: number, dw: number, dh: number, pal: readonly Packed[]): Uint8ClampedArray<ArrayBuffer> {
  const out = new Uint8ClampedArray(dw * dh * 4);
  const fx = sw / dw;
  const fy = sh / dh;
  for (let y = 0; y < dh; y++) {
    for (let x = 0; x < dw; x++) {
      const [r, g, b, a] = areaMean(src, sw, x * fx, (x + 1) * fx, y * fy, (y + 1) * fy);
      const i = (y * dw + x) * 4;
      if (a < 128) continue;
      const c = nearest(pal, r, g, b);
      out[i] = (c >> 16) & 255;
      out[i + 1] = (c >> 8) & 255;
      out[i + 2] = c & 255;
      out[i + 3] = 255;
    }
  }
  return out;
}

/** The radio feed (doc 20): every opaque pixel remapped by luminance onto the green phosphor ramp, in place. */
export function toPhosphor(rgba: Uint8ClampedArray, ramp: readonly Packed[]): void {
  const n = ramp.length;
  if (n === 0) return;
  for (let i = 0; i < rgba.length; i += 4) {
    if ((rgba[i + 3] ?? 0) === 0) continue;
    const lum = (0.3 * (rgba[i] ?? 0) + 0.59 * (rgba[i + 1] ?? 0) + 0.11 * (rgba[i + 2] ?? 0)) / 255;
    const c = ramp[Math.min(n - 1, Math.floor(Math.pow(lum, 0.8) * n))] ?? 0;
    rgba[i] = (c >> 16) & 255;
    rgba[i + 1] = (c >> 8) & 255;
    rgba[i + 2] = c & 255;
  }
}
