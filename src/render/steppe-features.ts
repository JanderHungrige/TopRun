import { TAU } from '../core/math';
import { createRng } from '../core/rng';
import type { TheaterPalette } from '../data/theaters';
import type { SteppeFeature } from './steppe-floor';

// The alien steppe's features (doc 105), top-down: tussocks swaying in the wind, boulders, the bleached bones of a giant
// beast, alien scorch marks, dirt tracks, salt pools, dry gullies, burial mounds, standing stones and henges, alien pylons
// and glass shards. The floors and the rows that place these are in steppe-floor.ts.

function shadow(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number): void {
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.ellipse(x + rx * 0.2, y + ry * 0.25, rx, ry, 0, 0, TAU);
  ctx.fill();
}

function tussock(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, seed: number, t: number, p: TheaterPalette): void {
  const rng = createRng(seed);
  ctx.fillStyle = 'rgba(60,40,10,0.25)';
  ctx.beginPath();
  ctx.ellipse(x, y, r * 0.6, r * 0.45, 0, 0, TAU);
  ctx.fill();
  const sway = Math.sin(t * 1.6 + x * 0.02) * r * 0.15;
  ctx.lineWidth = 1.4;
  for (let i = 0; i < 14; i++) {
    const a = rng.next() * TAU;
    const l = r * (0.6 + rng.next() * 0.5);
    ctx.strokeStyle = i % 3 === 0 ? p.landDark : i % 3 === 1 ? p.detail : '#f0dc98';
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + Math.cos(a) * l * 0.5, y + Math.sin(a) * l * 0.5, x + Math.cos(a) * l + sway, y + Math.sin(a) * l * 0.8);
    ctx.stroke();
  }
}

function boulder(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, seed: number): void {
  const rng = createRng(seed);
  shadow(ctx, x, y, r, r * 0.8);
  ctx.beginPath();
  for (let i = 0; i <= 9; i++) {
    const a = (i / 9) * TAU;
    const k = 0.8 + rng.next() * 0.3;
    ctx.lineTo(x + Math.cos(a) * r * k, y + Math.sin(a) * r * k * 0.85);
  }
  ctx.fillStyle = '#8a8478';
  ctx.fill();
  ctx.fillStyle = '#b4ae9e';
  ctx.beginPath();
  ctx.ellipse(x - r * 0.25, y - r * 0.25, r * 0.45, r * 0.32, -0.4, 0, TAU);
  ctx.fill();
}

function bones(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, seed: number): void {
  const rng = createRng(seed);
  const a = rng.next() * TAU;
  const dx = Math.cos(a);
  const dy = Math.sin(a);
  ctx.strokeStyle = '#ece4cc';
  ctx.lineCap = 'round';
  ctx.lineWidth = 3;
  ctx.beginPath(); // the spine
  ctx.moveTo(x - dx * r, y - dy * r);
  ctx.lineTo(x + dx * r, y + dy * r);
  ctx.stroke();
  ctx.lineWidth = 2;
  for (let k = -3; k <= 3; k++) { // the ribs
    const cx = x + dx * k * r * 0.18;
    const cy = y + dy * k * r * 0.18;
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.quadraticCurveTo(cx - dy * s * r * 0.4, cy + dx * s * r * 0.4, cx - dy * s * r * 0.45 + dx * r * 0.15, cy + dx * s * r * 0.45 + dy * r * 0.15);
      ctx.stroke();
    }
  }
  ctx.fillStyle = '#f4ecd4'; // the skull
  ctx.beginPath();
  ctx.ellipse(x + dx * r * 1.15, y + dy * r * 1.15, r * 0.22, r * 0.16, a, 0, TAU);
  ctx.fill();
}

function scorch(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, seed: number): void {
  const rng = createRng(seed);
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, 'rgba(20,10,20,0.75)');
  g.addColorStop(0.6, 'rgba(40,20,30,0.4)');
  g.addColorStop(1, 'rgba(40,20,30,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = 'rgba(20,10,20,0.45)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 8; i++) {
    const a = rng.next() * TAU;
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(a) * r * 0.5, y + Math.sin(a) * r * 0.5);
    ctx.lineTo(x + Math.cos(a) * r * 1.3, y + Math.sin(a) * r * 1.3);
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(199,125,255,0.35)'; // the alien glass at its heart
  ctx.beginPath();
  ctx.arc(x, y, r * 0.18, 0, TAU);
  ctx.fill();
}

export function drawSteppeFeature(
  ctx: CanvasRenderingContext2D, type: SteppeFeature, x: number, y: number, r: number, seed: number, t: number, p: TheaterPalette,
): void {
  switch (type) {
    case 'tussock': return tussock(ctx, x, y, r, seed, t, p);
    case 'boulder': return boulder(ctx, x, y, r, seed);
    case 'bones': return bones(ctx, x, y, r, seed);
    case 'scorch': return scorch(ctx, x, y, r, seed);
    default: return drawSteppeLandmark(ctx, type, x, y, r, seed, t, p);
  }
}

/** The bigger shapes of the later theaters: tracks, pools, gullies, mounds, stones, pylons and shards. */
function drawSteppeLandmark(
  ctx: CanvasRenderingContext2D, type: Exclude<SteppeFeature, 'tussock' | 'boulder' | 'bones' | 'scorch'>, x: number, y: number,
  r: number, seed: number, t: number, p: TheaterPalette,
): void {
  const rng = createRng(seed);
  switch (type) {
    case 'trail':
      ctx.strokeStyle = 'rgba(120,80,40,0.35)';
      ctx.lineWidth = 22;
      ctx.beginPath();
      ctx.moveTo(x, y - r);
      ctx.bezierCurveTo(x + 60, y - r * 0.3, x - 60, y + r * 0.3, x + 10, y + r);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(80,50,20,0.3)';
      ctx.lineWidth = 3;
      for (const o of [-6, 6]) {
        ctx.beginPath();
        ctx.moveTo(x + o, y - r);
        ctx.bezierCurveTo(x + 60 + o, y - r * 0.3, x - 60 + o, y + r * 0.3, x + 10 + o, y + r);
        ctx.stroke();
      }
      return;
    case 'saltpool':
      ctx.fillStyle = '#f8f8f4';
      ctx.beginPath();
      ctx.ellipse(x, y, r * 1.12, r * 0.8, rng.next(), 0, TAU);
      ctx.fill();
      ctx.fillStyle = 'rgba(120,200,230,0.75)';
      ctx.beginPath();
      ctx.ellipse(x, y, r, r * 0.68, rng.next() * 0.4, 0, TAU);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.fillRect(x - r * 0.4, y - r * 0.2, r * 0.5, 2);
      return;
    case 'gully':
      ctx.strokeStyle = 'rgba(60,20,10,0.55)';
      ctx.lineWidth = r * 0.25;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(x - r, y - r * 0.4);
      ctx.quadraticCurveTo(x, y + r * 0.5 * (rng.next() - 0.5), x + r, y + r * 0.3);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255,190,140,0.2)';
      ctx.lineWidth = 2;
      ctx.stroke();
      return;
    case 'barrow':
      shadow(ctx, x, y, r, r * 0.8);
      ctx.fillStyle = p.landDark;
      ctx.beginPath();
      ctx.ellipse(x, y, r, r * 0.8, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,240,180,0.18)';
      ctx.beginPath();
      ctx.ellipse(x - r * 0.25, y - r * 0.22, r * 0.6, r * 0.45, 0, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = 'rgba(40,40,20,0.3)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(x, y, r * 1.15, r * 0.95, 0, 0, TAU);
      ctx.stroke();
      return;
    case 'menhir':
      stone(ctx, x, y, r);
      return;
    case 'henge':
      for (let k = 0; k < 9; k++) {
        const a = (k / 9) * TAU + rng.next() * 0.2;
        stone(ctx, x + Math.cos(a) * r, y + Math.sin(a) * r * 0.85, 6 + rng.next() * 3);
      }
      return;
    case 'pylon': {
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.fillRect(x, y - r * 0.2, r * 2.6, r * 0.5);
      ctx.fillStyle = '#2a2232';
      ctx.beginPath();
      for (let k = 0; k < 6; k++) ctx.lineTo(x + Math.cos((k / 6) * TAU) * r, y + Math.sin((k / 6) * TAU) * r * 0.86);
      ctx.fill();
      const glow = 0.5 + 0.5 * Math.sin(t * 3 + x);
      ctx.fillStyle = `rgba(199,125,255,${(0.5 + glow * 0.5).toFixed(2)})`;
      ctx.beginPath();
      ctx.arc(x, y, r * 0.4, 0, TAU);
      ctx.fill();
      return;
    }
    case 'shard':
      for (let k = 0; k < 3; k++) {
        const a = rng.next() * TAU;
        const l = r * (0.6 + rng.next() * 0.6);
        ctx.fillStyle = k === 0 ? '#3a2e48' : '#1e1828';
        ctx.beginPath();
        ctx.moveTo(x + Math.cos(a + 1.6) * 3, y + Math.sin(a + 1.6) * 3);
        ctx.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l);
        ctx.lineTo(x + Math.cos(a - 1.6) * 3, y + Math.sin(a - 1.6) * 3);
        ctx.fill();
      }
      ctx.fillStyle = 'rgba(230,200,255,0.6)';
      ctx.fillRect(x - 1, y - 1, 2, 2);
      return;
    default:
      throw new Error(`unhandled: ${type satisfies never}`);
  }
}

/** A standing stone and its long shadow. */
function stone(ctx: CanvasRenderingContext2D, x: number, y: number, r: number): void {
  ctx.fillStyle = 'rgba(0,0,0,0.28)';
  ctx.beginPath();
  ctx.ellipse(x + r * 1.6, y + r * 0.6, r * 1.8, r * 0.5, 0.3, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#7a786c';
  ctx.beginPath();
  ctx.ellipse(x, y, r * 0.8, r, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#a8a494';
  ctx.beginPath();
  ctx.ellipse(x - r * 0.2, y - r * 0.3, r * 0.4, r * 0.45, 0, 0, TAU);
  ctx.fill();
}
