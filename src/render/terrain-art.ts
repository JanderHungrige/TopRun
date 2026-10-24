import { TAU } from '../core/math';
import { createRng } from '../core/rng';
import type { TerrainStyle, TheaterPalette } from '../data/theaters';

export type FeatureType = 'island' | 'reef' | 'floe' | 'dune' | 'rock' | 'road' | 'mesa' | 'whitecap' | 'oasis' | 'pad';

export interface Feature {
  type: FeatureType;
  x: number;
  y: number;
  r: number;
  rot: number;
  blob: number[]; // radius multipliers around the outline
}

export function makeBlob(seed: number, n = 14, jitter = 0.28): number[] {
  const rng = createRng(seed);
  return Array.from({ length: n }, () => 1 - jitter / 2 + rng.next() * jitter);
}

function blobPath(ctx: CanvasRenderingContext2D, f: Feature, scale: number): void {
  const n = f.blob.length;
  ctx.beginPath();
  for (let i = 0; i <= n; i++) {
    const k = i % n;
    const a = (k / n) * TAU + f.rot;
    const rr = f.r * scale * (f.blob[k] ?? 1);
    const x = f.x + Math.cos(a) * rr;
    const y = f.y + Math.sin(a) * rr * 0.86;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

function fillBlob(ctx: CanvasRenderingContext2D, f: Feature, scale: number, color: string): void {
  blobPath(ctx, f, scale);
  ctx.fillStyle = color;
  ctx.fill();
}

function drawIsland(ctx: CanvasRenderingContext2D, f: Feature, style: TerrainStyle, p: TheaterPalette): void {
  fillBlob(ctx, f, 1.18, 'rgba(160,230,240,0.25)'); // shallow water ring
  if (style === 'storm') {
    fillBlob(ctx, f, 1, p.landDark);
    fillBlob(ctx, f, 0.7, p.land);
    fillBlob(ctx, { ...f, r: f.r * 0.22 }, 1, p.accent);
    return;
  }
  if (style === 'ice') {
    fillBlob(ctx, f, 1, p.landDark);
    fillBlob(ctx, f, 0.9, p.land);
    return;
  }
  fillBlob(ctx, f, 1, p.land);
  fillBlob(ctx, f, 0.72, p.landDark);
  ctx.fillStyle = 'rgba(30,70,30,0.55)';
  for (let i = 0; i < 5; i++) {
    const a = f.rot + i * 1.3;
    ctx.beginPath();
    ctx.arc(f.x + Math.cos(a) * f.r * 0.4, f.y + Math.sin(a) * f.r * 0.3, 3 + (i % 3), 0, TAU);
    ctx.fill();
  }
}

function drawRoad(ctx: CanvasRenderingContext2D, f: Feature): void {
  ctx.save();
  ctx.translate(f.x, f.y);
  ctx.rotate(f.rot);
  ctx.fillStyle = 'rgba(80,70,60,0.55)';
  ctx.fillRect(-9, -f.r, 18, f.r * 2);
  ctx.strokeStyle = 'rgba(255,240,200,0.5)';
  ctx.setLineDash([10, 12]);
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, -f.r);
  ctx.lineTo(0, f.r);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
}

function drawMesa(ctx: CanvasRenderingContext2D, f: Feature, p: TheaterPalette): void {
  fillBlob(ctx, { ...f, x: f.x + f.r * 0.18, y: f.y + f.r * 0.15 }, 1, 'rgba(40,10,0,0.35)');
  fillBlob(ctx, f, 1, p.landDark);
  fillBlob(ctx, f, 0.86, p.detail);
  fillBlob(ctx, f, 0.7, p.land);
}

export function drawFeature(ctx: CanvasRenderingContext2D, f: Feature, style: TerrainStyle, p: TheaterPalette): void {
  switch (f.type) {
    case 'island': drawIsland(ctx, f, style, p); return;
    case 'pad': fillBlob(ctx, f, 1, 'rgba(120,120,110,0.55)'); return;
    case 'reef': fillBlob(ctx, f, 1, 'rgba(120,220,220,0.18)'); return;
    case 'floe':
      fillBlob(ctx, { ...f, x: f.x + 4, y: f.y + 5 }, 1, 'rgba(0,20,40,0.3)');
      fillBlob(ctx, f, 1, p.landDark);
      fillBlob(ctx, f, 0.88, p.land);
      return;
    case 'dune':
      fillBlob(ctx, f, 1, 'rgba(150,110,60,0.22)');
      fillBlob(ctx, { ...f, y: f.y - f.r * 0.15 }, 0.8, 'rgba(255,240,200,0.12)');
      return;
    case 'rock':
      fillBlob(ctx, { ...f, x: f.x + 3, y: f.y + 4 }, 1, 'rgba(0,0,0,0.25)');
      fillBlob(ctx, f, 1, p.landDark);
      fillBlob(ctx, { ...f, x: f.x - f.r * 0.15, y: f.y - f.r * 0.15 }, 0.55, p.detail);
      return;
    case 'road': drawRoad(ctx, f); return;
    case 'mesa': drawMesa(ctx, f, p); return;
    case 'whitecap':
      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.r, Math.PI * 1.1, Math.PI * 1.9);
      ctx.stroke();
      return;
    case 'oasis':
      fillBlob(ctx, f, 1.25, 'rgba(90,140,60,0.55)');
      fillBlob(ctx, f, 1, p.sea);
      return;
    default:
      throw new Error(`unhandled: ${f.type satisfies never}`);
  }
}

const TILE = 256;

function speckle(g: CanvasRenderingContext2D, seed: number, n: number, color: string, size: number): void {
  const rng = createRng(seed);
  g.fillStyle = color;
  for (let i = 0; i < n; i++) g.fillRect(rng.next() * TILE, rng.next() * TILE, size, size);
}

function waveMarks(g: CanvasRenderingContext2D, seed: number, n: number, color: string): void {
  const rng = createRng(seed);
  g.strokeStyle = color;
  g.lineWidth = 1.5;
  for (let i = 0; i < n; i++) {
    const x = rng.next() * TILE;
    const y = rng.next() * TILE;
    const w = 6 + rng.next() * 14;
    for (const [ox, oy] of [[0, 0], [-TILE, 0], [0, -TILE], [TILE, 0], [0, TILE]] as const) {
      g.beginPath();
      g.moveTo(x + ox - w, y + oy);
      g.quadraticCurveTo(x + ox, y + oy - 3, x + ox + w, y + oy);
      g.stroke();
    }
  }
}

/** A seamless 256×256 base texture for the theater, used as a scrolling pattern. */
export function makeBaseTile(style: TerrainStyle, p: TheaterPalette): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = TILE;
  c.height = TILE;
  const g = c.getContext('2d');
  if (!g) return c;
  const land = style === 'desert' || style === 'canyon';
  g.fillStyle = land ? p.land : p.sea;
  g.fillRect(0, 0, TILE, TILE);
  if (land) {
    speckle(g, 11, 500, 'rgba(0,0,0,0.06)', 2);
    speckle(g, 12, 300, 'rgba(255,255,255,0.07)', 2);
    waveMarks(g, 13, 26, style === 'canyon' ? 'rgba(90,30,10,0.18)' : 'rgba(150,110,60,0.25)');
  } else {
    speckle(g, 21, 260, 'rgba(0,0,0,0.05)', 3);
    waveMarks(g, 22, 34, 'rgba(255,255,255,0.13)');
    waveMarks(g, 23, 20, 'rgba(0,0,0,0.08)');
  }
  return c;
}
