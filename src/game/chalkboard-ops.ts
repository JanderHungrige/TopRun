import {
  BOARD_H, BOARD_W, cellValue, colorOf, densityOf, hash3, MAX_DENSITY, type Cells, type ChalkColor,
} from './chalkboard.ts';

// Chalkboard (doc 40): what a chalk stroke, a sponge stroke and the owner's reset do to the cells. Integer math only;
// the service applies the same functions in its order, the browser predicts with them.

export type ChalkOp = { t: 'c'; c: ChalkColor; p: number[] };
export type WipeOp = { t: 'w'; w: number; p: number[] };
export type ResetOp = { t: 'r' };
export type Op = ChalkOp | WipeOp | ResetOp;

/** A full sponge: one wiping step (1 cell of travel) costs 1, so ≈ 2 board widths. */
export const WET_MAX = 600;
/** The sponge's footprint in cells (around the point, `SPONGE_W / 2` left of it). */
export const SPONGE_W = 16;
export const SPONGE_H = 10;
/** A dry sponge leaves at least this much where there was chalk, and spreads it as a haze. */
export const HAZE = 6;
const NIB_R2 = 25;

type Visit = (x: number, y: number, sx: number, sy: number) => void;

/** The dominant direction of a segment as a unit step (diagonal when neither axis is twice the other). */
function direction(dx: number, dy: number): [number, number] {
  const ax = Math.abs(dx);
  const ay = Math.abs(dy);
  if (ax >= 2 * ay) return [Math.sign(dx), 0];
  if (ay >= 2 * ax) return [0, Math.sign(dy)];
  return [Math.sign(dx), Math.sign(dy)];
}

/** Visits the first point, then every `step` px along each segment (integer steps, so it is the same everywhere). */
function walk(p: readonly number[], step: number, visit: Visit): void {
  visit(p[0] ?? 0, p[1] ?? 0, 0, 0);
  for (let i = 2; i + 1 < p.length; i += 2) {
    const x0 = p[i - 2] ?? 0;
    const y0 = p[i - 1] ?? 0;
    const dx = (p[i] ?? 0) - x0;
    const dy = (p[i + 1] ?? 0) - y0;
    const [sx, sy] = direction(dx, dy);
    const n = Math.max(1, Math.trunc(Math.max(Math.abs(dx), Math.abs(dy)) / step));
    for (let k = 1; k <= n; k++) visit(x0 + Math.trunc((dx * k) / n), y0 + Math.trunc((dy * k) / n), sx, sy);
  }
}

const clampX = (x: number): number => Math.max(0, Math.min(BOARD_W - 1, x));
const clampY = (y: number): number => Math.max(0, Math.min(BOARD_H - 1, y));

/** A chalk line: a round nib every 2 px; each cell is stamped once per stroke, grainy, the new colour on top. */
export function chalkLine(cells: Cells, c: ChalkColor, p: readonly number[]): void {
  const seed = hash3(p[0] ?? 0, p[1] ?? 0, c);
  const stamped = new Set<number>();
  walk(p, 2, (x, y) => {
    for (let cy = clampY((y - 5) >> 2); cy <= clampY((y + 5) >> 2); cy++) {
      for (let cx = clampX((x - 5) >> 2); cx <= clampX((x + 5) >> 2); cx++) {
        const ex = cx * 4 + 2 - x;
        const ey = cy * 4 + 2 - y;
        const i = cy * BOARD_W + cx;
        if (ex * ex + ey * ey > NIB_R2 || stamped.has(i)) continue;
        stamped.add(i);
        const h = hash3(cx, cy, seed);
        const add = h % 11 === 0 ? 12 : 30 + ((h >>> 4) % 28);
        const v = cells[i] ?? 0;
        const d = densityOf(v);
        cells[i] = cellValue(Math.min(MAX_DENSITY, d + add), add * 2 > d ? c : colorOf(v));
      }
    }
  });
}

/** One dry step: drag the chalk along the motion, lift ⅛ down to the haze, leave dust speckles on clean cells. */
function smear(cells: Cells, box: [number, number, number, number], sx: number, sy: number, load: number): number {
  const [x0, y0, x1, y1] = box;
  const snap = (x: number, y: number): number => cells[clampY(y) * BOARD_W + clampX(x)] ?? 0;
  const out: number[] = [];
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const v = snap(x, y);
      const b = snap(x - sx, y - sy);
      let d = (densityOf(v) + densityOf(b) + 1) >> 1;
      const c = densityOf(b) > densityOf(v) ? colorOf(b) : colorOf(v);
      if (d > HAZE) {
        const nd = Math.max(HAZE, d - ((d + 7) >> 3));
        load += d - nd;
        d = nd;
      } else if (load > 0 && d < HAZE && hash3(x, y, load) % 3 === 0) {
        d += 1;
        load -= 1;
      }
      out.push(cellValue(d, c));
    }
  }
  let k = 0;
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) cells[y * BOARD_W + x] = out[k++] ?? 0;
  return Math.min(load, 4000);
}

/** The sponge along the points; returns the wetness left. Wet: clean under the sponge. Dry: smear. */
export function sponge(cells: Cells, w: number, p: readonly number[]): number {
  let wet = w;
  let load = 0;
  walk(p, 4, (x, y, sx, sy) => {
    const cx = x >> 2;
    const cy = y >> 2;
    const box: [number, number, number, number] = [
      clampX(cx - SPONGE_W / 2), clampY(cy - SPONGE_H / 2), clampX(cx + SPONGE_W / 2 - 1), clampY(cy + SPONGE_H / 2 - 1),
    ];
    if (wet > 0) {
      for (let yy = box[1]; yy <= box[3]; yy++) cells.fill(0, yy * BOARD_W + box[0], yy * BOARD_W + box[2] + 1);
      wet -= 1;
      return;
    }
    load = smear(cells, box, sx, sy, load);
  });
  return wet;
}

/** Applies one op in place; returns the sponge's wetness left after a wipe (0 otherwise). */
export function applyOp(cells: Cells, op: Op): number {
  switch (op.t) {
    case 'c':
      chalkLine(cells, op.c, op.p);
      return 0;
    case 'w':
      return sponge(cells, op.w, op.p);
    case 'r':
      cells.fill(0);
      return 0;
    default:
      throw new Error(`unhandled: ${op satisfies never}`);
  }
}

export function applyOps(cells: Cells, ops: readonly Op[]): void {
  for (const op of ops) applyOp(cells, op);
}
