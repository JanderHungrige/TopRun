import { hash } from './paint';

// The docks' slow, calm life (doc 73), drawn every frame in whole art pixels over the generated picture. Owner:
// "flickering light, dust particles, air bubbles moving outside" — the space dock: stars drifting past the window,
// console lights blinking, the ceiling lights breathing, dust motes; the sea dock: the view through the round window
// bobbing gently, bubbles rising and fish passing outside, light rippling under the surface, a flickering ceiling lamp,
// drips from the pipes, dust motes.

type Ctx = CanvasRenderingContext2D;

/** Where the picture is dark enough to show a star (built once from the backdrop, art px). */
export interface Mask { w: number; h: number; dark: Uint8Array }

function px(g: Ctx, c: number, r: number, w: number, h: number, color: string): void {
  g.fillStyle = color;
  g.fillRect(c, r, w, h);
}

/** A soft round glow (concentric squares fading out), for lamps. */
function glow(g: Ctx, c: number, r: number, size: number, rgb: string, a: number): void {
  for (let k = size; k > 0; k -= 2) {
    g.fillStyle = `rgba(${rgb},${((a * (size - k + 2)) / (size * 3)).toFixed(3)})`;
    g.fillRect(c - k, r - Math.ceil(k / 2), k * 2, k);
  }
}

/** Pale motes drifting slowly through the room. */
function motes(g: Ctx, G: number, t: number, n: number, rgb: string): void {
  for (let i = 0; i < n; i++) {
    const x = (hash(i * 3.7) * 1280 + Math.sin(t * 0.13 + i) * 40) / G;
    const y = (120 + hash(i * 9.1) * 480 + ((t * (3 + hash(i) * 4)) % 60) - 30) / G;
    const a = 0.25 + 0.25 * Math.sin(t * 0.7 + i * 2.3);
    px(g, Math.round(x), Math.round(y), 1, 1, `rgba(${rgb},${a.toFixed(3)})`);
  }
}

// ---------- the space dock ----------

const WINDOW = { x: 1046, y: 74, w: 234, h: 388 };
const CONSOLE_LIGHTS: ReadonlyArray<readonly [number, number, string, number]> = [
  [1050, 478, '#5aff7a', 1.3], [1064, 478, '#ff5a4a', 0.7], [1078, 478, '#ffd25a', 2.1], [1116, 494, '#5aff7a', 0.9],
  [1132, 502, '#5fe3ff', 1.7], [1150, 510, '#ff5a4a', 1.1], [1226, 520, '#5fe3ff', 0.6], [1244, 528, '#5aff7a', 1.5],
  [1210, 568, '#ffd25a', 2.6], [1250, 574, '#ff5a4a', 0.8],
];

export function spaceAmbient(g: Ctx, G: number, t: number, mask: Mask | null): void {
  const c0 = Math.round(WINDOW.x / G);
  const r0 = Math.round(WINDOW.y / G);
  const w = Math.round(WINDOW.w / G);
  const h = Math.round(WINDOW.h / G);
  for (let i = 0; i < 40; i++) {
    const c = c0 + Math.floor((hash(i * 5.3) * w - t * (0.5 + hash(i) * 0.6)) % w + w) % w;
    const r = r0 + Math.floor(hash(i * 7.9) * h);
    if (mask && !mask.dark[r * mask.w + c]) continue;
    const tw = 0.4 + 0.6 * Math.abs(Math.sin(t * (0.6 + hash(i * 2) * 1.4) + i));
    px(g, c, r, 1, 1, `rgba(230,240,255,${tw.toFixed(3)})`);
  }
  for (const [x, y, color, rate] of CONSOLE_LIGHTS) {
    if (Math.sin(t * rate * 2 + x) > 0.1) px(g, Math.round(x / G), Math.round(y / G), 1, 1, color);
  }
  for (const [x, y] of [[462, 8], [838, 8]] as const) glow(g, Math.round(x / G), Math.round(y / G), 6, '170,210,255', 0.35 + 0.15 * Math.sin(t * 0.8 + x));
  motes(g, G, t, 26, '200,215,255');
}

// ---------- the sea dock ----------

const PORT = { cx: 1032, cy: 332, r: 286 };
const DRIPS: ReadonlyArray<readonly [number, number, number]> = [[488, 28, 120], [738, 118, 90], [944, 82, 140], [1176, 64, 100]];

function insidePort(g: Ctx, G: number): void {
  g.beginPath();
  g.arc(PORT.cx / G, PORT.cy / G, PORT.r / G, 0, Math.PI * 2);
  g.clip();
}

/** The view through the window, redrawn a pixel up or down: the docked sub and the seabed bob in the swell. */
function bob(g: Ctx, G: number, t: number, backdrop: CanvasImageSource): void {
  const dy = Math.round(Math.sin(t * 0.7));
  if (dy === 0) return;
  const c = Math.round((PORT.cx - PORT.r) / G);
  const r = Math.round((PORT.cy - PORT.r) / G);
  const s = Math.round((PORT.r * 2) / G);
  g.drawImage(backdrop, c, r, s, s, c, r + dy, s, s);
}

function outsideWater(g: Ctx, G: number, t: number): void {
  const top = (PORT.cy - PORT.r) / G;
  for (let i = 0; i < 4; i++) {
    const r = Math.round(top + 6 + i * 3);
    const shift = Math.round(Math.sin(t * 0.6 + i) * 4);
    for (let c = Math.round((PORT.cx - PORT.r) / G); c < (PORT.cx + PORT.r) / G; c += 9) {
      px(g, c + shift + (i % 2) * 4, r, 4, 1, 'rgba(200,250,255,0.28)');
    }
  }
  for (let i = 0; i < 18; i++) {
    const x = (PORT.cx - PORT.r * 0.85 + hash(i * 4.1) * PORT.r * 1.7) / G + Math.sin(t * 1.5 + i) * 0.8;
    const span = (PORT.r * 2) / G;
    const y = (PORT.cy + PORT.r) / G - ((t * (2.2 + hash(i) * 2) + hash(i * 6.7) * span) % span);
    px(g, Math.round(x), Math.round(y), 1, 1, 'rgba(225,250,255,0.75)');
    if (i % 3 === 0) px(g, Math.round(x) + 1, Math.round(y) - 1, 1, 1, 'rgba(225,250,255,0.45)');
  }
  for (let i = 0; i < 3; i++) {
    const span = (PORT.r * 2) / G + 20;
    const dir = i % 2 ? 1 : -1;
    const pos = (t * (1.4 + i * 0.5) + i * 37) % span;
    const fx = Math.round((PORT.cx - PORT.r) / G - 10 + (dir > 0 ? pos : span - pos));
    const fy = Math.round((PORT.cy + 30 + i * 60) / G + Math.sin(t + i) * 2);
    px(g, fx, fy, 3, 1, 'rgba(20,40,60,0.75)');
    px(g, fx + (dir > 0 ? -1 : 3), fy - 1, 1, 3, 'rgba(20,40,60,0.75)');
  }
}

export function seaAmbient(g: Ctx, G: number, t: number, backdrop: CanvasImageSource): void {
  g.save();
  insidePort(g, G);
  bob(g, G, t, backdrop);
  outsideWater(g, G, t);
  g.restore();
  const off = hash(Math.floor(t * 12)) > 0.94 || (t % 13 > 9 && t % 13 < 9.3 && Math.floor(t * 20) % 2 === 0);
  if (!off) glow(g, Math.round(490 / G), Math.round(10 / G), 7, '140,255,210', 0.45 + 0.1 * Math.sin(t * 3));
  for (const [x, y, fall] of DRIPS) {
    const k = (t * 0.45 + hash(x) * 3) % 3;
    if (k > 1) continue;
    px(g, Math.round(x / G), Math.round((y + k * fall) / G), 1, 1, 'rgba(170,240,255,0.8)');
  }
  motes(g, G, t, 22, '190,240,225');
}
