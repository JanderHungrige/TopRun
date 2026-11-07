import { TAU } from '../core/math';
import { createRng, type Rng } from '../core/rng';
import type { TheaterPalette } from '../data/theaters';

// Under the sea (doc 68): the reef's seabed — the sand tile, coral heads, kelp, rocks and deep drop-offs — and the water
// itself: caustics on the sand, schools of reef fish, bubble strings rising from vents, slanted light rays from above and
// a blue-green tint over everything. Playfield-local coordinates (640 × 720).

const W = 640;
const H = 720;
const TILE = 256;

export type ReefFeature = 'coral' | 'kelp' | 'stone' | 'drop';

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

/** Kelp strands rooted at (x, y), leaning and swaying with the current. */
function kelp(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, seed: number, t: number): void {
  const rng = createRng(seed);
  const n = 3 + Math.floor(rng.next() * 3);
  ctx.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const x0 = x + (rng.next() - 0.5) * r;
    const len = r * (1.2 + rng.next());
    ctx.strokeStyle = i % 2 ? '#3f7a3a' : '#5a8f3c';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x0, y);
    for (let k = 1; k <= 6; k++) ctx.lineTo(x0 + Math.sin(t * 1.4 + k * 0.6 + i) * k * 1.4, y - (len * k) / 6);
    ctx.stroke();
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

/** One seabed feature; `t` sways the kelp and the fans. */
export function drawReefFeature(
  ctx: CanvasRenderingContext2D, type: ReefFeature, x: number, y: number, r: number, seed: number, t: number, p: TheaterPalette,
): void {
  switch (type) {
    case 'coral': coral(ctx, x, y, r, seed, t); return;
    case 'kelp': kelp(ctx, x, y, r, seed, t); return;
    case 'stone': stone(ctx, x, y, r, seed); return;
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

interface Fish { dx: number; dy: number; phase: number; color: string }
interface School { x: number; y: number; vx: number; fish: Fish[] }
interface Bubble { x: number; y: number; r: number; phase: number }

const FISH = ['#ffd84a', '#5fd0ff', '#ff8a3d', '#f2f2f2', '#9a7aff'] as const;

/** The living water over the reef: fish schools, bubble strings, caustics, light rays and the tint. */
export class Water {
  private time = 0;
  private schools: School[] = [];
  private bubbles: Bubble[] = [];
  private vents: Array<{ x: number; y: number }> = [];
  private readonly rng: Rng;

  constructor(seed: number) {
    this.rng = createRng(seed);
    for (let i = 0; i < 3; i++) this.vents.push({ x: this.rng.range(30, W - 30), y: this.rng.range(0, H) });
  }

  update(dt: number, scroll: number): void {
    this.time += dt;
    const r = this.rng;
    for (const v of this.vents) {
      v.y += scroll;
      if (r.chance(dt * 6)) this.bubbles.push({ x: v.x + r.range(-3, 3), y: v.y, r: r.range(1.5, 3.5), phase: r.range(0, TAU) });
    }
    this.vents = this.vents.filter((v) => v.y < H + 20);
    if (r.chance(dt * 0.4)) this.vents.push({ x: r.range(30, W - 30), y: -20 });
    for (const b of this.bubbles) {
      b.y += scroll - 110 * dt;
      b.x += Math.sin(this.time * 4 + b.phase) * 14 * dt;
    }
    this.bubbles = this.bubbles.filter((b) => b.y > -10);
    for (const s of this.schools) {
      s.x += s.vx * dt;
      s.y += scroll * 0.4;
    }
    this.schools = this.schools.filter((s) => s.x > -120 && s.x < W + 120 && s.y < H + 60);
    if (this.schools.length < 2 && r.chance(dt * 0.25)) this.spawnSchool();
  }

  private spawnSchool(): void {
    const r = this.rng;
    const left = r.chance(0.5);
    const color = FISH[r.int(0, FISH.length - 1)] ?? '#ffd84a';
    const fish = Array.from({ length: r.int(7, 13) }, () => ({ dx: r.range(-34, 34), dy: r.range(-22, 22), phase: r.range(0, TAU), color }));
    this.schools.push({ x: left ? -100 : W + 100, y: r.range(60, H - 160), vx: (left ? 1 : -1) * r.range(50, 80), fish });
  }

  /** Under the units: the water over the sand, caustics, the fish and the bubbles. */
  renderFloor(ctx: CanvasRenderingContext2D, distance: number): void {
    const deep = ctx.createLinearGradient(0, 0, 0, H);
    deep.addColorStop(0, 'rgba(20,150,180,0.26)');
    deep.addColorStop(1, 'rgba(8,84,130,0.42)');
    ctx.fillStyle = deep;
    ctx.fillRect(0, 0, W, H);
    this.caustics(ctx, distance);
    for (const s of this.schools) {
      const dir = Math.sign(s.vx);
      for (const f of s.fish) {
        const x = s.x + f.dx + Math.sin(this.time * 2 + f.phase) * 4;
        const y = s.y + f.dy + Math.cos(this.time * 1.6 + f.phase) * 3;
        ctx.fillStyle = f.color;
        ctx.beginPath();
        ctx.ellipse(x, y, 5, 2.4, 0, 0, TAU);
        ctx.moveTo(x - dir * 4, y);
        ctx.lineTo(x - dir * 9, y - 3);
        ctx.lineTo(x - dir * 9, y + 3);
        ctx.fill();
      }
    }
    ctx.strokeStyle = 'rgba(225,245,255,0.6)';
    ctx.lineWidth = 1;
    for (const b of this.bubbles) {
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, TAU);
      ctx.stroke();
    }
  }

  /** A faint moving net of brighter lines over the sand. */
  private caustics(ctx: CanvasRenderingContext2D, distance: number): void {
    ctx.strokeStyle = 'rgba(210,255,250,0.13)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let k = 0; k < 14; k++) {
      const y0 = ((k * 61 + distance) % (H + 60)) - 30;
      for (let x = 0; x <= W; x += 32) {
        const y = y0 + Math.sin(x * 0.03 + this.time * 1.2 + k) * 9;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
    }
    ctx.stroke();
  }

  /** Over everything: slanted light rays that sway and breathe, then the blue-green tint. */
  renderOverlay(ctx: CanvasRenderingContext2D): void {
    for (let i = 0; i < 5; i++) {
      const x = 40 + i * 140 + Math.sin(this.time * 0.3 + i * 1.7) * 30;
      const w = 40 + (i % 3) * 22;
      const a = 0.05 + 0.03 * Math.sin(this.time * 0.8 + i * 2.1);
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, `rgba(220,255,250,${a.toFixed(3)})`);
      g.addColorStop(1, 'rgba(220,255,250,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(x, -10);
      ctx.lineTo(x + w, -10);
      ctx.lineTo(x + w + 190, H);
      ctx.lineTo(x + 150, H);
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = 'rgba(10,110,130,0.08)';
    ctx.fillRect(0, 0, W, H);
    const edge = ctx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 0.75);
    edge.addColorStop(0, 'rgba(2,24,36,0)');
    edge.addColorStop(1, 'rgba(2,24,36,0.36)');
    ctx.fillStyle = edge;
    ctx.fillRect(0, 0, W, H);
  }
}
