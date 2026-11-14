import type { TerrainStyle } from '../data/theaters';

// The alien steppe's air (doc 105), drawn over the floor: the wind rolling over the Sea of Grass in long bands of light,
// heat shimmer over the salt, dust drifting over the barrows and the badlands, a violet haze breathing in the crater; and
// over everything specks of dust blowing across. Playfield-local (640 × 720).

const W = 640;
const H = 720;

export class SteppeWind {
  constructor(private readonly style: TerrainStyle) {}

  /** Over the floor, under the units. `distance`: the ground scrolled, so the bands sit on the grass. */
  renderGround(ctx: CanvasRenderingContext2D, t: number, distance: number): void {
    switch (this.style) {
      case 'grass': return this.bands(ctx, t, distance, 'rgba(255,240,170,', 0.11, 150);
      case 'barrows': return this.bands(ctx, t, distance, 'rgba(230,220,170,', 0.07, 120);
      case 'salt': return this.shimmer(ctx, t);
      case 'badlands': return this.bands(ctx, t, distance, 'rgba(255,190,140,', 0.05, 90);
      case 'impact': return this.haze(ctx, t);
      default: return;
    }
  }

  /** Long diagonal bands of light rolling across with the wind. */
  private bands(ctx: CanvasRenderingContext2D, t: number, distance: number, rgb: string, alpha: number, width: number): void {
    ctx.save();
    ctx.translate(W / 2, H / 2);
    ctx.rotate(-0.5);
    for (let k = 0; k < 5; k++) {
      const x = ((t * 70 + k * 260 + distance * 0.3) % 1300) - 650;
      const g = ctx.createLinearGradient(x - width, 0, x + width, 0);
      g.addColorStop(0, `${rgb}0)`);
      g.addColorStop(0.5, `${rgb}${alpha})`);
      g.addColorStop(1, `${rgb}0)`);
      ctx.fillStyle = g;
      ctx.fillRect(x - width, -700, width * 2, 1400);
    }
    ctx.restore();
  }

  private shimmer(ctx: CanvasRenderingContext2D, t: number): void {
    for (let k = 0; k < 12; k++) {
      const y = (k * 61 + t * 14) % H;
      const a = 0.03 + 0.03 * Math.sin(t * 5 + k * 1.7);
      ctx.fillStyle = `rgba(255,255,255,${a.toFixed(3)})`;
      ctx.fillRect(0, y, W, 6 + (k % 3) * 3);
    }
  }

  private haze(ctx: CanvasRenderingContext2D, t: number): void {
    const a = 0.06 + 0.04 * Math.sin(t * 0.8);
    const g = ctx.createRadialGradient(W / 2, H * 0.3, 40, W / 2, H * 0.3, 500);
    g.addColorStop(0, `rgba(199,125,255,${(a * 1.6).toFixed(3)})`);
    g.addColorStop(1, 'rgba(199,125,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }

  /** Over everything: specks of dust blowing across from the left. */
  renderSky(ctx: CanvasRenderingContext2D, t: number): void {
    ctx.fillStyle = this.style === 'impact' ? 'rgba(220,190,255,0.5)' : 'rgba(240,225,180,0.55)';
    for (let i = 0; i < 40; i++) {
      const x = (i * 131 + t * (90 + (i % 5) * 25)) % (W + 40) - 20;
      const y = (i * 197 + Math.sin(t * 0.7 + i) * 30 + t * 12) % H;
      ctx.fillRect(x, y, 2, 1 + (i % 2));
    }
  }
}
