import { TAU } from '../../core/math';
import { createRng } from '../../core/rng';

// Carrier Landing deck (doc 18): the ship's landing-area geometry in the landing frame (x right, y up, z forward
// from the ramp, metres), its seeded pitch and heave, the gusts and where each pass starts. Pure.

const RAD = Math.PI / 180;

export const DECK = Object.freeze({
  /** Arresting wires 1–4 (z, m). */
  wires: Object.freeze([48, 60, 72, 84]) as readonly number[],
  /** Where the glide path meets the deck: between wires 2 and 3. */
  target: 66,
  /** The deck pitches about this point (z, m). */
  pivot: 120,
  /** Landing area half width and length (m). */
  lane: 11,
  length: 210,
  /** The lens stands left of the landing area, abeam the target. */
  lensX: -20,
  /** The angled deck drifts right (m/s) because the ship steams along its own axis, 9° off. */
  drift: 1,
  angle: 9,
  /** The pilot's eye relative to the hook (m). */
  eyeY: 4.2,
  eyeZ: 10,
  /** Flight deck height above the sea (m). */
  freeboard: 19,
});

/** Sea state per pass: deck pitch (°) and heave (m) amplitudes, gust and burble amplitude (m/s). */
export interface PassSea {
  pitch: number;
  heave: number;
  gust: number;
  burble: number;
}

export const PASS_SEA: readonly PassSea[] = Object.freeze([
  { pitch: 0.3, heave: 0.2, gust: 0.35, burble: 0.3 },
  { pitch: 0.6, heave: 0.4, gust: 0.55, burble: 0.45 },
  { pitch: 0.9, heave: 0.6, gust: 0.75, burble: 0.6 },
]);

/** The burble: the ship's air wake sinks the jet between these distances before the ramp (m). */
export const BURBLE = Object.freeze({ from: 450, to: 60 });

interface Wave {
  a: number;
  w: number;
  ph: number;
}

export interface SeaState {
  /** Pitch amplitude (rad), angular frequency and phase. */
  pitchAmp: number;
  pitchW: number;
  pitchPh: number;
  heaveAmp: number;
  heaveW: number;
  heavePh: number;
  gustX: readonly Wave[];
  gustY: readonly Wave[];
  /** Peak sink in the burble (m/s). */
  burble: number;
}

/** The sea for one pass; `motion` scales everything (0 = flat calm, used by the reference pilots). */
export function createSea(seed: number, pass: number, motion = 1): SeaState {
  const rng = createRng(seed * 4099 + pass * 131 + 7);
  const p = PASS_SEA[Math.min(Math.max(0, pass), PASS_SEA.length - 1)] ?? { pitch: 0, heave: 0, gust: 0, burble: 0 };
  const wave = (a: number, period: number): Wave => ({ a: a * motion, w: TAU / (period * rng.range(0.85, 1.15)), ph: rng.range(0, TAU) });
  return {
    pitchAmp: p.pitch * RAD * motion,
    pitchW: TAU / rng.range(8.5, 10),
    pitchPh: rng.range(0, TAU),
    heaveAmp: p.heave * motion,
    heaveW: TAU / rng.range(10, 12.5),
    heavePh: rng.range(0, TAU),
    gustX: [wave(0.65 * p.gust, 5.3), wave(0.35 * p.gust, 2.4)],
    gustY: [wave(0.65 * p.gust, 4.1), wave(0.35 * p.gust, 1.9)],
    burble: p.burble * motion,
  };
}

/** Deck pitch (rad, bow up = +). */
export const deckPitch = (sea: SeaState, t: number): number => sea.pitchAmp * Math.sin(sea.pitchW * t + sea.pitchPh);
export const deckHeave = (sea: SeaState, t: number): number => sea.heaveAmp * Math.sin(sea.heaveW * t + sea.heavePh);

/** Height of the deck surface at z (m). */
export const deckY = (sea: SeaState, z: number, t: number): number => deckHeave(sea, t) + (z - DECK.pivot) * Math.sin(deckPitch(sea, t));

const sum = (waves: readonly Wave[], t: number): number => waves.reduce((acc, w) => acc + w.a * Math.sin(w.w * t + w.ph), 0);

/** Smooth gusts on the jet's lateral and vertical velocity (m/s). */
export const gustAt = (sea: SeaState, t: number): { x: number; y: number } => ({ x: sum(sea.gustX, t), y: sum(sea.gustY, t) });

/** Vertical air in the burble at z (m/s, sink = −): a smooth dip between BURBLE.from and BURBLE.to before the ramp. */
export function burbleAt(sea: SeaState, z: number): number {
  const u = (-z - BURBLE.to) / (BURBLE.from - BURBLE.to);
  return u <= 0 || u >= 1 ? 0 : -sea.burble * Math.sin(Math.PI * u) ** 2;
}

/** Gusts plus the burble where the jet is. */
export function airAt(sea: SeaState, t: number, z: number): { x: number; y: number } {
  const g = gustAt(sea, t);
  return { x: g.x, y: g.y + burbleAt(sea, z) };
}

/** How a pass starts: ball (balls), line-up (m), speed error (m/s), flight-path offset (°). */
export interface PassStart {
  ball: number;
  x: number;
  dv: number;
  gammaOff: number;
}

export function passStart(seed: number, pass: number): PassStart {
  const rng = createRng(seed * 7717 + pass * 389 + 3);
  const sign = (): number => (rng.chance(0.5) ? 1 : -1);
  return {
    ball: sign() * rng.range(1, 2.2),
    x: sign() * rng.range(6, 18),
    dv: sign() * rng.range(0.5, 2.5),
    gammaOff: rng.range(-0.3, 0.3),
  };
}
