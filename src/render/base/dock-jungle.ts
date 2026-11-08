import { hash } from './paint';

// The jungle base's crew hut (doc 86), slow and calm like the other docks: the fairy lights twinkling along the strings,
// the lab door's green window and the ceiling lamp breathing, fireflies drifting outside the window and the gate, dust
// motes in the warm light. Drawn every frame in whole art pixels over picture A.

type Ctx = CanvasRenderingContext2D;

function px(g: Ctx, c: number, r: number, w: number, h: number, color: string): void {
  g.fillStyle = color;
  g.fillRect(c, r, w, h);
}

/** The fairy lights' bulbs on the strings over the back wall and the window (logical px). */
const BULBS: ReadonlyArray<readonly [number, number]> = [
  [380, 198], [418, 194], [452, 196], [488, 200], [528, 196], [566, 200], [600, 205], [636, 202], [674, 198], [712, 194],
  [752, 198], [790, 202], [846, 168], [880, 150], [914, 140], [946, 128], [980, 118], [1010, 104], [312, 160], [280, 130],
];
/** Where fireflies drift outside: the window onto the compound and the open gate (x, y, w, h). */
const OUTSIDE: ReadonlyArray<readonly [number, number, number, number]> = [[846, 236, 130, 170], [1056, 170, 210, 420]];

function bulbs(g: Ctx, G: number, t: number): void {
  for (const [i, [x, y]] of BULBS.entries()) {
    const a = 0.45 + 0.4 * Math.sin(t * (0.6 + hash(i * 3.1) * 0.8) + i * 1.7);
    const c = Math.round(x / G);
    const r = Math.round(y / G);
    px(g, c, r, 1, 1, `rgba(255,${200 + Math.round(hash(i) * 40)},140,${a.toFixed(3)})`);
    px(g, c - 1, r, 3, 1, `rgba(255,190,120,${(a * 0.25).toFixed(3)})`);
  }
}

/** A soft square glow, fading out (lamps and the lab window). */
function glow(g: Ctx, c: number, r: number, size: number, rgb: string, a: number): void {
  for (let k = size; k > 0; k -= 1) {
    g.fillStyle = `rgba(${rgb},${((a * (size - k + 1)) / (size * 4)).toFixed(3)})`;
    g.fillRect(c - k, r - k, k * 2, k * 2);
  }
}

function fireflies(g: Ctx, G: number, t: number): void {
  for (const [k, [x, y, w, h]] of OUTSIDE.entries()) {
    for (let i = 0; i < 9; i++) {
      const s = i * 5.7 + k * 31;
      const fx = x + (hash(s) * w + Math.sin(t * 0.3 + s) * 18 + w) % w;
      const fy = y + (hash(s * 1.9) * h + Math.cos(t * 0.23 + s * 1.3) * 14 + h) % h;
      const on = Math.sin(t * (0.9 + hash(s * 3) * 0.7) + s);
      if (on < 0.2) continue;
      px(g, Math.round(fx / G), Math.round(fy / G), 1, 1, `rgba(220,255,140,${(0.4 + on * 0.5).toFixed(3)})`);
    }
  }
}

function motes(g: Ctx, G: number, t: number): void {
  for (let i = 0; i < 16; i++) {
    const x = (200 + hash(i * 3.7) * 760 + Math.sin(t * 0.11 + i) * 30) / G;
    const y = (150 + hash(i * 9.1) * 420 + ((t * (2 + hash(i) * 3)) % 50) - 25) / G;
    const a = 0.2 + 0.2 * Math.sin(t * 0.6 + i * 2.3);
    px(g, Math.round(x), Math.round(y), 1, 1, `rgba(255,236,190,${a.toFixed(3)})`);
  }
}

export function jungleAmbient(g: Ctx, G: number, t: number): void {
  bulbs(g, G, t);
  glow(g, Math.round(618 / G), Math.round(334 / G), 5, '120,255,140', 0.5 + 0.2 * Math.sin(t * 0.8)); // the lab's window
  glow(g, Math.round(618 / G), Math.round(132 / G), 6, '160,255,170', 0.35 + 0.1 * Math.sin(t * 0.5)); // the ceiling lamp
  fireflies(g, G, t);
  motes(g, G, t);
}
