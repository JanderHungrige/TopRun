import { CEREMONY_LAYERS, type LayerBox } from '../data/ceremony-layers';
import type { MedalId } from '../data/medals';
import type { HairColor } from '../game/avatar-look';
import { pilotCutout, type AdmiralPose, type PilotBase, type PilotPose, type SkinTone, type StagePlan } from '../game/ceremony-stage';
import { drawMedal, drawRibbonBar } from './medals';
import { deviceScale, scratch } from './pixel/blit';
import { makeCanvas } from './pixel/post';

// Medal ceremony (doc 25), layered image version: the key frame's empty deck (with the crew row's saluting overlay
// when they salute) and the pilot and admiral cut-outs on top, composed on the 320 × 180 art grid (4 logical px per
// art px) and blitted once. The pilot's skin and hair are recoloured to the player's look; a few gulls glide by.

/** A cut-out's name in the layer table (camelCase of its file). */
type Key = string;
const LAYERS: Readonly<Record<Key, LayerBox>> = CEREMONY_LAYERS;
/** A cut-out's box, or undefined while the layer pipeline has not produced it. */
const boxOf = (key: Key): LayerBox | undefined => LAYERS[key];

/** The art grid: D device px = G logical px per art px (G is always 4). */
export interface StageGrid { D: number; G: number }
export const ART_W = 320;
export const ART_H = 180;
/** Where the officers' shoes stand on the screen (logical px): just above the letterbox's bottom bar. */
const FEET_Y = 676;

const FILES = import.meta.glob<string>('../assets/ceremony/*.png', { eager: true, query: '?url', import: 'default' });
const urlOf = (file: string): string | undefined => FILES[`../assets/ceremony/${file}.png`];

const ADMIRAL: Readonly<Record<AdmiralPose, Key>> = {
  walkA: 'admiralWalkA', walkB: 'admiralWalkB', stand: 'admiralStand', pin: 'admiralPin', salute: 'admiralSalute',
};
/** The player's skin (two tones) and hair, dark → light, that the cut-out's own skin / hair colours are mapped onto. */
const SKIN: Readonly<Record<SkinTone, readonly string[]>> = {
  light: ['#8a4f3c', '#c47e62', '#e8a888', '#f6cdb0'],
  dark: ['#2a160e', '#4a2a1c', '#6a4230', '#8a5e44'],
};
const HAIR: Readonly<Record<HairColor, readonly string[]>> = {
  black: ['#120e12', '#221c24', '#363038'],
  brown: ['#3a2416', '#6a4428', '#946238'],
  blond: ['#7a5a22', '#b48c38', '#e2c06a'],
  red: ['#561e10', '#86361a', '#b8562a'],
};

const images = new Map<string, HTMLImageElement>();

function image(file: string): HTMLImageElement | null {
  const url = urlOf(file);
  if (!url || typeof Image === 'undefined') return null;
  let img = images.get(url);
  if (!img) {
    img = new Image();
    img.src = url;
    images.set(url, img);
  }
  return img.complete && img.naturalWidth > 0 ? img : null;
}

/** Starts loading every layer (the scene's constructor), so the first frame has them. */
export function preloadStage(): void {
  image('plate');
  for (const box of Object.values(LAYERS)) image(box.file);
}

const rgbOf = (hex: string): number => parseInt(hex.slice(1), 16);

/** Recolours the masked pixels: each one's colour by its rank in `from` (dark → light) onto the same rank of `to`. */
function remap(px: Uint8ClampedArray, w: number, at: readonly number[] | undefined, from: readonly string[] | undefined, to: readonly string[]): void {
  if (!at || !from || from.length === 0) return;
  const rank = new Map(from.map((hex, i) => [rgbOf(hex), i]));
  for (let k = 0; k + 1 < at.length; k += 2) {
    const i = ((at[k + 1] ?? 0) * w + (at[k] ?? 0)) * 4;
    const r = rank.get(((px[i] ?? 0) << 16) | ((px[i + 1] ?? 0) << 8) | (px[i + 2] ?? 0));
    if (r === undefined) continue;
    const pos = from.length === 1 ? to.length - 1 : Math.round((r * (to.length - 1)) / (from.length - 1));
    const c = rgbOf(to[pos] ?? '#000000');
    px[i] = c >> 16;
    px[i + 1] = (c >> 8) & 255;
    px[i + 2] = c & 255;
  }
}

const recoloured = new Map<string, HTMLCanvasElement>();

/** The pilot cut-out with the player's skin and hair (cached per cut-out × look). */
function pilotCanvas(key: Key, skin: SkinTone, hair: HairColor): HTMLCanvasElement | HTMLImageElement | null {
  const box = boxOf(key);
  const img = box ? image(box.file) : null;
  if (!box) return null;
  if (!img) return null;
  const id = `${key}|${skin}|${hair}`;
  const hit = recoloured.get(id);
  if (hit) return hit;
  const c = makeCanvas(img.naturalWidth, img.naturalHeight, null);
  const g = c.getContext('2d', { willReadFrequently: true });
  if (!g) return img;
  g.drawImage(img, 0, 0);
  const data = g.getImageData(0, 0, c.width, c.height);
  remap(data.data, c.width, box.skinPx, box.skin, SKIN[skin]);
  remap(data.data, c.width, box.hairPx, box.hair, HAIR[hair]);
  g.putImageData(data, 0, 0);
  recoloured.set(id, c);
  return c;
}

/**
 * Exactly 4 logical px per art px, so the 320 × 180 picture always frames like the key frame. Device px per art px
 * may be fractional (nearest-neighbour, hard edges): at this chunkiness that is invisible, while rounding to whole
 * device px zoomed or shrank the picture by up to a fifth on small windows.
 */
export function stageGrid(ctx: CanvasRenderingContext2D): StageGrid {
  return { D: 4 * deviceScale(ctx), G: 4 };
}
/** Art px the picture moves up so the shoes land on FEET_Y. */
const liftOf = (gr: StageGrid): number => CEREMONY_LAYERS.admiralPin.footY - Math.round(FEET_Y / gr.G);

/** Where a cut-out goes so its foot lands on (footX, footY) of the art grid. */
const placed = (box: LayerBox, footX: number, footY: number): [number, number] => [footX - (box.footX - box.x), footY - (box.footY - box.y)];

/** The pilot stands where the grown-up pilot stood in the key frame; the admiral's feet are on his pin line. */
const PILOT_FOOT = CEREMONY_LAYERS.pilotAdultMaleShortAttention;
const ADMIRAL_FOOT_Y = CEREMONY_LAYERS.admiralPin.footY;

const pilotKey = (base: PilotBase, pose: PilotPose): Key => pilotCutout(base, pose, (k) => boxOf(k) !== undefined);

/** The pilot's chest point (art px of the key frame) for a base: where ribbons and medals go. */
export function chestPoint(base: PilotBase): { x: number; y: number } {
  const box = boxOf(pilotKey(base, 'attention')) ?? PILOT_FOOT;
  const [x, y] = placed(box, PILOT_FOOT.footX, PILOT_FOOT.footY);
  return { x: x + ((box.chestX ?? box.x) - box.x), y: y + ((box.chestY ?? box.y) - box.y) };
}

function gulls(g: CanvasRenderingContext2D, t: number): void {
  g.fillStyle = '#2a2234';
  for (let i = 0; i < 3; i++) {
    const x = Math.round(((t * (6 + i * 2) + i * 97) % 360) - 20);
    const y = Math.round(22 + i * 9 + Math.sin(t * 0.8 + i) * 3);
    const flap = Math.floor(t * 4 + i) % 2;
    g.fillRect(x - 2, y - flap, 2, 1);
    g.fillRect(x + 1, y - flap, 2, 1);
    g.fillRect(x, y, 1, 1);
  }
}

export interface StageView { plan: StagePlan; base: PilotBase; skin: SkinTone; hair: HairColor; t: number }

/** The whole scene stage on the 1280 × 720 frame; returns the grid (the card and medals draw on it). */
export function drawStage(ctx: CanvasRenderingContext2D, v: StageView): StageGrid {
  const gr = stageGrid(ctx);
  const sc = scratch(ART_W, ART_H);
  const plate = image('plate');
  if (!sc || !plate) return gr;
  const g = sc.g;
  g.clearRect(0, 0, ART_W, ART_H);
  g.drawImage(plate, 0, 0);
  const crew = v.plan.crewSalute ? boxOf('crewSalute') : undefined;
  const crewImg = crew ? image(crew.file) : null;
  if (crew && crewImg) g.drawImage(crewImg, crew.x, crew.y);
  gulls(g, v.t);
  const pk = pilotKey(v.base, v.plan.pilot);
  const pilot = pilotCanvas(pk, v.skin, v.hair);
  const pbox = boxOf(pk);
  if (pilot && pbox) g.drawImage(pilot, ...placed(pbox, PILOT_FOOT.footX, PILOT_FOOT.footY));
  const abox = boxOf(ADMIRAL[v.plan.admiral]) ?? boxOf(ADMIRAL.stand);
  const admiral = abox ? image(abox.file) : null;
  if (admiral && abox) g.drawImage(admiral, ...placed(abox, v.plan.admiralX, ADMIRAL_FOOT_Y));
  const m = ctx.getTransform();
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  const ox = m.a ? (Math.round(m.e) - m.e) / m.a : 0;
  const oy = m.d ? (Math.round(m.f) - m.f) / m.d : 0;
  ctx.drawImage(sc.canvas, ox, oy - liftOf(gr) * gr.G, ART_W * gr.G, ART_H * gr.G);
  ctx.restore();
  return gr;
}

/**
 * Earlier medals as a short ribbon stack at the front of the pilot's chest (rows of one art px, upwards), the
 * medals pinned today hanging below it, side by side going back along the chest.
 */
export function drawChest(ctx: CanvasRenderingContext2D, gr: StageGrid, base: PilotBase, earlier: readonly MedalId[], pinned: readonly MedalId[]): void {
  const G = gr.G;
  const c = chestPoint(base);
  const x = c.x * G;
  const y = (c.y - liftOf(gr)) * G;
  earlier.slice(0, 6).forEach((id, i) => drawRibbonBar(ctx, id, x - 3 * G, y - (i + 1) * G, 3 * G, G, { px: G }));
  pinned.forEach((id, i) => drawMedal(ctx, id, x - G - i * 3 * G, y + G, 6 * G, { px: G }));
}

/** Where the newest pinned medal hangs (logical px), for the sparkle. */
export function pinSpot(gr: StageGrid, base: PilotBase, count: number): { x: number; y: number } {
  const c = chestPoint(base);
  return { x: (c.x - 1 - (count - 1) * 3) * gr.G, y: (c.y - liftOf(gr) + 3) * gr.G };
}
