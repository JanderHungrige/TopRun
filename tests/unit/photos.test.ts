import { describe, expect, it } from 'vitest';
import { MISSIONS } from '../../src/data/missions';
import { PHOTO_TIMES, TIMES_OF_DAY } from '../../src/data/photo-looks';
import { THEATER_IDS } from '../../src/data/types';
import { formatPhotoDate, localDate, monthList, type DateFormat } from '../../src/game/photo-date';
import { BOARD, gridMove, pageCount, pageItems, pageOf, PER_PAGE, photoKey, photoList, photoTime, POLAROID, wallSlot } from '../../src/game/photos';
import { defaultSave, type SaveData } from '../../src/game/save';
import { UI_DE } from '../../src/i18n/ui-de';
import { UI_EN } from '../../src/i18n/ui-en';

// Doc 32: which photos hang on the picture wall, what each shows, the paging of the grid and the caption dates.

function save(progress: SaveData['progress'], over: Partial<SaveData> = {}): SaveData {
  return { ...defaultSave(), ...over, progress };
}

const allCleared = (): SaveData['progress'] =>
  Object.fromEntries(MISSIONS.map((m) => [m.id, { stars: 3, at: 1_700_000_000_000 + m.number, plane: 'f14' as const, livery: 'standard' as const }]));

describe('photo list', () => {
  it('has no photos before the first cleared mission', () => {
    expect(photoList(defaultSave())).toEqual([]);
  });

  it('lists one photo per cleared mission in mission order', () => {
    const list = photoList(save({ m06: { stars: 1 }, m01: { stars: 3 }, m03: { stars: 2 } }));
    expect(list.map((p) => p.mission)).toEqual(['m01', 'm03', 'm06']);
    expect(list.map((p) => p.number)).toEqual([1, 3, 6]);
    expect(list.map((p) => p.stars)).toEqual([3, 2, 1]);
    expect(list.every((p) => p.theater === 'pacific')).toBe(true);
    expect(photoList(save(allCleared()))).toHaveLength(30);
  });

  it('shows the best run’s jet and paint job, or falls back to the current ones', () => {
    const s = save({
      m01: { stars: 3, at: 5, plane: 'f14', livery: 'gullgray' },
      m02: { stars: 2 },
      m03: { stars: 1, plane: 'sr71' },
    }, { selectedPlane: 'f16', livery: { f16: 'desert', f14: 'standard', sr71: 'arctic', a10: 'standard', f35: 'standard', tornado: 'standard' } });
    const [a, b, c] = photoList(s);
    expect(a).toMatchObject({ plane: 'f14', livery: 'gullgray', fallback: false, at: 5 });
    expect(b).toMatchObject({ plane: 'f16', livery: 'desert', fallback: true, at: null });
    expect(c).toMatchObject({ plane: 'sr71', livery: 'arctic', fallback: false, at: null });
  });

  it('puts the boss in boss photos and the carrier or a wingman in the others', () => {
    const list = photoList(save(allCleared()));
    for (const p of list) {
      const m = MISSIONS.find((x) => x.id === p.mission);
      if (m?.objective.type === 'boss') expect(p).toMatchObject({ scene: 'boss', boss: m.objective.boss });
      else expect(p.boss).toBeNull();
    }
    expect(list.find((p) => p.mission === 'm02')?.scene).toBe('carrier');
    expect(list.find((p) => p.mission === 'm01')?.scene).toBe('wingman');
    expect(list.find((p) => p.mission === 'm08')?.scene).toBe('solo');
    expect(list.filter((p) => p.scene === 'boss')).toHaveLength(5);
  });

  it('takes each mission’s time of day from the look table', () => {
    for (const id of THEATER_IDS) expect(PHOTO_TIMES[id]).toHaveLength(6);
    for (const t of Object.values(PHOTO_TIMES).flat()) expect(TIMES_OF_DAY).toContain(t);
    const m07 = MISSIONS.find((m) => m.number === 7);
    expect(m07 && photoTime(m07)).toBe('dawn');
  });

  it('keys the photo art by what it shows, not by the caption', () => {
    const [a] = photoList(save({ m01: { stars: 1, at: 1, plane: 'f16', livery: 'standard' } }));
    const [b] = photoList(save({ m01: { stars: 3, at: 99, plane: 'f16', livery: 'standard' } }));
    const [c] = photoList(save({ m01: { stars: 3, at: 99, plane: 'f16', livery: 'gullgray' } }));
    if (!a || !b || !c) throw new Error('missing photos');
    expect(photoKey(a)).toBe(photoKey(b));
    expect(photoKey(c)).not.toBe(photoKey(b));
  });
});

describe('photo paging and navigation', () => {
  it('pages twelve photos at a time', () => {
    expect(PER_PAGE).toBe(12);
    expect([0, 1, 12, 13, 24, 30].map(pageCount)).toEqual([1, 1, 1, 2, 2, 3]);
    expect([0, 11, 12, 29].map(pageOf)).toEqual([0, 0, 1, 2]);
    const list = Array.from({ length: 30 }, (_, i) => i);
    expect(pageItems(list, 2)).toEqual([24, 25, 26, 27, 28, 29]);
    expect(pageItems(list, 3)).toEqual([]);
  });

  it('hangs every polaroid of a page on the board without overlaps, on whole pixels', () => {
    for (let first = 1; first <= 30; first += 12) {
      const boxes = Array.from({ length: PER_PAGE }, (_, slot) => wallSlot(slot, first + slot));
      for (const b of boxes) {
        expect(b.x).toBeGreaterThanOrEqual(BOARD.x);
        expect(b.y).toBeGreaterThanOrEqual(BOARD.y + 4);
        expect(b.x + b.w).toBeLessThanOrEqual(BOARD.x + BOARD.w);
        expect(b.y + b.h).toBeLessThanOrEqual(BOARD.y + BOARD.h);
        expect(Number.isInteger(b.x) && Number.isInteger(b.y)).toBe(true);
      }
      for (let i = 0; i < boxes.length; i++) {
        for (let j = i + 1; j < boxes.length; j++) {
          const a = boxes[i];
          const b = boxes[j];
          if (!a || !b) continue;
          const apart = a.x + a.w + 8 <= b.x || b.x + b.w + 8 <= a.x || a.y + a.h + 6 <= b.y || b.y + b.h + 6 <= a.y;
          expect(apart, `${i} / ${j}`).toBe(true);
        }
      }
    }
    expect(wallSlot(0, 1)).toMatchObject({ w: POLAROID.w, h: POLAROID.h });
  });

  it('steps left and right across page edges', () => {
    expect(gridMove(11, 'right', 30)).toBe(12);
    expect(gridMove(12, 'left', 30)).toBe(11);
    expect(gridMove(0, 'left', 30)).toBe(0);
    expect(gridMove(29, 'right', 30)).toBe(29);
    expect(gridMove(0, 'right', 0)).toBe(-1);
  });

  it('moves up and down within the page, clamped to its last photo', () => {
    expect(gridMove(5, 'up', 30)).toBe(1);
    expect(gridMove(1, 'up', 30)).toBe(1);
    expect(gridMove(1, 'down', 30)).toBe(5);
    expect(gridMove(9, 'down', 30)).toBe(9);
    expect(gridMove(3, 'down', 6)).toBe(5);
    expect(gridMove(24, 'down', 26)).toBe(24);
    expect(gridMove(27, 'down', 30)).toBe(29);
  });
});

describe('photo dates', () => {
  const fmt = (table: typeof UI_EN | typeof UI_DE): DateFormat => ({ pattern: table['photo.datePattern'], months: monthList(table['photo.months']) });
  const noon = Date.UTC(2026, 9, 25, 12, 0);

  it('reads the calendar date in the player’s time zone', () => {
    expect(localDate(noon, 0)).toEqual({ y: 2026, m: 10, d: 25 });
    const late = Date.UTC(2026, 9, 25, 23, 30);
    expect(localDate(late, 0)).toEqual({ y: 2026, m: 10, d: 25 });
    expect(localDate(late, -120)).toEqual({ y: 2026, m: 10, d: 26 });
    expect(localDate(Date.UTC(2027, 0, 1, 3, 0), 300)).toEqual({ y: 2026, m: 12, d: 31 });
  });

  it('formats English and German captions from the UI tables', () => {
    expect(monthList(UI_EN['photo.months'])).toHaveLength(12);
    expect(monthList(UI_DE['photo.months'])).toHaveLength(12);
    expect(formatPhotoDate(noon, fmt(UI_EN), 0)).toBe('OCT 25, 2026');
    expect(formatPhotoDate(noon, fmt(UI_DE), 0)).toBe('25. OKT 2026');
    expect(formatPhotoDate(Date.UTC(2026, 2, 3, 12), fmt(UI_DE), 0)).toBe('3. MÄR 2026');
    expect(formatPhotoDate(noon, { pattern: '{dd}.{mm}.{y}', months: [] }, 0)).toBe('25.10.2026');
  });

  it('has no date without a time', () => {
    expect(formatPhotoDate(null, fmt(UI_EN), 0)).toBeNull();
    expect(formatPhotoDate(Number.NaN, fmt(UI_EN), 0)).toBeNull();
  });
});
