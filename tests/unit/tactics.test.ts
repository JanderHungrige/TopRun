import { describe, it, expect } from 'vitest';
import {
  banditCard, geoFor, resolveTurn, startEngagement, TACTICS_RULES as R, viewOf, type Situation,
} from '../../src/game/minigames/tactics';
import {
  bestCard, CARDS, EFFECTS, GEOS, MOVE_IDS, NOTE_IDS, overshoot, quality, type Geo, type MoveId, type View,
} from '../../src/game/minigames/tactics-moves';
import { placeholders } from '../../src/i18n/i18n';
import { hintKey, TACTICS_TEXT } from '../../src/i18n/minigames/tactics';
import { TACTICS_LINES } from '../../src/i18n/minigames/tactics-lines';

const sit = (over: Partial<Situation> = {}): Situation => ({ geo: 'defensive', range: 0, you: 4, him: 4, alt: 0, adv: -4, ...over });
const view = (over: Partial<View> = {}): View => ({ geo: 'defensive', range: 0, edge: 0, energy: 4, alt: 0, ...over });
const q = (m: MoveId, over: Partial<View> = {}): [number, string] => {
  const r = quality(m, view(over));
  return [r.q, r.note];
};

// Dogfight Tactics (doc 19): cards, the rules table, the overshoot, resolving a turn, the bandit, texts.
// Engagements and the round: tactics-round.test.ts; medals: tactics-pilots.test.ts.

describe('Dogfight Tactics', () => {
  describe('cards and effects', () => {
    it('offers four distinct cards per geometry, as in the doc', () => {
      expect(CARDS.defensive).toEqual(['break', 'scissors', 'extend', 'splitS']);
      expect(CARDS.offensive).toEqual(['leadPursuit', 'lagPursuit', 'highYoyo', 'lowYoyo']);
      expect(CARDS.merge).toEqual(['leadTurn', 'immelmann', 'splitS', 'extend']);
      expect(CARDS.abeam).toEqual(['scissors', 'extend', 'immelmann', 'break']);
      for (const g of GEOS) expect(new Set(CARDS[g]).size).toBe(4);
      const used = new Set(GEOS.flatMap((g) => CARDS[g]));
      expect([...used].sort()).toEqual([...MOVE_IDS].sort());
    });

    it('trades energy, altitude and range per card', () => {
      expect(EFFECTS.break).toEqual({ energy: -2, alt: 0, range: 0 });
      expect(EFFECTS.extend).toEqual({ energy: 2, alt: 0, range: 1 });
      expect(EFFECTS.splitS).toEqual({ energy: 1, alt: -1, range: 1 });
      expect(EFFECTS.lagPursuit).toEqual({ energy: 1, alt: 0, range: 0 });
      expect(EFFECTS.highYoyo).toEqual({ energy: -1, alt: 1, range: 0 });
      expect(EFFECTS.lowYoyo).toEqual({ energy: 1, alt: -1, range: -1 });
      expect(EFFECTS.immelmann).toEqual({ energy: -2, alt: 1, range: 0 });
      expect(EFFECTS.leadPursuit.range).toBe(-1);
      expect(EFFECTS.leadTurn.range).toBe(-1);
    });
  });

  describe('card quality', () => {
    it('stalls a card that costs more energy than the jet has', () => {
      expect(q('break', { energy: 1 })).toEqual([-3, 'stall']);
      expect(q('immelmann', { geo: 'merge', range: 1, energy: 1, edge: 3 })).toEqual([-3, 'stall']);
      expect(q('scissors', { energy: 0, edge: -2 })).toEqual([-3, 'stall']);
      expect(q('extend', { range: 2, energy: 0 })[0]).toBe(2);
    });

    it('defensive: break up close, never extend in guns range, scissors only slow and close', () => {
      expect(q('break', { range: 0 })).toEqual([2, 'breakGood']);
      expect(q('break', { range: 1 })).toEqual([0, 'breakEarly']);
      expect(q('break', { range: 2 })[0]).toBe(-1);
      expect(q('extend', { range: 0, edge: 3 })).toEqual([-3, 'extendGuns']);
      expect(q('extend', { range: 1, edge: 1 })).toEqual([2, 'extendGood']);
      expect(q('extend', { range: 1, edge: 0 })).toEqual([0, 'extendEven']);
      expect(q('extend', { range: 1, edge: -1 })).toEqual([-2, 'extendSlow']);
      expect(q('extend', { range: 2, edge: 0 })[0]).toBe(2);
      expect(q('extend', { range: 2, edge: -1 })[0]).toBe(0);
      expect(q('scissors', { range: 0, edge: 0 })).toEqual([2, 'scissorsGood']);
      expect(q('scissors', { range: 0, edge: 1 })).toEqual([-1, 'scissorsFast']);
      expect(q('scissors', { range: 1, edge: -2 })).toEqual([-2, 'scissorsFar']);
      expect(q('splitS', { range: 1, alt: -1 })).toEqual([-2, 'splitLow']);
      expect(q('splitS', { range: 0 })).toEqual([0, 'splitClose']);
      expect(q('splitS', { range: 2 })).toEqual([1, 'splitGood']);
    });

    it('offensive: lead pursuit is the kill up close unless far too fast; yo-yos by range', () => {
      const off = { geo: 'offensive' as Geo };
      expect(q('leadPursuit', { ...off, range: 0, edge: 1 })).toEqual([3, 'guns']);
      expect(q('leadPursuit', { ...off, range: 0, edge: 2 })).toEqual([-2, 'overshootFast']);
      expect(q('leadPursuit', { ...off, range: 1 })).toEqual([1, 'leadGood']);
      expect(q('leadPursuit', { ...off, range: 2 })).toEqual([-1, 'leadFar']);
      expect(q('lagPursuit', { ...off, range: 0, edge: 2 })).toEqual([1, 'lagGood']);
      expect(q('lagPursuit', { ...off, range: 1 })).toEqual([0, 'lagSafe']);
      expect(q('lagPursuit', { ...off, range: 2 })).toEqual([-1, 'lagFar']);
      expect(q('highYoyo', { ...off, range: 0, edge: 1 })).toEqual([2, 'highGood']);
      expect(q('highYoyo', { ...off, range: 0, edge: 0 })).toEqual([-1, 'highSlow']);
      expect(q('highYoyo', { ...off, range: 2 })).toEqual([-2, 'highFar']);
      expect(q('lowYoyo', { ...off, range: 2 })).toEqual([2, 'lowGood']);
      expect(q('lowYoyo', { ...off, range: 1 })).toEqual([0, 'lowMid']);
      expect(q('lowYoyo', { ...off, range: 0 })).toEqual([-2, 'lowClose']);
    });

    it('merge: vertical with the energy edge, lead turn from medium range, reset when slower', () => {
      const m = { geo: 'merge' as Geo, range: 1 as const };
      expect(q('immelmann', { ...m, edge: 1 })).toEqual([2, 'vertGood']);
      expect(q('immelmann', { ...m, edge: 0 })).toEqual([0, 'vertEven']);
      expect(q('immelmann', { ...m, edge: -1 })).toEqual([-2, 'vertSlow']);
      expect(q('leadTurn', { ...m, edge: 1 })).toEqual([2, 'leadTurnGood']);
      expect(q('leadTurn', { ...m, edge: 2 })).toEqual([0, 'leadTurnFast']);
      expect(q('leadTurn', { ...m, range: 2 })).toEqual([-1, 'leadTurnEarly']);
      expect(q('splitS', { ...m, alt: 1 })).toEqual([1, 'splitGood']);
      expect(q('splitS', { ...m, alt: 0 })).toEqual([0, 'splitEven']);
      expect(q('extend', { ...m, edge: -1 })).toEqual([1, 'resetGood']);
      expect(q('extend', { ...m, edge: 0 })).toEqual([0, 'resetEven']);
    });

    it('abeam: the slower jet scissors, the faster one goes vertical or runs', () => {
      const a = { geo: 'abeam' as Geo, range: 0 as const };
      expect(q('scissors', { ...a, edge: -1 })[0]).toBe(2);
      expect(q('scissors', { ...a, edge: 1 })[0]).toBe(-1);
      expect(q('immelmann', { ...a, edge: 2 })).toEqual([2, 'vertGood']);
      expect(q('immelmann', { ...a, edge: 1 })).toEqual([1, 'vertGood']);
      expect(q('immelmann', { ...a, edge: 0 })).toEqual([-2, 'vertSlow']);
      expect(q('extend', { ...a, edge: 1 })).toEqual([1, 'extendGood']);
      expect(q('extend', { ...a, edge: 0 })).toEqual([-1, 'extendEven']);
      expect(q('extend', { ...a, edge: -1 })).toEqual([-2, 'extendSlow']);
      expect(q('break', { ...a, edge: 0 })).toEqual([1, 'breakAbeam']);
      expect(q('break', { ...a, edge: 1 })).toEqual([0, 'breakAbeamFast']);
    });
  });

  describe('overshoot', () => {
    it('rewards a break or scissors against a fast attacker pulling lead up close', () => {
      expect(overshoot('break', 'leadPursuit', 0, -1)).toBe(3);
      expect(overshoot('scissors', 'leadPursuit', 0, -2)).toBe(2);
      expect(overshoot('break', 'leadPursuit', 0, 0)).toBe(0);
      expect(overshoot('break', 'leadPursuit', 1, -2)).toBe(0);
      expect(overshoot('extend', 'leadPursuit', 0, -2)).toBe(0);
    });

    it('works against the player too when he attacks with too much closure', () => {
      expect(overshoot('leadPursuit', 'break', 0, 1)).toBe(-3);
      expect(overshoot('leadPursuit', 'scissors', 0, 2)).toBe(-2);
      expect(overshoot('leadPursuit', 'break', 0, 0)).toBe(0);
      expect(overshoot('lagPursuit', 'break', 0, 2)).toBe(0);
    });
  });

  describe('resolving a turn', () => {
    it('mirrors the situation for the bandit', () => {
      const s = sit({ geo: 'defensive', you: 3, him: 5, alt: 1 });
      expect(viewOf(s, 'you')).toEqual({ geo: 'defensive', range: 0, edge: -1, energy: 3, alt: 1 });
      expect(viewOf(s, 'him')).toEqual({ geo: 'offensive', range: 0, edge: 1, energy: 5, alt: -1 });
      expect(viewOf(sit({ geo: 'merge', range: 1 }), 'him').geo).toBe('merge');
    });

    it('counts your card double, the bandit card once, plus the overshoot, capped by range', () => {
      // you break (+2), he leads with the edge (+3), overshoot +3: 4 − 3 + 6 = 7
      const r = resolveTurn(sit({ you: 4, him: 5 }), 'break', 'leadPursuit');
      expect(r.delta).toBe(7);
      expect(r.overshoot).toBe(3);
      expect(r.after.adv).toBe(3);
      expect(r.after.geo).toBe('abeam');
      expect(r.after.you).toBe(2);
      expect(r.after.him).toBe(4);
      expect(r.after.range).toBe(0);
      // extend in guns range (−3) vs a guns shot (+3): −6 − 3 = −9 → capped −8 at close
      expect(resolveTurn(sit({ you: 4, him: 4 }), 'extend', 'leadPursuit').delta).toBe(-8);
      // far: capped ±4
      const far = resolveTurn(sit({ geo: 'offensive', range: 2, adv: 4 }), 'lowYoyo', 'break');
      expect(far.delta).toBe(4);
      expect(far.after.range).toBe(1);
    });

    it('moves energy, altitude and range by both cards and clamps them', () => {
      const r = resolveTurn(sit({ geo: 'merge', range: 1, adv: 0, you: 6, him: 1, alt: 1 }), 'extend', 'immelmann');
      expect(r.after.you).toBe(6);
      expect(r.after.him).toBe(0);
      expect(r.after.alt).toBe(0);
      expect(r.after.range).toBe(2);
      const dive = resolveTurn(sit({ geo: 'merge', range: 2, adv: 0, alt: -1 }), 'splitS', 'extend');
      expect(dive.after.alt).toBe(-1);
      expect(dive.after.range).toBe(2);
    });

    it('derives the geometry from the meter: neutral is abeam up close, a merge further out', () => {
      expect(geoFor(4, 0)).toBe('offensive');
      expect(geoFor(-4, 2)).toBe('defensive');
      expect(geoFor(3, 0)).toBe('abeam');
      expect(geoFor(-3, 1)).toBe('merge');
      // both lead-turn from medium range (+2 each): 4 − 2 = +2, range 1 − 1 − 1 → close → abeam
      const r = resolveTurn(sit({ geo: 'merge', range: 1, adv: 0, you: 3, him: 3 }), 'leadTurn', 'leadTurn');
      expect(r.delta).toBe(2);
      expect(r.after.geo).toBe('abeam');
      expect(r.after.range).toBe(0);
    });
  });

  describe('the bandit', () => {
    it('plays his best card by his doctrine', () => {
      expect(bestCard(view({ geo: 'offensive', range: 0, edge: 1 }))).toBe('leadPursuit');
      expect(bestCard(view({ geo: 'offensive', range: 0, edge: 2 }))).toBe('highYoyo');
      expect(bestCard(view({ geo: 'offensive', range: 2 }))).toBe('lowYoyo');
      expect(bestCard(view({ geo: 'merge', range: 1, edge: 1 }))).toBe('immelmann');
      expect(bestCard(view({ geo: 'defensive', range: 0, edge: 0 }))).toBe('break');
    });

    it('is deterministic for a seed and gets smarter engagement by engagement', () => {
      const e = startEngagement(5, 3);
      expect(banditCard(5, e)).toBe(banditCard(5, e));
      const rate = (index: number): number => {
        let best = 0;
        for (let seed = 1; seed <= 400; seed++) {
          const eng = { ...startEngagement(seed, index), sit: sit({ geo: 'defensive', range: 0, you: 4, him: 4 }) };
          if (banditCard(seed, eng) === 'leadPursuit') best++;
        }
        return best / 400;
      };
      const rookie = rate(0);
      const ace = rate(7);
      expect(rookie).toBeGreaterThan(0.3);
      expect(rookie).toBeLessThan(0.5);
      expect(ace).toBeGreaterThan(0.85);
      expect(R.skill).toEqual([0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9]);
    });
  });

  describe('texts', () => {
    it('has the same keys and placeholders in English and German', () => {
      for (const table of [TACTICS_TEXT, TACTICS_LINES]) {
        const keys = Object.keys(table.en) as (keyof typeof table.en)[];
        expect(Object.keys(table.de).sort()).toEqual([...keys].sort());
        for (const k of keys) expect(placeholders(table.de[k])).toEqual(placeholders(table.en[k]));
      }
    });

    it('has a line for every note and a hint for every card in every geometry', () => {
      for (const n of NOTE_IDS) expect(TACTICS_LINES.en[n]).toBeTruthy();
      for (const g of GEOS) for (const m of CARDS[g]) expect(TACTICS_TEXT.en[hintKey(g, m)]).toBeTruthy();
    });
  });
});
