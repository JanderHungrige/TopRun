import { TAU } from '../../core/math';
import { PX_PER_M } from './motorbike-world';

// Motorbike vs. Jet (doc 22): dust clouds, exhaust puffs, tyre smoke and speed streaks — visual only. Particle
// x is in world metres (they stay where they were kicked up), y in screen px.

type Kind = 'dust' | 'puff' | 'smoke';

interface Particle {
  kind: Kind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  size: number;
}

const MAX = 240;
const COLOR: Readonly<Record<Kind, string>> = { dust: '186,150,120', puff: '120,110,130', smoke: '210,205,215' };

export class MotorbikeFx {
  private parts: Particle[] = [];

  private add(p: Particle): void {
    if (this.parts.length < MAX) this.parts.push(p);
  }

  /** A dust cloud around world x (crash, skid stop). */
  dust(x: number, y: number, n: number): void {
    for (let i = 0; i < n; i++) {
      const life = 0.7 + Math.random() * 0.8;
      this.add({ kind: 'dust', x: x + (Math.random() - 0.5) * 4, y: y - Math.random() * 6, vx: (Math.random() - 0.3) * 6, vy: -10 - Math.random() * 40, life, max: life, size: 6 + Math.random() * 10 });
    }
  }

  /** A puff from the exhaust (shift, backfire). */
  puff(x: number, y: number, n = 3): void {
    for (let i = 0; i < n; i++) {
      const life = 0.35 + Math.random() * 0.3;
      this.add({ kind: 'puff', x, y: y + (Math.random() - 0.5) * 4, vx: -2 - Math.random() * 3, vy: -12 - Math.random() * 14, life, max: life, size: 3 + Math.random() * 3 });
    }
  }

  /** Tyre smoke from the rear wheel (hard braking, sliding). */
  smoke(x: number, y: number): void {
    const life = 0.5 + Math.random() * 0.4;
    this.add({ kind: 'smoke', x, y: y - 2, vx: (Math.random() - 0.5) * 2, vy: -8 - Math.random() * 12, life, max: life, size: 4 + Math.random() * 5 });
  }

  step(dt: number): void {
    for (const p of this.parts) {
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy *= 1 - 1.8 * dt;
      p.size += (p.kind === 'puff' ? 10 : 16) * dt;
    }
    this.parts = this.parts.filter((p) => p.life > 0);
  }

  draw(ctx: CanvasRenderingContext2D, camX: number): void {
    for (const p of this.parts) {
      const a = Math.min(1, p.life / p.max) * (p.kind === 'dust' ? 0.55 : 0.45);
      ctx.fillStyle = `rgba(${COLOR[p.kind]},${a.toFixed(3)})`;
      ctx.beginPath();
      ctx.arc((p.x - camX) * PX_PER_M, p.y, p.size, 0, TAU);
      ctx.fill();
    }
  }
}

/** Thin horizontal streaks in the air at speed; `amount` 0 … 1. */
export function drawSpeedStreaks(ctx: CanvasRenderingContext2D, camX: number, amount: number): void {
  if (amount <= 0.05) return;
  const px = camX * PX_PER_M * 1.6;
  ctx.strokeStyle = `rgba(255,226,200,${(0.22 * amount).toFixed(3)})`;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  for (let i = 0; i < 14; i++) {
    const x = ((((i * 397 - px) % 1500) + 1500) % 1500) - 110;
    const y = 300 + ((i * 137) % 330);
    ctx.moveTo(x, y);
    ctx.lineTo(x + 60 + 80 * amount, y);
  }
  ctx.stroke();
}
