import { arrow, INK, jetGlyph, partial, ring } from './tactics-marker';
import { manoeuvrePath } from './tactics-paths';

// Dogfight Tactics (doc 19): hub / offer card icon within ±40 px — a little whiteboard on which a blue lead
// pursuit is being drawn after a red bandit, a marker pen at the tip of the line.

const SELF = { x: -18, y: 14, h: 0.9 };
const OTHER = { x: 14, y: -10, h: 1.6 };

export function drawTacticsIcon(ctx: CanvasRenderingContext2D, t: number): void {
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fillRect(-36, -26, 76, 56);
  ctx.fillStyle = '#b9c0c7';
  ctx.fillRect(-39, -30, 78, 56);
  ctx.fillStyle = '#f7f8f6';
  ctx.fillRect(-36, -27, 72, 50);
  ctx.fillStyle = '#9aa2aa';
  ctx.fillRect(-40, 25, 80, 5);
  const p = Math.min(1, ((t * 0.45) % 1.3) / 1);
  ctx.save();
  ctx.beginPath();
  ctx.rect(-36, -27, 72, 50);
  ctx.clip();
  jetGlyph(ctx, OTHER.x, OTHER.y, OTHER.h, INK.red, 0.5);
  jetGlyph(ctx, SELF.x, SELF.y, SELF.h, INK.blue, 0.5);
  const pts = manoeuvrePath('leadPursuit', SELF, OTHER);
  arrow(ctx, pts, INK.blue, p, 2, 5);
  if (p >= 1) ring(ctx, OTHER.x + 4, OTHER.y, 11, 8, INK.red, 1.6, 2);
  ctx.restore();
  const tip = partial(pts, p).pop() ?? SELF;
  ctx.save();
  ctx.translate(tip.x, tip.y);
  ctx.rotate(-0.7);
  ctx.fillStyle = '#f2f2ee';
  ctx.fillRect(-2.5, -24, 5, 20);
  ctx.fillStyle = INK.blue;
  ctx.fillRect(-2.5, -6, 5, 6);
  ctx.strokeStyle = 'rgba(0,0,0,0.4)';
  ctx.lineWidth = 0.8;
  ctx.strokeRect(-2.5, -24, 5, 24);
  ctx.restore();
}
