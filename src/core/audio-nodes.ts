/** Small Web Audio node factories shared by the SFX engine, the voice synth and the music synth. */

export type Wave = 'sine' | 'square' | 'sawtooth' | 'triangle';

/** Near-silent floor for exponential ramps (which cannot reach 0). */
export const SILENT = 0.0001;

export const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));

/** Uniform random number in [lo, hi). */
export const rand = (lo: number, hi: number): number => lo + Math.random() * (hi - lo);

export function gainNode(ctx: BaseAudioContext, v: number): GainNode {
  const g = ctx.createGain();
  g.gain.value = v;
  return g;
}

export function filterNode(ctx: BaseAudioContext, type: BiquadFilterType, freq: number, q: number): BiquadFilterNode {
  const f = ctx.createBiquadFilter();
  f.type = type;
  f.frequency.value = freq;
  f.Q.value = q;
  return f;
}

export function oscNode(ctx: BaseAudioContext, type: Wave, freq: number): OscillatorNode {
  const o = ctx.createOscillator();
  o.type = type;
  o.frequency.value = freq;
  return o;
}

export function noiseNode(ctx: BaseAudioContext, buffer: AudioBuffer, rate: number): AudioBufferSourceNode {
  const b = ctx.createBufferSource();
  b.buffer = buffer;
  b.loop = true;
  b.playbackRate.value = rate;
  return b;
}

/** One second of mono white noise, looped by every noise source. */
export function whiteNoise(ctx: BaseAudioContext): AudioBuffer {
  const buf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  return buf;
}

/** Returns the node to connect into: a stereo panner feeding `dest`, or `dest` itself when centred/unsupported. */
export function panTo(ctx: BaseAudioContext, dest: AudioNode, pan: number): AudioNode {
  if (pan === 0 || typeof ctx.createStereoPanner !== 'function') return dest;
  const p = ctx.createStereoPanner();
  p.pan.value = clamp(pan, -1, 1);
  p.connect(dest);
  return p;
}

const curves = new Map<number, Float32Array<ArrayBuffer>>();

/** Soft-clip transfer curve tanh(k·x) normalised to ±1; cached per drive `k`. */
export function driveCurve(k: number): Float32Array<ArrayBuffer> {
  const hit = curves.get(k);
  if (hit) return hit;
  const n = 2048;
  const curve = new Float32Array(n);
  const norm = Math.tanh(k);
  for (let i = 0; i < n; i++) curve[i] = Math.tanh(k * ((i / (n - 1)) * 2 - 1)) / norm;
  curves.set(k, curve);
  return curve;
}

/** Distortion stage feeding `dest`, oversampled to tame aliasing. */
export function shaperNode(
  ctx: BaseAudioContext, k: number, dest: AudioNode, oversample: OverSampleType = '4x',
): WaveShaperNode {
  const w = ctx.createWaveShaper();
  w.curve = driveCurve(k);
  w.oversample = oversample;
  w.connect(dest);
  return w;
}
