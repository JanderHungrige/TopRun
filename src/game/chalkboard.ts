// Chalkboard (doc 40): the shared board's cells. Pure and integer-only, so the ladder service and every browser
// turn the same ops into the same bytes; shared with server/ladder, hence the `.ts` import extensions.

/** Cells across and down. */
export const BOARD_W = 300;
export const BOARD_H = 100;
/** Logical px per cell in the board scene; ops are given in these px (0 … PX_W − 1 × 0 … PX_H − 1). */
export const CELL_PX = 4;
export const PX_W = BOARD_W * CELL_PX;
export const PX_H = BOARD_H * CELL_PX;
export const MAX_DENSITY = 63;
/** Chalk colours: white, yellow, pink, blue. */
export const CHALK_COLORS = 4;
export type ChalkColor = 0 | 1 | 2 | 3;

/** One byte per cell: bits 0–5 chalk density (0 = clean slate), bits 6–7 the chalk colour. */
export type Cells = Uint8Array;

export const emptyCells = (): Cells => new Uint8Array(BOARD_W * BOARD_H);
export const densityOf = (v: number): number => v & MAX_DENSITY;
export const colorOf = (v: number): number => v >> 6;
export const cellValue = (d: number, c: number): number => (c << 6) | d;

/** FNV-1a over the cells: a client compares it with the service's to notice that its copy drifted. */
export function boardSum(cells: Cells): number {
  let h = 0x811c9dc5;
  for (const v of cells) {
    h ^= v;
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h;
}

/** A small integer hash (chalk grain, haze speckle). */
export function hash3(a: number, b: number, c: number): number {
  let h = (Math.imul(a, 374761393) + Math.imul(b, 668265263) + Math.imul(c, 362437)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return (h ^ (h >>> 16)) >>> 0;
}

export const isChalkColor = (v: unknown): v is ChalkColor => v === 0 || v === 1 || v === 2 || v === 3;
