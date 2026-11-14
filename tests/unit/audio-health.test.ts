import { describe, expect, it } from 'vitest';
import { budget, freshHealth, initialTier, stepHealth, type HealthInput } from '../../src/core/audio-health';
import { loudestLayers } from '../../src/core/sfx-recipes';

// Bug B1 (doc 01): older iPads stuttered under load and then went silent for good. The audio now watches its own clock,
// sheds load, and recovers a stopped context.

/** Runs the watch for `seconds` of wall time in 0.1 s frames, the audio clock advancing at `rate` × real time. */
function run(seconds: number, rate: number, state = 'running', visible = true, from = freshHealth('touch', 0, 0)) {
  let h = from;
  let wall = h.wall;
  let audio = h.audio;
  const actions: string[] = [];
  for (let k = 0; k < Math.round(seconds / 0.1); k++) {
    wall += 0.1;
    audio += 0.1 * rate;
    const input: HealthInput = { wall, audio, state, visible };
    const r = stepHealth(h, input);
    h = r.health;
    if (r.action !== 'none') actions.push(r.action);
  }
  return { h, actions };
}

describe('Audio health — the watchdog (doc 01, bug B1)', () => {
  it('leaves a healthy context alone', () => {
    const { h, actions } = run(5, 1);
    expect(h.tier).toBe('touch');
    expect(actions).toEqual([]);
  });

  it('switches to lite when the audio clock falls behind real time (the stutter), and stays there', () => {
    const { h } = run(1.6, 0.75);
    expect(h.tier).toBe('lite');
    const later = run(5, 1, 'running', true, h);
    expect(later.h.tier).toBe('lite');
  });

  it('does not react to a short hiccup', () => {
    const { h } = run(0.5, 0.7);
    expect(h.tier).toBe('touch');
  });

  it('asks for a rebuild when the context says running but its clock stands still', () => {
    const { actions } = run(2, 0);
    expect(actions).toContain('rebuild');
    expect(run(1, 0).actions).not.toContain('rebuild');
  });

  it('asks to resume a suspended or interrupted context and to rebuild a closed one', () => {
    expect(run(0.2, 0, 'suspended').actions).toContain('resume');
    expect(run(0.2, 0, 'interrupted').actions).toContain('resume');
    expect(run(0.2, 0, 'closed').actions).toContain('rebuild');
  });

  it('ignores a hidden page: no lite, no rebuild while the tab sleeps', () => {
    const { h, actions } = run(4, 0, 'running', false);
    expect(h.tier).toBe('touch');
    expect(actions).toEqual([]);
  });
});

describe('Audio health — budgets (doc 01, bug B1)', () => {
  it('starts touch devices on the touch tier and desktops on full', () => {
    expect(initialTier(5)).toBe('touch');
    expect(initialTier(2)).toBe('touch');
    expect(initialTier(1)).toBe('full');
    expect(initialTier(0)).toBe('full');
  });

  it('costs less with every tier: fewer voices, less oversampling, shorter or no reverb, fewer layers', () => {
    const full = budget('full');
    const touch = budget('touch');
    const lite = budget('lite');
    expect([full.voices, touch.voices, lite.voices]).toEqual([24, 16, 8]);
    expect([full.radio, touch.radio, lite.radio]).toEqual(['4x', '2x', 'none']);
    expect([full.ceiling, touch.ceiling, lite.ceiling]).toEqual(['2x', '2x', 'none']);
    expect([full.reverb, touch.reverb, lite.reverb]).toEqual([2.2, 1.2, 0]);
    expect(lite.layers).toBe(2);
    expect(full.layers).toBeGreaterThanOrEqual(6);
  });

  it('keeps an effect\'s loudest layers when it has to drop some', () => {
    const all = loudestLayers('explosionLarge', 99);
    expect(all.length).toBeGreaterThan(2);
    const two = loudestLayers('explosionLarge', 2);
    expect(two).toHaveLength(2);
    const minKept = Math.min(...two.map((l) => l.v));
    const dropped = all.filter((l) => !two.includes(l));
    for (const l of dropped) expect(l.v).toBeLessThanOrEqual(minKept);
    expect(loudestLayers('gun', 2)).toHaveLength(2);
  });
});
