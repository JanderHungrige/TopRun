import type { Scene } from '../core/scene';
import type { LiveryId } from '../data/liveries';
import type { CampaignId, PlaneId } from '../data/types';
import { celebrationBeat, CELEBRATION, skipTo, worldSummary, type Beat, type WorldSummary } from '../game/celebration';
import { celebrationLine } from '../game/dialogue-scripts';
import type { GameContext, Route } from '../game/state';
import { t } from '../i18n/i18n';
import type { UiKey } from '../i18n/ui-en';
import { drawConfetti, drawFireworks, drawFlyby, drawPlate, preloadWorld } from '../render/celebration';
import { COLORS, text } from '../render/text';
import { drawPanel } from '../ui/widgets';
import { pilotContext, SpeechBox } from '../ui/speech';

// A world's celebration (doc 64): three generated pixel-art key frames with the player's craft flying past,
// fireworks and confetti, the admiral's line and the WORLD COMPLETE card; then `then`. ENTER / tap skips to the card,
// again leaves; ESC leaves at once.

const WORLD_NAME: Readonly<Record<CampaignId, UiKey>> = { 1: 'map.title', 2: 'map.title2', 3: 'map.title3', 4: 'map.title4', 5: 'map.title5', 6: 'map.title6' };

export class CelebrationScene implements Scene {
  private time = 0;
  private said = false;
  private leaving = false;
  private readonly summary: WorldSummary;
  private readonly speech: SpeechBox;
  private readonly craft: { plane: PlaneId; livery: LiveryId };

  constructor(private readonly game: GameContext, private readonly world: CampaignId, private readonly then: Route) {
    preloadWorld(world);
    this.summary = worldSummary(game.save, world);
    const save = game.save;
    const plane: PlaneId = world === 4 ? save.sub.selectedPlane : world === 5 ? 'starship' : world === 3 ? save.heli.selectedPlane : save.selectedPlane;
    this.craft = { plane, livery: save.livery[plane] };
    this.speech = new SpeechBox(game.audio, {
      portrait: { x: 52, y: 556, w: 92, h: 110 },
      bubble: { x: 172, y: 562, w: 1058, h: 104 },
      fontSize: 20, style: 'comic', persistent: false, holdLast: true,
    }, 'admiral', pilotContext(game));
  }

  enter(): void {
    this.game.music.play('victory');
  }

  update(dt: number): void {
    if (this.leaving) return;
    const input = this.game.input;
    this.time += dt;
    this.speech.update(dt);
    if (input.pressed('back')) this.time = CELEBRATION.length;
    else if (input.pressed('confirm') || input.taps.length > 0) this.time = skipTo(this.time);
    const beat = celebrationBeat(this.time);
    if (beat.line && !this.said) {
      this.said = true;
      this.speech.say(celebrationLine(this.world), true);
    }
    if (beat.card > 0 && this.said) this.speech.say([], true);
    if (beat.end) {
      this.leaving = true;
      this.game.go(this.then);
    }
  }

  private drawShots(ctx: CanvasRenderingContext2D, b: Beat): void {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, 1280, 720);
    if (b.from !== null) drawPlate(ctx, this.world, b.from, 1);
    drawPlate(ctx, this.world, b.shot, b.fade);
    if (b.flyby !== null) drawFlyby(ctx, this.craft.plane, this.craft.livery, b.flyby, this.time);
    if (b.fireworks) drawFireworks(ctx, this.world, this.time, b.shot);
    if (b.confetti) drawConfetti(ctx, this.time);
  }

  private drawCard(ctx: CanvasRenderingContext2D, alpha: number): void {
    ctx.save();
    ctx.globalAlpha = alpha;
    drawPanel(ctx, { x: 340, y: 226, w: 600, h: 230 }, { fill: 'rgba(6,10,20,0.82)', edge: COLORS.gold });
    text(ctx, t('celebration.complete', { n: this.world }), 640, 296, { size: 44, display: true, align: 'center', color: COLORS.gold, maxWidth: 560 });
    text(ctx, t(WORLD_NAME[this.world]), 640, 338, { size: 20, display: true, align: 'center', color: COLORS.ink, letterSpacing: 2, maxWidth: 560 });
    const s = this.summary;
    text(ctx, t('celebration.stars', { stars: s.stars, max: s.maxStars }), 640, 386, { size: 18, align: 'center', color: COLORS.ink });
    text(ctx, t('celebration.medals', { medals: s.medals, max: s.maxMedals }), 640, 416, { size: 18, align: 'center', color: COLORS.ink });
    ctx.restore();
  }

  render(ctx: CanvasRenderingContext2D): void {
    const b = celebrationBeat(this.time);
    this.drawShots(ctx, b);
    if (b.card > 0) this.drawCard(ctx, b.card);
    this.speech.render(ctx);
    text(ctx, t('celebration.skip'), 1256, 30, { size: 13, align: 'right', color: COLORS.faint, shadow: true });
    if (b.black > 0) {
      ctx.fillStyle = `rgba(0,0,0,${b.black.toFixed(3)})`;
      ctx.fillRect(0, 0, 1280, 720);
    }
  }
}
