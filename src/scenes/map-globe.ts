import { TAU } from '../core/math';
import type { CampaignId } from '../data/types';
import { t } from '../i18n/i18n';
import { circle, ellipse } from '../render/shapes';
import { COLORS, text } from '../render/text';
import type { Rect } from '../ui/widgets';

// The campaign map's globe (doc 35): switches between map 1 and map 2, padlocked until mission 30 is cleared.

export const GLOBE: Rect = { x: 712, y: 10, w: 56, h: 56 };
const R = 22;

function padlock(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.strokeStyle = '#e9eff5';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y - 4, 4.5, Math.PI, 0);
  ctx.stroke();
  ctx.fillStyle = '#e9eff5';
  ctx.fillRect(x - 6.5, y - 4, 13, 10);
  ctx.fillStyle = '#33414f';
  ctx.fillRect(x - 1, y - 1, 2, 4);
}

function earth(ctx: CanvasRenderingContext2D, cx: number, cy: number, time: number): void {
  const sea = ctx.createRadialGradient(cx - 7, cy - 8, 3, cx, cy, R);
  sea.addColorStop(0, '#6cc0ec');
  sea.addColorStop(1, '#16466e');
  circle(ctx, cx, cy, R, '#16466e');
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, TAU);
  ctx.clip();
  ctx.fillStyle = sea;
  ctx.fillRect(cx - R, cy - R, R * 2, R * 2);
  for (let k = 0; k < 4; k++) {
    const f = ((k * 0.29 + time * 0.06) % 1) * 2 - 1;
    const w = Math.sqrt(Math.max(0, 1 - f * f));
    ellipse(ctx, cx + f * R, cy + (k % 2 ? 7 : -6), 7 * w + 1, 6 + (k % 3), '#4f9a4a');
  }
  ctx.strokeStyle = 'rgba(255,255,255,0.22)';
  ctx.lineWidth = 1;
  for (const k of [-0.6, 0, 0.6]) {
    ctx.beginPath();
    ctx.ellipse(cx, cy, Math.abs(k) * R + 1, R, 0, 0, TAU);
    ctx.stroke();
  }
  ctx.restore();
}

/** The globe on `on`; the badge shows the other map's number, or a padlock while map 2 is closed. */
export function drawGlobe(ctx: CanvasRenderingContext2D, on: CampaignId, open: boolean, time: number): void {
  const cx = GLOBE.x + GLOBE.w / 2;
  const cy = GLOBE.y + GLOBE.h / 2;
  if (open) circle(ctx, cx, cy, R + 4 + Math.sin(time * 3) * 1.5, 'rgba(255,200,61,0.18)');
  earth(ctx, cx, cy, time);
  ctx.strokeStyle = open ? COLORS.gold : COLORS.panelEdge;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, TAU);
  ctx.stroke();
  const bx = cx + 16;
  const by = cy + 16;
  circle(ctx, bx, by, 10, open ? '#b8860b' : '#33414f');
  if (!open) return padlock(ctx, bx, by + 1);
  text(ctx, on === 1 ? '2' : '1', bx, by + 1, { size: 13, display: true, align: 'center', baseline: 'middle', color: '#fff' });
}

/** "Opens after mission 30" under the globe for a moment after a tap on the closed globe. */
export function drawGlobeLocked(ctx: CanvasRenderingContext2D, alpha: number): void {
  ctx.save();
  ctx.globalAlpha = Math.min(1, alpha);
  text(ctx, t('map.globeLocked'), GLOBE.x + GLOBE.w / 2, GLOBE.y + GLOBE.h + 16, {
    size: 13, align: 'center', color: COLORS.red, stroke: 'rgba(0,0,0,0.6)', strokeWidth: 3,
  });
  ctx.restore();
}
