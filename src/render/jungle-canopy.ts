import { TAU } from '../core/math';
import { createRng, type Rng } from '../core/rng';
import type { TerrainStyle, TheaterPalette } from '../data/theaters';
import type { JungleFeature } from './jungle-floor';

// Over the jungle floor (doc 81): what each jungle theater scatters per row, and the canopy overhead — big leaf crowns at
// the edges drifting past faster than the floor, half-transparent so the fight stays readable, mist, fireflies, and
// rain over the swamp. Playfield-local (640 × 720).

const W = 640;
const H = 720;

type Add = (type: JungleFeature, r: number) => void;

/** One row of the floor's features for a jungle theater. */
export function jungleRow(style: TerrainStyle, add: Add, r: Rng): void {
  switch (style) {
    case 'clearing':
      if (r.chance(0.35)) add('mud', r.range(20, 48));
      if (r.chance(0.25)) add('fern', r.range(10, 18));
      if (r.chance(0.12)) add('crate', r.range(9, 14));
      if (r.chance(0.2)) add('tree', r.range(34, 60));
      return;
    case 'rainforest':
      if (r.chance(0.7)) add('tree', r.range(36, 70));
      if (r.chance(0.5)) add('fern', r.range(10, 22));
      if (r.chance(0.18)) add('log', r.range(26, 48));
      if (r.chance(0.12)) add('pool', r.range(24, 44));
      return;
    case 'swamp':
      if (r.chance(0.45)) add('pool', r.range(30, 70));
      if (r.chance(0.4)) add('root', r.range(18, 34));
      if (r.chance(0.3)) add('mud', r.range(24, 50));
      if (r.chance(0.2)) add('tree', r.range(30, 50));
      return;
    case 'ruins':
      if (r.chance(0.35)) add('pillar', r.range(12, 26));
      if (r.chance(0.3)) add('tree', r.range(34, 60));
      if (r.chance(0.3)) add('fern', r.range(10, 18));
      if (r.chance(0.08)) add('pool', r.range(20, 36));
      return;
    case 'hive':
      if (r.chance(0.45)) add('pod', r.range(14, 26));
      if (r.chance(0.25)) add('root', r.range(16, 30));
      if (r.chance(0.15)) add('mud', r.range(24, 40));
      return;
    default:
      return;
  }
}

interface Crown { x: number; y: number; r: number; seed: number }
interface Fly { x: number; y: number; phase: number }

/** The canopy and the air under it, drawn over everything on the floor. */
export class JungleCanopy {
  private crowns: Crown[] = [];
  private readonly flies: Fly[];
  private time = 0;
  /** The y of the newest row of crowns. */
  private top = H;
  private readonly rng: Rng;

  constructor(private readonly style: TerrainStyle, private readonly p: TheaterPalette, seed: number) {
    this.rng = createRng(seed);
    while (this.top > -200) this.spawn((this.top -= 120));
    this.flies = Array.from({ length: style === 'hive' ? 0 : 14 }, (_, i) => ({ x: this.rng.range(0, W), y: this.rng.range(0, H), phase: i }));
  }

  /** A crown hangs in from the left or the right edge, now and then one across the middle. */
  private spawn(y: number): void {
    const edge = this.rng.chance(0.5) ? this.rng.range(-60, 40) : this.rng.range(W - 40, W + 60);
    const x = this.rng.chance(0.12) ? this.rng.range(140, W - 140) : edge;
    this.crowns.push({ x, y, r: this.rng.range(60, 110), seed: Math.floor(this.rng.next() * 1e6) });
  }

  update(dt: number, dy: number): void {
    this.time += dt;
    for (const c of this.crowns) c.y += dy * 1.6;
    this.top += dy * 1.6;
    this.crowns = this.crowns.filter((c) => c.y - c.r < H + 40);
    while (this.top > -200) this.spawn((this.top -= 120));
    for (const f of this.flies) {
      f.y += dy * 0.4 + Math.sin(this.time + f.phase) * 8 * dt;
      f.x += Math.cos(this.time * 0.7 + f.phase) * 12 * dt;
      if (f.y > H) f.y -= H;
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    if (this.style === 'swamp' || this.style === 'rainforest') this.mist(ctx);
    for (const c of this.crowns) this.crown(ctx, c);
    for (const f of this.flies) {
      const on = Math.sin(this.time * 2 + f.phase * 1.7);
      if (on < 0.3) continue;
      ctx.fillStyle = `rgba(220,255,140,${(on * 0.8).toFixed(2)})`;
      ctx.fillRect(f.x, f.y, 2, 2);
    }
    if (this.style === 'swamp') this.rain(ctx);
  }

  private crown(ctx: CanvasRenderingContext2D, c: Crown): void {
    const rng = createRng(c.seed);
    ctx.globalAlpha = 0.55;
    for (const [k, color] of [[1, '#0c1e0c'], [0.75, this.p.landDark]] as const) {
      ctx.fillStyle = color;
      ctx.beginPath();
      for (let i = 0; i < 7; i++) {
        const a = (i / 7) * TAU + rng.next() * 0.4;
        const d = c.r * 0.45 * k;
        const sway = Math.sin(this.time * 0.6 + i + c.seed) * 2;
        ctx.moveTo(c.x + Math.cos(a) * d + sway + c.r * 0.5 * k, c.y + Math.sin(a) * d);
        ctx.arc(c.x + Math.cos(a) * d + sway, c.y + Math.sin(a) * d, c.r * 0.5 * k, 0, TAU);
      }
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  private mist(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = this.p.cloud;
    for (let i = 0; i < 3; i++) {
      const y = ((this.time * 12 + i * 260) % (H + 200)) - 100;
      ctx.beginPath();
      ctx.ellipse(W / 2 + Math.sin(this.time * 0.2 + i) * 120, y, 260, 60, 0, 0, TAU);
      ctx.fill();
    }
  }

  private rain(ctx: CanvasRenderingContext2D): void {
    ctx.strokeStyle = 'rgba(200,230,215,0.16)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < 50; i++) {
      const x = (i * 97 + this.time * 120) % (W + 40) - 20;
      const y = (i * 151 + this.time * 700) % (H + 40) - 20;
      ctx.moveTo(x, y);
      ctx.lineTo(x - 3, y + 14);
    }
    ctx.stroke();
  }
}
