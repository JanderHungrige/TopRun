import type { Scene } from '../core/scene';
import type { MinigameId } from '../data/minigames';
import { baseLine } from '../game/dialogue-scripts';
import type { GameContext } from '../game/state';
import { t } from '../i18n/i18n';
import { mt } from '../i18n/minigame-text';
import { MINIGAME_NAMES } from '../i18n/minigames/names';
import { COLORS, text } from '../render/text';
import { pilotContext, SpeechBox } from '../ui/speech';
import { ButtonGroup, drawPanel } from '../ui/widgets';
import { moduleFor } from './minigames/registry';
import { drawBackdrop } from './minigames/shell-render';

const CARD = { x: 380, y: 120, w: 520, h: 360 };

/** The "OFF DUTY" offer after a debrief (doc 11): PLAY or SKIP to the map. */
export class MinigameOfferScene implements Scene {
  private time = 0;
  private leaving = false;
  private readonly buttons: ButtonGroup;
  private readonly wingman: SpeechBox;

  constructor(private readonly game: GameContext, private readonly id: MinigameId, private readonly isNew: boolean) {
    this.buttons = new ButtonGroup([
      { id: 'play', label: t('offer.play'), x: CARD.x + 60, y: CARD.y + CARD.h - 76, w: 190, h: 52, primary: true },
      { id: 'skip', label: t('offer.skip'), x: CARD.x + CARD.w - 250, y: CARD.y + CARD.h - 76, w: 190, h: 52, hint: 'ESC' },
    ], 'horizontal');
    this.wingman = new SpeechBox(game.audio, {
      portrait: { x: 24, y: 552, w: 112, h: 140 },
      bubble: { x: 148, y: 562, w: 700, h: 120 },
      fontSize: 17, style: 'comic', persistent: true,
    }, 'wingman', pilotContext(game));
  }

  enter(): void {
    this.game.music.play('menu');
    this.wingman.say(baseLine(this.isNew ? 'offerNew' : 'offer', { game: mt(MINIGAME_NAMES, this.id) }));
  }

  update(dt: number): void {
    this.time += dt;
    const input = this.game.input;
    this.wingman.update(dt, input);
    if (input.pressed('back')) return this.go(false);
    const b = this.buttons.update(input);
    if (input.pressed('left') || input.pressed('right')) this.game.audio.play('uiMove');
    if (b === 'play') this.go(true);
    if (b === 'skip') this.go(false);
  }

  private go(play: boolean): void {
    if (this.leaving) return;
    this.leaving = true;
    this.game.audio.play(play ? 'uiSelect' : 'uiBack');
    this.game.go(play && moduleFor(this.id) ? { to: 'minigame', id: this.id, from: 'offer' } : { to: 'map' });
  }

  render(ctx: CanvasRenderingContext2D): void {
    drawBackdrop(ctx);
    drawPanel(ctx, CARD);
    text(ctx, t('offer.title'), 640, CARD.y + 50, { size: 16, align: 'center', color: COLORS.dim, letterSpacing: 4 });
    const mod = moduleFor(this.id);
    if (mod) {
      ctx.save();
      ctx.translate(640, CARD.y + 140);
      ctx.scale(1.5, 1.5);
      mod.drawIcon(ctx, this.time);
      ctx.restore();
    }
    text(ctx, mt(MINIGAME_NAMES, this.id).toUpperCase(), 640, CARD.y + 236, { size: 28, display: true, italic: true, align: 'center', color: COLORS.gold, maxWidth: CARD.w - 40 });
    if (this.isNew && Math.sin(this.time * 5) > -0.3) text(ctx, t('offer.new'), CARD.x + CARD.w - 30, CARD.y + 52, { size: 20, display: true, align: 'right', color: COLORS.cyan });
    text(ctx, t('offer.hint'), 640, CARD.y + CARD.h + 30, { size: 13, align: 'center', color: COLORS.faint });
    this.buttons.render(ctx, this.time);
    this.wingman.render(ctx);
  }
}
