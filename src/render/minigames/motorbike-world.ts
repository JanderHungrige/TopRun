import { TAU } from '../../core/math';
import { cachedGradient } from '../carrier/pen';

// Motorbike vs. Jet (doc 22): the home air base at sunset in side view — sky, sun, hills, base skyline, runway
// with edge lights, the perimeter road and the fence in the foreground. Scrolls with the camera (metres).

/** Screen pixels per metre along the road. */
export const PX_PER_M = 8;
/** Where the bike's wheels and the jet's main gear touch the ground (screen y). */
export const ROAD_Y = 640;
export const RUNWAY_Y = 548;
/** Road surface edges (screen y): far kerb, near kerb. */
export const ROAD_FAR = 598;
export const ROAD_NEAR = 652;
const HORIZON = 506;

const wrap = (v: number, p: number): number => ((v % p) + p) % p;
const hash = (i: number): number => {
  const v = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return v - Math.floor(v);
};

function sky(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = cachedGradient(ctx, 'mb-sky', () => {
    const g = ctx.createLinearGradient(0, 0, 0, HORIZON);
    g.addColorStop(0, '#1d1b44');
    g.addColorStop(0.34, '#552c66');
    g.addColorStop(0.6, '#b9485b');
    g.addColorStop(0.82, '#ee8248');
    g.addColorStop(1, '#ffd27c');
    return g;
  });
  ctx.fillRect(0, 0, 1280, HORIZON);
  ctx.fillStyle = cachedGradient(ctx, 'mb-sun-glow', () => {
    const g = ctx.createRadialGradient(930, 472, 20, 930, 472, 420);
    g.addColorStop(0, 'rgba(255,236,170,0.75)');
    g.addColorStop(0.2, 'rgba(255,190,110,0.32)');
    g.addColorStop(1, 'rgba(255,170,90,0)');
    return g;
  });
  ctx.fillRect(480, 60, 800, HORIZON - 60);
  ctx.fillStyle = '#fff1c4';
  ctx.beginPath();
  ctx.arc(930, 474, 44, 0, TAU);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,214,140,0.55)';
  for (const [y, h] of [[452, 2], [462, 2.5], [472, 3]] as const) ctx.fillRect(884, y, 92, h);
}

/** Long flat clouds lit from below by the low sun. */
function clouds(ctx: CanvasRenderingContext2D, camX: number, t: number): void {
  for (let i = 0; i < 7; i++) {
    const x = wrap(i * 310 - camX * 0.06 - t * 4, 2100) - 300;
    const y = 120 + ((i * 53) % 190);
    const w = 160 + ((i * 71) % 140);
    ctx.fillStyle = 'rgba(70,36,86,0.55)';
    ctx.beginPath();
    ctx.ellipse(x, y, w, 9 + (i % 3) * 3, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,150,110,0.42)';
    ctx.beginPath();
    ctx.ellipse(x + 8, y + 5, w * 0.82, 4 + (i % 2) * 2, 0, 0, TAU);
    ctx.fill();
  }
}

function ridge(ctx: CanvasRenderingContext2D, camX: number, par: number, base: number, amp: number, freq: number, color: string): void {
  ctx.beginPath();
  ctx.moveTo(-10, base + 30);
  for (let sx = -10; sx <= 1290; sx += 16) {
    const w = sx + camX * par;
    const h = amp * (0.5 + 0.3 * Math.sin(w * freq) + 0.14 * Math.sin(w * freq * 2.7 + 1.1) + 0.06 * Math.sin(w * freq * 6.3));
    ctx.lineTo(sx, base - h);
  }
  ctx.lineTo(1290, base + 30);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

function hangar(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x, y - h * 0.55);
  ctx.quadraticCurveTo(x + w / 2, y - h * 1.25, x + w, y - h * 0.55);
  ctx.lineTo(x + w, y);
  ctx.fill();
}

/** Control tower, hangars, water tower and radar dome against the sun (parallax 0.22, period 1800). */
function skyline(ctx: CanvasRenderingContext2D, camX: number, t: number): void {
  const par = camX * 0.22;
  const P = 1800;
  const y = HORIZON + 2;
  for (let k = Math.floor((par - 500) / P); k * P - par < 1400; k++) {
    const x = k * P - par;
    ctx.fillStyle = '#2b2142';
    hangar(ctx, x, y, 220, 50);
    hangar(ctx, x + 240, y, 170, 40);
    ctx.fillRect(x + 470, y - 92, 14, 92);
    ctx.fillRect(x + 455, y - 112, 44, 22);
    ctx.fillRect(x + 460, y - 118, 34, 6);
    ctx.fillRect(x + 640, y - 30, 120, 30);
    ctx.fillRect(x + 860, y - 56, 4, 56);
    ctx.fillRect(x + 900, y - 56, 4, 56);
    ctx.beginPath();
    ctx.ellipse(x + 882, y - 66, 30, 14, 0, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + 1100, y, 34, Math.PI, TAU);
    ctx.fill();
    hangar(ctx, x + 1250, y, 260, 58);
    ctx.fillStyle = '#ffcf7a';
    for (let i = 0; i < 4; i++) ctx.fillRect(x + 459 + i * 9, y - 107, 6, 9);
    for (let i = 0; i < 6; i++) ctx.fillRect(x + 650 + i * 18, y - 22, 8, 5);
    ctx.fillStyle = Math.floor(t * 1.5 + k) % 2 === 0 ? '#9dffb0' : '#ffffff';
    ctx.fillRect(x + 475, y - 124, 4, 5);
  }
}

function runway(ctx: CanvasRenderingContext2D, camX: number): void {
  ctx.fillStyle = '#4b4a39';
  ctx.fillRect(0, HORIZON, 1280, 18);
  ctx.fillStyle = cachedGradient(ctx, 'mb-runway', () => {
    const g = ctx.createLinearGradient(0, 524, 0, 558);
    g.addColorStop(0, '#5a4f5e');
    g.addColorStop(1, '#3e3846');
    return g;
  });
  ctx.fillRect(0, 524, 1280, 34);
  ctx.fillStyle = 'rgba(255,214,170,0.55)';
  ctx.fillRect(0, 526, 1280, 1.5);
  ctx.fillRect(0, 555, 1280, 2);
  const px = camX * PX_PER_M;
  ctx.fillStyle = 'rgba(255,240,220,0.7)';
  for (let x = -wrap(px, 200); x < 1280; x += 200) ctx.fillRect(x, 539, 110, 2);
  ctx.fillStyle = '#4a5233';
  ctx.fillRect(0, 558, 1280, ROAD_FAR - 558);
  for (let x = -wrap(px, 240); x < 1290; x += 240) {
    ctx.fillStyle = 'rgba(255,200,120,0.35)';
    ctx.beginPath();
    ctx.arc(x, 561, 5, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#ffe2a0';
    ctx.fillRect(x - 1.5, 559.5, 3, 3);
  }
}

function road(ctx: CanvasRenderingContext2D, camX: number): void {
  ctx.fillStyle = cachedGradient(ctx, 'mb-road', () => {
    const g = ctx.createLinearGradient(0, ROAD_FAR, 0, ROAD_NEAR);
    g.addColorStop(0, '#4c4350');
    g.addColorStop(1, '#353039');
    return g;
  });
  ctx.fillRect(0, ROAD_FAR, 1280, ROAD_NEAR - ROAD_FAR);
  ctx.fillStyle = 'rgba(255,170,110,0.12)';
  ctx.fillRect(0, ROAD_FAR + 2, 1280, 10);
  ctx.fillStyle = '#e8e2d8';
  ctx.fillRect(0, ROAD_FAR + 1, 1280, 1.5);
  ctx.fillRect(0, ROAD_NEAR - 3, 1280, 2);
  ctx.fillStyle = '#e8b93a';
  const px = camX * PX_PER_M;
  for (let x = -wrap(px, 96); x < 1280; x += 96) ctx.fillRect(x, 623, 48, 2.5);
  ctx.fillStyle = '#6f6873';
  ctx.fillRect(0, ROAD_NEAR, 1280, 6);
  ctx.fillStyle = '#2d3122';
  ctx.fillRect(0, ROAD_NEAR + 6, 1280, 720 - ROAD_NEAR - 6);
}

/** Grass tufts and the perimeter fence close to the camera (parallax 1.3, drawn last). */
export function drawForeground(ctx: CanvasRenderingContext2D, camX: number): void {
  const px = camX * PX_PER_M * 1.3;
  ctx.strokeStyle = 'rgba(20,18,24,0.85)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  for (const y of [688, 702]) {
    ctx.moveTo(0, y);
    ctx.lineTo(1280, y);
  }
  ctx.stroke();
  ctx.fillStyle = '#17141b';
  for (let x = -wrap(px, 150); x < 1290; x += 150) ctx.fillRect(x, 672, 6, 48);
  ctx.strokeStyle = 'rgba(60,70,40,0.9)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  const first = Math.floor(px / 31);
  for (let i = first; i < first + 46; i++) {
    const x = i * 31 - px + hash(i) * 14;
    const y = 664 + hash(i + 5) * 10;
    ctx.moveTo(x, y);
    ctx.lineTo(x - 3, y - 7);
    ctx.moveTo(x + 3, y);
    ctx.lineTo(x + 5, y - 6);
  }
  ctx.stroke();
}

/** Everything behind the vehicles; `camX` is the world x (m) at the left screen edge. */
export function drawWorld(ctx: CanvasRenderingContext2D, camX: number, t: number): void {
  sky(ctx);
  clouds(ctx, camX, t);
  ridge(ctx, camX, 0.02, HORIZON - 6, 70, 0.006, '#5a3460');
  ridge(ctx, camX, 0.06, HORIZON + 2, 40, 0.011, '#3f2950');
  skyline(ctx, camX, t);
  runway(ctx, camX);
  road(ctx, camX);
}

/** Screen x of a world x (m) for this camera. */
export const screenX = (x: number, camX: number): number => (x - camX) * PX_PER_M;
