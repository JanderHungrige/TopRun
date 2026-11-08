import { areaDef, type AreaTable } from '../../data/base-areas';
import { CARRIER_LAYOUT, JUNGLE_LAYOUT, SEA_LAYOUT, SPACE_LAYOUT, type DockLayout } from '../../data/base-docks';
import type { BaseLook } from '../../data/base-areas';
import type { BaseLight } from '../../game/base-light';
import { artGrid, type Grid } from '../ceremony-set';
import { scratch, SpriteCache } from '../pixel/blit';
import { outline, toCanvas } from '../pixel/post';
import { Pix } from '../pixel/raster';
import { drawBrackets, tvSet } from './ambient';
import { drawCast, drawCastShadows } from './cast';
import { drawDockChalkboard, drawDockFlipBoard } from './dock-boards';
import { drawDockGlobe } from './dock-globe';
import { seaAmbient, spaceAmbient, type Mask } from './dock-ambient';
import { carrierAmbient } from './dock-carrier';
import { jungleAmbient } from './dock-jungle';
import type { HangarView } from './index';
import { drawLabels } from './labels';
import { NEON, PILOT_SCALE, TV_CART } from './layout';
import { paintTvSet } from './props';
import { neonSprite } from './sprites';

// The home base's picture looks (docs 73, 91): the generated picture on the art grid (the carrier lounge's in the base's
// light), the TV cart and the joystick neon moved onto it, the sea dock's globe (the way to the map; in space it is the
// windows, on the carrier the opening onto the flight deck, doc 76), the calm ambient life, the pulsing brackets; then
// world 1's flip board and chalkboard over the picture's own, the pilot to the look's scale and the strip on top (no name
// plates).

export type DockLook = BaseLook;

const FILES = import.meta.glob<string>('../../assets/docks/*.png', { eager: true, query: '?url', import: 'default' });
const LAYOUT: Readonly<Record<DockLook, DockLayout>> = { carrier: CARRIER_LAYOUT, space: SPACE_LAYOUT, sea: SEA_LAYOUT, jungle: JUNGLE_LAYOUT };
const images = new Map<string, HTMLImageElement>();
const masks = new Map<DockLook, Mask>();
const layers = new SpriteCache(4);

/** The picture's file: the carrier lounge comes in the base's light (doc 91). */
const fileOf = (look: DockLook, light: BaseLight): string => (look === 'carrier' ? `carrier-${light}` : look);

function picture(file: string): HTMLImageElement | null {
  let img = images.get(file);
  if (!img) {
    const url = FILES[`../../assets/docks/${file}.png`];
    if (!url || typeof Image === 'undefined') return null;
    img = new Image();
    img.src = url;
    images.set(file, img);
  }
  return img.complete && img.naturalWidth > 0 ? img : null;
}

/** The picture on the art grid (cached per grid), and the stars' mask (where it is dark). */
function backdrop(look: DockLook, file: string, img: HTMLImageElement, gr: Grid): HTMLCanvasElement | null {
  return layers.get(`${file}|${gr.W}x${gr.H}`, () => {
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

function ambient(g: CanvasRenderingContext2D, G: number, look: DockLook, v: HangarView, back: HTMLCanvasElement): void {
  const t = v.t;
  switch (look) {
    case 'carrier': carrierAmbient(g, G, t, v.light); return;
    case 'space': spaceAmbient(g, G, t, masks.get(look) ?? null); return;
    case 'sea': seaAmbient(g, G, t, back); return;
    case 'jungle': jungleAmbient(g, G, t); return;
    default: throw new Error(`unhandled: ${look satisfies never}`);
  }
}

function compose(g: CanvasRenderingContext2D, gr: Grid, look: DockLook, back: HTMLCanvasElement, v: HangarView, areas: AreaTable): void {
  const L = LAYOUT[look];
  const G = gr.G;
  g.drawImage(back, 0, 0);
  ambient(g, G, look, v, back);
  neon(g, G, L.neon, v.t);
  if (L.globe) drawDockGlobe(g, G, L.globe, v.t, look === 'jungle' ? 'jungle' : 'earth');
  drawCastShadows(g, G, v.walker, false, L.pilot);
  const tv = tvLayer(gr, look);
  if (tv) g.drawImage(tv, 0, 0);
  tvSet(g, G, v.t, tvScale(look), L.tv);
  drawBrackets(g, G, areaDef(areas, v.focus).hot, v.t);
}

/** Draws a dock covering the 1280 × 720 frame. False while its picture loads (the caller shows the hangar). */
export function drawDock(ctx: CanvasRenderingContext2D, look: DockLook, v: HangarView, areas: AreaTable): boolean {
  const file = fileOf(look, v.light);
  const img = picture(file);
  const gr = artGrid(ctx);
  const back = img ? backdrop(look, file, img, gr) : null;
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
