import { describe, expect, it } from 'vitest';
import { medalFor } from '../../src/game/minigames/core';
import {
  createVolleyball, NO_INPUT, stepVolleyball, VB_RULES as R, type VbEvent, type VbInput, type VbState,
} from '../../src/game/minigames/volleyball';
import type { Ball } from '../../src/game/minigames/volleyball-ball';
import {
  DUKE_SKILL, FIRST_SERVE, matchPoint, matchWinner, nextServe, RIVAL_BASE, rivalSkill, vbScore, VB_MEDALS,
} from '../../src/game/minigames/volleyball-score';
import { placeholders } from '../../src/i18n/i18n';
import type { GameText } from '../../src/i18n/minigame-text';
import { VB_LINES } from '../../src/i18n/minigames/volleyball-lines';
import { VB_TEXT } from '../../src/i18n/minigames/volleyball';

const DT = 1 / 60;
const ACT: VbInput = { move: 0, jump: false, act: true };

function run(s: VbState, seconds: number, input: VbInput = NO_INPUT): { s: VbState; events: VbEvent[] } {
  let out = s;
  const events: VbEvent[] = [];
  for (let i = 0; i < Math.round(seconds * 60); i++) {
    out = stepVolleyball(out, input, DT);
    events.push(...out.events);
  }
  return { s: out, events };
}

/** Steps until `stop` holds (or the time runs out); returns the state and every event on the way. */
function until(s: VbState, stop: (s: VbState) => boolean, max = 30, input: VbInput = NO_INPUT): { s: VbState; events: VbEvent[] } {
  let out = s;
  const events: VbEvent[] = [];
  for (let i = 0; i < max * 60 && !stop(out); i++) {
    out = stepVolleyball(out, input, DT);
    events.push(...out.events);
  }
  return { s: out, events };
}

/** A rally in progress: the ball where the test wants it, nobody assigned to play it. */
function live(ball: Ball, patch: Partial<VbState> = {}): VbState {
  const s = createVolleyball(7);
  return { ...s, phase: 'live', phaseT: 0, held: false, ball, assigned: null, ...patch };
}

const points = (ev: readonly VbEvent[]) => ev.flatMap((e) => (e.type === 'point' ? [e] : []));
const hits = (ev: readonly VbEvent[]) => ev.flatMap((e) => (e.type === 'hit' ? [e] : []));

describe('Beach Volleyball — match rules', () => {
  it('plays first to 7, win by 2, capped at 9', () => {
    expect(matchWinner({ home: 7, away: 5 })).toBe('home');
    expect(matchWinner({ home: 7, away: 6 })).toBeNull();
    expect(matchWinner({ home: 6, away: 8 })).toBe('away');
    expect(matchWinner({ home: 8, away: 8 })).toBeNull();
    expect(matchWinner({ home: 9, away: 8 })).toBe('home');
    expect(matchWinner({ home: 3, away: 3 })).toBeNull();
    expect(matchPoint({ home: 6, away: 4 }, 'home')).toBe(true);
    expect(matchPoint({ home: 7, away: 7 }, 'away')).toBe(false);
    expect(matchPoint({ home: 8, away: 8 }, 'away')).toBe(true);
  });

  it('scores your points minus theirs plus 5 for a win', () => {
    expect(vbScore({ home: 7, away: 0 })).toBe(12);
    expect(vbScore({ home: 7, away: 5 })).toBe(7);
    expect(vbScore({ home: 9, away: 8 })).toBe(6);
    expect(vbScore({ home: 5, away: 7 })).toBe(-2);
    expect(vbScore({ home: 0, away: 7 })).toBe(-7);
  });

  it('gives a medal only for a win: bronze any win, silver by 3, gold by 5', () => {
    expect(medalFor(vbScore({ home: 8, away: 9 }), VB_MEDALS, true)).toBeNull();
    expect(medalFor(vbScore({ home: 9, away: 8 }), VB_MEDALS, true)).toBe('bronze');
    expect(medalFor(vbScore({ home: 7, away: 4 }), VB_MEDALS, true)).toBe('silver');
    expect(medalFor(vbScore({ home: 7, away: 2 }), VB_MEDALS, true)).toBe('gold');
  });

  it('lets the rally winner serve; a side-out switches that team’s server', () => {
    expect(FIRST_SERVE).toEqual({ team: 'home', home: 0, away: 1 });
    expect(nextServe(FIRST_SERVE, 'home')).toEqual(FIRST_SERVE);
    const away = nextServe(FIRST_SERVE, 'away');
    expect(away).toEqual({ team: 'away', home: 0, away: 0 });
    expect(nextServe(away, 'home')).toEqual({ team: 'home', home: 1, away: 0 });
  });

  it('makes the rivals better as the match goes on, capped at 0.9', () => {
    expect(rivalSkill({ home: 0, away: 0 })).toBeCloseTo(RIVAL_BASE, 9);
    expect(rivalSkill({ home: 2, away: 0 })).toBeCloseTo(RIVAL_BASE + 0.1, 9);
    expect(rivalSkill({ home: 4, away: 2 })).toBeGreaterThan(rivalSkill({ home: 2, away: 2 }));
    expect(rivalSkill({ home: 8, away: 8 })).toBe(0.9);
    expect(DUKE_SKILL).toBe(0.85);
  });
});

describe('Beach Volleyball — serve', () => {
  it('starts with you serving from behind the baseline, Duke at the net, the rivals receiving', () => {
    const s = createVolleyball(1);
    expect(s.phase).toBe('serve');
    expect(s.held).toBe(true);
    expect(s.score).toEqual({ home: 0, away: 0 });
    expect(s.athletes.you.x).toBeCloseTo(-R.serverX, 9);
    expect(s.athletes.duke.x).toBeCloseTo(-R.partnerX, 9);
    expect(s.athletes.breaker.x).toBeCloseTo(R.frontX, 9);
    expect(s.athletes.riptide.x).toBeCloseTo(R.backX, 9);
  });

  it('tosses on the first press and serves the ball over the net on a well-timed second press', () => {
    let s = stepVolleyball(createVolleyball(1), ACT, DT);
    expect(s.events.some((e) => e.type === 'toss')).toBe(true);
    s = until(s, (x) => x.ball.vy < 1.2).s;
    const r = until(s, (x) => x.phase === 'live', 1, ACT);
    const serve = hits(r.events)[0];
    expect(serve?.kind).toBe('serve');
    expect(serve?.quality ?? 0).toBeGreaterThan(0.6);
    const over = until(r.s, (x) => x.ball.x > 0, 3);
    expect(over.s.ball.x).toBeGreaterThan(0);
  });

  it('catches the first missed toss and calls a serve fault on the second', () => {
    let s = stepVolleyball(createVolleyball(1), ACT, DT);
    const first = until(s, (x) => x.held, 3);
    expect(first.events.some((e) => e.type === 'catch')).toBe(true);
    expect(first.s.tosses).toBe(1);
    s = stepVolleyball(first.s, ACT, DT);
    const second = until(s, (x) => x.phase === 'dead', 3);
    expect(points(second.events)).toEqual([{ type: 'point', team: 'away', reason: 'fault', by: 'you' }]);
  });

  it('tosses by itself after a while', () => {
    const r = run(createVolleyball(1), R.autoToss + 0.1);
    expect(r.events.some((e) => e.type === 'toss')).toBe(true);
  });
});

describe('Beach Volleyball — rally end', () => {
  const fall = (x: number): Ball => ({ x, y: 0.3, vx: 0, vy: -3 });

  it('gives the point to the other side when the ball lands in', () => {
    const r = until(live(fall(6.5), { touches: { team: 'home', count: 1, last: 'you' }, lastHit: { who: 'you', kind: 'spike' } }), (x) => x.phase === 'dead', 1);
    expect(points(r.events)).toEqual([{ type: 'point', team: 'home', reason: 'kill', by: 'you' }]);
    expect(r.s.score).toEqual({ home: 1, away: 0 });
    const lost = until(live(fall(-3), { touches: { team: 'away', count: 3, last: 'breaker' }, lastHit: { who: 'breaker', kind: 'spike' } }), (x) => x.phase === 'dead', 1);
    expect(points(lost.events)[0]).toMatchObject({ team: 'away', reason: 'kill', by: 'breaker' });
  });

  it('charges an out ball to the team that touched it last', () => {
    const theirs = until(live(fall(8.2), { touches: { team: 'away', count: 1, last: 'riptide' }, lastHit: { who: 'riptide', kind: 'pass' } }), (x) => x.phase === 'dead', 1);
    expect(points(theirs.events)[0]).toMatchObject({ team: 'home', reason: 'out' });
    const ours = until(live(fall(8.2), { touches: { team: 'home', count: 3, last: 'you' }, lastHit: { who: 'you', kind: 'spike' } }), (x) => x.phase === 'dead', 1);
    expect(points(ours.events)[0]).toMatchObject({ team: 'away', reason: 'out', by: 'you' });
  });

  it('calls an untouched serve that lands in an ace', () => {
    const r = until(live(fall(6.5), { touches: { team: 'home', count: 3, last: 'you' }, lastHit: { who: 'you', kind: 'serve' } }), (x) => x.phase === 'dead', 1);
    expect(points(r.events)[0]).toMatchObject({ team: 'home', reason: 'ace', by: 'you' });
  });

  it('calls a ball that went into the net and down on the hitter’s side a net fault', () => {
    const r = until(live(fall(-0.5), {
      touches: { team: 'home', count: 3, last: 'you' }, lastHit: { who: 'you', kind: 'spike' }, netSinceTouch: true,
    }), (x) => x.phase === 'dead', 1);
    expect(points(r.events)[0]).toMatchObject({ team: 'away', reason: 'net', by: 'you' });
  });

  it('pauses, then the rally winner serves; a side-out hands the serve to the other rival', () => {
    const r = until(live(fall(-3), { touches: { team: 'away', count: 3, last: 'breaker' }, lastHit: { who: 'breaker', kind: 'spike' } }), (x) => x.phase === 'serve', 4);
    const dead = r.events.findIndex((e) => e.type === 'point');
    expect(dead).toBeGreaterThanOrEqual(0);
    expect(r.s.order).toEqual({ team: 'away', home: 0, away: 0 });
    expect(r.s.athletes.breaker.x).toBeCloseTo(R.serverX, 9);
    expect(r.s.held).toBe(true);
    expect(r.s.t).toBeGreaterThanOrEqual(R.deadTime);
  });

  it('ends the match after the deciding point', () => {
    const s = live(fall(6.5), { score: { home: 6, away: 3 }, touches: { team: 'home', count: 3, last: 'you' }, lastHit: { who: 'you', kind: 'spike' } });
    const r = until(s, (x) => x.phase === 'over', 4);
    expect(r.s.phase).toBe('over');
    expect(r.events.some((e) => e.type === 'over' && e.winner === 'home')).toBe(true);
    expect(vbScore(r.s.score)).toBe(9);
    expect(stepVolleyball(r.s, ACT, DT).score).toEqual({ home: 7, away: 3 });
  });
});

describe('Beach Volleyball — touches and the SPACE key', () => {
  const nearYou = (patch: Partial<VbState>): VbState => {
    const s = live({ x: -2.7, y: 1.6, vx: 0, vy: -1 }, patch);
    return { ...s, athletes: { ...s.athletes, you: { ...s.athletes.you, x: -3 } } };
  };

  it('hits a ball that is near instead of jumping', () => {
    const r = run(nearYou({ touches: { team: 'away', count: 3, last: 'breaker' } }), 0.1, ACT);
    expect(r.events.some((e) => e.type === 'jump')).toBe(false);
    expect(hits(r.events)[0]).toMatchObject({ who: 'you', kind: 'pass', touch: 1 });
  });

  it('jumps when the ball is far away', () => {
    const s = live({ x: 4, y: 3, vx: 0, vy: 2 });
    const next = stepVolleyball({ ...s, athletes: { ...s.athletes, you: { ...s.athletes.you, x: -3 } } }, ACT, DT);
    expect(next.events).toContainEqual({ type: 'jump', who: 'you', x: -3 });
  });

  it('never lets the same player touch twice in a row, nor a team four times', () => {
    expect(hits(run(nearYou({ touches: { team: 'home', count: 1, last: 'you' } }), 0.3, ACT).events)).toEqual([]);
    expect(hits(run(nearYou({ touches: { team: 'home', count: 3, last: 'duke' } }), 0.3, ACT).events)).toEqual([]);
    expect(hits(run(nearYou({ touches: { team: 'home', count: 1, last: 'duke' } }), 0.1, ACT).events)[0]).toMatchObject({ kind: 'set', touch: 2 });
  });
});

describe('Beach Volleyball — purity and a full match', () => {
  it('never mutates the state it is given and is deterministic for a seed', () => {
    const s = createVolleyball(99);
    const before = JSON.stringify(s);
    const a = run(s, 12, ACT).s;
    expect(JSON.stringify(s)).toBe(before);
    const b = run(createVolleyball(99), 12, ACT).s;
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it('finishes a match against a player who does nothing, and the rivals win it', () => {
    const r = until(createVolleyball(5), (x) => x.phase === 'over', 20 * 60);
    expect(r.s.phase).toBe('over');
    expect(matchWinner(r.s.score)).toBe('away');
    expect(vbScore(r.s.score)).toBeLessThanOrEqual(-4);
  });
});

function samePlaceholders<K extends string>(table: GameText<K>): void {
  for (const key of Object.keys(table.en) as K[]) {
    expect(placeholders(table.de[key]).sort(), key).toEqual(placeholders(table.en[key]).sort());
  }
}

describe('Beach Volleyball — texts', () => {
  it('has the same placeholders in English and German', () => {
    samePlaceholders(VB_TEXT);
    samePlaceholders(VB_LINES);
  });
});
