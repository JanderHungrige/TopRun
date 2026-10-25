import { gainNode, SILENT } from './audio-nodes';
import type { Wave } from './audio-nodes';
import type { NoteEvent } from './music-patterns';

/** Everything an instrument needs to schedule one note on the current deck. */
export interface Synth {
  ctx: AudioContext;
  out: AudioNode; // deck output (dry)
  echo: AudioNode; // dotted-8th delay send
  verb: AudioNode; // reverb send
  noise: AudioBuffer;
  step: number; // seconds per 16th
  bright: number; // filter cutoff scale for the song
  gate: number; // gated-snare tail length, s
}
export type Voice = (s: Synth, t: number, e: NoteEvent) => void;

export const hz = (m: number): number => 440 * 2 ** ((m - 69) / 12);

/** Gain stage into `dest`: linear attack, hold, exponential release. */
export function env(
  s: Synth, dest: AudioNode, t: number, peak: number, attack: number, hold: number, release: number,
): GainNode {
  const g = s.ctx.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(peak, t + attack);
  g.gain.setValueAtTime(peak, t + attack + hold);
  g.gain.exponentialRampToValueAtTime(SILENT, t + attack + hold + release);
  g.connect(dest);
  return g;
}

export function osc(
  s: Synth, type: Wave, freq: number, t: number, end: number, dest: AudioNode, cents = 0,
): OscillatorNode {
  const o = s.ctx.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  o.detune.value = cents;
  o.connect(dest);
  o.start(t);
  o.stop(end);
  return o;
}

export function noise(s: Synth, t: number, end: number, dest: AudioNode, rate = 1): void {
  const b = s.ctx.createBufferSource();
  b.buffer = s.noise;
  b.loop = true;
  b.playbackRate.value = rate;
  b.connect(dest);
  b.start(t, Math.random() * 0.5);
  b.stop(end);
}

export function filter(s: Synth, type: BiquadFilterType, freq: number, q: number, dest: AudioNode): BiquadFilterNode {
  const f = s.ctx.createBiquadFilter();
  f.type = type;
  f.frequency.value = freq;
  f.Q.value = q;
  f.connect(dest);
  return f;
}

/** Exponential sweep of `p` from → to, starting exactly at `t`. */
export function sweep(p: AudioParam, from: number, to: number, t: number, dur: number): void {
  p.setValueAtTime(from, t);
  p.exponentialRampToValueAtTime(to, t + dur);
}

/** Taps `src` into an effect bus at `amount`. */
export function send(s: Synth, src: AudioNode, bus: AudioNode, amount: number): void {
  src.connect(gainNode(s.ctx, amount)).connect(bus);
}
