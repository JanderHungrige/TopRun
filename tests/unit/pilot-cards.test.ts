import { describe, it, expect } from 'vitest';
import { CARD_ORDER, cardCell, moveCard, NEW_PILOT_COLS } from '../../src/game/pilot-cards';
import { AVATAR_IDS, parseStore } from '../../src/game/profiles';
import { defaultSave } from '../../src/game/save';

describe('NEW PILOT cards (doc 08)', () => {
  it("lays the cards out in the owner's four rows of five", () => {
    expect(NEW_PILOT_COLS).toBe(5);
    const rows = [0, 5, 10, 15].map((i) => CARD_ORDER.slice(i, i + NEW_PILOT_COLS));
    expect(rows).toEqual([
      ['pilot1', 'pilot2', 'pilot3', 'pilot4', 'pilot10'],
      ['pilot5', 'pilot6', 'pilot7', 'pilot8', 'pilot9'],
      ['pilot12', 'pilot13', 'pilot15', 'pilot14', 'pilot11'],
      ['pilot16', 'pilot17', 'pilot18', 'own'],
    ]);
    expect(CARD_ORDER.at(-1)).toBe('own');
    expect(cardCell(CARD_ORDER.indexOf('own'))).toEqual({ row: 3, col: 3 });
  });

  it('shows every preset exactly once, plus CREATE YOUR OWN', () => {
    expect([...CARD_ORDER].filter((c) => c !== 'own').sort()).toEqual([...AVATAR_IDS].sort());
    expect(CARD_ORDER.filter((c) => c === 'own')).toHaveLength(1);
  });

  it('walks every card with ←/→, wrapping at both ends', () => {
    expect(moveCard(0, -1, 0, 19)).toBe(18);
    expect(moveCard(18, 1, 0, 19)).toBe(0);
    expect(moveCard(4, 1, 0, 19)).toBe(5);
  });

  it('changes row with ↑/↓ in the same column, clamped to the last card', () => {
    expect(moveCard(2, 0, 1, 19)).toBe(7);
    expect(moveCard(14, 0, -1, 19)).toBe(9);
    expect(moveCard(13, 0, 1, 19)).toBe(18);
    expect(moveCard(18, 0, 1, 19)).toBe(18);
    expect(moveCard(2, 0, -1, 19)).toBe(2);
    expect(moveCard(4, 0, 1, 8)).toBe(7);
    expect(moveCard(0, 0, 1, 3)).toBe(0);
  });

  it('accepts every preset id in saved profiles', () => {
    expect(AVATAR_IDS).toHaveLength(18);
    const profile = (avatar: string, id: string): Record<string, unknown> =>
      ({ id, callsign: `ACE ${id.toUpperCase()}`, avatar, createdAt: 1, playedAt: 1, save: defaultSave() });
    const store = parseStore({ version: 1, activeId: null, profiles: [profile('pilot18', 'a'), profile('pilot19', 'b')] });
    expect(store?.profiles.map((p) => p.avatar)).toEqual(['pilot18', 'pilot1']);
  });
});
