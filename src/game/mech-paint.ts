import { createRng } from '../core/rng';
import { MECH_IDS, type MechId } from '../data/types';

// The mechs' camo (doc 87): each mech wears a 16 × 16 tile of jungle colours, painted by hand in the PAINT SHOP and
// repeated over its armour. A paint is stored as 256 digits 0–7, one per cell (row by row); a mech never painted wears
// its own default camo. Pure.

export const PAINT_SIZE = 16;
export const PAINT_CELLS = PAINT_SIZE * PAINT_SIZE;

/** The jungle palette: dark green, olive, moss, khaki, brown, black-green, tan, sand. */
export const PAINT_COLORS: readonly string[] = Object.freeze([
  '#2f4a22', '#4e6b2e', '#6f8a3a', '#8a7a4a', '#5a4028', '#1e2418', '#a89a6a', '#c8b84a',
]);

export type Paint = string;

const valid = (p: unknown): p is Paint => typeof p === 'string' && p.length === PAINT_CELLS && /^[0-7]+$/.test(p);

/** Blobs of three colours over an olive ground, seeded per mech. */
function blobs(seed: number, ground: number, inks: readonly number[]): Paint {
  const rng = createRng(seed);
  const cells = new Array<number>(PAINT_CELLS).fill(ground);
  for (const ink of inks) {
    for (let b = 0; b < 4; b++) {
      const cx = rng.next() * PAINT_SIZE;
      const cy = rng.next() * PAINT_SIZE;
      const r = 1.6 + rng.next() * 2.4;
      for (let y = 0; y < PAINT_SIZE; y++) {
        for (let x = 0; x < PAINT_SIZE; x++) {
          // wrapped distance, so the tile repeats without seams
          const dx = Math.min(Math.abs(x - cx), PAINT_SIZE - Math.abs(x - cx));
          const dy = Math.min(Math.abs(y - cy), PAINT_SIZE - Math.abs(y - cy));
          if (dx * dx + dy * dy * 1.4 < r * r) cells[y * PAINT_SIZE + x] = ink;
        }
      }
    }
  }
  return cells.join('');
}

const DEFAULTS: Readonly<Record<MechId, Paint>> = {
  strider: blobs(11, 1, [0, 4, 5]),
  ranger: blobs(23, 2, [0, 3, 5]),
  hornet: blobs(37, 3, [4, 6, 5]),
  titan: blobs(41, 0, [1, 4, 5]),
};

export const defaultPaint = (id: MechId): Paint => DEFAULTS[id];

/** The paints from storage: only well-formed ones, only for mechs. */
export function parsePaints(v: unknown): Partial<Record<MechId, Paint>> {
  const out: Partial<Record<MechId, Paint>> = {};
  if (typeof v !== 'object' || v === null) return out;
  for (const id of MECH_IDS) {
    const p = (v as Record<string, unknown>)[id];
    if (valid(p)) out[id] = p;
  }
  return out;
}

/** The colour index of a cell. */
export const cellAt = (p: Paint, x: number, y: number): number => Number(p[((y % PAINT_SIZE) + PAINT_SIZE) % PAINT_SIZE * PAINT_SIZE + (((x % PAINT_SIZE) + PAINT_SIZE) % PAINT_SIZE)] ?? 0);

/** The paint with a round brush of `size` cells (1–3) in colour `c` at (x, y), wrapping round the tile. */
export function brush(p: Paint, x: number, y: number, c: number, size: number): Paint {
  const cells = p.split('');
  const r = size - 1;
  for (let dy = -r; dy <= r; dy++) {
    for (let dx = -r; dx <= r; dx++) {
      if (dx * dx + dy * dy > r * r + r) continue;
      const cx = (((x + dx) % PAINT_SIZE) + PAINT_SIZE) % PAINT_SIZE;
      const cy = (((y + dy) % PAINT_SIZE) + PAINT_SIZE) % PAINT_SIZE;
      cells[cy * PAINT_SIZE + cx] = String(c);
    }
  }
  return cells.join('');
}

/** The paint with the area of (x, y)'s colour around it filled with `c`. */
export function fill(p: Paint, x: number, y: number, c: number): Paint {
  const from = cellAt(p, x, y);
  if (from === c) return p;
  const cells = p.split('').map(Number);
  const stack: Array<[number, number]> = [[x, y]];
  while (stack.length) {
    const [cx, cy] = stack.pop() ?? [0, 0];
    const i = cy * PAINT_SIZE + cx;
    if (cx < 0 || cy < 0 || cx >= PAINT_SIZE || cy >= PAINT_SIZE || cells[i] !== from) continue;
    cells[i] = c;
    stack.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]);
  }
  return cells.join('');
}

/** A whole new random camo in up to four colours of the palette. */
export function randomPaint(seed: number): Paint {
  const rng = createRng(seed);
  const pick = (): number => Math.floor(rng.next() * PAINT_COLORS.length);
  return blobs(Math.floor(rng.next() * 1e9), pick(), [pick(), pick(), pick()]);
}

/** Stripes across the tile in two colours (a tiger camo), `every` cells apart. */
export function stripes(c0: number, c1: number, every = 4): Paint {
  const cells: number[] = [];
  for (let y = 0; y < PAINT_SIZE; y++) for (let x = 0; x < PAINT_SIZE; x++) cells.push(Math.floor((x + y + Math.round(Math.sin(y * 0.8) * 1.5)) / every) % 2 ? c1 : c0);
  return cells.join('');
}
