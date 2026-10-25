import { afterEach, describe, expect, it, vi } from 'vitest';
import { LadderSync } from '../../src/core/ladder-sync';
import type { Submission } from '../../src/game/ladder';
import type { PostReply } from '../../src/game/ladder-stats';

const base: Submission = {
  id: 'p_0123456789abcdefghijkl', secret: 's'.repeat(43), callsign: 'ICE', avatar: 'pilot1',
  stats: { stars: 3, medals: 0, kills: 0, golds: 0, silvers: 0, bronzes: 0 },
};

function setup(reply: PostReply | null = { place: 1, rating: 300, rank: 'ensign' }) {
  let current: Submission | null = base;
  const posted: Submission[] = [];
  const sync = new LadderSync(() => current, (sub) => { posted.push(sub); return Promise.resolve(reply); }, 100);
  return { sync, posted, set: (s: Submission | null) => { current = s; } };
}

afterEach(() => vi.useRealTimers());

describe('Ladder sync', () => {
  it('debounces pokes into one post', async () => {
    vi.useFakeTimers();
    const { sync, posted } = setup();
    sync.poke();
    sync.poke();
    sync.poke();
    expect(posted).toHaveLength(0);
    await vi.advanceTimersByTimeAsync(150);
    expect(posted).toHaveLength(1);
  });

  it('posts only changes, remembers the place, and posts again after forget', async () => {
    const { sync, posted, set } = setup();
    expect(await sync.flush()).toEqual({ place: 1, rating: 300, rank: 'ensign' });
    expect(await sync.flush()).toEqual({ place: 1, rating: 300, rank: 'ensign' });
    expect(posted).toHaveLength(1);
    set({ ...base, stats: { ...base.stats, stars: 4 } });
    await sync.flush();
    expect(posted).toHaveLength(2);
    sync.forget(base.id);
    expect(sync.replyFor(base.id)).toBeNull();
    await sync.flush();
    expect(posted).toHaveLength(3);
    set(null);
    expect(await sync.flush()).toBeNull();
    expect(posted).toHaveLength(3);
  });

  it('retries a failed post next time', async () => {
    const { sync, posted } = setup(null);
    expect(await sync.flush()).toBeNull();
    expect(await sync.flush()).toBeNull();
    expect(posted).toHaveLength(2);
  });
});
