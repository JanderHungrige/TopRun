import { describe, expect, it } from 'vitest';
import { BOARD_H, BOARD_W, boardSum, colorOf, densityOf, emptyCells, MAX_DENSITY, PX_H, PX_W } from '../../src/game/chalkboard';
import { decodeCells, encodeCells, MAX_OPS, MAX_POINTS, parseBoardReply, parseOps } from '../../src/game/chalkboard-codec';
import { applyOp, HAZE, SPONGE_H, SPONGE_W, WET_MAX, type Op } from '../../src/game/chalkboard-ops';
import { BoardRoom, emptyBoardTable, KEEP_OPS, MAX_LOG, parseBoardTable } from '../../src/game/chalkboard-room';
import { MIN_STEP_PX, SPLIT_POINTS, Stroke, toBoardPx } from '../../src/game/chalkboard-stroke';

const at = (x: number, y: number): number => y * BOARD_W + x;
const inked = (cells: Uint8Array): number => cells.reduce((n, v) => n + (densityOf(v) > 0 ? 1 : 0), 0);
const total = (cells: Uint8Array): number => cells.reduce((n, v) => n + densityOf(v), 0);

/** A word-ish block of chalk: horizontal lines 12 px apart over x 200 … 600, y 100 … 200. */
function scribble(cells = emptyCells()): Uint8Array {
  for (let y = 100; y <= 200; y += 12) applyOp(cells, { t: 'c', c: 0, p: [200, y, 600, y] });
  return cells;
}

describe('chalk', () => {
  it('draws a grainy line about two cells thick along the points, in its colour', () => {
    const cells = emptyCells();
    applyOp(cells, { t: 'c', c: 2, p: [100, 100, 300, 100] });
    for (let x = 26; x <= 74; x++) {
      const col = [23, 24, 25, 26, 27].map((y) => densityOf(cells[at(x, y)] ?? 0));
      expect(col.filter((d) => d > 0).length).toBeGreaterThanOrEqual(2);
      expect(col.filter((d) => d > 0).length).toBeLessThanOrEqual(3);
    }
    expect(colorOf(cells[at(50, 25)] ?? 0)).toBe(2);
    const ds = new Set(Array.from(cells).filter((v) => v > 0).map(densityOf));
    expect(ds.size).toBeGreaterThan(5);
    expect(densityOf(cells[at(10, 10)] ?? 0)).toBe(0);
  });

  it('stamps each cell once per stroke, however slowly it is drawn', () => {
    const slow = emptyCells();
    const fast = emptyCells();
    applyOp(slow, { t: 'c', c: 0, p: [100, 100, 101, 100, 102, 100, 103, 100, 104, 100] });
    applyOp(fast, { t: 'c', c: 0, p: [100, 100, 104, 100] });
    expect(Array.from(slow)).toEqual(Array.from(fast));
  });

  it('caps the density and stays inside the board at the edges', () => {
    const cells = emptyCells();
    for (let i = 0; i < 5; i++) applyOp(cells, { t: 'c', c: 1, p: [0, 0, PX_W - 1, PX_H - 1] });
    expect(Math.max(...Array.from(cells).map(densityOf))).toBeLessThanOrEqual(MAX_DENSITY);
    expect(cells.length).toBe(BOARD_W * BOARD_H);
    expect(densityOf(cells[at(0, 0)] ?? 0)).toBeGreaterThan(0);
    expect(densityOf(cells[at(BOARD_W - 1, BOARD_H - 1)] ?? 0)).toBeGreaterThan(0);
  });
});

describe('sponge', () => {
  it('wet: cleans everything under the sponge and uses one wetness per cell of travel', () => {
    const cells = scribble();
    const left = applyOp(cells, { t: 'w', w: WET_MAX, p: [180, 150, 640, 150] });
    expect(left).toBe(WET_MAX - 1 - (640 - 180) / 4); // the first point and one per 4 px
    for (let y = 150 / 4 - SPONGE_H / 2; y < 150 / 4 + SPONGE_H / 2; y++) {
      for (let x = 50; x <= 150; x++) expect(cells[at(x, y)]).toBe(0);
    }
    expect(inked(cells)).toBeGreaterThan(0);
  });

  it('dry: smears instead of cleaning — less chalk, spread wider, never below the haze', () => {
    const before = scribble();
    const cells = before.slice();
    const sweep: Op = { t: 'w', w: 0, p: [180, 104, 640, 104, 640, 128, 180, 128, 180, 152, 640, 152, 640, 176, 180, 176, 180, 200, 640, 200] };
    applyOp(cells, sweep);
    expect(total(cells)).toBeLessThan(total(before) * 0.75);
    expect(inked(cells)).toBeGreaterThanOrEqual(inked(before));
    for (let x = 55; x <= 145; x++) expect(densityOf(cells[at(x, 30)] ?? 0)).toBeGreaterThanOrEqual(HAZE);
    // wiping dry again and again never gets it clean
    for (let i = 0; i < 6; i++) applyOp(cells, sweep);
    expect(inked(cells)).toBeGreaterThan(inked(before) * 0.5);
  });

  it('runs dry part way: the rest of the stroke smears', () => {
    const cells = scribble();
    const left = applyOp(cells, { t: 'w', w: 30, p: [180, 150, 640, 150] });
    expect(left).toBe(0);
    expect(cells[at(60, 37)]).toBe(0);
    expect(densityOf(cells[at(140, 37)] ?? 0)).toBeGreaterThan(0);
    expect(SPONGE_W).toBe(16);
  });

  it('is deterministic: the same ops give the same bytes', () => {
    const a = scribble();
    const b = scribble();
    const op: Op = { t: 'w', w: 0, p: [190, 120, 420, 180, 610, 110] };
    applyOp(a, op);
    applyOp(b, op);
    expect(boardSum(a)).toBe(boardSum(b));
  });
});

describe('codec', () => {
  it('round-trips the board and keeps an empty board tiny', () => {
    const cells = scribble();
    expect(Array.from(decodeCells(encodeCells(cells)) ?? [])).toEqual(Array.from(cells));
    expect(encodeCells(emptyCells()).length).toBeLessThan(400);
    expect(decodeCells('AAA=')).toBeNull();
    expect(decodeCells(42)).toBeNull();
    expect(decodeCells('%%%')).toBeNull();
  });

  it('accepts only well-formed chalk and wipe ops', () => {
    expect(parseOps([{ t: 'c', c: 3, p: [0, 0, PX_W - 1, PX_H - 1] }, { t: 'w', w: WET_MAX, p: [5, 5] }])).toHaveLength(2);
    const bad = [
      [], [{ t: 'r' }], [{ t: 'c', c: 4, p: [1, 1] }], [{ t: 'c', c: 0, p: [1] }], [{ t: 'c', c: 0, p: [PX_W, 1] }],
      [{ t: 'c', c: 0, p: [1.5, 1] }], [{ t: 'w', w: WET_MAX + 1, p: [1, 1] }], [{ t: 'w', w: -1, p: [1, 1] }],
      [{ t: 'c', c: 0, p: Array.from({ length: MAX_POINTS * 2 + 2 }, () => 1) }],
      Array.from({ length: MAX_OPS + 1 }, () => ({ t: 'w', w: 0, p: [1, 1] })), 'x', null,
    ];
    for (const v of bad) expect(parseOps(v)).toBeNull();
  });

  it('parses replies with ops (resets included) or a whole board', () => {
    expect(parseBoardReply({ rev: 3, sum: 1, ops: [{ rev: 3, op: { t: 'r' } }] })).toEqual({ rev: 3, sum: 1, ops: [{ rev: 3, op: { t: 'r' } }] });
    const whole = parseBoardReply({ rev: 9, sum: 5, cells: encodeCells(emptyCells()) });
    expect(whole && 'cells' in whole ? whole.cells.length : 0).toBe(BOARD_W * BOARD_H);
    expect(parseBoardReply({ rev: -1, sum: 0, ops: [] })).toBeNull();
    expect(parseBoardReply({ rev: 1, sum: 0, ops: [{ rev: 1, op: { t: 'x' } }] })).toBeNull();
  });
});

describe('room (service)', () => {
  it('numbers ops, answers since with the ops or the whole board, and logs who', () => {
    const room = new BoardRoom(emptyBoardTable());
    room.apply([{ t: 'c', c: 0, p: [10, 10, 50, 10] }], 'pilot_a', 1000);
    room.apply([{ t: 'w', w: 0, p: [10, 10] }], null, 2000);
    const r = room.since(1);
    expect(r.rev).toBe(2);
    expect('ops' in r && r.ops.map((o) => o.rev)).toEqual([2]);
    expect('ops' in room.since(2) && room.since(2)).toMatchObject({ ops: [] });
    expect('cells' in room.since(null)).toBe(true);
    expect('cells' in room.since(99)).toBe(true);
    expect(room.table().log).toEqual([{ rev: 1, by: 'pilot_a', t: 'c', at: 1000 }, { rev: 2, by: null, t: 'w', at: 2000 }]);
  });

  it('keeps only the latest ops in memory and the latest log on disk; old clients get the whole board', () => {
    const room = new BoardRoom(emptyBoardTable());
    for (let i = 0; i < KEEP_OPS + 10; i++) room.apply([{ t: 'w', w: 0, p: [4, 4] }], null, i);
    expect('cells' in room.since(5)).toBe(true);
    expect('ops' in room.since(KEEP_OPS + 9)).toBe(true);
    for (let i = 0; i < MAX_LOG; i++) room.apply([{ t: 'w', w: 0, p: [4, 4] }], null, i);
    expect(room.table().log.length).toBe(MAX_LOG);
  });

  it('resets, survives a restart through its table, and rejects a broken file', () => {
    const room = new BoardRoom(emptyBoardTable());
    room.apply([{ t: 'c', c: 1, p: [10, 10, 300, 300] }], 'p', 1);
    const again = new BoardRoom(parseBoardTable(JSON.parse(JSON.stringify(room.table()))));
    expect(again.since(null)).toEqual(room.since(null));
    again.reset(5);
    const r = again.since(1);
    expect('ops' in r ? r.ops[0]?.op : null).toEqual({ t: 'r' });
    expect(again.since(null)).toMatchObject({ rev: 2, sum: boardSum(emptyCells()) });
    expect(() => parseBoardTable({ version: 1, rev: 0, cells: 'nope', log: [] })).toThrow();
  });
});

describe('stroke', () => {
  it('maps screen points onto the slate, skips tiny moves and reports when it is time to hand it over', () => {
    expect(toBoardPx({ x: 40.4, y: 92.6 }, 40, 92)).toEqual([0, 1]);
    expect(toBoardPx({ x: -50, y: 900 }, 40, 92)).toEqual([0, PX_H - 1]);
    expect(toBoardPx({ x: 5000, y: 0 }, 40, 92)).toEqual([PX_W - 1, 0]);
    const s = new Stroke({ color: 2 }, 10, 10);
    expect(s.add(10 + MIN_STEP_PX - 1, 10)).toBe(false);
    expect(s.add(10 + MIN_STEP_PX, 10)).toBe(true);
    expect(s.op).toEqual({ t: 'c', c: 2, p: [10, 10, 13, 10] });
    const w = new Stroke({ wet: 300 }, 0, 0);
    for (let i = 1; !w.full; i++) w.add(i * MIN_STEP_PX, 0);
    expect(w.op.p.length / 2).toBe(SPLIT_POINTS);
    expect(parseOps([w.op])).not.toBeNull();
  });
});
