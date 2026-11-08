import { hash } from './paint';

// The docks' slow, calm life (doc 73), drawn every frame in whole art pixels over the generated picture. Owner:
// "flickering light, dust particles, air bubbles moving outside" — the space dock (doc 76): stars twinkling in the
// portholes, the fairy lights and lamps glowing, dust motes. The sea lounge's life is in dock-sea.ts (doc 93).

type Ctx = CanvasRenderingContext2D;

/** Where the picture is dark enough to show a star (built once from the backdrop, art px). */
export interface Mask { w: number; h: number; dark: Uint8Array }

export function px(g: Ctx, c: number, r: number, w: number, h: number, color: string): void {
  g.fillStyle = color;
  g.fillRect(c, r, w, h);
}

/** A soft round glow (concentric squares fading out), for lamps. */
export function glow(g: Ctx, c: number, r: number, size: number, rgb: string, a: number): void {
  for (let k = size; k > 0; k -= 2) {
    g.fillStyle = `rgba(${rgb},${((a * (size - k + 2)) / (size * 3)).toFixed(3)})`;
    g.fillRect(c - k, r - Math.ceil(k / 2), k * 2, k);
  }
}

/** Pale motes drifting slowly through the room. */
export function motes(g: Ctx, G: number, t: number, n: number, rgb: string): void {
  for (let i = 0; i < n; i++) {
    const x = (hash(i * 3.7) * 1280 + Math.sin(t * 0.13 + i) * 40) / G;
    const y = (120 + hash(i * 9.1) * 480 + ((t * (3 + hash(i) * 4)) % 60) - 30) / G;
    const a = 0.25 + 0.25 * Math.sin(t * 0.7 + i * 2.3);
    px(g, Math.round(x), Math.round(y), 1, 1, `rgba(${rgb},${a.toFixed(3)})`);
  }
}

// ---------- the space dock (G, doc 76) ----------

/** The two portholes (centre, radii; logical px): the left one leads to the map, the right one shows the starfighter. */
const PORTHOLES: ReadonlyArray<readonly [number, number, number, number]> = [[910, 292, 74, 104], [1162, 262, 94, 146]];
/** The fairy lights' bulbs along the hull rib and the portholes' rims. */
const BULBS: ReadonlyArray<readonly [number, number]> = [
  [770, 150], [796, 161], [843, 167], [862, 146], [869, 167], [897, 158], [941, 127], [990, 96], [826, 238], [793, 282],
  [994, 232],
];
/** Lamps that breathe: the one by the rec room, the one over the left porthole, the table lamp by the couch. */
const LAMPS: ReadonlyArray<readonly [number, number, number]> = [[36, 146, 7], [960, 208, 6], [1178, 420, 5]];

export function spaceAmbient(g: Ctx, G: number, t: number, mask: Mask | null): void {
  for (const [cx, cy, rx, ry] of PORTHOLES) {
    for (let i = 0; i < 18; i++) {
      const a = hash(i * 5.3 + cx) * Math.PI * 2;
      const k = Math.sqrt(hash(i * 7.9 + cy));
      const c = Math.round((cx + Math.cos(a) * rx * k + ((t * 1.5) % 8) - 4) / G);
      const r = Math.round((cy + Math.sin(a) * ry * k) / G);
      if (mask && !mask.dark[r * mask.w + c]) continue;
      const tw = 0.3 + 0.7 * Math.abs(Math.sin(t * (0.5 + hash(i * 2 + cx) * 1.2) + i));
      px(g, c, r, 1, 1, `rgba(230,240,255,${tw.toFixed(3)})`);
    }
  }
  BULBS.forEach(([x, y], i) => {
    const on = 0.55 + 0.45 * Math.sin(t * 1.3 + i * 1.7);
    glow(g, Math.round(x / G), Math.round(y / G), 2, '255,200,130', 0.5 * on);
    px(g, Math.round(x / G), Math.round(y / G), 1, 1, `rgba(255,236,190,${(0.5 + 0.5 * on).toFixed(3)})`);
  });
  for (const [x, y, size] of LAMPS) glow(g, Math.round(x / G), Math.round(y / G), size, '255,190,120', 0.3 + 0.1 * Math.sin(t * 0.8 + x));
  motes(g, G, t, 26, '255,225,200');
}
