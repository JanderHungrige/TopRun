import type { AudioEngine } from '../../core/audio';
import { clamp, gainNode, whiteNoise } from '../../core/audio-nodes';
import { impulse } from '../../core/music-rig';
import { pianoClunk, pianoGliss, pianoNote, type PianoOut } from '../../core/piano';
import { applause, cheer, clap, crash, groan, kick, ride, snare, upright, type BandOut } from '../../core/piano-band';
import type { BandEvent, Chart, ChartNote } from '../../game/minigames/piano-chart';
import type { Grade } from '../../game/minigames/piano';

// Piano Bar (doc 23): plays the tune against the game's song clock. The accompaniment is queued LOOKAHEAD s
// ahead on the audio clock at anchor + event time; the anchor follows the song clock (re-anchored on big drift,
// nudged on small). Band layers 1–3 fade with the band level; the right hand sounds only on hits.

const LOOKAHEAD = 0.25;
const RESYNC = 0.1;
const DECK_LEVEL = 1.15;
const VERB = 0.22;
/** Wrong-key smudge pitch per lane. */
const CLUNK = [70, 75, 80, 85] as const;

/** Deck output, the four band layers into it, and the reverb send (piano and crash). */
interface Rig { out: GainNode; layers: GainNode[]; send: GainNode; nodes: AudioNode[] }

export class PianoDeck {
  private rig: Rig | null = null;
  private anchor = 0;
  private cursor = 0;
  private level = -1;
  private ir: AudioBuffer | null = null;
  private noise: AudioBuffer | null = null;

  constructor(private readonly audio: AudioEngine, private readonly chart: Chart) {}

  private get ctx(): AudioContext | null {
    return this.audio.ready && this.audio.musicOut ? this.audio.context : null;
  }

  /** Once per tick: follow the song clock, set the band layers, queue the accompaniment ahead. */
  sync(time: number, level: number): void {
    const ctx = this.ctx;
    const bus = this.audio.musicOut;
    if (!ctx || !bus) return;
    const rig = this.rig ?? this.start(ctx, bus, time);
    const drift = ctx.currentTime - (this.anchor + time);
    if (Math.abs(drift) > RESYNC) this.seek(ctx, time);
    else this.anchor += drift * 0.02;
    this.setLevel(ctx, rig, level);
    const ev = this.chart.band;
    for (let e = ev[this.cursor]; e && e.t <= time + LOOKAHEAD; e = ev[++this.cursor]) {
      if (e.t >= time - 0.03) this.play(ctx, rig, e);
    }
  }

  /** A hit: early hits sound on the beat, late ones at once (ornaments delay the note a hair). */
  hit(n: ChartNote, grade: Grade): void {
    const ctx = this.ctx;
    const rig = this.rig;
    if (!ctx || !rig) return;
    const o = this.piano(ctx, rig, 0);
    const now = ctx.currentTime + 0.005;
    const lead = (n.grace !== null ? 0.03 : 0) + (n.gliss ? 0.09 : 0);
    const main = Math.max(this.at(ctx, n.t), now + lead);
    const vel = (grade === 'perfect' ? 0.95 : 0.78) * (n.gliss ? 1.15 : 1);
    if (n.gliss) pianoGliss(o, Math.max(now, main - 0.14), main - 0.02, Math.max(...n.pitches), vel);
    if (n.grace !== null) pianoNote(o, main - 0.03, n.grace, vel * 0.55, 0.05);
    for (const p of n.pitches) pianoNote(o, main, p, vel, n.dur);
  }

  wrong(lane: number): void {
    const ctx = this.ctx;
    if (ctx && this.rig) pianoClunk(this.piano(ctx, this.rig, 0), ctx.currentTime, CLUNK[lane] ?? 75);
  }

  crowd(kind: 'cheer' | 'groan' | 'applause', v = 1): void {
    const ctx = this.ctx;
    const rig = this.rig;
    if (!ctx || !rig) return;
    const o = this.band(ctx, rig, rig.out);
    const t = ctx.currentTime + 0.01;
    switch (kind) {
      case 'cheer': return cheer(o, t, v);
      case 'groan': return groan(o, t, v);
      case 'applause': return applause(o, t, v, 3);
      default: throw new Error(`unhandled: ${kind satisfies never}`);
    }
  }

  /** Fades out (pause, quit, round over); the next sync starts a fresh rig. */
  stop(): void {
    const ctx = this.audio.context;
    const rig = this.rig;
    this.rig = null;
    if (!ctx || !rig) return;
    const g = rig.out.gain;
    g.cancelScheduledValues(ctx.currentTime);
    g.setValueAtTime(g.value, ctx.currentTime);
    g.linearRampToValueAtTime(0, ctx.currentTime + 0.15);
    setTimeout(() => {
      for (const n of rig.nodes) n.disconnect();
    }, 700);
  }

  private start(ctx: AudioContext, bus: AudioNode, time: number): Rig {
    this.ir ??= impulse(ctx, 1.6);
    this.noise ??= whiteNoise(ctx);
    const out = gainNode(ctx, 0);
    out.gain.linearRampToValueAtTime(DECK_LEVEL, ctx.currentTime + 0.05);
    out.connect(bus);
    const conv = ctx.createConvolver();
    conv.buffer = this.ir;
    const send = gainNode(ctx, VERB);
    const ret = gainNode(ctx, 0.35);
    send.connect(conv).connect(ret).connect(out);
    const layers = [0, 1, 2, 3].map(() => gainNode(ctx, 0));
    for (const l of layers) l.connect(out);
    layers[0]?.gain.setValueAtTime(1, ctx.currentTime);
    this.rig = { out, layers, send, nodes: [out, conv, send, ret, ...layers] };
    this.level = -1;
    this.seek(ctx, time, true);
    return this.rig;
  }

  /** Re-anchors on the song clock; `fresh` (a new rig) restarts the queue there, otherwise events already
   *  queued are never queued again. */
  private seek(ctx: AudioContext, time: number, fresh = false): void {
    this.anchor = ctx.currentTime - time;
    const ev = this.chart.band;
    let i = 0;
    while (i < ev.length && (ev[i]?.t ?? Infinity) < time) i++;
    this.cursor = fresh ? i : Math.max(this.cursor, i);
  }

  /** Audio time for a song time, compensating the output latency, never in the past. */
  private at(ctx: AudioContext, t: number): number {
    const latency = clamp(ctx.outputLatency || 0, 0, 0.08);
    return Math.max(ctx.currentTime + 0.005, this.anchor + t - latency);
  }

  private setLevel(ctx: AudioContext, rig: Rig, level: number): void {
    if (level === this.level) return;
    this.level = level;
    rig.layers.forEach((g, i) => {
      if (i > 0) g.gain.setTargetAtTime(level >= i ? 1 : 0, ctx.currentTime, 0.1);
    });
  }

  private piano(ctx: AudioContext, rig: Rig, layer: number): PianoOut {
    return { ctx, dest: rig.layers[layer] ?? rig.out, verb: rig.send };
  }

  private band(ctx: AudioContext, rig: Rig, dest: AudioNode): BandOut {
    return { ctx, dest, noise: this.noise ?? whiteNoise(ctx), verb: rig.send };
  }

  private play(ctx: AudioContext, rig: Rig, e: BandEvent): void {
    const t = this.at(ctx, e.t);
    const dest = rig.layers[e.layer] ?? rig.out;
    const o = this.band(ctx, rig, dest);
    switch (e.inst) {
      case 'piano': {
        const p = this.piano(ctx, rig, 0);
        for (const m of e.notes) pianoNote(p, t, m, e.v * 0.9, e.dur);
        return;
      }
      case 'kick': return kick(o, t, e.v);
      case 'snare': return snare(o, t, e.v);
      case 'ride': return ride(o, t, e.v);
      case 'crash': return crash(o, t, e.v);
      case 'bass': return upright(o, t, e.notes[0] ?? 24, e.v, e.dur);
      case 'clap': return clap(o, t, e.v);
      default: throw new Error(`unhandled: ${e.inst satisfies never}`);
    }
  }
}
