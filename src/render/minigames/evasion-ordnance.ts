import { TAU } from '../../core/math';
import type { Flare } from '../../game/minigames/evasion';
import { MISSILE_SPECS, type Missile, type MissileKind } from '../../game/minigames/evasion-missiles';
import { flame, fillPoly } from '../shapes';

// Missile Evasion (doc 16): missiles, motor flames, smoke trails and flares (world coordinates).

const TRAIL_LIFE = 1.8;
const TRAIL_STEP = 1 / 30;

interface TrailPoint { x: number; y: number; t: number }
interface Trail { kind: MissileKind; pts: TrailPoint[] }

export const motorOn = (m: Missile): boolean => m.mode !== 'spent' && m.age < MISSILE_SPECS[m.kind].burn;

/** Smoke trails, kept after their missile is gone until they have faded. */
export class Trails {
  private trails = new Map<number, Trail>();
  private acc = 0;

  update(missiles: readonly Missile[], t: number, dt: number): void {
    this.acc += dt;
    const sample = this.acc >= TRAIL_STEP;
    if (sample) this.acc = 0;
    for (const m of missiles) {
      if (!sample || !motorOn(m)) continue;
      const tr = this.trails.get(m.id) ?? { kind: m.kind, pts: [] };
      const back = m.kind === 'sam' ? 12 : 10;
      tr.pts.push({ x: m.x - Math.sin(m.heading) * back, y: m.y + Math.cos(m.heading) * back, t });
      this.trails.set(m.id, tr);
    }
    for (const [id, tr] of this.trails) {
      tr.pts = tr.pts.filter((p) => t - p.t < TRAIL_LIFE);
      if (tr.pts.length === 0) this.trails.delete(id);
    }
  }

  draw(ctx: CanvasRenderingContext2D, t: number): void {
    ctx.lineCap = 'round';
    for (const tr of this.trails.values()) {
      const base = tr.kind === 'sam' ? 3 : 2;
      for (let i = 1; i < tr.pts.length; i++) {
        const a = tr.pts[i - 1];
        const b = tr.pts[i];
        if (!a || !b) continue;
        const age = (t - b.t) / TRAIL_LIFE;
        ctx.strokeStyle = `rgba(236,236,230,${((1 - age) * 0.5).toFixed(3)})`;
        ctx.lineWidth = base + age * 9;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }
  }
}

interface MissileLook { len: number; w: number; body: string; band: string; nose: string; fin: string }
const LOOK: Readonly<Record<MissileKind, MissileLook>> = {
  sam: { len: 26, w: 4.4, body: '#f1f0ea', band: '#c8312a', nose: '#5b5f63', fin: '#8d9196' },
  aam: { len: 21, w: 3.2, body: '#d7dbde', band: '#e2b33c', nose: '#3c4247', fin: '#7d858c' },
};

function missileBody(ctx: CanvasRenderingContext2D, l: MissileLook): void {
  const h = l.len / 2;
  const r = l.w / 2;
  fillPoly(ctx, [-r, h, -r - 4, h + 1, -r - 4, h - 4, -r, h - 7], l.fin);
  fillPoly(ctx, [r, h, r + 4, h + 1, r + 4, h - 4, r, h - 7], l.fin);
  fillPoly(ctx, [-r, -h * 0.25, -r - 2.6, -h * 0.05, -r, h * 0.12], l.fin);
  fillPoly(ctx, [r, -h * 0.25, r + 2.6, -h * 0.05, r, h * 0.12], l.fin);
  fillPoly(ctx, [-r, h, -r, -h + l.w, 0, -h, r, -h + l.w, r, h], l.body, 'rgba(20,20,20,0.45)');
  fillPoly(ctx, [-r, -h + l.w, 0, -h, r, -h + l.w], l.nose);
  ctx.fillStyle = l.band;
  ctx.fillRect(-r, -h * 0.45, l.w, 2.2);
}

/** One missile; spent ones tumble and fade, the motor flame shows while it burns. */
export function drawMissile(ctx: CanvasRenderingContext2D, m: Missile, t: number): void {
  const l = LOOK[m.kind];
  ctx.save();
  ctx.translate(m.x, m.y);
  ctx.rotate(m.heading + (m.mode === 'spent' ? m.modeT * 7 : 0));
  if (m.mode === 'spent') ctx.globalAlpha *= Math.max(0, 1 - m.modeT);
  if (motorOn(m)) {
    const boost = m.age < MISSILE_SPECS[m.kind].boostTime ? 1 : 0.7;
    flame(ctx, 0, l.len / 2, l.w * 1.6, boost, t * 3 + m.id);
  }
  missileBody(ctx, l);
  ctx.restore();
}

/** A burning flare: white core in an orange glow, flickering. */
export function drawFlare(ctx: CanvasRenderingContext2D, f: Flare, t: number): void {
  const life = Math.min(1, f.ttl);
  const r = (10 + Math.sin(t * 40 + f.id) * 2.5) * (0.6 + 0.4 * life);
  const g = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, r * 2.4);
  g.addColorStop(0, `rgba(255,255,240,${life.toFixed(3)})`);
  g.addColorStop(0.25, `rgba(255,220,120,${(0.85 * life).toFixed(3)})`);
  g.addColorStop(1, 'rgba(255,140,40,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(f.x, f.y, r * 2.4, 0, TAU);
  ctx.fill();
}
