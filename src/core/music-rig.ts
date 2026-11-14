import { gainNode } from './audio-nodes';

/** Per-deck output and effect buses; `nodes` are disconnected once the deck has faded out. `conv` is the reverb's
 *  convolver while it has one (the lite sound budget drops it, doc 01, bug B1). */
export interface Rig { out: GainNode; echo: GainNode; verb: GainNode; nodes: AudioNode[]; conv: ConvolverNode | null }

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

/** The reverb send into a convolver; without an impulse the send leads nowhere (no reverb, no cost). */
function reverb(ctx: AudioContext, out: AudioNode, ir: AudioBuffer | null, nodes: AudioNode[]): { send: GainNode; conv: ConvolverNode | null } {
  const send = gainNode(ctx, 1);
  nodes.push(send);
  if (!ir) return { send, conv: null };
  const conv = ctx.createConvolver();
  const ret = gainNode(ctx, REVERB_RETURN);
  conv.buffer = ir;
  send.connect(conv).connect(ret).connect(out);
  nodes.push(conv, ret);
  return { send, conv };
}

/** Builds a deck's buses into `bus`, fading in over `fadeIn` s; `ir` null = no reverb. */
export function createRig(ctx: AudioContext, bus: AudioNode, ir: AudioBuffer | null, echoTime: number, fadeIn: number): Rig {
  const now = ctx.currentTime;
  const out = ctx.createGain();
  out.gain.setValueAtTime(0, now);
  out.gain.linearRampToValueAtTime(DECK_LEVEL, now + fadeIn);
  out.connect(bus);
  const nodes: AudioNode[] = [out];
  const verb = reverb(ctx, out, ir, nodes);
  return { out, echo: echo(ctx, out, echoTime, nodes), verb: verb.send, nodes, conv: verb.conv };
}

/** Takes the reverb out of a playing deck: its convolver stops working, the notes' sends lead nowhere. */
export function dropReverb(rig: Rig): void {
  rig.verb.disconnect();
  rig.conv?.disconnect();
  rig.conv = null;
}
