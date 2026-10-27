import { describe, it, expect } from 'vitest';
import { cardCell, cardOrder, moveCard, NEW_PILOT_COLS } from '../../src/game/pilot-cards';
import { AVATAR_IDS, parseStore } from '../../src/game/profiles';
import { defaultSave } from '../../src/game/save';

describe('NEW PILOT cards (doc 08)', () => {
  it('keeps row 1 as pilot1–4 + CREATE YOUR OWN and puts the next presets in row 2', () => {
    expect(NEW_PILOT_COLS).toBe(5);
    expect(cardOrder()).toEqual(['pilot1', 'pilot2', 'pilot3', 'pilot4', 'own', 'pilot5', 'pilot6', 'pilot7', 'pilot8', 'pilot9']);
    expect(cardOrder(['pilot1', 'pilot2'])).toEqual(['pilot1', 'pilot2', 'own']);
    expect(cardCell(4)).toEqual({ row: 0, col: 4 });
    expect(cardCell(7)).toEqual({ row: 1, col: 2 });
  });

  it('walks every card with ←/→, wrapping at both ends', () => {
    expect(moveCard(0, -1, 0, 10)).toBe(9);
    expect(moveCard(9, 1, 0, 10)).toBe(0);
    expect(moveCard(4, 1, 0, 10)).toBe(5);
  });

  it('changes row with ↑/↓ in the same column, clamped to the last card', () => {
    expect(moveCard(2, 0, 1, 10)).toBe(7);
    expect(moveCard(7, 0, 1, 10)).toBe(7);
    expect(moveCard(7, 0, -1, 10)).toBe(2);
    expect(moveCard(2, 0, -1, 10)).toBe(2);
    expect(moveCard(4, 0, 1, 8)).toBe(7);
    expect(moveCard(0, 0, 1, 3)).toBe(0);
  });

  it('accepts every preset id in saved profiles', () => {
    expect(AVATAR_IDS).toHaveLength(9);
    const profile = (avatar: string, id: string): Record<string, unknown> =>
      ({ id, callsign: `ACE ${id.toUpperCase()}`, avatar, createdAt: 1, playedAt: 1, save: defaultSave() });
    const store = parseStore({ version: 1, activeId: null, profiles: [profile('pilot9', 'a'), profile('pilot10', 'b')] });
    expect(store?.profiles.map((p) => p.avatar)).toEqual(['pilot9', 'pilot1']);
  });
});
