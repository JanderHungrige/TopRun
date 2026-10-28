import { describe, it, expect } from 'vitest';
import { defaultSave, parseSave } from '../../src/game/save';
import {
  ladderAvatar, ladderFace, ladderIdentity, ladderStats, parseLadderLink, parseLadderView, parsePostReply, withLadderLink,
} from '../../src/game/ladder-stats';
import { parseSubmission, takeWrite, WRITES_PER_MIN } from '../../src/game/ladder';
import { RATING } from '../../src/game/rating';
import { MEDAL_IDS } from '../../src/data/medals';
import { emptyRecord } from '../../src/game/service-record';
import { minigameTiers, PLAYABLE } from '../../src/scenes/minigames/registry';
import { pilotStats } from '../../src/scenes/pilot-rating';

const BYTES = Uint8Array.from({ length: 48 }, (_, i) => (i * 37 + 11) & 255);

describe('Ladder client side and write limit', () => {
  it('sums campaign stars and counts minigame medal tiers', () => {
    const save = { ...defaultSave(), progress: { m1: { stars: 3 }, m2: { stars: 2 } } };
    expect(ladderStats(save, ['gold', null, 'silver', 'gold', 'bronze'], 4, 120))
      .toEqual({ stars: 5, medals: 4, kills: 120, golds: 2, silvers: 1, bronzes: 1, score: 0 });
    expect(ladderStats(defaultSave(), [], 0, 0)).toEqual({ stars: 0, medals: 0, kills: 0, golds: 0, silvers: 0, bronzes: 0, score: 0 });
  });

  it('makes an id and secret from random bytes that the service accepts', () => {
    const bytes = BYTES;
    const who = ladderIdentity(bytes);
    expect(who.id).toMatch(/^p_[A-Za-z0-9_-]{22}$/);
    expect(who.secret).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(ladderIdentity(bytes)).toEqual(who);
    const stats = { stars: 0, medals: 0, kills: 0, golds: 0, silvers: 0, bronzes: 0, score: 0 };
    expect(parseSubmission({ ...who, callsign: 'ICE', stats })).not.toBeNull();
    expect(() => ladderIdentity(new Uint8Array(10))).toThrow();
  });

  it('allows WRITES_PER_MIN writes per minute and per pilot', () => {
    let times: number[] = [];
    for (let i = 0; i < WRITES_PER_MIN; i++) {
      const r = takeWrite(times, 1000 + i);
      expect(r.ok).toBe(true);
      times = r.times;
    }
    expect(takeWrite(times, 2000).ok).toBe(false);
    const later = takeWrite(times, 1000 + 60_000);
    expect(later.ok).toBe(true);
    expect(later.times).toHaveLength(WRITES_PER_MIN);
  });

  it('links a pilot to the ladder once, sharing by default, and keeps the link in the save', () => {
    const linked = withLadderLink(defaultSave(), () => BYTES);
    expect(defaultSave().ladder).toBeNull();
    expect(linked.ladder).toEqual({ ...ladderIdentity(BYTES), share: true, country: null });
    expect(withLadderLink(linked, () => { throw new Error('must not draw a new id'); })).toBe(linked);
    expect(parseSave(JSON.parse(JSON.stringify(linked)))?.ladder).toEqual(linked.ladder);
    expect(parseSave({ ...defaultSave(), ladder: 'junk' })?.ladder).toBeNull();
    expect(parseLadderLink({ id: 'x', secret: 'y', share: true })).toBeNull();
    expect(parseLadderLink({ ...ladderIdentity(BYTES), share: 'yes' })).toBeNull();
  });

  it('reads the medal tier of every built minigame; the rating counts the best RATING.games of them (doc 10)', () => {
    expect(PLAYABLE.length).toBeGreaterThanOrEqual(RATING.games);
    expect(RATING.games).toBe(10);
    expect(minigameTiers(defaultSave())).toEqual(PLAYABLE.map(() => null));
    const first = PLAYABLE[0];
    if (!first) throw new Error('no minigames');
    const save = { ...defaultSave(), minigames: { [first.id]: { best: first.medals.gold, plays: 1 } } };
    expect(minigameTiers(save)[0]).toBe('gold');
  });

  it('reads the ladder from the network defensively', () => {
    const ok = { callsign: 'GOOSE', avatar: 'pilot3', country: 'CH', rating: 5000, rank: 'lcdr', updatedAt: 9 };
    expect(parseLadderView({ pilots: [ok, { ...ok, callsign: '<b>x</b>' }, { ...ok, rank: 'pope' }, 7], updatedAt: 9 }))
      .toEqual({ pilots: [ok], updatedAt: 9 });
    expect(parseLadderView({ pilots: [{ ...ok, avatar: 'javascript:alert(1)' }], updatedAt: 9 })?.pilots[0]?.avatar).toBeNull();
    const { avatar: _a, ...older } = ok;
    expect(parseLadderView({ pilots: [older], updatedAt: 9 })?.pilots[0]?.avatar).toBeNull();
    expect(parseLadderView({ pilots: [{ ...ok, country: '<b>' }], updatedAt: 9 })?.pilots[0]?.country).toBeNull();
    expect(parseLadderView('<!doctype html>')).toBeNull();
    expect(parseLadderView({ pilots: 'x', updatedAt: 1 })).toBeNull();
    expect(parsePostReply({ place: 2, rating: 1690, rank: 'ltjg' })).toEqual({ place: 2, rating: 1690, rank: 'ltjg' });
    expect(parsePostReply({ place: 0, rating: 1, rank: 'ltjg' })).toBeNull();
    expect(parsePostReply({ error: 'secret' })).toBeNull();
  });

  it("reports the pilot's avatar and maps it back to a portrait (doc 28)", () => {
    const look = { age: 'adult', gender: 'female', skin: 'fair', hair: 'red', length: 'long', face: 'f2' } as const;
    expect(ladderAvatar('pilot14', null)).toBe('pilot14');
    expect(ladderAvatar('pilot2', look)).toBe('adult-female-fair-red-long-f2');
    expect(parseSubmission({ id: 'p_0123456789abcdefghijkl', secret: 's'.repeat(43), callsign: 'ACE',
      avatar: ladderAvatar('pilot2', look), country: 'DE', stats: ladderStats(defaultSave(), [], 0, 0) })?.avatar).toBe('adult-female-fair-red-long-f2');
    expect(ladderFace('pilot14')).toBe('pilot14');
    expect(ladderFace('adult-female-fair-red-long-f2')).toEqual(look);
    expect(ladderFace(null)).toBeNull();
  });

  it('counts the earned medals and the service-record kills (doc 24)', () => {
    expect(MEDAL_IDS).toHaveLength(RATING.maxMedals);
    const save = { ...defaultSave(), record: { ...emptyRecord(), kills: 60, sorties: 25 } };
    expect(pilotStats(save)).toMatchObject({ kills: 60, medals: 2 });
    expect(pilotStats(defaultSave())).toMatchObject({ kills: 0, medals: 0 });
  });
});
