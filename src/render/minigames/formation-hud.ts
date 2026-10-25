import { clamp, TAU, type Vec } from '../../core/math';
import type { Zone } from '../../game/minigames/formation';
import { ROUND_END, SEGMENTS, type SegmentId } from '../../game/minigames/formation-script';
import { mt } from '../../i18n/minigame-text';
import { FORMATION_TEXT, type FormationKey } from '../../i18n/minigames/formation';
import { drawPlaneTop } from '../draw-planes';
import { COLORS, text } from '../text';

// Formation Flying HUD (doc 14): routine timeline, IN SLOT gauge, smoke badge, segment banner, touch stick, hub icon.

export const SEG_KEY: Readonly<Record<SegmentId, FormationKey>> = {
  join: 'segJoin', weaves: 'segWeaves', closure: 'segClosure', turn: 'segTurn', pitch: 'segPitch', smoke: 'segSmoke', break: 'segBreak',
};
const SEG_COLOR: Readonly<Record<SegmentId, string>> = {
  join: '#6f8396', weaves: '#3fc0b0', closure: '#4f95e8', turn: '#f2913e', pitch: '#ab86f5', smoke: '#ff5a4a', break: '#6f8396',
};
const ZONE: Readonly<Record<Zone, { key: FormationKey; color: string }>> = {
  inner: { key: 'tight', color: COLORS.gold },
  outer: { key: 'loose', color: COLORS.amber },
  out: { key: 'out', color: COLORS.red },
};
const TL = { x: 330, y: 696, w: 620, h: 8 };

function panel(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
  ctx.fillStyle = 'rgba(4,8,14,0.6)';
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 8);
  ctx.fill();
}

/** The routine at the bottom: segment blocks with labels and a cursor at `t`. */
export function drawTimeline(ctx: CanvasRenderingContext2D, t: number, current: SegmentId): void {
  panel(ctx, TL.x - 14, TL.y - 30, TL.w + 28, 44);
  for (const g of SEGMENTS) {
    const x0 = TL.x + (g.from / ROUND_END) * TL.w;
    const x1 = TL.x + (g.to / ROUND_END) * TL.w;
    const now = g.id === current;
    ctx.globalAlpha = g.to <= t ? 0.35 : now ? 1 : 0.7;
    ctx.fillStyle = SEG_COLOR[g.id];
    ctx.fillRect(x0 + 1, TL.y, x1 - x0 - 2, TL.h);
    ctx.globalAlpha = 1;
    const label = g.id === 'smoke' ? `${mt(FORMATION_TEXT, SEG_KEY[g.id])} ×2` : mt(FORMATION_TEXT, SEG_KEY[g.id]);
    text(ctx, label, (x0 + x1) / 2, TL.y - 8, {
      size: 9, align: 'center', color: now ? COLORS.ink : COLORS.dim, letterSpacing: 1, maxWidth: x1 - x0 - 4, weight: now ? 800 : 600,
    });
  }
  const cx = TL.x + clamp(t / ROUND_END, 0, 1) * TL.w;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(cx - 1, TL.y - 3, 2, TL.h + 6);
  ctx.beginPath();
  ctx.moveTo(cx - 5, TL.y + TL.h + 9);
  ctx.lineTo(cx + 5, TL.y + TL.h + 9);
  ctx.lineTo(cx, TL.y + TL.h + 3);
  ctx.fill();
}

/** Bottom right: IN SLOT share so far and the zone you are in right now. */
export function drawSlotGauge(ctx: CanvasRenderingContext2D, pct: number, zone: Zone, live: boolean, t: number): void {
  panel(ctx, 1036, 610, 228, 96);
  text(ctx, mt(FORMATION_TEXT, 'inSlot'), 1052, 634, { size: 11, color: COLORS.dim, letterSpacing: 2 });
  const color = pct >= 90 ? COLORS.gold : pct >= 62 ? COLORS.green : pct >= 30 ? COLORS.amber : COLORS.red;
  text(ctx, mt(FORMATION_TEXT, 'pct', { pct }), 1250, 662, { size: 34, display: true, align: 'right', color });
  ctx.fillStyle = 'rgba(255,255,255,0.1)';
  ctx.fillRect(1052, 672, 196, 5);
  ctx.fillStyle = color;
  ctx.fillRect(1052, 672, 196 * clamp(pct / 100, 0, 1), 5);
  if (!live) return;
  const z = ZONE[zone];
  if (zone === 'out' && Math.sin(t * 10) < -0.3) return;
  text(ctx, mt(FORMATION_TEXT, z.key), 1052, 698, { size: 15, display: true, color: z.color, letterSpacing: 1 });
}

export function drawSmokeBadge(ctx: CanvasRenderingContext2D, t: number): void {
  const a = 0.75 + 0.25 * Math.sin(t * 6);
  ctx.save();
  ctx.globalAlpha = a;
  ctx.fillStyle = 'rgba(190,40,30,0.85)';
  ctx.beginPath();
  ctx.roundRect(1110, 572, 154, 30, 15);
  ctx.fill();
  ctx.restore();
  text(ctx, mt(FORMATION_TEXT, 'smokeBadge'), 1187, 593, { size: 15, display: true, align: 'center', color: '#ffffff', letterSpacing: 1 });
}

export function drawSegmentBanner(ctx: CanvasRenderingContext2D, label: string, age: number): void {
  const a = clamp(Math.min(age / 0.15, (1.8 - age) / 0.35), 0, 1);
  if (a <= 0) return;
  ctx.save();
  ctx.globalAlpha = a;
  text(ctx, label, 640, 214 - Math.max(0, 0.2 - age) * 60, {
    size: 42, display: true, italic: true, align: 'center', color: COLORS.gold, stroke: 'rgba(0,0,0,0.7)', strokeWidth: 7,
  });
  ctx.restore();
}

/** Where the finger went down and how far it is dragged (60 px = full stick). */
export function drawTouchStick(ctx: CanvasRenderingContext2D, base: Vec, knob: Vec): void {
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(base.x, base.y, 60, 0, TAU);
  ctx.stroke();
  ctx.fillStyle = 'rgba(95,212,255,0.35)';
  ctx.beginPath();
  ctx.arc(knob.x, knob.y, 18, 0, TAU);
  ctx.fill();
  ctx.restore();
}

function iconSmoke(ctx: CanvasRenderingContext2D, x: number, y: number, rgb: string, t: number): void {
  for (let i = 0; i < 9; i++) {
    const k = i / 8;
    ctx.fillStyle = `rgba(${rgb},${(0.55 * (1 - k)).toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(x + Math.sin(t * 2 + i * 0.6) * k * 2, y + 4 + k * (40 - y), 2.5 + k * 5, 0, TAU);
    ctx.fill();
  }
}

/** Hub card icon: Duke's F-14 with a jet tucked in on his right wing, both trailing smoke. Within ±40 px. */
export function drawFormationIcon(ctx: CanvasRenderingContext2D, t: number): void {
  const bob = Math.sin(t * 1.6) * 1.5;
  iconSmoke(ctx, -12, -2 + bob, '238,72,58', t);
  iconSmoke(ctx, 14, 18 + bob * 0.6, '72,150,255', t + 1);
  drawPlaneTop(ctx, 'f14', -12, -14 + bob, 0.42, { sweep: 0.25, throttle: 0.5, t });
  drawPlaneTop(ctx, 'f16', 14, 6 + bob * 0.6, 0.42, { throttle: 0.5, t });
  ctx.strokeStyle = 'rgba(255,200,61,0.85)';
  ctx.lineWidth = 1.2;
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.arc(14, 6 + bob * 0.6, 17, 0, TAU);
  ctx.stroke();
  ctx.setLineDash([]);
}
