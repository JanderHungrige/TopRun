import type { LiveryId } from '../../data/liveries';
import type { PlaneId } from '../../data/types';
import { drawPlaneSide } from '../draw-planes-side';
import { makeCanvas } from '../pixel/post';
import { pixelize } from '../pixel/quantize';
import { JET } from './layout';

// Hangar base (doc 30): the pilot's selected jet parked in the hangar — the side-view art in its paint job
// (doc 09), fitted into the JET box with the main gear on the floor line, tinted towards the hangar's dusk light
// and turned into clean pixel art (doc 20 quantiser) at the scene's art grid. Cached per plane × livery × grid.

interface Bounds { x0: number; y0: number; x1: number; y1: number }

/** The jet sprite and where its art pixel (0, 0) goes on the scene's art grid. */
export interface JetSprite { canvas: HTMLCanvasElement; c: number; r: number }

const MEASURE = 4;
const measured = new Map<PlaneId, Bounds>();

/** The side view's extent in plane units (origin = main-gear contact), measured once from the drawing. */
function extent(id: PlaneId): Bounds {
  const hit = measured.get(id);
  if (hit) return hit;
  const w = 900;
  const h = 420;
  const c = makeCanvas(w, h);
  const g = c.getContext('2d', { willReadFrequently: true });
  let b: Bounds = { x0: -70, y0: -55, x1: 70, y1: 2 };
  if (g) {
    drawPlaneSide(g, id, w / 2, h - 60, MEASURE, { gear: 1 });
    const data = g.getImageData(0, 0, w, h).data;
    let x0 = w;
    let y0 = h;
    let x1 = 0;
    let y1 = 0;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if ((data[(y * w + x) * 4 + 3] ?? 0) < 110) continue;
        x0 = Math.min(x0, x);
        x1 = Math.max(x1, x);
        y0 = Math.min(y0, y);
        y1 = Math.max(y1, y);
      }
    }
    if (x1 > x0) b = { x0: (x0 - w / 2) / MEASURE, x1: (x1 + 1 - w / 2) / MEASURE, y0: (y0 - (h - 60)) / MEASURE, y1: (y1 + 1 - (h - 60)) / MEASURE };
  }
  measured.set(id, b);
  return b;
}

/** The hangar lamps catch the top of the airframe: the first body pixel under the outline, per column, warmed. */
function rimLight(rgba: Uint8ClampedArray, w: number, h: number): void {
  const LIGHT = [255, 214, 160];
  for (let c = 0; c < w; c++) {
    let r = 0;
    while (r < h && (rgba[(r * w + c) * 4 + 3] ?? 0) === 0) r++;
    const i = ((r + 1) * w + c) * 4;
    if (r + 1 >= h || (rgba[i + 3] ?? 0) === 0) continue;
    for (let k = 0; k < 3; k++) rgba[i + k] = Math.round((rgba[i + k] ?? 0) * 0.55 + (LIGHT[k] ?? 0) * 0.45);
  }
}

function capture(id: PlaneId, livery: LiveryId, G: number): JetSprite | null {
  const b = extent(id);
  const scale = Math.min(JET.w / (b.x1 - b.x0), JET.h / (b.y1 - b.y0));
  const k = scale / G;
  const w = Math.ceil((b.x1 - b.x0) * k) + 4;
  const h = Math.ceil((b.y1 - b.y0) * k) + 4;
  const ox = 2 - b.x0 * k;
  const oy = 2 - b.y0 * k;
  const canvas = makeCanvas(w, h);
  const g = canvas.getContext('2d', { willReadFrequently: true });
  if (!g) return null;
  drawPlaneSide(g, id, ox, oy, k, { gear: 1, livery, t: 0, throttle: 0 });
  g.globalCompositeOperation = 'source-atop';
  g.fillStyle = 'rgba(44,34,96,0.2)';
  g.fillRect(0, 0, w, h);
  g.fillStyle = 'rgba(255,190,120,0.08)';
  g.fillRect(0, 0, w, h * 0.45);
  g.globalCompositeOperation = 'source-over';
  const img = g.getImageData(0, 0, w, h);
  pixelize(img.data, w, h);
  rimLight(img.data, w, h);
  g.putImageData(img, 0, 0);
  const midX = (b.x0 + b.x1) / 2;
  return { canvas, c: Math.round(JET.cx / G - (ox + midX * k)), r: Math.round(JET.ground / G - oy) };
}

const sprites = new Map<string, JetSprite | null>();

/** The parked jet for a grid (G logical px per art px), cached. */
export function jetSprite(id: PlaneId, livery: LiveryId, G: number): JetSprite | null {
  const key = `${id}|${livery}|${G.toFixed(4)}`;
  if (!sprites.has(key)) {
    if (sprites.size >= 6) sprites.clear();
    sprites.set(key, capture(id, livery, G));
  }
  return sprites.get(key) ?? null;
}

/** Main-gear contact x on the art grid (for the wheel chocks). */
export function jetGearCol(id: PlaneId, G: number): number {
  const b = extent(id);
  const scale = Math.min(JET.w / (b.x1 - b.x0), JET.h / (b.y1 - b.y0));
  return Math.round((JET.cx - ((b.x0 + b.x1) / 2) * scale) / G);
}
