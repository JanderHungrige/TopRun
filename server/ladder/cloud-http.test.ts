import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { emptyTable, type LadderTable } from '../../src/game/ladder.ts';
import { emptySaves, MAX_SAVE_BYTES, type SaveTable } from '../../src/game/ladder-cloud.ts';
import { PILOTS_PATH, SAVE_PATH } from './cloud-http.ts';
import { LADDER_PATH, ladderHandler } from './http.ts';
import type { Store } from './store.ts';

function memory<T>(start: T): Store<T> & { sets: number } {
  let value = start;
  const s = { sets: 0, get: () => value, set(v: T) { value = v; s.sets++; }, flush: () => Promise.resolve() };
  return s;
}

const ID = 'p_0123456789abcdefghijkl';
const SECRET = 'k'.repeat(43);
const pilot = { id: ID, secret: SECRET, callsign: 'Iceman', avatar: 'pilot11', country: 'NL', stats: { stars: 12, medals: 1, kills: 40, golds: 0, silvers: 2, bronzes: 0 } };
const SAVE = { money: 4200, look: null, ladder: { id: ID, secret: SECRET, share: true, country: 'NL' } };

let server: Server;
let base = '';
let ladder: Store<LadderTable> & { sets: number };
let saves: Store<SaveTable> & { sets: number };
let clock = 2_000_000;

beforeEach(async () => {
  ladder = memory(emptyTable());
  saves = memory(emptySaves());
  server = createServer(ladderHandler({ ladder, saves }, () => clock));
  await new Promise<void>((done) => server.listen(0, '127.0.0.1', () => done()));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});
afterEach(() => new Promise<void>((done) => server.close(() => done())));

const json = (method: string, path: string, body: unknown) =>
  fetch(`${base}${path}`, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

describe('Cloud pilots HTTP (doc 34)', () => {
  it('keeps a save for a ladder pilot and finds it by callsign', async () => {
    expect((await json('PUT', SAVE_PATH, { id: ID, secret: SECRET, save: SAVE })).status).toBe(404);
    await json('POST', LADDER_PATH, pilot);
    const put = await json('PUT', SAVE_PATH, { id: ID, secret: SECRET, save: SAVE });
    expect(put.status).toBe(200);
    expect(await put.json()).toEqual({ savedAt: clock });
    const found = await (await fetch(`${base}${PILOTS_PATH}?callsign=iceman`)).json();
    expect(found).toEqual({ pilots: [{ ref: ID, callsign: 'ICEMAN', avatar: 'pilot11', country: 'NL', rank: 'ltjg', rating: 1690, savedAt: clock }] });
    expect(JSON.stringify(found)).not.toContain('kkkk');
    expect(await (await fetch(`${base}${SAVE_PATH}?ref=${ID}`)).json()).toEqual({ save: SAVE, savedAt: clock });
    expect((await fetch(`${base}${SAVE_PATH}?ref=p_nobodynobodynobodynob`)).status).toBe(404);
    expect((await fetch(`${base}${SAVE_PATH}?ref=../etc`)).status).toBe(400);
  });

  it('rejects wrong secrets, junk and oversized saves', async () => {
    await json('POST', LADDER_PATH, pilot);
    expect((await json('PUT', SAVE_PATH, { id: ID, secret: 'z'.repeat(43), save: SAVE })).status).toBe(403);
    expect((await json('PUT', SAVE_PATH, { id: ID, secret: SECRET, save: [1] })).status).toBe(400);
    expect((await json('PUT', SAVE_PATH, { id: ID, secret: SECRET, save: { pad: 'x'.repeat(MAX_SAVE_BYTES + 10) } })).status).toBe(413);
    expect((await fetch(`${base}${PILOTS_PATH}`, { method: 'POST' })).status).toBe(405);
    expect(saves.sets).toBe(0);
  });

  it('drops the save when the pilot leaves the ladder', async () => {
    await json('POST', LADDER_PATH, pilot);
    await json('PUT', SAVE_PATH, { id: ID, secret: SECRET, save: SAVE });
    await json('DELETE', LADDER_PATH, { id: ID, secret: SECRET });
    expect(saves.get()).toEqual(emptySaves());
    expect(await (await fetch(`${base}${PILOTS_PATH}?callsign=ICEMAN`)).json()).toEqual({ pilots: [] });
  });
});
