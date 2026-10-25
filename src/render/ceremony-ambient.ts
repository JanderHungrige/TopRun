import { scratch } from './pixel/blit';
import { puff, type ArtView } from './pixel/bust';
import { hexOf, PAL } from './pixel/palette';
import { artGrid, backdrop, DECK_EDGE, HORIZON, SUN, type Grid } from './ceremony-set';

// Medal ceremony (doc 25): the living parts of the deck at golden hour, drawn in whole art pixels over the cached
// backdrop — the shimmering sun path, slow clouds, gulls, signal pennants flapping on the island's halyard and
// wisps of catapult steam — then the whole layer is blitted to the screen at the scene's art grid.

const hash = (n: number): number => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};
const col = (ramp: readonly number[], i: number): string => hexOf(ramp[i] ?? 0);

function shimmer(g: CanvasRenderingContext2D, gr: Grid, t: number): void {
  const f = Math.floor(t * 5);
  g.fillStyle = col(PAL.dusk, 7);
  for (let i = 0; i < 10; i++) {
    const y = Math.round((HORIZON + 6 + i * i * 0.6 + hash(f + i) * 6) / gr.G);
    const half = (8 + i * 6) / gr.G;
    const x = Math.round((SUN.x + (hash(f * 3 + i) - 0.5) * 2 * half * gr.G) / gr.G);
    g.fillRect(x, y, Math.max(1, Math.round(2 + hash(i + f) * 3)), 1);
  }
}

const GULL_UP = [-2, -1, -1, 0, 0, 0, 1, 0, 2, -1];
const GULL_DOWN = [-2, 1, -1, 0, 0, 0, 1, 0, 2, 1];

function gulls(g: CanvasRenderingContext2D, gr: Grid, t: number): void {
  g.fillStyle = col(PAL.dusk, 1);
  for (let i = 0; i < 3; i++) {
    const span = gr.W + 40;
    const x = Math.round(((t * (5 + i * 1.6) + i * 131) % span) - 20);
    const y = Math.round((96 + i * 26) / gr.G + Math.sin(t * 0.7 + i * 2) * 2);
    const pts = Math.floor(t * 3.2 + i) % 2 === 0 ? GULL_UP : GULL_DOWN;
    for (let k = 0; k + 1 < pts.length; k += 2) g.fillRect(x + (pts[k] ?? 0), y + (pts[k + 1] ?? 0), 1, 1);
  }
}

const FLAGS = [PAL.red[3], PAL.yellow[3], PAL.blue[3], PAL.white[3], PAL.green[3], PAL.red[3]] as const;

function pennants(g: CanvasRenderingContext2D, gr: Grid, t: number): void {
  for (let i = 0; i < FLAGS.length; i++) {
    const u = (i + 0.6) / (FLAGS.length + 0.4);
    const x = Math.round((1124 - 62 * u) / gr.G);
    const y = Math.round((92 + 58 * u) / gr.G);
    const flap = Math.floor(t * 4 + i * 0.7) % 2;
    g.fillStyle = hexOf(FLAGS[i] ?? 0);
    g.fillRect(x - 3, y + 1, 3, 2);
    g.fillRect(x - 5 - flap, y + 1 + flap, 2, 1);
  }
}

function steam(g: CanvasRenderingContext2D, gr: Grid, t: number): void {
  const view: ArtView = { k: 1, ox: 0, oy: 0, W: gr.W, H: gr.H, t, radio: false };
  for (const [sx, sy, ph] of [[760, DECK_EDGE + 52, 0], [470, DECK_EDGE + 64, 1.7]] as const) {
    for (let i = 0; i < 3; i++) {
      const life = ((t * 0.32 + ph + i / 3) % 1 + 1) % 1;
      const x = (sx + life * 46 + Math.sin(life * 5 + i) * 6) / gr.G;
      const y = (sy - life * 70) / gr.G;
      const r = (6 + life * 16) / gr.G;
      puff(g, view, x, y, r * 1.6, r, PAL.white[2] ?? 0, 0.35 * (1 - life));
    }
  }
}

function clouds(g: CanvasRenderingContext2D, gr: Grid, t: number): void {
  const view: ArtView = { k: 1, ox: 0, oy: 0, W: gr.W, H: gr.H, t, radio: false };
  for (let i = 0; i < 2; i++) {
    const span = 1280 + 300;
    const x = (((t * (3 + i * 2) + i * 700) % span) - 150) / gr.G;
    const y = (82 + i * 64) / gr.G;
    puff(g, view, x, y, 46 / gr.G, 5 / gr.G, PAL.dusk[3] ?? 0);
    puff(g, view, x + 6 / gr.G, y + 2 / gr.G, 34 / gr.G, 3 / gr.G, PAL.dusk[5] ?? 0);
  }
}

/** Draws the whole deck set (backdrop + ambient life) covering the 1280 × 720 frame. */
export function drawSet(ctx: CanvasRenderingContext2D, t: number): Grid {
  const gr = artGrid(ctx);
  const bg = backdrop(gr);
  const sc = scratch(gr.W, gr.H);
  if (!bg || !sc) return gr;
  sc.g.drawImage(bg, 0, 0);
  clouds(sc.g, gr, t);
  shimmer(sc.g, gr, t);
  gulls(sc.g, gr, t);
  pennants(sc.g, gr, t);
  steam(sc.g, gr, t);
  const m = ctx.getTransform();
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(sc.canvas, m.a ? -m.e / m.a + Math.round(m.e) / m.a : 0, m.d ? -m.f / m.d + Math.round(m.f) / m.d : 0, gr.W * gr.G, gr.H * gr.G);
  ctx.restore();
  return gr;
}
