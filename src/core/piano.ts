import { clamp, SILENT } from './audio-nodes';

// Piano Bar (doc 23): a synthesized honky-tonk upright. Each note is two slightly detuned "strings" with a
// piano-like harmonic spectrum, a hammer knock, a brightness that fades as the note rings (low notes ring
// longer), and a damper that stops it on release. Plus a white-key glissando and a wrong-note clunker.

export interface PianoOut {
  ctx: AudioContext;
  dest: AudioNode;
  /** Optional reverb send. */
  verb?: AudioNode;
}

export const midiHz = (m: number): number => 440 * 2 ** ((m - 69) / 12);

const waves = new WeakMap<BaseAudioContext, PeriodicWave>();
const knocks = new WeakMap<BaseAudioContext, AudioBuffer>();

/** Harmonics falling off as 1/n^1.15, with the 7th/8th damped (hammer strike point) and a soft 2nd bump. */
function stringWave(ctx: BaseAudioContext): PeriodicWave {
  const hit = waves.get(ctx);
  if (hit) return hit;
  const n = 28;
  const real = new Float32Array(n);
  const imag = new Float32Array(n);
  for (let k = 1; k < n; k++) imag[k] = (k === 2 ? 1.25 : 1) * (k === 7 || k === 8 ? 0.35 : 1) / k ** 1.15;
  const w = ctx.createPeriodicWave(real, imag);
  waves.set(ctx, w);
  return w;
}

/** 40 ms of decaying noise for the hammer. */
function knockBuffer(ctx: BaseAudioContext): AudioBuffer {
  const hit = knocks.get(ctx);
  if (hit) return hit;
  const len = Math.floor(ctx.sampleRate * 0.04);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 3;
  knocks.set(ctx, buf);
  return buf;
}

function hammer(o: PianoOut, t: number, f: number, vel: number): void {
  const src = o.ctx.createBufferSource();
  src.buffer = knockBuffer(o.ctx);
  const bp = o.ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = clamp(f * 4, 900, 4200);
  bp.Q.value = 0.9;
  const g = o.ctx.createGain();
  g.gain.value = 0.05 * vel;
  src.connect(bp).connect(g).connect(o.dest);
  src.start(t);
}

/** One piano note: MIDI pitch, velocity 0 … ~1.2, held for `dur` s (then the damper). */
export function pianoNote(o: PianoOut, t: number, midi: number, vel: number, dur: number): void {
  const { ctx } = o;
  const f = midiHz(midi);
  const peak = 0.11 * vel * clamp(1 + (60 - midi) / 70, 0.8, 1.45);
  const ring = clamp(3.4 - (midi - 30) * 0.05, 0.55, 3.4);
  const off = t + Math.max(0.05, dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(peak, t + 0.004);
  g.gain.setTargetAtTime(peak * 0.38, t + 0.004, 0.1);
  if (off > t + 0.25) g.gain.setTargetAtTime(SILENT, t + 0.25, ring * 0.45);
  g.gain.setTargetAtTime(SILENT, off, 0.06);
  g.connect(o.dest);
  if (o.verb) g.connect(o.verb);
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.Q.value = 0.6;
  lp.frequency.setValueAtTime(clamp(f * (5 + 9 * vel), 800, 15000), t);
  lp.frequency.setTargetAtTime(clamp(f * 2.6 + 350, 400, 9000), t + 0.01, 0.3);
  lp.connect(g);
  const wave = stringWave(ctx);
  for (const cents of [-7, 6]) {
    const osc = ctx.createOscillator();
    osc.setPeriodicWave(wave);
    osc.frequency.value = f;
    osc.detune.value = cents;
    osc.connect(lp);
    osc.start(t);
    osc.stop(off + 0.5);
  }
  hammer(o, t, f, vel);
}

const WHITE = new Set([0, 2, 4, 5, 7, 9, 11]);

/** A white-key sweep up the octave below `target`, from `from` to `to` (the caller plays the target). */
export function pianoGliss(o: PianoOut, from: number, to: number, target: number, vel: number): void {
  const keys: number[] = [];
  for (let m = target - 12; m < target; m++) if (WHITE.has(((m % 12) + 12) % 12)) keys.push(m);
  keys.forEach((m, i) => pianoNote(o, from + ((to - from) * i) / keys.length, m, vel * (0.3 + (0.45 * i) / keys.length), 0.07));
}

/** A wrong note: a soft minor-second smudge with a dull low knock. */
export function pianoClunk(o: PianoOut, t: number, midi: number): void {
  pianoNote(o, t, midi, 0.5, 0.12);
  pianoNote(o, t + 0.012, midi + 1, 0.45, 0.12);
  pianoNote(o, t + 0.02, midi - 13, 0.4, 0.15);
}
