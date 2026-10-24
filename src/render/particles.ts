import { TAU } from '../core/math';
import { text } from './text';

export type ParticleKind = 'flash' | 'fire' | 'smoke' | 'spark' | 'ring' | 'splash' | 'steam' | 'popup';

interface Particle {
  kind: ParticleKind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  size: number;
  grow: number;
  color: string;
  drag: number;
  ground: boolean;
  label: string;
}

const MAX_PARTICLES = 1100;

export type BlastSize = 'small' | 'large' | 'huge';

const BLAST: Readonly<Record<BlastSize, { fire: number; smoke: number; sparks: number; radius: number }>> = {
  small: { fire: 7, smoke: 4, sparks: 6, radius: 16 },
  large: { fire: 14, smoke: 9, sparks: 12, radius: 30 },
  huge: { fire: 30, smoke: 18, sparks: 26, radius: 64 },
};

export class Particles {
  private list: Particle[] = [];

  get count(): number {
    return this.list.length;
  }

  clear(): void {
    this.list = [];
  }

  add(p: Partial<Particle> & { kind: ParticleKind; x: number; y: number; max: number }): void {
    if (this.list.length >= MAX_PARTICLES) this.list.shift();
    this.list.push({
      vx: 0, vy: 0, size: 4, grow: 0, color: '#fff', drag: 0, ground: false, label: '', ...p, life: p.max,
    });
  }

  explosion(x: number, y: number, size: BlastSize, ground = false): void {
    const b = BLAST[size];
    this.add({ kind: 'flash', x, y, max: 0.18, size: b.radius * 1.3, color: '#fffbe0', ground });
    this.add({ kind: 'ring', x, y, max: 0.45, size: b.radius * 0.4, grow: b.radius * 5, color: 'rgba(255,230,180,1)', ground });
    for (let i = 0; i < b.fire; i++) {
      const a = Math.random() * TAU;
      const s = Math.random() * b.radius * 2.6;
      this.add({
        kind: 'fire', x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, max: 0.35 + Math.random() * 0.35,
        size: b.radius * (0.25 + Math.random() * 0.3), grow: b.radius * 0.8, drag: 3, ground,
        color: Math.random() < 0.5 ? '#ffb43a' : '#ff6a1f',
      });
    }
    for (let i = 0; i < b.smoke; i++) this.smoke(x + (Math.random() - 0.5) * b.radius, y + (Math.random() - 0.5) * b.radius, b.radius * 0.35, ground);
    this.sparks(x, y, b.sparks, '#ffd36b', b.radius * 7, ground);
  }

  smoke(x: number, y: number, size = 8, ground = false): void {
    const a = Math.random() * TAU;
    this.add({
      kind: 'smoke', x, y, vx: Math.cos(a) * 18, vy: Math.sin(a) * 18 - 10, max: 0.9 + Math.random() * 0.8,
      size, grow: size * 1.6, drag: 1.2, ground, color: Math.random() < 0.5 ? '#3a3a3a' : '#555',
    });
  }

  sparks(x: number, y: number, n: number, color: string, speed = 220, ground = false): void {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * TAU;
      const s = speed * (0.3 + Math.random() * 0.7);
      this.add({ kind: 'spark', x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, max: 0.25 + Math.random() * 0.35, size: 2, drag: 2.5, color, ground });
    }
  }

  trail(x: number, y: number, color = 'rgba(220,220,220,1)'): void {
    this.add({ kind: 'smoke', x, y, vx: (Math.random() - 0.5) * 10, vy: 0, max: 0.5, size: 3, grow: 7, drag: 2, color });
  }

  splash(x: number, y: number, n = 16): void {
    for (let i = 0; i < n; i++) {
      const a = -Math.PI / 2 + (Math.random() - 0.5) * 1.6;
      const s = 120 + Math.random() * 260;
      this.add({ kind: 'splash', x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, max: 0.8 + Math.random() * 0.5, size: 3 + Math.random() * 4, drag: 0.4, color: '#e8f6ff' });
    }
  }

  steam(x: number, y: number, power = 1): void {
    this.add({
      kind: 'steam', x, y, vx: (Math.random() - 0.5) * 40 * power, vy: -30 - Math.random() * 50 * power,
      max: 0.8 + Math.random() * 0.6, size: 6 + Math.random() * 6, grow: 26, drag: 1.5, color: 'rgba(240,245,250,1)',
    });
  }

  popup(x: number, y: number, label: string, color: string): void {
    this.add({ kind: 'popup', x, y, vy: -40, max: 1.1, size: 15, drag: 1, color, label });
  }

  /** `scroll` moves ground-attached particles with the terrain; `gravity` is for side-view scenes. */
  update(dt: number, scroll = 0, gravity = 0): void {
    const keep: Particle[] = [];
    for (const p of this.list) {
      p.life -= dt;
      if (p.life <= 0) continue;
      const damp = Math.max(0, 1 - p.drag * dt);
      p.vx *= damp;
      p.vy = p.vy * damp + (p.kind === 'splash' ? gravity * dt : 0);
      p.x += p.vx * dt;
      p.y += p.vy * dt + (p.ground ? scroll * dt : 0);
      p.size += p.grow * dt;
      keep.push(p);
    }
    this.list = keep;
  }

  render(ctx: CanvasRenderingContext2D): void {
    for (const p of this.list) drawParticle(ctx, p);
    ctx.globalAlpha = 1;
  }
}

function drawParticle(ctx: CanvasRenderingContext2D, p: Particle): void {
  const f = p.life / p.max;
  switch (p.kind) {
    case 'flash':
    case 'fire':
    case 'smoke':
    case 'steam':
    case 'splash': {
      ctx.globalAlpha = p.kind === 'smoke' ? f * 0.55 : p.kind === 'steam' ? f * 0.5 : Math.min(1, f * 1.4);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(0.5, p.size), 0, TAU);
      ctx.fill();
      return;
    }
    case 'spark':
      ctx.globalAlpha = f;
      ctx.strokeStyle = p.color;
      ctx.lineWidth = p.size;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x - p.vx * 0.03, p.y - p.vy * 0.03);
      ctx.stroke();
      return;
    case 'ring':
      ctx.globalAlpha = f * 0.7;
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 3 * f + 0.5;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, TAU);
      ctx.stroke();
      return;
    case 'popup':
      ctx.globalAlpha = 1;
      text(ctx, p.label, p.x, p.y, { size: p.size, display: true, align: 'center', color: p.color, stroke: 'rgba(0,0,0,0.7)', strokeWidth: 3, alpha: Math.min(1, f * 2) });
      return;
    default:
      throw new Error(`unhandled: ${p.kind satisfies never}`);
  }
}
