import { LOCKER_CHEST } from '../../game/uniform-layout';
import { SpriteCache } from '../pixel/blit';
import { vgrad } from '../pixel/fx';
import { PAL } from '../pixel/palette';
import { path } from '../pixel/path';
import { outline, toCanvas } from '../pixel/post';
import { and, bayer, checker, Pix, union, type Mask } from '../pixel/raster';
import { fill, oval, paintIn, rect, thick } from '../rooms-pixel';

// Locker (doc 31): the dress-whites jacket on its hanger as one cached pixel-art sprite — standing collar, sloped
// shoulders, sleeves with gold cuff stripes, six gold buttons, breast and lower pocket flaps, folds and the light
// of the locker's tube from above. Frame units are logical px; the rack (medals, ribbons, wings), shoulder boards
// and name plate are drawn on top (insignia.ts, rack.ts) and sway with it.

/** The sprite's box in logical px. */
export const JACKET = { x: 236, y: 132, w: 428, h: 520 } as const;
export const CENTRE_X = 450;
export const HEM_Y = 640;
/** Viewer's-left breast pocket (under the name plate) and viewer's-right one (under the rack). */
export const POCKETS = { y: LOCKER_CHEST.pocketTop, h: 18, left: { x: 306, w: 124 }, right: { x: 470, w: 124 } } as const;

const v = (ramp: readonly number[], i: number): number => ramp[i] ?? 0;
const W = PAL.white;
const GOLD = PAL.gold;
const ALL = [JACKET.x, JACKET.y, JACKET.x + JACKET.w, JACKET.y + JACKET.h] as const;

/** x mirrored to the viewer's right for side +1. */
const mx = (side: -1 | 1, x: number): number => CENTRE_X + side * (CENTRE_X - x);

function torsoPath(): ReturnType<typeof path> {
  const pts = (side: -1 | 1): number[] => [mx(side, 262), 194, mx(side, 306), 256, mx(side, 318), 470, mx(side, 306), HEM_Y];
  const l = pts(-1);
  const r = pts(1);
  return path().move(418, 160).quad(340, 162, l[0] ?? 0, l[1] ?? 0).lines(l.slice(2))
    .line(r[6] ?? 0, r[7] ?? 0).line(r[4] ?? 0, r[5] ?? 0).line(r[2] ?? 0, r[3] ?? 0).line(r[0] ?? 0, r[1] ?? 0)
    .quad(560, 162, 482, 160).close();
}

function sleeve(side: -1 | 1): number[] {
  const x = (u: number): number => mx(side, u);
  return [x(262), 194, x(246), 226, x(244), 300, x(248), 430, x(256), 606, x(316), 612, x(320), 470, x(306), 256];
}

function sleeves(p: Pix): Mask {
  let all = p.blank();
  for (const side of [-1, 1] as const) {
    const m = p.shape(path().lines(sleeve(side)).close());
    vgrad(p, [v(W, 4), v(W, 3), v(W, 3), v(W, 2)], 200, 600, m, 6);
    rect(p, mx(side, 252) - 10, 200, 20, 412, v(W, 2), m, bayer(0.5));
    rect(p, mx(side, 314) - 7, 250, 14, 362, v(W, 1), m, checker);
    const cx = mx(side, 286);
    for (const [y, h] of [[584, 3], [592, 2]] as const) rect(p, cx - 36, y, 72, h, v(GOLD, 3), m);
    thick(p, [cx - 16 * side, 404, cx + 8 * side, 420], 0.6, v(W, 2), m);
    thick(p, [cx - 12 * side, 430, cx + 12 * side, 440], 0.6, v(W, 2), m);
    rect(p, cx - 36, 602, 72, 10, v(W, 2), m);
    all = union(all, m);
  }
  return all;
}

function torsoLight(p: Pix, t: Mask): void {
  vgrad(p, [v(W, 4), v(W, 3), v(W, 3), v(W, 2)], 180, HEM_Y, t, 8);
  fill(p, path().ellipse(450, 196, 130, 40), v(W, 4), t);
  for (const side of [-1, 1] as const) {
    fill(p, path().lines([mx(side, 300), 240, mx(side, 330), 240, mx(side, 340), 470, mx(side, 326), HEM_Y, mx(side, 300), HEM_Y]).close(), v(W, 2), t, bayer(0.5));
    fill(p, path().lines([mx(side, 300), 250, mx(side, 312), 250, mx(side, 322), 470, mx(side, 312), HEM_Y, mx(side, 300), HEM_Y]).close(), v(W, 1), t, checker);
    thick(p, [mx(side, 436), 292, mx(side, 352), 318], 0.6, v(W, 2), t);
    thick(p, [mx(side, 436), 480, mx(side, 344), 462], 0.6, v(W, 2), t);
    thick(p, [mx(side, 330), 500, mx(side, 326), 610], 0.6, v(W, 2), t);
  }
  rect(p, 290, HEM_Y - 6, 320, 6, v(W, 2), t);
  rect(p, 406, 160, 88, 8, v(W, 2), t, checker);
}

function flap(p: Pix, t: Mask, x: number, y: number, w: number, h: number): void {
  const m = fill(p, path().lines([x, y, x + w, y, x + w, y + h - 3, x + w / 2, y + h, x, y + h - 3]).close(), v(W, 4), t);
  paintIn(p, p.border(m, 'dlr'), v(W, 2), [x, y, x + w, y + h], t);
  rect(p, x, y + h, w, 2, v(W, 2), t, checker);
  button(p, x + w / 2, y + h - 5, 3.2);
}

function button(p: Pix, x: number, y: number, r: number): void {
  oval(p, x, y, r, r, v(GOLD, 2));
  oval(p, x - r * 0.15, y - r * 0.15, r * 0.7, r * 0.7, v(GOLD, 3));
  oval(p, x - r * 0.35, y - r * 0.35, r * 0.3, r * 0.3, v(GOLD, 5));
}

function collar(p: Pix): void {
  const c = fill(p, path().move(420, 140).quad(450, 136, 480, 140).line(484, 164).quad(450, 170, 416, 164).close(), v(W, 3));
  fill(p, path().ellipse(450, 141, 28, 4), v(W, 1));
  fill(p, path().ellipse(450, 142, 22, 2.4), v(PAL.ink, 1));
  rect(p, 416, 150, 22, 18, v(W, 4), c);
  rect(p, 468, 146, 18, 22, v(W, 2), c, checker);
  paintIn(p, p.border(c, 'd'), v(W, 1), [412, 134, 488, 172]);
  thick(p, [450, 140, 450, 168], 0.5, v(W, 2), c);
}

function front(p: Pix, t: Mask): void {
  thick(p, [451, 168, 451, HEM_Y], 0.5, v(W, 2), t);
  for (let i = 0; i < 6; i++) button(p, CENTRE_X, 196 + i * 58, 4.2);
  for (const side of [POCKETS.left, POCKETS.right]) flap(p, t, side.x, POCKETS.y, side.w, POCKETS.h);
  for (const x of [334, 458]) flap(p, t, x, 536, 108, 16);
}

const cache = new SpriteCache(4);

/** The jacket sprite for an art grid of G logical px per art pixel (cached). */
export function jacketSprite(G: number): HTMLCanvasElement | null {
  return cache.get(G.toFixed(4), () => {
    const k = 1 / G;
    const p = new Pix(Math.ceil(JACKET.w * k) + 2, Math.ceil(JACKET.h * k) + 2, k, 1 - JACKET.x * k, 1 - JACKET.y * k);
    const sl = sleeves(p);
    const t = p.shape(torsoPath());
    const seam = p.seam(t, 'lr');
    torsoLight(p, t);
    paintIn(p, seam, v(W, 1), ALL);
    paintIn(p, and(sl, p.border(sl, 'd')), v(W, 1), ALL);
    front(p, t);
    collar(p);
    outline(p);
    return toCanvas(p);
  });
}

/** Draws the jacket with its top-left at the sprite box, shifted by `dx` logical px (sway). */
export function drawJacket(ctx: CanvasRenderingContext2D, G: number, dx: number): void {
  const art = jacketSprite(G);
  if (!art) return;
  const m = ctx.getTransform();
  const x = JACKET.x - G + dx;
  const y = JACKET.y - G;
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(art, m.a ? (Math.round(m.a * x + m.e) - m.e) / m.a : x, m.d ? (Math.round(m.d * y + m.f) - m.f) / m.d : y, art.width * G, art.height * G);
  ctx.restore();
}
