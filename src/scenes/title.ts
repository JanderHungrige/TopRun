import type { Scene } from '../core/scene';
import { MAX_PROFILES } from '../game/profiles';
import type { GameContext } from '../game/state';
import { getLang, t } from '../i18n/i18n';
import type { UiKey } from '../i18n/ui-en';
import { drawFlyby, drawSunset } from '../render/backdrop';
import { drawLogo } from '../render/logo';
import { COLORS, text } from '../render/text';
import { ButtonGroup, drawPanel, type Button } from '../ui/widgets';

type Mode = 'menu' | 'controls';

const CONTROLS: ReadonlyArray<readonly [UiKey, UiKey | string, UiKey | string]> = [
  ['controls.move', 'controls.arrows', 'controls.stick'],
  ['controls.gun', 'controls.spaceJ', 'A'],
  ['controls.air', 'R / K', 'B'],
  ['controls.ground', 'Q / L', 'LB / RB'],
  ['controls.flare', 'F', 'X'],
  ['controls.special', 'E', 'Y'],
  ['controls.pause', 'P / Esc', 'Start'],
  ['controls.mute', 'M', '—'],
  ['controls.launch', 'Space + E', 'A + Y'],
];

const label = (s: string): string => (s.startsWith('controls.') ? t(s as UiKey) : s);

export class TitleScene implements Scene {
  private t = 0;
  private mode: Mode = 'menu';
  private menu = new ButtonGroup([]);

  constructor(private readonly game: GameContext) {}

  enter(): void {
    this.game.music.play('menu');
    this.buildMenu();
  }

  private buildMenu(): void {
    const st = this.game.settings;
    const items: Array<[string, string]> = [
      ...(this.game.profiles.length > 0 ? ([['continue', t('title.continue')]] as Array<[string, string]>) : []),
      ['ladder', t('title.ladder')],
      ['new', t('title.newPilot')],
      ['controls', t('title.controls')],
      ['joystick', t('title.joystick')],
      ['sound', t(st.muted ? 'title.soundOff' : 'title.soundOn')],
      ['autofire', t(st.autofire ? 'title.autofireOn' : 'title.autofireOff')],
      ['lang', t('title.language')],
    ];
    // Eight items no longer fit under the tagline at 46 px a row.
    const step = items.length > 7 ? 40 : 46;
    const top = 688 - items.length * step;
    const full = this.game.profiles.length >= MAX_PROFILES;
    const buttons: Button[] = items.map(([id, text_], i) => ({
      id, label: text_, x: 510, y: top + i * step, w: 260, h: step - 8, primary: i === 0, enabled: !(id === 'new' && full),
    }));
    const focus = this.menu.focused?.id;
    this.menu.setButtons(buttons);
    if (focus) this.menu.focusId(focus);
  }

  update(dt: number): void {
    this.t += dt;
    const input = this.game.input;
    if (this.mode === 'controls') {
      if (input.pressed('back') || input.pressed('confirm') || input.taps.length > 0) this.setMode('menu');
      return;
    }
    const id = this.menu.update(input);
    if (input.pressed('up') || input.pressed('down')) this.game.audio.play('uiMove');
    if (id) this.activate(id);
  }

  private setMode(mode: Mode): void {
    this.mode = mode;
    this.game.audio.play(mode === 'menu' ? 'uiBack' : 'uiSelect');
    this.game.input.clearPressed();
  }

  private toggle(change: 'muted' | 'autofire' | 'lang'): void {
    const st = this.game.settings;
    const settings = { ...st };
    if (change === 'muted') settings.muted = !st.muted;
    if (change === 'autofire') settings.autofire = !st.autofire;
    if (change === 'lang') settings.lang = getLang() === 'de' ? 'en' : 'de';
    this.game.setSettings(settings);
    this.game.audio.play('uiSelect');
    this.buildMenu();
  }

  private activate(id: string): void {
    switch (id) {
      case 'continue':
        this.game.audio.play('uiSelect');
        this.game.go({ to: 'pilots' });
        return;
      case 'new':
        this.game.audio.play('uiSelect');
        this.game.go({ to: 'newPilot' });
        return;
      case 'controls': return this.setMode('controls');
      case 'joystick':
        this.game.audio.play('uiSelect');
        this.game.go({ to: 'joystick' });
        return;
      case 'ladder':
        this.game.audio.play('uiSelect');
        this.game.go({ to: 'ladder' });
        return;
      case 'sound': return this.toggle('muted');
      case 'autofire': return this.toggle('autofire');
      case 'lang': return this.toggle('lang');
      default: return;
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    drawSunset(ctx, this.t);
    drawFlyby(ctx, this.t);
    drawLogo(ctx, 640, 200, this.t);
    text(ctx, t('title.tagline'), 640, 318, { size: 15, align: 'center', color: '#ffd9c2', letterSpacing: 2, shadow: true });
    if (this.mode === 'menu') this.menu.render(ctx, this.t);
    if (this.mode === 'controls') this.renderControls(ctx);
    const hint = this.game.input.device === 'touch' ? t('title.hintTouch') : t('title.hintKeys');
    text(ctx, hint, 640, 708, { size: 13, align: 'center', color: COLORS.dim });
  }

  private renderControls(ctx: CanvasRenderingContext2D): void {
    drawPanel(ctx, { x: 280, y: 330, w: 720, h: 360 });
    text(ctx, t('controls.title'), 640, 368, { size: 24, display: true, align: 'center', color: COLORS.gold });
    text(ctx, t('controls.keyboard'), 590, 400, { size: 12, color: COLORS.dim, letterSpacing: 2 });
    text(ctx, t('controls.gamepad'), 790, 400, { size: 12, color: COLORS.dim, letterSpacing: 2 });
    CONTROLS.forEach(([what, keys, pad], i) => {
      const y = 426 + i * 25;
      text(ctx, t(what), 310, y, { size: 15, color: COLORS.ink });
      text(ctx, label(keys), 590, y, { size: 15, color: COLORS.cyan });
      text(ctx, label(pad), 790, y, { size: 15, color: COLORS.cyan, maxWidth: 200 });
    });
    text(ctx, t('controls.touch'), 640, 654, { size: 12, align: 'center', color: COLORS.dim, maxWidth: 690 });
    text(ctx, t('controls.joystick'), 640, 674, { size: 12, align: 'center', color: COLORS.dim, maxWidth: 690 });
  }
}
