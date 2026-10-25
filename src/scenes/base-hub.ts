import type { Scene } from '../core/scene';
import { MINIGAME_IDS, MINIGAMES, type MinigameId } from '../data/minigames';
import { baseLine } from '../game/dialogue-scripts';
import { medalFor, unlockedMinigames } from '../game/minigames/core';
import type { GameContext } from '../game/state';
import { t } from '../i18n/i18n';
import { mt } from '../i18n/minigame-text';
import { MINIGAME_NAMES } from '../i18n/minigames/names';
import { drawSunset } from '../render/backdrop';
import { COLORS, text } from '../render/text';
import { pilotContext, SpeechBox } from '../ui/speech';
import { drawButton, hit, type Button } from '../ui/widgets';
import { cardRect, drawCard, type CardView } from './base-hub-render';
import { moduleFor, playableIds } from './minigames/registry';

const TOGGLE = { x: 690, y: 590, w: 370, h: 48 };
const MAP_BTN = { x: 1076, y: 590, w: 180, h: 48 };

/** BASE (doc 11): the off-duty games, the offers toggle and the way back to the map. */
export class BaseHubScene implements Scene {
  private time = 0;
  private focus = 0;
  private leaving = false;
  private readonly wingman: SpeechBox;

  constructor(private readonly game: GameContext) {
    this.wingman = new SpeechBox(game.audio, {
      portrait: { x: 24, y: 552, w: 112, h: 140 },
      bubble: { x: 148, y: 562, w: 520, h: 120 },
      fontSize: 16, style: 'comic', persistent: true,
    }, 'wingman', pilotContext(game));
  }

  enter(): void {
    this.game.music.play('menu');
    this.wingman.say(baseLine('base'));
  }

  private view(id: MinigameId): CardView {
    const mod = moduleFor(id);
    const name = mt(MINIGAME_NAMES, id);
    if (!mod) return { name, mod, state: 'soon', status: t('base.soon'), medal: null };
    if (!unlockedMinigames(this.game.save.progress, playableIds()).includes(id)) {
      return { name, mod, state: 'locked', status: t('base.locked', { n: MINIGAMES[id].unlockAfter }), medal: null };
    }
    const rec = this.game.save.minigames[id];
    if (!rec) return { name, mod, state: 'open', status: t('base.notPlayed'), medal: null };
    return { name, mod, state: 'open', status: t('base.best', { score: mod.formatScore(rec.best) }), medal: medalFor(rec.best, mod.medals, mod.higherIsBetter) };
  }

  update(dt: number): void {
    this.time += dt;
    const input = this.game.input;
    this.wingman.update(dt, input);
    if (input.pressed('back') || input.pressed('base')) return this.leave();
    if (input.pressed('left')) this.move(-1);
    if (input.pressed('right')) this.move(1);
    if (input.pressed('up')) this.move(-5);
    if (input.pressed('down')) this.move(5);
    if (input.pressed('confirm')) this.play(this.focus);
    for (const tap of input.taps) {
      if (hit(tap, MAP_BTN)) return this.leave();
      if (hit(tap, TOGGLE)) this.toggleOffers();
      const i = MINIGAME_IDS.findIndex((_, k) => hit(tap, cardRect(k)));
      if (i >= 0) {
        this.focus = i;
        this.play(i);
      }
    }
  }

  private move(d: number): void {
    const next = this.focus + d;
    if (next < 0 || next >= MINIGAME_IDS.length) return;
    this.focus = next;
    this.game.audio.play('uiMove');
  }

  private play(i: number): void {
    const id = MINIGAME_IDS[i];
    if (!id) return;
    const v = this.view(id);
    if (v.state !== 'open') {
      this.game.audio.play('denied');
      if (v.state === 'locked') this.wingman.say(baseLine('baseLocked', { n: MINIGAMES[id].unlockAfter }), true);
      return;
    }
    this.leaving = true;
    this.game.audio.play('uiSelect');
    this.game.go({ to: 'minigame', id, from: 'base' });
  }

  private toggleOffers(): void {
    const s = this.game.settings;
    this.game.setSettings({ ...s, minigameOffers: !s.minigameOffers });
    this.game.audio.play('uiSelect');
  }

  private leave(): void {
    if (this.leaving) return;
    this.leaving = true;
    this.game.audio.play('uiBack');
    this.game.go({ to: 'map' });
  }

  render(ctx: CanvasRenderingContext2D): void {
    drawSunset(ctx, this.time);
    ctx.fillStyle = 'rgba(4,8,14,0.7)';
    ctx.fillRect(0, 0, 1280, 720);
    text(ctx, t('base.title'), 54, 62, { size: 34, display: true, italic: true, color: COLORS.gold, shadow: true });
    text(ctx, t('base.subtitle'), 54, 92, { size: 15, color: COLORS.dim });
    MINIGAME_IDS.forEach((id, i) => drawCard(ctx, cardRect(i), this.view(id), i === this.focus, this.time));
    const offers = this.game.settings.minigameOffers;
    const toggle: Button = { id: 'offers', label: t(offers ? 'base.offersOn' : 'base.offersOff'), ...TOGGLE };
    drawButton(ctx, toggle, false, this.time);
    drawButton(ctx, { id: 'map', label: t('base.map'), ...MAP_BTN, hint: 'ESC' }, false, this.time);
    this.wingman.render(ctx);
  }
}
