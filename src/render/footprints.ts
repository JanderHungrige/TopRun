// The walking mechs' footprints in the jungle floor (doc 80): pressed in at every footfall, scrolling away with the
// floor and fading. Playfield-local.

interface Print { x: number; y: number; size: number; age: number }

const LIFE = 6;

export class Footprints {
  private prints: Print[] = [];

  /** A footprint at (x, y); `size` follows the mech (the Titan's are big). */
  add(x: number, y: number, size: number): void {
    this.prints.push({ x, y, size, age: 0 });
    if (this.prints.length > 60) this.prints.shift();
  }

  update(dt: number, dy: number): void {
    for (const p of this.prints) {
      p.y += dy;
      p.age += dt;
    }
    this.prints = this.prints.filter((p) => p.age < LIFE && p.y < 760);
  }

  render(ctx: CanvasRenderingContext2D): void {
    for (const p of this.prints) {
      const a = 0.35 * (1 - p.age / LIFE);
      ctx.fillStyle = `rgba(30,18,8,${a.toFixed(3)})`;
      ctx.fillRect(p.x - p.size, p.y - p.size * 1.3, p.size * 2, p.size * 2.2);
      ctx.fillRect(p.x - p.size * 1.4, p.y - p.size * 1.8, p.size * 0.8, p.size);
      ctx.fillRect(p.x + p.size * 0.6, p.y - p.size * 1.8, p.size * 0.8, p.size);
    }
  }
}
