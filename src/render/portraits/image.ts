import { breathBob, portraitFrame } from '../../game/portrait-frames';
import { deviceScale, scratch, SpriteCache, type Rect } from '../pixel/blit';
import type { ArtView } from '../pixel/bust';
import { PAL, RGB } from '../pixel/palette';
import { makeCanvas } from '../pixel/post';
import { imagePalette, reduceImage, toPhosphor, type Packed } from '../pixel/reduce';
import type { FrameSet } from './assets';
import { radioFeed, selectionFrame } from './overlays';

/**
 * Image portraits (doc 33): the owner's 240 × 288 pixel-art portraits drawn like the old busts — cover-fit,
 * bottom-aligned, centred and clipped to the box, never smoothed, snapped to whole device pixels. Boxes with fewer
 * device pixels than the image get a copy reduced by area onto the image's own palette (pixel/reduce.ts), cached
 * per size. Animation: breathing bob, blink and talk frames (game/portrait-frames.ts); overlays: the radio feed
 * and the gold selection frame.
 */

export interface ImagePortraitState {
  t: number;
  /** The speech box's mouth value: 0 closed, 0.5 half, 1 open (doc 06). */
  mouth: number;
  /** Per-character phase for blink and breathing. */
  seed: number;
  selected?: boolean;
  radio?: boolean;
}

const images = new Map<string, HTMLImageElement>();

function image(url: string): HTMLImageElement | null {
  if (typeof Image === 'undefined') return null;
  let img = images.get(url);
  if (!img) {
    img = new Image();
    img.decoding = 'async';
    img.src = url;
    images.set(url, img);
  }
  return img;
}

const ready = (img: HTMLImageElement | null): img is HTMLImageElement => img !== null && img.complete && img.naturalWidth > 0;

/** Starts loading images (boot: the cast and presets; the builder: its set). */
export function preloadImages(urls: readonly string[]): void {
  for (const url of urls) image(url);
}

interface Source { data: Uint8ClampedArray; w: number; h: number; pal: readonly Packed[] }
const sources = new Map<string, Source>();

/** The pixels and palette of a loaded image, read once. */
function source(url: string, img: HTMLImageElement): Source | null {
  const hit = sources.get(url);
  if (hit) return hit;
  const w = img.naturalWidth;
  const h = img.naturalHeight;
  const g = makeCanvas(w, h).getContext('2d', { willReadFrequently: true });
  if (!g) return null;
  g.drawImage(img, 0, 0);
  const data = g.getImageData(0, 0, w, h).data;
  const made = { data, w, h, pal: imagePalette(data) };
  sources.set(url, made);
  return made;
}

const PHOSPHOR: readonly Packed[] = PAL.phosphor.map((i) => {
  const [r, g, b] = RGB[i] ?? [0, 0, 0];
  return (r << 16) | (g << 8) | b;
});
const variants = new SpriteCache(64);

/** The image at w × h art pixels: the original, or reduced by area; remapped to green for the radio feed. */
function variant(url: string, img: HTMLImageElement, w: number, h: number, radio: boolean): CanvasImageSource | null {
  if (w === img.naturalWidth && h === img.naturalHeight && !radio) return img;
  return variants.get(`${url}|${w}x${h}|${radio ? 'r' : 'n'}`, () => {
    const src = source(url, img);
    if (!src) return null;
    const data = w === src.w && h === src.h ? new Uint8ClampedArray(src.data) : reduceImage(src.data, src.w, src.h, w, h, src.pal);
    if (radio) toPhosphor(data, PHOSPHOR);
    const canvas = makeCanvas(w, h);
    canvas.getContext('2d')?.putImageData(new ImageData(data, w, h), 0, 0);
    return canvas;
  });
}

/** Where the image goes: art size (aw × ah px), logical size of one art pixel, top-left. */
interface Placement { aw: number; ah: number; px: number; x: number; y: number }

function place(ctx: CanvasRenderingContext2D, box: Rect, iw: number, ih: number): Placement {
  const ds = deviceScale(ctx);
  const cover = Math.max(box.w / iw, box.h / ih); // an exact fit stays 1 : 1 (or 2 : 1 …) in device pixels
  const dev = cover * ds;
  const aw = dev >= 1 ? iw : Math.ceil(iw * dev);
  const ah = dev >= 1 ? ih : Math.ceil(ih * dev);
  const px = dev >= 1 ? cover : 1 / ds;
  return { aw, ah, px, x: box.x + (box.w - aw * px) / 2, y: box.y + box.h - ah * px };
}

/** Logical coordinate snapped to the nearest device pixel under the current transform. */
function snap(ctx: CanvasRenderingContext2D, v: number, horizontal: boolean): number {
  const m = ctx.getTransform();
  const s = horizontal ? m.a : m.d;
  const o = horizontal ? m.e : m.f;
  return s !== 0 ? (Math.round(s * v + o) - o) / s : v;
}

function overlays(ctx: CanvasRenderingContext2D, box: Rect, px: number, s: { t: number; selected?: boolean; radio?: boolean }): void {
  if (!s.selected && !s.radio) return;
  const W = Math.max(8, Math.round(box.w / px));
  const H = Math.max(8, Math.round(box.h / px));
  const sc = scratch(W, H);
  if (!sc) return;
  const v: ArtView = { k: 1, ox: W / 2, oy: 0, W, H, t: s.t, radio: s.radio === true };
  if (s.radio) radioFeed(sc.g, v);
  if (s.selected) selectionFrame(sc.g, v);
  ctx.drawImage(sc.canvas, 0, 0, W, H, snap(ctx, box.x, true), snap(ctx, box.y, false), W * px, H * px);
}

/** A dark box while an image loads; with `silhouette`, a pilot's dark outline (a builder pick with no image yet). */
export function drawPlaceholder(ctx: CanvasRenderingContext2D, box: Rect, s: { t: number; selected?: boolean }, silhouette = false): void {
  ctx.save();
  ctx.beginPath();
  ctx.rect(box.x, box.y, box.w, box.h);
  ctx.clip();
  ctx.fillStyle = '#0b111c';
  ctx.fillRect(box.x, box.y, box.w, box.h);
  if (silhouette) {
    const cx = box.x + box.w / 2;
    ctx.fillStyle = '#1b2638';
    ctx.beginPath();
    ctx.ellipse(cx, box.y + box.h * 0.4, box.w * 0.17, box.h * 0.17, 0, 0, Math.PI * 2);
    ctx.ellipse(cx, box.y + box.h * 1.02, box.w * 0.46, box.h * 0.36, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.imageSmoothingEnabled = false;
  overlays(ctx, box, box.w / 120, s);
  ctx.restore();
}

/** The frame to show now (falling back to the base image while a talk / blink frame still loads). */
function frameUrl(f: FrameSet, s: ImagePortraitState): string {
  const which = portraitFrame(s.t, s.mouth, s.seed, { talk: f.talk !== undefined, half: f.half !== undefined, blink: f.blink !== undefined });
  const url = which === 'talk' ? f.talk : which === 'half' ? f.half : which === 'blink' ? f.blink : f.base;
  return url !== undefined && ready(image(url)) ? url : f.base;
}

/** A portrait image filling the box: cover-fit, bottom-aligned, clipped, nearest-neighbour, with its overlays. */
export function drawImagePortrait(ctx: CanvasRenderingContext2D, frames: FrameSet, box: Rect, s: ImagePortraitState): void {
  if (!(box.w > 0 && box.h > 0)) return;
  const url = frameUrl(frames, s);
  const img = image(url);
  if (!ready(img)) return drawPlaceholder(ctx, box, s);
  const p = place(ctx, box, img.naturalWidth, img.naturalHeight);
  const art = variant(url, img, p.aw, p.ah, s.radio === true);
  if (!art) return drawPlaceholder(ctx, box, s);
  ctx.save();
  ctx.beginPath();
  ctx.rect(box.x, box.y, box.w, box.h);
  ctx.clip();
  ctx.imageSmoothingEnabled = false;
  const x = snap(ctx, p.x, true);
  const y = snap(ctx, p.y + breathBob(s.t, s.seed) * p.px, false);
  const w = p.aw * p.px;
  ctx.drawImage(art, 0, 0, p.aw, p.ah, x, y, w, p.ah * p.px);
  if (y > box.y) ctx.drawImage(art, 0, 0, p.aw, 1, x, box.y, w, y - box.y); // the bob's gap: the top (sky) row
  overlays(ctx, box, p.px, s);
  ctx.restore();
}
