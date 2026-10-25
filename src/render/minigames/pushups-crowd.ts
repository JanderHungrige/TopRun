import { lerp } from '../../core/math';
import { circle, ellipse } from '../shapes';
import type { PushupSetting } from './pushups-set';

// Three spectators behind the duel (doc 12): a coach with a whistle and two crew members. Front view.

type Extra = 'coach' | 'towel' | 'shades';

interface Fan {
  x: number;
  skin: string;
  hair: string;
  shirt: string;
  legs: string;
  extra: Extra;
  phase: number;
}

const LINE = 'rgba(28,16,10,0.55)';
const GYM: readonly Fan[] = [
  { x: 548, skin: '#c99068', hair: '#2a1d16', shirt: '#7d8794', legs: '#2c323b', extra: 'coach', phase: 0 },
  { x: 640, skin: '#f0c49e', hair: '#b5652f', shirt: '#e8c43a', legs: '#3b4a33', extra: 'towel', phase: 1.7 },
  { x: 732, skin: '#8d5a3b', hair: '#17110d', shirt: '#b8322c', legs: '#2f3d5c', extra: 'shades', phase: 3.1 },
];
const BEACH: readonly Fan[] = [
  { x: 548, skin: '#c99068', hair: '#2a1d16', shirt: '#e86d4d', legs: '#2f63ad', extra: 'coach', phase: 0 },
  { x: 640, skin: '#f0c49e', hair: '#b5652f', shirt: '#4fb3a8', legs: '#f2c94c', extra: 'towel', phase: 1.7 },
  { x: 732, skin: '#8d5a3b', hair: '#17110d', shirt: '#f4ede0', legs: '#c2342c', extra: 'shades', phase: 3.1 },
];

function arm(ctx: CanvasRenderingContext2D, f: Fan, side: 1 | -1, up: number): void {
  const sx = side * 19;
  const hx = side * lerp(25, 34, up);
  const hy = lerp(-74, -192, up);
  const ex = side * lerp(26, 40, up);
  const ey = lerp(-100, -160, up);
  ctx.lineCap = 'round';
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 11;
  ctx.beginPath();
  ctx.moveTo(sx, -126);
  ctx.lineTo(ex, ey);
  ctx.lineTo(hx, hy);
  ctx.stroke();
  ctx.strokeStyle = f.skin;
  ctx.lineWidth = 9;
  ctx.stroke();
  ctx.strokeStyle = f.shirt;
  ctx.lineWidth = 12;
  ctx.beginPath();
  ctx.moveTo(sx, -126);
  ctx.lineTo(lerp(sx, ex, 0.45), lerp(-126, ey, 0.45));
  ctx.stroke();
  circle(ctx, hx, hy, 6, f.skin);
}

function head(ctx: CanvasRenderingContext2D, f: Fan, cheer: number): void {
  circle(ctx, 0, -152, 17, f.skin);
  ctx.beginPath();
  ctx.arc(0, -155, 17.5, Math.PI * 1.05, Math.PI * 1.95);
  ctx.lineTo(13, -160);
  ctx.quadraticCurveTo(0, -166, -13, -160);
  ctx.closePath();
  ctx.fillStyle = f.hair;
  ctx.fill();
  if (f.extra === 'shades') {
    ctx.fillStyle = '#121418';
    ctx.fillRect(-12, -156, 10, 5);
    ctx.fillRect(2, -156, 10, 5);
    ctx.fillRect(-2, -155, 4, 2);
  } else {
    circle(ctx, -6, -153, 1.8, '#20140e');
    circle(ctx, 6, -153, 1.8, '#20140e');
  }
  if (cheer > 0.3) ellipse(ctx, 0, -142, 4.5, 3 + cheer * 2.5, '#5a2018');
  else {
    ctx.beginPath();
    ctx.arc(0, -146, 5, 0.2, Math.PI - 0.2);
    ctx.strokeStyle = '#5a2018';
    ctx.lineWidth = 1.6;
    ctx.stroke();
  }
  if (f.extra === 'coach') { // cap with a visor
    ctx.beginPath();
    ctx.arc(0, -160, 17, Math.PI, 0);
    ctx.closePath();
    ctx.fillStyle = '#1d2c4d';
    ctx.fill();
    ellipse(ctx, 0, -160, 22, 4, '#16223c');
    circle(ctx, 0, -168, 3, '#c9a23a');
  }
}

function extras(ctx: CanvasRenderingContext2D, f: Fan, cheer: number): void {
  switch (f.extra) {
    case 'coach': // whistle on a cord
      ctx.strokeStyle = '#e8e8e8';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(-8, -134);
      ctx.lineTo(0, -112);
      ctx.lineTo(8, -134);
      ctx.stroke();
      ctx.beginPath();
      ctx.roundRect(-4, -114, 10, 6, 2);
      ctx.fillStyle = cheer > 0.5 ? '#ffd84a' : '#c8ccd0';
      ctx.fill();
      return;
    case 'towel':
      ctx.fillStyle = '#f4f1ea';
      ctx.fillRect(8, -134, 12, 46);
      ctx.fillStyle = '#c2342c';
      ctx.fillRect(8, -96, 12, 3);
      return;
    case 'shades': return;
    default: throw new Error(`unhandled: ${f.extra satisfies never}`);
  }
}

function fan(ctx: CanvasRenderingContext2D, f: Fan, footY: number, cheer: number, t: number): void {
  const wave = cheer * (0.75 + 0.25 * Math.sin(t * 9 + f.phase));
  const bounce = -Math.abs(Math.sin(t * (cheer > 0.3 ? 8 : 1.6) + f.phase)) * (2 + cheer * 8);
  ctx.save();
  ctx.translate(f.x, footY + bounce);
  ctx.scale(0.86, 0.86);
  ellipse(ctx, 0, -bounce / 0.86, 30, 5, 'rgba(0,0,0,0.25)');
  ctx.fillStyle = f.legs;
  ctx.fillRect(-15, -72, 13, 70);
  ctx.fillRect(2, -72, 13, 70);
  ellipse(ctx, -9, -2, 10, 5, '#1c1f24');
  ellipse(ctx, 9, -2, 10, 5, '#1c1f24');
  arm(ctx, f, -1, wave);
  arm(ctx, f, 1, f.extra === 'coach' ? wave * 0.6 : wave);
  ctx.beginPath();
  ctx.roundRect(-21, -136, 42, 70, 9);
  ctx.fillStyle = f.shirt;
  ctx.fill();
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 1.2;
  ctx.stroke();
  extras(ctx, f, cheer);
  head(ctx, f, cheer);
  ctx.restore();
}

/** `cheer` 0 … 1 raises arms and bounces. */
export function drawPushupCrowd(ctx: CanvasRenderingContext2D, setting: PushupSetting, cheer: number, t: number): void {
  const fans = setting === 'gym' ? GYM : BEACH;
  const footY = setting === 'gym' ? 500 : 516;
  for (const f of fans) fan(ctx, f, footY, cheer, t);
}
