import { describe, expect, it } from 'vitest';
import { boardSum, emptyCells } from '../../src/game/chalkboard';
import type { BoardReply } from '../../src/game/chalkboard-codec';
import { applyOp, type Op } from '../../src/game/chalkboard-ops';
import { BoardSync } from '../../src/game/chalkboard-sync';

const line = (y: number, c: 0 | 1 = 0): Op => ({ t: 'c', c, p: [40, y, 400, y] });
const wipe = (w: number): Op => ({ t: 'w', w, p: [40, 40, 400, 40] });

/** The board the service has after these ops. */
function serverAfter(ops: readonly Op[]): Uint8Array {
  const cells = emptyCells();
  for (const op of ops) applyOp(cells, op);
  return cells;
}
const reply = (rev: number, ops: Array<[number, Op]>, all: readonly Op[]): BoardReply =>
  ({ rev, sum: boardSum(serverAfter(all)), ops: ops.map(([r, op]) => ({ rev: r, op })) });

describe('BoardSync', () => {
  it('shows own strokes at once and posts them one batch at a time', () => {
    const s = new BoardSync();
    s.add(line(40));
    s.add(line(80));
    expect(boardSum(s.view)).toBe(boardSum(serverAfter([line(40), line(80)])));
    expect(s.takePost()).toHaveLength(2);
    s.add(line(120));
    expect(s.takePost()).toBeNull();
    expect(s.busy).toBe(true);
    expect(s.waiting).toBe(1);
  });

  it('a post reply brings others\' strokes in the service order, with own pending ones on top', () => {
    const s = new BoardSync();
    const mine = line(40, 1);
    s.add(mine);
    s.takePost();
    s.add(line(200));
    const theirs = line(120);
    const served = [theirs, mine];
    expect(s.receive(reply(2, [[1, theirs], [2, mine]], served))).toBe('ok');
    expect(s.rev).toBe(2);
    expect(s.busy).toBe(false);
    expect(boardSum(s.view)).toBe(boardSum(serverAfter([...served, line(200)])));
  });

  it('ignores ops it already has and takes a whole board as it comes', () => {
    const s = new BoardSync();
    s.receive(reply(1, [[1, line(40)]], [line(40)]));
    expect(s.receive(reply(1, [[1, line(40)]], [line(40)]))).toBe('ok');
    const cells = serverAfter([line(60), wipe(0)]);
    expect(s.receive({ rev: 7, sum: boardSum(cells), cells: cells.slice() })).toBe('ok');
    expect(boardSum(s.view)).toBe(boardSum(cells));
    expect(s.known).toBe(true);
  });

  it('reports drift when its copy no longer matches the service', () => {
    const s = new BoardSync();
    expect(s.receive({ rev: 1, sum: 12345, ops: [{ rev: 1, op: line(40) }] })).toBe('drift');
  });

  it('a failed post: retry keeps the ops, a refusal drops only the chalk, bad ops are dropped', () => {
    const s = new BoardSync();
    s.add(line(40));
    s.add(wipe(10));
    s.takePost();
    s.postFailed('retry');
    expect(s.waiting).toBe(2);
    s.takePost();
    s.postFailed('dropChalk');
    expect(s.waiting).toBe(1);
    expect(boardSum(s.view)).toBe(boardSum(serverAfter([wipe(10)])));
    s.takePost();
    s.postFailed('dropAll');
    expect(s.waiting).toBe(0);
    expect(boardSum(s.view)).toBe(boardSum(emptyCells()));
  });
});
