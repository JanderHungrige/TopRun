import { TAU } from '../../core/math';
import { wobble } from './tactics-marker';

// Dogfight Tactics (doc 19): the briefing room — wall, ceiling light, wall clock, the table the cards lie on,
// the whiteboard (aluminium frame, ghost smudges, marker tray) and the eraser wipe between engagements.

export const BOARD = { x: 24, y: 64, w: 908, h: 414 } as const;
export const TABLE_Y = 494;
const SURFACE_TOP = '#fbfcfa';
const SURFACE_BOTTOM = '#e8ece9';

function wall(ctx: CanvasRenderingContext2D): void {
  const g = ctx.createLinearGradient(0, 0, 0, 720);
  g.addColorStop(0, '#34445a');
  g.addColorStop(0.55, '#243142');
  g.addColorStop(1, '#161e29');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 1280, 720);
  const light = ctx.createRadialGradient(560, -40, 20, 560, -40, 700);
  light.addColorStop(0, 'rgba(255,244,214,0.28)');
  light.addColorStop(1, 'rgba(255,244,214,0)');
  ctx.fillStyle = light;
  ctx.fillRect(0, 0, 1280, 720);
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  for (let x = 0; x < 1280; x += 160) ctx.fillRect(x, 0, 2, 720);
  ctx.fillStyle = '#1a2330';
  ctx.fillRect(940, 600, 340, 120);
  ctx.fillStyle = 'rgba(255,255,255,0.05)';
  ctx.fillRect(940, 600, 340, 3);
}

function clock(ctx: CanvasRenderingContext2D, t: number): void {
  const x = 1226;
  const y = 300;
  ctx.beginPath();
  ctx.arc(x, y, 27, 0, TAU);
  ctx.fillStyle = '#e9e6dc';
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#11161d';
  ctx.stroke();
  ctx.strokeStyle = '#2b2f36';
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * TAU;
    ctx.lineWidth = i % 3 === 0 ? 2.2 : 1.2;
    ctx.beginPath();
    ctx.moveTo(x + Math.sin(a) * 19, y - Math.cos(a) * 19);
    ctx.lineTo(x + Math.sin(a) * 23, y - Math.cos(a) * 23);
    ctx.stroke();
  }
  const hand = (a: number, len: number, w: number, c: string): void => {
    ctx.strokeStyle = c;
    ctx.lineWidth = w;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.sin(a) * len, y - Math.cos(a) * len);
    ctx.stroke();
  };
  hand(((10 + t / 3600) / 12) * TAU, 12, 3, '#1b1f25');
  hand(((10 + t / 60) / 60) * TAU, 18, 2, '#1b1f25');
  hand((t % 60) / 60 * TAU, 20, 1, '#c0392b');
}

function table(ctx: CanvasRenderingContext2D): void {
  const g = ctx.createLinearGradient(0, TABLE_Y, 0, 720);
  g.addColorStop(0, '#6d4a2f');
  g.addColorStop(0.08, '#5a3c26');
  g.addColorStop(1, '#3a2617');
  ctx.fillStyle = g;
  ctx.fillRect(0, TABLE_Y, 950, 720 - TABLE_Y);
  ctx.fillStyle = 'rgba(255,220,180,0.16)';
  ctx.fillRect(0, TABLE_Y, 950, 3);
  ctx.strokeStyle = 'rgba(30,16,8,0.25)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 9; i++) {
    const y = TABLE_Y + 18 + i * 24;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.bezierCurveTo(300, y + 6 * wobble(4, i), 620, y - 5 * wobble(9, i), 950, y + 3);
    ctx.stroke();
  }
}

function marker(ctx: CanvasRenderingContext2D, x: number, color: string): void {
  const y = BOARD.y + BOARD.h + 3;
  ctx.fillStyle = '#f2f2ee';
  ctx.beginPath();
  ctx.roundRect(x, y, 46, 9, 4);
  ctx.fill();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(x + 30, y, 18, 9, 3);
  ctx.fill();
  ctx.fillRect(x + 6, y + 3, 18, 3);
}

/** Wall, light, clock and the table; drawn first. */
export function drawRoom(ctx: CanvasRenderingContext2D, t: number): void {
  wall(ctx);
  clock(ctx, t);
  table(ctx);
}

/** The whiteboard frame and surface with faint ghost marks of old lessons. */
export function drawWhiteboard(ctx: CanvasRenderingContext2D): void {
  const b = BOARD;
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fillRect(b.x - 4, b.y + 6, b.w + 16, b.h + 14);
  ctx.fillStyle = '#b9c0c7';
  ctx.fillRect(b.x - 8, b.y - 8, b.w + 16, b.h + 16);
  ctx.fillStyle = '#e4e8ec';
  ctx.fillRect(b.x - 8, b.y - 8, b.w + 16, 3);
  surface(ctx, b.x, b.w);
  ctx.fillStyle = '#9aa2aa';
  ctx.fillRect(b.x - 10, b.y + b.h, b.w + 20, 14);
  ctx.fillStyle = '#c9cfd5';
  ctx.fillRect(b.x - 10, b.y + b.h, b.w + 20, 3);
  marker(ctx, b.x + 40, '#1d5fc4');
  marker(ctx, b.x + 100, '#cf3229');
  marker(ctx, b.x + 160, '#26292f');
  ctx.fillStyle = '#2c3440';
  ctx.fillRect(b.x + b.w - 110, b.y + b.h - 10, 70, 13);
  ctx.fillStyle = '#7d8590';
  ctx.fillRect(b.x + b.w - 110, b.y + b.h + 1, 70, 4);
}

/** Clean board surface between x and x + w (also used by the wipe). */
function surface(ctx: CanvasRenderingContext2D, x: number, w: number): void {
  const b = BOARD;
  const g = ctx.createLinearGradient(0, b.y, 0, b.y + b.h);
  g.addColorStop(0, SURFACE_TOP);
  g.addColorStop(1, SURFACE_BOTTOM);
  ctx.fillStyle = g;
  ctx.fillRect(x, b.y, w, b.h);
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, b.y, w, b.h);
  ctx.clip();
  ctx.strokeStyle = 'rgba(120,130,140,0.07)';
  ctx.lineWidth = 9;
  ctx.lineCap = 'round';
  for (let i = 0; i < 7; i++) {
    const cx = b.x + 80 + ((i * 137) % (b.w - 160));
    const cy = b.y + 60 + ((i * 89) % (b.h - 120));
    ctx.beginPath();
    ctx.arc(cx, cy, 30 + 20 * wobble(2, i), 0.4 * i, 0.4 * i + 2.2);
    ctx.stroke();
  }
  const sheen = ctx.createLinearGradient(b.x, b.y, b.x + b.w, b.y + b.h);
  sheen.addColorStop(0.2, 'rgba(255,255,255,0)');
  sheen.addColorStop(0.32, 'rgba(255,255,255,0.45)');
  sheen.addColorStop(0.42, 'rgba(255,255,255,0)');
  ctx.fillStyle = sheen;
  ctx.fillRect(x, b.y, w, b.h);
  ctx.restore();
}

/** The eraser sweeping across the board: p = 0 … 1; left of it the board is clean. */
export function drawWipe(ctx: CanvasRenderingContext2D, p: number): void {
  const b = BOARD;
  const ex = b.x + Math.min(1, p) * (b.w + 80) - 40;
  surface(ctx, b.x, Math.max(0, Math.min(b.w, ex - b.x)));
  if (p >= 1) return;
  const ey = b.y + b.h / 2 + Math.sin(p * 28) * (b.h * 0.36);
  ctx.save();
  ctx.translate(ex, ey);
  ctx.rotate(0.12 * Math.sin(p * 28));
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.fillRect(-34, -16, 76, 40);
  ctx.fillStyle = '#2c3440';
  ctx.fillRect(-38, -20, 76, 26);
  ctx.fillStyle = '#5b636e';
  ctx.fillRect(-38, 6, 76, 12);
  ctx.restore();
}
