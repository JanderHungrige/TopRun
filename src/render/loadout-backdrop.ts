import type { Kit } from '../game/kit';

// The loadout screen's picture per world (doc 76): the carrier's hangar deck for the jets, a helicopter base, a submarine
// pen, an orbital shipyard — generated pixel art on the 320 × 180 grid, drawn at 4 × behind the panels under a dark
// wash so the lists and texts stay readable. False while it loads or where none exists (the caller keeps its plain one).

const FILES = import.meta.glob<string>('../assets/loadout/*.png', { eager: true, query: '?url', import: 'default' });
const images = new Map<Kit, HTMLImageElement>();
/** How dark the wash over the picture is. */
const WASH = 'rgba(4,8,14,0.36)';

function picture(kit: Kit): HTMLImageElement | null {
  let img = images.get(kit);
  if (!img) {
    const url = FILES[`../assets/loadout/${kit}.png`];
    if (!url || typeof Image === 'undefined') return null;
    img = new Image();
    img.src = url;
    images.set(kit, img);
  }
  return img.complete && img.naturalWidth > 0 ? img : null;
}

/** Starts loading a kit's picture (the scene's constructor). */
export function preloadLoadoutBackdrop(kit: Kit): void {
  picture(kit);
}

/** The kit's picture filling the 1280 × 720 frame under its wash (none in picture mode); false when there is none (yet). */
export function drawLoadoutBackdrop(ctx: CanvasRenderingContext2D, kit: Kit, wash = true): boolean {
  const img = picture(kit);
  if (!img) return false;
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(img, 0, 0, 1280, 720);
  ctx.fillStyle = WASH;
  if (wash) ctx.fillRect(0, 0, 1280, 720);
  ctx.restore();
  return true;
}

/** The plain night-blue backdrop while a picture loads. */
export function drawPlainBackdrop(ctx: CanvasRenderingContext2D): void {
  const bg = ctx.createLinearGradient(0, 0, 0, 720);
  bg.addColorStop(0, '#0d1824');
  bg.addColorStop(1, '#05090f');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 1280, 720);
}
