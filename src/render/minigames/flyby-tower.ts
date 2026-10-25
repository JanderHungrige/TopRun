import { TAU } from '../../core/math';
import { drawController, type ControllerView } from './flyby-controller';

// The control tower of the Tower Flyby (doc 13), drawn around its centre x. The roof top is the scoring line.

const BASE_Y = 624;
const CAB_BOTTOM = 494;
const DESK_TOP = 478;
const MAN_SCALE = 1.12;
const CAB_TOP = 428;
const CAB_HALF_BOTTOM = 51;
const CAB_HALF_TOP = 62;
const CONCRETE = '#dcd6c9';

export interface TowerView {
  /** Screen y of the roof top (= ground − roof altitude). */
  roofY: number;
  controller: ControllerView;
  /** Cab rattle in px. */
  rattle: number;
  t: number;
  /** Coffee splashes on the glass. */
  splashes: number;
}

function opsBuilding(ctx: CanvasRenderingContext2D, t: number): void {
  ctx.fillStyle = '#c9c1b1';
  ctx.fillRect(-104, 576, 200, BASE_Y - 576);
  ctx.fillStyle = 'rgba(0,0,0,0.14)';
  ctx.fillRect(-104, 576, 200, 4);
  ctx.fillStyle = '#56707f';
  for (let x = -94; x < 86; x += 22) ctx.fillRect(x, 588, 13, 9);
  ctx.fillStyle = '#3c4a54';
  ctx.fillRect(40, 604, 16, BASE_Y - 604);
  // radar on the roof
  ctx.fillStyle = '#8a9298';
  ctx.fillRect(-78, 560, 3, 16);
  const w = 16 * Math.cos(t * 2.2);
  ctx.fillStyle = w > 0 ? '#e9ecee' : '#aeb5ba';
  ctx.beginPath();
  ctx.ellipse(-76.5, 558, Math.max(1.2, Math.abs(w)), 5, 0, 0, TAU);
  ctx.fill();
}

function shaft(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = CONCRETE;
  ctx.beginPath();
  ctx.moveTo(-24, 576);
  ctx.lineTo(-20, CAB_BOTTOM);
  ctx.lineTo(20, CAB_BOTTOM);
  ctx.lineTo(24, 576);
  ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,0.1)';
  ctx.fillRect(8, CAB_BOTTOM, 14, 90);
  ctx.fillStyle = '#4f6878';
  for (let y = 500; y < 568; y += 14) ctx.fillRect(-5, y, 10, 7);
  // balcony
  ctx.fillStyle = '#b9b2a4';
  ctx.fillRect(-70, CAB_BOTTOM, 140, 7);
  ctx.strokeStyle = '#8b939a';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-70, CAB_BOTTOM - 9);
  ctx.lineTo(70, CAB_BOTTOM - 9);
  for (let x = -70; x <= 70; x += 10) {
    ctx.moveTo(x, CAB_BOTTOM - 9);
    ctx.lineTo(x, CAB_BOTTOM);
  }
  ctx.stroke();
}

function cabPath(ctx: CanvasRenderingContext2D): void {
  ctx.beginPath();
  ctx.moveTo(-CAB_HALF_BOTTOM, CAB_BOTTOM);
  ctx.lineTo(-CAB_HALF_TOP, CAB_TOP);
  ctx.lineTo(CAB_HALF_TOP, CAB_TOP);
  ctx.lineTo(CAB_HALF_BOTTOM, CAB_BOTTOM);
  ctx.closePath();
}

function consoleDesk(ctx: CanvasRenderingContext2D, t: number): void {
  ctx.fillStyle = '#39434c';
  ctx.fillRect(-54, DESK_TOP, 108, CAB_BOTTOM - DESK_TOP);
  ctx.fillStyle = '#4b5762';
  ctx.fillRect(-54, DESK_TOP, 108, 3);
  for (let i = 0; i < 4; i++) {
    const on = Math.sin(t * 3 + i * 1.7) > -0.6;
    ctx.fillStyle = on ? '#5be37d' : '#2d6b41';
    ctx.fillRect(-45 + i * 25, DESK_TOP + 6, 14, 6);
  }
  ctx.fillStyle = '#ffb347';
  ctx.fillRect(-49, DESK_TOP + 4, 2, 2);
}

function glass(ctx: CanvasRenderingContext2D, splashes: number): void {
  cabPath(ctx);
  ctx.fillStyle = 'rgba(160,215,235,0.2)';
  ctx.fill();
  ctx.save();
  cabPath(ctx);
  ctx.clip();
  ctx.fillStyle = 'rgba(255,255,255,0.22)';
  ctx.beginPath();
  for (const x of [-50, 6]) {
    ctx.moveTo(x, CAB_BOTTOM);
    ctx.lineTo(x + 26, CAB_TOP);
    ctx.lineTo(x + 36, CAB_TOP);
    ctx.lineTo(x + 10, CAB_BOTTOM);
  }
  ctx.fill();
  ctx.fillStyle = 'rgba(107,60,28,0.72)';
  for (let i = 0; i < Math.min(4, splashes); i++) {
    const sx = 18 + i * 9;
    const sy = 444 + (i % 2) * 8;
    ctx.beginPath();
    ctx.arc(sx, sy, 3.2, 0, TAU);
    ctx.rect(sx - 0.8, sy, 1.6, 7 + i * 2);
    ctx.fill();
  }
  ctx.restore();
  ctx.strokeStyle = '#2b333a';
  ctx.lineWidth = 2.2;
  cabPath(ctx);
  ctx.stroke();
  ctx.beginPath();
  for (const f of [-0.5, 0, 0.5]) {
    ctx.moveTo(f * CAB_HALF_BOTTOM * 2 * 0.5, CAB_BOTTOM);
    ctx.lineTo(f * CAB_HALF_TOP * 2 * 0.5, CAB_TOP);
  }
  ctx.stroke();
}

function roof(ctx: CanvasRenderingContext2D, roofY: number, t: number): void {
  ctx.fillStyle = '#e6e1d6';
  ctx.beginPath();
  ctx.moveTo(-64, roofY);
  ctx.lineTo(64, roofY);
  ctx.lineTo(62, CAB_TOP);
  ctx.lineTo(-62, CAB_TOP);
  ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.fillRect(-62, CAB_TOP - 4, 124, 4);
  ctx.fillStyle = '#c23b2f';
  ctx.fillRect(-64, roofY, 128, 2.5);
  const blink = Math.sin(t * 5) > 0;
  ctx.fillStyle = blink ? '#ff3b30' : '#7a1f1a';
  ctx.beginPath();
  ctx.arc(56, roofY + 8, 2.6, 0, TAU);
  ctx.fill();
  if (blink) {
    ctx.fillStyle = 'rgba(255,60,50,0.25)';
    ctx.beginPath();
    ctx.arc(56, roofY + 8, 7, 0, TAU);
    ctx.fill();
  }
}

/** The whole tower at screen x `x`. */
export function drawTower(ctx: CanvasRenderingContext2D, x: number, v: TowerView): void {
  if (x < -200 || x > 1480) return;
  ctx.save();
  ctx.translate(x, 0);
  opsBuilding(ctx, v.t);
  shaft(ctx);
  ctx.translate(v.rattle * Math.sin(v.t * 90), 0);
  ctx.save();
  cabPath(ctx);
  ctx.clip();
  ctx.fillStyle = 'rgba(30,52,68,0.55)';
  ctx.fillRect(-70, CAB_TOP, 140, CAB_BOTTOM - CAB_TOP);
  ctx.save();
  ctx.translate(6, DESK_TOP);
  ctx.scale(MAN_SCALE, MAN_SCALE);
  drawController(ctx, 0, 0, v.controller);
  ctx.restore();
  ctx.restore();
  consoleDesk(ctx, v.t);
  glass(ctx, v.splashes);
  roof(ctx, v.roofY, v.t);
  ctx.restore();
}
