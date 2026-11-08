import type { Medals } from './core';

// STATION DOCKING (doc 89): fly a shuttle into a space station's docking port with thrusters and nothing to slow it
// but more thrust. Touching the station's face inside the port slower than the limit docks; anything else is a bump
// that ends the try. Three dockings; the port drifts from the second on. Points for a slow, centred, quick, frugal
// docking. Pure; logical px and seconds.

export const DOCK = Object.freeze({
  accel: 46,
  fuel: 100,
  burn: 11,
  /** Faster than this at the port is a crash; slower than `soft` is a perfect touch. */
  limit: 44,
  soft: 16,
  /** How far off the port's centre still docks. */
  tolerance: 22,
  face: 1040,
  start: { x: 200, y: 388 },
  top: 80,
  bottom: 700,
  rounds: 3,
  time: 50,
  pause: 1.6,
});

export const DOCKING_MEDALS: Medals = { bronze: 1000, silver: 1700, gold: 2300 };

export type DockPhase = 'fly' | 'docked' | 'crashed' | 'timeout';

export interface DockState {
  round: number;
  phase: DockPhase;
  /** Seconds into the round, and into the pause after it. */
  t: number;
  pause: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  fuel: number;
  portY: number;
  points: number;
  /** Points of each finished round. */
  results: number[];
  over: boolean;
}

export const createDocking = (): DockState => ({
  round: 0, phase: 'fly', t: 0, pause: 0, x: DOCK.start.x, y: DOCK.start.y, vx: 0, vy: 0, fuel: DOCK.fuel, portY: 388, points: 0, results: [], over: false,
});

/** Where the port is: still on the first docking, drifting up and down more on each later one. */
export const portAt = (round: number, t: number): number => 388 + Math.sin(t * 0.45) * 70 * Math.min(2, round) / 2;

export const speedOf = (s: Pick<DockState, 'vx' | 'vy'>): number => Math.hypot(s.vx, s.vy);

/** Points for a docking: slower, more centred, quicker and with fuel left is better. */
export function dockPoints(speed: number, offset: number, t: number, fuel: number): number {
  const slow = Math.max(0, (DOCK.limit - speed) / DOCK.limit) * 350 + (speed <= DOCK.soft ? 100 : 0);
  return Math.round(350 + slow + Math.max(0, DOCK.tolerance - offset) * 6 + Math.max(0, 30 - t) * 5 + fuel * 2);
}

function nextRound(s: DockState): DockState {
  const round = s.round + 1;
  if (round >= DOCK.rounds) return { ...s, over: true };
  return { ...createDocking(), round, points: s.points, results: s.results };
}

function endRound(s: DockState, phase: DockPhase, points: number): DockState {
  return { ...s, phase, pause: 0, points: s.points + points, results: [...s.results, points], vx: 0, vy: 0 };
}

/** One tick; `thrust` −1…1 per axis (only while there is fuel). */
export function stepDocking(s: DockState, thrust: { x: number; y: number }, dt: number): DockState {
  if (s.over) return s;
  if (s.phase !== 'fly') return s.pause + dt >= DOCK.pause ? nextRound(s) : { ...s, pause: s.pause + dt };
  const burning = s.fuel > 0 && (thrust.x !== 0 || thrust.y !== 0);
  const vx = s.vx + (burning ? thrust.x * DOCK.accel * dt : 0);
  const vy = s.vy + (burning ? thrust.y * DOCK.accel * dt : 0);
  const t = s.t + dt;
  const portY = portAt(s.round, t);
  let y = s.y + vy * dt;
  let vy2 = vy;
  if (y < DOCK.top || y > DOCK.bottom) {
    y = Math.max(DOCK.top, Math.min(DOCK.bottom, y));
    vy2 = 0;
  }
  const x = Math.max(20, s.x + vx * dt);
  const moved: DockState = { ...s, t, x, y, vx: x <= 20 ? 0 : vx, vy: vy2, fuel: Math.max(0, s.fuel - (burning ? DOCK.burn * dt : 0)), portY };
  if (t >= DOCK.time) return endRound(moved, 'timeout', 0);
  if (x < DOCK.face) return moved;
  const offset = Math.abs(y - portY);
  const speed = speedOf(moved);
  if (offset <= DOCK.tolerance && speed < DOCK.limit) return endRound({ ...moved, x: DOCK.face }, 'docked', dockPoints(speed, offset, t, moved.fuel));
  return endRound({ ...moved, x: DOCK.face - 6 }, 'crashed', 0);
}
