import type { ArtView } from '../pixel/bust';
import { hexOf, PAL } from '../pixel/palette';

/** Ramp slots (palette.ts): shadow, base, light. */
const D1 = 2;
const BASE = 3;
const L1 = 4;

/**
 * Overlays drawn on a composed portrait at its art resolution (docs 20, 33): the gold "selected" frame of the
 * pickers and the green radio feed (scanlines, flicker, a rolling bar, noise pixels, corner brackets, the REC dot).
 */

export function hash(n: number): number {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}

const GOLD = PAL.gold;

/** Pulsing gold pixel frame with a dithered inner glow and a twinkling corner star, in compose pixels. */
export function selectionFrame(g: CanvasRenderingContext2D, v: ArtView): void {
  const pulse = Math.sin(v.t * 4.2) > 0;
  g.fillStyle = hexOf(GOLD[BASE] ?? 0);
  const glow = Math.max(2, Math.round(v.W * 0.05));
  for (let i = 0; i < glow; i++) {
    for (let x = i % 2; x < v.W; x += pulse ? 2 : 3) {
      g.fillRect(x, 2 + i, 1, 1);
      g.fillRect(x, v.H - 3 - i, 1, 1);
    }
    for (let y = i % 2; y < v.H; y += pulse ? 2 : 3) {
      g.fillRect(2 + i, y, 1, 1);
      g.fillRect(v.W - 3 - i, y, 1, 1);
    }
  }
  g.fillStyle = hexOf(GOLD[D1] ?? 0);
  g.fillRect(0, 0, v.W, 1); g.fillRect(0, v.H - 1, v.W, 1); g.fillRect(0, 0, 1, v.H); g.fillRect(v.W - 1, 0, 1, v.H);
  g.fillStyle = hexOf((pulse ? GOLD[5] : GOLD[L1]) ?? 0);
  g.fillRect(1, 1, v.W - 2, 1); g.fillRect(1, v.H - 2, v.W - 2, 1); g.fillRect(1, 1, 1, v.H - 2); g.fillRect(v.W - 2, 1, 1, v.H - 2);
  const s = Math.floor(v.t * 3) % 3;
  const cx = v.W - 7;
  const cy = 6;
  g.fillStyle = hexOf(GOLD[5] ?? 0);
  g.fillRect(cx - 1 - s, cy, 3 + s * 2, 1);
  g.fillRect(cx, cy - 1 - s, 1, 3 + s * 2);
}

const GREEN_HI = hexOf(PAL.phosphor[5] ?? 0);
const GREEN_TOP = hexOf(PAL.phosphor[6] ?? 0);

/** The live radio feed over a portrait: scanlines, flicker, a rolling bar, noise pixels, corner brackets. */
export function radioFeed(g: CanvasRenderingContext2D, v: ArtView): void {
  g.fillStyle = 'rgba(0,18,12,0.38)';
  for (let y = 1; y < v.H; y += 2) g.fillRect(0, y, v.W, 1);
  g.fillStyle = `rgba(200,255,235,${(0.02 + hash(Math.floor(v.t * 14)) * 0.07).toFixed(3)})`;
  g.fillRect(0, 0, v.W, v.H);
  const band = Math.round(((v.t * 0.3) % 1) * v.H * 1.3 - v.H * 0.15);
  g.fillStyle = 'rgba(180,255,230,0.14)';
  g.fillRect(0, band, v.W, Math.max(2, Math.round(v.H * 0.1)));
  const f = Math.floor(v.t * 24);
  g.fillStyle = GREEN_TOP;
  for (let i = 0; i < 5; i++) g.fillRect(Math.floor(hash(f * 13 + i) * v.W), Math.floor(hash(f * 7 + i * 3.1) * v.H), 1, 1);
  const c = Math.max(3, Math.round(v.W * 0.16));
  g.fillStyle = GREEN_HI;
  for (const [x, y, sx, sy] of [[0, 0, 1, 1], [v.W - 1, 0, -1, 1], [0, v.H - 1, 1, -1], [v.W - 1, v.H - 1, -1, -1]] as const) {
    g.fillRect(sx > 0 ? x : x - c + 1, y, c, 1);
    g.fillRect(x, sy > 0 ? y : y - c + 1, 1, c);
  }
  if (Math.floor(v.t * 1.5) % 2 === 0) {
    g.fillStyle = '#ff5a44';
    g.fillRect(3, 3, 2, 2);
  }
}
