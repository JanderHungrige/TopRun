import type { AudioEngine } from '../../core/audio';
import { lineDuration, mouthOpen, syllableIndex, typewriter, typingTime } from '../../game/dialogue';
import type { PointReason, VbEvent, VbState } from '../../game/minigames/volleyball';
import { matchPoint, matchWinner, type Team } from '../../game/minigames/volleyball-score';
import { mt } from '../../i18n/minigame-text';
import { VB_TEXT } from '../../i18n/minigames/volleyball';
import { VB_LINES, type VbLineKey } from '../../i18n/minigames/volleyball-lines';
import type { PersonLook } from '../../render/people';
import type { BoxView, Speaker } from '../../render/minigames/volleyball-box';

// Beach Volleyball (doc 21): who says what — the start, most points, match points and the end — typed out
// in the RPG text box with voice syllables. Presentation only; the rules never read it.

const speakerOf = (k: VbLineKey): Speaker => (k.startsWith('duke') ? 'duke' : k.startsWith('breaker') ? 'breaker' : 'riptide');
const PITCH: Readonly<Record<Speaker, number>> = { duke: 1.05, breaker: 0.78, riptide: 1.22 };
const NAME = { duke: 'nameDuke', breaker: 'nameBreaker', riptide: 'nameRiptide' } as const;
const KILLS = ['dukeKill1', 'dukeKill2', 'dukeKill3'] as const;
const LOSSES = ['dukeLost1', 'dukeDrop', 'dukeLost2'] as const;

/** The line for a point, or null to stay quiet. */
function pointLine(team: Team, reason: PointReason, by: string | null, n: number): VbLineKey | null {
  const home = team === 'home';
  switch (reason) {
    case 'kill':
      if (home) return by === 'duke' ? 'dukeOwn' : KILLS[n % 3] ?? 'dukeKill1';
      return by === 'breaker' ? 'breakerKill' : 'riptideKill';
    case 'ace': return home ? 'dukeAce' : 'riptideAce';
    case 'block': return home ? 'dukeBlock' : 'breakerBlock';
    case 'out': return home ? 'dukeTheirOut' : n % 2 ? 'dukeOut1' : 'dukeOut2';
    case 'net': return home ? 'breakerLost' : 'dukeNet';
    case 'fault': return home ? 'riptideLost' : 'dukeFault';
    case 'drop': return home ? (n % 2 ? 'breakerLost' : 'riptideLost') : LOSSES[n % 3] ?? 'dukeDrop';
    default: throw new Error(`unhandled: ${reason satisfies never}`);
  }
}

interface Line { key: VbLineKey; text: string; age: number }

export class Banter {
  private line: Line | null = null;
  private queue: VbLineKey[] = [];
  private lastSyllable = -1;
  private n = 0;

  constructor(private readonly audio: AudioEngine, private readonly callsign: string, private readonly looks: Readonly<Record<Speaker, PersonLook>>) {}

  private say(keys: readonly VbLineKey[], interrupt = true): void {
    if (interrupt) this.line = null;
    this.queue = interrupt ? [...keys] : [...this.queue, ...keys];
  }

  onEvents(events: readonly VbEvent[], s: VbState): void {
    for (const e of events) {
      if (e.type === 'serve' && s.rally === 1) this.say(['dukeStart1', 'breakerStart']);
      if (e.type === 'serve' && s.rally === 2) this.say(['riptideStart'], false);
      if (e.type === 'serve' && s.rally === 3 && s.order.team === 'away') this.say(['dukeStart2'], false);
      if (e.type === 'over') this.say(e.winner === 'home' ? ['dukeWin', 'riptideLose'] : ['breakerWin', 'dukeLose']);
      if (e.type === 'point') this.onPoint(e.team, e.reason, e.by, s);
    }
  }

  private onPoint(team: Team, reason: PointReason, by: string | null, s: VbState): void {
    if (matchWinner(s.score)) return;
    if (matchPoint(s.score, 'home')) return this.say(['dukeMatch']);
    if (matchPoint(s.score, 'away')) return this.say(['dukeTheirMatch']);
    const n = this.n++;
    const special = reason === 'ace' || reason === 'block';
    if (!special && n % 4 === 3) return;
    const key = pointLine(team, reason, by, n);
    if (key) this.say([key]);
  }

  update(dt: number): void {
    if (!this.line) {
      const key = this.queue.shift();
      if (!key) return;
      this.line = { key, text: mt(VB_LINES, key, { callsign: this.callsign }), age: 0 };
      this.lastSyllable = -1;
    }
    const l = this.line;
    l.age += dt;
    if (l.age >= lineDuration(l.text) + 0.3) {
      this.line = null;
      return;
    }
    if (l.age >= typingTime(l.text)) return;
    const syl = syllableIndex(l.age);
    if (syl === this.lastSyllable) return;
    this.lastSyllable = syl;
    if (/[\p{L}\p{N}]/u.test(typewriter(l.text, l.age).slice(-1))) {
      this.audio.play('voice', { pitch: PITCH[speakerOf(l.key)] + ((syl * 37) % 10) / 60, volume: 0.32 });
    }
  }

  view(t: number): BoxView | null {
    const l = this.line;
    if (!l) return null;
    const speaker = speakerOf(l.key);
    const typing = l.age < typingTime(l.text);
    const life = lineDuration(l.text) + 0.3;
    const good = l.key !== 'dukeTheirMatch' && /Kill|Ace|Block|Win|Own|Match|Start|TheirOut/.test(l.key);
    return {
      speaker, name: mt(VB_TEXT, NAME[speaker]), full: l.text, shown: typewriter(l.text, l.age).length,
      mouth: mouthOpen(l.age, typing), mood: good ? 'happy' : /Lost|Lose|Out|Net|Fault|Drop/.test(l.key) ? 'worried' : 'neutral',
      look: speaker === 'duke' ? null : this.looks[speaker], alpha: Math.min(1, l.age * 8, (life - l.age) * 4), t,
    };
  }
}
