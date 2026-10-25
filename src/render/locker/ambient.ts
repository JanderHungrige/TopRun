import { hexOf, PAL } from '../pixel/palette';
import { pixelRect } from '../pixel/frame';
import { INSIDE, TUBE } from './set';

// Locker (doc 31): the living parts of the locker — the tube light's flicker (a dark overlay on the lit inside),
// dust motes drifting through its light cone and the slow sway of the uniform, all in whole art pixels.

const hash = (n: number): number => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};

/** True while the tube light is dark: now and then 1–3 frames (at 15 Hz) in a few-second window. */
export function flickerOff(t: number): boolean {
  const win = Math.floor(t / 3.2);
  if (hash(win) < 0.35) return false;
  const start = 4 + Math.floor(hash(win + 7) * 30);
  const f = Math.floor(t * 15) - win * 48 - start;
  return f === 0 || f === 2 || (hash(win + 3) > 0.6 && f === 5);
}

/** The uniform's sway in whole art pixels (−1, 0 or +1) times the grid. */
export function swayOffset(t: number, G: number): number {
  return Math.round(Math.sin(t * 0.9) * 1.3) * G;
}

/** The dim layer over the inside of the locker while the light is off. */
export function drawFlicker(ctx: CanvasRenderingContext2D, t: number): void {
  if (!flickerOff(t)) return;
  ctx.fillStyle = 'rgba(6,10,4,0.34)';
  ctx.fillRect(INSIDE.x, INSIDE.y, INSIDE.w, INSIDE.h);
  pixelRect(ctx, TUBE.x, TUBE.y, TUBE.w, TUBE.h, hexOf(PAL.white[2] ?? 0));
}

const MOTES = 18;

/** Dust in the light cone. */
export function drawDust(ctx: CanvasRenderingContext2D, t: number, G: number): void {
  if (flickerOff(t)) return;
  const lit = hexOf(PAL.lamp[5] ?? 0);
  const dim = hexOf(PAL.white[2] ?? 0);
  for (let i = 0; i < MOTES; i++) {
    const depth = 120 + hash(i) * 440;
    const spread = 0.28 + (depth / 600) * 0.62;
    const x = 450 + (hash(i + 40) - 0.5) * 2 * 260 * spread + Math.sin(t * 0.4 + i * 1.7) * 14;
    const y = TUBE.y + 20 + ((depth + t * (6 + hash(i + 9) * 8)) % 520);
    const on = Math.sin(t * 1.3 + i * 2.1) > -0.4;
    if (!on) continue;
    pixelRect(ctx, Math.round(x / G) * G, Math.round(y / G) * G, G, G, i % 3 === 0 ? lit : dim);
  }
}
