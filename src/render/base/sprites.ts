import { PAL } from '../pixel/palette';
import { toCanvas } from '../pixel/post';
import { Pix } from '../pixel/raster';
import { FAN, NEON } from './layout';
import { col, disc, seg } from './paint';

// Hangar base (doc 30): small animated sprites, painted once per grid and cached — the wall fan's blades
// (6 frames over a third of a turn: three blades) and the neon joystick sign (tubes lit, with a dithered glow;
// the unlit glass tubes are part of the static layer).

/** A sprite and the art pixel its (0, 0) goes to. */
export interface Placed { canvas: HTMLCanvasElement; c: number; r: number }

const placed = new Map<string, Placed | null>();

function remember(key: string, make: () => Placed | null): Placed | null {
  if (!placed.has(key)) {
    if (placed.size > 24) placed.clear();
    placed.set(key, make());
  }
  return placed.get(key) ?? null;
}

/** A Pix covering the frame rect (x, y, w, h) on the scene grid, with its grid offset. */
function local(G: number, x: number, y: number, w: number, h: number): { p: Pix; c: number; r: number } {
  const c = Math.floor(x / G) - 1;
  const r = Math.floor(y / G) - 1;
  const p = new Pix(Math.ceil(w / G) + 3, Math.ceil(h / G) + 3, 1 / G, -c, -r);
  return { p, c, r };
}

export const FAN_FRAMES = 6;

/** Fan blades for frame f (0 … 5). */
export function fanSprite(G: number, f: number): Placed | null {
  return remember(`fan|${G.toFixed(4)}|${f}`, () => {
    const { p, c, r } = local(G, FAN.x - FAN.r, FAN.y - FAN.r, FAN.r * 2, FAN.r * 2);
    for (let b = 0; b < 3; b++) {
      const a = (f / FAN_FRAMES) * ((Math.PI * 2) / 3) + (b * Math.PI * 2) / 3;
      const ex = FAN.x + Math.cos(a) * (FAN.r - 4);
      const ey = FAN.y + Math.sin(a) * (FAN.r - 4);
      seg(p, FAN.x, FAN.y, ex, ey, col(PAL.steel, 3), 2);
      seg(p, FAN.x, FAN.y, (FAN.x + ex) / 2, (FAN.y + ey) / 2, col(PAL.steel, 4));
    }
    disc(p, FAN.x, FAN.y, 5, 5, col(PAL.steel, 5));
    disc(p, FAN.x, FAN.y, 2, 2, col(PAL.steel, 1));
    const canvas = toCanvas(p);
    return canvas ? { canvas, c, r } : null;
  });
}

/** The neon joystick: base with two buttons, the stick, the ball top and two sparkles. */
export function paintNeon(p: Pix, lit: boolean): void {
  const pink = lit ? col(PAL.purple, 4) : col(PAL.purple, 1);
  const cyan = lit ? col(PAL.lens, 4) : col(PAL.navy, 2);
  const cx = NEON.x + NEON.w / 2;
  const by = NEON.y + NEON.h - 14;
  seg(p, cx - 30, by, cx + 30, by, cyan);
  seg(p, cx - 30, by + 8, cx + 30, by + 8, cyan);
  seg(p, cx - 33, by + 3, cx - 33, by + 5, cyan);
  seg(p, cx + 33, by + 3, cx + 33, by + 5, cyan);
  seg(p, cx, by, cx + 9, by - 22, pink);
  seg(p, cx + 2, by, cx + 11, by - 22, pink);
  for (const dx of [-22, -12]) {
    seg(p, cx + dx, by + 3, cx + dx + 4, by + 3, pink);
    seg(p, cx + dx, by + 5, cx + dx + 4, by + 5, pink);
  }
  const ball = { x: cx + 12, y: by - 28 };
  for (let a = 0; a < 16; a++) {
    const u = (a / 16) * Math.PI * 2;
    p.set(p.col(ball.x + Math.cos(u) * 7), p.row(ball.y + Math.sin(u) * 7), pink);
  }
  for (const [sx, sy] of [[cx - 30, NEON.y + 12], [cx + 34, NEON.y + 16]] as const) {
    seg(p, sx - 4, sy, sx + 4, sy, cyan);
    seg(p, sx, sy - 4, sx, sy + 4, cyan);
  }
}

/** Glow: transparent pixels next to a lit tube take a darker shade of it, checkered. */
function glow(p: Pix): void {
  const src = p.data.slice();
  for (let r = 0; r < p.h; r++) {
    for (let c = 0; c < p.w; c++) {
      const i = r * p.w + c;
      if (src[i] || (c + r) & 1) continue;
      const n = (src[i - 1] ?? 0) || (src[i + 1] ?? 0) || (src[i - p.w] ?? 0) || (src[i + p.w] ?? 0);
      if (n) p.data[i] = n === col(PAL.purple, 4) ? col(PAL.purple, 2) : col(PAL.blue, 2);
    }
  }
}

/** The lit neon sign; `dim` = the buzzing frame (the stick tube dark). */
export function neonSprite(G: number, dim: boolean): Placed | null {
  return remember(`neon|${G.toFixed(4)}|${dim ? 1 : 0}`, () => {
    const { p, c, r } = local(G, NEON.x, NEON.y, NEON.w, NEON.h);
    paintNeon(p, true);
    if (dim) {
      const cx = NEON.x + NEON.w / 2;
      const by = NEON.y + NEON.h - 14;
      seg(p, cx, by, cx + 9, by - 22, col(PAL.purple, 1));
      seg(p, cx + 2, by, cx + 11, by - 22, col(PAL.purple, 1));
    }
    glow(p);
    const canvas = toCanvas(p);
    return canvas ? { canvas, c, r } : null;
  });
}
