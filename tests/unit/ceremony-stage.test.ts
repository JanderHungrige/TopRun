import { describe, expect, it } from 'vitest';
import { beatAt, FIRST, MORE } from '../../src/game/ceremony';
import { PRESET_LOOKS } from '../../src/game/avatar-look';
import { ADMIRAL_PIN_X, ADMIRAL_START_X, pilotBase, skinTone, stagePlan, STEP_BACK } from '../../src/game/ceremony-stage';

const at = (index: number, t: number) => stagePlan(beatAt(index, t));

describe('ceremony stage (layered)', () => {
  it('picks the grown-up pilot cut-out by gender and hair length (kids too), and one of two skin tones', () => {
    expect(pilotBase({ gender: 'male', length: 'short' })).toBe('adultMaleShort');
    expect(pilotBase({ gender: 'male', length: 'long' })).toBe('adultMaleLong');
    expect(pilotBase({ gender: 'female', length: 'short' })).toBe('adultFemaleShort');
    const kidGirl = { age: 'kid', gender: 'female', length: 'long' } as const;
    const kidBoy = { age: 'kid', gender: 'male', length: 'short' } as const;
    expect(pilotBase(kidGirl)).toBe('adultFemaleLong');
    expect(pilotBase(kidBoy)).toBe('adultMaleShort');
    expect([skinTone('fair'), skinTone('olive'), skinTone('brown'), skinTone('dark')]).toEqual(['light', 'light', 'dark', 'dark']);
  });

  it('presets match their portraits (checked by eye, 2026-10-28)', () => {
    expect(pilotBase(PRESET_LOOKS.pilot6)).toBe('adultMaleLong'); // hair tied back
    expect(pilotBase(PRESET_LOOKS.pilot10)).toBe('adultFemaleLong'); // bun
    expect(pilotBase(PRESET_LOOKS.pilot19)).toBe('adultMaleShort'); // a kid, shown grown-up
    expect(pilotBase(PRESET_LOOKS.pilot2)).toBe('adultFemaleLong'); // a kid, shown grown-up
    expect(PRESET_LOOKS.pilot3.hair).toBe('brown'); // golden brown, not red
    expect(PRESET_LOOKS.pilot16.hair).toBe('brown'); // light brown with a bun
  });

  it('first medal: the admiral walks in from off-screen right, alternating walk frames, and stops to pin', () => {
    expect(at(0, 0.2)).toMatchObject({ admiral: 'stand', admiralX: ADMIRAL_START_X, pilot: 'attention', crewSalute: false });
    const walking = [0.8, 1.0, 1.2, 1.4, 1.6, 1.8, 2.0].map((t) => at(0, t));
    expect(new Set(walking.map((p) => p.admiral))).toEqual(new Set(['walkA', 'walkB']));
    for (let i = 1; i < walking.length; i++) expect(walking[i]?.admiralX).toBeLessThanOrEqual(walking[i - 1]?.admiralX ?? 0);
    expect(at(0, 2.7)).toMatchObject({ admiral: 'stand', admiralX: ADMIRAL_PIN_X });
    expect(at(0, FIRST.pin)).toMatchObject({ admiral: 'pin', admiralX: ADMIRAL_PIN_X });
  });

  it('then pilot and admiral salute (the admiral a step back), and after them the crew in the back', () => {
    expect(at(0, 5.5)).toMatchObject({ admiral: 'salute', pilot: 'salute', crewSalute: false, admiralX: ADMIRAL_PIN_X + STEP_BACK });
    expect(at(0, 7.5)).toMatchObject({ admiral: 'stand', pilot: 'attention', crewSalute: true });
    expect(at(0, FIRST.end)).toMatchObject({ admiral: 'stand', pilot: 'attention', crewSalute: false });
  });

  it('a further medal: a quick step in, the pin, a step back, no salute', () => {
    expect(at(1, 0)).toMatchObject({ admiralX: ADMIRAL_PIN_X + STEP_BACK, pilot: 'attention' });
    expect(at(1, MORE.pin).admiral).toBe('pin');
    expect(at(1, MORE.end)).toMatchObject({ admiral: 'stand', admiralX: ADMIRAL_PIN_X + STEP_BACK, pilot: 'attention' });
  });
});
