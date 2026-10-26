import type { Scene } from '../core/scene';
import { cycleLook, LOOK_PARTS, PRESET_LOOKS, randomLook, sameLook, type AvatarLook } from '../game/avatar-look';
import { AVATAR_IDS, type Profile } from '../game/profiles';
import type { BuilderTarget, GameContext } from '../game/state';
import { t } from '../i18n/i18n';
import { preloadCustomPortraits } from '../render/avatars';
import { hit } from '../ui/widgets';
import { arrowRect, barButtons, drawBuilder, rowRect, type BarButton } from './avatar-builder-render';

const ROWS = LOOK_PARTS.length;
const BAR_ROW = ROWS;
/** NEW PILOT's own-look card comes after the presets. */
const OWN_CARD = AVATAR_IDS.length;

/**
 * AVATAR BUILDER (docs 29, 33): one row per trait (age, skin, hair colour, hair length) with ◀ ▶, the generated
 * portrait nearest the pick as a big preview, RANDOM, (ORIGINAL), CANCEL, DONE. Keyboard and gamepad (↑/↓ rows and
 * the button bar, ←/→ change, ENTER/A done or press, ESC/B cancel, R/E/Y random), mouse (hover focuses, click ◀ ▶ /
 * a row / a button) and touch (tap). Nothing is stored before DONE: a new pilot's pick goes back to NEW PILOT in
 * the draft; an existing pilot's pick is saved via setSave.
 */
export class AvatarBuilderScene implements Scene {
  private time = 0;
  private look: AvatarLook;
  private readonly start: AvatarLook;
  private focus = 0;
  private bar: number;
  private rolls = 0;
  private readonly seed = Math.floor(Math.random() * 1e6);
  private readonly pilot: Profile | null;
  private readonly buttons: readonly BarButton[];

  constructor(private readonly game: GameContext, private readonly target: BuilderTarget) {
    this.pilot = target.kind === 'pilot' ? game.profiles.find((p) => p.id === target.profileId) ?? null : null;
    this.start = target.kind === 'new' ? target.start : this.pilot?.save.look ?? PRESET_LOOKS[this.pilot?.avatar ?? 'pilot1'];
    this.look = this.start;
    this.buttons = barButtons(this.pilot !== null);
    this.bar = this.buttons.length - 1;
  }

  enter(): void {
    this.game.music.play('menu');
    preloadCustomPortraits();
  }

  private change(row: number, dir: number): void {
    const part = LOOK_PARTS[row];
    if (!part) return;
    this.look = cycleLook(this.look, part, dir);
    this.game.audio.play('uiMove');
  }

  private random(): void {
    this.rolls++;
    this.look = randomLook(this.seed + this.rolls * 7919);
    this.game.audio.play('uiSelect');
  }

  /** Stores an existing pilot's pick (null = back to the preset portrait) through setSave. */
  private store(look: AvatarLook | null): void {
    if (!this.pilot) return;
    this.game.selectProfile(this.pilot.id); // setSave writes the active pilot
    this.game.setSave({ ...this.game.save, look });
    this.game.audio.play('buy');
  }

  private done(): void {
    const target = this.target;
    switch (target.kind) {
      case 'new':
        this.game.audio.play('uiSelect');
        return this.game.go({ to: 'newPilot', draft: { ...target.draft, look: this.look, pick: OWN_CARD } });
      case 'pilot': {
        // A preset pilot who changed nothing keeps the preset portrait.
        const untouched = this.pilot?.save.look === null && sameLook(this.look, this.start);
        if (!untouched) this.store(this.look);
        return this.game.go({ to: 'pilots' });
      }
      default: throw new Error(`unhandled: ${target satisfies never}`);
    }
  }

  private cancel(): void {
    this.game.audio.play('uiBack');
    const target = this.target;
    this.game.go(target.kind === 'new' ? { to: 'newPilot', draft: target.draft } : { to: 'pilots' });
  }

  private press(i: number): void {
    const id = this.buttons[i]?.id;
    if (id === 'random') this.random();
    else if (id === 'original') {
      this.store(null);
      this.game.go({ to: 'pilots' });
    } else if (id === 'cancel') this.cancel();
    else if (id === 'done') this.done();
  }

  /** Mouse hover moves the focus; taps hit arrows, rows (next option) and the buttons. */
  private pointer(): boolean {
    const input = this.game.input;
    if (input.device === 'mouse') {
      const row = LOOK_PARTS.findIndex((_, i) => hit(input.pointer, rowRect(i)));
      const b = this.buttons.findIndex((x) => hit(input.pointer, x));
      if (row >= 0) this.focus = row;
      if (b >= 0) [this.focus, this.bar] = [BAR_ROW, b];
    }
    for (const tap of input.taps) {
      for (let i = 0; i < ROWS; i++) {
        if (!hit(tap, rowRect(i))) continue;
        this.focus = i;
        this.change(i, hit(tap, arrowRect(i, -1)) ? -1 : 1);
        return true;
      }
      const b = this.buttons.findIndex((x) => hit(tap, x));
      if (b >= 0) {
        [this.focus, this.bar] = [BAR_ROW, b];
        this.press(b);
        return true;
      }
    }
    return false;
  }

  private keys(): void {
    const input = this.game.input;
    const n = this.buttons.length;
    if (input.pressed('up')) this.focus = (this.focus + ROWS) % (ROWS + 1);
    if (input.pressed('down')) this.focus = (this.focus + 1) % (ROWS + 1);
    const dir = (input.pressed('right') ? 1 : 0) - (input.pressed('left') ? 1 : 0);
    const onBar = this.focus === BAR_ROW;
    if (dir !== 0 && onBar) {
      this.bar = (this.bar + dir + n) % n;
      this.game.audio.play('uiMove');
    } else if (dir !== 0) this.change(this.focus, dir);
    if (input.pressed('back')) return this.cancel(); // before R: a pad's B button is 'secondary' + 'back'
    if (input.pressed('secondary') || input.pressed('special')) return this.random();
    if (input.pressed('confirm')) this.press(onBar ? this.bar : n - 1); // ENTER / A on a row = DONE
  }

  update(dt: number): void {
    this.time += dt;
    if (this.pointer()) return;
    this.keys();
  }

  render(ctx: CanvasRenderingContext2D): void {
    const callsign = this.target.kind === 'new' ? this.target.draft.callsign : this.pilot?.callsign ?? '';
    drawBuilder(ctx, {
      t: this.time, look: this.look, focus: this.focus, bar: this.bar, buttons: this.buttons, callsign,
      title: this.pilot ? t('avatar.titleEdit', { callsign: this.pilot.callsign }) : t('avatar.title'),
    });
  }
}
