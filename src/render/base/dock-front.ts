import type { Grid } from '../ceremony-set';
import { SpriteCache } from '../pixel/blit';

// Walk-behind (doc 92): what stands between the pilot's walk line and the viewer in a picture — the helicopter base's map
// table — is the picture's own pixels under a mask (`<look>-front.png`, white = in front), drawn again over the pilot, so
// the pilot walks behind it like in the old adventure games.

const MASKS = import.meta.glob<string>('../../assets/docks/*-front.png', { eager: true, query: '?url', import: 'default' });
const masks = new Map<string, HTMLImageElement>();
const layers = new SpriteCache(4);

function mask(look: string): HTMLImageElement | null {
  let img = masks.get(look);
  if (!img) {
    const url = MASKS[`../../assets/docks/${look}-front.png`];
    if (!url || typeof Image === 'undefined') return null;
    img = new Image();
    img.src = url;
    masks.set(look, img);
  }
  return img.complete && img.naturalWidth > 0 ? img : null;
}

/** The picture's pixels under the look's mask on the art grid (transparent elsewhere); null while the mask loads. */
export function frontLayer(look: string, file: string, picture: HTMLImageElement, gr: Grid): HTMLCanvasElement | null {
  const m = mask(look);
  if (!m) return null;
  return layers.get(`${file}|${gr.W}x${gr.H}`, () => {
    const c = document.createElement('canvas');
    c.width = gr.W;
    c.height = gr.H;
    const g = c.getContext('2d', { willReadFrequently: true });
    if (!g) return c;
    g.imageSmoothingEnabled = false;
    g.drawImage(m, 0, 0, gr.W, gr.H);
    const keep = g.getImageData(0, 0, gr.W, gr.H).data;
    g.clearRect(0, 0, gr.W, gr.H);
    g.drawImage(picture, 0, 0, gr.W, gr.H);
    const px = g.getImageData(0, 0, gr.W, gr.H);
    for (let i = 0; i < keep.length; i += 4) if ((keep[i] ?? 0) < 128) px.data[i + 3] = 0;
    g.putImageData(px, 0, 0);
    return c;
  });
}

/** Blits a front layer over the frame with the picture's own snapping. */
export function drawFront(ctx: CanvasRenderingContext2D, layer: HTMLCanvasElement, gr: Grid): void {
  const m = ctx.getTransform();
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(layer, m.a ? (Math.round(m.e) - m.e) / m.a : 0, m.d ? (Math.round(m.f) - m.f) / m.d : 0, gr.W * gr.G, gr.H * gr.G);
  ctx.restore();
}
