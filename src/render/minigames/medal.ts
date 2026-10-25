import type { Medal } from '../../game/minigames/core';
import { COLORS, text } from '../text';

const FILL: Readonly<Record<Medal, string>> = { gold: '#ffc83d', silver: '#cfd8e2', bronze: '#d08a4e' };

/** A round medal with a star; `null` draws an empty outline. */
export function drawMedal(ctx: CanvasRenderingContext2D, medal: Medal | null, x: number, y: number, r: number): void {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = medal ? FILL[medal] : 'rgba(255,255,255,0.06)';
  ctx.fill();
  ctx.lineWidth = Math.max(1.5, r * 0.12);
  ctx.strokeStyle = medal ? 'rgba(0,0,0,0.35)' : COLORS.faint;
  ctx.stroke();
  if (medal) text(ctx, '★', x, y + r * 0.36, { size: r * 1.05, align: 'center', color: 'rgba(0,0,0,0.38)' });
}
