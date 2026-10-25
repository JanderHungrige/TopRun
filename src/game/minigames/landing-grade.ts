// Carrier Landing grades (doc 18): Paddles watches the approach in three segments (in the middle, in close,
// at the ramp), grades the pass from how far it strayed and which wire caught it, and names the main fault.
// Deviations are normalised: glide slope in 0.6-ball steps, line-up against a tolerance that tightens towards
// the ramp, speed in 5 kt steps. Pure.

export type Segment = 'middle' | 'close' | 'ramp';
export const SEGMENTS: readonly Segment[] = Object.freeze(['middle', 'close', 'ramp']);

export type Grade = 'ok' | 'fair' | 'noGrade' | 'bolter' | 'waveoff';
export const POINTS: Readonly<Record<Grade, number>> = Object.freeze({ ok: 4, fair: 3, noGrade: 2, bolter: 1, waveoff: 0 });

export const GRADE = Object.freeze({
  /** Segment starts (m before the ramp). */
  from: 1100,
  closeAt: 500,
  rampAt: 150,
  /** Glide-slope error worth one unit (balls). */
  gsBall: 0.6,
  /** Line-up tolerance (m) = luBase + luSlope × distance before the ramp. */
  luBase: 1.2,
  luSlope: 0.0048,
  /** Speed error worth one unit (kt). */
  spdKt: 5,
  /** Quality limits for OK and Fair. */
  okQ: 1,
  fairQ: 1.8,
  /** Faults below this are not worth a comment; up to `little` they are "a little". */
  noteMin: 0.7,
  little: 1.6,
});

/** Time-weighted sums of the normalised deviations (signed and absolute) in one segment. */
export interface SegStats {
  t: number;
  gs: number;
  lu: number;
  spd: number;
  absGs: number;
  absLu: number;
  absSpd: number;
}

export type PassStats = Readonly<Record<Segment, SegStats>>;

const ZERO: SegStats = Object.freeze({ t: 0, gs: 0, lu: 0, spd: 0, absGs: 0, absLu: 0, absSpd: 0 });
export const NO_STATS: PassStats = Object.freeze({ middle: ZERO, close: ZERO, ramp: ZERO });

export type FaultCat = 'high' | 'low' | 'left' | 'right' | 'fast' | 'slow';

export interface FaultNote {
  cat: FaultCat;
  little: boolean;
  where: Segment;
}

/** Which segment z (m, landing frame) is in; null before the graded part of the approach. */
export function segmentAt(z: number): Segment | null {
  if (z < -GRADE.from) return null;
  if (z < -GRADE.closeAt) return 'middle';
  if (z < -GRADE.rampAt) return 'close';
  return 'ramp';
}

/** Line-up tolerance at z (m). */
export const luTol = (z: number): number => GRADE.luBase + GRADE.luSlope * Math.max(0, -z);

/** Adds one tick: ball (balls), x (m right of the centreline), speed error (kt). */
export function addSample(stats: PassStats, z: number, ball: number, x: number, dvKt: number, dt: number): PassStats {
  const seg = segmentAt(z);
  if (!seg) return stats;
  const gs = ball / GRADE.gsBall;
  const lu = x / luTol(z);
  const spd = dvKt / GRADE.spdKt;
  const s = stats[seg];
  const next: SegStats = {
    t: s.t + dt,
    gs: s.gs + gs * dt,
    lu: s.lu + lu * dt,
    spd: s.spd + spd * dt,
    absGs: s.absGs + Math.abs(gs) * dt,
    absLu: s.absLu + Math.abs(lu) * dt,
    absSpd: s.absSpd + Math.abs(spd) * dt,
  };
  return { ...stats, [seg]: next };
}

/** The largest of the three mean |deviations| over the whole graded approach (0 = perfect). */
export function quality(stats: PassStats): number {
  const all = SEGMENTS.map((k) => stats[k]);
  const t = all.reduce((a, s) => a + s.t, 0);
  if (t <= 0) return 0;
  const mean = (f: (s: SegStats) => number): number => all.reduce((a, s) => a + f(s), 0) / t;
  return Math.max(mean((s) => s.absGs), mean((s) => s.absLu), mean((s) => s.absSpd));
}

export function gradeTrap(q: number, wire: number): Grade {
  if (q <= GRADE.okQ && wire === 3) return 'ok';
  if (wire >= 2 && wire <= 4 && q <= GRADE.fairQ) return 'fair';
  return 'noGrade';
}

const CATS: readonly { key: 'gs' | 'lu' | 'spd'; plus: FaultCat; minus: FaultCat }[] = [
  { key: 'gs', plus: 'high', minus: 'low' },
  { key: 'lu', plus: 'right', minus: 'left' },
  { key: 'spd', plus: 'fast', minus: 'slow' },
];

/** The worst signed segment mean, or null when every one is small. */
export function mainFault(stats: PassStats): FaultNote | null {
  let best: { v: number; cat: FaultCat; where: Segment } | null = null;
  for (const where of SEGMENTS) {
    const s = stats[where];
    if (s.t <= 0) continue;
    for (const c of CATS) {
      const v = s[c.key] / s.t;
      if (!best || Math.abs(v) > Math.abs(best.v)) best = { v, cat: v >= 0 ? c.plus : c.minus, where };
    }
  }
  if (!best || Math.abs(best.v) < GRADE.noteMin) return null;
  return { cat: best.cat, little: Math.abs(best.v) <= GRADE.little, where: best.where };
}
