import { TANK_DRIVE } from '../game/tank-drive';

// The tanks' tracks and the buggies' tyre marks in the steppe (doc 104): a short dash pressed in every few px of ground
// covered, turned with the hull, scrolling away with the floor and fading. Playfield-local.

interface Mark { x: number; y: number; angle: number; wide: number; age: number }

export class TrackMarks {
  private marks: Mark[] = [];

  /** A mark at (x, y), along `angle` (the hull's yaw); `wide`: a track (6 px) or a tyre (3 px). */
  add(x: number, y: number, angle: number, wide: number): void {
    this.marks.push({ x, y, angle, wide, age: 0 });
    if (this.marks.length > 240) this.marks.shift();
  }

  update(dt: number, dy: number): void {
    for (const m of this.marks) {
      m.y += dy;
      m.age += dt;
    }
    this.marks = this.marks.filter((m) => m.age < TANK_DRIVE.markLife && m.y < 760);
  }

  render(ctx: CanvasRenderingContext2D): void {
    for (const m of this.marks) {
      const a = 0.28 * (1 - m.age / TANK_DRIVE.markLife);
      ctx.save();
      ctx.translate(m.x, m.y);
      ctx.rotate(m.angle);
      ctx.fillStyle = `rgba(40,28,12,${a.toFixed(3)})`;
      ctx.fillRect(-m.wide / 2, -6, m.wide, 12);
      if (m.wide > 4) {
        ctx.fillStyle = `rgba(20,14,6,${(a * 0.8).toFixed(3)})`;
        for (let k = -5; k < 6; k += 3) ctx.fillRect(-m.wide / 2, k, m.wide, 1);
      }
      ctx.restore();
    }
  }
}
