import type { BaseAreaDef, BaseAreaId } from '../../data/base-areas';
import { SEA_LAYOUT, SPACE_LAYOUT, type DockLayout } from '../../data/base-docks';
import { BOARD_H, BOARD_W } from '../../game/chalkboard';
import { artGrid, type Grid } from '../ceremony-set';
import { scratch, SpriteCache } from '../pixel/blit';
import { outline, toCanvas } from '../pixel/post';
import { Pix } from '../pixel/raster';
import { text } from '../text';
import { drawBrackets, tvSet } from './ambient';
import { drawCast, drawCastShadows } from './cast';
import { drawChalkMini } from './chalk';
import { seaAmbient, spaceAmbient, type Mask } from './dock-ambient';
import type { HangarView } from './index';
import { drawLabels } from './labels';
import { NEON, TV_CART } from './layout';
import { paintTvSet } from './props';
import { neonSprite } from './sprites';

// The home base's docks (doc 73): the generated picture on the art grid, the TV cart, the joystick neon and an exit
// hatch moved onto it, the docks' calm ambient life, the pulsing brackets; then the shared slate on the picture's
// chalkboard, the ladder on its scoreboard as amber LED text, the pilot and the name plates on top.

export type DockLook = 'space' | 'sea';

const FILES = import.meta.glob<string>('../../assets/docks/*.png', { eager: true, query: '?url', import: 'default' });
const LAYOUT: Readonly<Record<DockLook, DockLayout>> = { space: SPACE_LAYOUT, sea: SEA_LAYOUT };
const images = new Map<DockLook, HTMLImageElement>();
const masks = new Map<DockLook, Mask>();
const layers = new SpriteCache(4);

function picture(look: DockLook): HTMLImageElement | null {
  let img = images.get(look);
  if (!img) {
    const url = FILES[`../../assets/docks/${look}.png`];
    if (!url || typeof Image === 'undefined') return null;
    img = new Image();
    img.src = url;
    images.set(look, img);
  }
  return img.complete && img.naturalWidth > 0 ? img : null;
}

/** The picture on the art grid (cached per grid), and the stars' mask (where it is dark). */
function backdrop(look: DockLook, img: HTMLImageElement, gr: Grid): HTMLCanvasElement | null {
  return layers.get(`${look}|${gr.W}x${gr.H}`, () => {
    const c = document.createElement('canvas');
    c.width = gr.W;
    c.height = gr.H;
    const g = c.getContext('2d');
    if (!g) return c;
    g.imageSmoothingEnabled = false;
    g.drawImage(img, 0, 0, gr.W, gr.H);
    const data = g.getImageData(0, 0, gr.W, gr.H).data;
    const dark = new Uint8Array(gr.W * gr.H);
    for (let i = 0; i < dark.length; i++) dark[i] = (data[i * 4] ?? 0) + (data[i * 4 + 1] ?? 0) + (data[i * 4 + 2] ?? 0) < 150 ? 1 : 0;
    masks.set(look, { w: gr.W, h: gr.H, dark });
    return c;
  });
}

/** The TV cart, video recorder and CRT painted where the carrier hangar keeps them; drawn offset onto the dock. */
function tvLayer(gr: Grid): HTMLCanvasElement | null {
  return layers.get(`tv|${gr.W}x${gr.H}|${gr.G.toFixed(4)}`, () => {
    const p = new Pix(gr.W, gr.H, 1 / gr.G, 0, 0);
    paintTvSet(p);
    outline(p, false);
    return toCanvas(p);
  });
}

/** A steel exit hatch with a hand wheel, on the floor (art px). */
function hatch(g: CanvasRenderingContext2D, G: number, r: DockLayout['hatch']): void {
  const c0 = Math.round(r.x / G);
  const r0 = Math.round(r.y / G);
  const w = Math.round(r.w / G);
  const h = Math.round(r.h / G);
  g.fillStyle = '#14181c';
  g.fillRect(c0, r0, w, h);
  g.fillStyle = '#5a646c';
  g.fillRect(c0 + 1, r0 + 1, w - 2, h - 2);
  g.fillStyle = '#3a4248';
  g.fillRect(c0 + 3, r0 + 3, w - 6, h - 6);
  g.fillStyle = '#c8a24a';
  for (let k = 0; k < w; k += 4) g.fillRect(c0 + k, r0, 2, 1);
  g.fillStyle = '#9aa6ae';
  const cx = c0 + Math.round(w / 2);
  const cy = r0 + Math.round(h / 2);
  g.fillRect(cx - 4, cy, 9, 1);
  g.fillRect(cx, cy - 3, 1, 7);
  g.fillRect(cx - 2, cy - 2, 5, 5);
  g.fillStyle = '#3a4248';
  g.fillRect(cx - 1, cy - 1, 3, 3);
}

/** The joystick neon over the picture's own sign (whose letters are made up). */
function neon(g: CanvasRenderingContext2D, G: number, r: DockLayout['neon'], t: number): void {
  g.fillStyle = '#1a1420';
  g.fillRect(Math.round(r.x / G), Math.round(r.y / G), Math.round(r.w / G), Math.round(r.h / G));
  const s = neonSprite(G, Math.floor(t * 8) % 11 === 3);
  if (!s) return;
  g.drawImage(s.canvas, s.c + Math.round((r.x + r.w / 2 - (NEON.x + NEON.w / 2)) / G), s.r + Math.round((r.y + r.h / 2 - (NEON.y + NEON.h / 2)) / G));
}

function compose(g: CanvasRenderingContext2D, gr: Grid, look: DockLook, back: HTMLCanvasElement, v: HangarView, areas: Readonly<Record<BaseAreaId, BaseAreaDef>>): void {
  const L = LAYOUT[look];
  const G = gr.G;
  g.drawImage(back, 0, 0);
  if (look === 'space') spaceAmbient(g, G, v.t, masks.get(look) ?? null);
  else seaAmbient(g, G, v.t, back);
  neon(g, G, L.neon, v.t);
  hatch(g, G, L.hatch);
  drawCastShadows(g, G, v.walker, false);
  const dx = Math.round((L.tv.x - TV_CART.x) / G);
  const dy = Math.round((L.tv.base - TV_CART.base) / G);
  const tv = tvLayer(gr);
  if (tv) g.drawImage(tv, dx, dy);
  g.save();
  g.translate(dx, dy);
  tvSet(g, G, v.t);
  g.restore();
  drawBrackets(g, G, areas[v.focus].hot, v.t);
}

/** The ladder's three rows as amber LED text, fitted into the picture's scoreboard (logical px). */
function ledBoard(ctx: CanvasRenderingContext2D, r: DockLayout['board'], rows: readonly string[], t: number): void {
  const size = Math.min(22, Math.floor(r.h / 3.6));
  rows.forEach((row, i) => {
    const flicker = Math.sin(t * 9 + i * 2) > 0.97 ? 0.6 : 1;
    text(ctx, row.toUpperCase(), r.x + r.w / 2, r.y + (i + 0.78) * (r.h / 3), {
      size, display: true, align: 'center', color: i === 0 ? '#ffd25a' : '#ffb347', alpha: flicker, maxWidth: r.w - 12,
    });
  });
}

/** Draws a dock covering the 1280 × 720 frame. False while its picture loads (the caller shows the hangar). */
export function drawDock(ctx: CanvasRenderingContext2D, look: DockLook, v: HangarView, areas: Readonly<Record<BaseAreaId, BaseAreaDef>>): boolean {
  const img = picture(look);
  const gr = artGrid(ctx);
  const back = img ? backdrop(look, img, gr) : null;
  const sc = scratch(gr.W, gr.H);
  if (!back || !sc) return false;
  compose(sc.g, gr, look, back, v, areas);
  const m = ctx.getTransform();
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(sc.canvas, m.a ? (Math.round(m.e) - m.e) / m.a : 0, m.d ? (Math.round(m.f) - m.f) / m.d : 0, gr.W * gr.G, gr.H * gr.G);
  ctx.restore();
  const L = LAYOUT[look];
  const scale = Math.min(L.slate.w / BOARD_W, L.slate.h / BOARD_H);
  drawChalkMini(ctx, v.chalk.cells, v.chalk.version, L.slate.x + (L.slate.w - BOARD_W * scale) / 2, L.slate.y + (L.slate.h - BOARD_H * scale) / 2, scale);
  ledBoard(ctx, L.board, v.board, v.t);
  drawCast(ctx, gr.G, { t: v.t, walker: v.walker, face: v.face, crew: false });
  drawLabels(ctx, v.focus, v.text, areas);
  return true;
}
