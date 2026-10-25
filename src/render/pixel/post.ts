import { INK, RADIO_RGBA, RGBA } from './palette';
import type { Pix } from './raster';

// Pixel pipeline (doc 20): post-processing of a finished art buffer — the 1-px selective outline around the
// silhouette and the conversion to an offscreen canvas (normal or radio-feed palette).

/** Paints a 1-px outline into every transparent pixel that touches the silhouette (4-neighbourhood), in the
 *  ink of the neighbouring colour's ramp. `keepBottom` leaves the bottom row open (figures cut by the frame). */
export function outline(p: Pix, keepBottom = true): void {
  const { w, h } = p;
  const src = p.data.slice();
  for (let r = 0; r < h; r++) {
    for (let c = 0; c < w; c++) {
      const i = r * w + c;
      if (src[i]) continue;
      const n = (c > 0 ? src[i - 1] : 0) || (c < w - 1 ? src[i + 1] : 0) || (r > 0 ? src[i - w] : 0)
        || (r < h - 1 ? src[i + w] : 0) || 0;
      if (n && !(keepBottom && r === h - 1)) p.data[i] = INK[n] ?? 1;
    }
  }
}

/** Creates (or reuses) a canvas of the buffer's size. Offscreen canvases follow the cockpit/enemy cache pattern. */
export function makeCanvas(w: number, h: number, reuse?: HTMLCanvasElement | null): HTMLCanvasElement {
  const c = reuse ?? document.createElement('canvas');
  if (c.width !== w) c.width = w;
  if (c.height !== h) c.height = h;
  return c;
}

/** Renders the palette indices into a canvas; `radio` maps every colour onto the green phosphor ramp. */
export function toCanvas(p: Pix, radio = false): HTMLCanvasElement | null {
  const canvas = makeCanvas(p.w, p.h);
  const g = canvas.getContext('2d');
  if (!g) return null;
  const img = g.createImageData(p.w, p.h);
  const out = new Uint32Array(img.data.buffer);
  const lut = radio ? RADIO_RGBA : RGBA;
  for (let i = 0; i < p.data.length; i++) out[i] = lut[p.data[i] ?? 0] ?? 0;
  g.putImageData(img, 0, 0);
  return canvas;
}
