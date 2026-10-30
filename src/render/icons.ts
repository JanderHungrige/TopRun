import { TAU } from '../core/math';
import type { EquipmentId, SecondaryId } from '../data/types';
import { fillPoly } from './shapes';

/** Horizontal store drawings (nose pointing right) for the hangar; `s` = scale. */
export function drawWeaponIcon(ctx: CanvasRenderingContext2D, id: SecondaryId | 'gun' | 'gun2' | 'ammo' | 'incendiary' | 'he', x: number, y: number, s: number): void {
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
    case 'aim120': missile(ctx, 66, 3.5, '#eef0f2', '#4c5a7a', '#b9bfc6'); break;
    case 'jdam': jdam(ctx); break;
    case 'gun': gun(ctx); break;
    case 'gun2': twinGun(ctx); break;
    case 'ammo': ammoBelt(ctx, '#59604f', '#8c957c'); break;
    case 'incendiary': ammoBelt(ctx, '#b5371f', '#ff8a4a'); break;
    case 'he': bofors(ctx); break;
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

/** Uranium ammo (doc 43): a short belt of 30 mm rounds, brass cases with dark penetrator tips, linked. */
/** Five rounds on a link belt; `tip` / `shine`: the projectile (uranium dark, incendiary red, doc 45). */
function ammoBelt(ctx: CanvasRenderingContext2D, tip: string, shine: string): void {
  ctx.fillStyle = '#3a3f44';
  ctx.fillRect(-30, 4, 60, 4);
  for (let i = -2; i <= 2; i++) {
    const x = i * 12;
    ctx.beginPath();
    ctx.roundRect(x - 4.5, -4, 9, 18, 1.5);
    ctx.fillStyle = '#c8a24a';
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.45)';
    ctx.stroke();
    ctx.fillStyle = '#e6c873';
    ctx.fillRect(x - 3, -3, 2, 15);
    fillPoly(ctx, [x - 4, -4, x - 2.5, -14, x, -19, x + 2.5, -14, x + 4, -4], tip);
    fillPoly(ctx, [x - 1.5, -7, x, -17, x + 1, -7], shine);
  }
}

/** The Bofors 40 mm (doc 46): receiver, clip of shells on top, long barrel with a conical flash hider. */
function bofors(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#4d5560';
  ctx.fillRect(-30, -7, 26, 16);
  ctx.fillStyle = '#6b7480';
  ctx.fillRect(-4, -3, 30, 6);
  fillPoly(ctx, [26, -3, 36, -6, 36, 6, 26, 3], '#3b4148');
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = '#c8a24a';
    ctx.fillRect(-26 + i * 7, -17, 5, 10);
    fillPoly(ctx, [-26 + i * 7, -17, -23.5 + i * 7, -22, -21 + i * 7, -17], '#c0612e');
  }
  ctx.strokeStyle = 'rgba(0,0,0,0.45)';
  ctx.strokeRect(-30, -7, 26, 16);
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

/** 2,000 lb bomb with its guidance tail kit (doc 37). */
function jdam(ctx: CanvasRenderingContext2D): void {
  fillPoly(ctx, [-30, 0, -42, -13, -36, -13, -22, -4, -22, 4, -36, 13, -42, 13], '#4f5747');
  ctx.beginPath();
  ctx.ellipse(2, 0, 30, 10, 0, 0, TAU);
  ctx.fillStyle = '#6b7457';
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.5)';
  ctx.stroke();
  ctx.fillStyle = '#3c4237';
  ctx.fillRect(-26, -7, 10, 14); // tail kit
  fillPoly(ctx, [4, -10, 16, -14, 18, -14, 12, -9], '#59634a');
  fillPoly(ctx, [4, 10, 16, 14, 18, 14, 12, 9], '#59634a');
  ctx.fillStyle = '#d6b84a';
  ctx.fillRect(18, -8, 3, 16);
}

/** The second gun (doc 37): two gun packs, one above the other. */
function twinGun(ctx: CanvasRenderingContext2D): void {
  for (const dy of [-9, 9]) {
    ctx.save();
    ctx.translate(0, dy);
    ctx.scale(1, 0.7);
    gun(ctx);
    ctx.restore();
  }
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
  radar: (ctx) => {
    ctx.strokeStyle = '#5be37d';
    ctx.beginPath();
    ctx.arc(0, 0, 17, 0, TAU);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, 9, 0, TAU);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(13, -11);
    ctx.stroke();
    ctx.fillStyle = '#ffc83d';
    ctx.fillRect(-9, -12, 4, 4);
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
