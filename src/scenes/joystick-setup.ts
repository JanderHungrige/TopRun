import { readPads } from '../core/gamepad';
import type { Scene } from '../core/scene';
import type { AxisBind, ButtonBind, PadFrame } from '../game/joystick';
import { createSetup, SETUP_STEPS, setupProfile, stepSetup, type SetupState, type SetupStep } from '../game/joystick-setup';
import type { GameContext } from '../game/state';
import { t } from '../i18n/i18n';
import type { UiKey } from '../i18n/ui-en';
import { drawSunset } from '../render/backdrop';
import { drawChecklist, drawPadMonitor, type ChecklistRow } from '../render/joystick-panel';
import { COLORS, text, wrap } from '../render/text';
import { drawButton, drawPanel, hit, type Button } from '../ui/widgets';

type Step = Exclude<SetupStep, 'done'>;

const SKIP: Button = { id: 'skip', label: '', x: 500, y: 642, w: 200, h: 48, hint: 'S' };
const CANCEL: Button = { id: 'cancel', label: '', x: 716, y: 642, w: 200, h: 48, hint: 'Esc' };
const CLEAR: Button = { id: 'clear', label: '', x: 932, y: 642, w: 278, h: 48, hint: 'Del' };
const LIST = { x: 50, y: 92, w: 430, h: 550 };
const ASK = { x: 500, y: 92, w: 710, h: 250 };
const MONITOR = { x: 500, y: 356, w: 710, h: 270 };

const ROW: Readonly<Record<Step, UiKey>> = {
  right: 'joy.row.right', back: 'joy.row.back', fire: 'joy.row.fire', throttle: 'joy.row.throttle',
  missile: 'joy.row.missile', flare: 'joy.row.flare', special: 'joy.row.special', switch: 'joy.row.switch', pause: 'joy.row.pause',
};
const ASK_TEXT: Readonly<Record<Step, UiKey>> = {
  right: 'joy.ask.right', back: 'joy.ask.back', fire: 'joy.ask.fire', throttle: 'joy.ask.throttle',
  missile: 'joy.ask.missile', flare: 'joy.ask.flare', special: 'joy.ask.special', switch: 'joy.ask.switch', pause: 'joy.ask.pause',
};

/** JOYSTICK setup (doc 01): bind stick, throttle and buttons by moving / pressing them. */
export class JoystickSetupScene implements Scene {
  private time = 0;
  private setup: SetupState | null = null;
  private frames: PadFrame[] = [];
  private doneTimer = 0;
  private note: UiKey | null = null;
  private leaving = false;

  constructor(private readonly game: GameContext) {}

  enter(): void {
    this.game.music.play('menu');
    this.game.input.padSuspended = true;
  }

  exit(): void {
    this.game.input.padSuspended = false;
  }

  update(dt: number): void {
    this.time += dt;
    const input = this.game.input;
    this.frames = readPads();
    const tapped = (b: Button): boolean => input.taps.some((p) => hit(p, b));
    if (input.pressed('back') || tapped(CANCEL)) return this.leave();
    if ((input.pressed('delete') || tapped(CLEAR)) && this.game.settings.joystick) return this.clear();
    if (!this.setup) {
      if (this.frames.length > 0) this.setup = createSetup(this.frames);
      return;
    }
    if (this.setup.step === 'done') {
      this.doneTimer += dt;
      if (this.doneTimer > 2) this.leave();
      return;
    }
    const before = this.setup;
    this.setup = stepSetup(before, this.frames, input.pressed('skip') || tapped(SKIP));
    this.react(before, this.setup);
  }

  private react(before: SetupState, after: SetupState): void {
    if (after.step !== before.step) {
      this.note = null;
      if (after.step !== 'done') return this.game.audio.play('uiSelect');
      this.game.audio.play('powerup');
      this.game.setSettings({ ...this.game.settings, joystick: setupProfile(after, this.frames[0]?.id ?? 'joystick') });
    } else if (after.error && after.error !== before.error) {
      this.game.audio.play('denied');
    }
  }

  private clear(): void {
    this.game.setSettings({ ...this.game.settings, joystick: null });
    this.game.audio.play('uiBack');
    this.note = 'joy.cleared';
  }

  private leave(): void {
    if (this.leaving) return;
    this.leaving = true;
    this.game.audio.play('uiBack');
    this.game.go({ to: 'title' });
  }

  private stickPad(): string | undefined {
    return this.setup?.x?.pad ?? this.setup?.y?.pad ?? this.frames[0]?.id;
  }

  private axisLabel(b: AxisBind, showInvert: boolean): string {
    const parts = [t('joy.axis', { n: b.index + 1 })];
    if (showInvert && b.invert) parts.push(t('joy.reversed'));
    if (b.pad !== this.stickPad()) parts.push(t('joy.otherDevice'));
    return parts.join(' · ');
  }

  private buttonLabel(b: ButtonBind): string {
    const name = t('joy.button', { n: b.index + 1 });
    return b.pad === this.stickPad() ? name : `${name} · ${t('joy.otherDevice')}`;
  }

  private valueOf(s: SetupState, step: Step, passed: boolean): string {
    switch (step) {
      case 'right': return s.x ? this.axisLabel(s.x, true) : passed ? t('joy.default') : '';
      case 'back': return s.y ? this.axisLabel(s.y, true) : passed ? t('joy.default') : '';
      case 'throttle': return s.throttle ? this.axisLabel(s.throttle, false) : passed ? t('joy.unbound') : '';
      case 'fire':
      case 'missile':
      case 'flare':
      case 'special':
      case 'switch':
      case 'pause': {
        const b = s.buttons[step];
        return b ? this.buttonLabel(b) : passed ? t('joy.unbound') : '';
      }
      default: throw new Error(`unhandled: ${step satisfies never}`);
    }
  }

  private rows(): ChecklistRow[] {
    const s = this.setup;
    const at = s ? (s.step === 'done' ? SETUP_STEPS.length : SETUP_STEPS.indexOf(s.step)) : -1;
    return SETUP_STEPS.map((step, i) => ({
      label: t(ROW[step]),
      value: s ? this.valueOf(s, step, i < at) : '',
      state: i < at ? 'done' : i === at ? 'current' : 'todo',
    }));
  }

  render(ctx: CanvasRenderingContext2D): void {
    drawSunset(ctx, this.time);
    ctx.fillStyle = 'rgba(4,8,14,0.74)';
    ctx.fillRect(0, 0, 1280, 720);
    text(ctx, t('joy.title'), 640, 62, { size: 30, display: true, italic: true, align: 'center', color: COLORS.gold, shadow: true });
    drawPanel(ctx, LIST);
    drawChecklist(ctx, { x: LIST.x + 14, y: LIST.y + 16, w: LIST.w - 28, h: LIST.h - 60 }, this.rows(), this.time);
    if (this.game.settings.joystick) {
      text(ctx, t('joy.hasProfile'), LIST.x + 20, LIST.y + LIST.h - 20, { size: 12, color: COLORS.dim, maxWidth: LIST.w - 40 });
    }
    drawPanel(ctx, ASK);
    this.renderAsk(ctx);
    drawPanel(ctx, MONITOR);
    text(ctx, t('joy.devices'), MONITOR.x + 18, MONITOR.y + 28, { size: 12, color: COLORS.dim, letterSpacing: 2 });
    drawPadMonitor(ctx, { x: MONITOR.x + 18, y: MONITOR.y + 44, w: MONITOR.w - 36, h: MONITOR.h - 56 }, this.frames);
    const active = this.setup !== null && this.setup.step !== 'done';
    drawButton(ctx, { ...SKIP, label: t('joy.skip'), enabled: active }, false, this.time);
    drawButton(ctx, { ...CANCEL, label: t('joy.cancel') }, false, this.time);
    drawButton(ctx, { ...CLEAR, label: t('joy.clear'), enabled: this.game.settings.joystick !== null }, false, this.time);
  }

  private renderAsk(ctx: CanvasRenderingContext2D): void {
    const cx = ASK.x + ASK.w / 2;
    const s = this.setup;
    const [main, sub, color] = !s
      ? [t('joy.wake'), t('joy.wakeHint'), COLORS.ink]
      : s.step === 'done' ? [t('joy.done'), '', COLORS.green] : [t(ASK_TEXT[s.step]), '', COLORS.ink];
    if (s && s.step !== 'done') {
      text(ctx, `${SETUP_STEPS.indexOf(s.step) + 1} / ${SETUP_STEPS.length}`, cx, ASK.y + 34, { size: 13, align: 'center', color: COLORS.dim, letterSpacing: 2 });
    }
    const lines = wrap(ctx, main, ASK.w - 80, 28);
    // Body font: wrap() measures with it.
    lines.forEach((ln, i) => text(ctx, ln, cx, ASK.y + 96 + i * 38, { size: 28, align: 'center', color }));
    const y = ASK.y + 110 + lines.length * 38;
    if (sub) text(ctx, sub, cx, y, { size: 15, align: 'center', color: COLORS.dim, maxWidth: ASK.w - 60 });
    const err = s?.error;
    if (err) {
      const msg = err.kind === 'used' ? t('joy.used', { what: t(ROW[err.by]) }) : t('joy.noThrottle');
      text(ctx, msg, cx, y, { size: 17, align: 'center', color: COLORS.red, maxWidth: ASK.w - 60 });
    }
    if (this.note) text(ctx, t(this.note), cx, ASK.y + ASK.h - 20, { size: 14, align: 'center', color: COLORS.cyan, maxWidth: ASK.w - 60 });
  }
}
