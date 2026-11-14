import type { LiveryId } from '../data/liveries';
import type { CampaignId, PlaneId } from '../data/types';
import { PLANES } from '../data/planes';
import { drawPlaneSide } from './draw-planes-side';

// A world's celebration (doc 64): the generated key frames (320 × 180 art, 4 logical px per art px) and the overlays
// drawn on the same grid — fireworks, confetti and the player's own craft flying past, pixelated to match.

type Ctx = CanvasRenderingContext2D;

export const ART = 4;
const FILES = import.meta.glob<string>('../assets/finales/*.png', { eager: true, query: '?url', import: 'default' });
const images = new Map<string, HTMLImageElement>();

const SHOTS = ['a', 'b', 'c'] as const;
const keyOf = (world: CampaignId, shot: number): string => `w${world}${SHOTS[shot] ?? 'a'}`;

function image(key: string): HTMLImageElement | null {
  const cached = images.get(key);
  if (cached) return cached;
  const url = FILES[`../assets/finales/${key}.png`];
  if (!url || typeof Image === 'undefined') return null;
  const img = new Image();
  img.src = url;
  images.set(key, img);
  return img;
}

/** Starts loading a world's three plates. */
export function preloadWorld(world: CampaignId): void {
  for (let s = 0; s < SHOTS.length; s++) image(keyOf(world, s));
}

/** A plate into a rectangle (the whole screen, or the TV's screen), hard pixel edges. */
export function drawPlate(ctx: Ctx, world: CampaignId, shot: number, alpha: number, r = { x: 0, y: 0, w: 1280, h: 720 }): boolean {
  const img = image(keyOf(world, shot));
  if (!img || !img.complete || img.naturalWidth === 0) return false;
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.globalAlpha = alpha;
  ctx.drawImage(img, r.x, r.y, r.w, r.h);
  ctx.restore();
  return true;
}

const hash = (n: number): number => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};
const snap = (v: number): number => Math.round(v / ART) * ART;

/** Each world's firework colours. */
const SPARKS: Readonly<Record<CampaignId, readonly string[]>> = {
  1: ['#ffd25a', '#ff7a5a', '#fff4d0', '#6fa8ee'],
  2: ['#c27bff', '#ffd25a', '#5fe3ff', '#ff5a8a'],
  3: ['#ff8a3d', '#ffd84a', '#98ff8a', '#fff4d0'],
  4: ['#5ff0e0', '#ffd25a', '#ff8a78', '#e8fbff'],
  5: ['#5fe3ff', '#ff6a8a', '#b088e8', '#fff4d0'],
  6: ['#c8ff6a', '#ffd25a', '#ff7ad2', '#6affd0'],
  7: ['#ffcf5a', '#c77dff', '#ff8a3d', '#fff4d0'],
};

/** Bursts launched every 0.55 s at hash-picked spots in the sky; rays fall a little and fade. Under the sea (world 4's
 *  first shot, docs 72, 74) the bursts are rings of bubbles that rise and wobble. */
export function drawFireworks(ctx: Ctx, world: CampaignId, t: number, shot = 0): void {
  if (world === 4 && shot === 0) return bubbleBursts(ctx, t);
  const colours = SPARKS[world];
  for (let i = Math.max(0, Math.floor((t - 1.6) / 0.55)); i <= Math.floor(t / 0.55); i++) {
    const age = t - i * 0.55;
    if (age < 0 || age > 1.6) continue;
    const cx = 140 + hash(i * 3.1) * 1000;
    const cy = 70 + hash(i * 7.7) * 200;
    const colour = colours[i % colours.length] ?? '#fff';
    ctx.fillStyle = colour;
    ctx.globalAlpha = Math.max(0, 1 - age / 1.6);
    for (let k = 0; k < 16; k++) {
      const a = (k / 16) * Math.PI * 2 + i;
      const d = age * (110 + hash(i + k) * 40);
      ctx.fillRect(snap(cx + Math.cos(a) * d), snap(cy + Math.sin(a) * d + age * age * 30), ART, ART);
    }
    ctx.fillRect(snap(cx), snap(cy), ART * 2, ART * 2);
  }
  ctx.globalAlpha = 1;
}

function bubbleBursts(ctx: Ctx, t: number): void {
  ctx.strokeStyle = '#e8fbff';
  ctx.lineWidth = ART / 2;
  for (let i = Math.max(0, Math.floor((t - 2.4) / 0.55)); i <= Math.floor(t / 0.55); i++) {
    const age = t - i * 0.55;
    if (age < 0 || age > 2.4) continue;
    const cx = 140 + hash(i * 3.1) * 1000;
    const cy = 200 + hash(i * 7.7) * 260 - age * 60;
    ctx.globalAlpha = Math.max(0, 1 - age / 2.4);
    for (let k = 0; k < 10; k++) {
      const a = (k / 10) * Math.PI * 2 + i;
      const d = Math.min(1, age * 2) * (60 + hash(i + k) * 30);
      const r = ART * (1 + (k % 3) * 0.5);
      ctx.strokeRect(snap(cx + Math.cos(a) * d + Math.sin(t * 4 + k) * 4), snap(cy + Math.sin(a) * d - age * age * 20), r, r);
    }
  }
  ctx.globalAlpha = 1;
}

const CONFETTI = ['#ffd25a', '#ff5a5a', '#5fe3ff', '#98ff8a', '#ffffff', '#c27bff'];

export function drawConfetti(ctx: Ctx, t: number): void {
  for (let i = 0; i < 90; i++) {
    const x = hash(i) * 1280 + Math.sin(t * 2 + i) * 18;
    const y = ((t * (60 + hash(i * 3) * 60) + hash(i * 5) * 760) % 780) - 40;
    ctx.fillStyle = CONFETTI[i % CONFETTI.length] ?? '#fff';
    ctx.fillRect(snap(x), snap(y), ART, Math.sin(t * 6 + i) > 0 ? ART * 2 : ART);
  }
}

let craftCanvas: HTMLCanvasElement | null = null;

/** The player's craft crossing the sky left to right (u 0…1), drawn at a quarter size and blown up: pixel art. A mech
 *  walks across the ground instead (doc 85), a tank or buggy drives across it (doc 110). */
export function drawFlyby(ctx: Ctx, plane: PlaneId, livery: LiveryId, u: number, t: number, paint: string | null = null): void {
  const W = 80;
  const H = 40;
  const kind = PLANES[plane].kind;
  const mech = kind === 'mech';
  const ground = mech || kind === 'tank';
  craftCanvas ??= document.createElement('canvas');
  craftCanvas.width = W;
  craftCanvas.height = H;
  const g = craftCanvas.getContext('2d');
  if (!g) return;
  g.clearRect(0, 0, W, H);
  if (mech) drawPlaneSide(g, plane, W / 2, H - 2, 0.42, { t, paint, stride: u * 14 });
  else if (ground) drawPlaneSide(g, plane, W / 2, H - 6, 0.42, { t: u * 20, livery });
  else drawPlaneSide(g, plane, W / 2, H / 2 + 4, 0.42, { gear: 0, t, livery, throttle: 1, pitch: 0.06 });
  const x = ground ? -200 + u * 1700 : -260 + u * 1800;
  const y = ground ? 600 : 210 - Math.sin(u * Math.PI) * 60;
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(craftCanvas, snap(x - (W * ART) / 2), snap(y - (H * ART) / 2), W * ART, H * ART);
  ctx.restore();
}
