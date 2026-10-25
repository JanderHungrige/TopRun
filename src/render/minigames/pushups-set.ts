import { circle, ellipse, fillPoly } from '../shapes';

// Push-up Challenge backdrops (doc 12): the base gym or the beach at sunset, with the two mats.

export type PushupSetting = 'gym' | 'beach';
/** Where hands and toes touch the floor. */
export const FLOOR_Y = 584;
const WALL_Y = 452;
const SHORE_Y = 470;

function mat(ctx: CanvasRenderingContext2D, x0: number, x1: number, top: string, edge: string): void {
  fillPoly(ctx, [x0 + 14, 556, x1 - 14, 556, x1, 610, x0, 610], top);
  fillPoly(ctx, [x0, 610, x1, 610, x1, 620, x0, 620], edge);
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  ctx.fillRect(x0 + 16, 558, x1 - x0 - 32, 3);
}

function towel(ctx: CanvasRenderingContext2D, x0: number, x1: number, a: string, b: string): void {
  for (let i = 0; i < 6; i++) {
    const u0 = i / 6;
    const u1 = (i + 1) / 6;
    const xt = (u: number): number => x0 + 14 + (x1 - x0 - 28) * u;
    const xb = (u: number): number => x0 + (x1 - x0) * u;
    fillPoly(ctx, [xt(u0), 558, xt(u1), 558, xb(u1), 612, xb(u0), 612], i % 2 ? b : a);
  }
  fillPoly(ctx, [x0, 612, x1, 612, x1, 616, x0, 616], 'rgba(0,0,0,0.25)');
}

function blockWall(ctx: CanvasRenderingContext2D): void {
  const g = ctx.createLinearGradient(0, 0, 0, WALL_Y);
  g.addColorStop(0, '#2b384a');
  g.addColorStop(1, '#3d4c60');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 1280, WALL_Y);
  ctx.strokeStyle = 'rgba(0,0,0,0.16)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (let r = 0, y = 40; y < WALL_Y; r++, y += 30) {
    ctx.moveTo(0, y);
    ctx.lineTo(1280, y);
    for (let x = (r % 2) * 40; x < 1280; x += 80) {
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + 30);
    }
  }
  ctx.stroke();
  ctx.fillStyle = '#1d2c4d';
  ctx.fillRect(0, 336, 1280, 34);
  ctx.fillStyle = '#c9a23a';
  ctx.fillRect(0, 332, 1280, 4);
  ctx.fillRect(0, 370, 1280, 4);
  ctx.fillStyle = '#1a1f27';
  ctx.fillRect(0, WALL_Y - 10, 1280, 10);
}

/** Original squadron patch: gold ring, navy disc, white star with red wings. */
function emblem(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  circle(ctx, x, y, 54, '#c9a23a');
  circle(ctx, x, y, 47, '#16234a');
  fillPoly(ctx, [x - 64, y + 6, x - 20, y - 6, x - 20, y + 8], '#c2342c');
  fillPoly(ctx, [x + 64, y + 6, x + 20, y - 6, x + 20, y + 8], '#c2342c');
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const r = i % 2 ? 11 : 27;
    ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
  }
  ctx.closePath();
  ctx.fillStyle = '#f2efe6';
  ctx.fill();
}

function dumbbells(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#20252c';
  ctx.fillRect(40, 392, 210, 8);
  ctx.fillRect(48, 400, 8, WALL_Y - 400);
  ctx.fillRect(234, 400, 8, WALL_Y - 400);
  for (let i = 0; i < 4; i++) {
    const x = 66 + i * 46;
    ctx.fillStyle = '#9aa3ad';
    ctx.fillRect(x + 8, 384, 18, 4);
    for (const dx of [0, 26]) {
      ctx.beginPath();
      ctx.roundRect(x + dx, 376 - i * 2, 9, 20 + i * 4, 2);
      ctx.fillStyle = '#2f353d';
      ctx.fill();
    }
  }
}

function punchingBag(ctx: CanvasRenderingContext2D, t: number): void {
  const sway = Math.sin(t * 1.3) * 0.03;
  ctx.save();
  ctx.translate(1180, 0);
  ctx.rotate(sway);
  ctx.strokeStyle = '#7d858e';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, 170);
  ctx.stroke();
  ctx.beginPath();
  ctx.roundRect(-24, 170, 48, 150, 18);
  ctx.fillStyle = '#9b2d27';
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  ctx.fillRect(-16, 180, 6, 130);
  ctx.fillStyle = '#2b2b2b';
  ctx.fillRect(-24, 214, 48, 8);
  ctx.restore();
}

function woodFloor(ctx: CanvasRenderingContext2D): void {
  const g = ctx.createLinearGradient(0, WALL_Y, 0, 720);
  g.addColorStop(0, '#6a4428');
  g.addColorStop(1, '#8e5c34');
  ctx.fillStyle = g;
  ctx.fillRect(0, WALL_Y, 1280, 720 - WALL_Y);
  ctx.strokeStyle = 'rgba(40,20,8,0.28)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  for (let x = -1200; x <= 2480; x += 64) {
    ctx.moveTo(640 + (x - 640) * 0.36, WALL_Y);
    ctx.lineTo(x, 720);
  }
  ctx.stroke();
  for (const x of [330, 950]) {
    const spot = ctx.createRadialGradient(x, 600, 10, x, 600, 330);
    spot.addColorStop(0, 'rgba(255,236,190,0.22)');
    spot.addColorStop(1, 'rgba(255,236,190,0)');
    ctx.fillStyle = spot;
    ctx.fillRect(x - 340, WALL_Y, 680, 720 - WALL_Y);
  }
}

function lamp(ctx: CanvasRenderingContext2D, x: number): void {
  ctx.fillStyle = '#14181e';
  ctx.fillRect(x - 1, 0, 2, 40);
  fillPoly(ctx, [x - 30, 62, x - 12, 40, x + 12, 40, x + 30, 62], '#2a3038');
  ellipse(ctx, x, 63, 26, 5, '#fff3cf');
}

function gym(ctx: CanvasRenderingContext2D, t: number): void {
  blockWall(ctx);
  emblem(ctx, 210, 190);
  dumbbells(ctx);
  punchingBag(ctx, t);
  woodFloor(ctx);
  lamp(ctx, 330);
  lamp(ctx, 950);
  mat(ctx, 60, 520, '#2f63ad', '#1f467e');
  mat(ctx, 760, 1220, '#2f63ad', '#1f467e');
}

/** One palm frond: a tapered, serrated leaf along a drooping quadratic curve from the crown. */
function frond(ctx: CanvasRenderingContext2D, x: number, y: number, a: number, len: number): void {
  const ex = x + Math.cos(a) * len;
  const ey = y + Math.sin(a) * len * 0.55 + 46 + Math.abs(Math.cos(a)) * 30;
  const cx = x + Math.cos(a) * len * 0.5;
  const cy = y + Math.sin(a) * len * 0.5 - 26;
  const outer: number[] = [];
  const inner: number[] = [];
  for (let i = 0; i <= 14; i++) {
    const u = i / 14;
    const px = (1 - u) * (1 - u) * x + 2 * (1 - u) * u * cx + u * u * ex;
    const py = (1 - u) * (1 - u) * y + 2 * (1 - u) * u * cy + u * u * ey;
    const tx = 2 * (1 - u) * (cx - x) + 2 * u * (ex - cx);
    const ty = 2 * (1 - u) * (cy - y) + 2 * u * (ey - cy);
    const n = Math.hypot(tx, ty) || 1;
    const w = 13 * Math.sin(Math.PI * Math.min(1, u * 1.1)) * (i % 2 ? 1.35 : 0.8);
    outer.push(px - (ty / n) * w, py + (tx / n) * w);
    inner.unshift(px + (ty / n) * w * 0.55, py - (tx / n) * w * 0.55);
  }
  fillPoly(ctx, [...outer, ...inner], '#2a1830');
}

function palm(ctx: CanvasRenderingContext2D, x: number, dir: 1 | -1, t: number): void {
  const color = '#2a1830';
  const tx = x + dir * 60;
  const ty = 150;
  ctx.beginPath();
  ctx.moveTo(x - 12, SHORE_Y + 60);
  ctx.quadraticCurveTo(x + dir * 10 - 10, 300, tx - 6, ty);
  ctx.lineTo(tx + 6, ty);
  ctx.quadraticCurveTo(x + dir * 10 + 10, 300, x + 12, SHORE_Y + 60);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  for (let i = 0; i < 7; i++) frond(ctx, tx, ty, -Math.PI / 2 + (i - 3) * 0.5 + Math.sin(t * 1.1 + i) * 0.03, 125);
  for (const [dx, dy] of [[-7, 8], [6, 9], [0, 14]] as const) circle(ctx, tx + dx, ty + dy, 7, '#3d2430');
}

function sunsetSky(ctx: CanvasRenderingContext2D, t: number): void {
  const sky = ctx.createLinearGradient(0, 0, 0, 400);
  sky.addColorStop(0, '#2a1d4f');
  sky.addColorStop(0.45, '#7c3a6b');
  sky.addColorStop(0.8, '#f0784a');
  sky.addColorStop(1, '#ffc56b');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, 1280, 400);
  const glow = ctx.createRadialGradient(1010, 400, 20, 1010, 400, 260);
  glow.addColorStop(0, 'rgba(255,226,140,0.7)');
  glow.addColorStop(1, 'rgba(255,226,140,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(700, 120, 580, 280);
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, 1280, 400);
  ctx.clip();
  circle(ctx, 1010, 404, 66, '#ffdf86');
  ctx.restore();
  for (const [x, y, w] of [[260, 250, 220], [880, 300, 180], [520, 330, 260]] as const) ellipse(ctx, x + Math.sin(t * 0.05) * 10, y, w, 5, 'rgba(255,170,150,0.35)');
}

function seaAndSand(ctx: CanvasRenderingContext2D, t: number): void {
  const sea = ctx.createLinearGradient(0, 400, 0, SHORE_Y);
  sea.addColorStop(0, '#5a3b6e');
  sea.addColorStop(1, '#c7646a');
  ctx.fillStyle = sea;
  ctx.fillRect(0, 400, 1280, SHORE_Y - 400);
  for (let i = 0; i < 9; i++) {
    const y = 406 + i * 7;
    const w = 70 - i * 4 + Math.sin(t * 3 + i * 1.7) * 14;
    ctx.fillStyle = 'rgba(255,224,150,0.55)';
    ctx.fillRect(1010 - w / 2 + Math.sin(t * 2 + i) * 6, y, w, 2);
  }
  const sand = ctx.createLinearGradient(0, SHORE_Y, 0, 720);
  sand.addColorStop(0, '#d79a68');
  sand.addColorStop(1, '#efc08a');
  ctx.fillStyle = sand;
  ctx.fillRect(0, SHORE_Y, 1280, 720 - SHORE_Y);
  const foam = SHORE_Y + Math.sin(t * 0.9) * 3;
  ctx.fillStyle = 'rgba(255,240,225,0.6)';
  ctx.fillRect(0, foam - 2, 1280, 3);
}

function gulls(ctx: CanvasRenderingContext2D, t: number): void {
  for (let i = 0; i < 2; i++) {
    const gx = ((t * 22 + i * 520) % 1500) - 110;
    const gy = 120 + i * 50 + Math.sin(t + i) * 8;
    const flap = Math.sin(t * 6 + i) * 4;
    ctx.strokeStyle = '#2a1830';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(gx - 12, gy - flap);
    ctx.quadraticCurveTo(gx - 5, gy - 6, gx, gy);
    ctx.quadraticCurveTo(gx + 5, gy - 6, gx + 12, gy - flap);
    ctx.stroke();
  }
}

function beach(ctx: CanvasRenderingContext2D, t: number): void {
  sunsetSky(ctx, t);
  seaAndSand(ctx, t);
  gulls(ctx, t);
  palm(ctx, 40, 1, t);
  palm(ctx, 1240, -1, t);
  towel(ctx, 60, 520, '#d8433a', '#f4ede0');
  towel(ctx, 760, 1220, '#2f63ad', '#f2c94c');
}

export function drawPushupSet(ctx: CanvasRenderingContext2D, setting: PushupSetting, t: number): void {
  switch (setting) {
    case 'gym': return gym(ctx, t);
    case 'beach': return beach(ctx, t);
    default: throw new Error(`unhandled: ${setting satisfies never}`);
  }
}

/** Posts that hold the scoreboard up on the beach (drawn before the crowd and the board). */
export function drawBoardPosts(ctx: CanvasRenderingContext2D, setting: PushupSetting): void {
  if (setting !== 'beach') return;
  ctx.fillStyle = '#4a3326';
  ctx.fillRect(470, 200, 12, SHORE_Y + 20 - 200);
  ctx.fillRect(798, 200, 12, SHORE_Y + 20 - 200);
}
