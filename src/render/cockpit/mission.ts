import type { Rect } from './layout';
import { PHOSPHOR, PHOSPHOR_DIM, rr, screenText } from './metal';
import { bar, screenRect, wrapMono } from './screens';
import type { RightConsoleView } from './types';

/** The right-hand mission MFD: mission tag + name, objective, progress, kills/cash, route, and the boss target box. */

const DARK = '#041409';
const ALERT = '#ff5a48';

function header(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, v: RightConsoleView): void {
  rr(ctx, x, y - 8, 28, 16, 2);
  ctx.fillStyle = PHOSPHOR;
  ctx.fill();
  screenText(ctx, String(v.missionNumber).padStart(2, '0'), x + 14, y + 0.5, { size: 12, align: 'center', color: DARK, weight: 900 });
  screenText(ctx, v.missionName, x + 36, y, { size: 12.5, maxW: w - 36, weight: 900 });
  ctx.fillStyle = PHOSPHOR_DIM;
  ctx.fillRect(x, y + 11, w, 1);
}

function objective(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, v: RightConsoleView): number {
  screenText(ctx, v.labels.objective, x, y, { size: 9.5, maxW: w, color: PHOSPHOR_DIM, weight: 800, spacing: 1 });
  const lines = wrapMono(ctx, v.objective, w, 11, 2);
  lines.forEach((l, i) => screenText(ctx, l, x, y + 14 + i * 13, { size: 11, maxW: w }));
  let bottom = y + 14 + lines.length * 13;
  if (v.progress) {
    const { current, required } = v.progress;
    bar(ctx, x, bottom - 4, w - 60, 10, required > 0 ? current / required : 0);
    screenText(ctx, `${current}/${required}`, x + w, bottom + 1, { size: 11, align: 'right', maxW: 56, weight: 800 });
    bottom += 14;
  }
  return bottom;
}

function stats(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, v: RightConsoleView): void {
  const half = w / 2 - 4;
  screenText(ctx, v.labels.kills, x, y, { size: 9.5, maxW: half - 34, color: PHOSPHOR_DIM, weight: 800, spacing: 1 });
  screenText(ctx, String(v.kills), x + half, y, { size: 12, align: 'right', maxW: 34, weight: 900 });
  screenText(ctx, v.labels.cash, x + half + 10, y, { size: 9.5, maxW: half - 70, color: PHOSPHOR_DIM, weight: 800, spacing: 1 });
  screenText(ctx, v.cash, x + w, y, { size: 12, align: 'right', maxW: 70, weight: 900 });
  const ry = y + 17;
  screenText(ctx, v.labels.route, x, ry, { size: 9.5, maxW: 58, color: PHOSPHOR_DIM, weight: 800, spacing: 1 });
  const bx = x + 64;
  const bw = w - 64;
  const f = Math.max(0, Math.min(1, v.route));
  bar(ctx, bx, ry - 4, bw, 8, f, PHOSPHOR_DIM);
  const mx = bx + 2 + (bw - 4) * f;
  ctx.fillStyle = PHOSPHOR;
  ctx.beginPath();
  ctx.moveTo(mx, ry - 7);
  ctx.lineTo(mx + 4, ry + 5);
  ctx.lineTo(mx - 4, ry + 5);
  ctx.closePath();
  ctx.fill();
}

function corners(ctx: CanvasRenderingContext2D, r: Rect, l: number): void {
  ctx.beginPath();
  for (const [x, y, sx, sy] of [[r.x, r.y, 1, 1], [r.x + r.w, r.y, -1, 1], [r.x, r.y + r.h, 1, -1], [r.x + r.w, r.y + r.h, -1, -1]] as const) {
    ctx.moveTo(x + sx * l, y);
    ctx.lineTo(x, y);
    ctx.lineTo(x, y + sy * l);
  }
  ctx.stroke();
}

function bossBox(ctx: CanvasRenderingContext2D, r: Rect, b: NonNullable<RightConsoleView['boss']>, t: number): void {
  const flash = b.enraged && Math.floor(t * 4) % 2 === 0;
  const ink = b.enraged ? ALERT : PHOSPHOR;
  ctx.strokeStyle = ink;
  ctx.lineWidth = 1.6;
  corners(ctx, r, 10);
  if (flash) {
    ctx.fillStyle = 'rgba(255,90,72,0.12)';
    ctx.fillRect(r.x, r.y, r.w, r.h);
  }
  const x = r.x + 10;
  const w = r.w - 20;
  screenText(ctx, b.name, x, r.y + 15, { size: 13, maxW: w, color: ink, weight: 900 });
  screenText(ctx, b.title, x, r.y + 31, { size: 10, maxW: w, color: b.enraged ? 'rgba(255,90,72,0.75)' : PHOSPHOR_DIM, weight: 800 });
  bar(ctx, x, r.y + r.h - 22, w, 12, b.ratio, flash ? '#ffb0a6' : ink);
}

export function missionLive(ctx: CanvasRenderingContext2D, r: Rect, v: RightConsoleView, t: number): void {
  const s = screenRect(r);
  const x = s.x + 8;
  const w = s.w - 16;
  header(ctx, x, s.y + 14, w, v);
  const y = objective(ctx, x, s.y + 37, w, v);
  stats(ctx, x, Math.max(y + 8, s.y + 102), w, v);
  if (v.boss) bossBox(ctx, { x: s.x + 6, y: s.y + s.h - 74, w: s.w - 12, h: 68 }, v.boss, t);
}
