import { describe, it, expect } from 'vitest';
import {
  applySubmission, emptyTable, LADDER_AVATARS, MAX_ENTRIES, parseSubmission, parseTable, publicLadder, removeEntry,
  type LadderTable, type Submission,
} from '../../src/game/ladder';
import { AVATAR_IDS } from '../../src/game/profiles';

const ID = 'p_0123456789abcdefghijkl';
const SECRET = 's'.repeat(40);
const hash = (s: string): string => `h:${s}`;
const sub = (over: Partial<Submission> = {}): Submission => ({
  id: ID, secret: SECRET, callsign: 'MAVERICK', avatar: 'pilot1',
  stats: { stars: 10, medals: 2, kills: 100, golds: 1, silvers: 0, bronzes: 0 }, ...over,
});
const post = (t: LadderTable, s: Submission, now = 1000) => applySubmission(t, s, hash(s.secret), now);

describe('Online ladder rules', () => {
  it('accepts only well-formed submissions', () => {
    expect(parseSubmission(JSON.parse(JSON.stringify(sub())))).toEqual(sub());
    expect(parseSubmission({ ...sub(), id: 'x' })).toBeNull();
    expect(parseSubmission({ ...sub(), secret: 'short' })).toBeNull();
    expect(parseSubmission({ ...sub(), callsign: '<script>' })).toBeNull();
    expect(parseSubmission({ ...sub(), avatar: 'pilot9' })).toBeNull();
    expect(parseSubmission({ ...sub(), stats: { stars: 'many' } })).toBeNull();
    expect(parseSubmission(null)).toBeNull();
    expect(parseSubmission({ ...sub(), callsign: '  maverick ' })?.callsign).toBe('MAVERICK');
  });

  it('computes the rating on the server side from the stats', () => {
    const r = post(emptyTable(), sub({ stats: { stars: 999, medals: 99, kills: 1e9, golds: 99, silvers: 0, bronzes: 0 } }));
    expect(r.ok && r.entry.rating).toBe(19000);
  });

  it('creates an entry, then lets only the owner update it', () => {
    const first = post(emptyTable(), sub());
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    expect(first.entry).toMatchObject({ id: ID, secretHash: hash(SECRET), callsign: 'MAVERICK', rating: 1000 + 500 + 200 + 150, updatedAt: 1000 });
    const thief = post(first.table, sub({ secret: 'x'.repeat(40), callsign: 'HACKER' }), 2000);
    expect(thief).toEqual({ ok: false, status: 403, reason: 'secret' });
    const update = post(first.table, sub({ stats: { ...sub().stats, stars: 20 } }), 3000);
    expect(update.ok && update.entry.rating).toBe(2000 + 500 + 200 + 150);
    expect(update.ok && update.table.pilots).toHaveLength(1);
  });

  it('ranks publicly by rating, ties by who got there first, without ids or secrets', () => {
    let t = emptyTable();
    const add = (id: string, callsign: string, stars: number, now: number) => {
      const r = post(t, sub({ id, callsign, stats: { stars, medals: 0, kills: 0, golds: 0, silvers: 0, bronzes: 0 } }), now);
      if (r.ok) t = r.table;
    };
    add('p_aaaaaaaaaaaaaaaaaaaaaa', 'ICE', 30, 5);
    add('p_bbbbbbbbbbbbbbbbbbbbbb', 'GOOSE', 50, 6);
    add('p_cccccccccccccccccccccc', 'VIPER', 30, 4);
    const pub = publicLadder(t);
    expect(pub.map((p) => p.callsign)).toEqual(['GOOSE', 'VIPER', 'ICE']);
    expect(pub[0]).toEqual({ callsign: 'GOOSE', avatar: 'pilot1', rating: 5000, rank: 'lcdr', updatedAt: 6 });
    expect(JSON.stringify(pub)).not.toMatch(/secret|p_aaaa|h:/);
  });

  it('keeps at most MAX_ENTRIES, dropping the lowest-rated', () => {
    let t = emptyTable();
    for (let i = 0; i < MAX_ENTRIES + 3; i++) {
      const id = `p_${String(i).padStart(22, '0')}`;
      const r = post(t, sub({ id, stats: { stars: i % 90, medals: 0, kills: 0, golds: 0, silvers: 0, bronzes: 0 } }), i);
      if (r.ok) t = r.table;
    }
    expect(t.pilots).toHaveLength(MAX_ENTRIES);
    expect(t.pilots.some((p) => p.rating === 0 && p.updatedAt < 90)).toBe(false);
  });

  it('removes an entry with the right secret only, and reads a stored table defensively', () => {
    const r = post(emptyTable(), sub());
    if (!r.ok) throw new Error('setup');
    expect(removeEntry(r.table, ID, hash('nope'.repeat(10))).pilots).toHaveLength(1);
    expect(removeEntry(r.table, ID, hash(SECRET)).pilots).toHaveLength(0);
    expect(parseTable(JSON.parse(JSON.stringify(r.table)))).toEqual(r.table);
    expect(parseTable({ version: 1, pilots: [{ id: 'bad' }, r.table.pilots[0]] }).pilots).toHaveLength(1);
    expect(parseTable('garbage')).toEqual(emptyTable());
    expect([...LADDER_AVATARS]).toEqual([...AVATAR_IDS]);
  });
});
