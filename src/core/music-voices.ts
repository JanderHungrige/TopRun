import { shaperNode } from './audio-nodes';
import type { Wave } from './audio-nodes';
import { crash, gong, hat, kick, ohat, snare, swell, tom } from './music-drums';
import type { Inst, NoteEvent } from './music-patterns';
import { env, filter, hz, osc, send, sweep } from './music-synth';
import type { Synth, Voice } from './music-synth';

/** Drive of the guitar amp's tanh stage. */
const AMP_DRIVE = 7;

const bass: Voice = (s, t, e) => {
  const len = Math.max(0.06, e.d * s.step * 0.88);
  const end = t + len + 0.1;
  const g = env(s, s.out, t, 0.11 * e.v, 0.004, len, 0.07);
  const f = filter(s, 'lowpass', 1500, 2.5, g);
  sweep(f.frequency, 1500 * s.bright, 300, t, 0.22);
  const freq = hz(e.m[0] ?? 40);
  osc(s, 'sawtooth', freq, t, end, f, -5);
  osc(s, 'square', freq, t, end, f, 5);
};

/** Low synth drone: root, fifth and octave saws under a slowly breathing low-pass. */
const drone: Voice = (s, t, e) => {
  const len = e.d * s.step;
  const attack = Math.min(1.6, len * 0.4);
  const end = t + len + 2;
  const g = env(s, s.out, t, 0.06 * e.v, attack, Math.max(0, len - attack), 1.8);
  send(s, g, s.verb, 0.3);
  const f = filter(s, 'lowpass', 420, 3, g);
  const lfo = s.ctx.createGain();
  lfo.gain.value = 160;
  lfo.connect(f.frequency);
  osc(s, 'sine', 0.13, t, end, lfo);
  const root = hz(e.m[0] ?? 38);
  for (const [ratio, cents] of [[1, -7], [1, 7], [1.5, 0], [2, 3]] as const) osc(s, 'sawtooth', root * ratio, t, end, f, cents);
};

/** Detuned saw pair per chord tone with a small upward "brass scoop". */
function brassTones(s: Synth, e: NoteEvent, t: number, end: number, dest: AudioNode, spread: number): void {
  for (const m of e.m) for (const c of [-spread, spread]) {
    const o = osc(s, 'sawtooth', hz(m), t, end, dest, c);
    o.detune.setValueAtTime(c - 30, t);
    o.detune.linearRampToValueAtTime(c, t + 0.1);
  }
}

/** Sustained synth-brass pad: filter opens with the attack, then settles; softer notes swell slower. */
const brass: Voice = (s, t, e) => {
  const len = e.d * s.step;
  const attack = 0.07 + Math.max(0, 1 - e.v) * 0.3;
  const g = env(s, s.out, t, 0.028 * e.v, attack, Math.max(0, len - attack), 0.5);
  send(s, g, s.verb, 0.4);
  const f = filter(s, 'lowpass', 400, 1.2, g);
  const peak = 2800 * s.bright * (0.6 + 0.4 * Math.min(1.3, e.v));
  f.frequency.setValueAtTime(350, t);
  f.frequency.linearRampToValueAtTime(peak, t + attack + 0.04);
  f.frequency.setTargetAtTime(peak * 0.5, t + attack + 0.04, 0.4);
  brassTones(s, e, t, t + len + 0.6, f, 10);
};

/** Short, bright brass hit with an echo tail. */
const stab: Voice = (s, t, e) => {
  const len = Math.min(e.d * s.step, 0.14);
  const g = env(s, s.out, t, 0.06 * e.v, 0.003, len * 0.4, 0.16);
  send(s, g, s.echo, 0.35);
  send(s, g, s.verb, 0.2);
  const f = filter(s, 'lowpass', 3000, 2, g);
  sweep(f.frequency, 4200 * s.bright, 700, t, 0.18);
  brassTones(s, e, t, t + len + 0.3, f, 8);
};

/** tanh amp → presence bump → two-pole cabinet roll-off → `dest`; returns the amp input. */
function amp(s: Synth, dest: AudioNode, cabinet: number, oversample: OverSampleType = '2x'): AudioNode {
  const cab = filter(s, 'lowpass', cabinet, 0.7, filter(s, 'lowpass', cabinet, 0.7, dest));
  const presence = filter(s, 'peaking', 1600, 0.8, cab);
  presence.gain.value = 4;
  return shaperNode(s.ctx, AMP_DRIVE, presence, oversample);
}

/** A saw per note of `e` and detune offset (cents) into `dest`. */
function strings(s: Synth, e: NoteEvent, t: number, end: number, dest: AudioNode, detune: readonly number[]): void {
  for (const m of e.m) for (const c of detune) osc(s, 'sawtooth', hz(m), t, end, dest, c);
}

/** Open, ringing distorted power chord. */
const power: Voice = (s, t, e) => {
  const len = e.d * s.step;
  const post = env(s, s.out, t, 0.085 * e.v, 0.003, len, 0.25);
  const pre = env(s, amp(s, post, 3400 * s.bright), t, 0.3, 0.002, len, 0.3);
  strings(s, e, t, t + len + 0.35, filter(s, 'highpass', 90, 0.7, filter(s, 'lowpass', 5000, 0.7, pre)), [-5, 5]);
};

/** Palm-muted chug: the string tone is choked down before it hits the amp. */
const chug: Voice = (s, t, e) => {
  const post = env(s, s.out, t, 0.11 * e.v, 0.002, 0.03, 0.07);
  const pre = env(s, amp(s, post, 3000 * s.bright), t, 0.55, 0.002, 0.02, 0.09);
  const tone = filter(s, 'lowpass', 1400, 0.9, pre);
  sweep(tone.frequency, 1400, 380, t, 0.08);
  strings(s, e, t, t + 0.18, tone, [0]);
};

/** Slow vibrato (in cents) that blooms only on held notes; null for short ones. */
function vibrato(s: Synth, t: number, end: number, len: number): GainNode | null {
  if (len < 0.35) return null;
  const depth = s.ctx.createGain();
  depth.gain.setValueAtTime(0, t);
  depth.gain.setValueAtTime(0, t + 0.25);
  depth.gain.linearRampToValueAtTime(24, t + Math.min(len, 0.9));
  osc(s, 'sine', 5.2, t, end, depth);
  return depth;
}

const LEAD_OSCS: readonly (readonly [Wave, number])[] = [['sawtooth', -4], ['sawtooth', 5], ['square', 0]];

/** Soaring overdriven lead guitar with bends/glides, vibrato, echo and reverb. */
const lead: Voice = (s, t, e) => {
  const len = e.d * s.step;
  const end = t + len + 0.3;
  const target = hz(e.m[0] ?? 69);
  const post = env(s, s.out, t, 0.07 * e.v, 0.008, Math.max(0, len - 0.02), 0.18);
  send(s, post, s.echo, 0.3);
  send(s, post, s.verb, 0.35);
  const pre = env(s, amp(s, post, 4200 * s.bright, '4x'), t, 0.12 + 0.2 * e.v, 0.005, len, 0.22);
  const input = filter(s, 'highpass', 200, 0.7, pre);
  const vib = vibrato(s, t, end, len);
  for (const [type, cents] of LEAD_OSCS) {
    const o = osc(s, type, target, t, end, input, cents);
    if (e.bend) sweep(o.frequency, hz(e.bend.from), target, t, e.bend.time);
    vib?.connect(o.detune);
  }
};

/** Sequenced square pluck with echo. */
const arp: Voice = (s, t, e) => {
  const len = Math.max(0.08, e.d * s.step * 0.9);
  const g = env(s, s.out, t, 0.07 * e.v, 0.002, 0, len);
  send(s, g, s.echo, 0.3);
  osc(s, 'square', hz(e.m[0] ?? 64), t, t + len + 0.02, filter(s, 'lowpass', 3000 * s.bright, 1, g));
};

export const VOICES: Record<Inst, Voice> = {
  kick, snare, hat, ohat, crash, tom, gong, swell, bass, drone, brass, stab, power, chug, arp, lead,
};
