import { BOARD_H, BOARD_W, hash3 } from '../../game/chalkboard';
import { SPONGE_H, SPONGE_W } from '../../game/chalkboard-ops';

// Chalkboard scene (doc 40): where the wet sponge went. Freshly wiped slate shows darker, then dries back in patches
// over ~3–6 s. Looks only — nothing of this is shared or stored.

export class WetMap {
  readonly level = new Float32Array(BOARD_W * BOARD_H);
  private readonly rate = new Float32Array(BOARD_W * BOARD_H);
  /** Whether any cell is still wet. */
  any = false;

  constructor() {
    for (let y = 0; y < BOARD_H; y++) {
      for (let x = 0; x < BOARD_W; x++) {
        const patch = hash3(x >> 3, y >> 2, 11) % 100;
        this.rate[y * BOARD_W + x] = 1 / (3 + patch / 40 + (hash3(x, y, 13) % 10) / 16);
      }
    }
  }

  /** Wets the sponge's footprint around board px (x, y). */
  soak(x: number, y: number): void {
    const cx = x >> 2;
    const cy = y >> 2;
    for (let r = Math.max(0, cy - SPONGE_H / 2); r < Math.min(BOARD_H, cy + SPONGE_H / 2); r++) {
      this.level.fill(1, r * BOARD_W + Math.max(0, cx - SPONGE_W / 2), r * BOARD_W + Math.min(BOARD_W, cx + SPONGE_W / 2));
    }
    this.any = true;
  }

  update(dt: number): void {
    if (!this.any) return;
    let wet = false;
    for (let i = 0; i < this.level.length; i++) {
      const l = this.level[i] ?? 0;
      if (l <= 0) continue;
      const next = l - dt * (this.rate[i] ?? 0.3);
      this.level[i] = next > 0 ? next : 0;
      wet ||= next > 0;
    }
    this.any = wet;
  }
}
