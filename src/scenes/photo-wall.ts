import type { Scene } from '../core/scene';
import type { GameContext } from '../game/state';
import { t } from '../i18n/i18n';
import { drawSunset } from '../render/backdrop';
import { COLORS, text } from '../render/text';

/** Placeholder until Home Base Honours wave 2 builds the picture wall. */
export class PhotoWallScene implements Scene {
  private time = 0;

  constructor(private readonly game: GameContext) {}

  update(dt: number): void {
    this.time += dt;
    const input = this.game.input;
    if (input.pressed('back') || input.pressed('confirm') || input.taps.length > 0) {
      this.game.audio.play('uiBack');
      this.game.go({ to: 'base' });
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    drawSunset(ctx, this.time);
    text(ctx, t('rooms.photoWall'), 640, 300, { size: 42, display: true, italic: true, align: 'center', color: COLORS.gold });
    text(ctx, t('rooms.soon'), 640, 360, { size: 20, type: true, align: 'center', color: COLORS.ink });
  }
}
