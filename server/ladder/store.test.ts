import { mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { applySubmission, emptyTable, parseTable } from '../../src/game/ladder.ts';
import { openStore } from './store.ts';

let dir = '';
beforeEach(async () => { dir = await mkdtemp(join(tmpdir(), 'ladder-')); });
afterEach(() => rm(dir, { recursive: true, force: true }));

const sub = {
  id: 'p_0123456789abcdefghijkl', secret: 's'.repeat(40), callsign: 'GOOSE', avatar: 'pilot4',
  stats: { stars: 4, medals: 0, kills: 0, golds: 0, silvers: 0, bronzes: 0 },
};

describe('Ladder store', () => {
  it('starts empty without a file, writes on flush, and reads it back', async () => {
    const file = join(dir, 'ladder.json');
    const store = await openStore(file, 60_000);
    expect(store.get()).toEqual(emptyTable());
    const r = applySubmission(store.get(), sub, 'hash', 5);
    if (!r.ok) throw new Error('setup');
    store.set(r.table);
    await store.flush();
    expect(parseTable(JSON.parse(await readFile(file, 'utf8')))).toEqual(r.table);
    expect((await openStore(file)).get()).toEqual(r.table);
    expect(await readdir(dir)).toEqual(['ladder.json']);
  });

  it('writes on its own after the debounce delay', async () => {
    const file = join(dir, 'ladder.json');
    const store = await openStore(file, 10);
    const r = applySubmission(store.get(), sub, 'hash', 5);
    if (!r.ok) throw new Error('setup');
    store.set(r.table);
    await new Promise((done) => setTimeout(done, 80));
    expect(JSON.parse(await readFile(file, 'utf8')).pilots).toHaveLength(1);
  });

  it('moves an unreadable file aside instead of crashing or overwriting it', async () => {
    const file = join(dir, 'ladder.json');
    await writeFile(file, '{ broken', 'utf8');
    const store = await openStore(file);
    expect(store.get()).toEqual(emptyTable());
    const names = await readdir(dir);
    expect(names).toHaveLength(1);
    expect(names[0]).toMatch(/^ladder\.json\.corrupt-\d+$/);
  });
});
