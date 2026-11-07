import type { BaseAreaDef, BaseAreaId } from '../../data/base-areas';
import { SEA_LAYOUT, SPACE_LAYOUT, type DockLayout } from '../../data/base-docks';
import { artGrid, type Grid } from '../ceremony-set';
import { scratch, SpriteCache } from '../pixel/blit';
import { outline, toCanvas } from '../pixel/post';
import { Pix } from '../pixel/raster';
import { drawBrackets, tvSet } from './ambient';
import { drawCast, drawCastShadows } from './cast';
import { drawDockChalkboard, drawDockFlipBoard } from './dock-boards';
import { drawDockGlobe } from './dock-globe';
import { seaAmbient, spaceAmbient, type Mask } from './dock-ambient';
import type { HangarView } from './index';
import { drawLabels } from './labels';
import { NEON, PILOT_SCALE, TV_CART } from './layout';
import { paintTvSet } from './props';
import { neonSprite } from './sprites';

// The home base's docks (doc 73): the generated picture on the art grid, the TV cart and the joystick neon moved onto it,
// the sea dock's globe (the way to the map; in space it is the windows, doc 76), the docks' calm ambient life, the pulsing
// brackets; then world 1's flip board and chalkboard over the picture's own, the pilot to the dock's scale and the strip
// on top (no name plates in the docks).

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

/** The TV cart, video recorder and CRT on the dock's floor, to the scale of its pilot (doc 76). */
function tvLayer(gr: Grid, look: DockLook): HTMLCanvasElement | null {
  const L = LAYOUT[look];
  const f = tvScale(look);
  return layers.get(`tv|${look}|${gr.W}x${gr.H}|${gr.G.toFixed(4)}`, () => {
    const p = new Pix(gr.W, gr.H, f / gr.G, (L.tv.x - TV_CART.x * f) / gr.G, (L.tv.base - TV_CART.base * f) / gr.G);
    paintTvSet(p);
    outline(p, false);
    return toCanvas(p);
  });
}

/** The TV grows with the pilot: the carrier hangar's cart at its pilot's scale, times the dock's pilot over that one. */
const tvScale = (look: DockLook): number => LAYOUT[look].pilot / PILOT_SCALE;

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
  if (L.globe) drawDockGlobe(g, G, L.globe, v.t);
  drawCastShadows(g, G, v.walker, false, L.pilot);
  const tv = tvLayer(gr, look);
  if (tv) g.drawImage(tv, 0, 0);
  tvSet(g, G, v.t, tvScale(look), L.tv);
  drawBrackets(g, G, areas[v.focus].hot, v.t);
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
  drawDockChalkboard(ctx, L.slate, v.chalk.cells, v.chalk.version);
  drawDockFlipBoard(ctx, L.board, L.boardRows > v.board.length ? [...v.board, ...Array<string>(L.boardRows - v.board.length).fill('')] : v.board, v.t);
  drawCast(ctx, gr.G, { t: v.t, walker: v.walker, face: v.face, crew: false, scale: L.pilot });
  drawLabels(ctx, v.focus, v.text, areas, false);
  return true;
}
