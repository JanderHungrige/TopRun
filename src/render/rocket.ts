import { TAU } from '../core/math';
import type { Look } from './livery-art';
import { drawShipSide } from './ship';
import { fillPoly, flame } from './shapes';

// The launch stack of the rocket launch (doc 59), nose up: the booster (stage 1), the upper stage (stage 2) and the
// fairing with the ship inside, drawn in code. Coordinates hang from the nose at (x, y), the stack below it.

type Ctx = CanvasRenderingContext2D;

export type StackPiece = 'booster' | 'upper' | 'fairing';

/** Each piece's top and bottom below the nose, and width. */
export const PIECES: Readonly<Record<StackPiece, { top: number; bottom: number; w: number }>> = {
  fairing: { top: 0, bottom: 62, w: 28 },
  upper: { top: 62, bottom: 134, w: 28 },
  booster: { top: 134, bottom: 270, w: 34 },
};

const WHITE = '#e8ecf2';
const SHADE = '#b9c0cc';
const DARK = '#2b2f38';

function cylinder(ctx: Ctx, x: number, top: number, bottom: number, w: number): void {
  const g = ctx.createLinearGradient(x - w / 2, 0, x + w / 2, 0);
  g.addColorStop(0, SHADE);
  g.addColorStop(0.45, WHITE);
  g.addColorStop(1, '#9aa2ae');
  ctx.fillStyle = g;
  ctx.fillRect(x - w / 2, top, w, bottom - top);
}

/** One piece with its top at `top` (screen y), centred on x. */
export function drawPiece(ctx: Ctx, piece: StackPiece, x: number, top: number, look: Look): void {
  const p = PIECES[piece];
  const h = p.bottom - p.top;
  const w = p.w;
  switch (piece) {
    case 'fairing':
      fillPoly(ctx, [x, top, x + w * 0.32, top + h * 0.35, x + w / 2, top + h * 0.75, x + w / 2, top + h, x - w / 2, top + h, x - w / 2, top + h * 0.75, x - w * 0.32, top + h * 0.35], WHITE, 'rgba(0,0,0,0.35)');
      ctx.fillStyle = look.base;
      ctx.fillRect(x - w / 2, top + h - 8, w, 4);
      return;
    case 'upper':
      cylinder(ctx, x, top, top + h, w);
      ctx.fillStyle = DARK;
      ctx.fillRect(x - w / 2, top + h - 10, w, 10);
      ctx.fillRect(x - w / 2, top + 10, w, 3);
      return;
    case 'booster':
      cylinder(ctx, x, top, top + h, w);
      ctx.fillStyle = DARK;
      ctx.fillRect(x - w / 2, top, w, 6);
      for (let y = top + 30; y < top + h - 20; y += 34) ctx.fillRect(x - w / 2, y, w, 2);
      for (const sx of [-1, 1]) fillPoly(ctx, [x + (sx * w) / 2, top + h - 40, x + sx * (w / 2 + 14), top + h - 6, x + sx * (w / 2 + 14), top + h + 4, x + (sx * w) / 2, top + h], DARK);
      fillPoly(ctx, [x - 9, top + h, x + 9, top + h, x + 12, top + h + 10, x - 12, top + h + 10], '#4a4f5a');
      return;
    default:
      throw new Error(`unhandled: ${piece satisfies never}`);
  }
}

/** The stack from the nose down: `pieces` is what is still attached, top to bottom; flame under the last if burning. */
export function drawStack(ctx: Ctx, x: number, noseY: number, pieces: readonly StackPiece[], look: Look, burning: boolean, t: number): void {
  for (const piece of pieces) drawPiece(ctx, piece, x, noseY + PIECES[piece].top, look);
  const last = pieces[pieces.length - 1];
  if (!burning || !last) return;
  ctx.save();
  ctx.translate(x, noseY + PIECES[last].bottom + (last === 'booster' ? 10 : 0));
  ctx.scale(last === 'booster' ? 1.6 : 1.1, last === 'booster' ? 3.4 : 2.6);
  flame(ctx, 0, 0, 14, 1, t);
  ctx.restore();
}

/** A dropped piece tumbling away: rotation about its middle. */
export function drawFalling(ctx: Ctx, piece: StackPiece, x: number, midY: number, rot: number, look: Look): void {
  const p = PIECES[piece];
  const h = p.bottom - p.top;
  ctx.save();
  ctx.translate(x, midY);
  ctx.rotate(rot);
  drawPiece(ctx, piece, 0, -h / 2, look);
  ctx.restore();
}

/** The ship flying free, nose up (its side view turned a quarter), engine burning. */
export function drawFreeShip(ctx: Ctx, x: number, y: number, look: Look, t: number): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-TAU / 4);
  ctx.scale(1.3, 1.3);
  drawShipSide(ctx, look, t);
  ctx.restore();
}
