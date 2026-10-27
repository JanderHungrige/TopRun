import type { Scene } from '../core/scene';
import { MAX_PROFILES } from '../game/profiles';
import type { Settings } from '../game/settings';
import type { GameContext } from '../game/state';
import { getLang, t } from '../i18n/i18n';
import type { UiKey } from '../i18n/ui-en';
import { drawFlyby, drawSunset } from '../render/backdrop';
import { drawLogo } from '../render/logo';
import { COLORS, text } from '../render/text';
import { ButtonGroup, drawPanel, type Button } from '../ui/widgets';

type Mode = 'menu' | 'controls';
type Toggle = 'sfxOn' | 'musicOn' | 'autofire' | 'lang';

/** Menu column, bottom-anchored above the hint line and never above `top` (just below the tagline). */
const MENU = { top: 332, bottom: 686, gap: 6, maxRow: 46 } as const;
/** Row pitch for `n` buttons: 46 px up to 7, then tighter (9 → 40 px rows, 34 px buttons). */
const rowPitch = (n: number): number => Math.min(MENU.maxRow, Math.floor((MENU.bottom - MENU.top + MENU.gap) / n));

const CONTROLS: ReadonlyArray<readonly [UiKey, UiKey | string, UiKey | string]> = [
  ['controls.move', 'controls.arrows', 'controls.stick'],
  ['controls.gun', 'controls.spaceJ', 'A'],
  ['controls.air', 'R / K', 'B'],
  ['controls.ground', 'Q / L', 'RB'],
  ['controls.switch', 'X / O', 'LB'],
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
  /** Settings the labels were built from: the M key changes them outside the menu. */
  private shown: Settings | null = null;

  constructor(private readonly game: GameContext) {}

  enter(): void {
    this.game.music.play('menu');
    this.buildMenu();
  }

  private buildMenu(): void {
    const st = this.game.settings;
    this.shown = st;
    const items: Array<[string, string]> = [
      ...(this.game.profiles.length > 0 ? ([['continue', t('title.continue')]] as Array<[string, string]>) : []),
      ['new', t('title.newPilot')],
      ['controls', t('title.controls')],
      ['joystick', t('title.joystick')],
      ['sound', t(st.sfxOn ? 'title.soundOn' : 'title.soundOff')],
      ['music', t(st.musicOn ? 'title.musicOn' : 'title.musicOff')],
      ['autofire', t(st.autofire ? 'title.autofireOn' : 'title.autofireOff')],
      ['lang', t('title.language')],
    ];
    const row = rowPitch(items.length);
    const top = MENU.bottom - (items.length * row - MENU.gap);
    const full = this.game.profiles.length >= MAX_PROFILES;
    const buttons: Button[] = items.map(([id, text_], i) => ({
      id, label: text_, x: 510, y: top + i * row, w: 260, h: row - MENU.gap, primary: i === 0, enabled: !(id === 'new' && full),
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
    if (this.game.settings !== this.shown) this.buildMenu();
    const id = this.menu.update(input);
    if (input.pressed('up') || input.pressed('down')) this.game.audio.play('uiMove');
    if (id) this.activate(id);
  }

  private setMode(mode: Mode): void {
    this.mode = mode;
    this.game.audio.play(mode === 'menu' ? 'uiBack' : 'uiSelect');
    this.game.input.clearPressed();
  }

  private toggle(change: Toggle): void {
    const st = this.game.settings;
    const settings = { ...st };
    switch (change) {
      case 'sfxOn': settings.sfxOn = !st.sfxOn; break;
      case 'musicOn': settings.musicOn = !st.musicOn; break;
      case 'autofire': settings.autofire = !st.autofire; break;
      case 'lang': settings.lang = getLang() === 'de' ? 'en' : 'de'; break;
      default: throw new Error(`unhandled: ${change satisfies never}`);
    }
    this.game.setSettings(settings);
    this.game.audio.play('uiSelect'); // silent when SOUND was just switched off
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
      case 'sound': return this.toggle('sfxOn');
      case 'music': return this.toggle('musicOn');
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
      const y = 422 + i * 23;
      text(ctx, t(what), 310, y, { size: 15, color: COLORS.ink });
      text(ctx, label(keys), 590, y, { size: 15, color: COLORS.cyan });
      text(ctx, label(pad), 790, y, { size: 15, color: COLORS.cyan, maxWidth: 200 });
    });
    text(ctx, t('controls.touch'), 640, 654, { size: 12, align: 'center', color: COLORS.dim, maxWidth: 690 });
    text(ctx, t('controls.joystick'), 640, 674, { size: 12, align: 'center', color: COLORS.dim, maxWidth: 690 });
  }
}
