import { clamp } from '../../core/math';
import type { AoaState } from '../../game/minigames/landing';
import { mt } from '../../i18n/minigame-text';
import { LANDING_TEXT, landingNum } from '../../i18n/minigames/landing';
import { COLORS, text } from '../text';
import { horizon, projectDir, v3, type Cam, type Vec3 } from './landing-view';

// Carrier Landing HUD (doc 18): a minimal night HUD on the combiner — horizon, the −3.5° glide-slope bar and
// the velocity vector (where the jet is really going) plus the range; beside it the AoA indexer (slow chevron,
// on-speed donut, fast chevron) and a power bar.

export const HUD_GREEN = '#7dffa0';
export const HUD_BOX = { x: 482, y: 140, w: 316, h: 380 };
const RAD = Math.PI / 180;

export interface HudView {
  cam: Cam;
  /** Direction of travel relative to the deck. */
  vv: Vec3;
  rangeNm: number;
  alpha: number;
}

function line(ctx: CanvasRenderingContext2D, x: number, y: number, angle: number, from: number, to: number): void {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  ctx.moveTo(x + c * from, y + s * from);
  ctx.lineTo(x + c * to, y + s * to);
}

function drawVelocityVector(ctx: CanvasRenderingContext2D, x: number, y: number, angle: number): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.beginPath();
  ctx.arc(0, 0, 8, 0, Math.PI * 2);
  ctx.moveTo(-8, 0);
  ctx.lineTo(-22, 0);
  ctx.moveTo(8, 0);
  ctx.lineTo(22, 0);
  ctx.moveTo(0, -8);
  ctx.lineTo(0, -17);
  ctx.stroke();
  ctx.restore();
}

export function drawHud(ctx: CanvasRenderingContext2D, v: HudView): void {
  if (v.alpha <= 0) return;
  const { cam } = v;
  ctx.save();
  ctx.globalAlpha = v.alpha;
  ctx.beginPath();
  ctx.rect(HUD_BOX.x, HUD_BOX.y, HUD_BOX.w, HUD_BOX.h);
  ctx.clip();
  ctx.strokeStyle = HUD_GREEN;
  ctx.fillStyle = HUD_GREEN;
  ctx.shadowColor = 'rgba(125,255,160,0.7)';
  ctx.shadowBlur = 5;
  ctx.lineWidth = 1.6;
  const h = horizon(cam);
  ctx.beginPath();
  line(ctx, h.x, h.y, h.angle, -170, -36);
  line(ctx, h.x, h.y, h.angle, 36, 170);
  ctx.stroke();
  const gs = projectDir(cam, v3(Math.sin(cam.yaw) * Math.cos(3.5 * RAD), -Math.sin(3.5 * RAD), Math.cos(cam.yaw) * Math.cos(3.5 * RAD)));
  if (gs) {
    ctx.setLineDash([10, 7]);
    ctx.beginPath();
    line(ctx, gs.x, gs.y, h.angle, -120, 120);
    ctx.stroke();
    ctx.setLineDash([]);
    text(ctx, '−3.5', gs.x + Math.cos(h.angle) * 126, gs.y + Math.sin(h.angle) * 126 + 4, { size: 11, color: HUD_GREEN });
  }
  const p = projectDir(cam, v.vv);
  ctx.lineWidth = 2;
  if (p) drawVelocityVector(ctx, p.x, p.y, h.angle);
  ctx.shadowBlur = 0;
  text(ctx, mt(LANDING_TEXT, 'nm', { nm: landingNum(Math.max(0, v.rangeNm), 1) }), HUD_BOX.x + HUD_BOX.w - 16, HUD_BOX.y + HUD_BOX.h - 14, { size: 15, weight: 700, align: 'right', color: HUD_GREEN });
  ctx.restore();
}

const AOA = { x: 448, top: 222 };
const SLOW = '#3dff6e';
const ON = '#ffb020';
const FAST = '#ff3a2a';

function lamp(ctx: CanvasRenderingContext2D, on: boolean, color: string, draw: () => void): void {
  ctx.save();
  ctx.strokeStyle = on ? color : '#1c2328';
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  if (on) {
    ctx.shadowColor = color;
    ctx.shadowBlur = 12;
  }
  ctx.beginPath();
  draw();
  ctx.stroke();
  ctx.restore();
}

/** AoA indexer: slow = top chevron (green), on speed = donut (amber), fast = bottom chevron (red). */
export function drawAoaIndexer(ctx: CanvasRenderingContext2D, aoa: AoaState, power: number): void {
  const slow = aoa === 'slow' || aoa === 'slightlySlow';
  const fast = aoa === 'fast' || aoa === 'slightlyFast';
  const donut = aoa === 'onSpeed' || aoa === 'slightlySlow' || aoa === 'slightlyFast';
  const { x, top } = AOA;
  ctx.fillStyle = 'rgba(3,6,9,0.85)';
  ctx.beginPath();
  ctx.roundRect(x - 22, top - 10, 44, 112, 7);
  ctx.fill();
  lamp(ctx, slow, SLOW, () => {
    ctx.moveTo(x - 13, top + 4);
    ctx.lineTo(x, top + 17);
    ctx.lineTo(x + 13, top + 4);
  });
  lamp(ctx, donut, ON, () => ctx.arc(x, top + 46, 9, 0, Math.PI * 2));
  lamp(ctx, fast, FAST, () => {
    ctx.moveTo(x - 13, top + 88);
    ctx.lineTo(x, top + 75);
    ctx.lineTo(x + 13, top + 88);
  });
  text(ctx, mt(LANDING_TEXT, 'aoa'), x, top + 118, { size: 10, align: 'center', color: COLORS.dim, letterSpacing: 1.5 });
  const px = x - 40;
  ctx.fillStyle = 'rgba(255,255,255,0.1)';
  ctx.fillRect(px - 4, top - 4, 8, 100);
  const ph = 100 * clamp(power, 0, 1);
  ctx.fillStyle = COLORS.amber;
  ctx.fillRect(px - 4, top + 96 - ph, 8, ph);
  text(ctx, mt(LANDING_TEXT, 'pwr'), px, top + 118, { size: 9, align: 'center', color: COLORS.dim, letterSpacing: 0.5 });
}
