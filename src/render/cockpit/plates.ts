import { drawPlaneTop } from '../draw-planes';
import { buttonHousing } from './buttons';
import { attitudeStatic, cannonStatic, hullStatic } from './gauges';
import { lampsStatic } from './lamps';
import { LEFT, RIGHT, type Rect } from './layout';
import { backplate, bevel, fitFont, legend, rr, screw, subPlate } from './metal';
import { radarStatic } from './radar';
import { mfdStatic, storesStatic } from './screens';
import type { LeftConsoleView, RightConsoleView } from './types';

/** Everything that does not move, composed once into the per-console plate cache (see index.ts). */

/** Dark lettering cut into the light name plate, with a bright lower lip. */
function cut(ctx: CanvasRenderingContext2D, s: string, x: number, y: number, size: number, maxW: number, align: CanvasTextAlign): void {
  ctx.save();
  fitFont(ctx, s, { size, maxW, spacing: 1.5, weight: 900 });
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.fillText(s, x, y + 0.9, maxW);
  ctx.fillStyle = '#23282c';
  ctx.fillText(s, x, y, maxW);
  ctx.restore();
}

function namePlate(ctx: CanvasRenderingContext2D, r: Rect, v: LeftConsoleView): void {
  bevel(ctx, r, 4, '#9ba3aa');
  ctx.fillStyle = 'rgba(255,255,255,0.13)';
  for (let y = r.y + 2; y < r.y + r.h - 1; y += 2.2) ctx.fillRect(r.x + 2, y, r.w - 4, 0.6);
  screw(ctx, r.x + 8, r.y + r.h / 2, 5, 2.6);
  screw(ctx, r.x + r.w - 8, r.y + r.h / 2, 6, 2.6);
  drawPlaneTop(ctx, v.plane, r.x + 34, r.y + r.h / 2 + 1, 0.6, { shadow: true });
  cut(ctx, v.planeName, r.x + 60, r.y + 17, 15, r.w - 80, 'left');
  ctx.fillStyle = 'rgba(35,40,44,0.35)';
  ctx.fillRect(r.x + 60, r.y + 26, r.w - 80, 1);
  cut(ctx, v.callsign, r.x + 60, r.y + 36.5, 11, r.w - 80, 'left');
}

export function buildLeft(ctx: CanvasRenderingContext2D, v: LeftConsoleView): void {
  backplate(ctx, LEFT.panel.x, 3, LEFT.panel.x + LEFT.panel.w);
  namePlate(ctx, LEFT.plate, v);
  subPlate(ctx, { x: 14, y: 66, w: 292, h: 254 }, 10);
  legend(ctx, v.labels.radar, LEFT.radar.cx, 77, { size: 10, align: 'center', maxW: 150 });
  radarStatic(ctx, LEFT.radar, 20);
  subPlate(ctx, { x: 14, y: 330, w: 140, h: 124 }, 30);
  hullStatic(ctx, LEFT.hull, v.labels.hull, 34);
  cannonStatic(ctx, LEFT.cannon, v.labels, 40);
  storesStatic(ctx, LEFT.stores, v.plane, v.labels.stores);
  buttonHousing(ctx, LEFT.missileBtn, v.keys.missile, 50);
  buttonHousing(ctx, LEFT.switchBtn, v.keys.switch, 60);
}

/** A row of toggle switches; the middle one sits under a red flip guard. */
function toggles(ctx: CanvasRenderingContext2D, x: number, y: number, w: number): void {
  bevel(ctx, { x, y, w, h: 36 }, 5, '#2b3036');
  for (let i = 0; i < 3; i++) {
    const cx = x + w * (0.2 + i * 0.3);
    ctx.fillStyle = '#15181b';
    ctx.beginPath();
    ctx.arc(cx, y + 18, 6.5, 0, Math.PI * 2);
    ctx.fill();
    const up = i !== 1;
    ctx.strokeStyle = '#c9d0d6';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx, y + 18);
    ctx.lineTo(cx, y + 18 + (up ? -11 : 11));
    ctx.stroke();
    ctx.fillStyle = '#e6eaee';
    ctx.beginPath();
    ctx.arc(cx, y + 18 + (up ? -11 : 11), 2.6, 0, Math.PI * 2);
    ctx.fill();
  }
  rr(ctx, x + w * 0.5 - 10, y + 4, 20, 28, 3);
  ctx.fillStyle = 'rgba(200,40,30,0.55)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,120,100,0.6)';
  ctx.lineWidth = 1;
  ctx.stroke();
}

function grille(ctx: CanvasRenderingContext2D, x: number, y: number, w: number): void {
  for (let i = 0; i < 4; i++) bevel(ctx, { x, y: y + i * 9, w, h: 4 }, 2, '#0b0d0f', true);
}

export function buildRight(ctx: CanvasRenderingContext2D, v: RightConsoleView): void {
  backplate(ctx, RIGHT.panel.x, 9, RIGHT.panel.x);
  mfdStatic(ctx, RIGHT.mission);
  lampsStatic(ctx, RIGHT.warnings, v.labels);
  buttonHousing(ctx, RIGHT.flareBtn, v.keys.flare, 70);
  buttonHousing(ctx, RIGHT.specialBtn, v.keys.special, 80);
  subPlate(ctx, { x: 974, y: 548, w: 144, h: 160 }, 90);
  attitudeStatic(ctx, RIGHT.attitude, 94);
  toggles(ctx, RIGHT.pauseBtn.x, 548, RIGHT.pauseBtn.w);
  buttonHousing(ctx, RIGHT.pauseBtn, v.keys.pause, 100);
  grille(ctx, RIGHT.pauseBtn.x + 10, 674, RIGHT.pauseBtn.w - 20);
}
