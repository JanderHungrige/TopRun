import { gainNode } from './audio-nodes';

/** Per-deck output and effect buses; `nodes` are disconnected once the deck has faded out. */
export interface Rig { out: GainNode; echo: GainNode; verb: GainNode; nodes: AudioNode[] }

const REVERB_RETURN = 0.3;
/** Deck output level (matches the perceived loudness of the previous soundtrack). */
const DECK_LEVEL = 1.1;

/** Generated stereo plate-like impulse: dense noise with an exponential decay that darkens. */
export function impulse(ctx: BaseAudioContext, seconds: number): AudioBuffer {
  const rate = ctx.sampleRate;
  const len = Math.max(1, Math.floor(rate * seconds));
  const buf = ctx.createBuffer(2, len, rate);
  for (let c = 0; c < 2; c++) {
    const d = buf.getChannelData(c);
    let lp = 0;
    for (let i = 0; i < len; i++) {
      const x = i / len;
      lp += (0.7 - 0.5 * x) * (Math.random() * 2 - 1 - lp);
      d[i] = lp * Math.exp(-6.9 * x) * Math.min(1, i / (rate * 0.008));
    }
  }
  return buf;
}

/** Dotted-8th feedback echo into `out`; returns the send. */
function echo(ctx: AudioContext, out: AudioNode, time: number, nodes: AudioNode[]): GainNode {
  const send = gainNode(ctx, 1);
  const delay = ctx.createDelay(1);
  const tone = ctx.createBiquadFilter();
  const feedback = gainNode(ctx, 0.32);
  delay.delayTime.value = Math.min(0.95, time);
  tone.frequency.value = 2400;
  send.connect(delay).connect(tone).connect(feedback).connect(delay);
  tone.connect(out);
  nodes.push(send, delay, tone, feedback);
  return send;
}

function reverb(ctx: AudioContext, out: AudioNode, ir: AudioBuffer, nodes: AudioNode[]): GainNode {
  const send = gainNode(ctx, 1);
  const conv = ctx.createConvolver();
  const ret = gainNode(ctx, REVERB_RETURN);
  conv.buffer = ir;
  send.connect(conv).connect(ret).connect(out);
  nodes.push(send, conv, ret);
  return send;
}

/** Builds a deck's buses into `bus`, fading in over `fadeIn` s. */
export function createRig(ctx: AudioContext, bus: AudioNode, ir: AudioBuffer, echoTime: number, fadeIn: number): Rig {
  const now = ctx.currentTime;
  const out = ctx.createGain();
  out.gain.setValueAtTime(0, now);
  out.gain.linearRampToValueAtTime(DECK_LEVEL, now + fadeIn);
  out.connect(bus);
  const nodes: AudioNode[] = [out];
  return { out, echo: echo(ctx, out, echoTime, nodes), verb: reverb(ctx, out, ir, nodes), nodes };
}
