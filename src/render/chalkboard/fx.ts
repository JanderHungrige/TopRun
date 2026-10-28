import { SPONGE_PX, type ToolId } from '../../data/chalkboard-layout';
import { CHALK_HEX, chalkStick, spongeBlock } from './room';

// Chalkboard scene (doc 40): the tool in hand at the cursor, and the little bits that fly — chalk dust from the nib,
// dust puffs from a dry sponge, drops from a wet one, the splash when it is dipped.

export type BitKind = 'dust' | 'puff' | 'drop';

export interface Bit { x: number; y: number; vx: number; vy: number; life: number; kind: BitKind; color: string }

const GRAVITY: Readonly<Record<BitKind, number>> = { dust: 120, puff: -20, drop: 900 };
const MAX_BITS = 220;

export class Bits {
  private list: Bit[] = [];

  spawn(b: Bit): void {
    if (this.list.length < MAX_BITS) this.list.push(b);
  }

  /** A few specks at (x, y): chalk dust, a puff of dry-sponge dust or water drops (Math.random — looks only). */
  burst(x: number, y: number, kind: BitKind, n: number, color: string): void {
    for (let i = 0; i < n; i++) {
      const spread = kind === 'puff' ? 60 : 30;
      this.spawn({
        x: x + (Math.random() - 0.5) * (kind === 'puff' ? 50 : 8), y, vx: (Math.random() - 0.5) * spread,
        vy: kind === 'drop' ? 40 + Math.random() * 80 : -Math.random() * 30, life: kind === 'puff' ? 0.9 : 0.6 + Math.random() * 0.5, kind, color,
      });
    }
  }

  update(dt: number): void {
    for (const b of this.list) {
      b.vy += GRAVITY[b.kind] * dt;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.life -= dt;
    }
    this.list = this.list.filter((b) => b.life > 0 && b.y < 720);
  }

  draw(ctx: CanvasRenderingContext2D): void {
    for (const b of this.list) {
      ctx.globalAlpha = Math.min(1, b.life * 2) * (b.kind === 'puff' ? 0.35 : 0.85);
      ctx.fillStyle = b.color;
      const s = b.kind === 'puff' ? 6 : b.kind === 'drop' ? 3 : 2;
      ctx.fillRect(Math.round(b.x / 2) * 2, Math.round(b.y / 2) * 2, s, s + (b.kind === 'drop' ? 2 : 0));
    }
    ctx.globalAlpha = 1;
  }
}

/** The tool in hand at the cursor: a tilted chalk stick with its tip on the point, or the sponge centred on it. */
export function drawHeld(ctx: CanvasRenderingContext2D, tool: ToolId, color: number | null, x: number, y: number, wet: number): void {
  if (tool === 'sponge' || color === null) {
    spongeBlock(ctx, Math.round(x - SPONGE_PX.w / 2), Math.round(y - SPONGE_PX.h / 2), SPONGE_PX.w, SPONGE_PX.h, wet);
    return;
  }
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));
  ctx.rotate(-Math.PI / 4);
  chalkStick(ctx, 0, 5, color, false);
  ctx.restore();
  ctx.fillStyle = CHALK_HEX[color] ?? '#fff';
  ctx.fillRect(Math.round(x) - 1, Math.round(y) - 1, 3, 3);
}
