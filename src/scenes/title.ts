import type { Scene } from '../core/scene';
import { defaultSave, hasProgress } from '../game/save';
import type { GameContext } from '../game/state';
import { drawFlyby, drawLogo, drawSunset } from '../render/backdrop';
import { COLORS, text } from '../render/text';
import { ButtonGroup, drawPanel, type Button } from '../ui/widgets';

type Mode = 'menu' | 'confirm' | 'controls';

const CONTROLS: ReadonlyArray<readonly [string, string, string]> = [
  ['Move', 'Arrows / WASD', 'Left stick / D-pad'],
  ['Gun (hold)', 'Space / J', 'A'],
  ['Missile / bomb', 'Shift / K', 'B'],
  ['Switch weapon', 'Q / L', 'LB / RB'],
  ['Flare', 'F', 'X'],
  ['Special move', 'E', 'Y'],
  ['Pause', 'P / Esc', 'Start'],
  ['Mute', 'M', '—'],
];

export class TitleScene implements Scene {
  private t = 0;
  private mode: Mode = 'menu';
  private menu = new ButtonGroup([]);
  private confirm = new ButtonGroup([], 'horizontal');

  constructor(private readonly game: GameContext) {}

  enter(): void {
    this.game.music.play('menu');
    this.buildMenu();
  }

  private buildMenu(): void {
    const cont = hasProgress(this.game.save);
    const labels: Array<[string, string]> = [
      ...(cont ? ([['continue', 'CONTINUE']] as Array<[string, string]>) : []),
      ['new', 'NEW GAME'],
      ['controls', 'CONTROLS'],
      ['sound', this.game.save.settings.muted ? 'SOUND: OFF' : 'SOUND: ON'],
      ['autofire', this.game.save.settings.autofire ? 'AUTOFIRE: ON' : 'AUTOFIRE: OFF'],
    ];
    const top = 680 - labels.length * 50;
    const buttons: Button[] = labels.map(([id, label], i) => ({ id, label, x: 520, y: top + i * 50, w: 240, h: 42, primary: i === 0 }));
    const focus = this.menu.focused?.id;
    this.menu.setButtons(buttons);
    if (focus) this.menu.focusId(focus);
    this.confirm.setButtons([
      { id: 'yes', label: 'START OVER', x: 470, y: 420, w: 160, h: 44, primary: true },
      { id: 'no', label: 'CANCEL', x: 650, y: 420, w: 160, h: 44 },
    ]);
    this.confirm.focus = 1;
  }

  update(dt: number): void {
    this.t += dt;
    const input = this.game.input;
    if (this.mode === 'controls') {
      if (input.pressed('back') || input.pressed('confirm') || input.taps.length > 0) this.setMode('menu');
      return;
    }
    if (this.mode === 'confirm') {
      const id = this.confirm.update(input);
      if (id === 'yes') this.startNew();
      if (id === 'no' || input.pressed('back')) this.setMode('menu');
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

  private activate(id: string): void {
    switch (id) {
      case 'continue':
        this.game.audio.play('uiSelect');
        this.game.go({ to: 'map' });
        return;
      case 'new':
        if (hasProgress(this.game.save)) this.setMode('confirm');
        else this.startNew();
        return;
      case 'controls':
        this.setMode('controls');
        return;
      case 'sound': {
        const muted = !this.game.save.settings.muted;
        this.game.audio.setMuted(muted);
        this.game.setSave({ ...this.game.save, settings: { ...this.game.save.settings, muted } });
        this.game.audio.play('uiSelect');
        this.buildMenu();
        return;
      }
      case 'autofire': {
        const autofire = !this.game.save.settings.autofire;
        this.game.setSave({ ...this.game.save, settings: { ...this.game.save.settings, autofire } });
        this.game.audio.play('uiSelect');
        this.buildMenu();
        return;
      }
      default:
        return;
    }
  }

  private startNew(): void {
    const fresh = defaultSave();
    fresh.settings = { ...this.game.save.settings };
    this.game.setSave(fresh);
    this.game.audio.play('uiSelect');
    this.game.go({ to: 'map' });
  }

  render(ctx: CanvasRenderingContext2D): void {
    drawSunset(ctx, this.t);
    drawFlyby(ctx, this.t);
    drawLogo(ctx, 640, 210, this.t);
    text(ctx, '30 MISSIONS  ·  3 LEGENDARY JETS  ·  1 CARRIER', 640, 300, { size: 15, align: 'center', color: '#ffd9c2', letterSpacing: 2, shadow: true });
    if (this.mode === 'menu') this.menu.render(ctx, this.t);
    if (this.mode === 'confirm') this.renderConfirm(ctx);
    if (this.mode === 'controls') this.renderControls(ctx);
    const hint = this.game.input.device === 'touch' ? 'Tap to select' : 'Arrows + Enter to select  ·  M to mute';
    text(ctx, hint, 640, 700, { size: 13, align: 'center', color: COLORS.dim });
  }

  private renderConfirm(ctx: CanvasRenderingContext2D): void {
    drawPanel(ctx, { x: 430, y: 330, w: 420, h: 160 });
    text(ctx, 'Start a new career?', 640, 372, { size: 22, display: true, align: 'center', color: COLORS.gold });
    text(ctx, 'Your money, jets and medals will be lost.', 640, 400, { size: 15, align: 'center', color: COLORS.dim });
    this.confirm.render(ctx, this.t);
  }

  private renderControls(ctx: CanvasRenderingContext2D): void {
    drawPanel(ctx, { x: 300, y: 330, w: 680, h: 350 });
    text(ctx, 'CONTROLS', 640, 368, { size: 24, display: true, align: 'center', color: COLORS.gold });
    text(ctx, 'KEYBOARD', 600, 400, { size: 12, color: COLORS.dim, letterSpacing: 2 });
    text(ctx, 'GAMEPAD', 800, 400, { size: 12, color: COLORS.dim, letterSpacing: 2 });
    CONTROLS.forEach(([what, keys, pad], i) => {
      const y = 428 + i * 27;
      text(ctx, what, 340, y, { size: 15, color: COLORS.ink });
      text(ctx, keys, 600, y, { size: 15, color: COLORS.cyan });
      text(ctx, pad, 800, y, { size: 15, color: COLORS.cyan });
    });
    text(ctx, 'Touch: drag to fly, auto-fire, buttons on the side panels.  Carrier: hold FIRE to throttle up, tap FIRE to rotate.', 640, 660, { size: 12, align: 'center', color: COLORS.dim });
  }
}
