import { hash } from './paint';

// The docks' slow, calm life (doc 73), drawn every frame in whole art pixels over the generated picture. Owner:
// "flickering light, dust particles, air bubbles moving outside" — the space lounge (doc 94): stars twinkling in the
// window's black sky, the fairy lights and lamps glowing, the holographic map table shimmering, the arcade flickering in
// the rec room, dust motes. The sea lounge's life is in dock-sea.ts (doc 93).

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

/** The window's glass (centre, radii; logical px): stars where its sky is dark. */
const WINDOWS: ReadonlyArray<readonly [number, number, number, number]> = [[1068, 240, 160, 168]];
/** The fairy lights' bulbs along the cables under the ceiling. */
const BULBS: ReadonlyArray<readonly [number, number]> = [
  [175, 70], [290, 15], [352, 48], [424, 68], [470, 72], [518, 82], [597, 85], [655, 78], [697, 72], [768, 52], [823, 33],
];
/** Lamps that breathe: the two hanging lamps, the one at the ceiling's edge, the floor lamp by the couch. */
const LAMPS: ReadonlyArray<readonly [number, number, number]> = [[240, 108, 7], [695, 172, 6], [958, 6, 6], [375, 372, 5]];
/** The holographic map table's glowing top (centre, radii). */
const HOLO = { cx: 1052, cy: 507, rx: 200, ry: 40 };

/** The map table's hologram: light running over its top and specks rising from it. */
function holo(g: Ctx, G: number, t: number): void {
  for (let i = 0; i < 14; i++) {
    const a = hash(i * 3.3) * Math.PI * 2 + t * 0.4;
    const k = Math.sqrt(hash(i * 5.1));
    const c = Math.round((HOLO.cx + Math.cos(a) * HOLO.rx * k) / G);
    const r = Math.round((HOLO.cy + Math.sin(a) * HOLO.ry * k) / G);
    px(g, c, r, 1, 1, `rgba(220,255,255,${(0.35 + 0.35 * Math.sin(t * 2 + i)).toFixed(3)})`);
  }
  for (let i = 0; i < 8; i++) {
    const life = (t * 0.35 + hash(i * 7.7)) % 1;
    const x = (HOLO.cx - HOLO.rx * 0.7 + hash(i * 2.9) * HOLO.rx * 1.4) / G;
    const y = (HOLO.cy - 8 - life * 90) / G;
    px(g, Math.round(x), Math.round(y), 1, 1, `rgba(120,255,240,${(0.6 * (1 - life)).toFixed(3)})`);
  }
}

export function spaceAmbient(g: Ctx, G: number, t: number, mask: Mask | null): void {
  for (const [cx, cy, rx, ry] of WINDOWS) {
    for (let i = 0; i < 22; i++) {
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
  holo(g, G, t);
  const flick = 0.15 + 0.12 * Math.sin(t * 8) * Math.sin(t * 2.7);
  px(g, Math.round(96 / G), Math.round(318 / G), Math.round(28 / G), Math.round(48 / G), `rgba(255,140,230,${Math.max(0, flick).toFixed(3)})`);
  motes(g, G, t, 26, '255,225,200');
}
