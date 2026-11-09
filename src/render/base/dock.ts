import { areaDef, type AreaTable } from '../../data/base-areas';
import { CARRIER_LAYOUT, HELI_LAYOUT, JUNGLE_LAYOUT, scaleAt, SEA_LAYOUT, SPACE_LAYOUT, type DockLayout } from '../../data/base-docks';
import type { BaseLook } from '../../data/base-areas';
import type { BaseLight } from '../../game/base-light';
import { artGrid, type Grid } from '../ceremony-set';
import { scratch, SpriteCache } from '../pixel/blit';
import { outline, toCanvas } from '../pixel/post';
import { Pix } from '../pixel/raster';
import { drawBrackets, tvScreen, tvSet, vcrClock } from './ambient';
import { drawCast, drawCastShadows } from './cast';
import { drawDockChalkboard, drawDockFlipBoard } from './dock-boards';
import { drawDockGlobe } from './dock-globe';
import { spaceAmbient, type Mask } from './dock-ambient';
import { litAmbient } from './dock-carrier';
import { drawFront, frontLayer } from './dock-front';
import { onWall } from './dock-wall';
import { jungleAmbient } from './dock-jungle';
import { seaAmbient } from './dock-sea';
import type { HangarView } from './index';
import { drawLabels } from './labels';
import { NEON, PILOT_SCALE, TV_CART } from './layout';
import { paintTvSet } from './props';
import { neonSprite } from './sprites';

// The home base's picture looks (docs 73, 91, 93): the generated picture on the art grid (the carrier lounge's in the base's
// light), the TV cart (or the TV's picture on the picture's own TV) and the joystick neon moved onto it, the jungle base's
// globe (the way to the map; elsewhere the picture's own: a window, an opening, a globe, doc 76), the calm ambient life, the
// pulsing brackets; then
// world 1's flip board and chalkboard over the picture's own, the pilot to the look's scale and the strip on top (no name
// plates).

export type DockLook = BaseLook;

const FILES = import.meta.glob<string>('../../assets/docks/*.png', { eager: true, query: '?url', import: 'default' });
const LAYOUT: Readonly<Record<DockLook, DockLayout>> = { carrier: CARRIER_LAYOUT, heli: HELI_LAYOUT, space: SPACE_LAYOUT, sea: SEA_LAYOUT, jungle: JUNGLE_LAYOUT };
const images = new Map<string, HTMLImageElement>();
const masks = new Map<DockLook, Mask>();
const layers = new SpriteCache(4);

/** The picture's file: the carrier lounge and the helicopter base come in the base's light (docs 91, 92). */
const fileOf = (look: DockLook, light: BaseLight): string => (look === 'carrier' || look === 'heli' ? `${look}-${light}` : look);

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

type Cart = NonNullable<DockLayout['tv']>;

/** The TV cart, video recorder and CRT on the dock's floor, to the scale of its pilot (doc 76). */
function tvLayer(gr: Grid, look: DockLook, cart: Cart): HTMLCanvasElement | null {
  const f = tvScale(LAYOUT[look], cart);
  return layers.get(`tv|${look}|${gr.W}x${gr.H}|${gr.G.toFixed(4)}`, () => {
    const p = new Pix(gr.W, gr.H, f / gr.G, (cart.x - TV_CART.x * f) / gr.G, (cart.base - TV_CART.base * f) / gr.G);
    paintTvSet(p);
    outline(p, false);
    return toCanvas(p);
  });
}

/** The TV grows with the pilot: the carrier hangar's cart at its pilot's scale, times the dock's pilot where it stands. */
const tvScale = (L: DockLayout, cart: Cart): number => scaleAt(L, cart.base) / PILOT_SCALE;

/** The TV: the cart drawn in code, or the picture's own TV with the game's picture on its screen (doc 93). */
function tv(g: CanvasRenderingContext2D, gr: Grid, look: DockLook, t: number): void {
  const L = LAYOUT[look];
  const G = gr.G;
  if (L.tv) {
    const layer = tvLayer(gr, look, L.tv);
    if (layer) g.drawImage(layer, 0, 0);
    tvSet(g, G, t, tvScale(L, L.tv), L.tv);
    return;
  }
  if (!L.picturedTv) return;
  const { screen: s, clock } = L.picturedTv;
  tvScreen(g, t, Math.round(s.x / G), Math.round(s.y / G), Math.round(s.w / G), Math.round(s.h / G));
  vcrClock(g, t, Math.round(clock.x / G), Math.round(clock.y / G));
}

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
    case 'carrier': case 'heli': litAmbient(g, G, t, look, v.light); return;
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
  drawCastShadows(g, G, v.walker, false, scaleAt(L, v.walker.y));
  tv(g, gr, look, v.t);
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
  const rows = L.boardRows > v.board.length ? [...v.board, ...Array<string>(L.boardRows - v.board.length).fill('')] : v.board;
  onWall(ctx, L.slate, L.wall, (g, at) => drawDockChalkboard(g, at, v.chalk.cells, v.chalk.version));
  onWall(ctx, L.board, L.wall, (g, at) => drawDockFlipBoard(g, at, rows, v.t));
  drawCast(ctx, gr.G, { t: v.t, walker: v.walker, face: v.face, crew: false, scale: scaleAt(L, v.walker.y) });
  const front = img && L.front ? frontLayer(look, file, img, gr) : null; // the pilot walks behind it (doc 92)
  if (front) drawFront(ctx, front, gr);
  drawLabels(ctx, v.focus, v.text, areas, false);
  return true;
}
