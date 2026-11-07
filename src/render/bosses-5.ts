import type { BossDrawState } from './draw-bosses';
import { HL, rect, SH, type Pal } from './draw-ground-units';
import { bossPal } from './bosses-2';
import { screwBlur } from './enemies/sea';
import { circle, ellipse, fillPair, fillSym } from './shapes';

// Hulls of map 5's bosses (doc 65) in data/bosses-5.ts's local coordinates; tubes, guns, damage and warning lights come
// from the shared boss renderer (draw-bosses.ts).

type Ctx = CanvasRenderingContext2D;
type HullFn = (ctx: Ctx, p: Pal, s: BossDrawState) => void;
type Map5Boss = 'barracuda';

export const PALS_5: Readonly<Record<Map5Boss, Pal>> = {
  barracuda: bossPal('#2c3a48', '#18212b', '#4a5d70', '#c8312a', '#7ff0ff'),
};

export const LIGHTS_5: Readonly<Record<Map5Boss, readonly number[]>> = {
  barracuda: [0, 150, -30, 60, 30, 60, 0, -120, -18, -40, 18, -40],
};

/** Bubbles streaming from a point, drifting back (up) and wobbling. */
function bubbleTrail(ctx: Ctx, x: number, y: number, t: number, n: number): void {
  for (let i = 0; i < n; i++) {
    const k = (t * 0.9 + i / n) % 1;
    const bx = x + Math.sin(t * 5 + i * 2.3) * (3 + k * 10);
    circle(ctx, bx, y - k * 70, 1.5 + k * 3, `rgba(210,240,255,${(0.5 * (1 - k)).toFixed(3)})`);
  }
}

// ---------- BARRACUDA: a long, sleek hunter-killer sub with a swept sail, sail planes and an X-tail ----------
const barracuda: HullFn = (ctx, p, s) => {
  if (p.live && !p.mono) bubbleTrail(ctx, 0, -186, s.t, 12);
  screwBlur(ctx, -182, 16, s.t, p);
  fillPair(ctx, [10, -146, 42, -176, 46, -186, 36, -186, 4, -160], p.dark, p.line);
  fillSym(ctx, [0, 160, 14, 150, 26, 126, 34, 92, 38, 40, 38, -60, 34, -110, 24, -148, 12, -168, 0, -176], p.body, p.line);
  if (!p.mono) {
    fillSym(ctx, [0, 150, 8, 140, 12, 90, 12, -120, 0, -150], HL);
    for (const y of [100, 0, -100]) rect(ctx, -37, y, 74, 2, SH);
    ellipse(ctx, 0, 150, 10, 7, 'rgba(255,255,255,0.08)');
  }
  fillPair(ctx, [8, 46, 44, 38, 46, 30, 8, 28], p.dark, p.line);
  fillSym(ctx, [0, 64, 8, 58, 12, 44, 12, 10, 8, 0, 0, -4], p.light, p.line);
  if (p.mono) return;
  rect(ctx, -3, 50, 6, 4, p.glass);
  if (p.live) {
    ellipse(ctx, 0, 182, 12, 22, 'rgba(255,90,70,0.12)');
    circle(ctx, 0, 162, 2.4, p.red);
  }
};

export const HULLS_5: Readonly<Record<Map5Boss, HullFn>> = { barracuda };
