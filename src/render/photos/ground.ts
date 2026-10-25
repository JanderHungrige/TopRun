import type { TimeOfDay } from '../../data/photo-looks';
import { THEATERS } from '../../data/theaters';
import type { TheaterId } from '../../data/types';
import { Terrain } from '../draw-terrain';
import { makeCanvas } from '../pixel/post';
import { hazeRgb, sunAt } from './sky';

// Picture wall (doc 32): the ground under the jet — the mission theater's own top-down terrain (base tile,
// islands, dunes, floes, mesas, the canyon) rendered small and laid out as a "mode 7" plane in perspective, one
// texture row per photo row, then lit for the time of day and hazed towards the horizon with ordered dithering.

const TEX_W = 320;
const TEX_H = 360;
/** Texture px across the bottom row of the photo (the near ground, magnified). */
const NEAR_W = 92;
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

let tex: { canvas: HTMLCanvasElement; g: CanvasRenderingContext2D } | null = null;

function terrainTexture(theater: TheaterId, seed: number): HTMLCanvasElement | null {
  if (!tex) {
    const canvas = makeCanvas(TEX_W, TEX_H);
    const g = canvas.getContext('2d');
    if (!g) return null;
    tex = { canvas, g };
  }
  const { g, canvas } = tex;
  g.setTransform(0.5, 0, 0, 0.5, 0, 0);
  g.clearRect(0, 0, 640, 720);
  new Terrain(THEATERS[theater], seed).renderGround(g);
  g.setTransform(1, 0, 0, 1, 0, 0);
  return canvas;
}

interface Light { mul: readonly [number, number, number]; add: readonly [number, number, number]; haze: number }

function lightOf(time: TimeOfDay): Light {
  switch (time) {
    case 'day': return { mul: [1, 1, 1], add: [0, 0, 0], haze: 0.75 };
    case 'dawn': return { mul: [0.82, 0.74, 0.8], add: [22, 8, 4], haze: 0.8 };
    case 'dusk': return { mul: [0.78, 0.6, 0.58], add: [26, 6, 0], haze: 0.8 };
    case 'night': return { mul: [0.24, 0.3, 0.46], add: [0, 2, 8], haze: 0.7 };
    case 'storm': return { mul: [0.5, 0.56, 0.6], add: [6, 8, 10], haze: 0.92 };
    default: throw new Error(`unhandled: ${time satisfies never}`);
  }
}

const dash = (a: number, b: number): number => {
  const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
  return s - Math.floor(s);
};

/** Depth 0 (bottom row) … 1 (the row just under the horizon). */
const depthOf = (row: number, horizon: number, h: number): number => {
  const zNear = 1 / (h - horizon);
  const zFar = 1 / 1.5;
  return Math.max(0, Math.min(1, (1 / (row - horizon + 0.5) - zNear) / (zFar - zNear)));
};

function project(g: CanvasRenderingContext2D, t: HTMLCanvasElement, w: number, h: number, horizon: number): void {
  g.imageSmoothingEnabled = false;
  for (let r = horizon; r < h; r++) {
    const d = depthOf(r, horizon, h);
    const sw = NEAR_W + (TEX_W - NEAR_W) * d;
    const ty = Math.min(TEX_H - 1, Math.max(0, Math.floor((TEX_H - 1) * (1 - d))));
    g.drawImage(t, (TEX_W - sw) / 2, ty, sw, 1, 0, r, w, 1);
  }
}

/** Light, sun glint on water and dithered haze over the ground rows. */
function finish(g: CanvasRenderingContext2D, w: number, h: number, horizon: number, time: TimeOfDay, sea: boolean, facing: 1 | -1): void {
  const img = g.getImageData(0, horizon, w, h - horizon);
  const px = img.data;
  const L = lightOf(time);
  const haze = hazeRgb(time);
  const sun = sunAt(time, horizon, facing);
  const glint = sea && (time === 'dawn' || time === 'dusk' || time === 'night');
  for (let r = 0; r < h - horizon; r++) {
    const d = depthOf(r + horizon, horizon, h);
    const a = Math.pow(d, 0.8) * L.haze;
    const half = 3 + (1 - d) * 26;
    for (let c = 0; c < w; c++) {
      const i = (r * w + c) * 4;
      const step = Math.min(4, Math.floor(a * 4 + (BAYER[(r & 3) * 4 + (c & 3)] ?? 0) / 16)) / 4;
      for (let k = 0; k < 3; k++) {
        const lit = (px[i + k] ?? 0) * (L.mul[k] ?? 1) + (L.add[k] ?? 0);
        px[i + k] = lit + ((haze[k] ?? 0) - lit) * step;
      }
      if (glint && r % 3 === 1 && Math.abs(c - sun.x) < half && dash(c >> 2, r) > 0.45 + Math.abs(c - sun.x) / (half * 2.2)) {
        px[i] = 255;
        px[i + 1] = time === 'night' ? 250 : 214;
        px[i + 2] = time === 'night' ? 230 : 150;
      }
    }
  }
  g.putImageData(img, 0, horizon);
}

/** Draws the ground plane from the horizon row down into the photo canvas. */
export function drawGround(g: CanvasRenderingContext2D, w: number, h: number, horizon: number, o: { theater: TheaterId; seed: number; time: TimeOfDay; facing: 1 | -1 }): void {
  const t = terrainTexture(o.theater, o.seed);
  if (!t) return;
  project(g, t, w, h, horizon);
  finish(g, w, h, horizon, o.time, THEATERS[o.theater].base === 'sea', o.facing);
}
