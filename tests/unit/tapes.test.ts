import { describe, it, expect } from 'vitest';
import { areaDef, BASE_AREA_IDS, BASE_AREAS } from '../../src/data/base-areas';
import { campaignMissions } from '../../src/data/missions';
import { areaAt, areaRoute } from '../../src/game/base-hangar';
import { defaultSave } from '../../src/game/save';
import { tapeShelf } from '../../src/game/tapes';

// The hangar TV (doc 63): a base area in front of the rec room that opens the tape shelf of finished worlds.

describe('Hangar TV (doc 63)', () => {
  it('stands between FUN MISSIONS and the LOCKER and opens the tape shelf', () => {
    expect(BASE_AREA_IDS.slice(0, 3)).toEqual(['fun', 'tv', 'locker']);
    expect(areaDef(BASE_AREAS, 'tv').row).toBe('floor');
    expect(areaRoute('tv')).toEqual({ to: 'tapes' });
  });

  it('wins the click where it stands in front of the rec-room doorway', () => {
    const tv = areaDef(BASE_AREAS, 'tv').hot;
    const fun = areaDef(BASE_AREAS, 'fun').hot;
    const overlapY = Math.max(tv.y, fun.y) + 2;
    expect(overlapY).toBeLessThan(fun.y + fun.h);
    expect(areaAt({ x: tv.x + tv.w / 2, y: overlapY })).toBe('tv');
    expect(areaAt({ x: fun.x + 10, y: fun.y + 10 })).toBe('fun');
  });

  it('shows a tape per world, recorded once the whole world is cleared (the jungle\'s too, doc 85)', () => {
    const progress = Object.fromEntries(campaignMissions(1).map((m) => [m.id, { stars: 1 }]));
    expect(tapeShelf({ ...defaultSave(), progress }).map(({ world, finished }) => ({ world, finished }))).toEqual([
      { world: 1, finished: true }, { world: 2, finished: false }, { world: 3, finished: false }, { world: 4, finished: false },
      { world: 5, finished: false }, { world: 6, finished: false },
    ]);
  });
});
