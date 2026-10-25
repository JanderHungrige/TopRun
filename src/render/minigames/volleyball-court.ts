import type { Ball } from '../../game/minigames/volleyball-ball';
import { makeCanvas } from '../pixel/post';

// Beach Volleyball (doc 21): world → screen mapping, the court (lines and net in a slight oblique view), the
// ball sprite with its shadow, speed trail and landing marker, and sand puffs — all on the 2-px art grid.

/** Logical px per metre; the athletes stand on the court's middle line at GROUND_Y. */
export const PX = 74;
export const GROUND_Y = 612;
export const NET_X = 640;
export const sx = (x: number): number => NET_X + x * PX;
export const sy = (y: number): number => GROUND_Y - y * PX;
/** People-kit units → logical px: an athlete is about 1.86 m (328 kit units). */
export const FIG = PX / 176;
/** Oblique depth: the far sideline sits this far up and right of the near one (half each way from the middle). */
const DX = 40;
const DY = 30;
const NET_H = 2.3;
const LINE = '#f7e7c6';

const g2 = (v: number): number => Math.round(v / 2) * 2;

export function block(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, c: string): void {
  ctx.fillStyle = c;
  ctx.fillRect(g2(x), g2(y), Math.max(2, g2(w)), Math.max(2, g2(h)));
}

function pixLine(ctx: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number, c: string, w = 2): void {
  const n = Math.max(1, Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) / 2));
  for (let i = 0; i <= n; i++) block(ctx, x0 + ((x1 - x0) * i) / n, y0 + ((y1 - y0) * i) / n, w, w, c);
}

/** Court lines on the sand (drawn under everything else on the court). */
export function drawCourt(ctx: CanvasRenderingContext2D): void {
  const near = GROUND_Y + DY;
  const far = GROUND_Y - DY;
  block(ctx, sx(-7) - DX, near, sx(7) - sx(-7), 4, LINE);
  block(ctx, sx(-7) - DX, near + 4, sx(7) - sx(-7), 2, 'rgba(120,70,40,0.25)');
  block(ctx, sx(-7) + DX, far, sx(7) - sx(-7), 2, LINE);
  for (const s of [-1, 1]) pixLine(ctx, sx(s * 7) - DX, near, sx(s * 7) + DX, far, LINE, s > 0 ? 2 : 4);
  pixLine(ctx, NET_X - DX, near, NET_X + DX, far, 'rgba(200,150,110,0.6)');
}

const POST = { near: { x: NET_X - DX - 2, y: GROUND_Y + DY + 4 }, far: { x: NET_X + DX + 2, y: GROUND_Y - DY - 4 } };
const TOP = NET_H * PX;

function post(ctx: CanvasRenderingContext2D, p: { x: number; y: number }, dark: boolean): void {
  const top = p.y - TOP - 22;
  block(ctx, p.x - 3, top, 6, p.y - top, dark ? '#3a2a36' : '#5a4a50');
  block(ctx, p.x - 3, top, 2, p.y - top, dark ? '#4e3c48' : '#8a7a7a');
  block(ctx, p.x - 6, p.y - 2, 12, 4, 'rgba(90,50,30,0.45)');
}

/** Net mesh, tape and the far post: behind the athletes. */
export function drawNetBack(ctx: CanvasRenderingContext2D): void {
  post(ctx, POST.far, true);
  const a = { x: POST.near.x, y: POST.near.y - TOP };
  const b = { x: POST.far.x, y: POST.far.y - TOP };
  const h = 0.95 * PX;
  ctx.fillStyle = 'rgba(16,10,22,0.18)';
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.lineTo(b.x, b.y + h);
  ctx.lineTo(a.x, a.y + h);
  ctx.fill();
  for (let k = 6; k < h; k += 8) pixLine(ctx, a.x, a.y + k, b.x, b.y + k, 'rgba(28,18,34,0.55)');
  for (let u = 0; u <= 1.001; u += 1 / 6) {
    const x = a.x + (b.x - a.x) * u;
    const y = a.y + (b.y - a.y) * u;
    block(ctx, x, y, 2, h, 'rgba(28,18,34,0.5)');
  }
  pixLine(ctx, a.x, a.y + h, b.x, b.y + h, '#e8dccb');
  pixLine(ctx, a.x, a.y, b.x, b.y, '#fbf6ee', 6);
  pixLine(ctx, a.x, a.y + 4, b.x, b.y + 4, '#2f63ad', 2);
}

/** The near post with its antenna: in front of the athletes. */
export function drawNetFront(ctx: CanvasRenderingContext2D): void {
  post(ctx, POST.near, false);
  for (let i = 0; i < 5; i++) block(ctx, POST.near.x - 1, POST.near.y - TOP - 44 + i * 8, 2, 8, i % 2 ? '#f4f1ea' : '#d8433a');
}

const BALL_ART = 10;
const frames: (HTMLCanvasElement | null)[] = [];

/** One spin frame of the ball: three-colour panels, a dark rim, a highlight. */
function ballFrame(i: number): HTMLCanvasElement | null {
  const c = makeCanvas(BALL_ART, BALL_ART);
  const g = c.getContext('2d');
  if (!g) return null;
  const r = BALL_ART / 2;
  const cols = ['#f4f1ea', '#f2c12e', '#2f63ad'];
  for (let y = 0; y < BALL_ART; y++) {
    for (let x = 0; x < BALL_ART; x++) {
      const dx = x + 0.5 - r;
      const dy = y + 0.5 - r;
      const d = Math.hypot(dx, dy);
      if (d > r) continue;
      const a = Math.atan2(dy, dx) + (i * Math.PI) / 12 + d * 0.35;
      const sector = ((Math.floor((a / (Math.PI * 2)) * 6) % 3) + 3) % 3;
      g.fillStyle = d > r - 1 ? '#3a2232' : dx < -1 && dy < -1 && d < r - 2 ? '#ffffff' : cols[sector] ?? '#f4f1ea';
      g.fillRect(x, y, 1, 1);
    }
  }
  return c;
}

export interface BallView {
  ball: Ball;
  /** Spin angle (rad) for the panel frame. */
  spin: number;
  /** Speed trail (hard balls). */
  trail: boolean;
}

/** The ball's shadow on the sand (drawn before the athletes). */
export function drawBallShadow(ctx: CanvasRenderingContext2D, b: Ball): void {
  const w = Math.max(8, 20 - b.y * 3);
  ctx.fillStyle = `rgba(60,24,30,${Math.max(0.12, 0.38 - b.y * 0.04).toFixed(3)})`;
  ctx.fillRect(g2(sx(b.x) - w / 2), GROUND_Y - 2, g2(w), 4);
  ctx.fillRect(g2(sx(b.x) - w / 2 + 4), GROUND_Y - 4, g2(w - 8), 8);
}

export function drawBall(ctx: CanvasRenderingContext2D, v: BallView): void {
  const b = v.ball;
  const x = sx(b.x);
  const y = sy(b.y);
  if (v.trail) {
    const sp = Math.hypot(b.vx, b.vy) || 1;
    for (let k = 1; k <= 4; k++) {
      ctx.globalAlpha = 0.32 - k * 0.07;
      block(ctx, x - (b.vx / sp) * k * 11 - 6, y + (b.vy / sp) * k * 11 - 6, 12, 12, '#fff3d6');
    }
    ctx.globalAlpha = 1;
  }
  const i = ((Math.floor((v.spin / (Math.PI * 2)) * 8) % 8) + 8) % 8;
  frames[i] ??= ballFrame(i);
  const art = frames[i];
  if (!art) return;
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(art, g2(x - BALL_ART), g2(y - BALL_ART), BALL_ART * 2, BALL_ART * 2);
  ctx.restore();
}

/** A dashed pixel ring where the ball will come down, in the colour of whoever plays it, with a centre dot. */
export function drawMarker(ctx: CanvasRenderingContext2D, x: number, color: string, t: number): void {
  const cx = sx(x);
  const rx = 24 + Math.round(Math.sin(t * 9) * 1.5) * 2;
  block(ctx, cx - rx, GROUND_Y - 2, rx * 2, 4, 'rgba(40,16,24,0.18)');
  for (let k = 0; k < 20; k++) {
    if ((k + Math.floor(t * 8)) % 5 === 4) continue;
    const a = (k / 20) * Math.PI * 2;
    block(ctx, cx + Math.cos(a) * rx - 2, GROUND_Y + Math.sin(a) * 8 - 2, 4, 4, '#1a0c18');
    block(ctx, cx + Math.cos(a) * rx - 2, GROUND_Y + Math.sin(a) * 8 - 2, 4, 2, color);
  }
  block(ctx, cx - 2, GROUND_Y - 2, 4, 4, color);
}

export interface Puff { x: number; y: number; vx: number; vy: number; age: number; life: number; size: number }
const PUFF = ['#f3cf9c', '#e2ad78', '#d4986a'];

export function drawPuffs(ctx: CanvasRenderingContext2D, puffs: readonly Puff[]): void {
  for (const p of puffs) {
    const k = p.age / p.life;
    ctx.globalAlpha = Math.max(0, 1 - k);
    block(ctx, p.x, p.y, p.size, p.size, PUFF[Math.floor(p.x + p.size) % 3] ?? '#e2ad78');
  }
  ctx.globalAlpha = 1;
}
