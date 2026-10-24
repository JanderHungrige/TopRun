import { TAU } from '../core/math';
import { createRng, type Rng } from '../core/rng';
import type { TheaterDef } from '../data/theaters';
import { drawFeature, makeBaseTile, makeBlob, type Feature, type FeatureType } from './terrain-art';

const W = 640;
const H = 720;
const ROW = 80;

interface Cloud {
  x: number;
  y: number;
  puffs: Array<{ dx: number; dy: number; r: number }>;
}

/** Scrolling top-down terrain for one mission, in playfield-local coordinates (640×720). */
export class Terrain {
  private features: Feature[] = [];
  private clouds: Cloud[] = [];
  private tile: HTMLCanvasElement | null = null;
  private pattern: CanvasPattern | null = null;
  private distance = 0;
  private rowAcc = 0;
  private readonly rng: Rng;
  lightning = 0;

  constructor(readonly theater: TheaterDef, seed: number) {
    this.rng = createRng(seed);
    for (let y = -ROW; y < H; y += ROW) this.spawnRow(y);
    for (let i = 0; i < 4; i++) this.spawnCloud(this.rng.range(0, H));
  }

  get travelled(): number {
    return this.distance;
  }

  update(dt: number, speed: number): void {
    const dy = speed * dt;
    this.distance += dy;
    for (const f of this.features) f.y += dy;
    for (const c of this.clouds) c.y += dy * 1.7;
    this.features = this.features.filter((f) => f.y - f.r * 4 < H + 40);
    this.clouds = this.clouds.filter((c) => c.y < H + 160);
    this.rowAcc += dy;
    while (this.rowAcc >= ROW) {
      this.rowAcc -= ROW;
      this.spawnRow(-ROW);
    }
    if (this.rng.chance(dt * 0.35)) this.spawnCloud(-160);
    this.lightning = Math.max(0, this.lightning - dt * 3);
    if (this.theater.terrain === 'storm' && this.rng.chance(dt * 0.06)) this.lightning = 1;
  }

  /** Puts land under a ground unit on sea maps (island) — called when a ground unit spawns. */
  addIsland(x: number, y: number, r: number): void {
    if (this.theater.base !== 'sea') return;
    this.features.push(this.feature('island', x, y, r));
  }

  renderGround(ctx: CanvasRenderingContext2D): void {
    this.renderBase(ctx);
    if (this.theater.terrain === 'canyon') this.renderCanyon(ctx);
    const style = this.theater.terrain;
    for (const f of this.features) drawFeature(ctx, f, style, this.theater.palette);
  }

  renderSky(ctx: CanvasRenderingContext2D, t: number): void {
    // Each cloud is filled as one shape so overlapping puffs keep a single, even transparency.
    ctx.fillStyle = this.theater.palette.cloud;
    ctx.globalAlpha = 0.7;
    for (const c of this.clouds) {
      ctx.beginPath();
      for (const p of c.puffs) {
        ctx.moveTo(c.x + p.dx + p.r, c.y + p.dy);
        ctx.arc(c.x + p.dx, c.y + p.dy, p.r, 0, TAU);
      }
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    if (this.theater.terrain === 'storm') this.renderRain(ctx, t);
    if (this.lightning > 0) {
      ctx.fillStyle = `rgba(220,235,255,${this.lightning * 0.35})`;
      ctx.fillRect(0, 0, W, H);
    }
  }

  private renderBase(ctx: CanvasRenderingContext2D): void {
    if (!this.tile) {
      this.tile = makeBaseTile(this.theater.terrain, this.theater.palette);
      this.pattern = ctx.createPattern(this.tile, 'repeat');
    }
    const offset = this.distance % 256;
    if (this.pattern) {
      this.pattern.setTransform(new DOMMatrix().translateSelf(0, offset));
      ctx.fillStyle = this.pattern;
    } else {
      ctx.fillStyle = this.theater.palette.sea;
    }
    ctx.fillRect(0, 0, W, H);
  }

  private wallWidth(worldY: number, side: number): number {
    return 60 + 34 * Math.sin(worldY * 0.004 + side * 2) + 22 * Math.sin(worldY * 0.013 + side);
  }

  private renderCanyon(ctx: CanvasRenderingContext2D): void {
    const p = this.theater.palette;
    // River winding through the canyon floor.
    ctx.beginPath();
    for (let y = -20; y <= H + 20; y += 20) {
      const wy = this.distance - y;
      const x = W / 2 + 140 * Math.sin(wy * 0.0021) + 40 * Math.sin(wy * 0.0067);
      if (y === -20) ctx.moveTo(x - 22, y);
      else ctx.lineTo(x - 22, y);
    }
    for (let y = H + 20; y >= -20; y -= 20) {
      const wy = this.distance - y;
      ctx.lineTo(W / 2 + 140 * Math.sin(wy * 0.0021) + 40 * Math.sin(wy * 0.0067) + 22, y);
    }
    ctx.fillStyle = p.sea;
    ctx.fill();
    for (const side of [0, 1]) {
      ctx.beginPath();
      ctx.moveTo(side ? W : 0, -20);
      for (let y = -20; y <= H + 20; y += 24) {
        const w = this.wallWidth(this.distance - y, side);
        ctx.lineTo(side ? W - w : w, y);
      }
      ctx.lineTo(side ? W : 0, H + 20);
      ctx.closePath();
      ctx.fillStyle = p.landDark;
      ctx.fill();
      ctx.strokeStyle = p.detail;
      ctx.lineWidth = 3;
      ctx.stroke();
    }
  }

  private renderRain(ctx: CanvasRenderingContext2D, t: number): void {
    ctx.strokeStyle = 'rgba(200,215,230,0.18)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < 60; i++) {
      const x = (i * 97 + t * 260) % (W + 60) - 30;
      const y = (i * 151 + t * 900) % (H + 40) - 20;
      ctx.moveTo(x, y);
      ctx.lineTo(x - 6, y + 18);
    }
    ctx.stroke();
  }

  private feature(type: FeatureType, x: number, y: number, r: number): Feature {
    return { type, x, y, r, rot: this.rng.range(0, TAU), blob: makeBlob(Math.floor(this.rng.next() * 1e9)) };
  }

  private spawnRow(y: number): void {
    const r = this.rng;
    const add = (type: FeatureType, rad: number): void => {
      this.features.push(this.feature(type, r.range(-20, W + 20), y - r.range(0, ROW), rad));
    };
    switch (this.theater.terrain) {
      case 'ocean':
        if (r.chance(0.12)) add('island', r.range(30, 70));
        if (r.chance(0.18)) add('reef', r.range(30, 80));
        return;
      case 'desert':
        if (r.chance(0.45)) add('dune', r.range(40, 110));
        if (r.chance(0.18)) add('rock', r.range(10, 26));
        if (r.chance(0.05)) add('road', r.range(200, 400));
        if (r.chance(0.04)) add('oasis', r.range(18, 30));
        return;
      case 'ice':
        if (r.chance(0.55)) add('floe', r.range(16, 60));
        if (r.chance(0.08)) add('floe', r.range(80, 140));
        return;
      case 'canyon':
        if (r.chance(0.2)) add('mesa', r.range(26, 60));
        if (r.chance(0.25)) add('rock', r.range(8, 20));
        return;
      case 'storm':
        if (r.chance(0.5)) add('whitecap', r.range(8, 18));
        if (r.chance(0.06)) add('island', r.range(30, 60));
        return;
      default:
        throw new Error(`unhandled: ${this.theater.terrain satisfies never}`);
    }
  }

  private spawnCloud(y: number): void {
    const puffs = Array.from({ length: this.rng.int(4, 7) }, () => ({
      dx: this.rng.range(-60, 60), dy: this.rng.range(-26, 26), r: this.rng.range(22, 46),
    }));
    this.clouds.push({ x: this.rng.range(-40, W + 40), y, puffs });
  }
}
