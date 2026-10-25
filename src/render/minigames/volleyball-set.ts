import { makeCanvas } from '../pixel/post';

// Beach Volleyball (doc 21): the base beach at sunset as pixel art. The static picture (banded sky with dithered
// seams, the striped setting sun, clouds, the sea with a carrier on the horizon, the far sand, palms, the court
// sand) is painted once into a 640 × 360 art buffer (2 logical px per art pixel) and blitted crisply; the sea
// glitter, the foam, twinkling stars, gulls and a passing jet are drawn live on the same 2-px grid.

const W = 640;
const H = 360;
export const HORIZON = 165;
const SAND = 205;
export const COURT_SAND = 240;

type Art = CanvasRenderingContext2D;
const px = (g: Art, x: number, y: number, w: number, h: number, c: string): void => {
  g.fillStyle = c;
  g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
};
const hash = (x: number, y: number): number => {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
};

/** Horizontal colour bands from y0, each joined to the next by a two-row checker seam. */
function bands(g: Art, y0: number, rows: readonly (readonly [number, string])[]): void {
  let y = y0;
  rows.forEach(([h, c], i) => {
    px(g, 0, y, W, h, c);
    const next = rows[i + 1];
    if (next) for (let x = 0; x < W; x++) for (let k = 0; k < 2; k++) if ((x + k) % 2 === 0) px(g, x, y + h - 2 + k, 1, 1, next[1]);
    y += h;
  });
}

const SKY: readonly (readonly [number, string])[] = [
  [22, '#1b1433'], [20, '#2a1a47'], [20, '#43225a'], [18, '#63295f'], [16, '#8a3262'], [14, '#b23f63'],
  [14, '#d65561'], [12, '#ee7158'], [11, '#f99456'], [10, '#ffb45e'], [8, '#ffd27a'],
];

function sun(g: Art): void {
  const cx = 505;
  const r = 40;
  for (let y = HORIZON - r; y < HORIZON; y++) {
    for (let x = cx - 70; x <= cx + 70; x++) {
      const d = Math.hypot(x - cx, y - HORIZON + 4);
      if (d < 66 && d >= r && (x + y) % 2 === 0 && hash(x, y) < 0.55 * (1 - (d - r) / 26)) px(g, x, y, 1, 1, '#ffc47a');
    }
  }
  for (let y = HORIZON - r; y < HORIZON; y++) {
    const half = Math.sqrt(Math.max(0, r * r - (y - HORIZON + 4) ** 2));
    const gap = y > HORIZON - 16 && (y - HORIZON) % 5 === -1;
    if (half <= 0 || gap) continue;
    px(g, cx - half, y, half * 2, 1, y < HORIZON - 26 ? '#ffeab0' : '#ffd57a');
    px(g, cx - half, y, 2, 1, '#ffbf62');
    px(g, cx + half - 2, y, 2, 1, '#ffbf62');
  }
}

function clouds(g: Art): void {
  const streaks: readonly (readonly [number, number, number, number, string, string])[] = [
    [40, 104, 180, 3, '#c9506a', '#e0707a'], [250, 118, 150, 2, '#e0667a', '#f0857a'], [430, 128, 170, 3, '#e86a5e', '#ff9670'],
    [120, 136, 120, 2, '#f08a6e', '#ffaa78'], [520, 146, 110, 2, '#ff9a62', '#ffc37c'], [330, 88, 110, 2, '#9a3a66', '#b64a6c'],
  ];
  for (const [x, y, w, h, c, top] of streaks) {
    px(g, x, y, w, h, c);
    px(g, x + 6, y - 1, w - 18, 1, top);
    px(g, x + w * 0.3, y + h, w * 0.5, 1, c);
  }
}

function sea(g: Art): void {
  bands(g, HORIZON, [[7, '#4b2c5e'], [8, '#5a3467'], [10, '#6c3c6c'], [15, '#7e4570']]);
  px(g, 0, HORIZON, W, 1, '#c86a74');
  // a carrier on the horizon, far away
  px(g, 140, HORIZON - 3, 56, 3, '#2c1a3a');
  px(g, 134, HORIZON - 4, 66, 1, '#2c1a3a');
  px(g, 176, HORIZON - 9, 6, 5, '#2c1a3a');
  px(g, 178, HORIZON - 12, 2, 3, '#2c1a3a');
}

function sand(g: Art): void {
  bands(g, SAND, [[4, '#a8645a'], [12, '#d59869'], [19, '#dfa673'], [44, '#e8b27c'], [76, '#efbd86']]);
  for (let y = SAND + 5; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const h = hash(x, y);
      if (h < 0.035) px(g, x, y, 1, 1, '#c98f60');
      else if (h > 0.972) px(g, x, y, 1, 1, '#f8d39e');
    }
  }
}

/** A thick pixel line (palm trunks and fronds). */
function stroke(g: Art, x0: number, y0: number, x1: number, y1: number, w: number, c: string): void {
  const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0)));
  for (let i = 0; i <= n; i++) px(g, x0 + ((x1 - x0) * i) / n - w / 2, y0 + ((y1 - y0) * i) / n - w / 2, w, w, c);
}

function palm(g: Art, x: number, dir: 1 | -1): void {
  const dark = '#24122c';
  let cx = x;
  let cy = COURT_SAND + 6;
  for (let i = 0; i < 18; i++) {
    const nx = cx + dir * (0.6 + i * 0.12);
    const ny = cy - 7;
    stroke(g, cx, cy, nx, ny, 5 - i * 0.12, i % 3 === 0 ? '#341a36' : dark);
    [cx, cy] = [nx, ny];
  }
  for (let f = 0; f < 7; f++) {
    const a = -Math.PI / 2 + (f - 3) * 0.52;
    let fx = cx;
    let fy = cy;
    for (let k = 0; k < 9; k++) {
      const len = 6;
      const droop = k * 0.09 * (Math.abs(Math.cos(a)) + 0.3);
      const nx = fx + Math.cos(a) * len * (1 - k * 0.04);
      const ny = fy + Math.sin(a) * len * (1 - k * 0.05) + droop * len;
      stroke(g, fx, fy, nx, ny, Math.max(1, 3.4 - k * 0.3), dark);
      if (k > 1 && k % 2 === 0) stroke(g, nx, ny, nx + Math.cos(a + 1.3) * 3, ny + 3, 1, dark);
      [fx, fy] = [nx, ny];
    }
  }
  px(g, cx - 4, cy - 1, 8, 5, '#3e2236');
}

let art: HTMLCanvasElement | null = null;

function paint(): HTMLCanvasElement | null {
  const c = makeCanvas(W, H);
  const g = c.getContext('2d');
  if (!g) return null;
  bands(g, 0, SKY);
  for (let i = 0; i < 46; i++) px(g, hash(i, 1) * W, hash(i, 2) * 60, 1, 1, '#d8c8f0');
  sun(g);
  clouds(g);
  sea(g);
  sand(g);
  palm(g, 14, 1);
  palm(g, 626, -1);
  return c;
}

function glitter(ctx: CanvasRenderingContext2D, t: number): void {
  for (let i = 0; i < 14; i++) {
    const y = HORIZON + 2 + i * 3;
    const w = 26 - i * 1.2 + Math.sin(t * 3 + i * 1.9) * 6;
    const x = 505 - w / 2 + Math.sin(t * 1.7 + i * 2.3) * 4;
    ctx.fillStyle = i % 3 === 0 ? '#ffe39a' : '#ffb466';
    ctx.fillRect(Math.round(x) * 2, y * 2, Math.max(2, Math.round(w)) * 2, 2);
  }
  ctx.fillStyle = '#f6dccb';
  for (let x = 0; x < W; x += 9) {
    const on = Math.sin(t * 1.3 + x * 0.11) > 0.1;
    if (on) ctx.fillRect(x * 2, (SAND + (Math.sin(t * 0.9 + x * 0.05) > 0 ? 0 : 1)) * 2, 10, 2);
  }
}

function sky(ctx: CanvasRenderingContext2D, t: number): void {
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < 46; i += 5) if (Math.sin(t * 2.2 + i) > 0.6) ctx.fillRect(Math.round(hash(i, 1) * W) * 2, Math.round(hash(i, 2) * 60) * 2, 2, 2);
  ctx.fillStyle = '#2a1830';
  for (let i = 0; i < 2; i++) {
    const gx = Math.round((((t * 9 + i * 300) % 760) - 60));
    const gy = Math.round(70 + i * 22 + Math.sin(t + i) * 3);
    const flap = Math.floor(t * 5 + i) % 2;
    ctx.fillRect((gx - 3) * 2, (gy - flap) * 2, 4, 2);
    ctx.fillRect((gx + 1) * 2, (gy - flap) * 2, 4, 2);
    ctx.fillRect((gx - 1) * 2, gy * 2, 4, 2);
  }
  const jt = t % 28;
  if (jt < 7) {
    const x = Math.round(-20 + jt * 100);
    ctx.fillStyle = 'rgba(255,228,210,0.55)';
    ctx.fillRect((x - 60) * 2, 50 * 2, 60 * 2, 2);
    ctx.fillStyle = '#2a1a3c';
    ctx.fillRect(x * 2, 49 * 2, 8, 4);
    ctx.fillRect((x + 1) * 2, 48 * 2, 4, 2);
  }
}

/** The whole backdrop (sky, sea, beach, court sand) for the 1280 × 720 field. */
export function drawBeach(ctx: CanvasRenderingContext2D, t: number): void {
  art ??= paint();
  if (!art) return;
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(art, 0, 0, 1280, 720);
  glitter(ctx, t);
  sky(ctx, t);
  ctx.restore();
}
