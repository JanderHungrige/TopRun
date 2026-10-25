import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { emptyTable, WRITES_PER_MIN, type LadderTable } from '../../src/game/ladder.ts';
import { HEALTH_PATH, LADDER_PATH, ladderHandler } from './http.ts';
import type { Store } from './store.ts';

const memoryStore = (): Store & { sets: number } => {
  let table: LadderTable = emptyTable();
  const s = {
    sets: 0,
    get: () => table,
    set(t: LadderTable) { table = t; s.sets++; },
    flush: () => Promise.resolve(),
  };
  return s;
};

const pilot = (over: Record<string, unknown> = {}) => ({
  id: 'p_0123456789abcdefghijkl', secret: 'k'.repeat(43), callsign: 'Iceman', avatar: 'pilot3',
  stats: { stars: 12, medals: 1, kills: 40, golds: 0, silvers: 2, bronzes: 0 }, ...over,
});

let server: Server;
let base = '';
let store: ReturnType<typeof memoryStore>;
let clock = 1_000_000;

beforeEach(async () => {
  store = memoryStore();
  server = createServer(ladderHandler(store, () => clock));
  await new Promise<void>((done) => server.listen(0, '127.0.0.1', () => done()));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});
afterEach(() => new Promise<void>((done) => server.close(() => done())));

const send = (method: string, body: unknown, type = 'application/json') =>
  fetch(`${base}${LADDER_PATH}`, { method, headers: { 'Content-Type': type }, body: typeof body === 'string' ? body : JSON.stringify(body) });

describe('Ladder service HTTP', () => {
  it('answers health and an empty ladder', async () => {
    const h = await fetch(`${base}${HEALTH_PATH}`);
    expect(h.status).toBe(200);
    expect(await h.text()).toBe('ok');
    const r = await fetch(`${base}${LADDER_PATH}`);
    expect(r.headers.get('cache-control')).toBe('no-store');
    expect(await r.json()).toEqual({ pilots: [], updatedAt: 0 });
    expect((await fetch(`${base}/api/other`)).status).toBe(404);
  });

  it('stores a submission, rates it itself and never reveals the secret', async () => {
    const r = await send('POST', pilot());
    expect(r.status).toBe(200);
    expect(await r.json()).toEqual({ place: 1, rating: 1200 + 250 + 80 + 160, rank: 'ltjg' });
    const text = await (await fetch(`${base}${LADDER_PATH}`)).text();
    expect(JSON.parse(text).pilots).toEqual([{ callsign: 'ICEMAN', avatar: 'pilot3', rating: 1690, rank: 'ltjg', updatedAt: clock }]);
    expect(text).not.toContain('kkkk');
    expect(text).not.toContain('p_0123');
  });

  it('rejects wrong secrets, junk, wrong content types and oversized bodies', async () => {
    await send('POST', pilot());
    expect((await send('POST', pilot({ secret: 'z'.repeat(43) }))).status).toBe(403);
    expect((await send('POST', '{nope')).status).toBe(400);
    expect((await send('POST', pilot({ stats: 'x' }))).status).toBe(400);
    expect((await send('POST', pilot(), 'text/plain')).status).toBe(415);
    expect((await send('POST', pilot({ pad: 'x'.repeat(3000) }))).status).toBe(413);
    expect((await fetch(`${base}${LADDER_PATH}`, { method: 'PUT' })).status).toBe(405);
    expect(store.sets).toBe(1);
  });

  it('limits writes per pilot and lets the owner delete the entry', async () => {
    for (let i = 0; i < WRITES_PER_MIN; i++) expect((await send('POST', pilot())).status).toBe(200);
    expect((await send('POST', pilot())).status).toBe(429);
    clock += 60_000;
    expect(await (await send('DELETE', { id: pilot().id, secret: 'z'.repeat(43) })).json()).toEqual({ removed: false });
    expect(await (await send('DELETE', { id: pilot().id, secret: pilot().secret })).json()).toEqual({ removed: true });
    expect(await (await fetch(`${base}${LADDER_PATH}`)).json()).toMatchObject({ pilots: [] });
  });
});
