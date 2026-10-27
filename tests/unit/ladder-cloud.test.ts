import { describe, it, expect } from 'vitest';
import { applySubmission, emptyTable, type LadderTable, type Submission } from '../../src/game/ladder';
import {
  applyUpload, emptySaves, findPilots, MAX_MATCHES, MAX_SAVE_BYTES, parseSaves, parseUpload, pruneSaves,
} from '../../src/game/ladder-cloud';

const hash = (s: string): string => `h:${s}`;
const SECRET = 's'.repeat(40);
const id = (n: number): string => `p_${String(n).padStart(22, '0')}`;
const sub = (n: number, callsign: string, stars: number): Submission => ({
  id: id(n), secret: SECRET, callsign, avatar: 'pilot3', country: 'DE',
  stats: { stars, medals: 0, kills: 0, golds: 0, silvers: 0, bronzes: 0 },
});
function ladder(...subs: Submission[]): LadderTable {
  let t = emptyTable();
  for (const s of subs) {
    const r = applySubmission(t, s, hash(s.secret), 100);
    if (r.ok) t = r.table;
  }
  return t;
}
const SAVE = { money: 1200, progress: { m1: { stars: 3 } } };

describe('Cloud pilots (doc 34)', () => {
  it('accepts an upload only with a valid identity and a JSON object of bounded size', () => {
    expect(parseUpload({ id: id(1), secret: SECRET, save: SAVE })).toEqual({ id: id(1), secret: SECRET, save: SAVE });
    expect(parseUpload({ id: id(1), secret: SECRET, save: [1, 2] })).toBeNull();
    expect(parseUpload({ id: id(1), secret: SECRET, save: 'x' })).toBeNull();
    expect(parseUpload({ id: 'x', secret: SECRET, save: SAVE })).toBeNull();
    expect(parseUpload({ id: id(1), secret: SECRET, save: { pad: 'x'.repeat(MAX_SAVE_BYTES) } })).toBeNull();
    expect(parseUpload(null)).toBeNull();
  });

  it('stores a save only for an existing entry with the right secret', () => {
    const t = ladder(sub(1, 'ICE', 10));
    const ok = applyUpload(t, emptySaves(), { id: id(1), secret: SECRET, save: SAVE }, hash(SECRET), 500);
    expect(ok).toEqual({ ok: true, saves: { version: 1, saves: { [id(1)]: { save: SAVE, savedAt: 500 } } }, savedAt: 500 });
    expect(applyUpload(t, emptySaves(), { id: id(1), secret: SECRET, save: SAVE }, hash('nope'), 500)).toEqual({ ok: false, status: 403 });
    expect(applyUpload(t, emptySaves(), { id: id(2), secret: SECRET, save: SAVE }, hash(SECRET), 500)).toEqual({ ok: false, status: 404 });
  });

  it('finds pilots by exact callsign, only with a cloud save, best first, without secrets', () => {
    const t = ladder(sub(1, 'ICE', 10), sub(2, 'ICE', 30), sub(3, 'ICEMAN', 50), sub(4, 'ICE', 90));
    let saves = emptySaves();
    for (const n of [1, 2, 3]) {
      const r = applyUpload(t, saves, { id: id(n), secret: SECRET, save: SAVE }, hash(SECRET), 700 + n);
      if (r.ok) saves = r.saves;
    }
    const found = findPilots(t, saves, '  ice ');
    expect(found.map((p) => p.ref)).toEqual([id(2), id(1)]);
    expect(found[0]).toEqual({ ref: id(2), callsign: 'ICE', avatar: 'pilot3', country: 'DE', rank: 'lt', rating: 3000, savedAt: 702 });
    expect(JSON.stringify(found)).not.toContain('h:');
    expect(findPilots(t, saves, 'GOOSE')).toEqual([]);
    expect(findPilots(t, saves, 7)).toEqual([]);
    expect(MAX_MATCHES).toBe(10);
  });

  it('drops saves whose ladder entry is gone and reads a stored file defensively', () => {
    const t = ladder(sub(1, 'ICE', 10));
    const r = applyUpload(t, emptySaves(), { id: id(1), secret: SECRET, save: SAVE }, hash(SECRET), 500);
    if (!r.ok) throw new Error('setup');
    expect(pruneSaves(t, r.saves)).toBe(r.saves);
    expect(pruneSaves(emptyTable(), r.saves)).toEqual(emptySaves());
    expect(parseSaves(JSON.parse(JSON.stringify(r.saves)))).toEqual(r.saves);
    expect(parseSaves({ version: 1, saves: { bad: { save: SAVE, savedAt: 1 }, [id(2)]: { save: 3, savedAt: 1 } } })).toEqual(emptySaves());
    expect(parseSaves('junk')).toEqual(emptySaves());
  });
});
