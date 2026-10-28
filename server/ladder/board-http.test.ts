import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { BoardRoom, emptyBoardTable, type BoardTable } from '../../src/game/chalkboard-room.ts';
import { emptySaves } from '../../src/game/ladder-cloud.ts';
import { emptyTable, type LadderTable } from '../../src/game/ladder.ts';
import { BOARD_PATH, BOARD_POSTS_PER_MIN } from './board-http.ts';
import { hashSecret, ladderHandler } from './http.ts';
import type { Store } from './store.ts';

function memory<T>(start: T): Store<T> & { sets: number } {
  let value = start;
  const s = { sets: 0, get: () => value, set(v: T) { value = v; s.sets++; }, flush: () => Promise.resolve() };
  return s;
}

const ID = 'p_0123456789abcdefghijkl';
const SECRET = 'k'.repeat(43);
const ladderWith = (): LadderTable => ({
  ...emptyTable(),
  pilots: [{
    id: ID, secretHash: hashSecret(SECRET), callsign: 'Iceman', avatar: null, country: null,
    stats: { stars: 1, medals: 0, kills: 0, golds: 0, silvers: 0, bronzes: 0, score: 0 }, rating: 100, ratedAt: 1, updatedAt: 1,
  }],
});

const chalk = { t: 'c', c: 0, p: [10, 10, 200, 10] };
const wipe = { t: 'w', w: 600, p: [10, 10, 200, 10] };

let server: Server;
let base = '';
let board: ReturnType<typeof memory<BoardTable>>;
let room: BoardRoom;
const clock = 5_000_000;

beforeEach(async () => {
  board = memory(emptyBoardTable());
  room = new BoardRoom(board.get());
  server = createServer(ladderHandler({ ladder: memory(ladderWith()), saves: memory(emptySaves()), board, room }, () => clock));
  await new Promise<void>((done) => server.listen(0, '127.0.0.1', () => done()));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});
afterEach(() => new Promise<void>((done) => server.close(() => done())));

const post = (body: unknown) =>
  fetch(`${base}${BOARD_PATH}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

describe('Chalkboard on the ladder service', () => {
  it('serves the whole board, then only what changed', async () => {
    const all = (await (await fetch(`${base}${BOARD_PATH}`)).json()) as Record<string, unknown>;
    expect(all).toMatchObject({ rev: 0 });
    expect(typeof all.cells).toBe('string');
    const r = await post({ id: ID, secret: SECRET, since: 0, ops: [chalk] });
    expect(r.status).toBe(200);
    expect(await r.json()).toMatchObject({ rev: 1, ops: [{ rev: 1, op: chalk }] });
    expect(await (await fetch(`${base}${BOARD_PATH}?since=1`)).json()).toMatchObject({ rev: 1, ops: [] });
    expect(board.sets).toBe(1);
    expect(board.get().log).toEqual([{ rev: 1, by: ID, t: 'c', at: clock }]);
  });

  it('chalk only for ladder pilots; anyone may wipe', async () => {
    expect((await post({ since: 0, ops: [chalk] })).status).toBe(403);
    expect((await post({ id: 'q_0123456789abcdefghijkl', secret: SECRET, since: 0, ops: [chalk] })).status).toBe(403);
    expect((await post({ id: ID, secret: 's'.repeat(43), since: 0, ops: [chalk] })).status).toBe(403);
    const r = await post({ since: 0, ops: [wipe] });
    expect(r.status).toBe(200);
    expect(board.get().log).toEqual([{ rev: 1, by: null, t: 'w', at: clock }]);
  });

  it('rejects malformed posts, resets from clients and too many posts', async () => {
    expect((await post({ since: 0, ops: [{ t: 'r' }] })).status).toBe(400);
    expect((await post({ since: 0, ops: [] })).status).toBe(400);
    expect((await post({ id: ID, since: 0, ops: [chalk] })).status).toBe(400);
    const text = await fetch(`${base}${BOARD_PATH}`, { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: 'x' });
    expect(text.status).toBe(415);
    expect((await fetch(`${base}${BOARD_PATH}`, { method: 'PUT' })).status).toBe(405);
    for (let i = 0; i < BOARD_POSTS_PER_MIN; i++) expect((await post({ id: ID, secret: SECRET, since: 0, ops: [chalk] })).status).toBe(200);
    expect((await post({ id: ID, secret: SECRET, since: 0, ops: [chalk] })).status).toBe(429);
  });

  it('the owner reset clears the board for everyone', async () => {
    await post({ id: ID, secret: SECRET, since: 0, ops: [chalk] });
    room.reset(clock);
    expect(await (await fetch(`${base}${BOARD_PATH}?since=1`)).json()).toMatchObject({ rev: 2, ops: [{ rev: 2, op: { t: 'r' } }] });
  });
});
