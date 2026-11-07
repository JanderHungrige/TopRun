import { TAU } from '../core/math';
import { createRng } from '../core/rng';
import type { TheaterPalette } from '../data/theaters';

// Under the sea (docs 68, 70): the seabed — the sand tile, coral heads, kelp, rocks, deep drop-offs, sunken wrecks and
// black smokers. The water over it lives in water.ts. Playfield-local coordinates.

const TILE = 256;

export type ReefFeature = 'coral' | 'kelp' | 'stone' | 'drop' | 'wreck' | 'vent';

const CORAL = ['#ff8a78', '#ffb84a', '#c87ae8', '#ff6fa8', '#f2e27a'] as const;

/** Sand with ripples and grit, seamless. */
export function makeReefTile(p: TheaterPalette): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = TILE;
  c.height = TILE;
  const g = c.getContext('2d');
  if (!g) return c;
  g.fillStyle = p.land;
  g.fillRect(0, 0, TILE, TILE);
  const rng = createRng(51);
  g.strokeStyle = 'rgba(120,95,55,0.22)';
  g.lineWidth = 2;
  for (let i = 0; i < 40; i++) {
    const x = rng.next() * TILE;
    const y = rng.next() * TILE;
    const w = 10 + rng.next() * 18;
    for (const [ox, oy] of [[0, 0], [-TILE, 0], [0, -TILE], [TILE, 0], [0, TILE]] as const) {
      g.beginPath();
      g.moveTo(x + ox - w, y + oy);
      g.bezierCurveTo(x + ox - w / 3, y + oy - 4, x + ox + w / 3, y + oy + 4, x + ox + w, y + oy);
      g.stroke();
    }
  }
  for (const [color, n, s] of [['rgba(0,0,0,0.07)', 500, 2], ['rgba(255,255,255,0.1)', 300, 1.5]] as const) {
    g.fillStyle = color;
    for (let i = 0; i < n; i++) g.fillRect(rng.next() * TILE, rng.next() * TILE, s, s);
  }
  return c;
}

/** A cluster of coral heads (and now and then a brain-coral dome or a fan) around (x, y). */
function coral(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, seed: number, t: number): void {
  const rng = createRng(seed);
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.beginPath();
  ctx.ellipse(x + 4, y + 5, r * 1.1, r * 0.8, 0, 0, TAU);
  ctx.fill();
  const heads = 3 + Math.floor(rng.next() * 4);
  for (let i = 0; i < heads; i++) {
    const a = rng.next() * TAU;
    const d = rng.next() * r * 0.7;
    const hr = r * (0.3 + rng.next() * 0.35);
    const color = CORAL[Math.floor(rng.next() * CORAL.length)] ?? '#ff8a78';
    const hx = x + Math.cos(a) * d;
    const hy = y + Math.sin(a) * d;
    if (i === 0 && rng.next() < 0.4) brain(ctx, hx, hy, hr * 1.3, color);
    else if (i === 1 && rng.next() < 0.5) fan(ctx, hx, hy, hr * 1.6, color, t + seed);
    else knob(ctx, hx, hy, hr, color);
  }
}

function knob(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string): void {
  ctx.fillStyle = 'rgba(40,20,40,0.35)';
  ctx.beginPath();
  ctx.arc(x, y, r * 1.08, 0, TAU);
  ctx.fill();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  for (let k = 0; k < 4; k++) ctx.fillRect(x - r * 0.5 + k * r * 0.3, y - r * 0.4 + (k % 2) * r * 0.3, 1.6, 1.6);
}

function brain(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string): void {
  knob(ctx, x, y, r, color);
  ctx.strokeStyle = 'rgba(60,30,30,0.35)';
  ctx.lineWidth = 1.2;
  for (let k = -2; k <= 2; k++) {
    ctx.beginPath();
    for (let s = -1; s <= 1; s += 0.25) {
      const px = x + s * r * 0.8;
      const py = y + k * r * 0.28 + Math.sin(s * 9 + k) * r * 0.08;
      if (s === -1) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
  }
}

/** A sea fan: thin branches from a foot, swaying a little. */
function fan(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string, t: number): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.4;
  const sway = Math.sin(t * 1.3) * 0.12;
  ctx.beginPath();
  for (let k = 0; k < 7; k++) {
    const a = -Math.PI / 2 + (k - 3) * 0.28 + sway;
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
  }
  ctx.stroke();
}

/** Kelp strands rooted at (x, y), leaning and swaying with the current; big stands carry leaf blades. */
function kelp(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, seed: number, t: number): void {
  const rng = createRng(seed);
  const n = 3 + Math.floor(rng.next() * 3);
  ctx.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const x0 = x + (rng.next() - 0.5) * r;
    const len = r * (1.6 + rng.next() * 1.4);
    const color = i % 2 ? '#3f7a3a' : '#5a8f3c';
    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(3, r * 0.16);
    ctx.beginPath();
    ctx.moveTo(x0, y);
    const pts: Array<[number, number]> = [];
    for (let k = 1; k <= 7; k++) {
      const px = x0 + Math.sin(t * 1.4 + k * 0.6 + i) * k * 1.6;
      const py = y - (len * k) / 7;
      pts.push([px, py]);
      ctx.lineTo(px, py);
    }
    ctx.stroke();
    if (r < 22) continue;
    ctx.fillStyle = color;
    pts.forEach(([px, py], k) => {
      const side = k % 2 ? 1 : -1;
      ctx.beginPath();
      ctx.ellipse(px + side * r * 0.16, py, r * 0.16, r * 0.06, side * 0.6, 0, TAU);
      ctx.fill();
    });
  }
}

function stone(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, seed: number): void {
  const rng = createRng(seed);
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.beginPath();
  ctx.ellipse(x + 3, y + 4, r, r * 0.8, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#4f5a52';
  ctx.beginPath();
  for (let k = 0; k < 9; k++) {
    const a = (k / 9) * TAU;
    const rr = r * (0.8 + rng.next() * 0.3);
    if (k === 0) ctx.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr * 0.85);
    else ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr * 0.85);
  }
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(140,200,150,0.3)';
  ctx.beginPath();
  ctx.ellipse(x - r * 0.25, y - r * 0.25, r * 0.45, r * 0.3, 0, 0, TAU);
  ctx.fill();
}

/** A sunken ship seen from above: a rusty hull lying at an angle, broken deck planks, a fallen mast. */
function wreck(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, seed: number): void {
  const rng = createRng(seed);
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rng.next() * Math.PI);
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.ellipse(5, 6, r * 0.32, r, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#6a4a36';
  ctx.beginPath();
  ctx.moveTo(0, -r);
  ctx.quadraticCurveTo(r * 0.34, -r * 0.5, r * 0.3, r * 0.7);
  ctx.lineTo(-r * 0.3, r * 0.7);
  ctx.quadraticCurveTo(-r * 0.34, -r * 0.5, 0, -r);
  ctx.fill();
  ctx.fillStyle = '#3a2a20';
  ctx.fillRect(-r * 0.22, -r * 0.5, r * 0.44, r * 1.1);
  ctx.fillStyle = 'rgba(160,110,70,0.5)';
  for (let k = -4; k <= 5; k++) if (rng.next() > 0.3) ctx.fillRect(-r * 0.22, k * r * 0.1, r * 0.44, r * 0.05);
  ctx.strokeStyle = '#4a3a2e';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(0, -r * 0.1);
  ctx.lineTo(r * 0.7, r * 0.2);
  ctx.stroke();
  ctx.fillStyle = 'rgba(120,170,120,0.35)';
  for (let k = 0; k < 5; k++) ctx.fillRect((rng.next() - 0.5) * r * 0.5, (rng.next() - 0.5) * r * 1.4, 3, 3);
  ctx.restore();
}

/** A black smoker: a dark chimney with a hot glowing mouth that flickers. */
function vent(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, t: number): void {
  ctx.fillStyle = '#16181c';
  ctx.beginPath();
  ctx.ellipse(x, y, r, r * 0.8, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#2a2c30';
  ctx.beginPath();
  ctx.ellipse(x - r * 0.2, y - r * 0.2, r * 0.6, r * 0.45, 0, 0, TAU);
  ctx.fill();
  const glow = 0.55 + 0.25 * Math.sin(t * 5);
  ctx.fillStyle = `rgba(255,120,40,${glow.toFixed(3)})`;
  ctx.beginPath();
  ctx.arc(x, y, r * 0.28, 0, TAU);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,220,140,0.8)';
  ctx.beginPath();
  ctx.arc(x, y, r * 0.1, 0, TAU);
  ctx.fill();
}

/** One seabed feature; `t` sways the kelp and the fans and flickers the vents. */
export function drawReefFeature(
  ctx: CanvasRenderingContext2D, type: ReefFeature, x: number, y: number, r: number, seed: number, t: number, p: TheaterPalette,
): void {
  switch (type) {
    case 'coral': coral(ctx, x, y, r, seed, t); return;
    case 'kelp': kelp(ctx, x, y, r, seed, t); return;
    case 'stone': stone(ctx, x, y, r, seed); return;
    case 'wreck': wreck(ctx, x, y, r, seed); return;
    case 'vent': vent(ctx, x, y, r, t + seed); return;
    case 'drop': {
      const g = ctx.createRadialGradient(x, y, r * 0.2, x, y, r);
      g.addColorStop(0, p.seaDeep);
      g.addColorStop(1, 'rgba(7,58,74,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(x, y, r, r * 0.8, 0, 0, TAU);
      ctx.fill();
      return;
    }
    default: throw new Error(`unhandled: ${type satisfies never}`);
  }
}
