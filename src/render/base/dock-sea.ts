import { glow, motes, px } from './dock-ambient';
import { hash } from './paint';

// The sea lounge's slow life (doc 93), in whole art pixels over the picture: the view through the big window bobbing
// gently in the swell (the docked submarine with it), light rippling under the surface, bubbles rising and small fish
// passing outside; the antique globe in front of the window stays still. Indoors the fairy lights twinkle, the floor lamp
// and the ceiling light glow, the arcade's screen flickers pink in the rec room, dust motes drift.

type Ctx = CanvasRenderingContext2D;

/** The window in the left wall (logical px, rounded corners). */
const WINDOW = { x: 48, y: 28, w: 350, h: 524, r: 40 };
/** The globe's sphere and ring in front of the window (centre, radii). */
const GLOBE = { cx: 190, cy: 482, rx: 108, ry: 104 };
/** The fairy lights' bulbs along the back wall. */
const BULBS: ReadonlyArray<readonly [number, number]> = [
  [440, 142], [460, 170], [478, 185], [502, 187], [522, 172], [548, 178], [812, 178], [842, 168], [880, 183], [938, 142],
  [970, 155], [997, 178], [1037, 178], [1062, 152],
];

/** Clips to the window minus the globe in front of it. */
function behindGlass(g: Ctx, G: number): void {
  g.beginPath();
  g.roundRect(WINDOW.x / G, WINDOW.y / G, WINDOW.w / G, WINDOW.h / G, WINDOW.r / G);
  g.ellipse(GLOBE.cx / G, GLOBE.cy / G, GLOBE.rx / G, GLOBE.ry / G, 0, 0, Math.PI * 2);
  g.clip('evenodd');
}

/** The view through the window, redrawn a pixel up or down: the sub and the seabed bob in the swell. */
function bob(g: Ctx, G: number, t: number, backdrop: CanvasImageSource): void {
  const dy = Math.round(Math.sin(t * 0.7));
  if (dy === 0) return;
  const [c, r, w, h] = [WINDOW.x, WINDOW.y, WINDOW.w, WINDOW.h].map((v) => Math.round(v / G)) as [number, number, number, number];
  g.drawImage(backdrop, c, r, w, h, c, r + dy, w, h);
}

function water(g: Ctx, G: number, t: number): void {
  const left = WINDOW.x / G;
  const span = WINDOW.w / G;
  for (let i = 0; i < 4; i++) {
    const r = Math.round(WINDOW.y / G + 4 + i * 3);
    const shift = Math.round(Math.sin(t * 0.6 + i) * 4);
    for (let c = Math.round(left); c < left + span; c += 9) px(g, c + shift + (i % 2) * 4, r, 4, 1, 'rgba(200,250,255,0.28)');
  }
  const tall = WINDOW.h / G;
  for (let i = 0; i < 16; i++) {
    const x = left + 4 + hash(i * 4.1) * (span - 8) + Math.sin(t * 1.5 + i) * 0.8;
    const y = (WINDOW.y + WINDOW.h) / G - ((t * (2.2 + hash(i) * 2) + hash(i * 6.7) * tall) % tall);
    px(g, Math.round(x), Math.round(y), 1, 1, 'rgba(225,250,255,0.75)');
    if (i % 3 === 0) px(g, Math.round(x) + 1, Math.round(y) - 1, 1, 1, 'rgba(225,250,255,0.45)');
  }
  for (let i = 0; i < 3; i++) {
    const dir = i % 2 ? 1 : -1;
    const pos = (t * (1.2 + i * 0.4) + i * 29) % (span + 12);
    const fx = Math.round(left - 6 + (dir > 0 ? pos : span + 6 - pos));
    const fy = Math.round((WINDOW.y + 150 + i * 70) / G + Math.sin(t + i) * 2);
    px(g, fx, fy, 3, 1, 'rgba(20,40,60,0.75)');
    px(g, fx + (dir > 0 ? -1 : 3), fy - 1, 1, 3, 'rgba(20,40,60,0.75)');
  }
}

function indoors(g: Ctx, G: number, t: number): void {
  for (const [i, [x, y]] of BULBS.entries()) {
    const a = 0.4 + 0.35 * Math.sin(t * (0.6 + hash(i * 3.1) * 0.8) + i * 1.7);
    px(g, Math.round(x / G), Math.round(y / G), 1, 1, `rgba(255,${210 + Math.round(hash(i) * 30)},150,${Math.max(0, a).toFixed(3)})`);
  }
  glow(g, Math.round(460 / G), Math.round(350 / G), 7, '255,220,150', 0.45 + 0.05 * Math.sin(t * 2.1));
  const off = hash(Math.floor(t * 12)) > 0.95;
  if (!off) glow(g, Math.round(668 / G), Math.round(6 / G), 7, '200,250,240', 0.4 + 0.08 * Math.sin(t * 3));
  const flick = 0.18 + 0.12 * Math.sin(t * 9) * Math.sin(t * 2.3);
  px(g, Math.round(986 / G), Math.round(346 / G), Math.round(44 / G), Math.round(30 / G), `rgba(255,120,220,${Math.max(0, flick).toFixed(3)})`);
}

export function seaAmbient(g: Ctx, G: number, t: number, backdrop: CanvasImageSource): void {
  g.save();
  behindGlass(g, G);
  bob(g, G, t, backdrop);
  water(g, G, t);
  g.restore();
  indoors(g, G, t);
  motes(g, G, t, 22, '190,240,225');
}
