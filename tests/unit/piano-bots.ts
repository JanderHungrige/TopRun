import { createRng, type Rng } from '../../src/core/rng';
import type { Chart } from '../../src/game/minigames/piano-chart';
import { createPiano, PIANO_RULES as R, stepPiano, type Lanes, type PianoState } from '../../src/game/minigames/piano';

// Piano Bar balance (doc 23): simulated players press each note with a Gaussian timing error, sometimes not at
// all (more often in fast passages), on the fixed 1/60 s tick like the real input.

const DT = 1 / 60;

export interface Player {
  /** Timing error, s (standard deviation). */
  sigma: number;
  /** Chance to miss a note outright. */
  lapse: number;
  /** Extra chance to miss a note that comes less than 0.14 s after the previous one. */
  rush: number;
}

export const PLAYERS = {
  perfect: { sigma: 0, lapse: 0, rush: 0 },
  expert: { sigma: 0.022, lapse: 0.002, rush: 0.01 },
  skilled: { sigma: 0.035, lapse: 0.008, rush: 0.04 },
  average: { sigma: 0.05, lapse: 0.025, rush: 0.1 },
  novice: { sigma: 0.075, lapse: 0.07, rush: 0.25 },
} as const satisfies Record<string, Player>;

const gauss = (rng: Rng): number => Math.sqrt(-2 * Math.log(1 - rng.next())) * Math.cos(2 * Math.PI * rng.next());
const tickOf = (t: number): number => Math.round((t + R.leadIn) / DT);

type Plan = Map<number, Set<number>>;

function add(plan: Plan, tick: number, lane: number): void {
  const set = plan.get(tick) ?? new Set<number>();
  set.add(lane);
  plan.set(tick, set);
}

/** Tick → lanes pressed, for a player with timing error; `lanes` picks the lane (the right one by default). */
function planFor(chart: Chart, p: Player, rng: Rng, lanes: (lane: number) => number = (l) => l): Plan {
  const plan: Plan = new Map();
  let prev = -9;
  for (const n of chart.notes) {
    const fast = n.t - prev < 0.14 && n.t > prev;
    if (n.t > prev) prev = n.t;
    if (rng.chance(p.lapse + (fast ? p.rush : 0))) continue;
    add(plan, tickOf(n.t + gauss(rng) * p.sigma), lanes(n.lane));
  }
  return plan;
}

function run(chart: Chart, plan: (tick: number) => Lanes): PianoState {
  let s = createPiano(chart);
  for (let k = 1; !s.over; k++) s = stepPiano(chart, s, plan(k), DT);
  return s;
}

const fromPlan = (plan: Plan) => (k: number): Lanes => {
  const set = plan.get(k);
  return [set?.has(0) ?? false, set?.has(1) ?? false, set?.has(2) ?? false, set?.has(3) ?? false];
};

export function playRound(chart: Chart, p: Player, seed: number): PianoState {
  return run(chart, fromPlan(planFor(chart, p, createRng(seed))));
}

/** Presses on the beat of every note, but on a random lane. */
export function guesser(chart: Chart, seed: number): PianoState {
  const rng = createRng(seed);
  return run(chart, fromPlan(planFor(chart, PLAYERS.skilled, rng, () => rng.int(0, 3))));
}

/** Hammers all four keys every `every` ticks. */
export function masher(chart: Chart, every: number): PianoState {
  return run(chart, (k) => {
    const on = k % every === 0;
    return [on, on, on, on];
  });
}
