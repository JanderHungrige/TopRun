import { TAU } from '../../core/math';

// Tower Flyby effects (doc 13): sparks, dust and speed streaks. Visual only; positions in world x / screen y.

type Kind = 'spark' | 'dust';

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

const MAX_PARTICLES = 260;

export class FlybyFx {
  private parts: Particle[] = [];

  private add(p: Particle): void {
    if (this.parts.length < MAX_PARTICLES) this.parts.push(p);
  }

  /** Sparks thrown forward along the jet's path. */
  sparks(x: number, y: number, speed: number, n = 26): void {
    for (let i = 0; i < n; i++) {
      const a = -Math.PI * (0.05 + Math.random() * 0.5);
      const v = 120 + Math.random() * 380;
      const life = 0.25 + Math.random() * 0.45;
      this.add({ kind: 'spark', x, y, vx: speed * 0.5 + Math.cos(a) * v, vy: Math.sin(a) * v, life, max: life, size: 1 + Math.random() * 1.6 });
    }
  }

  /** Dust kicked up from the ground behind a low jet. */
  dust(x: number, y: number, n = 3): void {
    for (let i = 0; i < n; i++) {
      const life = 0.6 + Math.random() * 0.7;
      this.add({
        kind: 'dust', x: x + (Math.random() - 0.5) * 30, y, vx: 60 + Math.random() * 160, vy: -20 - Math.random() * 50,
        life, max: life, size: 6 + Math.random() * 10,
      });
    }
  }

  step(dt: number): void {
    for (const p of this.parts) {
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.kind === 'spark') p.vy += 900 * dt;
      else {
        p.vx *= 1 - 1.5 * dt;
        p.size += 18 * dt;
      }
    }
    this.parts = this.parts.filter((p) => p.life > 0);
  }

  draw(ctx: CanvasRenderingContext2D, camX: number): void {
    ctx.save();
    for (const p of this.parts) {
      const k = p.life / p.max;
      const x = p.x - camX;
      if (p.kind === 'dust') {
        ctx.fillStyle = `rgba(176,156,118,${(0.38 * k).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(x, p.y, p.size, 0, TAU);
        ctx.fill();
        continue;
      }
      ctx.strokeStyle = k > 0.5 ? '#fff6c8' : '#ffb347';
      ctx.lineWidth = p.size;
      ctx.beginPath();
      ctx.moveTo(x, p.y);
      ctx.lineTo(x - p.vx * 0.02, p.y - p.vy * 0.02);
      ctx.stroke();
    }
    ctx.restore();
  }
}

/** Thin speed streaks around the jet; stronger with the afterburner. */
export function drawSpeedLines(ctx: CanvasRenderingContext2D, x: number, y: number, camX: number, level: number): void {
  const n = 5 + Math.round(level * 7);
  ctx.strokeStyle = `rgba(255,255,255,${(0.18 + 0.25 * level).toFixed(3)})`;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  for (let i = 0; i < n; i++) {
    const seed = Math.sin(i * 91.7) * 1000;
    const len = 50 + (seed - Math.floor(seed)) * 90 + level * 60;
    const lx = ((((i * 337 - camX * 1.8) % 900) + 900) % 900) - 260 + x;
    const ly = y - 60 + ((i * 53) % 120);
    ctx.moveTo(lx, ly);
    ctx.lineTo(lx + len, ly);
  }
  ctx.stroke();
}
