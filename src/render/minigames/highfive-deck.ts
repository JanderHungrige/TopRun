import { makeCanvas } from '../pixel/post';
import { pixelRect } from '../pixel/frame';

// High Five (doc 42): the flight deck at sunset in side view — sky bands, low sun, sea, the island and a parked jet
// as silhouettes, the deck with its yellow line and the two take-off marks. Built once into a layer.

export const DECK_Y = 600;
export const CENTRE_X = 640;
/** Take-off marks, either side of the centre. */
export const MARK_DX = 50;

const SKY = ['#2b1d4a', '#46245a', '#6c2c5e', '#a0405a', '#d4644e', '#f08a46', '#f8b45a'];
let layer: HTMLCanvasElement | null = null;

function silhouettes(g: CanvasRenderingContext2D): void {
  const ink = '#1a1426';
  // The island (superstructure) on the right, a mast and radar.
  pixelRect(g, 1010, 446, 150, 154, ink);
  pixelRect(g, 1040, 404, 80, 44, ink);
  pixelRect(g, 1076, 350, 8, 56, ink);
  pixelRect(g, 1056, 362, 48, 6, ink);
  // A parked jet on the left: fuselage, tail fin, canopy hump, wing.
  pixelRect(g, 70, 566, 260, 22, ink);
  pixelRect(g, 70, 528, 30, 40, ink);
  pixelRect(g, 230, 556, 50, 12, ink);
  pixelRect(g, 140, 584, 120, 8, ink);
  pixelRect(g, 320, 572, 26, 10, ink);
}

function build(): HTMLCanvasElement {
  const c = makeCanvas(1280, 720);
  const g = c.getContext('2d');
  if (!g) return c;
  SKY.forEach((col, i) => pixelRect(g, 0, 56 + i * 56, 1280, 56, col));
  // The low sun, half sunk behind the sea.
  for (let r = 0; r < 7; r++) {
    const w = 60 + r * 14;
    pixelRect(g, 640 - w / 2, 400 + r * 10, w, 10, r < 3 ? '#ffe08a' : '#ffc860');
  }
  pixelRect(g, 0, 470, 1280, 130, '#3a2a52');
  for (let y = 474; y < 600; y += 10) pixelRect(g, (y * 37) % 200, y, 1280, 2, '#5a3c62');
  silhouettes(g);
  pixelRect(g, 0, DECK_Y, 1280, 120, '#3b3f46');
  pixelRect(g, 0, DECK_Y, 1280, 4, '#5a6068');
  pixelRect(g, 0, DECK_Y + 36, 1280, 6, '#e8c23a');
  for (const s of [-1, 1]) {
    const x = CENTRE_X + s * MARK_DX;
    pixelRect(g, x - 12, DECK_Y + 8, 24, 6, '#f2f2f2');
    pixelRect(g, x - 2, DECK_Y + 4, 4, 14, '#f2f2f2');
  }
  return c;
}

export function drawDeck(ctx: CanvasRenderingContext2D): void {
  layer = layer ?? build();
  ctx.drawImage(layer, 0, 0);
}

/** Rec-room icon: two hands meeting up high with a spark, within ±40 px. */
export function drawHighFiveIcon(ctx: CanvasRenderingContext2D, t: number): void {
  const skin = '#e6b48e';
  const shade = '#c28c66';
  const spark = Math.sin(t * 6) > 0 ? '#ffe08a' : '#ffc83d';
  pixelRect(ctx, -30, -6, 12, 40, '#5d6b3e');
  pixelRect(ctx, 18, -6, 12, 40, '#2f3f66');
  pixelRect(ctx, -26, -26, 14, 22, skin);
  pixelRect(ctx, 12, -26, 14, 22, skin);
  pixelRect(ctx, -14, -24, 4, 16, shade);
  pixelRect(ctx, 10, -24, 4, 16, shade);
  pixelRect(ctx, -4, -38, 8, 8, spark);
  pixelRect(ctx, -12, -34, 4, 4, spark);
  pixelRect(ctx, 8, -34, 4, 4, spark);
}
