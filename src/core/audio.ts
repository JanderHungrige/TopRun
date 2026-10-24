export type SfxName =
  | 'gun' | 'missile' | 'rocket' | 'bombDrop' | 'explosionSmall' | 'explosionLarge' | 'explosionHuge'
  | 'hit' | 'playerHit' | 'pickup' | 'cash' | 'powerup' | 'flare' | 'catapult' | 'warning'
  | 'uiMove' | 'uiSelect' | 'uiBack' | 'buy' | 'denied' | 'enemyShot' | 'enemyMissile' | 'special' | 'splash';

export interface SfxOptions { volume?: number; pan?: number /* -1..1 */; pitch?: number /* rate multiplier */ }

type Wave = 'sine' | 'square' | 'sawtooth' | 'triangle';
interface Timing { at?: number; a?: number; h?: number; q?: number /* filter Q, noise only */ }
/** Attack `a`, hold `h`, exponential decay `d`, starting `at` s after trigger; `f` sweeps f[0]→f[1] Hz. */
interface Env extends Timing { f: [number, number]; d: number; v: number }
interface Tone extends Env { w: Wave }
interface Hiss extends Env { n: BiquadFilterType }
type Layer = Tone | Hiss;

/** Oscillator layer: wave, Hz from → to, decay s, volume, optional timing. */
const tone = (w: Wave, f0: number, f1: number, d: number, v: number, x: Timing = {}): Tone =>
  ({ w, f: [f0, f1], d, v, ...x });
/** Filtered-noise layer: filter type, cutoff Hz from → to, decay s, volume, optional timing / Q. */
const hiss = (n: BiquadFilterType, f0: number, f1: number, d: number, v: number, x: Timing = {}): Hiss =>
  ({ n, f: [f0, f1], d, v, ...x });
const arp = (w: Wave, notes: number[], step: number, v: number, d = 0.07): Tone[] =>
  notes.map((f, i) => tone(w, f, f, i === notes.length - 1 ? d * 2.5 : d, v, { at: i * step }));
const alarm = (): Tone[] => Array.from({ length: 8 }, (_, i) =>
  tone('square', i % 2 ? 660 : 880, i % 2 ? 640 : 860, 0.04, 0.11, { at: i * 0.17, a: 0.01, h: 0.12 }));

const SFX: Record<SfxName, Layer[]> = {
  gun: [tone('square', 1400, 420, 0.05, 0.2), hiss('highpass', 3200, 1500, 0.04, 0.28)],
  missile: [
    hiss('bandpass', 500, 3200, 0.55, 0.55, { q: 2, a: 0.04 }), tone('sawtooth', 180, 520, 0.4, 0.07, { a: 0.02 }),
  ],
  rocket: [hiss('bandpass', 900, 2600, 0.28, 0.4, { q: 1.5, a: 0.01 }), tone('square', 300, 120, 0.06, 0.1)],
  bombDrop: [tone('square', 220, 90, 0.05, 0.1), tone('sine', 1500, 600, 0.4, 0.1, { a: 0.05, h: 0.3 })],
  explosionSmall: [hiss('lowpass', 3000, 300, 0.3, 0.6), tone('triangle', 180, 40, 0.22, 0.4)],
  explosionLarge: [
    hiss('lowpass', 2500, 150, 0.7, 0.8, { h: 0.05 }), tone('sine', 120, 28, 0.5, 0.7),
    hiss('bandpass', 1800, 600, 0.35, 0.3, { q: 0.8, at: 0.06 }),
  ],
  explosionHuge: [
    hiss('lowpass', 2000, 80, 1.6, 1, { a: 0.01, h: 0.2 }), tone('sine', 90, 20, 1.2, 0.9, { h: 0.1 }),
    tone('sawtooth', 60, 25, 0.9, 0.12), hiss('bandpass', 1500, 400, 0.8, 0.35, { q: 0.7, at: 0.15 }),
    hiss('lowpass', 1200, 100, 0.9, 0.45, { at: 0.35 }),
  ],
  hit: [tone('square', 1100, 600, 0.035, 0.12), hiss('highpass', 4000, 2500, 0.03, 0.16)],
  playerHit: [
    tone('sawtooth', 240, 60, 0.28, 0.32), hiss('lowpass', 3000, 300, 0.3, 0.6), tone('square', 90, 45, 0.2, 0.18),
  ],
  pickup: arp('square', [784, 1047, 1568], 0.05, 0.12),
  cash: [...arp('square', [1319, 1760, 2637], 0.045, 0.1), tone('triangle', 2637, 2637, 0.3, 0.12, { at: 0.09 })],
  powerup: [...arp('square', [523, 659, 784, 1047, 1319], 0.06, 0.11), tone('sawtooth', 200, 1600, 0.35, 0.05)],
  flare: [tone('sine', 700, 180, 0.12, 0.25), hiss('highpass', 2500, 7000, 0.4, 0.3, { a: 0.01, h: 0.05 })],
  // thunk, steam hiss through the 1.4 s stroke, shuttle clank at the end
  catapult: [
    tone('sine', 110, 38, 0.35, 0.9), hiss('lowpass', 900, 120, 0.25, 0.7),
    hiss('highpass', 1200, 2600, 0.8, 0.45, { a: 0.06, h: 0.7 }),
    hiss('bandpass', 3500, 5000, 0.7, 0.25, { q: 0.6, a: 0.04, h: 0.5 }),
    tone('square', 260, 90, 0.12, 0.14, { at: 1.35 }), hiss('lowpass', 1500, 200, 0.3, 0.5, { at: 1.35 }),
  ],
  warning: alarm(),
  uiMove: [tone('square', 660, 700, 0.035, 0.07)],
  uiSelect: arp('square', [880, 1320], 0.05, 0.09),
  uiBack: arp('square', [660, 440], 0.05, 0.09),
  buy: [...arp('triangle', [659, 988, 1319], 0.06, 0.2, 0.09), hiss('highpass', 6000, 6000, 0.25, 0.1, { at: 0.12 })],
  denied: [0, 0.14].flatMap((at) => [
    tone('square', 120, 110, 0.03, 0.11, { at, h: 0.08 }), tone('sawtooth', 123, 113, 0.03, 0.09, { at, h: 0.08 }),
  ]),
  enemyShot: [tone('square', 760, 380, 0.07, 0.08), hiss('bandpass', 2000, 1000, 0.05, 0.1)],
  enemyMissile: [hiss('bandpass', 300, 1800, 0.5, 0.4, { q: 2, a: 0.04 }), tone('sawtooth', 120, 300, 0.35, 0.06)],
  special: [
    tone('sawtooth', 110, 1760, 0.45, 0.1, { a: 0.05, h: 0.15 }), tone('square', 55, 880, 0.45, 0.06, { a: 0.05 }),
    hiss('bandpass', 400, 6000, 0.5, 0.35, { a: 0.25 }), tone('sine', 140, 45, 0.35, 0.5, { at: 0.4 }),
  ],
  splash: [
    hiss('lowpass', 5000, 200, 0.6, 0.7, { a: 0.005, h: 0.05 }), tone('sine', 220, 60, 0.25, 0.35),
    hiss('bandpass', 2500, 900, 0.45, 0.2, { q: 1.2, at: 0.08 }),
  ],
};

/** Rapid-fire sounds: rate-limited, pitch-jittered, and dropped (instead of voice-stealing) at the cap. */
const SPAM: Partial<Record<SfxName, number>> = {
  gun: 0.045, hit: 0.03, enemyShot: 0.06, explosionSmall: 0.04, rocket: 0.05, enemyMissile: 0.09,
};
const GAP: Partial<Record<SfxName, number>> = {
  missile: 0.06, explosionLarge: 0.06, explosionHuge: 0.15, pickup: 0.04, cash: 0.04, uiMove: 0.03,
  flare: 0.08, splash: 0.08, bombDrop: 0.08, warning: 1.4, playerHit: 0.08,
};
const MAX_VOICES = 24;
const MUSIC_TRIM = 0.42;
const SFX_TRIM = 0.8;
const SILENT = 0.0001;
const LIMITER = { threshold: -8, knee: 6, ratio: 12, attack: 0.003, release: 0.25 };

const layerEnd = (l: Layer): number => (l.at ?? 0) + (l.a ?? 0.003) + (l.h ?? 0) + l.d;
const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));

function audioCtor(): typeof AudioContext | undefined {
  const g = globalThis as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext };
  return g.AudioContext ?? g.webkitAudioContext;
}

function gainNode(ctx: AudioContext, v: number): GainNode {
  const g = ctx.createGain();
  g.gain.value = v;
  return g;
}

function filterNode(ctx: AudioContext, type: BiquadFilterType, freq: number, q: number): BiquadFilterNode {
  const f = ctx.createBiquadFilter();
  f.type = type;
  f.frequency.value = freq;
  f.Q.value = q;
  return f;
}

function oscNode(ctx: AudioContext, type: Wave, freq: number): OscillatorNode {
  const o = ctx.createOscillator();
  o.type = type;
  o.frequency.value = freq;
  return o;
}

function noiseNode(ctx: AudioContext, buffer: AudioBuffer, rate: number): AudioBufferSourceNode {
  const b = ctx.createBufferSource();
  b.buffer = buffer;
  b.loop = true;
  b.playbackRate.value = rate;
  return b;
}

function panTo(ctx: AudioContext, dest: AudioNode, pan: number): AudioNode {
  if (pan === 0 || typeof ctx.createStereoPanner !== 'function') return dest;
  const p = ctx.createStereoPanner();
  p.pan.value = clamp(pan, -1, 1);
  p.connect(dest);
  return p;
}

interface Graph { master: GainNode; sfx: GainNode; music: GainNode; noise: AudioBuffer }
interface Voice { end: number; out: GainNode }
type JetParam = 'gain' | 'cutoff' | 'roar' | 'rumble' | 'whine' | 'whineGain';
type Jet = Record<JetParam, AudioParam>;

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private graph: Graph | null = null;
  private jet: Jet | null = null;
  private jetLevel = 0;
  private voices: Voice[] = [];
  private last = new Map<SfxName, number>();
  private vol: { music: number; sfx: number };
  private isMuted = false;

  constructor(volumes: { music: number; sfx: number }) {
    this.vol = { music: clamp(volumes.music, 0, 1), sfx: clamp(volumes.sfx, 0, 1) };
  }

  unlock(): void {
    try {
      if (!this.ctx) this.init();
      const ctx = this.ctx;
      if (ctx && ctx.state !== 'running') ctx.resume().catch(() => undefined);
    } catch {
      // Web Audio blocked or unavailable: stay silent
    }
  }

  get ready(): boolean { return this.ctx !== null && this.ctx.state === 'running'; }
  get context(): AudioContext | null { return this.ctx; }
  get musicOut(): GainNode | null { return this.graph ? this.graph.music : null; }
  get muted(): boolean { return this.isMuted; }

  play(name: SfxName, opts: SfxOptions = {}): void {
    const { ctx, graph } = this;
    if (!ctx || !graph || ctx.state !== 'running' || this.isMuted) return;
    const now = ctx.currentTime;
    const spam = SPAM[name];
    if (now - (this.last.get(name) ?? -1) < (spam ?? GAP[name] ?? 0.02)) return;
    if (!this.claimVoice(now, spam !== undefined)) return;
    this.last.set(name, now);
    const layers = SFX[name];
    const out = gainNode(ctx, clamp(opts.volume ?? 1, 0, 2));
    out.connect(panTo(ctx, graph.sfx, opts.pan ?? 0));
    this.voices.push({ end: now + Math.max(...layers.map(layerEnd)), out });
    const pitch = clamp(opts.pitch ?? 1, 0.1, 4) * (spam !== undefined ? 0.97 + Math.random() * 0.06 : 1);
    for (const l of layers) this.layer(ctx, graph.noise, l, out, now, pitch);
  }

  setVolumes(music: number, sfx: number): void {
    this.vol = { music: clamp(music, 0, 1), sfx: clamp(sfx, 0, 1) };
    this.applyLevels();
  }

  setMuted(muted: boolean): void {
    this.isMuted = muted;
    this.applyLevels();
  }

  setJet(level: number): void {
    const l = clamp(Number.isFinite(level) ? level : 0, 0, 1);
    const { ctx, graph } = this;
    if (Math.abs(l - this.jetLevel) < 0.004 || !ctx || !graph) return;
    this.jet ??= l > 0 ? this.createJet(ctx, graph) : null;
    const jet = this.jet;
    if (!jet) return;
    this.jetLevel = l;
    const targets: [AudioParam, number][] = [
      [jet.gain, l * 0.42], [jet.cutoff, 280 + 2600 * l * l], [jet.roar, l * l * 0.35],
      [jet.rumble, 38 + 52 * l], [jet.whine, 1100 + 2600 * l], [jet.whineGain, 0.018 * l],
    ];
    for (const [param, v] of targets) param.setTargetAtTime(v, ctx.currentTime, 0.05); // ~0.15 s to settle
  }

  private init(): void {
    const Ctor = audioCtor();
    if (!Ctor) return;
    const ctx = new Ctor();
    const master = gainNode(ctx, this.isMuted ? 0 : 1);
    const limiter = ctx.createDynamicsCompressor();
    for (const k of Object.keys(LIMITER) as (keyof typeof LIMITER)[]) limiter[k].value = LIMITER[k];
    master.connect(limiter).connect(ctx.destination);
    const sfx = gainNode(ctx, this.vol.sfx * SFX_TRIM);
    const music = gainNode(ctx, this.vol.music * MUSIC_TRIM);
    sfx.connect(master);
    music.connect(master);
    const noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const data = noise.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    this.ctx = ctx;
    this.graph = { master, sfx, music, noise };
  }

  private applyLevels(): void {
    const { ctx, graph } = this;
    if (!ctx || !graph) return;
    const t = ctx.currentTime;
    graph.master.gain.setTargetAtTime(this.isMuted ? 0 : 1, t, 0.04);
    graph.sfx.gain.setTargetAtTime(this.vol.sfx * SFX_TRIM, t, 0.04);
    graph.music.gain.setTargetAtTime(this.vol.music * MUSIC_TRIM, t, 0.04);
  }

  /** Drops finished voices; at the cap, spam is refused and anything else steals the oldest voice. */
  private claimVoice(now: number, spam: boolean): boolean {
    this.voices = this.voices.filter((v) => v.end > now);
    if (this.voices.length < MAX_VOICES) return true;
    if (spam) return false;
    this.voices.shift()?.out.gain.setTargetAtTime(0, now, 0.01);
    return true;
  }

  private layer(ctx: AudioContext, noise: AudioBuffer, l: Layer, out: AudioNode, now: number, pitch: number): void {
    const s = now + (l.at ?? 0);
    const a = l.a ?? 0.003;
    const end = s + a + (l.h ?? 0) + l.d;
    const g = gainNode(ctx, SILENT);
    g.gain.setValueAtTime(SILENT, s);
    g.gain.linearRampToValueAtTime(l.v, s + a);
    g.gain.setValueAtTime(l.v, end - l.d);
    g.gain.exponentialRampToValueAtTime(SILENT, end);
    g.connect(out);
    let src: AudioScheduledSourceNode;
    let freq: AudioParam;
    if ('w' in l) {
      const o = oscNode(ctx, l.w, l.f[0]);
      [src, freq] = [o, o.frequency];
      o.connect(g);
      o.start(s);
    } else {
      const f = filterNode(ctx, l.n, l.f[0], l.q ?? 1);
      const b = noiseNode(ctx, noise, pitch);
      [src, freq] = [b, f.frequency];
      b.connect(f).connect(g);
      b.start(s, Math.random() * 0.9); // random offset decorrelates overlapping noise layers
    }
    freq.setValueAtTime(l.f[0] * pitch, s);
    freq.exponentialRampToValueAtTime(l.f[1] * pitch, end);
    src.stop(end + 0.02);
  }

  private createJet(ctx: AudioContext, graph: Graph): Jet {
    const out = gainNode(ctx, 0);
    const src = noiseNode(ctx, graph.noise, 1);
    const lp = filterNode(ctx, 'lowpass', 280, 0.7);
    const roar = gainNode(ctx, 0);
    const rumble = oscNode(ctx, 'sawtooth', 38);
    const whine = oscNode(ctx, 'triangle', 1100);
    const whineGain = gainNode(ctx, 0);
    out.connect(graph.sfx);
    src.connect(lp).connect(out);
    src.connect(filterNode(ctx, 'bandpass', 900, 0.5)).connect(roar).connect(out);
    rumble.connect(gainNode(ctx, 0.14)).connect(lp);
    whine.connect(whineGain).connect(out);
    for (const s of [src, rumble, whine]) s.start();
    return {
      gain: out.gain, cutoff: lp.frequency, roar: roar.gain,
      rumble: rumble.frequency, whine: whine.frequency, whineGain: whineGain.gain,
    };
  }
}
