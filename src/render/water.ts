import { TAU } from '../core/math';
import { createRng, type Rng } from '../core/rng';
import type { TerrainStyle } from '../data/theaters';

// The water over the seabed (docs 68, 70): a wash over the floor, caustics, schools of fish, bubble strings rising from
// vents, slanted light rays from above, a vignette — and, in the deep, drifting marine snow and glowing specks. The light
// fades the deeper the map goes: rays on the reef and in the kelp, few over the wrecks, none in the trench and the abyss.
// Playfield-local coordinates (640 × 720).

const W = 640;
const H = 720;

export type SeaStyle = Extract<TerrainStyle, 'reef' | 'kelp' | 'wreck' | 'trench' | 'abyss'>;
const SEA_STYLES: readonly SeaStyle[] = ['reef', 'kelp', 'wreck', 'trench', 'abyss'];

/** The terrain as an underwater style, or null above the water. */
export const asSea = (style: TerrainStyle): SeaStyle | null => SEA_STYLES.find((s) => s === style) ?? null;

interface WaterLook {
  /** Floor wash, top and bottom of the screen (rgba). */
  wash: readonly [string, string];
  caustics: number;
  rays: number;
  ray: string;
  vignette: number;
  fish: boolean;
  /** Marine snow (pale flecks drifting down) and glowing specks. */
  snow: number;
  glow: number;
}

const LOOKS: Readonly<Record<SeaStyle, WaterLook>> = {
  reef: { wash: ['rgba(20,150,180,0.26)', 'rgba(8,84,130,0.42)'], caustics: 0.13, rays: 5, ray: '220,255,250', vignette: 0.36, fish: true, snow: 0, glow: 0 },
  kelp: { wash: ['rgba(20,120,90,0.34)', 'rgba(6,60,60,0.5)'], caustics: 0.1, rays: 4, ray: '210,255,200', vignette: 0.42, fish: true, snow: 0, glow: 0 },
  wreck: { wash: ['rgba(16,90,130,0.4)', 'rgba(6,40,70,0.58)'], caustics: 0.06, rays: 2, ray: '200,230,255', vignette: 0.48, fish: true, snow: 20, glow: 0 },
  trench: { wash: ['rgba(8,40,90,0.52)', 'rgba(2,14,40,0.72)'], caustics: 0, rays: 0, ray: '0,0,0', vignette: 0.55, fish: false, snow: 40, glow: 6 },
  abyss: { wash: ['rgba(2,10,24,0.66)', 'rgba(0,4,12,0.82)'], caustics: 0, rays: 0, ray: '0,0,0', vignette: 0.6, fish: false, snow: 30, glow: 26 },
};

interface Fish { dx: number; dy: number; phase: number; color: string }
interface School { x: number; y: number; vx: number; fish: Fish[] }
interface Mote { x: number; y: number; r: number; phase: number }

const FISH = ['#ffd84a', '#5fd0ff', '#ff8a3d', '#f2f2f2', '#9a7aff'] as const;
const GLOW = ['95,240,224', '120,170,255', '255,120,220'] as const;

/** The living water over one theater's seabed. */
export class Water {
  private time = 0;
  private schools: School[] = [];
  private bubbles: Mote[] = [];
  private vents: Array<{ x: number; y: number }> = [];
  private readonly snow: Mote[];
  private readonly glow: Mote[];
  private readonly look: WaterLook;
  private readonly rng: Rng;

  constructor(style: SeaStyle, seed: number) {
    this.look = LOOKS[style];
    this.rng = createRng(seed);
    const r = this.rng;
    for (let i = 0; i < 3; i++) this.vents.push({ x: r.range(30, W - 30), y: r.range(0, H) });
    const motes = (n: number, big: number): Mote[] =>
      Array.from({ length: n }, () => ({ x: r.range(0, W), y: r.range(0, H), r: r.range(0.8, big), phase: r.range(0, TAU) }));
    this.snow = motes(this.look.snow, 1.8);
    this.glow = motes(this.look.glow, 2.6);
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
    for (const m of this.snow) m.y = (m.y + scroll * 0.6 + 12 * dt + H) % H;
    for (const m of this.glow) m.y = (m.y + scroll * 0.3 + H) % H;
    for (const s of this.schools) {
      s.x += s.vx * dt;
      s.y += scroll * 0.4;
    }
    this.schools = this.schools.filter((s) => s.x > -120 && s.x < W + 120 && s.y < H + 60);
    if (this.look.fish && this.schools.length < 2 && r.chance(dt * 0.25)) this.spawnSchool();
  }

  private spawnSchool(): void {
    const r = this.rng;
    const left = r.chance(0.5);
    const color = FISH[r.int(0, FISH.length - 1)] ?? '#ffd84a';
    const fish = Array.from({ length: r.int(7, 13) }, () => ({ dx: r.range(-34, 34), dy: r.range(-22, 22), phase: r.range(0, TAU), color }));
    this.schools.push({ x: left ? -100 : W + 100, y: r.range(60, H - 160), vx: (left ? 1 : -1) * r.range(50, 80), fish });
  }

  /** Under the units: the water over the floor, caustics, the fish and the bubbles. */
  renderFloor(ctx: CanvasRenderingContext2D, distance: number): void {
    const deep = ctx.createLinearGradient(0, 0, 0, H);
    deep.addColorStop(0, this.look.wash[0]);
    deep.addColorStop(1, this.look.wash[1]);
    ctx.fillStyle = deep;
    ctx.fillRect(0, 0, W, H);
    if (this.look.caustics > 0) this.caustics(ctx, distance);
    for (const s of this.schools) this.school(ctx, s);
    ctx.strokeStyle = 'rgba(225,245,255,0.6)';
    ctx.lineWidth = 1;
    for (const b of this.bubbles) {
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, TAU);
      ctx.stroke();
    }
  }

  private school(ctx: CanvasRenderingContext2D, s: School): void {
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

  /** A faint moving net of brighter lines over the sand. */
  private caustics(ctx: CanvasRenderingContext2D, distance: number): void {
    ctx.strokeStyle = `rgba(210,255,250,${this.look.caustics})`;
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

  /** Over everything: light rays, marine snow and glowing specks, then the vignette. */
  renderOverlay(ctx: CanvasRenderingContext2D): void {
    for (let i = 0; i < this.look.rays; i++) this.ray(ctx, i);
    ctx.fillStyle = 'rgba(220,235,240,0.35)';
    for (const m of this.snow) ctx.fillRect(m.x, m.y, m.r, m.r);
    for (const m of this.glow) {
      const a = 0.35 + 0.35 * Math.sin(this.time * 2 + m.phase);
      ctx.fillStyle = `rgba(${GLOW[Math.floor(m.phase) % GLOW.length] ?? GLOW[0]},${a.toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(m.x + Math.sin(this.time * 0.7 + m.phase) * 6, m.y, m.r, 0, TAU);
      ctx.fill();
    }
    const edge = ctx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 0.75);
    edge.addColorStop(0, 'rgba(2,24,36,0)');
    edge.addColorStop(1, `rgba(2,24,36,${this.look.vignette})`);
    ctx.fillStyle = edge;
    ctx.fillRect(0, 0, W, H);
  }

  /** One slanted ray from the surface that sways and breathes. */
  private ray(ctx: CanvasRenderingContext2D, i: number): void {
    const x = 40 + i * 140 + Math.sin(this.time * 0.3 + i * 1.7) * 30;
    const w = 40 + (i % 3) * 22;
    const a = 0.05 + 0.03 * Math.sin(this.time * 0.8 + i * 2.1);
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, `rgba(${this.look.ray},${a.toFixed(3)})`);
    g.addColorStop(1, `rgba(${this.look.ray},0)`);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(x, -10);
    ctx.lineTo(x + w, -10);
    ctx.lineTo(x + w + 190, H);
    ctx.lineTo(x + 150, H);
    ctx.closePath();
    ctx.fill();
  }
}
