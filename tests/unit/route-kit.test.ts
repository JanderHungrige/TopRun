import { describe, it, expect } from 'vitest';
import { missionById } from '../../src/data/missions';
import { routeKit } from '../../src/game/kit';

// Which kit a scene shows (docs 49, 66, 76): the hangar shows the kit of the world the pilot is on, from the map and
// from the base alike — the base used to reset it to the jets, so its hangar opened the jets on map 4.

describe('routeKit (doc 76)', () => {
  it('opens the hangar of the home world, whatever the last scene showed', () => {
    expect(routeKit({ to: 'hangar' }, 'jet', 4)).toBe('sub');
    expect(routeKit({ to: 'hangar' }, 'jet', 5)).toBe('ship');
    expect(routeKit({ to: 'hangar' }, 'sub', 3)).toBe('heli');
    expect(routeKit({ to: 'hangar' }, 'sub', 1)).toBe('jet');
  });

  it('flies a mission with its own kit, keeps the map\'s, and shows the jets elsewhere', () => {
    const m = missionById('m95');
    if (!m) throw new Error('missing');
    expect(routeKit({ to: 'mission', mission: m, takeoff: 'skipped' }, 'jet', 1)).toBe('sub');
    expect(routeKit({ to: 'map' }, 'ship', 5)).toBe('ship');
    expect(routeKit({ to: 'base' }, 'sub', 4)).toBe('jet');
  });
});
