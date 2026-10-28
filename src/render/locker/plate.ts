import lockerUrl from '../../assets/locker/locker.png?url';

// Locker (doc 31): the backdrop is the owner's pick of the generated locker pictures (v4 on the 320 × 180 grid with
// 32 flat colours, dev/locker-plate.py): the open locker with cap, helmet and the bare dress-white tunic on its
// hanger. Everything the game adds (boards, wings, medals, ribbons, name plate, flicker, dust) is placed on it with
// the geometry below, measured on the picture (logical px; one art px = 4).

/** Logical px per art px of the picture. */
export const PLATE_G = 4;

/** The tunic: its centre line (the buttons; the collar runs x 388 … 508) and its shoulder seams — where the boards
 *  start beside the collar (centre ± collarHalf), their top edge there, how far they run out to the sleeve and how
 *  much the seam drops over that run (measured column by column on the right shoulder, mirrored for the left). */
export const TUNIC = { centreX: 448, collarHalf: 60, boardTop: 184, boardLen: 92, boardDrop: 38 } as const;
/** The name plate above the viewer's-left breast pocket: its centre x and top. */
export const NAME_PLATE = { cx: 360, y: 306 } as const;
/** The lit inside of the locker (dimmed while the tube flickers off) and the tube light under the shelf. */
export const INSIDE = { x: 40, y: 0, w: 740, h: 720 } as const;
export const TUBE = { x: 192, y: 188, w: 208, h: 8 } as const;

let img: HTMLImageElement | null = null;

function plate(): HTMLImageElement | null {
  if (typeof Image === 'undefined') return null;
  if (!img) {
    img = new Image();
    img.src = lockerUrl;
  }
  return img.complete && img.naturalWidth > 0 ? img : null;
}

/** Starts loading the picture (the scene's constructor). */
export const preloadPlate = (): void => void plate();

/** The locker picture over the whole frame, hard pixel edges. */
export function drawLockerPlate(ctx: CanvasRenderingContext2D): void {
  const p = plate();
  ctx.fillStyle = '#05070c';
  ctx.fillRect(0, 0, 1280, 720);
  if (!p) return;
  const m = ctx.getTransform();
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(p, m.a ? (Math.round(m.e) - m.e) / m.a : 0, m.d ? (Math.round(m.f) - m.f) / m.d : 0, 1280, 720);
  ctx.restore();
}
