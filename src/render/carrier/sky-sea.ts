import { TAU } from '../../core/math';
import type { TerrainStyle, TheaterPalette } from '../../data/theaters';
import { SEA_Y } from './geometry';
import { cachedGradient } from './pen';

/** Sky and sea behind the carrier (doc 04). Gradients are cached per context; clouds and waves are batched. */

const SKY: Readonly<Record<TerrainStyle, readonly [string, string, string]>> = {
  ocean: ['#3d7fc4', '#8cc0e6', '#f3dcb4'],
  desert: ['#4a86c0', '#a9c8e0', '#f5c98e'],
  ice: ['#6f93b8', '#c4d6e6', '#eef3f7'],
  canyon: ['#3f6fa8', '#d9a07a', '#f7b46a'],
  storm: ['#26323f', '#4b5a68', '#77818a'],
};

/** Cloud shade, body and sunlit top per style. */
const CLOUD = { fair: ['rgba(150,172,196,0.5)', 'rgba(255,255,255,0.8)', 'rgba(255,255,255,0.7)'], storm: ['rgba(48,56,66,0.75)', 'rgba(90,100,112,0.85)', 'rgba(128,138,148,0.55)'] } as const;

function skyFill(ctx: CanvasRenderingContext2D, style: TerrainStyle): CanvasGradient {
  return cachedGradient(ctx, `sky-${style}`, () => {
    const [top, mid, horizon] = SKY[style];
    const g = ctx.createLinearGradient(0, 0, 0, SEA_Y);
    g.addColorStop(0, top);
    g.addColorStop(0.6, mid);
    g.addColorStop(1, horizon);
    return g;
  });
}

function sunFill(ctx: CanvasRenderingContext2D): CanvasGradient {
  return cachedGradient(ctx, 'sky-sun', () => {
    const g = ctx.createRadialGradient(1040, 150, 10, 1040, 150, 220);
    g.addColorStop(0, 'rgba(255,250,220,0.95)');
    g.addColorStop(0.15, 'rgba(255,236,180,0.6)');
    g.addColorStop(1, 'rgba(255,236,180,0)');
    return g;
  });
}

function hazeFill(ctx: CanvasRenderingContext2D, style: TerrainStyle): CanvasGradient {
  return cachedGradient(ctx, `sky-haze-${style}`, () => {
    const g = ctx.createLinearGradient(0, SEA_Y - 46, 0, SEA_Y);
    g.addColorStop(0, 'rgba(255,255,255,0)');
    g.addColorStop(1, style === 'storm' ? 'rgba(150,160,170,0.45)' : 'rgba(255,250,240,0.5)');
    return g;
  });
}

function cloudPath(ctx: CanvasRenderingContext2D, camX: number, t: number, dx: number, dy: number, grow: number): void {
  ctx.beginPath();
  for (let i = 0; i < 7; i++) {
    const x = ((i * 380 - camX * 0.15 - t * 6) % 1700 + 1700) % 1700 - 200;
    const y = 80 + (i % 3) * 70;
    for (let k = 0; k < 5; k++) {
      const r = 26 + ((k + i) % 3) * 8 + grow;
      const cx = x + k * 34 + dx;
      const cy = y + Math.sin(k * 2 + i) * 10 + dy;
      ctx.moveTo(cx + r, cy);
      ctx.arc(cx, cy, r, 0, TAU);
    }
  }
}

function clouds(ctx: CanvasRenderingContext2D, style: TerrainStyle, camX: number, t: number): void {
  const [shade, body, lit] = style === 'storm' ? CLOUD.storm : CLOUD.fair;
  cloudPath(ctx, camX, t, 5, 8, -3);
  ctx.fillStyle = shade;
  ctx.fill();
  cloudPath(ctx, camX, t, 0, 0, 0);
  ctx.fillStyle = body;
  ctx.fill();
  cloudPath(ctx, camX, t, -6, -7, -11);
  ctx.fillStyle = lit;
  ctx.fill();
}

function cirrus(ctx: CanvasRenderingContext2D, camX: number, t: number): void {
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const x = ((i * 520 - camX * 0.05 - t * 3) % 2000 + 2000) % 2000 - 300;
    const y = 30 + ((i * 23) % 50);
    ctx.moveTo(x + 140, y);
    ctx.ellipse(x, y, 140, 2.6, -0.02, 0, TAU);
  }
  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  ctx.fill();
}

/** Distant escorts on the horizon: a destroyer and a smaller frigate further out. */
function escort(ctx: CanvasRenderingContext2D, x: number, s: number, color: string): void {
  const y = SEA_Y + 1;
  const P = (pts: readonly number[]): void => {
    for (let i = 0; i < pts.length; i += 2) ctx[i === 0 ? 'moveTo' : 'lineTo'](x + (pts[i] ?? 0) * s, y + (pts[i + 1] ?? 0) * s);
    ctx.closePath();
  };
  ctx.beginPath();
  P([0, -5, 124, -6, 112, 0, 8, 0]);
  P([30, -5, 36, -13, 72, -13, 76, -5]);
  P([50, -13, 53, -27, 55, -27, 58, -13]);
  P([80, -10, 95, -10, 95, -5, 80, -5]);
  P([100, -8, 110, -9, 110, -6, 100, -6]);
  ctx.fillStyle = color;
  ctx.fill();
}

export function drawSky(ctx: CanvasRenderingContext2D, style: TerrainStyle, camX: number, t: number): void {
  ctx.fillStyle = skyFill(ctx, style);
  ctx.fillRect(0, 0, 1280, SEA_Y);
  ctx.fillStyle = sunFill(ctx);
  ctx.fillRect(700, 0, 580, SEA_Y);
  if (style !== 'storm') cirrus(ctx, camX, t);
  clouds(ctx, style, camX, t);
  ctx.fillStyle = hazeFill(ctx, style);
  ctx.fillRect(0, SEA_Y - 46, 1280, 46);
  escort(ctx, ((300 - camX * 0.04) % 1900 + 1900) % 1900 - 200, 0.5, 'rgba(80,95,110,0.45)');
  escort(ctx, ((900 - camX * 0.08) % 1600 + 1600) % 1600 - 160, 1, 'rgba(70,85,100,0.7)');
}

const hash = (i: number): number => {
  const v = Math.sin(i * 12.9898) * 43758.5453;
  return v - Math.floor(v);
};

function waves(camX: number, t: number): Path2D {
  const path = new Path2D();
  for (let row = 0; row < 7; row++) {
    const y = SEA_Y + 12 + row * row * 5 + row * 6;
    const speed = 0.4 + row * 0.12;
    for (let i = 0; i < 18; i++) {
      const x = ((i * 90 + row * 37 - camX * speed + Math.sin(t + row) * 10) % 1400 + 1400) % 1400 - 60;
      path.moveTo(x, y);
      path.quadraticCurveTo(x + 14, y - 3, x + 28 + row * 3, y);
    }
  }
  return path;
}

/** Sun glitter in the reflection column under the sun. */
function glitter(ctx: CanvasRenderingContext2D, t: number): void {
  ctx.beginPath();
  for (let i = 0; i < 44; i++) {
    if (Math.sin(t * 4.6 + i * 2.3) < 0.15) continue;
    const row = i % 7;
    const y = SEA_Y + 3 + row * row * 1.8 + row * 3;
    const x = 1040 + (hash(i) - 0.5) * (50 + row * 40) + Math.sin(t * 1.7 + i) * 3;
    ctx.rect(x, y, 2.5 + row * 0.8, 1);
  }
  ctx.fillStyle = 'rgba(255,247,215,0.75)';
  ctx.fill();
}

export function drawSea(ctx: CanvasRenderingContext2D, p: TheaterPalette, camX: number, t: number): void {
  ctx.fillStyle = cachedGradient(ctx, `sea-${p.sea}-${p.seaDeep}`, () => {
    const g = ctx.createLinearGradient(0, SEA_Y, 0, 720);
    g.addColorStop(0, p.sea);
    g.addColorStop(1, p.seaDeep);
    return g;
  });
  ctx.fillRect(0, SEA_Y, 1280, 720 - SEA_Y);
  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  ctx.fillRect(0, SEA_Y, 1280, 1.2);
  const crest = waves(camX, t);
  ctx.lineWidth = 2;
  ctx.save();
  ctx.translate(0, 2.5);
  ctx.strokeStyle = 'rgba(0,18,36,0.16)';
  ctx.stroke(crest);
  ctx.restore();
  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  ctx.stroke(crest);
  glitter(ctx, t);
}
