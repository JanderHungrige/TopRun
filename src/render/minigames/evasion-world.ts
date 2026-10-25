import { TAU } from '../../core/math';
import { THEATERS, type TerrainStyle, type TheaterDef } from '../../data/theaters';
import { THEATER_IDS } from '../../data/types';
import { drawEnemy } from '../draw-enemies';
import { drawFeature, makeBaseTile, makeBlob, type Feature, type FeatureType } from '../terrain-art';

// Missile Evasion (doc 16): the endless top-down world under the jet — a campaign theatre's ground
// tile with features on a hash grid, drifting clouds with shadows, launch sites and enemy fighters.

/** The playfield below the shell's top bar; the camera centre sits at (cx, cy). */
export const FIELD = Object.freeze({ x: 0, y: 56, w: 1280, h: 664, cx: 640, cy: 388 });
const CELL = 300;
const CLOUD_CELL = 620;
/** Clouds float above the ground: they slide past this much faster than the ground. */
const CLOUD_DEPTH = 1.35;
const SHADOW = { dx: 46, dy: 64 };

/** Deterministic 0 … 1 per grid cell and salt. */
function hash2(x: number, y: number, salt: number): number {
  let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(salt + 1, 1442695041);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

type Spawn = readonly [FeatureType, number, number, number];
/** Per style: feature type, chance per cell, radius range. */
const SPAWNS: Readonly<Record<TerrainStyle, readonly Spawn[]>> = {
  ocean: [['island', 0.18, 40, 90], ['reef', 0.3, 30, 80], ['whitecap', 0.6, 8, 16], ['whitecap', 0.4, 8, 14]],
  desert: [['dune', 0.75, 50, 120], ['rock', 0.4, 10, 26], ['road', 0.07, 220, 420], ['oasis', 0.05, 18, 30]],
  ice: [['floe', 0.85, 18, 60], ['floe', 0.18, 80, 140]],
  canyon: [['mesa', 0.45, 30, 75], ['rock', 0.5, 8, 20], ['road', 0.05, 200, 380]],
  storm: [['whitecap', 0.8, 8, 18], ['whitecap', 0.6, 8, 14], ['island', 0.08, 30, 60]],
};

interface Cloud { x: number; y: number; puffs: Array<{ dx: number; dy: number; r: number }> }

export class EvasionWorld {
  readonly theater: TheaterDef;
  private pattern: CanvasPattern | null = null;
  private cells = new Map<string, Feature[]>();
  private clouds = new Map<string, Cloud | null>();

  constructor(private readonly seed: number) {
    this.theater = THEATERS[THEATER_IDS[seed % THEATER_IDS.length] ?? 'pacific'];
  }

  private cell(cx: number, cy: number): Feature[] {
    const key = `${cx},${cy}`;
    const hit = this.cells.get(key);
    if (hit) return hit;
    if (this.cells.size > 600) this.cells.clear();
    const list = SPAWNS[this.theater.terrain].flatMap(([type, chance, r0, r1], i): Feature[] => {
      const h = (k: number) => hash2(cx, cy, this.seed * 31 + i * 7 + k);
      if (h(0) >= chance) return [];
      const x = (cx + h(1)) * CELL;
      const y = (cy + h(2)) * CELL;
      return [{ type, x, y, r: r0 + (r1 - r0) * h(3), rot: h(4) * TAU, blob: makeBlob(Math.floor(h(5) * 1e9)) }];
    });
    this.cells.set(key, list);
    return list;
  }

  /** Ground in world coordinates; the context is already translated by the camera. */
  ground(ctx: CanvasRenderingContext2D, camX: number, camY: number): void {
    if (!this.pattern) this.pattern = ctx.createPattern(makeBaseTile(this.theater.terrain, this.theater.palette), 'repeat');
    ctx.fillStyle = this.pattern ?? this.theater.palette.sea;
    ctx.fillRect(camX - FIELD.cx - 20, camY - FIELD.cy - 20, FIELD.w + 40, 720 + 40);
    const x0 = Math.floor((camX - FIELD.cx - 160) / CELL);
    const x1 = Math.floor((camX + FIELD.cx + 160) / CELL);
    const y0 = Math.floor((camY - FIELD.cy - 160) / CELL);
    const y1 = Math.floor((camY + FIELD.h / 2 + 160) / CELL);
    for (let cy = y0; cy <= y1; cy++) {
      for (let cx = x0; cx <= x1; cx++) for (const f of this.cell(cx, cy)) drawFeature(ctx, f, this.theater.terrain, this.theater.palette);
    }
  }

  private cloud(cx: number, cy: number): Cloud | null {
    const key = `${cx},${cy}`;
    const hit = this.clouds.get(key);
    if (hit !== undefined) return hit;
    if (this.clouds.size > 300) this.clouds.clear();
    const h = (k: number) => hash2(cx, cy, this.seed * 17 + 900 + k);
    const n = 4 + Math.floor(h(1) * 4);
    const c = h(0) < 0.45 ? {
      x: (cx + 0.2 + h(2) * 0.6) * CLOUD_CELL, y: (cy + 0.2 + h(3) * 0.6) * CLOUD_CELL,
      puffs: Array.from({ length: n }, (_, i) => ({ dx: (h(10 + i) - 0.5) * 150, dy: (h(20 + i) - 0.5) * 70, r: 26 + h(30 + i) * 30 })),
    } : null;
    this.clouds.set(key, c);
    return c;
  }

  private eachCloud(camX: number, camY: number, fn: (c: Cloud, sx: number, sy: number) => void): void {
    const px = camX * CLOUD_DEPTH;
    const py = camY * CLOUD_DEPTH;
    const x0 = Math.floor((px - FIELD.cx - 300) / CLOUD_CELL);
    const y0 = Math.floor((py - FIELD.h / 2 - 300) / CLOUD_CELL);
    for (let cy = y0; cy <= y0 + 3; cy++) {
      for (let cx = x0; cx <= x0 + 4; cx++) {
        const c = this.cloud(cx, cy);
        if (c) fn(c, c.x - px + FIELD.cx, c.y - py + FIELD.cy);
      }
    }
  }

  private puffs(ctx: CanvasRenderingContext2D, c: Cloud, sx: number, sy: number): void {
    ctx.beginPath();
    for (const p of c.puffs) {
      ctx.moveTo(sx + p.dx + p.r, sy + p.dy);
      ctx.arc(sx + p.dx, sy + p.dy, p.r, 0, TAU);
    }
    ctx.fill();
  }

  /** Cloud shadows on the ground (screen space, before the aircraft). */
  cloudShadows(ctx: CanvasRenderingContext2D, camX: number, camY: number): void {
    ctx.fillStyle = 'rgba(0,10,20,0.12)';
    this.eachCloud(camX, camY, (c, sx, sy) => this.puffs(ctx, c, sx + SHADOW.dx, sy + SHADOW.dy));
  }

  /** Clouds above everything (screen space). */
  cloudTops(ctx: CanvasRenderingContext2D, camX: number, camY: number): void {
    ctx.save();
    ctx.globalAlpha = 0.42;
    ctx.fillStyle = this.theater.palette.cloud;
    this.eachCloud(camX, camY, (c, sx, sy) => this.puffs(ctx, c, sx, sy));
    ctx.restore();
  }
}

/** Visual launchers: SAM sites stay on the ground, fighters streak past after firing. */
interface Launcher { kind: 'sam' | 'aam'; x: number; y: number; heading: number; at: number }
const FIGHTER_SPEED = 330;
const FIGHTER_LIFE = 4;

export class Launchers {
  private list: Launcher[] = [];

  /** `heading` = direction from the launcher to the jet (0 = up, clockwise). */
  add(kind: 'sam' | 'aam', x: number, y: number, heading: number, t: number, side: number): void {
    const h = kind === 'aam' ? heading + side * 1.2 : heading;
    this.list.push({ kind, x, y, heading: h, at: t });
    if (this.list.length > 24) this.list.shift();
  }

  /** Ground sites, world coordinates. */
  drawSites(ctx: CanvasRenderingContext2D, t: number): void {
    for (const l of this.list) {
      if (l.kind !== 'sam') continue;
      ctx.fillStyle = 'rgba(30,24,18,0.35)';
      ctx.beginPath();
      ctx.ellipse(l.x, l.y + 4, 30, 24, 0, 0, TAU);
      ctx.fill();
      drawEnemy(ctx, 'sam', l.x, l.y, { t, aim: l.heading });
    }
  }

  /** Fighters in the air, world coordinates. */
  drawFighters(ctx: CanvasRenderingContext2D, t: number): void {
    this.list = this.list.filter((l) => l.kind === 'sam' || t - l.at < FIGHTER_LIFE);
    for (const l of this.list) {
      if (l.kind !== 'aam') continue;
      const d = (t - l.at) * FIGHTER_SPEED;
      const x = l.x + Math.sin(l.heading) * d;
      const y = l.y - Math.cos(l.heading) * d;
      drawEnemy(ctx, 'fulcrum', x + 40, y + 56, { t, heading: l.heading + Math.PI, shadow: true });
      drawEnemy(ctx, 'fulcrum', x, y, { t, heading: l.heading + Math.PI, bank: 0.4 });
    }
  }
}
