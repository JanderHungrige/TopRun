import { TAU } from '../core/math';
import { DROP } from '../game/drop-launch';

// The mech's drop (doc 84), side view: a green-gold jungle sky with two moons, mountains and a waterfall far off, the
// canopy below with the clearing and its landing pad, the dropship overhead with its bay doors. The camera follows the
// falling mech until the ground comes into view. Logical 1280 × 720.

/** Pixels per metre of altitude, and where the falling mech stays on screen. */
export const DROP_PX = 6;
const MECH_Y = 300;
const GROUND_MIN = 620;

/** The screen y of the clearing's floor for the mech at altitude `alt`. */
export const groundY = (alt: number): number => Math.max(GROUND_MIN, MECH_Y + alt * DROP_PX);
/** The mech's screen y (its feet). */
export const mechY = (alt: number): number => groundY(alt) - alt * DROP_PX;

function sky(ctx: CanvasRenderingContext2D, gy: number): void {
  const g = ctx.createLinearGradient(0, 0, 0, 720);
  g.addColorStop(0, '#4a7a5a');
  g.addColorStop(0.6, '#a8c890');
  g.addColorStop(1, '#e8d898');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 1280, 720);
  for (const [x, y, r] of [[300, 120, 46], [430, 90, 30]] as const) {
    ctx.fillStyle = 'rgba(240,250,220,0.75)';
    ctx.beginPath();
    ctx.arc(x, y - (gy - GROUND_MIN) * 0.05, r, 0, TAU);
    ctx.fill();
  }
  const far = gy - 260 + (gy - GROUND_MIN) * -0.7;
  ctx.fillStyle = '#5a8a6a';
  ctx.beginPath();
  ctx.moveTo(0, far + 120);
  for (let x = 0; x <= 1280; x += 80) ctx.lineTo(x, far + 40 + Math.sin(x * 0.013) * 50 + Math.sin(x * 0.031) * 20);
  ctx.lineTo(1280, 720);
  ctx.lineTo(0, 720);
  ctx.fill();
  ctx.fillStyle = 'rgba(230,250,255,0.7)';
  ctx.fillRect(900, far + 20, 18, 140); // the waterfall
}

function canopy(ctx: CanvasRenderingContext2D, gy: number, t: number): void {
  ctx.fillStyle = '#c86a3a';
  ctx.fillRect(420, gy - 6, 440, 720 - gy + 6); // the clearing's red earth
  ctx.fillStyle = 'rgba(255,220,90,0.8)';
  ctx.beginPath();
  ctx.ellipse(640, gy + 8, 80, 12, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#c86a3a';
  ctx.beginPath();
  ctx.ellipse(640, gy + 8, 64, 8, 0, 0, TAU);
  ctx.fill();
  for (const side of [0, 1]) {
    for (let i = 0; i < 9; i++) {
      const x = side ? 870 + i * 52 : 410 - i * 52;
      const h = 90 + ((i * 37) % 60);
      ctx.fillStyle = '#3a2a1a';
      ctx.fillRect(x - 6, gy - h, 12, h + 20);
      ctx.fillStyle = i % 2 ? '#2e5a1e' : '#3e7a2a';
      ctx.beginPath();
      ctx.arc(x + Math.sin(t + i) * 2, gy - h, 46, 0, TAU);
      ctx.fill();
      ctx.fillStyle = 'rgba(160,220,110,0.35)';
      ctx.beginPath();
      ctx.arc(x - 12, gy - h - 16, 18, 0, TAU);
      ctx.fill();
    }
  }
  ctx.fillStyle = '#244a18';
  ctx.fillRect(0, gy + 30, 1280, 720 - gy);
}

/** The dropship hanging over the clearing, its bay doors opening with `open` 0–1. */
function dropship(ctx: CanvasRenderingContext2D, y: number, open: number, t: number): void {
  if (y < -120) return;
  ctx.fillStyle = '#3a4038';
  ctx.beginPath();
  ctx.moveTo(470, y);
  ctx.lineTo(810, y);
  ctx.lineTo(850, y + 40);
  ctx.lineTo(810, y + 80);
  ctx.lineTo(470, y + 80);
  ctx.lineTo(430, y + 40);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#5a6458';
  ctx.fillRect(470, y + 8, 340, 10);
  for (const x of [450, 830]) {
    ctx.fillStyle = '#2a2e28';
    ctx.fillRect(x - 22, y + 30, 44, 40);
    ctx.fillStyle = `rgba(255,190,90,${(0.6 + Math.sin(t * 30) * 0.3).toFixed(2)})`;
    ctx.fillRect(x - 14, y + 70, 28, 14 + Math.sin(t * 25) * 4);
  }
  ctx.fillStyle = '#1a1c18';
  ctx.fillRect(600 - open * 40, y + 78, 80 + open * 80, 6);
}

function retroFlame(ctx: CanvasRenderingContext2D, x: number, y: number, t: number): void {
  for (const dx of [-14, 14]) {
    const h = 26 + Math.sin(t * 40 + dx) * 6;
    ctx.fillStyle = 'rgba(255,170,60,0.85)';
    ctx.beginPath();
    ctx.moveTo(x + dx - 6, y);
    ctx.lineTo(x + dx + 6, y);
    ctx.lineTo(x + dx, y + h);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,240,180,0.9)';
    ctx.fillRect(x + dx - 2, y, 4, h * 0.5);
  }
}

export interface DropView { alt: number; t: number; bayOpen: number; burning: boolean; landedT: number | null }

/** Cloud wisps hanging at fixed heights: the mech falls past them. */
const WISPS: ReadonlyArray<readonly [number, number, number]> = [[104, 300, 120], [86, 980, 160], [66, 420, 140], [52, 860, 110], [38, 200, 150]];

function wisps(ctx: CanvasRenderingContext2D, gy: number): void {
  for (const [alt, x, w] of WISPS) {
    const y = gy - alt * DROP_PX;
    if (y < -40 || y > 760) continue;
    ctx.fillStyle = 'rgba(240,250,235,0.55)';
    ctx.beginPath();
    ctx.ellipse(x, y, w, 16, 0, 0, TAU);
    ctx.ellipse(x + w * 0.4, y - 10, w * 0.5, 14, 0, 0, TAU);
    ctx.fill();
  }
}

/** The world behind the mech; the caller draws the mech at (640, mechY). */
export function drawDropWorld(ctx: CanvasRenderingContext2D, v: DropView): void {
  const gy = groundY(v.alt);
  sky(ctx, gy);
  dropship(ctx, gy - (DROP.start + 22) * DROP_PX, v.bayOpen, v.t);
  wisps(ctx, gy);
  canopy(ctx, gy, v.t);
}

/** In front of the mech: the retro flames, and the dust of the touchdown. */
export function drawDropFx(ctx: CanvasRenderingContext2D, v: DropView): void {
  const y = mechY(v.alt);
  if (v.burning) retroFlame(ctx, 640, y, v.t);
  if (v.landedT !== null && v.landedT < 1.2) {
    const k = v.landedT / 1.2;
    ctx.fillStyle = `rgba(200,140,90,${(0.6 * (1 - k)).toFixed(2)})`;
    ctx.beginPath();
    ctx.ellipse(640, y, 60 + k * 140, 16 + k * 30, 0, 0, TAU);
    ctx.fill();
  }
}
