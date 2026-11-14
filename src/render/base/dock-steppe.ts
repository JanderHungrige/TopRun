import { hash } from './paint';

// The steppe tent (doc 111), slow and calm like the other docks: the string lights and the lantern twinkling along the
// tent's poles, the lab container's violet window and the lamp over the map table breathing, dust blowing past the tank
// out in the flap's light, motes drifting in the tent. Drawn every frame in whole art pixels over the picture.

type Ctx = CanvasRenderingContext2D;

function px(g: Ctx, c: number, r: number, w: number, h: number, color: string): void {
  g.fillStyle = color;
  g.fillRect(c, r, w, h);
}

/** The string lights along the poles and the lantern (logical px). */
const BULBS: ReadonlyArray<readonly [number, number]> = [
  [204, 152], [287, 97], [403, 32], [700, 225], [742, 214], [808, 198], [876, 190], [988, 88], [1000, 168], [1132, 140], [1205, 92],
];
/** The flap's view of the motor pool, where dust blows past (x, y, w, h). */
const FLAP = [880, 300, 350, 150] as const;

function bulbs(g: Ctx, G: number, t: number): void {
  for (const [i, [x, y]] of BULBS.entries()) {
    const a = 0.45 + 0.4 * Math.sin(t * (0.6 + hash(i * 3.1) * 0.8) + i * 1.7);
    const c = Math.round(x / G);
    const r = Math.round(y / G);
    px(g, c, r, 1, 1, `rgba(255,${210 + Math.round(hash(i) * 30)},150,${a.toFixed(3)})`);
    px(g, c - 1, r, 3, 1, `rgba(255,200,120,${(a * 0.25).toFixed(3)})`);
  }
}

/** A soft square glow, fading out (the lamp and the lab window). */
function glow(g: Ctx, c: number, r: number, size: number, rgb: string, a: number): void {
  for (let k = size; k > 0; k -= 1) {
    g.fillStyle = `rgba(${rgb},${((a * (size - k + 1)) / (size * 4)).toFixed(3)})`;
    g.fillRect(c - k, r - k, k * 2, k * 2);
  }
}

/** Dust blowing left to right past the tank, a little faster in the gusts. */
function dust(g: Ctx, G: number, t: number): void {
  const [x, y, w, h] = FLAP;
  const gust = 1 + 0.5 * Math.max(0, Math.sin(t * 0.4));
  for (let i = 0; i < 14; i++) {
    const dx = (hash(i * 4.3) * w + t * (22 + hash(i) * 30) * gust) % w;
    const dy = hash(i * 7.9) * h + Math.sin(t * 0.9 + i) * 4;
    px(g, Math.round((x + dx) / G), Math.round((y + dy) / G), 1, 1, `rgba(240,214,160,${(0.25 + hash(i * 2.1) * 0.3).toFixed(3)})`);
  }
}

function motes(g: Ctx, G: number, t: number): void {
  for (let i = 0; i < 14; i++) {
    const x = (240 + hash(i * 3.7) * 700 + Math.sin(t * 0.11 + i) * 30) / G;
    const y = (120 + hash(i * 9.1) * 400 + ((t * (2 + hash(i) * 3)) % 50) - 25) / G;
    const a = 0.18 + 0.18 * Math.sin(t * 0.6 + i * 2.3);
    px(g, Math.round(x), Math.round(y), 1, 1, `rgba(255,236,190,${a.toFixed(3)})`);
  }
}

export function steppeAmbient(g: Ctx, G: number, t: number): void {
  bulbs(g, G, t);
  glow(g, Math.round(667 / G), Math.round(326 / G), 5, '220,90,255', 0.45 + 0.2 * Math.sin(t * 0.7)); // the lab's window
  glow(g, Math.round(650 / G), Math.round(268 / G), 6, '255,220,150', 0.4 + 0.08 * Math.sin(t * 0.5)); // the map lamp
  dust(g, G, t);
  motes(g, G, t);
}
