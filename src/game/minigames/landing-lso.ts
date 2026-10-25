import { aoaOf, type LandingState } from './landing';
import { luTol } from './landing-grade';

// Carrier Landing (doc 18): which call Paddles (the LSO) makes this tick while he talks a pass down — one call
// at most every `gap` s, the same call at most every `repeat` s, the most urgent first. Event calls (wave-off,
// bolter) are made by the scene from the state's events. Pure.

const RAD = Math.PI / 180;

export type LsoCall = 'rogerBall' | 'power' | 'high' | 'right' | 'left' | 'fast' | 'easy' | 'nice';

export const LSO = Object.freeze({
  /** Calls start this far before the ramp (m) and stop at the ramp. */
  from: 1400,
  gap: 1.6,
  repeat: 3.5,
  lowBall: -1,
  highBall: 1.2,
  /** Line-up call at this share of the grading tolerance. */
  lineup: 0.8,
  /** "Easy with it": flight-path rate (°/s) while the ball is within `easyBall`. */
  easyRate: 1,
  easyBall: 1.5,
  /** "Looking good" once per pass after this long steady (s): ball and line-up share. */
  steadyFor: 4,
  steadyBall: 0.6,
  steadyLineup: 0.5,
});

export interface LsoMemo {
  pass: number;
  /** passT of the last call, and of the last time each call was made. */
  quiet: number;
  last: Readonly<Partial<Record<LsoCall, number>>>;
  calledBall: boolean;
  saidNice: boolean;
  steady: number;
}

export const NEW_LSO: LsoMemo = Object.freeze({ pass: -1, quiet: -Infinity, last: {}, calledBall: false, saidNice: false, steady: 0 });

function steadyNow(s: LandingState): boolean {
  const j = s.jet;
  return Math.abs(s.ball) < LSO.steadyBall && Math.abs(j.x) < luTol(j.z) * LSO.steadyLineup && aoaOf(j.dv) === 'onSpeed';
}

/** The calls the approach deserves right now, most urgent first. */
function wanted(m: LsoMemo, s: LandingState): LsoCall[] {
  const j = s.jet;
  const aoa = aoaOf(j.dv);
  const out: LsoCall[] = [];
  if (s.ball < LSO.lowBall || aoa === 'slow') out.push('power');
  if (s.ball > LSO.highBall) out.push('high');
  const tol = luTol(j.z) * LSO.lineup;
  if (j.x < -tol) out.push('right');
  else if (j.x > tol) out.push('left');
  if (aoa === 'fast') out.push('fast');
  if (Math.abs(j.q) >= LSO.easyRate * RAD && Math.abs(s.ball) < LSO.easyBall) out.push('easy');
  if (!m.saidNice && m.steady >= LSO.steadyFor) out.push('nice');
  return out;
}

function pick(m: LsoMemo, s: LandingState): LsoCall | null {
  if (s.passT - m.quiet < LSO.gap) return null;
  if (!m.calledBall) return 'rogerBall';
  return wanted(m, s).find((c) => s.passT - (m.last[c] ?? -Infinity) >= LSO.repeat) ?? null;
}

export function lsoStep(memo: LsoMemo, s: LandingState, dt: number): { memo: LsoMemo; call: LsoCall | null } {
  const m = memo.pass === s.pass ? memo : { ...NEW_LSO, pass: s.pass };
  if (s.phase !== 'approach' || s.jet.z < -LSO.from || s.jet.z >= 0) return { memo: m, call: null };
  const base = { ...m, steady: steadyNow(s) ? m.steady + dt : 0 };
  const call = pick(base, s);
  if (!call) return { memo: base, call: null };
  return {
    memo: {
      ...base, quiet: s.passT, last: { ...base.last, [call]: s.passT },
      calledBall: base.calledBall || call === 'rogerBall', saidNice: base.saidNice || call === 'nice',
    },
    call,
  };
}
