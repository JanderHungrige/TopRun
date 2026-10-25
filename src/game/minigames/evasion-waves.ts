import type { Vec } from '../../core/math';
import type { MissileKind } from './evasion-missiles';

// Missile Evasion (doc 16): seeded wave plans — how many missiles, from which screen sides, which
// kinds, how far apart, how much faster per wave — and where on the screen edge they launch. Pure.

export type Side = 'N' | 'E' | 'S' | 'W';
export const SIDES: readonly Side[] = Object.freeze(['N', 'E', 'S', 'W'] as const);

export const WAVES = Object.freeze({
  /** First wave start, s. */
  first: 0.5,
  /** Pause after a wave is resolved, s. */
  gap: 1.5,
  /** Launch warning lead, s. */
  warn: 0.9,
  maxCount: 6,
  /** Wave k: 1 + ceil(k / countEvery) missiles from ceil(k / sideEvery) sides, spacing0 − spacingStep·k s apart. */
  countEvery: 2,
  sideEvery: 2,
  spacing0: 1.6,
  spacingStep: 0.1,
  spacingMin: 0.8,
  /** Per wave the missiles get this much faster / turn this much harder, up to the max. */
  speedStep: 0.05,
  speedMax: 1.4,
  turnStep: 0.04,
  turnMax: 1.35,
  /** Launch offsets from the jet: north / south edge y, east / west edge x, and the spread along the edge. */
  edgeY: 620,
  edgeX: 760,
  spreadX: 520,
  spreadY: 300,
});

/** A launch announced at `at − WAVES.warn` and fired at `at`, `offset` px from the jet. */
export interface PendingLaunch {
  at: number;
  kind: MissileKind;
  side: Side;
  offset: Vec;
  wave: number;
  warned: boolean;
}

/** One step of a mulberry32 generator: [value in 0 … 1, next seed]. */
export function rand(seed: number): [number, number] {
  const s = (seed + 0x6d2b79f5) >>> 0;
  let t = s;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return [((t ^ (t >>> 14)) >>> 0) / 4294967296, s];
}

export const waveCount = (k: number): number => Math.min(WAVES.maxCount, 1 + Math.ceil(k / WAVES.countEvery));
export const waveSideCount = (k: number): number => Math.min(4, Math.ceil(k / WAVES.sideEvery));
export const aamShare = (k: number): number => Math.min(0.6, 0.15 * (k - 1));
export const waveSpacing = (k: number): number => Math.max(WAVES.spacingMin, WAVES.spacing0 - WAVES.spacingStep * k);
export const waveMul = (k: number): { speed: number; turn: number } => ({
  speed: Math.min(WAVES.speedMax, 1 + WAVES.speedStep * (k - 1)),
  turn: Math.min(WAVES.turnMax, 1 + WAVES.turnStep * (k - 1)),
});

/** Launch point relative to the jet on a screen side; u in −1 … 1 along the edge. */
export function launchOffset(side: Side, u: number): Vec {
  switch (side) {
    case 'N': return { x: WAVES.spreadX * u, y: -WAVES.edgeY };
    case 'S': return { x: WAVES.spreadX * u, y: WAVES.edgeY };
    case 'E': return { x: WAVES.edgeX, y: WAVES.spreadY * u };
    case 'W': return { x: -WAVES.edgeX, y: WAVES.spreadY * u };
    default: throw new Error(`unhandled: ${side satisfies never}`);
  }
}

/** The sides of wave k, in a seeded order. */
function pickSides(k: number, seed: number): { sides: Side[]; seed: number } {
  const sides = [...SIDES];
  let s = seed;
  for (let i = sides.length - 1; i > 0; i--) {
    const [r, next] = rand(s);
    s = next;
    const j = Math.floor(r * (i + 1));
    [sides[i], sides[j]] = [sides[j] ?? 'N', sides[i] ?? 'N'];
  }
  return { sides: sides.slice(0, waveSideCount(k)), seed: s };
}

/** Wave k starting at `start`: its launches (the first one announced at once) and the next seed. */
export function planWave(k: number, start: number, seed: number): { launches: PendingLaunch[]; seed: number } {
  const picked = pickSides(k, seed);
  let s = picked.seed;
  const launches: PendingLaunch[] = [];
  for (let i = 0; i < waveCount(k); i++) {
    const [u, s1] = rand(s);
    const [r, s2] = rand(s1);
    s = s2;
    const side = picked.sides[i % picked.sides.length] ?? 'N';
    const kind: MissileKind = r < aamShare(k) ? 'aam' : 'sam';
    launches.push({ at: start + WAVES.warn + i * waveSpacing(k), kind, side, offset: launchOffset(side, u * 2 - 1), wave: k, warned: false });
  }
  return { launches, seed: s };
}
