import type { AudioEngine } from '../../core/audio';
import { lineDuration, syllableIndex, typewriter, typingTime } from '../../game/dialogue';
import type { LandingState } from '../../game/minigames/landing';
import { lsoStep, NEW_LSO, type LsoCall, type LsoMemo } from '../../game/minigames/landing-lso';
import { mt } from '../../i18n/minigame-text';
import { LANDING_TEXT, type LandingKey } from '../../i18n/minigames/landing';
import type { RadioView } from '../../render/minigames/landing-panel';

// Carrier Landing (doc 18): Paddles on the radio — the LSO's calls from lsoStep plus the event calls (wave-off,
// bolter, welcome aboard), typed out with a push-to-talk click and voice syllables.

const CALL: Readonly<Record<LsoCall, LandingKey>> = {
  rogerBall: 'callRogerBall', power: 'callPower', high: 'callHigh', right: 'callRight', left: 'callLeft',
  fast: 'callFast', easy: 'callEasy', nice: 'callNice',
};

export type EventCall = 'waveoff' | 'bolter' | 'welcome';
const EVENT: Readonly<Record<EventCall, LandingKey>> = { waveoff: 'callWaveoff', bolter: 'callBolter', welcome: 'callWelcome' };

interface Line {
  text: string;
  age: number;
  urgent: boolean;
}

export class PaddlesRadio {
  private line: Line | null = null;
  private memo: LsoMemo = NEW_LSO;
  private lastSyllable = -1;

  constructor(private readonly audio: AudioEngine, private readonly label: string, private readonly callsign: string) {}

  /** Routine calls while Paddles talks the pass down. */
  update(s: LandingState, dt: number): void {
    const r = lsoStep(this.memo, s, dt);
    this.memo = r.memo;
    if (r.call && !this.line?.urgent) this.say(CALL[r.call], false);
    this.tick(dt);
  }

  /** Event calls cut in at once. */
  call(e: EventCall): void {
    this.say(EVENT[e], e !== 'welcome');
  }

  private say(key: LandingKey, urgent: boolean): void {
    this.line = { text: mt(LANDING_TEXT, key, { callsign: this.callsign }), age: 0, urgent };
    this.lastSyllable = -1;
    this.audio.play('radioClick', { volume: 0.6 });
  }

  private tick(dt: number): void {
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
      this.audio.play('radioVoice', { pitch: (l.urgent ? 0.95 : 0.78) + ((syl * 37) % 10) / 60, volume: l.urgent ? 0.5 : 0.4 });
    }
  }

  /** Keeps a line typing while the round is between passes (no routine calls). */
  idle(dt: number): void {
    this.tick(dt);
  }

  view(t: number): RadioView | null {
    const l = this.line;
    if (!l) return null;
    return { label: this.label, full: l.text, shown: typewriter(l.text, l.age), age: l.age, life: lineDuration(l.text), urgent: l.urgent, t };
  }
}
