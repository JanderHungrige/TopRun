import { describe, it, expect } from 'vitest';
import { createSea, deckY, DECK, gustAt, passStart, PASS_SEA } from '../../src/game/minigames/landing-deck';
import {
  addSample, gradeTrap, GRADE, luTol, mainFault, NO_STATS, POINTS, quality, segmentAt, type PassStats,
} from '../../src/game/minigames/landing-grade';
import {
  aoaOf, ballOf, createLanding, judgeTouchdown, LANDING_RULES as R, landingScore, stepLanding, wireFor,
  type LandingInput, type LandingState,
} from '../../src/game/minigames/landing';
import { placeholders } from '../../src/i18n/i18n';
import { LANDING_TEXT } from '../../src/i18n/minigames/landing';
import { calmPilot, flyCalm, holdInput } from './landing-pilot';

const DT = 1 / 60;
const RAD = Math.PI / 180;
const neutral: LandingInput = { x: 0, y: 0, throttle: 0.5, next: false };
/** Neutral pitch and trim power, lateral air speed matched to the deck's drift: holds what it has. */
const hold: LandingInput = { ...neutral, x: DECK.drift / R.latMax };

function run(s: LandingState, input: LandingInput, seconds: number): LandingState {
  let st = s;
  for (let i = 0; i < Math.round(seconds / DT); i++) st = stepLanding(st, input, DT);
  return st;
}

/** Calm deck, the jet exactly on the glide path, lined up and on speed `range` m before the target. */
function onPath(range: number, over: Partial<LandingState['jet']> = {}): LandingState {
  const s = createLanding(1, 0);
  const g = -R.glide * RAD;
  const jet = { ...s.jet, x: 0, z: DECK.target - range, y: range * Math.tan(R.glide * RAD), gamma: g, q: 0, vxa: DECK.drift, dv: 0, engine: 0.5, ...over };
  return { ...s, jet };
}

describe('Carrier Landing', () => {
  describe('the deck', () => {
    it('pitches and heaves deterministically per seed, more on later passes', () => {
      expect(createSea(5, 1)).toEqual(createSea(5, 1));
      expect(createSea(5, 1)).not.toEqual(createSea(6, 1));
      const amp = [0, 1, 2].map((p) => createSea(3, p));
      expect(amp[0]!.pitchAmp).toBeLessThan(amp[1]!.pitchAmp);
      expect(amp[1]!.pitchAmp).toBeLessThan(amp[2]!.pitchAmp);
      expect(amp[2]!.heaveAmp).toBeCloseTo(PASS_SEA[2]!.heave, 9);
      let maxPitch = 0;
      for (let t = 0; t < 30; t += DT) maxPitch = Math.max(maxPitch, Math.abs(deckY(amp[2]!, 0, t) - deckY(amp[2]!, DECK.pivot, t)));
      expect(maxPitch).toBeGreaterThan(0.8);
      expect(maxPitch).toBeLessThanOrEqual(DECK.pivot * Math.sin(PASS_SEA[2]!.pitch * RAD) + 1e-9);
    });

    it('is flat and still without motion; gusts are smooth', () => {
      const calm = createSea(9, 2, 0);
      expect(deckY(calm, 66, 12)).toBeCloseTo(0, 12);
      expect(gustAt(calm, 4).x).toBeCloseTo(0, 12);
      expect(gustAt(calm, 4).y).toBeCloseTo(0, 12);
      const sea = createSea(9, 2);
      let prev = gustAt(sea, 0);
      for (let t = DT; t < 30; t += DT) {
        const g = gustAt(sea, t);
        expect(Math.abs(g.y - prev.y)).toBeLessThan(0.04);
        prev = g;
      }
    });

    it('starts every pass near, but not on, the glide path', () => {
      for (let seed = 1; seed <= 20; seed++) {
        for (let pass = 0; pass < 3; pass++) {
          const p = passStart(seed, pass);
          expect(Math.abs(p.ball)).toBeGreaterThanOrEqual(1);
          expect(Math.abs(p.ball)).toBeLessThanOrEqual(2.2);
          expect(Math.abs(p.x)).toBeGreaterThanOrEqual(6);
          expect(Math.abs(p.x)).toBeLessThanOrEqual(18);
          expect(Math.abs(p.dv)).toBeLessThanOrEqual(2.5);
        }
      }
      const s = createLanding(4);
      expect(s.phase).toBe('approach');
      expect(DECK.target - s.jet.z).toBeCloseTo(R.startRange, 6);
      expect(ballOf(s.jet, s.sea, 0)).toBeCloseTo(passStart(4, 0).ball, 6);
    });
  });

  describe('instruments', () => {
    it('reads the ball against the glide path to the target, in 0.25° balls', () => {
      const s = onPath(800);
      expect(ballOf(s.jet, s.sea, 0)).toBeCloseTo(0, 9);
      const high = { ...s.jet, y: 800 * Math.tan((R.glide + R.ball) * RAD) };
      expect(ballOf(high, s.sea, 0)).toBeCloseTo(1, 6);
    });

    it('lights the AoA indexer by speed error', () => {
      expect(aoaOf(0)).toBe('onSpeed');
      expect(aoaOf(-2)).toBe('slightlySlow');
      expect(aoaOf(-4)).toBe('slow');
      expect(aoaOf(2)).toBe('slightlyFast');
      expect(aoaOf(4)).toBe('fast');
    });
  });

  describe('flying', () => {
    it('holds the glide path with the stick neutral and trim power', () => {
      const s = run(onPath(2000), hold, 5);
      expect(Math.abs(ballOf(s.jet, s.sea, s.passT))).toBeLessThan(0.05);
      expect(Math.abs(s.jet.dv)).toBeLessThan(0.05);
      expect(s.jet.x).toBeCloseTo(0, 6);
    });

    it('raises the flight path with inertia', () => {
      const up = { ...neutral, y: 1 };
      const a = run(onPath(2000), up, 0.1);
      const b = run(onPath(2000), up, 1.1);
      expect((a.jet.gamma + R.glide * RAD) / RAD).toBeLessThan(0.1);
      expect((b.jet.gamma - a.jet.gamma) / RAD).toBeGreaterThan(1.1);
      expect((b.jet.gamma - a.jet.gamma) / RAD).toBeLessThan(1.6);
    });

    it('drifts left of the centreline with the stick neutral', () => {
      const s = run(onPath(2000, { vxa: 0 }), neutral, 4);
      expect(s.jet.x).toBeLessThan(-3);
      expect(s.jet.x).toBeGreaterThan(-4.5);
    });

    it('slows on approach power and speeds up on full power', () => {
      expect(run(onPath(2200), { ...neutral, throttle: R.keyPower }, 10).jet.dv).toBeLessThan(-2);
      expect(run(onPath(2200), { ...neutral, throttle: 1 }, 6).jet.dv).toBeGreaterThan(5);
    });
  });

  describe('touchdown', () => {
    it('catches the first wire at or past the touchdown point', () => {
      expect(wireFor(30)).toBe(1);
      expect(wireFor(48)).toBe(1);
      expect(wireFor(55)).toBe(2);
      expect(wireFor(DECK.target)).toBe(3);
      expect(wireFor(80)).toBe(4);
      expect(wireFor(85)).toBeNull();
      expect(judgeTouchdown(66, 0)).toEqual({ kind: 'trap', wire: 3 });
      expect(judgeTouchdown(90, 0)).toEqual({ kind: 'bolter', reason: 'long' });
      expect(judgeTouchdown(66, R.skipFast + 0.1)).toEqual({ kind: 'bolter', reason: 'fast' });
    });

    it('traps on the 3-wire from a stable approach and stops within ≈ 2.5 s', () => {
      let s = run(onPath(600), hold, 7.2);
      expect(s.phase).toBe('trap');
      expect(s.pending?.outcome).toEqual({ kind: 'trap', wire: 3 });
      expect(s.pending?.grade).toBe('ok');
      const z0 = s.jet.z;
      s = run(s, neutral, 2.5);
      expect(s.jet.vz).toBe(0);
      expect(s.jet.z - z0).toBeLessThan(115);
    });

    it('waves off a jet that is low in close and never lets it touch the ship', () => {
      let s = onPath(500, { y: 500 * Math.tan((R.glide - 0.6) * RAD) });
      let minClear = Infinity;
      for (let i = 0; i < 60 * 6; i++) {
        s = stepLanding(s, hold, DT);
        if (s.jet.z > -5 && s.jet.z < DECK.length) minClear = Math.min(minClear, s.jet.y - deckY(s.sea, s.jet.z, s.passT));
      }
      expect(s.results[0]?.outcome).toEqual({ kind: 'waveoff', reason: 'low' });
      expect(s.results[0]?.points).toBe(0);
      expect(minClear).toBeGreaterThan(0);
    });

    it('waves off a jet lined up far off the centreline in close', () => {
      const s = run(onPath(500, { x: -9 }), neutral, 3);
      expect(s.pending?.outcome).toEqual({ kind: 'waveoff', reason: 'lineup' });
    });

    it('bolters when high or fast', () => {
      const high = run(onPath(400, { y: 400 * Math.tan((R.glide + 0.45) * RAD) }), hold, 7);
      expect(high.pending?.outcome.kind).toBe('bolter');
      const fast = run(onPath(300, { dv: 7.5 }), { ...neutral, throttle: 1 }, 4);
      expect(fast.pending?.outcome).toEqual({ kind: 'bolter', reason: 'fast' });
      expect(fast.pending?.points).toBe(1);
    });
  });

  describe('the round', () => {
    it('runs three passes, shows each grade card and ends with the total', () => {
      const s = calmPilot();
      expect(s.phase).toBe('over');
      expect(s.results.map((r) => r.grade)).toEqual(['ok', 'ok', 'ok']);
      expect(s.results.map((r) => r.outcome)).toEqual([0, 1, 2].map(() => ({ kind: 'trap', wire: 3 })));
      expect(landingScore(s)).toBe(12);
    });

    it('skips the grade card with fire only after a second', () => {
      let s = flyCalm(createLanding(2, 0), (st) => st.phase === 'graded');
      s = stepLanding(s, holdInput(s, true), DT);
      expect(s.phase).toBe('graded');
      s = run(s, { ...neutral, next: false }, R.cardSkip);
      s = stepLanding(s, { ...neutral, next: true }, DT);
      expect(s.phase).toBe('approach');
      expect(s.pass).toBe(1);
      expect(s.results).toHaveLength(1);
    });
  });

  describe('grading', () => {
    const stats = (ball: number, x: number, kt: number, from = -1100, to = 66): PassStats => {
      let st = NO_STATS;
      for (let z = from; z < to; z += 86 * DT) st = addSample(st, z, ball, x, kt, DT);
      return st;
    };

    it('splits the approach into middle, in close and at the ramp', () => {
      expect(segmentAt(-1200)).toBeNull();
      expect(segmentAt(-1100)).toBe('middle');
      expect(segmentAt(-500)).toBe('close');
      expect(segmentAt(-150)).toBe('ramp');
      expect(segmentAt(40)).toBe('ramp');
      expect(luTol(-1100)).toBeCloseTo(GRADE.luBase + 1100 * GRADE.luSlope, 9);
      expect(luTol(10)).toBe(GRADE.luBase);
    });

    it('grades OK, Fair and No grade from the approach quality and the wire', () => {
      expect(quality(stats(0.18, 0, 2))).toBeCloseTo(0.4, 6);
      expect(quality(stats(0.5, 0, 2))).toBeCloseTo(0.5 / GRADE.gsBall, 6);
      expect(gradeTrap(0.8, 3)).toBe('ok');
      expect(gradeTrap(0.8, 2)).toBe('fair');
      expect(gradeTrap(1.5, 4)).toBe('fair');
      expect(gradeTrap(1.5, 1)).toBe('noGrade');
      expect(gradeTrap(2.5, 3)).toBe('noGrade');
      expect(POINTS).toEqual({ ok: 4, fair: 3, noGrade: 2, bolter: 1, waveoff: 0 });
    });

    it('names the worst fault, "a little" when mild, nothing when steady', () => {
      expect(mainFault(stats(0.3, 0, 1))).toBeNull();
      const close = { ...stats(0, 0, 0), close: stats(-0.8, 0, 0, -500, -150 - 1e-9).close };
      expect(mainFault(close)).toEqual({ cat: 'low', little: true, where: 'close' });
      const slow = stats(0, 0, -12);
      expect(mainFault(slow)?.cat).toBe('slow');
      expect(mainFault(slow)?.little).toBe(false);
      expect(mainFault(stats(0, 6, 0))?.cat).toBe('right');
    });
  });

  it('has EN and DE texts with the same keys and placeholders', () => {
    const keys = Object.keys(LANDING_TEXT.en) as (keyof typeof LANDING_TEXT.en)[];
    expect(Object.keys(LANDING_TEXT.de).sort()).toEqual([...keys].sort());
    for (const k of keys) expect(placeholders(LANDING_TEXT.de[k])).toEqual(placeholders(LANDING_TEXT.en[k]));
  });
});
