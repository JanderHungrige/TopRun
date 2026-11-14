import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { CampaignId } from '../../src/data/types';
import { crewLook, portraitKey } from '../../src/game/crew-looks';
import { INTRO, INTRO_WORLDS, introBeat, introCamera, introDue, introNext, markIntroSeen } from '../../src/game/intro';
import { defaultSave, parseSave } from '../../src/game/save';
import { tapeShelf, tapeSides } from '../../src/game/tapes';
import { LINES_DE } from '../../src/i18n/lines-de';
import { LINES_EN, type LineKey } from '../../src/i18n/lines-en';

// Duke's welcome to each new world (doc 97).

const SHOTS = ['a', 'b', 'c', 'd'] as const;

describe('World intros (doc 97)', () => {
  it('welcomes the pilot to worlds 2 to 6, once each', () => {
    expect(INTRO_WORLDS).toEqual([2, 3, 4, 5, 6, 7]);
    const save = defaultSave();
    expect(save.intros).toEqual([]);
    expect(([1, 2, 3, 4, 5, 6] as CampaignId[]).map((w) => introDue(save, w))).toEqual([false, true, true, true, true, true]);
    const seen = markIntroSeen(save, 6);
    expect(introDue(seen, 6)).toBe(false);
    expect(introDue(seen, 5)).toBe(true);
    expect(markIntroSeen(seen, 6)).toBe(seen);
    expect(save.intros).toEqual([]); // pure
  });

  it('keeps only the welcome worlds from an untrusted save, each once', () => {
    const raw = JSON.parse(JSON.stringify(defaultSave())) as Record<string, unknown>;
    expect(parseSave({ ...raw, intros: [6, 6, 1, 'x', 9, 3, null, 2] })?.intros).toEqual([6, 3, 2]);
    expect(parseSave({ ...raw, intros: 'all' })?.intros).toEqual([]);
    delete raw.intros;
    expect(parseSave(raw)?.intros).toEqual([]);
  });

  it('plays four shots of eight seconds with Duke\'s line in each, then the card, then ends', () => {
    expect(INTRO.shots).toBe(4);
    expect(introBeat(0).black).toBeCloseTo(1);
    expect(introBeat(0).line).toBe(false);
    expect(introBeat(4)).toMatchObject({ shot: 0, from: null, black: 0, line: true, card: 0, end: false });
    expect(introBeat(8.5)).toMatchObject({ shot: 1, from: 0 });
    expect(introBeat(8.5).fade).toBeCloseTo(0.5);
    expect(introBeat(20).shot).toBe(2);
    expect(introBeat(28).shot).toBe(3);
    expect(introBeat(33).card).toBeGreaterThan(0);
    expect(introBeat(33).line).toBe(false);
    expect(introBeat(INTRO.length).end).toBe(true);
  });

  it('jumps to the next shot on ENTER, from the last to the card, from the card to the end', () => {
    expect(introNext(3)).toBe(8);
    expect(introNext(8.2)).toBe(16);
    expect(introNext(25)).toBe(INTRO.cardAt);
    expect(introNext(INTRO.cardAt + 1)).toBe(INTRO.length);
  });

  it('pans every shot inside its plate, and every shot moves', () => {
    for (const w of INTRO_WORLDS) {
      for (let s = 0; s < 4; s++) {
        const from = introCamera(w, s, 0);
        const to = introCamera(w, s, 1);
        expect(Math.hypot(to.x - from.x, to.y - from.y), `${w}${s}`).toBeGreaterThan(10);
        for (const u of [0, 0.25, 0.5, 0.75, 1]) {
          const c = introCamera(w, s, u);
          expect(c.x).toBeGreaterThanOrEqual(0);
          expect(c.y).toBeGreaterThanOrEqual(0);
          expect(c.x).toBeLessThanOrEqual(64); // the window is 256 × 144 of the 320 × 180 plate
          expect(c.y).toBeLessThanOrEqual(36);
        }
      }
    }
  });

  it('has four key frames per world and Duke in each world\'s outfit', () => {
    for (const w of INTRO_WORLDS) for (const s of SHOTS) expect(existsSync(`src/assets/intros/i${w}${s}.png`), `i${w}${s}`).toBe(true);
    expect(crewLook(3)).toBe('mountain');
    for (const w of INTRO_WORLDS.filter((x) => crewLook(x) !== 'carrier')) { // the second front: Duke in his own flight gear
      const key = portraitKey('wingman', crewLook(w));
      expect(key).toBe(`wingman-${crewLook(w)}`);
      for (const f of ['', '-talk', '-half', '-blink']) expect(existsSync(`src/assets/portraits/${key}${f}.png`), key + f).toBe(true);
    }
    expect(portraitKey('wingman', 'carrier')).toBe('wingman');
    expect(portraitKey('admiral', 'jungle')).toBe('admiral');
  });

  it('gives Duke four lines per world in English and German, the first greeting the pilot by callsign', () => {
    for (const w of INTRO_WORLDS) {
      for (const s of SHOTS) {
        const key = `duke.intro${w}${s}` as LineKey;
        expect(LINES_EN[key]?.length, key).toBeGreaterThan(0);
        expect(LINES_DE[key]?.length, key).toBeGreaterThan(0);
      }
      expect(LINES_EN[`duke.intro${w}a` as LineKey][0]).toContain('{callsign}');
      expect(LINES_DE[`duke.intro${w}a` as LineKey][0]).toContain('{callsign}');
    }
  });

  it('puts both recordings of a world on its tape: the welcome once seen, the victory once finished', () => {
    const shelf = tapeShelf(markIntroSeen(defaultSave(), 6));
    expect(shelf.map((tp) => tp.world)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    const jungle = shelf[5];
    if (!jungle) throw new Error('no jungle tape');
    expect(jungle).toEqual({ world: 6, finished: false, welcome: true });
    expect(tapeSides(jungle)).toEqual(['welcome']);
    expect(tapeSides({ world: 2, finished: true, welcome: false })).toEqual(['victory']);
    expect(tapeSides({ world: 4, finished: true, welcome: true })).toEqual(['welcome', 'victory']);
    expect(tapeSides({ world: 1, finished: false, welcome: false })).toEqual([]);
  });
});
