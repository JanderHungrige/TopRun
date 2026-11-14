import type { CampaignId } from '../data/types';
import { WINDOW } from '../game/intro';

// Duke's welcome film (doc 97): the generated key frames (320 × 180 art) drawn at 5 logical px per art px, so the screen
// shows a 256 × 144 window that pans over the plate in whole logical px, and each world's overlay on the same coarse
// grid — rain at the second front, snow in the mountains, bubbles under the sea, specks of starlight in space, fireflies and spores in the jungle, dust
// drifting over the steppe.

type Ctx = CanvasRenderingContext2D;

const FILES = import.meta.glob<string>('../assets/intros/*.png', { eager: true, query: '?url', import: 'default' });
const images = new Map<string, HTMLImageElement>();
const SHOTS = ['a', 'b', 'c', 'd'] as const;
const PX = WINDOW.scale;

function image(world: CampaignId, shot: number): HTMLImageElement | null {
  const key = `i${world}${SHOTS[shot] ?? 'a'}`;
  const cached = images.get(key);
  if (cached) return cached;
  const url = FILES[`../assets/intros/${key}.png`];
  if (!url || typeof Image === 'undefined') return null;
  const img = new Image();
  img.src = url;
  images.set(key, img);
  return img;
}

const ready = (img: HTMLImageElement | null): img is HTMLImageElement => !!img && img.complete && img.naturalWidth > 0;

/** Starts loading a world's four plates. */
export function preloadIntro(world: CampaignId): void {
  for (let s = 0; s < SHOTS.length; s++) image(world, s);
}

/** A shot over the whole screen, its window's top-left at `cam` (art px), hard pixel edges. */
export function drawIntroShot(ctx: Ctx, world: CampaignId, shot: number, cam: { x: number; y: number }, alpha: number): void {
  const img = image(world, shot);
  if (!ready(img)) return;
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.globalAlpha = alpha;
  ctx.drawImage(img, -Math.round(cam.x * PX), -Math.round(cam.y * PX), img.naturalWidth * PX, img.naturalHeight * PX);
  ctx.restore();
}

/** A world's first shot fitted into a rectangle (the TV's screen); false while it is not loaded. */
export function drawIntroPlate(ctx: Ctx, world: CampaignId, r: { x: number; y: number; w: number; h: number }): boolean {
  const img = image(world, 0);
  if (!ready(img)) return false;
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(img, r.x, r.y, r.w, r.h);
  ctx.restore();
  return true;
}

const hash = (n: number): number => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};
const snap = (v: number): number => Math.round(v / PX) * PX;

/** One drifting particle field: count, colour, size in grid px, how it moves (px per s), how far it sways. */
interface Field { n: number; colour: (i: number, t: number) => string; size: number; vx: number; vy: number; sway: number }

const FIELDS: Readonly<Record<number, Field>> = {
  2: { n: 60, colour: () => 'rgba(200,215,230,0.55)', size: 1, vx: -40, vy: 260, sway: 0 },
  3: { n: 70, colour: () => 'rgba(240,246,255,0.85)', size: 1, vx: -14, vy: 46, sway: 10 },
  4: { n: 40, colour: () => 'rgba(190,240,255,0.55)', size: 1, vx: 0, vy: -38, sway: 6 },
  5: { n: 46, colour: (i, t) => `rgba(220,235,255,${(0.25 + 0.6 * Math.max(0, Math.sin(t * 1.7 + i))).toFixed(2)})`, size: 1, vx: -6, vy: 0, sway: 2 },
  6: { n: 34, colour: (i, t) => (i % 3 === 0 ? 'rgba(220,200,255,0.5)' : `rgba(210,255,120,${(0.3 + 0.7 * Math.max(0, Math.sin(t * 2.3 + i * 1.7))).toFixed(2)})`), size: 1, vx: 4, vy: -8, sway: 14 },
  7: { n: 60, colour: (i) => (i % 4 === 0 ? 'rgba(255,236,190,0.55)' : 'rgba(214,180,120,0.4)'), size: 1, vx: 34, vy: 3, sway: 6 },
};

/** The world's drifting overlay over the whole screen. */
export function drawIntroOverlay(ctx: Ctx, world: CampaignId, t: number): void {
  const f = FIELDS[world];
  if (!f) return;
  for (let i = 0; i < f.n; i++) {
    const x = (((hash(i) * 1400 + t * f.vx * (0.6 + hash(i * 7))) % 1400) + 1400) % 1400 - 60 + Math.sin(t * 1.3 + i) * f.sway;
    const y = (((hash(i * 3) * 800 + t * f.vy * (0.6 + hash(i * 11))) % 800) + 800) % 800 - 40;
    ctx.fillStyle = f.colour(i, t);
    ctx.fillRect(snap(x), snap(y), f.size * PX, f.size * PX);
  }
}
