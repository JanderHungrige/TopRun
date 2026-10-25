import { createRng } from '../../src/core/rng';
import type { PlaneId } from '../../src/data/types';
import { createFormation, predict, slotPoint, stepFormation, type FormationState, type Stick, type WingState } from '../../src/game/minigames/formation';
import { leadPose, ROUND_END } from '../../src/game/minigames/formation-script';

// Formation Flying (doc 14) test helpers: state setup and simulated pilots for the medal playtest.

export const DT = 1 / 60;
export const STILL: Stick = { x: 0, y: 0 };
export type Pilot = (s: FormationState) => Stick;

export const solo = (plane: PlaneId = 'f16'): FormationState => createFormation([{ slot: 'right', plane }]);
/** Calm air (no jet wash): exact physics checks. */
export const calm = (): FormationState => createFormation([{ slot: 'right', plane: 'f16' }], 0);
export const wing = (s: FormationState, i = 0): WingState => {
  const w = s.wings[i];
  if (!w) throw new Error('no wing');
  return w;
};

export function steps(s: FormationState, stick: Stick, seconds: number): FormationState {
  let st = s;
  for (let i = 0; i < Math.round(seconds / DT); i++) st = stepFormation(st, [stick], DT);
  return st;
}

export function fly(s: FormationState, pilot: Pilot): FormationState {
  let st = s;
  for (let i = 0; i < 60 * (ROUND_END + 2) && !st.done; i++) st = stepFormation(st, [pilot(st)], DT);
  return st;
}

/** Moves wing 0 to `at` with velocity `v` (test setup). */
export function place(s: FormationState, at: { x: number; y: number }, v = { x: 0, y: 0 }): FormationState {
  return { ...s, wings: s.wings.map((w, i) => (i === 0 ? { ...w, x: at.x, y: at.y, vx: v.x, vy: v.y } : w)) };
}

/** Runs to time `t` with wing 0 glued to its slot (velocity matched), then hands back the state. */
export function gluedUntil(s: FormationState, t: number): FormationState {
  let st = s;
  while (st.t < t - 1e-9 && !st.done) {
    const w = wing(st);
    const now = slotPoint(leadPose(st.t + DT), w.slot, w.plane);
    st = stepFormation(place(st, now), [STILL], DT);
    st = place(st, now);
  }
  return st;
}

const unit = (v: number): number => (v > 0 ? 1 : v < 0 ? -1 : 0);

/**
 * Keyboard pilot (full deflection or nothing per axis): extrapolates the slot `look` s ahead from what it
 * saw `delay` s ago, compares it with the prediction pip, misjudges by up to `noise` px, and changes its
 * keys at most `hz` times a second.
 */
export function keyPilot(look: number, dead: number, delay = 0, noise = 0, seed = 7, hz = 60): Pilot {
  const rng = createRng(seed);
  const seen: FormationState[] = [];
  const every = Math.max(1, Math.round(60 / hz));
  let jx = 0;
  let jy = 0;
  let keys: Stick = { x: 0, y: 0 };
  return (s) => {
    seen.push(s);
    if (seen.length % 15 === 0) {
      jx = rng.range(-noise, noise);
      jy = rng.range(-noise, noise);
    }
    if ((seen.length - 1) % every !== 0) return keys;
    const obs = seen[Math.max(0, seen.length - 1 - Math.round(delay / DT))] ?? s;
    const w = wing(obs);
    const a = slotPoint(leadPose(obs.t), w.slot, w.plane);
    const b = slotPoint(leadPose(Math.max(0, obs.t - 0.1)), w.slot, w.plane);
    const target = { x: a.x + ((a.x - b.x) / 0.1) * look + jx, y: a.y + ((a.y - b.y) / 0.1) * look + jy };
    const own = predict(obs, 0, look);
    const ex = target.x - own.x;
    const ey = target.y - own.y;
    keys = { x: Math.abs(ex) > dead ? unit(ex) : 0, y: Math.abs(ey) > dead ? unit(ey) : 0 };
    return keys;
  };
}

/** Steers straight at where it saw the slot `delay` s ago, ignoring its own drift (no anticipation). */
export function naivePilot(delay: number): Pilot {
  const seen: FormationState[] = [];
  return (s) => {
    seen.push(s);
    const obs = seen[Math.max(0, seen.length - 1 - Math.round(delay / DT))] ?? s;
    const w = wing(obs);
    const at = slotPoint(leadPose(obs.t), w.slot, w.plane);
    const ex = at.x - w.x;
    const ey = at.y - w.y;
    return { x: Math.abs(ex) > 6 ? unit(ex) : 0, y: Math.abs(ey) > 6 ? unit(ey) : 0 };
  };
}
