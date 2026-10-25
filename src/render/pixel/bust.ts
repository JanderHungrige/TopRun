import { blitBox, fitBox, scratch, SpriteCache, type Fit, type Rect } from './blit';
import { outline, toCanvas } from './post';
import { Pix } from './raster';

// Pixel pipeline (doc 20): head-and-shoulders busts (talking portraits, pilot avatars). The art lives in a
// 100 × 120 unit frame; per box it is rasterised at k art px per unit into three cached layers — the static
// background, the outlined figure for the current state, and live ambient details — composed at art
// resolution and blitted with hard pixel edges.

export const FRAME_W = 100;
export const FRAME_H = 120;
/** Figure layer reach in frame units (gestures reach past the frame sides; the torso runs below it). */
const REACH_X = 72;
const REACH_Y = 127;

/** Visible area in frame units for a box (wider or taller than 100 × 120 when the box aspect differs). */
export interface Frame { l: number; r: number; t: number; b: number }

/** Where the frame sits on the compose canvas: art px = (ox, oy) + frame · k. */
export interface ArtView { k: number; ox: number; oy: number; W: number; H: number; t: number; radio: boolean }

export interface BustArt<R> {
  /** Cache namespace (one per character). */
  id: string;
  /** Background cache namespace when several arts share one background (the builder's looks, doc 29); default `id`. */
  backgroundId?: string;
  background(p: Pix, f: Frame): void;
  /** The figure for one animation state on a transparent buffer; outlined afterwards. */
  figure(p: Pix, rig: R): void;
  /** Live background details (clouds, steam) drawn on the compose canvas in art pixels. */
  ambient?(g: CanvasRenderingContext2D, v: ArtView): void;
}

export interface BustState<R> {
  rig: R;
  /** Stable key of everything in `rig` that changes the figure's pixels. */
  key: string;
  t: number;
  /** Whole art pixels the figure is lowered by (idle breathing). */
  bob: number;
  radio?: boolean;
  /** Drawn last on the compose canvas (radio feed, selection frame). */
  overlay?(g: CanvasRenderingContext2D, v: ArtView): void;
}

const backgrounds = new SpriteCache(40);
const figures = new SpriteCache(360);

/** Wanted art resolution by logical scale: big boxes get the full ~100 × 120 grid, small ones a coarser one. */
const preferK = (fs: number): number => (fs >= 1.5 ? 1 : fs >= 0.9 ? 0.7 : 0.5);

function renderBackground<R>(art: BustArt<R>, f: Fit, dy: number, radio: boolean): HTMLCanvasElement | null {
  const p = new Pix(f.W, f.H, f.k, f.W / 2, dy);
  art.background(p, { l: -f.W / 2 / f.k, r: f.W / 2 / f.k, t: -dy / f.k, b: (f.H - dy) / f.k });
  return toCanvas(p, radio);
}

function renderFigure<R>(art: BustArt<R>, rig: R, k: number, radio: boolean): HTMLCanvasElement | null {
  const w = 2 * Math.ceil(REACH_X * k);
  const p = new Pix(w, Math.ceil(REACH_Y * k) + 1, k, w / 2, 0);
  art.figure(p, rig);
  outline(p);
  return toCanvas(p, radio);
}

/** Draws a bust filling the box (contain-fit frame, bottom-aligned, clipped). */
export function drawBust<R>(ctx: CanvasRenderingContext2D, box: Rect, art: BustArt<R>, s: BustState<R>): void {
  if (!(box.w > 0 && box.h > 0)) return;
  const f = fitBox(ctx, box, FRAME_W, FRAME_H, preferK);
  const radio = s.radio === true;
  const dy = f.H - Math.round(FRAME_H * f.k);
  const tag = radio ? 'r' : 'n';
  const bg = backgrounds.get(`${art.backgroundId ?? art.id}|${f.k}|${f.W}x${f.H}|${tag}`, () => renderBackground(art, f, dy, radio));
  const fig = figures.get(`${art.id}|${f.k}|${s.key}|${tag}`, () => renderFigure(art, s.rig, f.k, radio));
  const sc = scratch(f.W, f.H);
  if (!sc) return;
  const v: ArtView = { k: f.k, ox: f.W / 2, oy: dy, W: f.W, H: f.H, t: s.t, radio };
  if (bg) sc.g.drawImage(bg, 0, 0);
  art.ambient?.(sc.g, v);
  if (fig) sc.g.drawImage(fig, f.W / 2 - fig.width / 2, dy + s.bob);
  s.overlay?.(sc.g, v);
  blitBox(ctx, sc.canvas, box, f);
}

const sprites = new SpriteCache(96);

/** A cached pixel sprite (ambient clouds, puffs, foreground layers): `draw` paints a w × h buffer whose
 *  frame mapping is art = (ox, oy) + frame · k. The key must cover everything the drawing depends on. */
export function sprite(key: string, w: number, h: number, radio: boolean, draw: (p: Pix) => void, k = 1, ox = 0, oy = 0): HTMLCanvasElement | null {
  return sprites.get(`${key}|${w}x${h}|${k}|${radio ? 'r' : 'n'}`, () => {
    const p = new Pix(Math.max(1, w), Math.max(1, h), k, ox, oy);
    draw(p);
    return toCanvas(p, radio);
  });
}

/** Draws a puff / cloud: an ellipse sprite of radii (rx, ry) art px centred on (x, y) in compose space. */
export function puff(g: CanvasRenderingContext2D, v: ArtView, x: number, y: number, rx: number, ry: number, color: number, alpha = 1): void {
  const w = Math.max(1, Math.round(rx * 2));
  const h = Math.max(1, Math.round(ry * 2));
  const s = sprite(`puff${color}`, w, h, v.radio, (p) => p.paint(p.oval(w / 2, h / 2, w / 2, h / 2), color));
  if (!s) return;
  const a = g.globalAlpha;
  g.globalAlpha = a * alpha;
  g.drawImage(s, Math.round(x - w / 2), Math.round(y - h / 2));
  g.globalAlpha = a;
}
