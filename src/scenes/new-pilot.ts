import type { Scene } from '../core/scene';
import { CALLSIGN_MAX, filterCallsignInput, validateCallsign, type CallsignCheck } from '../game/callsign';
import { AVATAR_IDS, MAX_PROFILES, type AvatarId } from '../game/profiles';
import type { GameContext } from '../game/state';
import { t } from '../i18n/i18n';
import type { UiKey } from '../i18n/ui-en';
import { drawAvatar } from '../render/avatars';
import { drawSunset } from '../render/backdrop';
import { COLORS, text } from '../render/text';
import { TextField } from '../ui/text-field';
import { drawButton, drawPanel, hit, type Button, type Rect } from '../ui/widgets';

const FIELD: Rect = { x: 390, y: 146, w: 500, h: 64 };
const CARD_W = 240;
const CARD_H = 288;
const CARD_Y = 300;
const BACK: Button = { id: 'back', label: '', x: 370, y: 624, w: 200, h: 50 };
const START: Button = { id: 'start', label: '', x: 590, y: 624, w: 320, h: 50, primary: true };

const ERRORS: Readonly<Record<Exclude<CallsignCheck, 'ok'>, UiKey>> = {
  'too-short': 'newPilot.tooShort',
  'too-long': 'newPilot.tooLong',
  'invalid-chars': 'newPilot.invalid',
  taken: 'newPilot.taken',
};

const cardRect = (i: number): Rect => ({ x: 640 - (CARD_W * 3 + 40) / 2 + i * (CARD_W + 20), y: CARD_Y, w: CARD_W, h: CARD_H });

/** NEW PILOT: type a callsign, pick an avatar, report for duty (doc 08). */
export class NewPilotScene implements Scene {
  private time = 0;
  private avatar = 0;
  private shake = 0;
  private error: UiKey | null = null;
  private readonly field: TextField;

  constructor(private readonly game: GameContext) {
    this.field = new TextField(game.dom.host, game.dom.viewport, FIELD, {
      maxLength: CALLSIGN_MAX, placeholder: t('newPilot.placeholder'), label: t('newPilot.callsign'),
      filter: filterCallsignInput,
      onEnter: () => this.submit(),
      onEscape: () => this.back(),
      onArrow: (d) => this.pick(this.avatar + d),
    });
  }

  enter(): void {
    this.game.music.play('menu');
    this.field.mount();
  }

  exit(): void {
    this.field.unmount();
  }

  private get full(): boolean {
    return this.game.profiles.length >= MAX_PROFILES;
  }

  private check(): CallsignCheck {
    return validateCallsign(this.field.value, this.game.profiles.map((p) => p.callsign));
  }

  private pick(i: number): void {
    const n = AVATAR_IDS.length;
    this.avatar = ((i % n) + n) % n;
    this.game.audio.play('uiMove');
  }

  private back(): void {
    this.game.audio.play('uiBack');
    this.game.go({ to: this.game.profiles.length > 0 ? 'pilots' : 'title' });
  }

  private submit(): void {
    const id: AvatarId = AVATAR_IDS[this.avatar] ?? 'pilot1';
    const r = this.game.createProfile(this.field.value, id);
    if (r.ok) {
      this.game.audio.play('buy');
      this.game.go({ to: 'map' });
      return;
    }
    this.error = r.reason === 'full' ? 'newPilot.full' : ERRORS[r.reason === 'ok' ? 'too-short' : r.reason];
    this.shake = 0.4;
    this.game.audio.play('denied');
  }

  update(dt: number): void {
    this.time += dt;
    this.shake = Math.max(0, this.shake - dt);
    const input = this.game.input;
    for (const tap of input.taps) {
      AVATAR_IDS.forEach((_, i) => {
        if (hit(tap, cardRect(i))) this.pick(i);
      });
      if (hit(tap, BACK)) return this.back();
      if (hit(tap, START)) return this.submit();
    }
    if (input.pressed('left')) this.pick(this.avatar - 1);
    if (input.pressed('right')) this.pick(this.avatar + 1);
    if (input.pressed('confirm')) this.submit();
    if (input.pressed('back')) this.back();
    if (input.device !== 'touch' && !this.field.focused) this.field.focus();
    if (this.check() === 'ok') this.error = null;
  }

  render(ctx: CanvasRenderingContext2D): void {
    drawSunset(ctx, this.time);
    ctx.fillStyle = 'rgba(4,8,16,0.55)';
    ctx.fillRect(0, 0, 1280, 720);
    text(ctx, t('newPilot.title'), 640, 82, { size: 44, display: true, italic: true, align: 'center', color: COLORS.gold, stroke: '#000', strokeWidth: 6 });
    this.renderField(ctx);
    text(ctx, t('newPilot.avatar'), 640, 284, { size: 13, align: 'center', color: COLORS.dim, letterSpacing: 2 });
    AVATAR_IDS.forEach((id, i) => {
      const r = cardRect(i);
      const selected = i === this.avatar;
      const lift = selected ? -6 + Math.sin(this.time * 3) * 2 : 0;
      drawAvatar(ctx, id, { ...r, y: r.y + lift }, { t: this.time + i, mood: selected ? 'happy' : 'neutral', selected });
    });
    const ok = this.check() === 'ok' && !this.full;
    drawButton(ctx, { ...BACK, label: t('newPilot.back') }, false, this.time);
    drawButton(ctx, { ...START, label: t('newPilot.start'), enabled: ok }, ok, this.time);
    text(ctx, t('newPilot.hint'), 640, 704, { size: 13, align: 'center', color: COLORS.faint });
  }

  private renderField(ctx: CanvasRenderingContext2D): void {
    this.field.layout();
    const dx = this.shake > 0 ? Math.sin(this.shake * 60) * 8 : 0;
    text(ctx, t('newPilot.callsign'), 640, 136, { size: 13, align: 'center', color: COLORS.dim, letterSpacing: 2 });
    drawPanel(ctx, { ...FIELD, x: FIELD.x + dx }, {
      fill: 'rgba(8,14,24,0.9)', edge: this.field.focused ? COLORS.gold : COLORS.panelEdge, radius: 10,
    });
    const msg = this.full ? 'newPilot.full' : this.error;
    if (msg) text(ctx, t(msg), 640, 238, { size: 15, align: 'center', color: COLORS.red });
  }
}
