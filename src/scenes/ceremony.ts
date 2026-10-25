import type { Scene } from '../core/scene';
import type { MedalId } from '../data/medals';
import { beatAt, GUARD, sceneLength, startCeremony, stepCeremony, type CeremonyState, type CueId } from '../game/ceremony';
import { typewriter } from '../game/dialogue';
import { medalLine } from '../game/dialogue-scripts';
import { earnedMedals } from '../game/medals';
import type { GameContext, Route } from '../game/state';
import { medalCitation } from '../i18n/content';
import { faceOf } from '../render/avatars/person';
import { drawSet } from '../render/ceremony-ambient';
import { drawCard, drawLetterbox, twinkle, type CardView } from '../render/ceremony-card';
import { drawCast, pinPoint } from '../render/ceremony-cast';
import type { Grid } from '../render/ceremony-set';
import { pilotContext, SpeechBox } from '../ui/speech';
import { goldCount } from './minigames/registry';

/** The card fades in over this long, and out before the next medal's pin. */
const CARD_IN = 0.3;
const CARD_OUT = 0.25;
const SPARKLE = [1, 2, 3, 3, 2, 1, 1, 0] as const;

/**
 * Medal ceremony (doc 25): a pixel-art cut-scene on the flight deck at golden hour. The admiral walks up, pins
 * each new medal on the pilot's dress whites and salutes; every medal then gets a close-up with its citation
 * while the admiral speaks. CONFIRM / tap moves on, BACK skips the rest; then on to `then`.
 */
export class CeremonyScene implements Scene {
  private state: CeremonyState;
  private clock = 0;
  /** Seconds the current close-up's citation has been typing. */
  private cite = 0;
  /** Seconds since the last pin (sparkle), −1 = none yet. */
  private pinAge = -1;
  private card = false;
  private left = false;
  private readonly speech: SpeechBox;
  /** Medals earned before this ceremony, shown as ribbon bars on the pilot's chest. */
  private readonly earlier: MedalId[];

  constructor(private readonly game: GameContext, private readonly medals: readonly MedalId[], private readonly then: Route) {
    this.state = startCeremony(medals.length);
    this.earlier = earnedMedals(game.save, goldCount(game.save)).filter((id) => !medals.includes(id));
    this.speech = new SpeechBox(game.audio, {
      portrait: { x: 52, y: 556, w: 92, h: 110 },
      bubble: { x: 172, y: 562, w: 1058, h: 104 },
      fontSize: 20, style: 'comic', persistent: false, holdLast: true,
    }, 'admiral', pilotContext(game));
  }

  enter(): void {
    this.game.music.stop();
  }

  private medal(index = this.state.index): MedalId | undefined {
    return this.medals[index];
  }

  private citation(): string {
    const id = this.medal();
    return id ? medalCitation(id) : '';
  }

  private typed(): boolean {
    const cite = this.citation();
    return typewriter(cite, this.cite).length >= cite.length && !this.speech.typing;
  }

  update(dt: number): void {
    this.clock += dt;
    if (this.pinAge >= 0) this.pinAge += dt;
    this.speech.update(dt);
    const input = this.game.input;
    const prev = this.state;
    const step = stepCeremony(prev, dt, {
      confirm: input.pressed('confirm') || input.taps.length > 0,
      back: input.pressed('back'),
      typed: prev.stage === 'closeup' && this.typed(),
    });
    this.state = step.state;
    if (step.finishText) {
      this.cite = 999;
      this.speech.finishLine();
    }
    for (const c of step.cues) this.cue(c);
    if (prev.stage === 'closeup' && this.state.stage === 'scene') this.speech.say([], true);
    if (this.state.stage === 'closeup') this.cite += dt;
    if (this.state.stage !== 'done') this.card = this.state.stage === 'closeup';
    if (this.state.stage === 'done') this.leave();
  }

  private cue(c: CueId): void {
    switch (c) {
      case 'pin':
        this.game.audio.play('pickup');
        this.game.audio.play('hit', { volume: 0.35 });
        this.pinAge = 0;
        return;
      case 'fanfare': return this.game.music.play('victory');
      case 'salute': return;
      case 'closeup': {
        const id = this.medal();
        this.cite = 0;
        this.game.audio.play('buy');
        if (id) this.speech.say(medalLine(this.state.index, id), true);
        return;
      }
      default: throw new Error(`unhandled: ${c satisfies never}`);
    }
  }

  private leave(): void {
    if (this.left) return;
    this.left = true;
    this.game.go(this.then);
  }

  render(ctx: CanvasRenderingContext2D): void {
    const st = this.state;
    const g = drawSet(ctx, this.clock);
    const beat = beatAt(st.index, st.stage === 'scene' ? st.t : sceneLength(st.index));
    const pinned = this.medals.slice(0, Math.min(this.medals.length, st.index + (beat.pinned ? 1 : 0)));
    drawCast(ctx, g, { beat, t: this.clock, avatar: faceOf(this.game.profile), earlier: this.earlier, pinned });
    if (this.pinAge >= 0) this.sparkle(ctx, g, pinned.length);
    this.renderCard(ctx, g);
    this.speech.render(ctx);
    const hint = (st.stage === 'scene' && st.age >= GUARD) || (st.stage === 'closeup' && this.typed());
    drawLetterbox(ctx, hint, this.clock, { n: Math.min(st.index + 1, this.medals.length), total: this.medals.length });
  }

  private sparkle(ctx: CanvasRenderingContext2D, g: Grid, count: number): void {
    const r = SPARKLE[Math.floor(this.pinAge * 10)];
    if (r === undefined || count === 0) return;
    const p = pinPoint(count, count - 1);
    twinkle(ctx, p.x - 6, p.y - 4, r, g.G, '#ffd76a');
    twinkle(ctx, p.x + 9, p.y + 10, Math.max(0, r - 1), g.G, '#fff1b0');
  }

  private renderCard(ctx: CanvasRenderingContext2D, g: Grid): void {
    const st = this.state;
    const callsign = (this.game.profile?.callsign ?? 'PILOT').toUpperCase();
    const base = { count: this.medals.length, callsign, clock: this.clock };
    const id = this.medal();
    if (this.card && id) {
      const view: CardView = { ...base, medal: id, index: st.index, t: st.t, fade: Math.min(1, st.t / CARD_IN), typed: typewriter(this.citation(), this.cite).length };
      return drawCard(ctx, g, view);
    }
    const last = this.medal(st.index - 1);
    if (st.stage === 'scene' && last && st.t < CARD_OUT) {
      drawCard(ctx, g, { ...base, medal: last, index: st.index - 1, t: 9, fade: 1 - st.t / CARD_OUT, typed: medalCitation(last).length });
    }
  }
}
