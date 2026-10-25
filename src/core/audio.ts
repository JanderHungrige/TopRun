import { clamp, filterNode, gainNode, noiseNode, oscNode, panTo, whiteNoise } from './audio-nodes';
import { GAP, renderSfx, SPAM } from './sfx-recipes';
import type { SfxName, SfxOptions } from './sfx-recipes';

export type { SfxName, SfxOptions } from './sfx-recipes';

const MAX_VOICES = 24;
const MUSIC_TRIM = 0.42;
const SFX_TRIM = 0.8;
const LIMITER = { threshold: -8, knee: 6, ratio: 12, attack: 0.003, release: 0.25 };

function audioCtor(): typeof AudioContext | undefined {
  const g = globalThis as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext };
  return g.AudioContext ?? g.webkitAudioContext;
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
    const out = gainNode(ctx, clamp(opts.volume ?? 1, 0, 2));
    out.connect(panTo(ctx, graph.sfx, opts.pan ?? 0));
    const pitch = clamp(opts.pitch ?? 1, 0.1, 4) * (spam !== undefined ? 0.97 + Math.random() * 0.06 : 1);
    const end = renderSfx(name, { ctx, noise: graph.noise, out, now, pitch });
    this.voices.push({ end, out });
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
    this.ctx = ctx;
    this.graph = { master, sfx, music, noise: whiteNoise(ctx) };
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
