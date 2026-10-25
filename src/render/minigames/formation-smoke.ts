import { TAU, type Vec } from '../../core/math';

// Formation Flying (doc 14): coloured air-show smoke and wingtip vapour. Air-fixed puffs that stream away
// behind the jets. Visual only.

export type SmokeColor = 'red' | 'blue' | 'white';

const RGB: Readonly<Record<SmokeColor, string>> = { red: '238,72,58', blue: '72,150,255', white: '246,246,246' };

interface Puff {
  x: number;
  y: number;
  /** Own sideways drift, px/s. */
  vx: number;
  age: number;
  life: number;
  r: number;
  grow: number;
  alpha: number;
  color: SmokeColor;
}

export class SmokeTrails {
  private puffs: Puff[] = [];

  /** One puff of air-show smoke from a jet's tail. */
  smoke(x: number, y: number, color: SmokeColor, scale: number): void {
    this.puffs.push({ x, y, vx: (Math.random() - 0.5) * 30, age: 0, life: 2.4, r: 4 * scale, grow: 48, alpha: 0.6, color });
  }

  /** A wisp of condensation from a wingtip in a hard pull. */
  vapor(x: number, y: number, scale: number): void {
    this.puffs.push({ x, y, vx: 0, age: 0, life: 0.45, r: 2 * scale, grow: 12, alpha: 0.4, color: 'white' });
  }

  /** In the camera frame the air streams back at ground speed and swings around the pivot in a turn. */
  update(dt: number, turn: number, speed: number, pivot: Vec): void {
    for (const p of this.puffs) {
      const qx = p.x - pivot.x;
      const qy = p.y - pivot.y;
      p.x += (turn * qy + p.vx) * dt;
      p.y += (speed - turn * qx) * dt;
      p.age += dt;
    }
    this.puffs = this.puffs.filter((p) => p.age < p.life && p.y < 820 && p.y > -120 && p.x > -120 && p.x < 1400);
  }

  render(ctx: CanvasRenderingContext2D): void {
    for (const p of this.puffs) {
      const k = 1 - p.age / p.life;
      const a = p.alpha * k * Math.sqrt(k) * Math.min(1, p.age * 30 + 0.3);
      ctx.fillStyle = `rgba(${RGB[p.color]},${a.toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r + p.age * p.grow, 0, TAU);
      ctx.fill();
    }
  }
}
