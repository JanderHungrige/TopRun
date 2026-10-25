import { text } from '../text';

// Piano Bar (doc 23): the officers' club on a Saturday night — panelled walls, an "OFFICERS' CLUB" neon sign,
// framed jet silhouettes, a pennant with an original star-and-wings emblem, the back bar with bottles, warm
// string lights, a plank floor, and the hanging lamp whose cone lights the piano.

export interface RoomView {
  neon: string;
  /** Groove 0 … 1: how warm the lamp and the lights glow. */
  glow: number;
  /** 0 … 1 through the current beat (lights pulse on it). */
  beat: number;
  t: number;
}

const FLOOR_Y = 575;
const LAMP = { x: 522, y: 270 };

function wall(ctx: CanvasRenderingContext2D): void {
  const g = ctx.createLinearGradient(0, 56, 0, 440);
  g.addColorStop(0, '#170c0c');
  g.addColorStop(1, '#3a1c17');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 1280, 440);
  ctx.fillStyle = 'rgba(255,220,180,0.035)';
  for (let x = 0; x < 1280; x += 28) ctx.fillRect(x, 56, 12, 374);
  const w = ctx.createLinearGradient(0, 430, 0, FLOOR_Y);
  w.addColorStop(0, '#45281a');
  w.addColorStop(1, '#2a170e');
  ctx.fillStyle = w;
  ctx.fillRect(0, 430, 1280, FLOOR_Y - 430);
  ctx.fillStyle = '#6b4229';
  ctx.fillRect(0, 424, 1280, 10);
  ctx.fillStyle = '#8f5d3a';
  ctx.fillRect(0, 424, 1280, 2);
  for (let x = 8; x < 1280; x += 120) {
    ctx.strokeStyle = '#1f1009';
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 6, 448, 104, 104);
    ctx.strokeStyle = 'rgba(255,200,150,0.08)';
    ctx.strokeRect(x + 9, 451, 98, 98);
  }
}

function floor(ctx: CanvasRenderingContext2D, glow: number): void {
  const g = ctx.createLinearGradient(0, FLOOR_Y, 0, 720);
  g.addColorStop(0, '#2c180d');
  g.addColorStop(1, '#170c06');
  ctx.fillStyle = g;
  ctx.fillRect(0, FLOOR_Y, 1280, 720 - FLOOR_Y);
  ctx.strokeStyle = 'rgba(0,0,0,0.35)';
  ctx.lineWidth = 1.5;
  for (let i = -14; i <= 14; i++) {
    ctx.beginPath();
    ctx.moveTo(470 + i * 54, FLOOR_Y);
    ctx.lineTo(470 + i * 54 * 2.3, 720);
    ctx.stroke();
  }
  for (let k = 1; k < 6; k++) {
    const y = FLOOR_Y + 145 * (k / 6) ** 1.5;
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.fillRect(0, y, 1280, 1.5);
  }
  const spot = ctx.createRadialGradient(510, 640, 10, 510, 640, 330);
  spot.addColorStop(0, `rgba(255,196,120,${0.12 + 0.12 * glow})`);
  spot.addColorStop(1, 'rgba(255,196,120,0)');
  ctx.fillStyle = spot;
  ctx.fillRect(140, FLOOR_Y, 660, 145);
}

const BOTTLES = ['#c47a2a', '#3e7a3a', '#c8d8e0', '#5a2a14', '#2a4a8a', '#a8322a', '#d8b04a'] as const;

function bottle(ctx: CanvasRenderingContext2D, x: number, base: number, h: number, w: number, color: string): void {
  ctx.fillStyle = color;
  ctx.globalAlpha = color === '#c8d8e0' ? 0.55 : 0.92;
  ctx.fillRect(x, base - h * 0.62, w, h * 0.62);
  ctx.fillRect(x + w * 0.32, base - h, w * 0.36, h * 0.4);
  ctx.globalAlpha = 1;
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.fillRect(x + 2, base - h * 0.58, 2, h * 0.5);
  ctx.fillStyle = '#e8e2d0';
  ctx.fillRect(x + 1, base - h * 0.42, w - 2, h * 0.16);
}

function backBar(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#21110a';
  ctx.fillRect(0, 214, 176, 214);
  const m = ctx.createLinearGradient(0, 222, 170, 420);
  m.addColorStop(0, '#3c3f4c');
  m.addColorStop(0.5, '#2a2c36');
  m.addColorStop(1, '#3a3d4a');
  ctx.fillStyle = m;
  ctx.fillRect(8, 222, 160, 198);
  for (const [i, shelfY] of [306, 410].entries()) {
    ctx.fillStyle = '#7a4c2e';
    ctx.fillRect(0, shelfY, 176, 7);
    for (let k = 0; k < 7; k++) {
      const h = 38 + ((k * 37 + i * 11) % 22);
      bottle(ctx, 12 + k * 22, shelfY, h, 13 + (k % 2) * 3, BOTTLES[(k + i * 3) % BOTTLES.length] ?? '#c47a2a');
    }
  }
  ctx.fillStyle = '#5c321c';
  ctx.fillRect(0, 486, 132, 90);
  ctx.fillStyle = '#7e4a2a';
  ctx.fillRect(0, 480, 140, 10);
  ctx.fillStyle = '#c99a4a';
  ctx.fillRect(0, 548, 132, 4);
}

function jetFrame(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, flip: boolean): void {
  ctx.fillStyle = '#b8903a';
  ctx.fillRect(x - 4, y - 4, w + 8, h + 8);
  const sky = ctx.createLinearGradient(0, y, 0, y + h);
  sky.addColorStop(0, '#5a7fa8');
  sky.addColorStop(1, '#c9b48a');
  ctx.fillStyle = sky;
  ctx.fillRect(x, y, w, h);
  ctx.save();
  ctx.translate(x + w / 2, y + h / 2);
  ctx.scale(flip ? -w / 70 : w / 70, w / 70);
  ctx.fillStyle = '#1e2633';
  ctx.beginPath();
  ctx.moveTo(-28, 2);
  ctx.lineTo(24, -2);
  ctx.lineTo(30, 0);
  ctx.lineTo(22, 3);
  ctx.lineTo(4, 4);
  ctx.lineTo(-10, 14);
  ctx.lineTo(-16, 14);
  ctx.lineTo(-10, 4);
  ctx.lineTo(-22, 5);
  ctx.lineTo(-30, 12);
  ctx.lineTo(-33, 12);
  ctx.lineTo(-30, 2);
  ctx.lineTo(-34, -10);
  ctx.lineTo(-30, -10);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function pennant(ctx: CanvasRenderingContext2D, t: number): void {
  const sway = Math.sin(t * 1.3) * 2;
  ctx.fillStyle = '#1f2c55';
  ctx.beginPath();
  ctx.moveTo(268, 262);
  ctx.lineTo(366, 278 + sway);
  ctx.lineTo(268, 296);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#d8b04a';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#d8b04a';
  ctx.fillRect(264, 256, 4, 46);
  ctx.fillStyle = '#f2e6c0';
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const r = i % 2 === 0 ? 8 : 3.4;
    ctx.lineTo(292 + Math.cos(a) * r, 279 + Math.sin(a) * r);
  }
  ctx.fill();
  ctx.fillRect(278, 280, 9, 2);
  ctx.fillRect(297, 280, 9, 2);
}

function neonSign(ctx: CanvasRenderingContext2D, v: RoomView): void {
  const flicker = Math.floor(v.t * 7.3) % 41 === 0 ? 0.45 : 1;
  const x = 420;
  const y = 236;
  ctx.save();
  ctx.globalAlpha = flicker;
  for (const [lw, a] of [[12, 0.08], [7, 0.16], [4, 0.3]] as const) {
    text(ctx, v.neon, x, y, { size: 34, display: true, align: 'center', color: 'rgba(0,0,0,0)', stroke: `rgba(255,80,150,${a})`, strokeWidth: lw, letterSpacing: 3 });
  }
  text(ctx, v.neon, x, y, { size: 34, display: true, align: 'center', color: '#ffe0ee', stroke: '#ff4f9a', strokeWidth: 1.5, letterSpacing: 3 });
  ctx.strokeStyle = 'rgba(95,212,255,0.25)';
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(x - 170, y + 20);
  ctx.lineTo(x + 170, y + 20);
  ctx.stroke();
  ctx.strokeStyle = '#bff0ff';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
}

function stringLights(ctx: CanvasRenderingContext2D, v: RoomView): void {
  const pulse = (1 - v.beat) ** 2;
  ctx.strokeStyle = '#1a1010';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (let x = 0; x <= 790; x += 10) ctx.lineTo(x, 66 + 30 * Math.sin((x / 790) * Math.PI));
  ctx.stroke();
  for (let i = 0; i < 22; i++) {
    const x = 18 + i * 36;
    const y = 70 + 30 * Math.sin((x / 790) * Math.PI);
    const on = 0.55 + 0.25 * v.glow + (i % 2 === 0 ? 0.2 * pulse * v.glow : 0);
    ctx.fillStyle = `rgba(255,205,120,${0.16 * on})`;
    ctx.beginPath();
    ctx.arc(x, y, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = `rgba(255,${200 + Math.round(40 * on)},140,${0.6 + 0.4 * on})`;
    ctx.beginPath();
    ctx.arc(x, y, 3.6, 0, Math.PI * 2);
    ctx.fill();
  }
}

function lampShade(ctx: CanvasRenderingContext2D, glow: number): void {
  ctx.fillStyle = '#121212';
  ctx.fillRect(LAMP.x - 1, 56, 2, LAMP.y - 56);
  ctx.fillStyle = '#2f5a3a';
  ctx.beginPath();
  ctx.moveTo(LAMP.x - 16, LAMP.y);
  ctx.lineTo(LAMP.x + 16, LAMP.y);
  ctx.lineTo(LAMP.x + 40, LAMP.y + 30);
  ctx.lineTo(LAMP.x - 40, LAMP.y + 30);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  ctx.fillRect(LAMP.x - 12, LAMP.y + 4, 6, 22);
  ctx.fillStyle = `rgba(255,230,170,${0.7 + 0.3 * glow})`;
  ctx.fillRect(LAMP.x - 38, LAMP.y + 29, 76, 3);
}

/** Back of the scene: walls, back bar, decor, lights and floor. */
export function drawPianoRoom(ctx: CanvasRenderingContext2D, v: RoomView): void {
  wall(ctx);
  backBar(ctx);
  jetFrame(ctx, 200, 312, 64, 44, false);
  jetFrame(ctx, 612, 300, 70, 48, true);
  jetFrame(ctx, 700, 352, 50, 36, false);
  pennant(ctx, v.t);
  neonSign(ctx, v);
  stringLights(ctx, v);
  floor(ctx, v.glow);
  lampShade(ctx, v.glow);
}

/** The lamp's light cone over the piano and the people round it (drawn on top of them). */
export function drawLampLight(ctx: CanvasRenderingContext2D, glow: number): void {
  const g = ctx.createLinearGradient(0, LAMP.y + 30, 0, 660);
  g.addColorStop(0, `rgba(255,224,160,${0.14 + 0.1 * glow})`);
  g.addColorStop(1, 'rgba(255,224,160,0)');
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(LAMP.x - 38, LAMP.y + 31);
  ctx.lineTo(LAMP.x + 38, LAMP.y + 31);
  ctx.lineTo(LAMP.x + 200, 660);
  ctx.lineTo(LAMP.x - 230, 660);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}
