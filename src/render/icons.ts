import { TAU } from '../core/math';
import type { EquipmentId, SecondaryId } from '../data/types';
import { fillPoly } from './shapes';

/** Horizontal store drawings (nose pointing right) for the hangar; `s` = scale. */
export function drawWeaponIcon(ctx: CanvasRenderingContext2D, id: SecondaryId | 'gun', x: number, y: number, s: number): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.lineWidth = 1 / s;
  switch (id) {
    case 'aim9': missile(ctx, 60, 3, '#e9edf0', '#3d6b3d', '#c8a24a'); break;
    case 'aim54': missile(ctx, 72, 4.5, '#f2f2f2', '#2f2f2f', '#d8d8d8'); break;
    case 'agm65': missile(ctx, 50, 5, '#d8d2a8', '#55602f', '#1f2a33'); break;
    case 'rockets': rocketPod(ctx); break;
    case 'mk82': bomb(ctx); break;
    case 'gun': gun(ctx); break;
    default: throw new Error(`unhandled: ${id satisfies never}`);
  }
  ctx.restore();
}

function missile(ctx: CanvasRenderingContext2D, len: number, r: number, body: string, band: string, nose: string): void {
  const h = len / 2;
  fillPoly(ctx, [-h + 4, -r, -h - 6, -r - 7, -h - 2, -r - 7, -h + 12, -r, -h + 12, r, -h - 2, r + 7, -h - 6, r + 7, -h + 4, r], '#9aa4ad');
  ctx.beginPath();
  ctx.roundRect(-h, -r, len - 6, r * 2, r);
  ctx.fillStyle = body;
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.4)';
  ctx.stroke();
  fillPoly(ctx, [h - 6, -r, h + 6, 0, h - 6, r], nose);
  ctx.fillStyle = band;
  ctx.fillRect(h - 18, -r, 4, r * 2);
  fillPoly(ctx, [h - 24, -r, h - 30, -r - 5, h - 34, -r - 5, h - 32, -r, h - 32, r, h - 34, r + 5, h - 30, r + 5, h - 24, r], '#9aa4ad');
}

function rocketPod(ctx: CanvasRenderingContext2D): void {
  ctx.beginPath();
  ctx.roundRect(-26, -9, 52, 18, 8);
  ctx.fillStyle = '#6f7a5a';
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.5)';
  ctx.stroke();
  fillPoly(ctx, [26, -9, 32, -6, 32, 6, 26, 9], '#59634a');
  ctx.fillStyle = '#1b1d1a';
  for (const dy of [-4, 0, 4]) {
    ctx.beginPath();
    ctx.arc(31, dy, 1.6, 0, TAU);
    ctx.fill();
  }
  ctx.fillStyle = '#c8b25a';
  ctx.fillRect(-14, -9, 3, 18);
}

function bomb(ctx: CanvasRenderingContext2D): void {
  fillPoly(ctx, [-26, 0, -34, -10, -30, -10, -18, -3, -18, 3, -30, 10, -34, 10], '#5c6450');
  ctx.beginPath();
  ctx.ellipse(0, 0, 24, 8, 0, 0, TAU);
  ctx.fillStyle = '#6b7457';
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.5)';
  ctx.stroke();
  ctx.fillStyle = '#d6b84a';
  ctx.fillRect(12, -7, 3, 14);
}

function gun(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#4a5058';
  ctx.fillRect(-24, -8, 22, 16);
  ctx.fillStyle = '#7d858f';
  for (const dy of [-5, -2, 1, 4]) ctx.fillRect(-2, dy, 34, 2);
  ctx.fillStyle = '#2b2f35';
  ctx.fillRect(28, -7, 4, 14);
}

type IconFn = (ctx: CanvasRenderingContext2D) => void;

const arcs = (ctx: CanvasRenderingContext2D, ...radii: number[]): void => {
  for (const r of radii) {
    ctx.beginPath();
    ctx.arc(-10, 10, r, -Math.PI / 2, 0);
    ctx.stroke();
  }
};

const EQUIPMENT_ICONS: Readonly<Record<EquipmentId, IconFn>> = {
  armor: (ctx) => {
    ctx.beginPath();
    ctx.moveTo(0, -18);
    ctx.lineTo(15, -11);
    ctx.quadraticCurveTo(15, 10, 0, 19);
    ctx.quadraticCurveTo(-15, 10, -15, -11);
    ctx.closePath();
    ctx.stroke();
  },
  engine: (ctx) => {
    ctx.beginPath();
    ctx.moveTo(0, -18);
    ctx.quadraticCurveTo(14, -2, 8, 12);
    ctx.quadraticCurveTo(0, 20, -8, 12);
    ctx.quadraticCurveTo(-14, -2, 0, -18);
    ctx.fillStyle = '#ff9d2e';
    ctx.fill();
  },
  flares: (ctx) => {
    ctx.strokeStyle = '#ffd36b';
    for (let i = 0; i < 6; i++) {
      const a = -Math.PI / 2 + (i - 2.5) * 0.35;
      ctx.beginPath();
      ctx.moveTo(0, 14);
      ctx.quadraticCurveTo(Math.cos(a) * 10, 0, Math.cos(a) * 18, Math.sin(a) * 18);
      ctx.stroke();
    }
  },
  ecm: (ctx) => arcs(ctx, 6, 12, 18),
  damageControl: (ctx) => {
    ctx.beginPath();
    ctx.moveTo(-14, 14);
    ctx.lineTo(8, -8);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(11, -11, 7, 0.6, TAU - 0.9);
    ctx.stroke();
  },
  magnet: (ctx) => {
    ctx.beginPath();
    ctx.arc(0, 0, 13, Math.PI, 0, false);
    ctx.moveTo(-13, 0);
    ctx.lineTo(-13, 14);
    ctx.moveTo(13, 0);
    ctx.lineTo(13, 14);
    ctx.lineWidth = 7;
    ctx.strokeStyle = '#ff4f4f';
    ctx.stroke();
  },
};

export function drawEquipmentIcon(ctx: CanvasRenderingContext2D, id: EquipmentId, x: number, y: number, size: number): void {
  ctx.save();
  ctx.translate(x, y);
  const s = size / 40;
  ctx.scale(s, s);
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#5fd4ff';
  ctx.fillStyle = '#5fd4ff';
  EQUIPMENT_ICONS[id](ctx);
  ctx.restore();
}
