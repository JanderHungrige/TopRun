import { panTo, SILENT } from './audio-nodes';
import { env, filter, hz, noise, osc, send, sweep } from './music-synth';
import type { Synth, Voice } from './music-synth';

/** Big '80s kick: pitch-dropping sine body plus a beater click. */
export const kick: Voice = (s, t, e) => {
  const body = env(s, s.out, t, 0.6 * e.v, 0.002, 0.04, 0.34);
  sweep(osc(s, 'sine', 170, t, t + 0.45, body).frequency, 170, 46, t, 0.11);
  noise(s, t, t + 0.03, filter(s, 'bandpass', 3200, 0.8, env(s, s.out, t, 0.26 * e.v, 0.001, 0, 0.016)));
};

/** One side of the gated "room": dense noise held almost flat, then slammed shut. */
function gatedTail(s: Synth, t: number, v: number, len: number, side: number): void {
  const gate = s.ctx.createGain();
  gate.gain.setValueAtTime(0, t);
  gate.gain.linearRampToValueAtTime(v * 0.6, t + 0.006);
  gate.gain.linearRampToValueAtTime(v * 0.4, t + len);
  gate.gain.linearRampToValueAtTime(0, t + len + 0.014);
  gate.connect(panTo(s.ctx, s.out, side));
  const tone = filter(s, 'lowpass', 6500, 0.5, gate);
  noise(s, t, t + len + 0.03, filter(s, 'bandpass', 1300, 0.4, tone), side < 0 ? 0.93 : 1.07);
}

/** Gated-reverb snare: stick crack, drum body and a wide, abruptly cut noise tail. Ghosts stay dry. */
export const snare: Voice = (s, t, e) => {
  const v = 0.3 * e.v;
  noise(s, t, t + 0.06, filter(s, 'highpass', 2000, 0.7, env(s, s.out, t, v, 0.001, 0.004, 0.045)));
  const body = env(s, s.out, t, 0.8 * v, 0.001, 0.01, 0.1);
  sweep(osc(s, 'triangle', 220, t, t + 0.15, body).frequency, 220, 170, t, 0.06);
  sweep(osc(s, 'sine', 340, t, t + 0.12, body).frequency, 340, 290, t, 0.05);
  const len = e.v < 0.5 ? 0.05 : s.gate;
  for (const side of [-0.7, 0.7]) gatedTail(s, t, v, len, side);
};

const hatVoice = (cutoff: number, decay: number, vol: number): Voice => (s, t, e) =>
  noise(s, t, t + decay + 0.02, filter(s, 'highpass', cutoff, 0.8, env(s, s.out, t, vol * e.v, 0.001, 0, decay)));
export const hat = hatVoice(7500, 0.03, 0.1);
export const ohat = hatVoice(6500, 0.18, 0.075);

export const crash: Voice = (s, t, e) => {
  const g = env(s, s.out, t, 0.1 * e.v, 0.002, 0.02, 1.6);
  send(s, g, s.verb, 0.4);
  noise(s, t, t + 1.7, filter(s, 'highpass', 4200, 0.6, g));
  noise(s, t, t + 1.2, filter(s, 'bandpass', 8500, 2, env(s, s.out, t, 0.035 * e.v, 0.004, 0, 1.1)), 1.3);
};

/** Electronic tom: sine sweeping down onto its pitch, with a stick transient. */
export const tom: Voice = (s, t, e) => {
  const f = hz(e.m[0] ?? 50);
  const body = env(s, s.out, t, 0.24 * e.v, 0.002, 0.03, 0.3);
  send(s, body, s.verb, 0.25);
  sweep(osc(s, 'sine', f * 1.5, t, t + 0.4, body).frequency, f * 1.5, f, t, 0.15);
  sweep(osc(s, 'triangle', f * 1.5, t, t + 0.2, env(s, s.out, t, 0.07 * e.v, 0.001, 0, 0.1)).frequency, f * 1.5, f, t, 0.1);
  noise(s, t, t + 0.06, filter(s, 'bandpass', f * 6, 1, env(s, s.out, t, 0.09 * e.v, 0.001, 0, 0.05)));
};

/** Partial ratio, level, decay (s) of a slightly inharmonic tam-tam whose upper partials bloom late. */
const GONG: readonly (readonly [number, number, number])[] = [
  [1, 0.5, 4.5], [1.52, 0.34, 3.6], [2.01, 0.24, 3.2], [2.46, 0.2, 2.6], [3.13, 0.13, 2.1], [3.94, 0.08, 1.6],
  [5.07, 0.05, 1.2],
];

export const gong: Voice = (s, t, e) => {
  const out = s.ctx.createGain();
  out.gain.value = 0.24 * e.v;
  out.connect(s.out);
  send(s, out, s.verb, 0.6);
  GONG.forEach(([ratio, level, decay], i) => {
    const f = 64 * ratio;
    const o = osc(s, 'sine', f, t, t + decay + 0.2, env(s, out, t, level, 0.01 + i * 0.04, 0, decay));
    o.frequency.linearRampToValueAtTime(f * 0.985, t + decay); // tam-tams sag in pitch as they ring
  });
  noise(s, t, t + 3, filter(s, 'lowpass', 1800, 0.5, env(s, out, t, 0.25, 0.04, 0.1, 2.4)));
};

/** Suspended-cymbal roll swelling over the note length, cut just as the next downbeat lands. */
export const swell: Voice = (s, t, e) => {
  const len = Math.max(0.5, e.d * s.step);
  const g = s.ctx.createGain();
  g.gain.setValueAtTime(0.002, t);
  g.gain.exponentialRampToValueAtTime(0.16 * e.v, t + len);
  g.gain.linearRampToValueAtTime(SILENT, t + len + 0.06);
  g.connect(s.out);
  send(s, g, s.verb, 0.5);
  const bp = filter(s, 'bandpass', 2500, 0.7, g);
  sweep(bp.frequency, 2500, 7500, t, len);
  noise(s, t, t + len + 0.1, filter(s, 'highpass', 1200, 0.5, bp));
};
