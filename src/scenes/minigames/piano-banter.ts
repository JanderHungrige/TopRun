import type { AudioEngine } from '../../core/audio';
import { mouthOpen, syllableIndex, typewriter, typingTime } from '../../game/dialogue';
import { mt } from '../../i18n/minigame-text';
import { PIANO_TEXT, type PianoKey } from '../../i18n/minigames/piano';
import type { BanterView } from '../../render/minigames/piano-banter';
import type { CharacterId, Mood } from '../../render/portraits';
import { SPEAKER_NAMES } from '../../ui/speech';

// Piano Bar (doc 23): the squadron's banter between the song's sections, a couple of reactions and the
// end line — typed out in the retro RPG box with voice blips. Lines queue; a stale one is dropped.

export type BanterId = 'bandIn' | 'break' | 'stopTime' | 'combo' | 'drums' | 'encore' | 'nice' | 'tough';

interface Line { speaker: CharacterId; key: PianoKey; mood: Mood }

const LINES: Readonly<Record<BanterId, Line>> = {
  bandIn: { speaker: 'wingman', key: 'bBandIn', mood: 'happy' },
  break: { speaker: 'chief', key: 'bBreak', mood: 'happy' },
  stopTime: { speaker: 'admiral', key: 'bStopTime', mood: 'stern' },
  combo: { speaker: 'shooter', key: 'bCombo', mood: 'happy' },
  drums: { speaker: 'chief', key: 'bDrums', mood: 'worried' },
  encore: { speaker: 'shooter', key: 'bEncore', mood: 'happy' },
  nice: { speaker: 'wingman', key: 'bNice', mood: 'happy' },
  tough: { speaker: 'chief', key: 'bTough', mood: 'worried' },
};

const PITCH: Readonly<Record<CharacterId, number>> = { admiral: 0.85, chief: 0.75, shooter: 1.3, wingman: 1.05 };
/** A queued line older than this is dropped. */
const STALE = 2.5;
/** Lines stay up longer than in dialogue scenes: the player glances at them between notes. */
const life = (text: string): number => typingTime(text) + 2.6;

interface Spoken { line: Line; text: string; age: number }

export class PianoBanter {
  private now: Spoken | null = null;
  private queue: { id: BanterId; waited: number }[] = [];
  private lastSyllable = -1;

  constructor(private readonly audio: AudioEngine, private readonly callsign: string) {}

  say(id: BanterId, interrupt = false): void {
    if (interrupt) {
      this.now = null;
      this.queue = [];
    }
    this.queue.push({ id, waited: 0 });
  }

  update(dt: number): void {
    for (const q of this.queue) q.waited += dt;
    this.queue = this.queue.filter((q) => q.waited < STALE);
    if (this.now && this.now.age >= life(this.now.text)) this.now = null;
    if (!this.now) this.next();
    const s = this.now;
    if (!s) return;
    s.age += dt;
    if (s.age >= typingTime(s.text)) return;
    const syl = syllableIndex(s.age);
    if (syl === this.lastSyllable) return;
    this.lastSyllable = syl;
    if (/[\p{L}\p{N}]/u.test(typewriter(s.text, s.age).slice(-1))) {
      this.audio.play('voice', { pitch: PITCH[s.line.speaker] * (0.94 + ((syl * 37) % 12) / 100), volume: 0.32 });
    }
  }

  private next(): void {
    const q = this.queue.shift();
    if (!q) return;
    const line = LINES[q.id];
    this.now = { line, text: mt(PIANO_TEXT, line.key, { callsign: this.callsign }), age: 0 };
    this.lastSyllable = -1;
  }

  view(t: number): BanterView | null {
    const s = this.now;
    if (!s) return null;
    const talking = s.age < typingTime(s.text);
    return {
      speaker: s.line.speaker, name: SPEAKER_NAMES[s.line.speaker], full: s.text, shown: typewriter(s.text, s.age).length,
      age: s.age, life: life(s.text), mouth: mouthOpen(t, talking), mood: s.line.mood, t,
    };
  }
}
