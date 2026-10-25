import { clamp, filterNode, gainNode, noiseNode, oscNode, panTo, whiteNoise } from './audio-nodes';
import { busGains, CEILING_RANGE, ceilingCurve, IMPACT_SHELF, LIMITER } from './audio-mix';
import type { BusGains, Levels } from './audio-mix';
import { GAP, HEAVY, renderSfx, SPAM } from './sfx-recipes';
import type { SfxName, SfxOptions } from './sfx-recipes';

export type { Levels } from './audio-mix';
export type { SfxName, SfxOptions } from './sfx-recipes';

const MAX_VOICES = 24;
/** Bus gain glide time constant: switching a bus on/off never clicks. */
const GLIDE = 0.04;

function audioCtor(): typeof AudioContext | undefined {
  const g = globalThis as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext };
  return g.AudioContext ?? g.webkitAudioContext;
}

/** `impact` is the low-shelf bus heavy effects play into; it feeds `sfx`. */
interface Graph { sfx: GainNode; impact: AudioNode; music: GainNode; noise: AudioBuffer }
interface Voice { end: number; out: GainNode }
type JetParam = 'gain' | 'cutoff' | 'roar' | 'rumble' | 'whine' | 'whineGain';
type Jet = Record<JetParam, AudioParam>;

/** Master → compressor → safety ceiling → speakers; returns the master input. */
function masterChain(ctx: BaseAudioContext): GainNode {
  const master = gainNode(ctx, 1);
  const limiter = ctx.createDynamicsCompressor();
  for (const k of Object.keys(LIMITER) as (keyof typeof LIMITER)[]) limiter[k].value = LIMITER[k];
  const ceiling = ctx.createWaveShaper();
  ceiling.curve = ceilingCurve();
  ceiling.oversample = '2x';
  master.connect(limiter).connect(gainNode(ctx, 1 / CEILING_RANGE)).connect(ceiling).connect(ctx.destination);
  return master;
}

/** Builds the bus graph (exported for offline measurement in dev tools). */
export function buildGraph(ctx: BaseAudioContext, gains: BusGains): Graph {
  const master = masterChain(ctx);
  const sfx = gainNode(ctx, gains.sfx);
  const music = gainNode(ctx, gains.music);
  const impact = filterNode(ctx, 'lowshelf', IMPACT_SHELF.frequency, 0);
  impact.gain.value = IMPACT_SHELF.gain;
  impact.connect(sfx);
  sfx.connect(master);
  music.connect(master);
  return { sfx, impact, music, noise: whiteNoise(ctx) };
}

const levelsOf = (l: Levels): Levels => ({ music: l.music, sfx: l.sfx, musicOn: l.musicOn, sfxOn: l.sfxOn });

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private graph: Graph | null = null;
  private jet: Jet | null = null;
  private jetLevel = 0;
  private voices: Voice[] = [];
  private last = new Map<SfxName, number>();
  private levels: Levels;

  constructor(levels: Levels) {
    this.levels = levelsOf(levels);
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
  /** Title MUSIC switch: the music scheduler skips notes while it is off. */
  get musicOn(): boolean { return this.levels.musicOn; }
  get sfxOn(): boolean { return this.levels.sfxOn; }

  play(name: SfxName, opts: SfxOptions = {}): void {
    const { ctx, graph } = this;
    if (!ctx || !graph || ctx.state !== 'running' || !this.levels.sfxOn) return;
    const now = ctx.currentTime;
    const spam = SPAM[name];
    if (now - (this.last.get(name) ?? -1) < (spam ?? GAP[name] ?? 0.02)) return;
    if (!this.claimVoice(now, spam !== undefined)) return;
    this.last.set(name, now);
    const out = gainNode(ctx, clamp(opts.volume ?? 1, 0, 2));
    out.connect(panTo(ctx, HEAVY.has(name) ? graph.impact : graph.sfx, opts.pan ?? 0));
    const pitch = clamp(opts.pitch ?? 1, 0.1, 4) * (spam !== undefined ? 0.97 + Math.random() * 0.06 : 1);
    const end = renderSfx(name, { ctx, noise: graph.noise, out, now, pitch });
    this.voices.push({ end, out });
  }

  /** Applies volumes and the SOUND / MUSIC switches live (gains glide, nothing restarts). */
  setLevels(levels: Levels): void {
    this.levels = levelsOf(levels);
    const { ctx, graph } = this;
    if (!ctx || !graph) return;
    const g = busGains(this.levels);
    graph.sfx.gain.setTargetAtTime(g.sfx, ctx.currentTime, GLIDE);
    graph.music.gain.setTargetAtTime(g.music, ctx.currentTime, GLIDE);
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
    this.graph = buildGraph(ctx, busGains(this.levels));
    this.ctx = ctx;
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
