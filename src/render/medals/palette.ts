import type { MedalMetal } from '../../data/medals';
import { makeCanvas } from '../pixel/post';
import type { Pix } from '../pixel/raster';

// Medal art (doc 25): a local palette, so every ribbon colour from data/medals.ts keeps its exact hex. Each
// colour gets a hue-shifted ramp like the master palette (shadows lean violet, lights warm); the metals are
// hand-tuned ramps. Pix buffers painted with these indices are rendered with this module's toCanvas/outline.

/** Palette indices of one ramp: [ink, deep shadow, shadow, base, light, highlight(, specular)]. */
export type Ramp = readonly number[];
export const INK = 0;
export const D2 = 1;
export const D1 = 2;
export const BASE = 3;
export const L1 = 4;
export const L2 = 5;
/** Metals only: the specular white-hot pixel. */
export const L3 = 6;

const colours: number[] = [0];
const inkOf: number[] = [0];
const byHex = new Map<string, Ramp>();

function pack(hex: string): number {
  const n = Number.parseInt(hex.slice(1), 16);
  return ((255 << 24) | ((n & 255) << 16) | (((n >> 8) & 255) << 8) | ((n >> 16) & 255)) >>> 0;
}

function addRamp(hexes: readonly string[]): Ramp {
  const first = colours.length;
  return hexes.map((h) => {
    colours.push(pack(h));
    inkOf.push(first);
    return colours.length - 1;
  });
}

interface Hsl { h: number; s: number; l: number }

function toHsl(hex: string): Hsl {
  const n = Number.parseInt(hex.slice(1), 16);
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return { h: 0, s: 0, l };
  const s = d / (1 - Math.abs(2 * l - 1));
  const h = max === r ? ((g - b) / d + 6) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return { h: h * 60, s, l };
}

function toHex({ h, s, l }: Hsl): string {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  const byte = (v: number): string => Math.round(Math.max(0, Math.min(1, v + m)) * 255).toString(16).padStart(2, '0');
  return `#${byte(r)}${byte(g)}${byte(b)}`;
}

/** Moves hue `h` towards `target` by up to `deg` degrees the short way round. */
function toward(h: number, target: number, deg: number): number {
  const diff = ((target - h + 540) % 360) - 180;
  return (h + Math.sign(diff) * Math.min(Math.abs(diff), deg) + 360) % 360;
}

const clamp01 = (v: number): number => Math.max(0, Math.min(1, v));

/** The shading ramp of one ribbon / enamel colour; the base keeps the exact hex. */
export function hexRamp(hex: string): Ramp {
  const hit = byHex.get(hex);
  if (hit) return hit;
  const c = toHsl(hex);
  const grey = c.s < 0.08;
  const shade = (dl: number, ds: number, deg: number): string => toHex({
    h: grey ? 235 : toward(c.h, 255, deg), s: clamp01(grey ? 0.1 + ds : c.s + ds), l: clamp01(c.l + dl),
  });
  const light = (dl: number, ds: number, deg: number): string => toHex({
    h: grey ? 45 : toward(c.h, 50, deg), s: clamp01(grey ? 0.08 : c.s + ds), l: clamp01(c.l + dl),
  });
  const ink = toHex({ h: toward(c.h, 260, 30), s: 0.45, l: Math.min(0.1, c.l * 0.3) });
  const ramp = addRamp([ink, shade(-0.27, 0.06, 22), shade(-0.14, 0.04, 11), hex, light(0.11, -0.04, 8), light(0.22, -0.1, 14)]);
  byHex.set(hex, ramp);
  return ramp;
}

/** Gold, silver and bronze: [ink, deep, shadow, base, light, highlight, specular]. */
export const METAL: Readonly<Record<MedalMetal, Ramp>> = {
  gold: addRamp(['#2a1604', '#5c380c', '#915e18', '#c88c28', '#e8b440', '#f8da72', '#fff6c8']),
  silver: addRamp(['#161a24', '#3a4252', '#646e80', '#9098aa', '#bac2ce', '#dfe5ec', '#ffffff']),
  bronze: addRamp(['#200e06', '#4a2410', '#7a4220', '#a86436', '#c98650', '#e6ae7a', '#fbdcb0']),
};

/** 1-px selective outline into transparent pixels touching the art, in the neighbouring colour's ramp ink. */
export function outline(p: Pix): void {
  const { w, h } = p;
  const src = p.data.slice();
  for (let r = 0; r < h; r++) {
    for (let c = 0; c < w; c++) {
      const i = r * w + c;
      if (src[i]) continue;
      const n = (c > 0 ? src[i - 1] : 0) || (c < w - 1 ? src[i + 1] : 0) || (r > 0 ? src[i - w] : 0) || (r < h - 1 ? src[i + w] : 0) || 0;
      if (n) p.data[i] = inkOf[n] ?? 0;
    }
  }
}

/** Renders a buffer painted with medal palette indices. */
export function toCanvas(p: Pix): HTMLCanvasElement | null {
  const canvas = makeCanvas(p.w, p.h);
  const g = canvas.getContext('2d');
  if (!g) return null;
  const img = g.createImageData(p.w, p.h);
  const out = new Uint32Array(img.data.buffer);
  for (let i = 0; i < p.data.length; i++) out[i] = colours[p.data[i] ?? 0] ?? 0;
  g.putImageData(img, 0, 0);
  return canvas;
}

/** Number of colours in the medal palette (tests). */
export const paletteSize = (): number => colours.length;
