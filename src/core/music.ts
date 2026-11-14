import { budget } from './audio-health';
import { clamp, whiteNoise } from './audio-nodes';
import type { AudioEngine } from './audio';
import { compileSong } from './music-patterns';
import type { CompiledSong } from './music-patterns';
import { createRig, dropReverb, impulse } from './music-rig';
import type { Rig } from './music-rig';
import type { Synth } from './music-synth';
import { VOICES } from './music-voices';

export type MusicMood = 'menu' | 'mission' | 'boss' | 'victory' | 'defeat';

const LOOKAHEAD = 0.2;
const FADE = 0.6;

interface Deck {
  mood: MusicMood; song: CompiledSong; rig: Rig;
  bar: number; step: number; next: number; stepDur: number; gate: number; done: boolean;
}

function advance(d: Deck): void {
  d.next += d.stepDur;
  if (++d.step < 16) return;
  d.step = 0;
  if (++d.bar < d.song.bars.length) return;
  d.bar = d.song.loopFrom;
  d.done = !d.song.loop;
}

/**
 * Plays one mood at a time with a lookahead scheduler: every `tick()` (once per frame) queues the
 * 16th steps falling inside the next LOOKAHEAD seconds on the audio clock. Mood changes crossfade.
 */
export class Music {
  private readonly audio: AudioEngine;
  private deck: Deck | null = null;
  private wanted: MusicMood | null = null;
  private fading: { nodes: AudioNode[]; until: number }[] = [];
  private noiseBuf: AudioBuffer | null = null;
  private irBuf: AudioBuffer | null = null;
  /** The context the deck plays on: a rebuilt one (doc 01, bug B1) starts the mood again. */
  private ctx: AudioContext | null = null;

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
    if (ctx !== this.ctx) this.adopt(ctx);
    if (this.wanted) this.start(ctx, bus, this.wanted);
    this.reap(ctx.currentTime);
    const d = this.deck;
    if (!d || d.done) return;
    if (d.rig.conv && budget(this.audio.tier).reverb === 0) dropReverb(d.rig); // shedding load: no reverb
    if (d.next < ctx.currentTime) d.next = ctx.currentTime + 0.03; // stalled frame or hidden tab: resync, no burst
    this.noiseBuf ??= whiteNoise(ctx);
    const { out, echo, verb } = d.rig;
    const synth: Synth = {
      ctx, out, echo, verb, noise: this.noiseBuf, step: d.stepDur, bright: d.song.bright, gate: d.gate,
    };
    const audible = this.audio.musicOn; // MUSIC off: keep the song's place, create no notes
    while (!d.done && d.next < ctx.currentTime + LOOKAHEAD) {
      if (audible) for (const e of d.song.bars[d.bar]?.[d.step] ?? []) VOICES[e.i](synth, d.next, e);
      advance(d);
    }
  }

  private start(ctx: AudioContext, bus: AudioNode, mood: MusicMood): void {
    this.wanted = null;
    this.fadeOut(ctx);
    const song = compileSong(mood);
    const stepDur = 15 / song.bpm;
    const verb = budget(this.audio.tier).reverb;
    if (verb > 0) this.irBuf ??= impulse(ctx, verb);
    const rig = createRig(ctx, bus, verb > 0 ? this.irBuf : null, stepDur * 3, song.loop ? FADE : 0.03); // stingers hit immediately
    this.deck = {
      mood, song, rig, bar: 0, step: 0, next: ctx.currentTime + 0.05, stepDur,
      gate: clamp(stepDur * 1.8, 0.16, 0.3), done: false,
    };
  }

  private fadeOut(ctx: AudioContext): void {
    const d = this.deck;
    if (!d) return;
    const t = ctx.currentTime;
    const g = d.rig.out.gain;
    g.cancelScheduledValues(t);
    g.setValueAtTime(g.value, t);
    g.linearRampToValueAtTime(0, t + FADE);
    this.fading.push({ nodes: d.rig.nodes, until: t + FADE + 0.5 });
    this.deck = null;
  }

  /** A new context: the old deck's nodes died with the old one; the song it played starts again on this one. */
  private adopt(ctx: AudioContext): void {
    const d = this.deck;
    if (this.ctx && d && !d.done) this.wanted ??= d.mood;
    this.deck = null;
    this.fading = [];
    this.noiseBuf = null;
    this.irBuf = null;
    this.ctx = ctx;
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
