import { boardSum, emptyCells, type Cells } from './chalkboard.ts';
import { decodeCells, encodeCells, type RevOp } from './chalkboard-codec.ts';
import { applyOp, type Op } from './chalkboard-ops.ts';

// Chalkboard (doc 40): the service's side of the board, pure. The room holds the cells, numbers every op it applies
// (`rev`), keeps the latest ops for clients that ask what changed since their rev, and a moderation log of who did
// what (ladder id or null). `table()` is what goes to board.json.

/** Ops kept in memory for `since` replies; older clients get the whole board. */
export const KEEP_OPS = 400;
/** Moderation log entries kept on disk. */
export const MAX_LOG = 2000;

export interface BoardLogEntry { rev: number; by: string | null; t: Op['t']; at: number }

export interface BoardTable {
  version: 1;
  rev: number;
  /** encodeCells of the board. */
  cells: string;
  log: BoardLogEntry[];
}

export type RoomReply =
  | { rev: number; sum: number; ops: RevOp[] }
  | { rev: number; sum: number; cells: string };

export const emptyBoardTable = (): BoardTable => ({ version: 1, rev: 0, cells: encodeCells(emptyCells()), log: [] });

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const isCount = (v: unknown): v is number => Number.isInteger(v) && (v as number) >= 0;

function parseLogEntry(v: unknown): BoardLogEntry | null {
  if (!isRecord(v) || !isCount(v.rev) || !isCount(v.at)) return null;
  if (v.t !== 'c' && v.t !== 'w' && v.t !== 'r') return null;
  if (v.by !== null && typeof v.by !== 'string') return null;
  return { rev: v.rev, by: v.by, t: v.t, at: v.at };
}

/** A stored board.json → the table; throws when it is not one (the store moves the file aside). */
export function parseBoardTable(v: unknown): BoardTable {
  if (!isRecord(v) || v.version !== 1 || !isCount(v.rev) || !decodeCells(v.cells) || !Array.isArray(v.log)) {
    throw new Error('not a board table');
  }
  const log = v.log.map(parseLogEntry).filter((e): e is BoardLogEntry => e !== null).slice(-MAX_LOG);
  return { version: 1, rev: v.rev, cells: v.cells as string, log };
}

export class BoardRoom {
  private cells: Cells;
  private rev: number;
  private recent: RevOp[] = [];
  private log: BoardLogEntry[];

  constructor(table: BoardTable) {
    this.cells = decodeCells(table.cells) ?? emptyCells();
    this.rev = table.rev;
    this.log = table.log.slice(-MAX_LOG);
  }

  /** What changed after `since`: the ops when they are all still here, else the whole board. */
  since(since: number | null): RoomReply {
    const sum = boardSum(this.cells);
    const oldest = this.recent[0]?.rev ?? this.rev + 1;
    if (since !== null && since <= this.rev && (since === this.rev || since >= oldest - 1)) {
      return { rev: this.rev, sum, ops: this.recent.filter((r) => r.rev > since) };
    }
    return { rev: this.rev, sum, cells: encodeCells(this.cells) };
  }

  /** Applies the ops in order (each gets the next rev) for `by` (a ladder id, or null for an anonymous wipe). */
  apply(ops: readonly Op[], by: string | null, now: number): void {
    for (const op of ops) {
      applyOp(this.cells, op);
      this.rev += 1;
      this.recent.push({ rev: this.rev, op });
      this.log.push({ rev: this.rev, by, t: op.t, at: now });
    }
    if (this.recent.length > KEEP_OPS) this.recent.splice(0, this.recent.length - KEEP_OPS);
    if (this.log.length > MAX_LOG) this.log.splice(0, this.log.length - MAX_LOG);
  }

  /** The owner's reset: the whole board clean. */
  reset(now: number): void {
    this.apply([{ t: 'r' }], null, now);
  }

  table(): BoardTable {
    return { version: 1, rev: this.rev, cells: encodeCells(this.cells), log: this.log.slice() };
  }
}
