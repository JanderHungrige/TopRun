import type { BaseLight } from '../../game/base-light';
import { hash } from './paint';

// The lit looks' calm life (docs 91, 92), the carrier lounge and the helicopter base's hangar corner: dust motes drifting
// in the light, the hanging lamps glowing warm in the evening and at night, fairy lights twinkling, at night a few stars
// over the sky outside and on the carrier the hall's neon humming in the door. Drawn every frame in whole art pixels over
// the picture of the light.

type Ctx = CanvasRenderingContext2D;
type Rect = readonly [number, number, number, number];

/** Where a look's lights are (logical px). */
interface LitScene {
  lamps: ReadonlyArray<readonly [number, number]>;
  bulbs: ReadonlyArray<readonly [number, number]>;
  /** The night sky seen outside (x, y, w, h). */
  sky: Rect;
  /** A neon-lit hall seen through a door, or null. */
  neon: Rect | null;
}

export type LitLook = 'carrier' | 'heli';

const SCENES: Readonly<Record<LitLook, LitScene>> = {
  carrier: { lamps: [[470, 132], [655, 100], [866, 140]], bulbs: [], sky: [1060, 176, 150, 220], neon: [768, 240, 144, 244] },
  heli: {
    lamps: [[145, 80], [427, 160], [622, 210], [990, 88]],
    bulbs: [[40, 100], [100, 112], [160, 124], [220, 136], [280, 146], [340, 156], [400, 166], [460, 174], [520, 182], [580, 188], [760, 206], [840, 194], [920, 180], [1000, 166], [1080, 152], [1160, 140], [1220, 132]],
    sky: [850, 230, 310, 90],
    neon: null,
  },
};

function px(g: Ctx, c: number, r: number, w: number, h: number, color: string): void {
  g.fillStyle = color;
  g.fillRect(c, r, w, h);
}

/** A soft square glow, fading out. */
function glow(g: Ctx, c: number, r: number, size: number, rgb: string, a: number): void {
  for (let k = size; k > 0; k -= 1) {
    g.fillStyle = `rgba(${rgb},${((a * (size - k + 1)) / (size * 4)).toFixed(3)})`;
    g.fillRect(c - k, r - k, k * 2, k * 2);
  }
}

function stars(g: Ctx, G: number, t: number, [x, y, w, h]: Rect): void {
  for (let i = 0; i < 12; i++) {
    const a = Math.sin(t * (0.5 + hash(i * 4.1) * 0.9) + i * 2.1);
    if (a < 0.3) continue;
    px(g, Math.round((x + hash(i * 7.3) * w) / G), Math.round((y + hash(i * 2.9) * h) / G), 1, 1, `rgba(230,236,255,${(a * 0.7).toFixed(3)})`);
  }
}

/** A neon-lit hall flickering now and then, a faint pink and cyan breath over the door. */
function neonHum(g: Ctx, G: number, t: number, [x, y, w, h]: Rect): void {
  const flick = Math.sin(t * 13) > 0.97 ? 0.5 : 1;
  const a = (0.05 + 0.03 * Math.sin(t * 1.3)) * flick;
  px(g, Math.round(x / G), Math.round(y / G), Math.round(w / G / 2), Math.round(h / G), `rgba(255,60,190,${a.toFixed(3)})`);
  px(g, Math.round((x + w / 2) / G), Math.round(y / G), Math.round(w / G / 2), Math.round(h / G), `rgba(60,220,255,${a.toFixed(3)})`);
}

function bulbs(g: Ctx, G: number, t: number, at: LitScene['bulbs'], light: BaseLight): void {
  const base = light === 'day' ? 0.15 : 0.45;
  for (const [i, [x, y]] of at.entries()) {
    const a = base + 0.35 * Math.sin(t * (0.6 + hash(i * 3.1) * 0.8) + i * 1.7);
    px(g, Math.round(x / G), Math.round(y / G), 1, 1, `rgba(255,${200 + Math.round(hash(i) * 40)},140,${Math.max(0, a).toFixed(3)})`);
  }
}

function motes(g: Ctx, G: number, t: number, light: BaseLight): void {
  const rgb = light === 'night' ? '200,210,255' : '255,236,190';
  for (let i = 0; i < 18; i++) {
    const x = (300 + hash(i * 3.7) * 760 + Math.sin(t * 0.11 + i) * 30) / G;
    const y = (150 + hash(i * 9.1) * 440 + ((t * (2 + hash(i) * 3)) % 50) - 25) / G;
    const a = (light === 'day' ? 0.3 : 0.18) + 0.18 * Math.sin(t * 0.6 + i * 2.3);
    px(g, Math.round(x), Math.round(y), 1, 1, `rgba(${rgb},${a.toFixed(3)})`);
  }
}

export function litAmbient(g: Ctx, G: number, t: number, look: LitLook, light: BaseLight): void {
  const s = SCENES[look];
  if (light !== 'day') {
    for (const [i, [x, y]] of s.lamps.entries()) glow(g, Math.round(x / G), Math.round(y / G), 6, '255,200,130', 0.4 + 0.08 * Math.sin(t * 0.7 + i));
  }
  bulbs(g, G, t, s.bulbs, light);
  if (light === 'night') {
    stars(g, G, t, s.sky);
    if (s.neon) neonHum(g, G, t, s.neon);
  }
  motes(g, G, t, light);
}
