import type { AudioEngine } from '../core/audio';
import type { Input } from '../core/input';
import { HOLD_AFTER_TYPING, mouthOpen, syllableIndex, typewriter, typingTime } from '../game/dialogue';
import type { LineRef } from '../game/dialogue-scripts';
import type { GameContext } from '../game/state';
import { line, type Params } from '../i18n/i18n';
import { drawPortrait, type Box, type CharacterId, type Gesture, type Mood } from '../render/portraits';
import { paragraph, text, wrap } from '../render/text';
import { hit } from './widgets';

// One talking character slot: portrait + speech bubble + voice (doc 06).

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
    ctx.save();
    ctx.globalAlpha = this.appear;
    const p = this.layout.portrait;
    drawPortrait(ctx, speaker, p, {
      t: this.clock, mouth: mouthOpen(this.clock, talking), mood: this.mood,
      gesture: this.gesture, radio: this.layout.style === 'radio',
    });
    if (c) this.renderBubble(ctx, c);
    ctx.restore();
  }

  private renderBubble(ctx: CanvasRenderingContext2D, c: Current): void {
    const b = this.layout.bubble;
    const radio = this.layout.style === 'radio';
    ctx.beginPath();
    ctx.roundRect(b.x, b.y, b.w, b.h, radio ? 6 : 14);
    ctx.fillStyle = radio ? 'rgba(6,22,18,0.88)' : '#f6f1e4';
    ctx.fill();
    ctx.lineWidth = radio ? 1.5 : 3;
    ctx.strokeStyle = radio ? 'rgba(120,255,200,0.6)' : '#1b2430';
    ctx.stroke();
    if (!radio) this.renderTail(ctx, b);
    const nameColor = radio ? '#7dffc8' : '#b02a2a';
    text(ctx, SPEAKER_NAMES[c.ref.speaker], b.x + 14, b.y + 20, { size: 12, display: true, color: nameColor, letterSpacing: 1 });
    const shown = typewriter(c.text, c.t);
    const size = this.fitSize(ctx, c.text, b);
    paragraph(ctx, shown, b.x + 14, b.y + 26 + size, b.w - 28, {
      size, weight: 600, color: radio ? '#c9ffe6' : '#1b2430', lineHeight: Math.round(size * 1.3),
    });
  }

  /** Shrinks the font until the full line fits the bubble. */
  private fitSize(ctx: CanvasRenderingContext2D, full: string, b: Box): number {
    for (let size = this.layout.fontSize; size > 10; size -= 1) {
      const lines = wrap(ctx, full, b.w - 28, size).length;
      if (26 + size + (lines - 1) * size * 1.3 + 8 <= b.h) return size;
    }
    return 10;
  }

  private renderTail(ctx: CanvasRenderingContext2D, b: Box): void {
    const p = this.layout.portrait;
    const tailY = Math.min(b.y + b.h - 18, Math.max(b.y + 18, p.y + p.h * 0.35));
    const fromLeft = p.x + p.w <= b.x;
    const bx = fromLeft ? b.x : b.x + b.w;
    const tip = fromLeft ? bx - 18 : bx + 18;
    ctx.beginPath();
    ctx.moveTo(bx + (fromLeft ? 2 : -2), tailY - 10);
    ctx.lineTo(tip, tailY + 4);
    ctx.lineTo(bx + (fromLeft ? 2 : -2), tailY + 10);
    ctx.closePath();
    ctx.fillStyle = '#f6f1e4';
    ctx.fill();
    ctx.strokeStyle = '#1b2430';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillRect(bx + (fromLeft ? 0 : -3), tailY - 8, 3, 16);
  }
}

