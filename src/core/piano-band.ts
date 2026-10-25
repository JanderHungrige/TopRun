import { clamp, rand, SILENT } from './audio-nodes';
import { midiHz } from './piano';

// Piano Bar (doc 23): the 1950s club band behind the piano — a soft brush kit (kick, snare, swung ride,
// crash), a plucked upright bass, crowd hand claps — and the crowd's voices (cheer, groan, applause).
// All synthesized; nothing here decides an outcome.

export interface BandOut {
  ctx: AudioContext;
  dest: AudioNode;
  noise: AudioBuffer;
  verb?: AudioNode;
}

/** Gain into `dest`: attack, then an exponential decay towards silence. */
function env(o: BandOut, dest: AudioNode, t: number, peak: number, attack: number, decay: number): GainNode {
  const g = o.ctx.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(peak, t + attack);
  g.gain.setTargetAtTime(SILENT, t + attack, decay / 3);
  g.connect(dest);
  return g;
}

function filt(o: BandOut, type: BiquadFilterType, f: number, q: number, dest: AudioNode): BiquadFilterNode {
  const b = o.ctx.createBiquadFilter();
  b.type = type;
  b.frequency.value = f;
  b.Q.value = q;
  b.connect(dest);
  return b;
}

function hiss(o: BandOut, t: number, len: number, dest: AudioNode, rate = 1): void {
  const s = o.ctx.createBufferSource();
  s.buffer = o.noise;
  s.loop = true;
  s.playbackRate.value = rate;
  s.connect(dest);
  s.start(t, Math.random() * 0.5);
  s.stop(t + len);
}

function tone(o: BandOut, type: OscillatorType, f: number, t: number, len: number, dest: AudioNode): OscillatorNode {
  const osc = o.ctx.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(f, t);
  osc.connect(dest);
  osc.start(t);
  osc.stop(t + len);
  return osc;
}

function pan(o: BandOut, p: number): AudioNode {
  if (typeof o.ctx.createStereoPanner !== 'function') return o.dest;
  const n = o.ctx.createStereoPanner();
  n.pan.value = clamp(p, -1, 1);
  n.connect(o.dest);
  return n;
}

export function kick(o: BandOut, t: number, v: number): void {
  const body = tone(o, 'sine', 115, t, 0.4, env(o, o.dest, t, 0.42 * v, 0.003, 0.3));
  body.frequency.exponentialRampToValueAtTime(46, t + 0.1);
  hiss(o, t, 0.02, filt(o, 'bandpass', 1500, 1, env(o, o.dest, t, 0.04 * v, 0.001, 0.012)));
}

/** A soft snare (half brush, half stick). */
export function snare(o: BandOut, t: number, v: number): void {
  hiss(o, t, 0.2, filt(o, 'bandpass', 2300, 0.6, env(o, o.dest, t, 0.2 * v, 0.002, 0.13)));
  const body = tone(o, 'triangle', 200, t, 0.1, env(o, o.dest, t, 0.09 * v, 0.001, 0.06));
  body.frequency.exponentialRampToValueAtTime(165, t + 0.06);
}

const RIDE = [1, 1.4471, 1.617, 1.9265, 2.5028, 2.6637];

/** Swung ride cymbal: a metallic square-wave cluster, high-passed, with a little bell ping. */
export function ride(o: BandOut, t: number, v: number): void {
  const g = env(o, o.dest, t, 0.03 * v, 0.002, 0.5);
  const hp = filt(o, 'highpass', 6000, 0.7, g);
  for (const r of RIDE) tone(o, 'square', 330 * r, t, 0.55, hp);
  tone(o, 'sine', 3150, t, 0.3, env(o, o.dest, t, 0.008 * v, 0.001, 0.25));
}

export function crash(o: BandOut, t: number, v: number): void {
  const g = env(o, o.dest, t, 0.11 * v, 0.003, 1.5);
  if (o.verb) g.connect(o.verb);
  hiss(o, t, 1.6, filt(o, 'highpass', 3600, 0.6, g));
}

/** A plucked upright bass note. */
export function upright(o: BandOut, t: number, midi: number, v: number, dur: number): void {
  const f = midiHz(midi);
  const g = o.ctx.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(0.3 * v, t + 0.006);
  g.gain.setTargetAtTime(0.12 * v, t + 0.006, 0.12);
  g.gain.setTargetAtTime(SILENT, t + Math.max(0.1, dur), 0.08);
  g.connect(o.dest);
  const lp = filt(o, 'lowpass', 1300, 1.2, g);
  lp.frequency.setTargetAtTime(520, t + 0.01, 0.08);
  const len = Math.max(0.1, dur) + 0.4;
  tone(o, 'triangle', f, t, len, lp);
  tone(o, 'sawtooth', f, t, len, filt(o, 'lowpass', 600, 0.7, lp)).detune.value = 4;
}

/** One hand clap: three fast bursts and a short tail. */
function oneClap(o: BandOut, t: number, v: number, dest: AudioNode): void {
  for (const dt of [0, 0.009, 0.018]) hiss(o, t + dt, 0.02, filt(o, 'bandpass', 1150, 1.3, env(o, dest, t + dt, 0.11 * v, 0.001, 0.012)));
  hiss(o, t + 0.02, 0.12, filt(o, 'bandpass', 1300, 0.9, env(o, dest, t + 0.02, 0.06 * v, 0.002, 0.07)));
}

/** A few crowd clappers on one beat, a little apart in time and space. */
export function clap(o: BandOut, t: number, v: number): void {
  for (let i = 0; i < 4; i++) oneClap(o, t + rand(-0.012, 0.012), v * rand(0.7, 1), pan(o, rand(-0.7, 0.7)));
}

/** One voice through two formant band-passes, gliding through `pitch` (Hz) over `len` s. */
function voice(o: BandOut, t: number, pitch: readonly number[], formants: readonly number[], peak: number, len: number, side: number): void {
  const g = o.ctx.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(peak, t + 0.07);
  g.gain.setTargetAtTime(SILENT, t + len * 0.55, len / 5);
  g.connect(pan(o, side));
  const osc = tone(o, 'sawtooth', pitch[0] ?? 250, t, len + 0.3, filt(o, 'bandpass', formants[0] ?? 600, 3, g));
  osc.connect(filt(o, 'bandpass', formants[1] ?? 1100, 4, g));
  pitch.forEach((p, i) => {
    if (i > 0) osc.frequency.exponentialRampToValueAtTime(p, t + (len * i) / (pitch.length - 1));
  });
}

/** "Woo!": a handful of rising voices and a burst of crowd noise. */
export function cheer(o: BandOut, t: number, v: number, voices = 5): void {
  for (let i = 0; i < voices; i++) {
    const f = rand(190, 360);
    const at = t + rand(0, 0.12);
    voice(o, at, [f, f * 1.65, f * 1.35], [rand(600, 800), rand(1000, 1300)], 0.045 * v, rand(0.55, 0.8), rand(-0.8, 0.8));
  }
  hiss(o, t, 0.9, filt(o, 'bandpass', 1100, 0.5, env(o, o.dest, t, 0.035 * v, 0.08, 0.7)));
}

/** "Awww": falling voices. */
export function groan(o: BandOut, t: number, v: number): void {
  for (let i = 0; i < 4; i++) {
    const f = rand(230, 320);
    voice(o, t + rand(0, 0.1), [f, f * 0.92, f * 0.7], [rand(650, 750), rand(950, 1100)], 0.04 * v, rand(0.8, 1.05), rand(-0.7, 0.7));
  }
}

/** Applause for `seconds`, densest at the start, with a few cheers on top. */
export function applause(o: BandOut, t: number, v: number, seconds: number): void {
  const claps = Math.round(24 * seconds * v);
  for (let i = 0; i < claps; i++) {
    const at = t + seconds * Math.random() ** 1.7;
    oneClap(o, at, v * rand(0.3, 0.75) * (1 - (at - t) / (seconds * 1.4)), pan(o, rand(-0.9, 0.9)));
  }
  cheer(o, t, v, 7);
  cheer(o, t + 0.7, v * 0.7, 4);
}
