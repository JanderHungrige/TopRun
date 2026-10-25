import { describe, it, expect } from 'vitest';
import { createEvasion, NO_INPUT, stepEvasion, type EvasionEvent, type EvasionInput, type EvasionState } from '../../src/game/minigames/evasion';
import {
  aamShare, launchOffset, planWave, WAVES, waveCount, waveMul, waveSideCount, waveSpacing,
} from '../../src/game/minigames/evasion-waves';

// Missile Evasion waves (doc 16): seeded plans, launch warnings, pacing, determinism.

const DT = 1 / 60;
const FLARE: EvasionInput = { ...NO_INPUT, flare: true };

function run(s: EvasionState, inp: EvasionInput, seconds: number): { s: EvasionState; events: EvasionEvent[] } {
  let st = s;
  const events: EvasionEvent[] = [];
  for (let i = 0; i < Math.round(seconds / DT); i++) {
    st = stepEvasion(st, inp, DT);
    events.push(...st.events);
  }
  return { s: st, events };
}

describe('Missile Evasion waves', () => {
  it('grow from 2 SAMs from one side to 6 mixed missiles from all sides, faster and tighter', () => {
    expect([1, 2, 3, 4, 5, 6, 7, 8, 9, 14].map(waveCount)).toEqual([2, 2, 3, 3, 4, 4, 5, 5, 6, 6]);
    expect([1, 2, 3, 4, 5, 6, 7, 12].map(waveSideCount)).toEqual([1, 1, 2, 2, 3, 3, 4, 4]);
    expect(aamShare(1)).toBe(0);
    expect(aamShare(3)).toBeCloseTo(0.3, 6);
    expect(aamShare(20)).toBe(0.6);
    expect(waveSpacing(1)).toBeCloseTo(1.5, 6);
    expect(waveSpacing(20)).toBe(0.8);
    expect(waveMul(1)).toEqual({ speed: 1, turn: 1 });
    expect(waveMul(3)).toEqual({ speed: 1.1, turn: 1.08 });
    expect(waveMul(30)).toEqual({ speed: 1.4, turn: 1.35 });
  });

  it('plan seeded launches from the chosen sides, announced ahead, just outside the field', () => {
    const plan = planWave(7, 10, 1234);
    expect(plan.launches).toHaveLength(5);
    expect(new Set(plan.launches.map((l) => l.side)).size).toBe(4);
    expect(plan.launches[0]?.at).toBeCloseTo(10 + WAVES.warn, 6);
    for (const l of plan.launches) {
      const d = Math.hypot(l.offset.x, l.offset.y);
      expect(d).toBeGreaterThan(600);
      expect(d).toBeLessThan(850);
    }
    expect(planWave(7, 10, 1234)).toEqual(plan);
    expect(planWave(1, 0, 99).launches.every((l) => l.kind === 'sam')).toBe(true);
    expect(launchOffset('N', 0)).toEqual({ x: 0, y: -620 });
    expect(launchOffset('E', 1)).toEqual({ x: 760, y: 300 });
  });

  it('announce every launch with a warning, then launch it at the jet', () => {
    const { s, events } = run(createEvasion(7), NO_INPUT, WAVES.first + WAVES.warn + 0.05);
    expect(events[0]).toEqual({ type: 'wave', wave: 1 });
    const warn = events.findIndex((e) => e.type === 'warn');
    const launch = events.findIndex((e) => e.type === 'launch');
    expect(warn).toBeGreaterThan(-1);
    expect(launch).toBeGreaterThan(warn);
    expect(s.missiles).toHaveLength(1);
    expect(s.missiles[0]?.mode).toBe('tracking');
  });

  it('start the next wave 1.5 s after the current one is resolved', () => {
    let s = createEvasion(3);
    let resolvedAt: number | null = null;
    let wave2At: number | null = null;
    for (let i = 0; i < 60 * 30 && wave2At === null; i++) {
      s = stepEvasion(s, FLARE, DT);
      const threat = s.pending.length > 0 || s.missiles.some((m) => m.mode === 'tracking');
      if (resolvedAt === null && s.wave === 1 && !threat) resolvedAt = s.t;
      if (s.events.some((e) => e.type === 'wave' && e.wave === 2)) wave2At = s.t;
    }
    expect(resolvedAt).not.toBeNull();
    expect((wave2At ?? 0) - (resolvedAt ?? 0)).toBeCloseTo(WAVES.gap, 1);
  });

  it('are deterministic for a seed and the same inputs', () => {
    const steer: EvasionInput = { ...NO_INPUT, steerX: 1, steerY: 0.3 };
    expect(run(createEvasion(42), steer, 12).s).toEqual(run(createEvasion(42), steer, 12).s);
  });
});
