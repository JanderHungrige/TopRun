import type { PlaneId } from '../../data/types';
import { drawPlaneTop } from '../draw-planes';
import type { Rect } from './layout';
import { bevel, MONO, PHOSPHOR, PHOSPHOR_DIM, rr, screenText } from './metal';
import type { LeftConsoleView } from './types';

/** Green monochrome MFDs: bezel with push-nubs (static), the stores page and the mission page (live). */

const INSET = 12;
export const screenRect = (r: Rect): Rect => ({ x: r.x + INSET, y: r.y + INSET, w: r.w - INSET * 2, h: r.h - INSET * 2 });

export function mfdStatic(ctx: CanvasRenderingContext2D, r: Rect): void {
  bevel(ctx, r, 8, '#1c2024');
  for (let i = 0; i < 4; i++) {
    const x = r.x + r.w * (0.2 + i * 0.2) - 7;
    for (const y of [r.y + 2.5, r.y + r.h - 6.5]) {
      rr(ctx, x, y, 14, 4, 1.5);
      ctx.fillStyle = '#3c434a';
      ctx.fill();
    }
  }
  const s = screenRect(r);
  bevel(ctx, s, 5, '#041409', true);
  ctx.fillStyle = 'rgba(98,240,138,0.035)'; // scanlines
  for (let y = s.y + 1; y < s.y + s.h; y += 3) ctx.fillRect(s.x, y, s.w, 1);
}

/** The aircraft's planform in phosphor green (tinted through a scratch canvas; cache build only). */
function greenPlane(ctx: CanvasRenderingContext2D, plane: PlaneId, x: number, y: number, scale: number): void {
  const k = Math.max(1, ctx.getTransform().a);
  const size = 90 * scale;
  const tmp = document.createElement('canvas');
  tmp.width = Math.ceil(size * k);
  tmp.height = Math.ceil(size * k);
  const o = tmp.getContext('2d');
  if (!o) return;
  o.setTransform(k, 0, 0, k, 0, 0);
  drawPlaneTop(o, plane, size / 2, size / 2, scale, { flash: true });
  o.globalCompositeOperation = 'source-in';
  o.fillStyle = PHOSPHOR;
  o.fillRect(0, 0, size, size);
  ctx.save();
  ctx.globalAlpha = 0.42;
  ctx.drawImage(tmp, x - size / 2, y - size / 2, size, size);
  ctx.restore();
}

export function storesStatic(ctx: CanvasRenderingContext2D, r: Rect, plane: PlaneId, title: string): void {
  mfdStatic(ctx, r);
  const s = screenRect(r);
  screenText(ctx, title, s.x + 8, s.y + 11, { size: 10, maxW: s.w - 90, color: PHOSPHOR_DIM, weight: 800, spacing: 1 });
  ctx.fillStyle = PHOSPHOR_DIM;
  ctx.fillRect(s.x + 6, s.y + 19, s.w - 82, 1);
  greenPlane(ctx, plane, s.x + s.w - 38, s.y + s.h / 2 + 2, 1.15);
}

export function storesLive(
  ctx: CanvasRenderingContext2D, r: Rect, stores: LeftConsoleView['stores'], none: string, swap: LeftConsoleView['swap'],
): void {
  const s = screenRect(r);
  const w = s.w - 82;
  if (stores.length === 0) {
    screenText(ctx, none, s.x + 6 + w / 2, s.y + s.h / 2 + 8, { size: 11, align: 'center', maxW: w - 8, color: PHOSPHOR_DIM });
    return;
  }
  if (swap) {
    const color = swap.ready ? PHOSPHOR : PHOSPHOR_DIM;
    screenText(ctx, swap.text, s.x + 9, s.y + s.h - 8, { size: 10.5, maxW: s.w - 16, color, weight: 800, spacing: 0.5 });
  }
  const rowH = Math.min(17, (s.h - (swap ? 40 : 26)) / stores.length);
  stores.forEach((st, i) => {
    const y = s.y + 31 + i * rowH;
    const ink = st.ammo > 0 ? PHOSPHOR : PHOSPHOR_DIM;
    if (st.next) {
      ctx.fillStyle = ink;
      ctx.fillRect(s.x + 6, y - rowH / 2 + 1, w, rowH - 2);
    }
    const color = st.next ? '#041409' : ink;
    const tag = st.role === 'air' ? 'A' : 'G';
    screenText(ctx, st.next ? `${tag}[${st.short}]` : `${tag} ${st.short} `, s.x + 9, y, { size: 11.5, maxW: w - 46, color, weight: 800 });
    screenText(ctx, `×${st.ammo}`, s.x + 6 + w - 4, y, { size: 11.5, align: 'right', maxW: 40, color: st.ammo > 0 ? color : '#ff5a48', weight: 800 });
  });
}

/** Greedy wrap in the MFD font; at most `max` lines, the last one squeezed by maxWidth if needed. */
export function wrapMono(ctx: CanvasRenderingContext2D, s: string, maxW: number, size: number, max: number): string[] {
  ctx.save();
  ctx.font = `700 ${size}px ${MONO}`;
  const lines: string[] = [];
  let line = '';
  for (const word of s.split(/\s+/).filter(Boolean)) {
    const next = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(next).width > maxW && lines.length < max - 1) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  ctx.restore();
  if (line) lines.push(line);
  return lines;
}

/** Thin outlined bar filled to `f`; the fill colour defaults to phosphor. */
export function bar(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, f: number, color = PHOSPHOR): void {
  ctx.strokeStyle = PHOSPHOR_DIM;
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  ctx.fillStyle = color;
  ctx.fillRect(x + 2, y + 2, Math.max(0, (w - 4) * Math.max(0, Math.min(1, f))), h - 4);
}

