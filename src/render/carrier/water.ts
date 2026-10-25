import { TAU } from '../../core/math';
import { SEA_Y, stemX, sternX, WATER_DY } from './geometry';

/**
 * Water around the hull (animated, world units): the hull's dark reflection, foam streaming aft along the
 * waterline, the bow wave curling off the stem with spray, and the churned wake behind the stern.
 */

const BOW_WL = stemX(WATER_DY);
const STERN_WL = sternX(WATER_DY);
const SPAN = BOW_WL - STERN_WL;

function reflection(ctx: CanvasRenderingContext2D, t: number): void {
  ctx.beginPath();
  ctx.moveTo(STERN_WL - 6, SEA_Y + 2);
  ctx.lineTo(BOW_WL + 6, SEA_Y + 2);
  for (let x = BOW_WL; x >= STERN_WL; x -= 32) ctx.lineTo(x, SEA_Y + 16 + Math.sin(x * 0.06 + t * 1.8) * 4);
  ctx.closePath();
  ctx.fillStyle = 'rgba(4,14,24,0.22)';
  ctx.fill();
}

function foamLine(ctx: CanvasRenderingContext2D, t: number): void {
  ctx.beginPath();
  ctx.moveTo(STERN_WL, SEA_Y + 3.6);
  for (let x = STERN_WL; x <= BOW_WL; x += 12) ctx.lineTo(x, SEA_Y - 0.6 + Math.sin(x * 0.09 + t * 3.2) * 0.9);
  ctx.lineTo(BOW_WL, SEA_Y + 3.6);
  ctx.closePath();
  ctx.fillStyle = 'rgba(232,240,245,0.62)';
  ctx.fill();
}

/** Foam patches drift aft along the hull, fresher and bigger near the bow. */
function hullFoam(ctx: CanvasRenderingContext2D, t: number): void {
  ctx.beginPath();
  for (let i = 0; i < 52; i++) {
    const d = (i * 37.3 + t * 72) % SPAN;
    const k = 1 - d / SPAN;
    const x = BOW_WL - d;
    const rx = 5 + (i % 4) * 3 + k * 8;
    const y = SEA_Y + 2.4 + (i % 3) * 0.8;
    ctx.moveTo(x + rx, y);
    ctx.ellipse(x, y, rx, 1 + k * 1.8, 0, 0, TAU);
  }
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.fill();
}

/** White water piled against the stem, with a darker hollow and flying spray. */
function bowWave(ctx: CanvasRenderingContext2D, t: number): void {
  const x0 = BOW_WL;
  const bob = Math.sin(t * 2.3) * 1.6;
  ctx.beginPath();
  ctx.moveTo(x0 - 150, SEA_Y + 3.5);
  ctx.quadraticCurveTo(x0 - 60, SEA_Y + 1, x0 - 14, SEA_Y - 6 + bob * 0.5);
  ctx.quadraticCurveTo(x0 - 2, SEA_Y - 17 + bob, x0 + 10, SEA_Y - 14 + bob);
  ctx.quadraticCurveTo(x0 + 22, SEA_Y - 8, x0 + 28, SEA_Y - 2);
  ctx.quadraticCurveTo(x0 + 36, SEA_Y + 3, x0 + 50, SEA_Y + 4.5);
  ctx.closePath();
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x0 - 70, SEA_Y + 3.5);
  ctx.quadraticCurveTo(x0 - 24, SEA_Y + 1, x0 + 2, SEA_Y - 6 + bob * 0.6);
  ctx.quadraticCurveTo(x0 + 14, SEA_Y - 4, x0 + 24, SEA_Y + 3.5);
  ctx.closePath();
  ctx.fillStyle = 'rgba(150,190,214,0.5)';
  ctx.fill();
  spray(ctx, x0 + 6, SEA_Y - 13 + bob, t);
}

function spray(ctx: CanvasRenderingContext2D, x0: number, y0: number, t: number): void {
  ctx.beginPath();
  for (let i = 0; i < 18; i++) {
    const ph = (t * 1.3 + i * 0.137) % 1;
    const x = x0 + ph * (22 + (i % 4) * 9) - (i % 5) * 3;
    const y = y0 - Math.sin(ph * Math.PI) * (8 + (i % 4) * 4) + ph * 10;
    const r = 2 * (1 - ph) + 0.4;
    ctx.moveTo(x + r, y);
    ctx.arc(x, y, r, 0, TAU);
  }
  ctx.fillStyle = 'rgba(255,255,255,0.78)';
  ctx.fill();
}

/** The bow wave's crest running aft and outwards (towards the viewer), breaking up as it goes. */
function kelvinCrest(ctx: CanvasRenderingContext2D, t: number): void {
  ctx.beginPath();
  for (let i = 0; i < 12; i++) {
    const d = (i * 25 + t * 30) % 300;
    const k = d / 300;
    const x = BOW_WL - 20 - d;
    const y = SEA_Y + 5 + k * 20 + Math.sin(i * 2.7 + t) * 1.2;
    const rx = (6 + (i % 3) * 3) * (1 - k * 0.5);
    ctx.moveTo(x + rx, y);
    ctx.ellipse(x, y, rx, 1.5 - k * 0.7, 0, 0, TAU);
  }
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.fill();
}

/** Propeller wash churning up behind the transom. */
function sternWake(ctx: CanvasRenderingContext2D, t: number): void {
  ctx.beginPath();
  for (let i = 0; i < 40; i++) {
    const d = (i * 17.3 + t * 84) % 340;
    const k = 1 - d / 340;
    const x = STERN_WL - 2 - d;
    const rx = 4 + k * 12 + (i % 3) * 2;
    const y = SEA_Y + 2 + ((i * 7) % 5) * (1 - k) * 2.6;
    ctx.moveTo(x + rx, y);
    ctx.ellipse(x, y, rx, 0.8 + k * 2.8, 0, 0, TAU);
  }
  const boil = Math.sin(t * 5) * 1.6;
  ctx.moveTo(STERN_WL + 8, SEA_Y + 3.5);
  ctx.quadraticCurveTo(STERN_WL - 30, SEA_Y - 10 + boil, STERN_WL - 90, SEA_Y + 3.5);
  ctx.closePath();
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(STERN_WL - 120, SEA_Y + 9, 120, 6, 0, 0, TAU);
  ctx.fillStyle = 'rgba(190,226,240,0.22)';
  ctx.fill();
}

export function drawWater(ctx: CanvasRenderingContext2D, t: number): void {
  reflection(ctx, t);
  foamLine(ctx, t);
  hullFoam(ctx, t);
  kelvinCrest(ctx, t);
  sternWake(ctx, t);
  bowWave(ctx, t);
}
