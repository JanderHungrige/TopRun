import { TAU } from '../../core/math';
import { createRng, type Rng } from '../../core/rng';
import { THEATERS } from '../../data/theaters';
import { drawFeature, makeBaseTile, makeBlob, type Feature, type FeatureType } from '../terrain-art';

// Formation Flying (doc 14): the sea under the formation, scrolled and turned with the formation's track.

const PAL = THEATERS.pacific.palette;
/** World features repeat every TILE px in both directions. */
const TILE = 2600;
/** Radius around the pivot the sea must cover (the screen corners). */
const VIEW_R = 1000;
/** Low clouds sit between the jets and the sea: they slide by faster. */
const CLOUD_PARALLAX = 1.45;
/** The camera turns around this screen point (near the formation). */
export const PIVOT = { x: 600, y: 430 } as const;

interface Boat {
  x: number;
  y: number;
  rot: number;
  len: number;
  speed: number;
}

interface Cloud {
  x: number;
  y: number;
  puffs: readonly { dx: number; dy: number; r: number }[];
}

/** v moved by whole tiles to lie within half a tile of c. */
const near = (v: number, c: number): number => c + ((((v - c + TILE / 2) % TILE) + TILE) % TILE) - TILE / 2;

function feature(rng: Rng, type: FeatureType, r: number): Feature {
  return { type, x: rng.range(0, TILE), y: rng.range(0, TILE), r, rot: rng.range(0, TAU), blob: makeBlob(Math.floor(rng.next() * 1e9)) };
}

function drawBoat(ctx: CanvasRenderingContext2D, b: Boat): void {
  ctx.save();
  ctx.translate(b.x, b.y);
  ctx.rotate(b.rot);
  const l = b.len;
  const fade = ctx.createLinearGradient(0, l * 0.4, 0, l * 5);
  fade.addColorStop(0, 'rgba(255,255,255,0.6)');
  fade.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = fade;
  ctx.beginPath();
  ctx.moveTo(-l * 0.16, l * 0.45);
  ctx.lineTo(-l * 0.4, l * 3.2);
  ctx.lineTo(l * 0.4, l * 3.2);
  ctx.lineTo(l * 0.16, l * 0.45);
  ctx.fill();
  ctx.strokeStyle = fade;
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.moveTo(-l * 0.2, l * 0.4);
  ctx.lineTo(-l * 1.2, l * 5);
  ctx.moveTo(l * 0.2, l * 0.4);
  ctx.lineTo(l * 1.2, l * 5);
  ctx.stroke();
  ctx.fillStyle = '#f4f2ea';
  ctx.beginPath();
  ctx.moveTo(0, -l * 0.6);
  ctx.quadraticCurveTo(l * 0.24, -l * 0.2, l * 0.2, l * 0.5);
  ctx.lineTo(-l * 0.2, l * 0.5);
  ctx.quadraticCurveTo(-l * 0.24, -l * 0.2, 0, -l * 0.6);
  ctx.fill();
  ctx.fillStyle = '#6d7b88';
  ctx.fillRect(-l * 0.1, -l * 0.05, l * 0.2, l * 0.3);
  ctx.restore();
}

/** Sea, islands, reefs, whitecaps and boats in world space; low clouds above them. Visual only. */
export class FormationWorld {
  private readonly features: Feature[] = [];
  private readonly boats: Boat[] = [];
  private readonly clouds: Cloud[] = [];
  private pattern: CanvasPattern | null = null;
  private camX = 0;
  private camY = 0;
  private heading = 0;

  constructor(seed: number) {
    const rng = createRng(seed);
    for (let i = 0; i < 5; i++) this.features.push(feature(rng, 'island', rng.range(40, 95)));
    for (let i = 0; i < 7; i++) this.features.push(feature(rng, 'reef', rng.range(30, 80)));
    for (let i = 0; i < 70; i++) this.features.push(feature(rng, 'whitecap', rng.range(5, 13)));
    for (let i = 0; i < 9; i++) {
      this.boats.push({ x: rng.range(0, TILE), y: rng.range(0, TILE), rot: rng.range(0, TAU), len: rng.range(9, 14), speed: rng.range(6, 16) });
    }
    for (let i = 0; i < 10; i++) {
      const puffs = Array.from({ length: rng.int(5, 8) }, () => ({ dx: rng.range(-90, 90), dy: rng.range(-40, 40), r: rng.range(30, 62) }));
      this.clouds.push({ x: rng.range(0, TILE), y: rng.range(0, TILE), puffs });
    }
  }

  update(dt: number, heading: number, speed: number): void {
    this.heading = heading;
    this.camX += Math.sin(heading) * speed * dt;
    this.camY -= Math.cos(heading) * speed * dt;
    for (const b of this.boats) {
      b.x += Math.sin(b.rot) * b.speed * dt;
      b.y -= Math.cos(b.rot) * b.speed * dt;
    }
  }

  private begin(ctx: CanvasRenderingContext2D, k: number): void {
    ctx.save();
    ctx.translate(PIVOT.x, PIVOT.y);
    ctx.rotate(-this.heading);
    ctx.translate(-this.camX * k, -this.camY * k);
  }

  renderSea(ctx: CanvasRenderingContext2D): void {
    this.pattern ??= ctx.createPattern(makeBaseTile('ocean', PAL), 'repeat');
    this.begin(ctx, 1);
    ctx.fillStyle = this.pattern ?? PAL.sea;
    ctx.fillRect(this.camX - VIEW_R, this.camY - VIEW_R, VIEW_R * 2, VIEW_R * 2);
    for (const f of this.features) {
      const x = near(f.x, this.camX);
      const y = near(f.y, this.camY);
      if (Math.abs(x - this.camX) > VIEW_R + f.r || Math.abs(y - this.camY) > VIEW_R + f.r) continue;
      drawFeature(ctx, { ...f, x, y }, 'ocean', PAL);
    }
    for (const b of this.boats) drawBoat(ctx, { ...b, x: near(b.x, this.camX), y: near(b.y, this.camY) });
    ctx.restore();
  }

  renderClouds(ctx: CanvasRenderingContext2D): void {
    const cx = this.camX * CLOUD_PARALLAX;
    const cy = this.camY * CLOUD_PARALLAX;
    this.begin(ctx, CLOUD_PARALLAX);
    ctx.fillStyle = PAL.cloud;
    ctx.globalAlpha = 0.75;
    for (const c of this.clouds) {
      const x = near(c.x, cx);
      const y = near(c.y, cy);
      if (Math.abs(x - cx) > VIEW_R + 160 || Math.abs(y - cy) > VIEW_R + 160) continue;
      ctx.beginPath();
      for (const p of c.puffs) {
        ctx.moveTo(x + p.dx + p.r, y + p.dy);
        ctx.arc(x + p.dx, y + p.dy, p.r, 0, TAU);
      }
      ctx.fill();
    }
    ctx.restore();
  }

  /** Darker edges and a soft sun glare: depth over the flat sea. */
  renderVignette(ctx: CanvasRenderingContext2D): void {
    const g = ctx.createRadialGradient(640, 360, 260, 640, 360, 820);
    g.addColorStop(0, 'rgba(0,10,25,0)');
    g.addColorStop(1, 'rgba(0,10,25,0.42)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 1280, 720);
  }
}
