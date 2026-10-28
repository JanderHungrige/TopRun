import { BOARD_H, BOARD_W, emptyCells, isChalkColor, PX_H, PX_W, type Cells } from './chalkboard.ts';
import { WET_MAX, type Op } from './chalkboard-ops.ts';

// Chalkboard (doc 40): the board on the wire and on disk (run-length list as base64) and the checks for untrusted
// ops and replies. Shared with the ladder service.

/** At most this many ops per post, and points (x, y pairs) per op. */
export const MAX_OPS = 30;
export const MAX_POINTS = 300;
/** Largest accepted post body in bytes. */
export const MAX_BOARD_BODY = 24 * 1024;

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const isInt = (v: unknown, lo: number, hi: number): v is number => Number.isInteger(v) && (v as number) >= lo && (v as number) <= hi;

/** Cells → base64 of (value, run 1…255) pairs. */
export function encodeCells(cells: Cells): string {
  const pairs: number[] = [];
  for (let i = 0; i < cells.length;) {
    const v = cells[i] ?? 0;
    let run = 1;
    while (run < 255 && cells[i + run] === v) run++;
    pairs.push(v, run);
    i += run;
  }
  let bin = '';
  for (let i = 0; i < pairs.length; i += 4096) bin += String.fromCharCode(...pairs.slice(i, i + 4096));
  return btoa(bin);
}

/** base64 run-length list → cells, or null unless it decodes to exactly one board. */
export function decodeCells(s: unknown): Cells | null {
  if (typeof s !== 'string' || s.length > 200_000) return null;
  let bin: string;
  try {
    bin = atob(s);
  } catch {
    return null;
  }
  if (bin.length % 2 !== 0) return null;
  const cells = emptyCells();
  let at = 0;
  for (let i = 0; i < bin.length; i += 2) {
    const v = bin.charCodeAt(i);
    const run = bin.charCodeAt(i + 1);
    if (run < 1 || at + run > cells.length) return null;
    cells.fill(v, at, at + run);
    at += run;
  }
  return at === BOARD_W * BOARD_H ? cells : null;
}

function parsePoints(v: unknown): number[] | null {
  if (!Array.isArray(v) || v.length < 2 || v.length > MAX_POINTS * 2 || v.length % 2 !== 0) return null;
  for (let i = 0; i < v.length; i += 2) if (!isInt(v[i], 0, PX_W - 1) || !isInt(v[i + 1], 0, PX_H - 1)) return null;
  return v as number[];
}

/** One untrusted op → a chalk or wipe op (never a reset), or null. */
export function parseOp(v: unknown): Op | null {
  if (!isRecord(v)) return null;
  const p = parsePoints(v.p);
  if (!p) return null;
  if (v.t === 'c' && isChalkColor(v.c)) return { t: 'c', c: v.c, p };
  if (v.t === 'w' && isInt(v.w, 0, WET_MAX)) return { t: 'w', w: v.w, p };
  return null;
}

/** An untrusted op list (1 … MAX_OPS, all valid) → the ops, or null. */
export function parseOps(v: unknown): Op[] | null {
  if (!Array.isArray(v) || v.length < 1 || v.length > MAX_OPS) return null;
  const ops: Op[] = [];
  for (const raw of v) {
    const op = parseOp(raw);
    if (!op) return null;
    ops.push(op);
  }
  return ops;
}

/** A service op as it travels in a reply: its rev and the op (a reset included). */
export interface RevOp { rev: number; op: Op }

export type BoardReply =
  | { rev: number; sum: number; ops: RevOp[] }
  | { rev: number; sum: number; cells: Cells };

function parseRevOp(v: unknown): RevOp | null {
  if (!isRecord(v) || !isInt(v.rev, 1, Number.MAX_SAFE_INTEGER)) return null;
  const op = isRecord(v.op) && v.op.t === 'r' ? { t: 'r' as const } : parseOp(v.op);
  return op ? { rev: v.rev, op } : null;
}

/** An untrusted GET / POST reply → the ops after `since` or the whole board, or null. */
export function parseBoardReply(v: unknown): BoardReply | null {
  if (!isRecord(v) || !isInt(v.rev, 0, Number.MAX_SAFE_INTEGER) || !isInt(v.sum, 0, 0xffffffff)) return null;
  if ('cells' in v) {
    const cells = decodeCells(v.cells);
    return cells ? { rev: v.rev, sum: v.sum, cells } : null;
  }
  if (!Array.isArray(v.ops) || v.ops.length > 1000) return null;
  const ops: RevOp[] = [];
  for (const raw of v.ops) {
    const op = parseRevOp(raw);
    if (!op) return null;
    ops.push(op);
  }
  return { rev: v.rev, sum: v.sum, ops };
}
