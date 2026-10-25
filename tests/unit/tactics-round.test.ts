import { describe, it, expect } from 'vitest';
import {
  createTactics, nextEngagement, playCard, POINTS, SETUPS, startEngagement, TACTICS_MEDALS, TACTICS_RULES as R,
  type Situation, type TacticsState,
} from '../../src/game/minigames/tactics';
import { CARDS } from '../../src/game/minigames/tactics-moves';

// Dogfight Tactics (doc 19): engagement setups, outcomes, points and the eight-engagement round.

const sit = (over: Partial<Situation> = {}): Situation => ({ geo: 'defensive', range: 0, you: 4, him: 4, alt: 0, adv: -4, ...over });

/** A state whose current engagement starts from `s` (turn 0, no outcome). */
function at(s: Situation, seed = 7, index = 0): TacticsState {
  const st = createTactics(seed);
  const eng = startEngagement(seed, index);
  return { ...st, eng: { ...eng, start: s, sit: s } };
}

describe('Dogfight Tactics engagements and the round', () => {
  it('starts the eight setups with their meter, par and a ±1 energy jitter', () => {
    expect(SETUPS).toHaveLength(R.engagements);
    for (let seed = 1; seed <= 30; seed++) {
      SETUPS.forEach((setup, i) => {
        const e = startEngagement(seed, i);
        expect(e.sit.geo).toBe(setup.geo);
        expect(e.sit.adv).toBe(setup.geo === 'offensive' ? 4 : setup.geo === 'defensive' ? -4 : 0);
        expect(Math.abs(e.sit.you - setup.you)).toBeLessThanOrEqual(1);
        expect(Math.abs(e.sit.him - setup.him)).toBeLessThanOrEqual(1);
        expect(e.sit.you).toBeGreaterThanOrEqual(1);
        expect(e.par).toBe({ offensive: 2, merge: 3, abeam: 3, defensive: 4 }[setup.geo]);
        expect(e.skill).toBe(R.skill[i]);
      });
    }
    expect(startEngagement(9, 4)).toEqual(startEngagement(9, 4));
  });

  it('scores a kill within par as a fast kill, a later one as a kill', () => {
    // lead pursuit up close without closure (+3, counts double) beats any reply by at least +2
    const kill = sit({ geo: 'offensive', range: 0, adv: 8, you: 3, him: 4 });
    const s = playCard(at(kill), 'leadPursuit');
    expect(s.last?.mine).toBe('leadPursuit');
    expect(s.last?.outcome).toBe('fastKill');
    expect(s.eng.outcome).toBe('fastKill');
    expect(s.points).toBe(POINTS.fastKill);
    expect(s.outcomes).toEqual(['fastKill']);
    const base = at(kill);
    const late = playCard({ ...base, eng: { ...base.eng, turn: 5 } }, 'leadPursuit');
    expect(late.eng.outcome).toBe('kill');
    expect(late.points).toBe(POINTS.kill);
  });

  it('ends in a firing solution at the bottom of the meter and separates after six turns', () => {
    const lost = playCard(at(sit({ geo: 'defensive', range: 0, adv: -9, you: 4, him: 4 })), 'extend');
    expect(lost.eng.outcome).toBe('shotDown');
    expect(lost.points).toBe(0);
    // far range moves the meter at most ±4: the sixth turn ends in a separation
    const base = at(sit({ geo: 'merge', range: 2, adv: 0, you: 3, him: 3 }));
    const sep = playCard({ ...base, eng: { ...base.eng, turn: R.turns - 1 } }, 'extend');
    expect(sep.eng.turn).toBe(R.turns);
    expect(sep.eng.outcome).toBe('separated');
    expect(sep.points).toBe(POINTS.separated);
    expect(POINTS).toEqual({ fastKill: 100, kill: 70, separated: 30, shotDown: 0 });
  });

  it('writes the overshoot as the debrief note, otherwise the verdict on the card', () => {
    const s = playCard(at(sit({ geo: 'offensive', range: 1, adv: 4 })), 'lowYoyo');
    expect(s.last?.note).toBe(s.last?.you.note);
    expect(s.last?.note).toBe('lowMid');
  });

  it('ignores cards that are not offered and plays nothing after an outcome', () => {
    const s = at(sit({ geo: 'defensive' }));
    expect(playCard(s, 'leadPursuit')).toBe(s);
    const lost = playCard(at(sit({ geo: 'defensive', range: 0, adv: -9 })), 'extend');
    expect(playCard(lost, 'break')).toBe(lost);
  });

  it('runs eight engagements, then the round is over', () => {
    let s = createTactics(11);
    let guard = 0;
    while (!s.over && guard++ < 200) {
      if (s.eng.outcome) s = nextEngagement(s);
      else s = playCard(s, CARDS[s.eng.sit.geo][0]);
    }
    expect(s.over).toBe(true);
    expect(s.outcomes).toHaveLength(R.engagements);
    expect(s.points).toBe(s.outcomes.reduce((n, o) => n + POINTS[o], 0));
    expect(nextEngagement(s)).toBe(s);
  });

  it('keeps the tuned medal limits', () => {
    expect(TACTICS_MEDALS).toEqual({ bronze: 300, silver: 450, gold: 560 });
  });
});
