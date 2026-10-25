import type { AudioEngine } from '../../core/audio';
import { lineDuration, mouthOpen, syllableIndex, typewriter, typingTime } from '../../game/dialogue';
import { medalFor } from '../../game/minigames/core';
import { CROWD_R, finalScore, FORMATION_MEDALS, type FormationState } from '../../game/minigames/formation';
import { callsBetween, SHOW_END, SHOW_START, type CallId } from '../../game/minigames/formation-script';
import { mt } from '../../i18n/minigame-text';
import { FORMATION_TEXT, type FormationKey } from '../../i18n/minigames/formation';
import type { RadioView } from '../../render/minigames/formation-radio';
import type { Mood } from '../../render/portraits';

// Formation Flying (doc 14): Duke on the radio — the scripted calls of the routine plus chirps about your flying.

type Scripted = Exclude<CallId, 'end'>;
const CALL: Readonly<Record<Scripted, { key: FormationKey; mood: Mood }>> = {
  join: { key: 'callJoin', mood: 'neutral' },
  showStart: { key: 'callShowStart', mood: 'happy' },
  weaves: { key: 'callWeaves', mood: 'neutral' },
  powerBack: { key: 'callPowerBack', mood: 'neutral' },
  powerUp: { key: 'callPowerUp', mood: 'stern' },
  turn: { key: 'callTurn', mood: 'stern' },
  pitchCall: { key: 'callPitchCall', mood: 'neutral' },
  pitchNow: { key: 'callPitchNow', mood: 'stern' },
  smokeOn: { key: 'callSmokeOn', mood: 'happy' },
  smokeOff: { key: 'callSmokeOff', mood: 'happy' },
};
const TIGHTEN: readonly FormationKey[] = ['callTighten1', 'callTighten2', 'callTighten3'];
const NICE: readonly FormationKey[] = ['callNice1', 'callNice2'];
/** Seconds out of the slot before "Tighten up!", seconds tight before "Looking good". */
const OUT_CALL = 1;
const NICE_AFTER = 8;
const COOLDOWN = { tighten: 5, crowd: 5, nice: 12 };
/** A chirp never cuts a line shorter than this. */
const BUSY = 1.6;

interface Line {
  text: string;
  age: number;
  mood: Mood;
  scripted: boolean;
}

export class DukeRadio {
  private line: Line | null = null;
  private readonly cool = { tighten: 0, crowd: 0, nice: 0 };
  private tightens = 0;
  private nices = 0;
  private lastSyllable = -1;
  private clock = 0;

  constructor(private readonly audio: AudioEngine, private readonly label: string, private readonly callsign: string) {}

  update(prev: FormationState, s: FormationState, dt: number): void {
    this.clock += dt;
    this.cool.tighten = Math.max(0, this.cool.tighten - dt);
    this.cool.crowd = Math.max(0, this.cool.crowd - dt);
    this.cool.nice = Math.max(0, this.cool.nice - dt);
    const calls = callsBetween(prev.t, s.t);
    for (const id of calls) this.scripted(id, s);
    if (calls.length === 0) this.chirp(s);
    this.tick(dt);
  }

  private scripted(id: CallId, s: FormationState): void {
    if (id !== 'end') return this.say(CALL[id].key, CALL[id].mood, true);
    const medal = medalFor(finalScore(s), FORMATION_MEDALS, true);
    if (medal === 'gold') return this.say('callEndGood', 'happy', true);
    return medal ? this.say('callEndOk', 'neutral', true) : this.say('callEndBad', 'worried', true);
  }

  private chirp(s: FormationState): void {
    const w = s.wings[0];
    if (!w || s.t <= SHOW_START || s.t > SHOW_END) return;
    const l = this.line;
    if (l && (l.age < BUSY || (l.scripted && l.age < lineDuration(l.text)))) return;
    if (w.outT >= OUT_CALL && this.cool.tighten <= 0) {
      this.cool.tighten = COOLDOWN.tighten;
      return this.say(TIGHTEN[this.tightens++ % TIGHTEN.length] ?? 'callTighten1', 'stern', false);
    }
    if (w.leadDist < CROWD_R && this.cool.crowd <= 0) {
      this.cool.crowd = COOLDOWN.crowd;
      return this.say('callCrowd', 'worried', false);
    }
    if (w.innerT >= NICE_AFTER && this.cool.nice <= 0) {
      this.cool.nice = COOLDOWN.nice;
      this.say(NICE[this.nices++ % NICE.length] ?? 'callNice1', 'happy', false);
    }
  }

  private say(key: FormationKey, mood: Mood, scripted: boolean): void {
    this.line = { text: mt(FORMATION_TEXT, key, { callsign: this.callsign }), age: 0, mood, scripted };
    this.lastSyllable = -1;
    this.audio.play('radioClick', { volume: 0.55 });
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
