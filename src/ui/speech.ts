import type { AudioEngine } from '../core/audio';
import type { Input } from '../core/input';
import { HOLD_AFTER_TYPING, mouthOpen, syllableIndex, typewriter, typingTime } from '../game/dialogue';
import type { LineRef } from '../game/dialogue-scripts';
import type { GameContext } from '../game/state';
import { line, type Params } from '../i18n/i18n';
import { drawPortrait, type Box, type CharacterId, type Gesture, type Mood } from '../render/portraits';
import { frameAround, moreArrow, NAME_PLATE, PORTRAIT_FRAME, pixelFrame, RADIO_BOX, RPG_BOX } from '../render/pixel/frame';
import { setFont, text, wrap } from '../render/text';
import { typedLines } from '../render/typed-text';
import { hit } from './widgets';

// One talking character slot: framed pixel portrait + retro RPG text box (or radio strip) + voice (doc 06, doc 20).

/** The active pilot's callsign for {callsign} in spoken lines. */
export const pilotContext = (game: Pick<GameContext, 'profile'>) => (): Params => ({ callsign: game.profile?.callsign ?? 'PILOT' });

export const SPEAKER_NAMES: Readonly<Record<CharacterId, string>> = {
  admiral: 'ADM. "ACE" KINCAID',
  chief: 'CHIEF "WRENCH" KOWALSKI',
  shooter: 'LT. SAM "SHOOTER" REYES',
  wingman: 'LT. "DUKE" CARTER',
};

const VOICE: Readonly<Record<CharacterId, { pitch: number; radio: boolean }>> = {
  admiral: { pitch: 0.85, radio: false },
  chief: { pitch: 0.75, radio: false },
  shooter: { pitch: 1.3, radio: false },
  wingman: { pitch: 1.05, radio: true },
};

export interface SpeechLayout {
  portrait: Box;
  bubble: Box;
  /** Text size; the box shrinks it further if a long (German) line would not fit. */
  fontSize: number;
  style: 'comic' | 'radio';
  /** Keep the portrait on screen while silent (debrief, hangar). */
  persistent: boolean;
}

interface Current {
  ref: LineRef;
  text: string;
  t: number;
}

export class SpeechBox {
  private queue: LineRef[] = [];
  private current: Current | null = null;
  private counter = 0;
  private lastSyllable = -1;
  private appear = 0;
  private mood: Mood = 'neutral';
  private gesture: Gesture = 'none';
  private clock = 0;

  constructor(
    private readonly audio: AudioEngine,
    public layout: SpeechLayout,
    private readonly idleSpeaker: CharacterId,
    /** Params every line may use, e.g. the pilot's {callsign} (doc 08). */
    private readonly context: () => Params = () => ({}),
  ) {}

  get busy(): boolean {
    return this.current !== null || this.queue.length > 0;
  }

  /** Queue lines; `interrupt` drops whatever is being said. */
  say(lines: LineRef | readonly LineRef[], interrupt = false): void {
    const list = Array.isArray(lines) ? [...lines] : [lines as LineRef];
    if (interrupt) {
      this.queue = list;
      this.current = null;
    } else {
      this.queue.push(...list);
    }
  }

  private next(): void {
    const ref = this.queue.shift();
    if (!ref) {
      this.current = null;
      return;
    }
    this.counter += 1;
    this.current = { ref, text: line(ref.key, { ...this.context(), ...ref.params }, this.counter + this.clock * 7), t: 0 };
    this.mood = ref.mood;
    this.gesture = ref.gesture;
    this.lastSyllable = -1;
    if (VOICE[ref.speaker].radio) this.audio.play('radioClick', { volume: 0.5 });
  }

  update(dt: number, input?: Input): void {
    this.clock += dt;
    if (!this.current && this.queue.length > 0) this.next();
    const visible = this.layout.persistent || this.current !== null;
    this.appear = Math.max(0, Math.min(1, this.appear + (visible ? dt : -dt) * 5));
    const c = this.current;
    if (!c) return;
    c.t += dt;
    const typing = typingTime(c.text);
    if (input) this.handleTaps(input, c, typing);
    if (c.t < typing) this.blip(c);
    if (c.t >= typing + HOLD_AFTER_TYPING) {
      if (VOICE[c.ref.speaker].radio && this.queue.length === 0) this.audio.play('radioClick', { volume: 0.4 });
      this.gesture = 'none';
      this.next();
    }
  }

  private handleTaps(input: Input, c: Current, typing: number): void {
    if (!input.taps.some((p) => hit(p, this.layout.bubble) || hit(p, this.layout.portrait))) return;
    if (c.t < typing) c.t = typing;
    else c.t = typing + HOLD_AFTER_TYPING;
  }

  private blip(c: Current): void {
    const syl = syllableIndex(c.t);
    if (syl === this.lastSyllable) return;
    this.lastSyllable = syl;
    const shown = typewriter(c.text, c.t);
    const ch = shown.charAt(shown.length - 1);
    if (!/[\p{L}\p{N}]/u.test(ch)) return;
    const v = VOICE[c.ref.speaker];
    this.audio.play(v.radio ? 'radioVoice' : 'voice', { pitch: v.pitch * (0.94 + Math.random() * 0.12), volume: 0.55 });
  }

  render(ctx: CanvasRenderingContext2D): void {
    if (this.appear <= 0) return;
    const c = this.current;
    const talking = c !== null && c.t < typingTime(c.text);
    const speaker = c?.ref.speaker ?? this.idleSpeaker;
    const radio = this.layout.style === 'radio';
    const p = this.layout.portrait;
    ctx.save();
    ctx.globalAlpha = this.appear;
    frameAround(ctx, p, radio ? RADIO_BOX : PORTRAIT_FRAME, radio ? 1 : 2);
    drawPortrait(ctx, speaker, p, { t: this.clock, mouth: mouthOpen(this.clock, talking), mood: this.mood, gesture: this.gesture, radio });
    if (c) this.renderBox(ctx, c, talking);
    ctx.restore();
  }

  /** Retro RPG text box (or the green radio strip): frame, name, typed lines, block cursor, "more" arrow. */
  private renderBox(ctx: CanvasRenderingContext2D, c: Current, typing: boolean): void {
    const b = this.layout.bubble;
    const radio = this.layout.style === 'radio';
    const look = radio ? RADIO_LOOK : RPG_LOOK;
    const size = this.fitSize(ctx, c.text, b, look);
    pixelFrame(ctx, b, radio ? RADIO_BOX : RPG_BOX, radio ? 1 : 2);
    if (radio) text(ctx, SPEAKER_NAMES[c.ref.speaker], b.x + look.pad, b.y + 18, { size: 12, type: true, weight: 700, color: look.name });
    else namePlate(ctx, b, SPEAKER_NAMES[c.ref.speaker], look);
    const lines = wrap(ctx, c.text, b.w - look.pad * 2, size, true);
    const blinkOn = Math.floor(this.clock * 3.4) % 2 === 0;
    typedLines(ctx, lines, typewriter(c.text, c.t).length, b.x + look.pad, b.y + look.top + size, {
      size, color: look.text, lineHeight: lineHeight(size), cursor: blinkOn ? look.cursor : null,
    });
    if (!typing && this.queue.length > 0) moreArrow(ctx, b.x + b.w - 20, b.y + b.h - 18, look.cursor, this.clock);
  }

  /** Shrinks the font until the full line fits the box. */
  private fitSize(ctx: CanvasRenderingContext2D, full: string, b: Box, look: BoxLook): number {
    for (let size = this.layout.fontSize; size > 11; size -= 1) {
      const lines = wrap(ctx, full, b.w - look.pad * 2, size, true).length;
      if (look.top + size + (lines - 1) * lineHeight(size) + 10 <= b.h) return size;
    }
    return 11;
  }
}

interface BoxLook { pad: number; top: number; text: string; cursor: string; name: string }

const RPG_LOOK: BoxLook = { pad: 18, top: 13, text: '#f3ead2', cursor: '#ffd76a', name: '#ffd76a' };
const RADIO_LOOK: BoxLook = { pad: 14, top: 24, text: '#c9ffe6', cursor: '#7dffc8', name: '#7dffc8' };
const lineHeight = (size: number): number => Math.round(size * 1.3);

/** Gold name plate sitting on the box's top edge. */
function namePlate(ctx: CanvasRenderingContext2D, b: Box, name: string, look: BoxLook): void {
  const size = 13;
  ctx.save();
  setFont(ctx, size, false, 700, false, true);
  const w = ctx.measureText(name).width;
  ctx.restore();
  const plate = { x: b.x + 12, y: b.y - 12, w: w + 32, h: 24 };
  pixelFrame(ctx, plate, NAME_PLATE, 2);
  text(ctx, name, plate.x + 16, plate.y + 16.5, { size, type: true, weight: 700, color: look.name });
}
