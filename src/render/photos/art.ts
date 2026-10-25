import { THEATERS } from '../../data/theaters';
import { photoKey, POLAROID, type PhotoSpec } from '../../game/photos';
import { toCanvas } from '../pixel/post';
import { Pix } from '../pixel/raster';
import { drawGround } from './ground';
import { jetLayer, type JetPose, type JetShot } from './jet';
import { paintBoss, paintCarrier } from './props';
import { paintSky } from './sky';

// Picture wall (doc 32): one generated photo per cleared mission — sky, the theater's ground in perspective, the
// boss or our carrier in the background, the pilot's jet (and a wingman) in front, a dithered vignette — rendered
// once into a 200 × 132 canvas and cached by everything it shows (photoKey). The composition comes from the
// mission number, so a photo never changes unless its inputs do.

export const PHOTO_W = POLAROID.photoW;
export const PHOTO_H = POLAROID.photoH;
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

interface Composition { horizon: number; facing: 1 | -1; jets: JetShot[] }

function compose(spec: PhotoSpec): Composition {
  const v = (spec.number - 1) % 4;
  const facing: 1 | -1 = v % 2 === 0 ? 1 : -1;
  const horizon = [82, 86, 92, 78][v] ?? 82;
  const y = [50, 54, 46, 46][v] ?? 50;
  const pitch = [0.06, -0.04, 0.12, 0.02][v] ?? 0;
  const lead: JetPose = { x: 100 + facing * 8, y, length: 96, pitch, facing };
  const jets: JetShot[] = [];
  if (spec.scene === 'wingman') {
    jets.push({ plane: 'f16', livery: 'standard', pose: { x: 100 - facing * 50, y: y - 24, length: 54, pitch, facing } });
  }
  jets.push({ plane: spec.plane, livery: spec.livery, pose: lead });
  return { horizon, facing, jets };
}

/** Darkened corners and a faint warm print cast, dithered. */
function vignette(g: CanvasRenderingContext2D): void {
  const img = g.getImageData(0, 0, PHOTO_W, PHOTO_H);
  const px = img.data;
  for (let r = 0; r < PHOTO_H; r++) {
    for (let c = 0; c < PHOTO_W; c++) {
      const dx = (c + 0.5) / (PHOTO_W / 2) - 1;
      const dy = (r + 0.5) / (PHOTO_H / 2) - 1;
      const f = dx * dx * 0.8 + dy * dy;
      const dark = Math.max(0, Math.min(0.5, (f - 0.7) * 0.5));
      const step = Math.floor(dark * 6 + (BAYER[(r & 3) * 4 + (c & 3)] ?? 0) / 16) / 6;
      const i = (r * PHOTO_W + c) * 4;
      for (let k = 0; k < 3; k++) px[i + k] = ((px[i + k] ?? 0) * 0.95 + (k === 0 ? 9 : k === 1 ? 5 : 0)) * (1 - step);
    }
  }
  g.putImageData(img, 0, 0);
}

function render(spec: PhotoSpec): HTMLCanvasElement | null {
  const c = compose(spec);
  const seed = spec.number * 7919 + THEATERS[spec.theater].index * 131;
  const p = new Pix(PHOTO_W, PHOTO_H, 1, 0, 0);
  paintSky(p, spec.time, c.horizon, c.facing, seed);
  const out = toCanvas(p);
  const g = out?.getContext('2d', { willReadFrequently: true });
  if (!out || !g) return null;
  drawGround(g, PHOTO_W, PHOTO_H, c.horizon, { theater: spec.theater, seed, time: spec.time, facing: c.facing });
  const back = new Pix(PHOTO_W, PHOTO_H, 1, 0, 0);
  const view = { horizon: c.horizon, time: spec.time, facing: c.facing };
  if (spec.boss) paintBoss(back, spec.boss, view);
  else if (spec.scene === 'carrier') paintCarrier(back, view);
  const backArt = toCanvas(back);
  if (backArt) g.drawImage(backArt, 0, 0);
  const jets = jetLayer(PHOTO_W, PHOTO_H, c.jets, spec.time, seed);
  if (jets) g.drawImage(jets, 0, 0);
  vignette(g);
  return out;
}

const MAX = 40;
const cache = new Map<string, HTMLCanvasElement | null>();

/** The photo's art: cached, or rendered now when `build` is true (the caller limits how many per frame). */
export function photoArt(spec: PhotoSpec, build: boolean, key = photoKey(spec)): HTMLCanvasElement | null {
  const hit = cache.get(key);
  if (hit !== undefined) return hit;
  if (!build) return null;
  const art = render(spec);
  cache.set(key, art);
  if (cache.size > MAX) {
    const oldest = cache.keys().next();
    if (!oldest.done) cache.delete(oldest.value);
  }
  return art;
}

/** True when the photo is ready to draw without building it. */
export const photoReady = (spec: PhotoSpec, key = photoKey(spec)): boolean => cache.has(key);
