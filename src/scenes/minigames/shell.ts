import type { Scene } from '../../core/scene';
import { medalFor, recordScore, type Medal } from '../../game/minigames/core';
import type { GameContext } from '../../game/state';
import { t } from '../../i18n/i18n';
import { mt } from '../../i18n/minigame-text';
import { MINIGAME_NAMES } from '../../i18n/minigames/names';
import { COLORS, text } from '../../render/text';
import { ButtonGroup, type Button } from '../../ui/widgets';
import type { MinigameModule, MinigameRound } from './contract';
import { CARD, drawBackdrop, drawCountdown, drawDim, drawResultCard, drawRulesCard, drawTopBar } from './shell-render';

type Phase = 'rules' | 'countdown' | 'play' | 'paused' | 'result';
const COUNTDOWN = 3;

const pair = (a: [string, string], b: [string, string], y: number): Button[] => [
  { id: a[0], label: a[1], x: 440, y, w: 190, h: 50, primary: true },
  { id: b[0], label: b[1], x: 650, y, w: 190, h: 50 },
];

/** Runs one minigame (doc 10): rules → 3-2-1 → play → pause → result, and saves the personal best. */
export class MinigameScene implements Scene {
  private phase: Phase = 'rules';
  private time = 0;
  private phaseTime = 0;
  private round: MinigameRound | null = null;
  private result: { score: number; medal: Medal | null; newBest: boolean } | null = null;
  private readonly buttons = new ButtonGroup([], 'horizontal');
  private leaving = false;

  constructor(private readonly game: GameContext, private readonly mod: MinigameModule, private readonly from: 'base' | 'offer') {
    this.setPhase('rules');
  }

  private get name(): string {
    return mt(MINIGAME_NAMES, this.mod.id);
  }

  enter(): void {
    this.game.music.play('menu');
  }

  exit(): void {
    this.round?.dispose?.();
  }

  onBlur(): void {
    if (this.phase === 'play') this.setPhase('paused');
  }

  private setPhase(p: Phase): void {
    this.phase = p;
    this.phaseTime = 0;
    this.game.input.clearPressed();
    const y = CARD.y + CARD.h - 74;
    if (p === 'rules') this.buttons.setButtons(pair(['start', t('mg.start')], ['back', t('mg.back')], y));
    if (p === 'paused') this.buttons.setButtons(pair(['resume', t('mg.resume')], ['quit', t('mg.quit')], 400));
    if (p === 'result') this.buttons.setButtons(pair(['retry', t('mg.retry')], ['back', t('mg.back')], y));
    this.buttons.focus = 0;
  }

  update(dt: number): void {
    this.time += dt;
    this.phaseTime += dt;
    const input = this.game.input;
    switch (this.phase) {
      case 'rules':
      case 'result': return this.updateMenu(input.pressed('back'));
      case 'paused':
        if (input.pressed('pause')) return this.setPhase('play');
        return this.updateMenu(false);
      case 'countdown': return this.updateCountdown();
      case 'play': return this.updatePlay(dt);
      default: throw new Error(`unhandled: ${this.phase satisfies never}`);
    }
  }

  private updateMenu(back: boolean): void {
    if (back) return this.leave();
    const id = this.buttons.update(this.game.input);
    if (this.game.input.pressed('left') || this.game.input.pressed('right')) this.game.audio.play('uiMove');
    if (id === 'start' || id === 'retry') return this.startRound();
    if (id === 'resume') return this.setPhase('play');
    if (id === 'quit' || id === 'back') return this.leave();
  }

  private startRound(): void {
    this.round?.dispose?.();
    this.round = this.mod.create(this.game);
    this.result = null;
    this.game.audio.play('uiSelect');
    this.setPhase('countdown');
  }

  private updateCountdown(): void {
    const before = Math.ceil(COUNTDOWN - (this.phaseTime - 1 / 60));
    const now = Math.ceil(COUNTDOWN - this.phaseTime);
    if (now !== before) this.game.audio.play(now > 0 ? 'uiMove' : 'powerup', { pitch: 1.4 });
    if (this.phaseTime >= COUNTDOWN) this.setPhase('play');
  }

  private updatePlay(dt: number): void {
    if (!this.round) return;
    if (this.game.input.pressed('pause')) {
      this.round.dispose?.();
      return this.setPhase('paused');
    }
    const score = this.round.update(dt, this.game.input);
    if (score !== null) this.finish(score);
  }

  private finish(score: number): void {
    this.round?.dispose?.();
    const rec = recordScore(this.game.save, this.mod.id, score, this.mod.higherIsBetter);
    this.game.setSave(rec.save);
    const medal = medalFor(score, this.mod.medals, this.mod.higherIsBetter);
    this.result = { score, medal, newBest: rec.newBest };
    this.game.audio.play(medal ? 'cash' : 'uiBack');
    this.setPhase('result');
  }

  private leave(): void {
    if (this.leaving) return;
    this.leaving = true;
    this.round?.dispose?.();
    this.game.audio.play('uiBack');
    this.game.go(this.from === 'base' ? { to: 'base' } : { to: 'map' });
  }

  private bestText(): string | null {
    const b = this.game.save.minigames[this.mod.id];
    return b ? this.mod.formatScore(b.best) : null;
  }

  render(ctx: CanvasRenderingContext2D): void {
    if (this.phase === 'rules' || !this.round) {
      drawBackdrop(ctx);
      drawRulesCard(ctx, this.mod, this.name, this.bestText(), this.time);
      this.buttons.render(ctx, this.time);
      return;
    }
    this.round.render(ctx);
    drawTopBar(ctx, this.name, this.round.liveScore());
    if (this.phase === 'countdown') drawCountdown(ctx, COUNTDOWN - this.phaseTime);
    if (this.phase === 'paused') {
      drawDim(ctx);
      text(ctx, t('mg.paused'), 640, 340, { size: 48, display: true, italic: true, align: 'center', color: COLORS.gold });
      this.buttons.render(ctx, this.time);
    }
    if (this.phase === 'result' && this.result) {
      drawDim(ctx);
      const r = this.result;
      drawResultCard(ctx, { name: this.name, score: this.mod.formatScore(r.score), best: this.bestText() ?? '', medal: r.medal, newBest: r.newBest }, this.phaseTime);
      this.buttons.render(ctx, this.time);
    }
  }
}
