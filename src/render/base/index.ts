import { BASE_AREAS, type BaseAreaId } from '../../data/base-areas';
import type { LiveryId } from '../../data/liveries';
import type { PlaneId } from '../../data/types';
import type { Walker } from '../../game/base-hangar';
import type { Cells } from '../../game/chalkboard';
import type { PilotFace } from '../avatars';
import { artGrid, type Grid } from '../ceremony-set';
import { scratch, SpriteCache } from '../pixel/blit';
import { hexOf, PAL } from '../pixel/palette';
import { outline, toCanvas } from '../pixel/post';
import { Pix } from '../pixel/raster';
import { drawAmbientBack, drawAmbientFront, drawBrackets } from './ambient';
import { drawBoardTiles, paintBoardFrame } from './board';
import { drawCast, drawCastShadows } from './cast';
import { drawChalkMini, paintChalkFrame } from './chalk';
import { paintDoors } from './doors';
import { jetGearCol, jetSprite } from './jet';
import { drawLabels, type HangarText } from './labels';
import { JET } from './layout';
import { col } from './paint';
import { paintPropShadows, paintProps } from './props';
import { paintRooms } from './rooms';
import { paintShell, paintShellFront } from './shell';
import { paintNeon } from './sprites';

// Hangar base (doc 30): the whole scene. Static art is painted once per art grid into two cached layers (back:
// building, doors, rooms, board frame, light; front: the props in front of the jet) plus the cached jet sprite;
// every frame composes back → ambient → jet → props → dust / steam / brackets / shadows on one art-resolution
// canvas and blits it once with hard pixel edges; the chalkboard's slate (doc 40), the figures and the readable labels
// go on top.

export type { HangarText } from './labels';

export interface HangarView {
  t: number;
  focus: BaseAreaId;
  plane: PlaneId;
  livery: LiveryId;
  face: PilotFace;
  walker: Walker;
  /** The flip board's three rows. */
  board: readonly string[];
  /** The shared chalkboard (doc 40): its cells (null until fetched) and their change count. */
  chalk: { cells: Cells | null; version: number };
  text: HangarText;
}

const layers = new SpriteCache(6);

function backLayer(gr: Grid): HTMLCanvasElement | null {
  return layers.get(`back|${gr.W}x${gr.H}|${gr.G.toFixed(4)}`, () => {
    const p = new Pix(gr.W, gr.H, 1 / gr.G, 0, 0);
    paintShell(p);
    paintDoors(p);
    paintRooms(p);
    paintNeon(p, false);
    paintBoardFrame(p, gr.G);
    paintChalkFrame(p, gr.G);
    paintPropShadows(p);
    paintShellFront(p);
    return toCanvas(p);
  });
}

function frontLayer(gr: Grid): HTMLCanvasElement | null {
  return layers.get(`front|${gr.W}x${gr.H}|${gr.G.toFixed(4)}`, () => {
    const p = new Pix(gr.W, gr.H, 1 / gr.G, 0, 0);
    paintProps(p);
    outline(p, false);
    return toCanvas(p);
  });
}

function chocks(g: CanvasRenderingContext2D, gr: Grid, plane: PlaneId): void {
  const c = jetGearCol(plane, gr.G);
  const r = Math.round(JET.ground / gr.G);
  for (const dc of [-5, 3]) {
    g.fillStyle = hexOf(col(PAL.ink, 0));
    g.fillRect(c + dc - 1, r - 3, 4, 3);
    g.fillStyle = hexOf(col(PAL.yellow, 3));
    g.fillRect(c + dc, r - 2, 2, 2);
  }
}

function compose(g: CanvasRenderingContext2D, gr: Grid, v: HangarView, back: HTMLCanvasElement): void {
  g.drawImage(back, 0, 0);
  drawAmbientBack(g, gr.G, v.t);
  drawBoardTiles(g, gr.G, v.board, v.t);
  drawCastShadows(g, gr.G, v.walker);
  const jet = jetSprite(v.plane, v.livery, gr.G);
  if (jet) g.drawImage(jet.canvas, jet.c, jet.r);
  chocks(g, gr, v.plane);
  const front = frontLayer(gr);
  if (front) g.drawImage(front, 0, 0);
  drawAmbientFront(g, gr.G, v.t);
  drawBrackets(g, gr.G, BASE_AREAS[v.focus].hot, v.t);
}

/** Draws the hangar base covering the 1280 × 720 frame. */
export function drawHangar(ctx: CanvasRenderingContext2D, v: HangarView): void {
  const gr = artGrid(ctx);
  const back = backLayer(gr);
  const sc = scratch(gr.W, gr.H);
  if (!back || !sc) return;
  compose(sc.g, gr, v, back);
  const m = ctx.getTransform();
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(sc.canvas, m.a ? (Math.round(m.e) - m.e) / m.a : 0, m.d ? (Math.round(m.f) - m.f) / m.d : 0, gr.W * gr.G, gr.H * gr.G);
  ctx.restore();
  drawChalkMini(ctx, v.chalk.cells, v.chalk.version);
  drawCast(ctx, gr.G, { t: v.t, walker: v.walker, face: v.face });
  drawLabels(ctx, v.focus, v.text);
}
