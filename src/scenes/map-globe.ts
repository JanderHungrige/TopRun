import { TAU } from '../core/math';
import { CAMPAIGN_IDS, type CampaignId } from '../data/types';
import { t } from '../i18n/i18n';
import type { UiKey } from '../i18n/ui-en';
import { circle, ellipse } from '../render/shapes';
import { COLORS, text } from '../render/text';
import { drawPanel, type Rect } from '../ui/widgets';

// The campaign map's globe (doc 35), a map picker since map 3 (doc 48): a tap drops a row of map chips below it,
// closed maps padlocked until the previous map's finale is cleared.

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

/** The globe on map `on`; the badge shows its number, or a padlock while no other map is open yet. */
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
  text(ctx, String(on), bx, by + 1, { size: 13, display: true, align: 'center', baseline: 'middle', color: '#fff' });
}

const CHIP = 40;
const CHIP_GAP = 8;

/** The map chips in a row under the globe, centred on it. */
export function chipRect(c: CampaignId): Rect {
  const n = CAMPAIGN_IDS.length;
  const x0 = GLOBE.x + GLOBE.w / 2 - (n * CHIP + (n - 1) * CHIP_GAP) / 2;
  return { x: x0 + (c - 1) * (CHIP + CHIP_GAP), y: GLOBE.y + GLOBE.h + 6, w: CHIP, h: CHIP };
}

/** The open picker: the map on show in gold, the focused chip outlined, closed maps padlocked. */
export function drawMapPicker(ctx: CanvasRenderingContext2D, on: CampaignId, focus: CampaignId, open: (c: CampaignId) => boolean): void {
  const first = chipRect(1);
  const last = chipRect(CAMPAIGN_IDS[CAMPAIGN_IDS.length - 1] ?? 1);
  drawPanel(ctx, { x: first.x - 8, y: first.y - 6, w: last.x + last.w - first.x + 16, h: CHIP + 12 }, { fill: 'rgba(6,12,20,0.94)', radius: 8 });
  for (const c of CAMPAIGN_IDS) {
    const r = chipRect(c);
    drawPanel(ctx, r, { fill: c === on ? '#b8860b' : 'rgba(30,48,70,0.95)', edge: c === focus ? COLORS.gold : COLORS.panelEdge, radius: 6 });
    if (open(c)) text(ctx, String(c), r.x + r.w / 2, r.y + r.h / 2 + 1, { size: 18, display: true, align: 'center', baseline: 'middle', color: '#fff' });
    else padlock(ctx, r.x + r.w / 2, r.y + r.h / 2 + 2);
  }
}

/** The note for a closed map: "Opens after mission 30 / 60". */
export const lockedNote = (c: CampaignId): UiKey => (c === 4 ? 'map.globeLocked4' : c === 3 ? 'map.globeLocked3' : 'map.globeLocked');

/** The closed-map note under the globe for a moment after picking a closed map. */
export function drawGlobeLocked(ctx: CanvasRenderingContext2D, alpha: number, note: UiKey): void {
  ctx.save();
  ctx.globalAlpha = Math.min(1, alpha);
  text(ctx, t(note), GLOBE.x + GLOBE.w / 2, GLOBE.y + GLOBE.h + 62, {
    size: 13, align: 'center', color: COLORS.red, stroke: 'rgba(0,0,0,0.6)', strokeWidth: 3,
  });
  ctx.restore();
}
