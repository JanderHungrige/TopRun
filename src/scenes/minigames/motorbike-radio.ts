import type { AudioEngine } from '../../core/audio';
import { lineDuration, mouthOpen, syllableIndex, typewriter, typingTime } from '../../game/dialogue';
import { mt } from '../../i18n/minigame-text';
import { MOTORBIKE_TEXT, type MotorbikeKey } from '../../i18n/minigames/motorbike';
import type { RadioView } from '../../render/minigames/formation-radio';
import type { Mood } from '../../render/portraits';

// Motorbike vs. Jet (doc 22): Duke on the radio from the cockpit — one line per race moment, typed out with
// push-to-talk clicks and voice syllables (the Formation Flying strip, doc 14).

export type BikeCall = 'start' | 'lead' | 'closing' | 'pass' | 'crash' | 'truck' | 'rotate' | 'win' | 'lose';

const CALL: Readonly<Record<BikeCall, { key: MotorbikeKey; mood: Mood; urgent: boolean }>> = {
  start: { key: 'callStart', mood: 'happy', urgent: false },
  lead: { key: 'callLead', mood: 'neutral', urgent: false },
  closing: { key: 'callClosing', mood: 'happy', urgent: false },
  pass: { key: 'callPass', mood: 'happy', urgent: false },
  crash: { key: 'callCrash', mood: 'worried', urgent: true },
  truck: { key: 'callTruck', mood: 'stern', urgent: true },
  rotate: { key: 'callRotate', mood: 'neutral', urgent: true },
  win: { key: 'callWin', mood: 'happy', urgent: true },
  lose: { key: 'callLose', mood: 'happy', urgent: true },
};
/** Calls that may come more than once (with a cooldown). */
const REPEAT: ReadonlySet<BikeCall> = new Set(['crash']);
const COOLDOWN = 6;
/** A routine call never cuts a line younger than this. */
const BUSY = 1.4;

interface Line {
  text: string;
  age: number;
  mood: Mood;
}

export class BikeRadio {
  private line: Line | null = null;
  private readonly said = new Set<BikeCall>();
  private cool = 0;
  private clock = 0;
  private lastSyllable = -1;

  constructor(private readonly audio: AudioEngine, private readonly label: string, private readonly callsign: string) {}

  /** Says a call unless it was said already (or is cooling down) or a fresh line is still on. */
  say(call: BikeCall): void {
    const c = CALL[call];
    if (this.said.has(call) && !(REPEAT.has(call) && this.cool <= 0)) return;
    if (!c.urgent && this.line && this.line.age < BUSY) return;
    this.said.add(call);
    if (REPEAT.has(call)) this.cool = COOLDOWN;
    this.line = { text: mt(MOTORBIKE_TEXT, c.key, { callsign: this.callsign }), age: 0, mood: c.mood };
    this.lastSyllable = -1;
    this.audio.play('radioClick', { volume: 0.55 });
  }

  update(dt: number): void {
    this.clock += dt;
    this.cool = Math.max(0, this.cool - dt);
    const l = this.line;
    if (!l) return;
    l.age += dt;
    if (l.age >= lineDuration(l.text)) {
      this.line = null;
      this.audio.play('radioClick', { volume: 0.3 });
      return;
    }
    if (l.age >= typingTime(l.text)) return;
    const syl = syllableIndex(l.age);
    if (syl === this.lastSyllable) return;
    this.lastSyllable = syl;
    if (/[\p{L}\p{N}]/u.test(typewriter(l.text, l.age).slice(-1))) {
      this.audio.play('radioVoice', { pitch: 1.05 * (0.94 + Math.random() * 0.12), volume: 0.5 });
    }
  }

  view(): RadioView | null {
    const l = this.line;
    if (!l) return null;
    const talking = l.age < typingTime(l.text);
    return {
      label: this.label, full: l.text, shown: typewriter(l.text, l.age), age: l.age, life: lineDuration(l.text),
      mouth: mouthOpen(this.clock, talking), mood: l.mood, t: this.clock,
    };
  }
}
