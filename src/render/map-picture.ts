import type { CampaignId } from '../data/types';

// A campaign map's painted picture (doc 77): the map's own layout repainted as pixel-art terrain, on the art grid of the
// map panel (4 logical px per art px). False while it loads or where none exists — the caller draws the plain map.

const FILES = import.meta.glob<string>('../assets/maps/*.png', { eager: true, query: '?url', import: 'default' });
const images = new Map<CampaignId, HTMLImageElement>();

function picture(c: CampaignId): HTMLImageElement | null {
  let img = images.get(c);
  if (!img) {
    const url = FILES[`../assets/maps/map${c}.png`];
    if (!url || typeof Image === 'undefined') return null;
    img = new Image();
    img.src = url;
    images.set(c, img);
  }
  return img.complete && img.naturalWidth > 0 ? img : null;
}

/** The map's picture filling `r` (logical px), its art pixels kept square and sharp. */
export function drawMapPicture(ctx: CanvasRenderingContext2D, c: CampaignId, r: { x: number; y: number; w: number; h: number }): boolean {
  const img = picture(c);
  if (!img) return false;
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(img, r.x, r.y, img.naturalWidth * 4, img.naturalHeight * 4);
  ctx.restore();
  return true;
}
