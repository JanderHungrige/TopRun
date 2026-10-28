import type { Vec } from '../../core/math';
import type { Verdict } from '../../game/minigames/highfive';
import { pixelRect } from '../pixel/frame';
import { COLORS, text } from '../text';

// High Five (doc 42): the beat cue (a target ring and an outer ring shrinking onto it), the verdict pop-ups, the
// clap's star burst, the 24 beat pips and the run counter. Strings come in translated.

export const VERDICT_COLOR: Readonly<Record<Verdict, string>> = { perfect: COLORS.gold, good: COLORS.cyan, miss: COLORS.red };

const ring = (ctx: CanvasRenderingContext2D, at: Vec, r: number, color: string, w: number): void => {
  ctx.strokeStyle = color;
  ctx.lineWidth = w;
  ctx.beginPath();
  ctx.arc(Math.round(at.x), Math.round(at.y), r, 0, Math.PI * 2);
  ctx.stroke();
};

/** `k` 1 → 0 as the beat comes (0 = now); the outer ring touches the target ring on the beat. */
export function drawCue(ctx: CanvasRenderingContext2D, at: Vec, k: number, label: string): void {
  const near = Math.max(0, Math.min(1, k));
  ring(ctx, at, 26, 'rgba(255,255,255,0.85)', 4);
  ring(ctx, at, 26 + 80 * near, near < 0.15 ? COLORS.gold : 'rgba(95,212,255,0.9)', 3);
  text(ctx, label, at.x, at.y - 40 - 80 * near * 0.2, { size: 16, display: true, align: 'center', color: COLORS.ink, shadow: true });
}

export interface Popup { text: string; color: string; at: Vec; age: number }

export function drawPopups(ctx: CanvasRenderingContext2D, popups: readonly Popup[]): void {
  for (const p of popups) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, 1 - p.age / 0.8);
    text(ctx, p.text, p.at.x, p.at.y - 50 - p.age * 60, { size: 26, display: true, align: 'center', color: p.color, shadow: true });
    ctx.restore();
  }
}

/** The clap: eight pixel rays growing out and fading, `age` 0 … 0.3 s. */
export function drawClap(ctx: CanvasRenderingContext2D, at: Vec, age: number): void {
  if (age > 0.3) return;
  const r = 10 + age * 120;
  ctx.save();
  ctx.globalAlpha = 1 - age / 0.3;
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    pixelRect(ctx, Math.round(at.x + Math.cos(a) * r) - 3, Math.round(at.y + Math.sin(a) * r) - 3, 6, 6, i % 2 ? '#ffe08a' : '#ffffff');
  }
  ctx.restore();
}

/** One pip per beat under the top bar: judged ones in their colour, the rest dim. */
export function drawPips(ctx: CanvasRenderingContext2D, verdicts: readonly Verdict[], total: number, run: string): void {
  const w = 14;
  const gap = 8; // between runs (three beats each)
  const x0 = 640 - (total * (w + 4) + (total / 3 - 1) * gap) / 2;
  for (let i = 0; i < total; i++) {
    const v = verdicts[i];
    pixelRect(ctx, x0 + i * (w + 4) + Math.floor(i / 3) * gap, 70, w, 8, v ? VERDICT_COLOR[v] : 'rgba(255,255,255,0.18)');
  }
  text(ctx, run, 640, 100, { size: 14, display: true, align: 'center', color: COLORS.dim });
}
