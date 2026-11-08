import type { BaseLight } from '../../game/base-light';
import { hash } from './paint';

// The carrier lounge (doc 91), slow and calm like the docks: dust motes drifting in the light, the three hanging lamps
// glowing warm in the evening and at night, at night a few stars twinkling over the sea through the opening and the hall's
// neon humming in the door. Drawn every frame in whole art pixels over the picture of the light.

type Ctx = CanvasRenderingContext2D;

/** The hanging lamps' bulbs (logical px). */
const LAMPS: ReadonlyArray<readonly [number, number]> = [[470, 132], [655, 100], [866, 140]];
/** Where the night sky shows through the opening onto the flight deck (x, y, w, h). */
const SKY = [1060, 176, 150, 220] as const;
/** The hangar hall seen through the door (x, y, w, h). */
const HALL = [768, 240, 144, 244] as const;

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

function stars(g: Ctx, G: number, t: number): void {
  const [x, y, w, h] = SKY;
  for (let i = 0; i < 12; i++) {
    const a = Math.sin(t * (0.5 + hash(i * 4.1) * 0.9) + i * 2.1);
    if (a < 0.3) continue;
    px(g, Math.round((x + hash(i * 7.3) * w) / G), Math.round((y + hash(i * 2.9) * h) / G), 1, 1, `rgba(230,236,255,${(a * 0.7).toFixed(3)})`);
  }
}

/** The neon in the hall flickering now and then, a faint pink and cyan breath over the door. */
function neonHum(g: Ctx, G: number, t: number): void {
  const [x, y, w, h] = HALL;
  const flick = Math.sin(t * 13) > 0.97 ? 0.5 : 1;
  const a = (0.05 + 0.03 * Math.sin(t * 1.3)) * flick;
  px(g, Math.round(x / G), Math.round(y / G), Math.round(w / G / 2), Math.round(h / G), `rgba(255,60,190,${a.toFixed(3)})`);
  px(g, Math.round((x + w / 2) / G), Math.round(y / G), Math.round(w / G / 2), Math.round(h / G), `rgba(60,220,255,${a.toFixed(3)})`);
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

export function carrierAmbient(g: Ctx, G: number, t: number, light: BaseLight): void {
  if (light !== 'day') {
    for (const [i, [x, y]] of LAMPS.entries()) glow(g, Math.round(x / G), Math.round(y / G), 6, '255,200,130', 0.4 + 0.08 * Math.sin(t * 0.7 + i));
  }
  if (light === 'night') {
    stars(g, G, t);
    neonHum(g, G, t);
  }
  motes(g, G, t, light);
}
