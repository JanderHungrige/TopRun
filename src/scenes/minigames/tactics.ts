import type { Input } from '../../core/input';
import { easeInOutQuad, type Vec } from '../../core/math';
import { syllableIndex, typingTime } from '../../game/dialogue';
import {
  createTactics, nextEngagement, playCard, TACTICS_MEDALS, TACTICS_RULES as R, type TacticsState, type TurnResult,
} from '../../game/minigames/tactics';
import { CARDS } from '../../game/minigames/tactics-moves';
import type { GameContext } from '../../game/state';
import { drawBoard, drawSummary, type BoardSnap } from '../../render/minigames/tactics-board';
import { cardAt, drawCard, drawPrompt, type CardState } from '../../render/minigames/tactics-cards';
import { drawTacticsIcon } from '../../render/minigames/tactics-icon';
import { drawInstructor, drawSpeech, type InstructorMood } from '../../render/minigames/tactics-instructor';
import { posesFor, type Pose } from '../../render/minigames/tactics-paths';
import { drawRoom, drawWhiteboard, drawWipe } from '../../render/minigames/tactics-room';
import type { MinigameModule, MinigameRound } from './contract';
import { buildSnap, cardViews, debriefLine, finalLine, introLine, summaryRows, tx } from './tactics-view';

// Dogfight Tactics (doc 19): phases (wipe → choose → resolve … → summary), input, the turn timeline, sounds
// and the instructor's mood. Rules live in game/minigames/tactics*.ts.

type Phase = 'wipe' | 'choose' | 'resolve' | 'summary';
const WIPE = 0.85;
const HIS_START = 0.35;
const DRAW_TIME = 1.0;
const AT = { overshoot: 1.0, meter: 1.1, talk: 1.2, stamp: 1.6 } as const;
const READY = 1.6;
const GLIDE = 0.55;
const SUMMARY_END = 10;
const crossed = (a: number, b: number, at: number): boolean => a < at && b >= at;
const clamp01 = (v: number): number => Math.max(0, Math.min(1, v));

class TacticsRound implements MinigameRound {
  private s: TacticsState;
  private phase: Phase = 'wipe';
  private age = 0;
  private t = 0;
  private sel = 0;
  private readonly lift = [0, 0, 0, 0];
  private meter: number;
  private from: { you: Pose; him: Pose } | null = null;
  private glide = 1;
  private line = '';
  private lineAge = 0;
  private lastSyllable = -1;
  private mood: InstructorMood = 'calm';
  private moodAge = 9;
  private old: BoardSnap | null = null;
  private pointer: Vec = { x: -1, y: -1 };
  private done = false;
  private readonly callsign: string;

  constructor(private readonly game: GameContext, seed: number) {
    this.s = createTactics(seed);
    this.meter = this.s.eng.sit.adv;
    this.callsign = game.profile?.callsign ?? tx('pilot');
    game.audio.play('flare', { pitch: 0.5, volume: 0.35 });
  }

  update(dt: number, input: Input): number | null {
    this.t += dt;
    const prev = this.age;
    this.age += dt;
    this.lineAge += dt;
    this.moodAge += dt;
    this.glide = Math.min(1, this.glide + dt / GLIDE);
    this.talk();
    this.ease(dt);
    switch (this.phase) {
      case 'wipe':
        if (this.age >= WIPE) this.enterChoose();
        return null;
      case 'choose': return this.choose(input);
      case 'resolve': return this.resolve(prev, input);
      case 'summary':
        this.done = this.done || this.age >= SUMMARY_END || (this.age >= 1.8 && this.next(input));
        return this.done ? this.s.points : null;
      default: throw new Error(`unhandled: ${this.phase satisfies never}`);
    }
  }

  private setPhase(p: Phase): void {
    this.phase = p;
    this.age = 0;
  }

  private speak(line: string): void {
    this.line = line;
    this.lineAge = 0;
    this.lastSyllable = -1;
  }

  private setMood(m: InstructorMood): void {
    this.mood = m;
    this.moodAge = 0;
  }

  private enterChoose(): void {
    this.setPhase('choose');
    this.meter = this.s.eng.sit.adv;
    this.speak(introLine(this.s.eng.sit.geo, this.callsign));
  }

  private next(input: Input): boolean {
    return input.pressed('confirm') || input.taps.some((p) => p.y > 56);
  }

  private choose(input: Input): null {
    const audio = this.game.audio;
    if (input.pressed('left') || input.pressed('up')) this.select((this.sel + 3) % 4);
    if (input.pressed('right') || input.pressed('down')) this.select((this.sel + 1) % 4);
    const p = input.pointer;
    if (input.device === 'mouse' && (p.x !== this.pointer.x || p.y !== this.pointer.y)) {
      this.pointer = { x: p.x, y: p.y };
      const i = cardAt(p);
      if (i >= 0) this.select(i);
    }
    const tapped = input.taps.map(cardAt).find((i) => i >= 0);
    if (tapped !== undefined) this.sel = tapped;
    if (tapped === undefined && !input.pressed('confirm')) return null;
    const move = CARDS[this.s.eng.sit.geo][this.sel];
    if (!move) return null;
    this.s = playCard(this.s, move);
    audio.play('uiSelect');
    audio.play('flare', { pitch: 1.8, volume: 0.18 });
    this.setPhase('resolve');
    return null;
  }

  private select(i: number): void {
    if (i === this.sel) return;
    this.sel = i;
    this.game.audio.play('uiMove');
  }

  private resolve(prev: number, input: Input): null {
    const last = this.s.last;
    if (!last) return null;
    const go = this.next(input);
    if (go && this.age < READY) {
      this.events(last, prev, READY);
      this.age = READY;
      return null;
    }
    this.events(last, prev, this.age);
    if (go) this.advance();
    return null;
  }

  /** Sounds, line and mood for the timeline between two moments of the resolve phase. */
  private events(last: TurnResult, a: number, b: number): void {
    const audio = this.game.audio;
    if (crossed(a, b, HIS_START)) audio.play('flare', { pitch: 1.5, volume: 0.15, pan: 0.3 });
    if (crossed(a, b, AT.overshoot) && last.overshoot !== 0) audio.play('special');
    if (crossed(a, b, AT.meter) && last.delta !== 0) audio.play(last.delta > 0 ? 'pickup' : 'denied', { volume: 0.7 });
    if (crossed(a, b, AT.talk)) {
      this.speak(debriefLine(last, this.callsign));
      const good = last.you.q >= 2 || last.overshoot > 0;
      this.setMood(good ? 'nod' : last.you.q <= -1 || last.overshoot < 0 ? 'wince' : 'calm');
    }
    if (!crossed(a, b, AT.stamp) || !last.outcome) return;
    switch (last.outcome) {
      case 'fastKill':
      case 'kill':
        audio.play('gun');
        audio.play('powerup');
        return this.setMood('nod');
      case 'shotDown':
        audio.play('warning');
        audio.play('playerHit');
        return this.setMood('wince');
      case 'separated': return audio.play('radioClick');
      default: throw new Error(`unhandled: ${last.outcome satisfies never}`);
    }
  }

  private advance(): void {
    const last = this.s.last;
    if (!last) return;
    if (!this.s.eng.outcome) {
      this.from = posesFor(last.before.geo, last.before.range);
      this.glide = 0;
      this.setPhase('choose');
      return;
    }
    this.old = this.snap();
    this.s = nextEngagement(this.s);
    this.sel = 0;
    this.from = null;
    if (this.s.over) {
      this.setPhase('summary');
      this.speak(finalLine(this.s.points, this.callsign));
      this.game.audio.play(this.s.points >= TACTICS_MEDALS.silver ? 'powerup' : 'radioClick');
      return;
    }
    this.setPhase('wipe');
    this.game.audio.play('flare', { pitch: 0.5, volume: 0.35 });
  }

  private talk(): void {
    if (!this.line || this.lineAge >= typingTime(this.line)) return;
    const syl = syllableIndex(this.lineAge);
    if (syl === this.lastSyllable) return;
    this.lastSyllable = syl;
    const ch = this.line.charAt(Math.floor(this.lineAge * 34));
    if (/[\p{L}\p{N}]/u.test(ch)) this.game.audio.play('voice', { pitch: 0.78 * (0.94 + Math.random() * 0.12), volume: 0.4 });
  }

  private ease(dt: number): void {
    const last = this.s.last;
    const hold = this.phase === 'resolve' && last && this.age < AT.meter;
    const target = hold && last ? last.before.adv : this.s.eng.sit.adv;
    this.meter += (target - this.meter) * Math.min(1, dt * 6);
    for (let i = 0; i < 4; i++) {
      const up = (this.phase === 'choose' && i === this.sel) || (this.phase === 'resolve' && i === this.played());
      this.lift[i] = (this.lift[i] ?? 0) + ((up ? 1 : 0) - (this.lift[i] ?? 0)) * Math.min(1, dt * 12);
    }
  }

  private played(): number {
    const last = this.s.last;
    return last ? CARDS[last.before.geo].indexOf(last.mine) : -1;
  }

  liveScore(): string {
    const k = Math.min(R.engagements, this.s.outcomes.length + (this.s.eng.outcome ? 0 : 1));
    return tx('live', { n: this.s.points, k, total: R.engagements });
  }

  private snap(): BoardSnap {
    return buildSnap({
      eng: this.s.eng, last: this.phase === 'resolve' ? this.s.last : null, age: this.age, meter: this.meter,
      from: this.from, glide: easeInOutQuad(this.glide), at: AT, his: HIS_START, draw: DRAW_TIME,
    });
  }

  render(ctx: CanvasRenderingContext2D): void {
    drawRoom(ctx, this.t);
    drawWhiteboard(ctx);
    this.renderBoard(ctx);
    this.renderCards(ctx);
    const drawing = this.phase === 'resolve' && this.age < AT.talk;
    const point = drawing ? 0.58 + 0.06 * Math.sin(this.age * 10) : 0.32 + 0.03 * Math.sin(this.t * 1.3);
    drawInstructor(ctx, { mood: this.moodAge < 2.8 ? this.mood : 'calm', point, moodAge: this.moodAge, facing: !drawing, t: this.t });
    drawSpeech(ctx, tx('instructor'), this.line, Math.floor(this.lineAge * 34), 1, this.lineAge);
    const waiting = (this.phase === 'resolve' && this.age >= READY) || (this.phase === 'summary' && this.age >= 1.8 && !this.done);
    if (waiting) drawPrompt(ctx, tx('next'), 606, this.t, true);
  }

  private renderBoard(ctx: CanvasRenderingContext2D): void {
    switch (this.phase) {
      case 'wipe':
        if (this.old) drawBoard(ctx, this.old);
        return drawWipe(ctx, this.age / WIPE);
      case 'summary': {
        const pts = tx('total', { n: this.s.points });
        return drawSummary(ctx, tx('summary'), summaryRows(this.s.outcomes), pts, this.age);
      }
      case 'choose':
      case 'resolve': return drawBoard(ctx, this.snap(), this.phase === 'choose' && !this.from ? clamp01(this.age / 0.3) : 1);
      default: throw new Error(`unhandled: ${this.phase satisfies never}`);
    }
  }

  private renderCards(ctx: CanvasRenderingContext2D): void {
    if (this.phase === 'summary') return;
    const last = this.s.last;
    const geo = this.phase === 'resolve' && last ? last.before.geo : this.s.eng.sit.geo;
    const alpha = this.phase === 'wipe' ? clamp01((this.age - WIPE * 0.5) / (WIPE * 0.5)) : 1;
    cardViews(geo).forEach((c, i) => {
      const st: CardState = this.phase === 'resolve' ? (i === this.played() ? 'played' : 'dim') : this.phase === 'choose' && i === this.sel ? 'selected' : 'idle';
      drawCard(ctx, c, i, st, this.lift[i] ?? 0, alpha);
    });
  }
}

export const TACTICS: MinigameModule = {
  id: 'tactics',
  medals: TACTICS_MEDALS,
  higherIsBetter: true,
  formatScore: (n) => tx('score', { n }),
  rules: () => ({
    lines: [tx('rule1'), tx('rule2'), tx('rule3'), tx('rule4')],
    controls: [tx('ctrlKeys'), tx('ctrlPad'), tx('ctrlTouch')],
  }),
  drawIcon: drawTacticsIcon,
  create: (game) => new TacticsRound(game, Math.floor(Math.random() * 0x7fffffff)),
};
