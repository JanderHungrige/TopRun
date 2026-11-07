import { POINT_DEFENCE } from '../data/ship-modules';

// Point defence (doc 60): the spacecraft's turrets shoot down the nearest enemy missile in range; with n turrets the
// ship fires again after cooldown ÷ n. Pure.

export interface Threat {
  x: number;
  y: number;
  kind: string;
  dead: boolean;
}

/** The nearest live enemy missile within range of (x, y), or null. */
export function pointDefenceTarget<T extends Threat>(missiles: readonly T[], x: number, y: number): T | null {
  let best: T | null = null;
  let bestD: number = POINT_DEFENCE.range;
  for (const m of missiles) {
    if (m.dead || m.kind !== 'enemy') continue;
    const d = Math.hypot(m.x - x, m.y - y);
    if (d <= bestD) {
      best = m;
      bestD = d;
    }
  }
  return best;
}

/** Seconds between shots with `turrets` turrets (Infinity without any). */
export const pointDefenceInterval = (turrets: number): number => (turrets > 0 ? POINT_DEFENCE.cooldown / turrets : Infinity);
