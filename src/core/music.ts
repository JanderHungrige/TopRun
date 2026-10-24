import type { AudioEngine } from './audio';
import { compileSong } from './music-patterns';
import type { CompiledSong, Inst, NoteEvent } from './music-patterns';

export type MusicMood = 'menu' | 'mission' | 'boss' | 'victory' | 'defeat';

const LOOKAHEAD = 0.2;
const FADE = 0.6;
const SILENT = 0.0001;

interface Synth { ctx: AudioContext; out: AudioNode; fx: AudioNode; noise: AudioBuffer; step: number; bright: number }
type Voice = (s: Synth, t: number, e: NoteEvent) => void;
interface Deck {
  mood: MusicMood; song: CompiledSong; out: GainNode; fx: GainNode; nodes: AudioNode[];
  bar: number; step: number; next: number; stepDur: number; done: boolean;
}

const hz = (m: number): number => 440 * 2 ** ((m - 69) / 12);

/** Gain stage into `dest`: linear attack, hold, exponential release. */
function env(
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

function osc(
  s: Synth, type: OscillatorType, freq: number, t: number, end: number, dest: AudioNode, cents = 0,
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

function noise(s: Synth, t: number, end: number, dest: AudioNode): void {
  const b = s.ctx.createBufferSource();
  b.buffer = s.noise;
  b.loop = true;
  b.connect(dest);
  b.start(t, Math.random() * 0.5);
  b.stop(end);
}

function filter(s: Synth, type: BiquadFilterType, freq: number, q: number, dest: AudioNode): BiquadFilterNode {
  const f = s.ctx.createBiquadFilter();
  f.type = type;
  f.frequency.value = freq;
  f.Q.value = q;
  f.connect(dest);
  return f;
}

const kick: Voice = (s, t, e) => {
  const body = env(s, s.out, t, 0.7 * e.v, 0.002, 0.03, 0.26);
  osc(s, 'sine', 150, t, t + 0.32, body).frequency.exponentialRampToValueAtTime(42, t + 0.12);
  osc(s, 'triangle', 900, t, t + 0.02, env(s, s.out, t, 0.1 * e.v, 0.001, 0, 0.015));
};

/** Noise snare with a held "gated reverb" tail that is cut off abruptly. */
const snare: Voice = (s, t, e) => {
  const v = 0.32 * e.v;
  const gate = s.ctx.createGain();
  gate.gain.setValueAtTime(v, t);
  gate.gain.setTargetAtTime(v * 0.45, t, 0.02);
  gate.gain.setValueAtTime(v * 0.45, t + 0.12);
  gate.gain.linearRampToValueAtTime(0, t + 0.14);
  gate.connect(s.out);
  noise(s, t, t + 0.15, filter(s, 'bandpass', 2400, 0.6, gate));
  const body = env(s, s.out, t, 0.2 * e.v, 0.001, 0, 0.09);
  osc(s, 'triangle', 210, t, t + 0.1, body).frequency.exponentialRampToValueAtTime(150, t + 0.08);
};

const hat = (cutoff: number, decay: number, vol: number): Voice => (s, t, e) =>
  noise(s, t, t + decay + 0.02, filter(s, 'highpass', cutoff, 0.8, env(s, s.out, t, vol * e.v, 0.001, 0, decay)));

const bass: Voice = (s, t, e) => {
  const len = Math.max(0.05, e.d * s.step * 0.85);
  const f = filter(s, 'lowpass', 1500 * s.bright, 4, env(s, s.out, t, 0.2 * e.v, 0.004, len, 0.05));
  f.frequency.setValueAtTime(1500 * s.bright, t);
  f.frequency.exponentialRampToValueAtTime(260, t + 0.18);
  for (const cents of [-6, 6]) osc(s, 'sawtooth', hz(e.m[0] ?? 40), t, t + len + 0.08, f, cents);
};

/** Power chord of detuned saws. */
const pad: Voice = (s, t, e) => {
  const len = e.d * s.step;
  const g = env(s, s.out, t, 0.04 * e.v, 0.012, Math.max(0, len - 0.06), 0.2);
  const f = filter(s, 'lowpass', 2200 * s.bright, 0.7, g);
  for (const m of e.m) for (const cents of [-8, 8]) osc(s, 'sawtooth', hz(m), t, t + len + 0.25, f, cents);
};

const arp: Voice = (s, t, e) => {
  const len = Math.max(0.08, e.d * s.step * 0.9);
  const g = env(s, s.out, t, 0.05 * e.v, 0.002, 0, len);
  g.connect(s.fx);
  osc(s, 'square', hz(e.m[0] ?? 64), t, t + len + 0.02, filter(s, 'lowpass', 3000 * s.bright, 1, g));
};

const lead: Voice = (s, t, e) => {
  const len = e.d * s.step;
  const end = t + len + 0.2;
  const g = env(s, s.out, t, 0.08 * e.v, 0.012, Math.max(0, len - 0.05), 0.16);
  g.connect(s.fx);
  const f = filter(s, 'lowpass', 2600 * s.bright, 1.2, g);
  const vibrato = s.ctx.createGain(); // depth in cents, fades in so short notes stay straight
  vibrato.gain.setValueAtTime(0, t);
  vibrato.gain.linearRampToValueAtTime(14, t + Math.min(0.45, len));
  osc(s, 'sine', 5.5, t, end, vibrato);
  const freq = hz(e.m[0] ?? 69);
  vibrato.connect(osc(s, 'sawtooth', freq, t, end, f).detune);
  vibrato.connect(osc(s, 'square', freq, t, end, f, 6).detune);
};

const VOICES: Record<Inst, Voice> = {
  kick, snare, bass, pad, arp, lead,
  hat: hat(7000, 0.035, 0.07), ohat: hat(6500, 0.16, 0.06), crash: hat(4500, 1.1, 0.12),
};

function makeNoise(ctx: AudioContext): AudioBuffer {
  const buf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  return buf;
}

/** Dotted-8th feedback echo for arp and lead; returns the send plus every node to disconnect later. */
function echo(ctx: AudioContext, out: AudioNode, time: number): { send: GainNode; nodes: AudioNode[] } {
  const send = ctx.createGain();
  const delay = ctx.createDelay(1);
  const tone = ctx.createBiquadFilter();
  const feedback = ctx.createGain();
  send.gain.value = 0.3;
  delay.delayTime.value = Math.min(0.95, time);
  tone.frequency.value = 2400;
  feedback.gain.value = 0.32;
  send.connect(delay).connect(tone).connect(feedback).connect(delay);
  tone.connect(out);
  return { send, nodes: [send, delay, tone, feedback] };
}

function advance(d: Deck): void {
  d.next += d.stepDur;
  if (++d.step < 16) return;
  d.step = 0;
  if (++d.bar < d.song.bars.length) return;
  d.bar = 0;
  d.done = !d.song.loop;
}

export class Music {
  private readonly audio: AudioEngine;
  private deck: Deck | null = null;
  private wanted: MusicMood | null = null;
  private fading: { nodes: AudioNode[]; until: number }[] = [];
  private noiseBuf: AudioBuffer | null = null;

  constructor(audio: AudioEngine) {
    this.audio = audio;
  }

  play(mood: MusicMood): void {
    const d = this.deck;
    if (d && d.mood === mood && !d.done) {
      this.wanted = null;
      return;
    }
    this.wanted = mood;
    this.tick();
  }

  stop(): void {
    this.wanted = null;
    const ctx = this.audio.context;
    if (ctx) this.fadeOut(ctx);
  }

  tick(): void {
    const ctx = this.audio.context;
    const bus = this.audio.musicOut;
    if (!ctx || !bus || !this.audio.ready) return;
    if (this.wanted) this.start(ctx, bus, this.wanted);
    this.reap(ctx.currentTime);
    const d = this.deck;
    if (!d || d.done) return;
    if (d.next < ctx.currentTime) d.next = ctx.currentTime + 0.03; // stalled frame or hidden tab: resync, no burst
    this.noiseBuf ??= makeNoise(ctx);
    const synth: Synth = { ctx, out: d.out, fx: d.fx, noise: this.noiseBuf, step: d.stepDur, bright: d.song.bright };
    while (!d.done && d.next < ctx.currentTime + LOOKAHEAD) {
      for (const e of d.song.bars[d.bar]?.[d.step] ?? []) VOICES[e.i](synth, d.next, e);
      advance(d);
    }
  }

  private start(ctx: AudioContext, bus: AudioNode, mood: MusicMood): void {
    this.wanted = null;
    this.fadeOut(ctx);
    const song = compileSong(mood);
    const stepDur = 15 / song.bpm;
    const now = ctx.currentTime;
    const out = ctx.createGain();
    out.gain.setValueAtTime(0, now);
    out.gain.linearRampToValueAtTime(1, now + (song.loop ? FADE : 0.03)); // stingers hit immediately
    out.connect(bus);
    const fx = echo(ctx, out, stepDur * 3);
    this.deck = {
      mood, song, out, fx: fx.send, nodes: [out, ...fx.nodes],
      bar: 0, step: 0, next: now + 0.05, stepDur, done: false,
    };
  }

  private fadeOut(ctx: AudioContext): void {
    const d = this.deck;
    if (!d) return;
    const t = ctx.currentTime;
    const g = d.out.gain;
    g.cancelScheduledValues(t);
    g.setValueAtTime(g.value, t);
    g.linearRampToValueAtTime(0, t + FADE);
    this.fading.push({ nodes: d.nodes, until: t + FADE + 0.5 });
    this.deck = null;
  }

  private reap(now: number): void {
    if (this.fading.length === 0) return;
    this.fading = this.fading.filter((f) => {
      if (f.until > now) return true;
      for (const n of f.nodes) n.disconnect();
      return false;
    });
  }
}
