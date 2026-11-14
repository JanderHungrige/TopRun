import type { Scene } from '../core/scene';
import type { CampaignId } from '../data/types';
import { crewLook } from '../game/crew-looks';
import { introLine } from '../game/dialogue-scripts';
import { INTRO, introBeat, introCamera, introNext, markIntroSeen, type IntroBeat } from '../game/intro';
import type { GameContext, Route } from '../game/state';
import { t } from '../i18n/i18n';
import type { UiKey } from '../i18n/ui-en';
import { drawIntroOverlay, drawIntroShot, preloadIntro } from '../render/intro';
import { COLORS, text } from '../render/text';
import { drawPanel } from '../ui/widgets';
import { pilotContext, SpeechBox } from '../ui/speech';

// Duke's welcome to a new world (doc 97): four generated key frames panned slowly, the world's drifting overlay, Duke in
// the world's outfit telling the story in the speech box, then the WELCOME TO card; then `then`. ENTER / tap goes to the
// next shot, ESC ends it. When it ends the world counts as welcomed.

const WORLD_NAME: Readonly<Record<CampaignId, UiKey>> = { 1: 'map.title', 2: 'map.title2', 3: 'map.title3', 4: 'map.title4', 5: 'map.title5', 6: 'map.title6' };
const PLACE: Readonly<Partial<Record<CampaignId, UiKey>>> = { 2: 'intro.place2', 3: 'intro.place3', 4: 'intro.place4', 5: 'intro.place5', 6: 'intro.place6' };

export class IntroScene implements Scene {
  private time = 0;
  private said = -1;
  private leaving = false;
  private readonly speech: SpeechBox;

  constructor(private readonly game: GameContext, private readonly world: CampaignId, private readonly then: Route) {
    preloadIntro(world);
    this.speech = new SpeechBox(game.audio, {
      portrait: { x: 52, y: 556, w: 92, h: 110 },
      bubble: { x: 172, y: 562, w: 1058, h: 104 },
      fontSize: 20, style: 'comic', persistent: false, holdLast: true,
    }, 'wingman', pilotContext(game));
    this.speech.look = crewLook(world);
  }

  enter(): void {
    this.game.music.play('mission');
  }

  update(dt: number): void {
    if (this.leaving) return;
    const input = this.game.input;
    this.time += dt;
    this.speech.update(dt);
    if (input.pressed('back')) this.time = INTRO.length;
    else if (input.pressed('confirm') || input.taps.length > 0) this.time = introNext(this.time);
    const beat = introBeat(this.time);
    if (beat.line && this.said !== beat.shot) {
      this.said = beat.shot;
      const line = introLine(this.world, beat.shot);
      if (line) this.speech.say(line, true);
    }
    if (beat.card > 0 && this.said >= 0) {
      this.said = -1;
      this.speech.say([], true);
    }
    if (beat.end) this.leave();
  }

  private leave(): void {
    this.leaving = true;
    this.game.setSave(markIntroSeen(this.game.save, this.world));
    this.game.go(this.then);
  }

  private drawShots(ctx: CanvasRenderingContext2D, b: IntroBeat): void {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, 1280, 720);
    if (b.from !== null) drawIntroShot(ctx, this.world, b.from, introCamera(this.world, b.from, 1), 1);
    drawIntroShot(ctx, this.world, b.shot, introCamera(this.world, b.shot, b.pan), b.fade);
    drawIntroOverlay(ctx, this.world, this.time);
  }

  private drawCard(ctx: CanvasRenderingContext2D, alpha: number): void {
    const place = PLACE[this.world];
    ctx.save();
    ctx.globalAlpha = alpha;
    drawPanel(ctx, { x: 300, y: 226, w: 680, h: 230 }, { fill: 'rgba(6,10,20,0.82)', edge: COLORS.gold });
    text(ctx, t('intro.welcome'), 640, 290, { size: 24, display: true, align: 'center', color: COLORS.ink, letterSpacing: 4, maxWidth: 620 });
    if (place) text(ctx, t(place), 640, 350, { size: 44, display: true, align: 'center', color: COLORS.gold, maxWidth: 620 });
    text(ctx, t('intro.world', { n: this.world, name: t(WORLD_NAME[this.world]) }), 640, 408, { size: 18, display: true, align: 'center', color: COLORS.ink, letterSpacing: 2, maxWidth: 620 });
    ctx.restore();
  }

  render(ctx: CanvasRenderingContext2D): void {
    const b = introBeat(this.time);
    this.drawShots(ctx, b);
    if (b.card > 0) this.drawCard(ctx, b.card);
    this.speech.render(ctx);
    text(ctx, t('intro.keys'), 1256, 30, { size: 13, align: 'right', color: COLORS.faint, shadow: true });
    if (b.black > 0) {
      ctx.fillStyle = `rgba(0,0,0,${b.black.toFixed(3)})`;
      ctx.fillRect(0, 0, 1280, 720);
    }
  }
}
