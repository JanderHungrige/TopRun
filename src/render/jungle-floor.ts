import { TAU } from '../core/math';
import { createRng } from '../core/rng';
import type { TerrainStyle, TheaterPalette } from '../data/theaters';

// The jungle planet's floor (doc 81), seen from above as the mechs walk it: a seamless base tile per theater — red earth,
// dark moss, black swamp water, flagstones under grass, the hive's chitin — and the things on it: tree crowns, ferns,
// mud, pools with lily pads, fallen logs, broken pillars, egg pods, supply crates and mangrove roots. Playfield-local.

const TILE = 256;

export type JungleFeature = 'tree' | 'fern' | 'mud' | 'pool' | 'log' | 'pillar' | 'pod' | 'crate' | 'root';

function speckle(g: CanvasRenderingContext2D, seed: number, n: number, color: string, size: number): void {
  const rng = createRng(seed);
  g.fillStyle = color;
  for (let i = 0; i < n; i++) g.fillRect(rng.next() * TILE, rng.next() * TILE, size, size);
}

/** Something drawn at (x, y) and at its wrapped copies, so the tile stays seamless. */
function wrapped(draw: (x: number, y: number) => void, x: number, y: number): void {
  for (const [ox, oy] of [[0, 0], [-TILE, 0], [0, -TILE], [TILE, 0], [0, TILE]] as const) draw(x + ox, y + oy);
}

function tracks(g: CanvasRenderingContext2D, p: TheaterPalette): void {
  g.strokeStyle = 'rgba(60,30,15,0.35)';
  g.lineWidth = 5;
  for (const x of [80, 104, 176, 200]) {
    g.beginPath();
    for (let y = 0; y <= TILE; y += 16) g.lineTo(x + Math.sin((y / TILE) * TAU) * 10, y);
    g.stroke();
  }
  speckle(g, 61, 160, p.landDark, 3);
  speckle(g, 62, 90, 'rgba(120,170,60,0.55)', 4);
}

function flagstones(g: CanvasRenderingContext2D, p: TheaterPalette): void {
  const rng = createRng(63);
  for (let y = 0; y < TILE; y += 32) {
    for (let x = (y / 32) % 2 ? 16 : 0; x < TILE; x += 32) {
      if (rng.next() < 0.35) continue; // grass has taken this one
      g.fillStyle = rng.next() < 0.5 ? p.land : p.landDark;
      g.fillRect(x + 2, y + 2, 28, 28);
      g.fillStyle = 'rgba(255,255,255,0.08)';
      g.fillRect(x + 2, y + 2, 28, 3);
    }
  }
  speckle(g, 64, 140, 'rgba(90,140,50,0.5)', 3);
}

function veins(g: CanvasRenderingContext2D, p: TheaterPalette): void {
  const rng = createRng(65);
  g.strokeStyle = p.detail;
  g.globalAlpha = 0.35;
  g.lineWidth = 2;
  for (let i = 0; i < 14; i++) {
    const x = rng.next() * TILE;
    const y = rng.next() * TILE;
    const a = rng.next() * TAU;
    wrapped((cx, cy) => {
      g.beginPath();
      g.moveTo(cx, cy);
      g.quadraticCurveTo(cx + Math.cos(a) * 30, cy + Math.sin(a + 1) * 30, cx + Math.cos(a) * 60, cy + Math.sin(a) * 60);
      g.stroke();
    }, x, y);
  }
  g.globalAlpha = 1;
  speckle(g, 66, 120, 'rgba(0,0,0,0.25)', 4);
  speckle(g, 67, 40, 'rgba(255,120,210,0.35)', 2);
}

/** A seamless 256 × 256 floor for a jungle theater. */
export function makeJungleTile(style: TerrainStyle, p: TheaterPalette): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = TILE;
  c.height = TILE;
  const g = c.getContext('2d');
  if (!g) return c;
  g.fillStyle = style === 'swamp' || style === 'ruins' ? p.sea : p.land;
  g.fillRect(0, 0, TILE, TILE);
  switch (style) {
    case 'clearing': tracks(g, p); break;
    case 'rainforest':
      speckle(g, 71, 600, 'rgba(0,0,0,0.12)', 3);
      speckle(g, 72, 260, p.detail, 2);
      speckle(g, 73, 90, 'rgba(160,110,50,0.4)', 4); // leaf litter
      break;
    case 'swamp':
      speckle(g, 74, 200, 'rgba(110,150,70,0.35)', 6); // algae
      speckle(g, 75, 300, 'rgba(255,255,255,0.05)', 2);
      break;
    case 'ruins': flagstones(g, p); break;
    case 'hive': veins(g, p); break;
    default: speckle(g, 76, 400, 'rgba(0,0,0,0.1)', 3);
  }
  return c;
}

function shadow(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number): void {
  ctx.fillStyle = 'rgba(0,0,0,0.28)';
  ctx.beginPath();
  ctx.ellipse(x + rx * 0.18, y + ry * 0.22, rx, ry, 0, 0, TAU);
  ctx.fill();
}

/** A tree crown from above: a clump of leafy lobes, darker under, lit from the upper left; now and then a palm. */
function tree(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, seed: number, t: number, p: TheaterPalette): void {
  const rng = createRng(seed);
  shadow(ctx, x, y, r * 1.05, r * 0.95);
  if (rng.next() < 0.3) return palm(ctx, x, y, r, seed, t);
  const lobes = 6 + Math.floor(rng.next() * 4);
  const sway = Math.sin(t * 0.8 + seed) * 1.5;
  for (const [k, color] of [[1, p.landDark], [0.78, p.land], [0.5, p.detail]] as const) {
    ctx.fillStyle = color;
    for (let i = 0; i < lobes; i++) {
      const a = (i / lobes) * TAU + seed;
      const d = r * 0.45 * k;
      ctx.beginPath();
      ctx.arc(x + Math.cos(a) * d - (1 - k) * r * 0.25 + sway * k, y + Math.sin(a) * d - (1 - k) * r * 0.25, r * 0.5 * k + 2, 0, TAU);
      ctx.fill();
    }
  }
}

function palm(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, seed: number, t: number): void {
  const fronds = 7;
  ctx.lineCap = 'round';
  for (let i = 0; i < fronds; i++) {
    const a = (i / fronds) * TAU + seed + Math.sin(t * 0.7 + i) * 0.05;
    const ex = x + Math.cos(a) * r;
    const ey = y + Math.sin(a) * r;
    ctx.strokeStyle = '#2e5a1e';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + Math.cos(a + 0.3) * r * 0.6, y + Math.sin(a + 0.3) * r * 0.6, ex, ey);
    ctx.stroke();
    ctx.strokeStyle = '#5c9a32';
    ctx.lineWidth = 3;
    ctx.stroke();
  }
  ctx.fillStyle = '#6a4a26';
  ctx.beginPath();
  ctx.arc(x, y, 5, 0, TAU);
  ctx.fill();
}

function fern(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, seed: number, p: TheaterPalette): void {
  ctx.strokeStyle = p.detail;
  ctx.lineWidth = 2;
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * TAU + seed;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r * 0.85);
    ctx.stroke();
  }
}

function blob(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, seed: number, color: string, k = 1): void {
  const rng = createRng(seed);
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i <= 12; i++) {
    const a = (i / 12) * TAU;
    const rr = r * k * (0.8 + (i === 12 ? 0 : rng.next()) * 0.35);
    ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr * 0.8);
  }
  ctx.closePath();
  ctx.fill();
}

function pool(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, seed: number, t: number): void {
  blob(ctx, x, y, r, seed, 'rgba(60,40,20,0.6)', 1.12);
  blob(ctx, x, y, r, seed, '#1d4a4a');
  ctx.fillStyle = 'rgba(200,255,240,0.18)';
  ctx.fillRect(x - r * 0.4 + Math.sin(t + seed) * 3, y - r * 0.3, r * 0.5, 2);
  const rng = createRng(seed + 1);
  for (let i = 0; i < 3; i++) {
    const lx = x + (rng.next() - 0.5) * r;
    const ly = y + (rng.next() - 0.5) * r * 0.7;
    ctx.fillStyle = '#4e9a3a';
    ctx.beginPath();
    ctx.arc(lx, ly, 5, 0.4, TAU);
    ctx.lineTo(lx, ly);
    ctx.fill();
  }
}

function log(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, seed: number): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(seed % 3);
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.fillRect(-r + 4, -6, r * 2, 14);
  ctx.fillStyle = '#5a3a1e';
  ctx.fillRect(-r, -9, r * 2, 14);
  ctx.fillStyle = '#7a5230';
  ctx.fillRect(-r, -9, r * 2, 4);
  ctx.fillStyle = '#c8a070';
  ctx.beginPath();
  ctx.ellipse(r, -2, 4, 7, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#3a6a26';
  ctx.fillRect(-r * 0.3, -9, r * 0.4, 3); // moss
  ctx.restore();
}

function pillar(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, seed: number, p: TheaterPalette): void {
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fillRect(x - r + 5, y - r + 6, r * 2, r * 2);
  ctx.fillStyle = p.landDark;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
  ctx.fillStyle = p.land;
  ctx.fillRect(x - r + 3, y - r + 3, r * 2 - 6, r * 2 - 6);
  ctx.strokeStyle = 'rgba(0,0,0,0.35)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x - r * 0.4, y - r + 3);
  ctx.lineTo(x - r * 0.1, y + r * 0.2);
  ctx.lineTo(x + r * 0.3, y + r - 3);
  ctx.stroke();
  ctx.fillStyle = 'rgba(80,140,50,0.7)';
  ctx.fillRect(x - r + 3, y + r * 0.3, r * 0.8, r * 0.6 - 3);
  if (seed % 3 === 0) {
    ctx.fillStyle = p.accent;
    ctx.fillRect(x - 2, y - 2, 4, 4); // a carved eye catching the light
  }
}

function pods(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, seed: number, t: number, p: TheaterPalette): void {
  const rng = createRng(seed);
  for (let i = 0; i < 4; i++) {
    const px = x + (rng.next() - 0.5) * r * 1.4;
    const py = y + (rng.next() - 0.5) * r;
    const pr = r * (0.3 + rng.next() * 0.25);
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(px + 3, py + 4, pr, pr * 1.3, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = p.land;
    ctx.beginPath();
    ctx.ellipse(px, py, pr, pr * 1.3, 0, 0, TAU);
    ctx.fill();
    const glow = 0.4 + 0.3 * Math.sin(t * 2 + i + seed);
    ctx.fillStyle = `rgba(255,120,210,${glow.toFixed(2)})`;
    ctx.beginPath();
    ctx.ellipse(px - pr * 0.2, py - pr * 0.3, pr * 0.4, pr * 0.5, 0, 0, TAU);
    ctx.fill();
  }
}

function crate(ctx: CanvasRenderingContext2D, x: number, y: number, r: number): void {
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fillRect(x - r + 4, y - r + 5, r * 2, r * 2);
  ctx.fillStyle = '#6a5a2a';
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
  ctx.strokeStyle = '#3a301a';
  ctx.lineWidth = 2;
  ctx.strokeRect(x - r + 1, y - r + 1, r * 2 - 2, r * 2 - 2);
  ctx.beginPath();
  ctx.moveTo(x - r, y - r);
  ctx.lineTo(x + r, y + r);
  ctx.stroke();
}

function roots(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, seed: number): void {
  ctx.strokeStyle = '#4a3420';
  ctx.lineWidth = 4;
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * TAU + seed;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + Math.cos(a + 0.6) * r * 0.7, y + Math.sin(a + 0.6) * r * 0.7, x + Math.cos(a) * r, y + Math.sin(a) * r);
    ctx.stroke();
  }
  ctx.fillStyle = '#3a6a2a';
  ctx.beginPath();
  ctx.arc(x, y, r * 0.35, 0, TAU);
  ctx.fill();
}

/** One feature of the jungle floor; `t` sways the leaves and pulses the pods. */
export function drawJungleFeature(
  ctx: CanvasRenderingContext2D, type: JungleFeature, x: number, y: number, r: number, seed: number, t: number, p: TheaterPalette,
): void {
  switch (type) {
    case 'tree': tree(ctx, x, y, r, seed, t, p); return;
    case 'fern': fern(ctx, x, y, r, seed, p); return;
    case 'mud': blob(ctx, x, y, r, seed, 'rgba(70,40,20,0.55)'); blob(ctx, x, y, r, seed, 'rgba(40,24,12,0.4)', 0.6); return;
    case 'pool': pool(ctx, x, y, r, seed, t); return;
    case 'log': log(ctx, x, y, r, seed); return;
    case 'pillar': pillar(ctx, x, y, r, seed, p); return;
    case 'pod': pods(ctx, x, y, r, seed, t, p); return;
    case 'crate': crate(ctx, x, y, r); return;
    case 'root': roots(ctx, x, y, r, seed); return;
    default: throw new Error(`unhandled: ${type satisfies never}`);
  }
}
