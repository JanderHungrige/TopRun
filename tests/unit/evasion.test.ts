import { describe, it, expect } from 'vitest';
import { wrapAngle } from '../../src/core/math';
import {
  createEvasion, EVASION_RULES as R, NO_INPUT, stepEvasion, type EvasionEvent, type EvasionInput, type EvasionState,
} from '../../src/game/minigames/evasion';
import { breakReady, createJet, flyJet, gLoad, JET } from '../../src/game/minigames/evasion-flight';
import {
  DECOY, decoyChance, launchMissile, MISSILE_SPECS, tailAngle, type Missile, type MissileKind,
} from '../../src/game/minigames/evasion-missiles';
import { placeholders } from '../../src/i18n/i18n';
import { EVASION_TEXT } from '../../src/i18n/minigames/evasion';

const DT = 1 / 60;
const DEG = Math.PI / 180;
const input = (steerX: number, steerY: number, extra: Partial<EvasionInput> = {}): EvasionInput =>
  ({ steerX, steerY, flare: false, brk: false, ...extra });
const FLARE = input(0, 0, { flare: true });

/** A missile at top speed, `dist` px from the jet (at 0, 0) at `bearing` (0 = ahead/up, π = astern). */
function missileAt(kind: MissileKind, dist: number, bearing: number, id = 1): Missile {
  const m = launchMissile(id, kind, 1, Math.sin(bearing) * dist, -Math.cos(bearing) * dist, 0, 0);
  const spec = MISSILE_SPECS[kind];
  return { ...m, age: spec.boostTime, speed: spec.topSpeed };
}

/** Drill mode (no waves) with the given missiles. */
function drill(missiles: Missile[], seed = 1): EvasionState {
  return { ...createEvasion(seed, false), missiles, nextId: missiles.length + 1 };
}

/** Steps with a fixed input until `stop` (or `seconds`); collects all events. */
function run(s: EvasionState, inp: EvasionInput, seconds: number, stop?: (s: EvasionState) => boolean): { s: EvasionState; events: EvasionEvent[] } {
  let st = s;
  const events: EvasionEvent[] = [];
  for (let i = 0; i < Math.round(seconds / DT) && !(stop?.(st) ?? false); i++) {
    st = stepEvasion(st, inp, DT);
    events.push(...st.events);
  }
  return { s: st, events };
}

const fly = (seconds: number, steer: { x: number; y: number }, brk = false) => {
  let j = createJet();
  for (let i = 0; i < Math.round(seconds / DT); i++) j = flyJet(j, steer, brk && i === 0, DT);
  return j;
};

describe('Missile Evasion', () => {
  describe('the jet', () => {
    it('cruises straight ahead at 250 px/s without input', () => {
      const j = fly(1, { x: 0, y: 0 });
      expect(j.y).toBeCloseTo(-JET.speed, 0);
      expect(j.x).toBeCloseTo(0, 6);
      expect(j.heading).toBe(0);
    });

    it('turns towards the pushed direction, never faster than the turn limit, and settles on it', () => {
      let j = createJet();
      let fastest = 0;
      for (let i = 0; i < 150; i++) {
        const h = j.heading;
        j = flyJet(j, { x: 1, y: 0 }, false, DT);
        fastest = Math.max(fastest, Math.abs(wrapAngle(j.heading - h)) / DT);
      }
      expect(fastest).toBeLessThanOrEqual(JET.turn + 1e-9);
      expect(fastest).toBeGreaterThan(JET.turn * 0.95);
      expect(j.heading).toBeCloseTo(Math.PI / 2, 2);
    });

    it('rolls into a turn and slides through it (momentum)', () => {
      const one = flyJet(createJet(), { x: -1, y: 0 }, false, DT);
      expect(Math.abs(one.omega)).toBeLessThan(JET.turn * 0.25);
      const mid = fly(0.5, { x: 1, y: 1 });
      const track = Math.atan2(mid.vx, -mid.vy);
      expect(mid.heading - track).toBeGreaterThan(5 * DEG);
    });

    it('breaks with extra turn rate and speed for 1 s, then needs the cooldown', () => {
      let j = flyJet(createJet(), { x: 1, y: 0 }, true, DT);
      expect(breakReady(j)).toBe(false);
      let fastest = 0;
      for (let i = 0; i < 50; i++) {
        const h = j.heading;
        j = flyJet(j, { x: 0, y: 1 }, false, DT);
        fastest = Math.max(fastest, Math.abs(wrapAngle(j.heading - h)) / DT);
      }
      expect(fastest).toBeGreaterThan(JET.turn * 1.4);
      expect(fastest).toBeLessThanOrEqual(JET.breakTurn + 1e-9);
      expect(j.speed).toBeGreaterThan(JET.speed + 30);
      const again = flyJet(j, { x: 0, y: 0 }, true, DT);
      expect(again.breakCd).toBeLessThan(j.breakCd);
      let k = j;
      for (let i = 0; i < Math.round(JET.breakCooldown / DT); i++) k = flyJet(k, { x: 0, y: 0 }, false, DT);
      expect(breakReady(k)).toBe(true);
      expect(k.speed).toBeCloseTo(JET.speed, 0);
    });

    it('pulls 1 G level, about 5 G in a full turn and about 9 G in a break', () => {
      expect(gLoad(createJet())).toBeCloseTo(1, 5);
      expect(gLoad(fly(0.6, { x: 0, y: 1 }))).toBeGreaterThan(4);
      expect(gLoad(fly(0.6, { x: 0, y: 1 }, true))).toBeGreaterThan(8);
    });
  });

  describe('missiles', () => {
    it('boosts from launch speed and respects its turn and turn-acceleration limits', () => {
      const spec = MISSILE_SPECS.sam;
      let s = drill([launchMissile(1, 'sam', 1, 600, 0, 0, 0)]);
      let maxOmega = 0;
      let maxAccel = 0;
      for (let i = 0; i < 90 && s.missiles[0]?.mode === 'tracking'; i++) {
        const before = s.missiles[0];
        s = stepEvasion(s, input(-1, 0), DT);
        const m = s.missiles[0];
        if (!before || !m) break;
        maxOmega = Math.max(maxOmega, Math.abs(m.omega));
        maxAccel = Math.max(maxAccel, Math.abs(m.omega - before.omega) / DT);
      }
      expect(maxOmega).toBeLessThanOrEqual(spec.turn + 1e-9);
      expect(maxAccel).toBeLessThanOrEqual(spec.turnAccel + 1e-6);
      expect(s.missiles[0]?.speed).toBeCloseTo(spec.topSpeed, 0);
    });

    it('hits a jet that just flies straight on', () => {
      const { s, events } = run(drill([missileAt('sam', 400, Math.PI)]), NO_INPUT, 5, (st) => st.hits > 0);
      expect(s.hull).toBe(R.hull - 1);
      expect(s.evaded).toBe(0);
      expect(events.some((e) => e.type === 'hit' && e.damage)).toBe(true);
      expect(s.missiles).toHaveLength(0);
    });

    it('burns out after its motor time if it cannot catch the jet: evaded', () => {
      const { s, events } = run(drill([missileAt('aam', 2400, Math.PI)]), NO_INPUT, 6, (st) => st.evaded > 0);
      expect(s.evaded).toBe(1);
      expect(s.hull).toBe(R.hull);
      const ev = events.find((e) => e.type === 'evaded');
      expect(ev?.type === 'evaded' && ev.how).toBe('burnout');
      expect(s.t).toBeCloseTo(MISSILE_SPECS.aam.burn - MISSILE_SPECS.aam.boostTime, 1);
    });

    it('overshoots (loses lock) when the jet breaks across its nose at close range', () => {
      const close = drill([missileAt('sam', 150, Math.PI * 0.75)]);
      const brk = run(close, input(1, 0, { brk: true }), 3, (st) => st.evaded > 0 || st.hits > 0);
      expect(brk.s.hits).toBe(0);
      expect(brk.events.some((e) => e.type === 'evaded' && e.how === 'overshoot')).toBe(true);
      const none = run(close, NO_INPUT, 3, (st) => st.evaded > 0 || st.hits > 0);
      expect(none.s.hits).toBe(1);
    });

    it('a break started far too early does not shake it off', () => {
      const far = drill([missileAt('sam', 600, Math.PI)]);
      const { s } = run(far, input(1, 0, { brk: true }), 5, (st) => st.evaded > 0 || st.hits > 0);
      expect(s.hits).toBe(1);
    });
  });

  describe('flares', () => {
    it('are most effective against a missile at the tail and rarely work head-on', () => {
      expect(decoyChance(0)).toBeCloseTo(DECOY.tailChance, 6);
      expect(decoyChance(DECOY.cone)).toBeCloseTo(DECOY.tailChance, 6);
      expect(decoyChance(Math.PI)).toBeCloseTo(DECOY.headChance, 6);
      expect(decoyChance(75 * DEG)).toBeLessThan(decoyChance(45 * DEG));
      expect(decoyChance(75 * DEG)).toBeGreaterThan(decoyChance(110 * DEG));
      const jet = createJet();
      expect(tailAngle(jet, 0, 100)).toBeCloseTo(0, 6);
      expect(tailAngle(jet, 0, -100)).toBeCloseTo(Math.PI, 6);
      expect(tailAngle(jet, 100, 0)).toBeCloseTo(Math.PI / 2, 6);
    });

    it('use a charge per pack and recharge one every 5 s up to 3', () => {
      let s = drill([]);
      for (let i = 0; i < R.flareCharges; i++) s = stepEvasion(s, FLARE, DT);
      expect(s.charges).toBe(0);
      expect(s.flares.length).toBeGreaterThan(0);
      const dry = stepEvasion(s, FLARE, DT);
      expect(dry.events.some((e) => e.type === 'flare')).toBe(false);
      s = run(s, NO_INPUT, R.flareRecharge + 0.05).s;
      expect(s.charges).toBe(1);
      s = run(s, NO_INPUT, R.flareRecharge * 3).s;
      expect(s.charges).toBe(R.flareCharges);
    });

    it('decoy tail-chasers most of the time and head-on missiles rarely (seeded rolls)', () => {
      const rate = (bearing: number) => {
        let ok = 0;
        for (let seed = 1; seed <= 200; seed++) ok += stepEvasion(drill([missileAt('sam', 200, bearing)], seed), FLARE, DT).evaded;
        return ok / 200;
      };
      expect(rate(Math.PI)).toBeGreaterThan(0.8);
      expect(rate(0)).toBeLessThan(0.3);
      const far = stepEvasion(drill([missileAt('sam', DECOY.range + 40, Math.PI)]), FLARE, DT);
      expect(far.evaded).toBe(0);
      expect(far.events.some((e) => e.type === 'resisted')).toBe(false);
    });

    it('a decoyed missile is harmless and blows up on the flare', () => {
      let seed = 1;
      while (stepEvasion(drill([missileAt('sam', 120, Math.PI)], seed), FLARE, DT).evaded === 0) seed++;
      const s = stepEvasion(drill([missileAt('sam', 120, Math.PI)], seed), FLARE, DT);
      expect(s.events.some((e) => e.type === 'evaded' && e.how === 'decoyed')).toBe(true);
      const after = run(s, NO_INPUT, 3);
      expect(after.s.hits).toBe(0);
      expect(after.s.missiles).toHaveLength(0);
      expect(after.events.some((e) => e.type === 'pop')).toBe(true);
    });
  });

  describe('hull and round end', () => {
    it('a second missile within the grace after a hit does no damage', () => {
      const s = drill([missileAt('sam', 300, Math.PI, 1), missileAt('sam', 330, Math.PI, 2)]);
      const { s: end, events } = run(s, NO_INPUT, 3, (st) => st.missiles.length === 0);
      expect(end.hull).toBe(R.hull - 1);
      expect(events.filter((e) => e.type === 'hit')).toHaveLength(2);
      expect(end.evaded).toBe(0);
    });

    it('ends when the hull is gone and then stops changing', () => {
      const s = { ...drill([missileAt('sam', 300, Math.PI)]), hull: 1 };
      const { s: end, events } = run(s, NO_INPUT, 3, (st) => st.over !== null);
      expect(end.over).toBe('down');
      expect(events.some((e) => e.type === 'over' && e.reason === 'down')).toBe(true);
      const next = stepEvasion(end, input(1, 0, { flare: true }), DT);
      expect(next.t).toBe(end.t);
      expect(next.jet).toBe(end.jet);
    });

    it('ends at 90 s; missiles still in the air do not count', () => {
      const s = { ...drill([missileAt('sam', 1500, Math.PI)]), t: R.roundTime - 0.5, evaded: 7 };
      const { s: end } = run(s, NO_INPUT, 1, (st) => st.over !== null);
      expect(end.over).toBe('time');
      expect(end.evaded).toBe(7);
    });
  });

  it('has the same keys and placeholders in English and German', () => {
    const keys = Object.keys(EVASION_TEXT.en) as (keyof typeof EVASION_TEXT.en)[];
    expect(Object.keys(EVASION_TEXT.de).sort()).toEqual([...keys].sort());
    for (const k of keys) expect(placeholders(EVASION_TEXT.de[k])).toEqual(placeholders(EVASION_TEXT.en[k]));
  });
});
