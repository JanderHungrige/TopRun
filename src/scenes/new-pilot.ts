import type { Scene } from '../core/scene';
import { lookPreset, randomLook, type AvatarLook } from '../game/avatar-look';
import { CALLSIGN_MAX, filterCallsignInput, validateCallsign, type CallsignCheck } from '../game/callsign';
import { AVATAR_IDS, MAX_PROFILES, type AvatarId } from '../game/profiles';
import type { GameContext, NewPilotDraft } from '../game/state';
import { t } from '../i18n/i18n';
import type { UiKey } from '../i18n/ui-en';
import { drawPilotAvatar, type PilotFace } from '../render/avatars';
import { drawSunset } from '../render/backdrop';
import { COLORS, text } from '../render/text';
import { TextField } from '../ui/text-field';
import { drawButton, drawPanel, hit, type Button, type Rect } from '../ui/widgets';

const FIELD: Rect = { x: 390, y: 146, w: 500, h: 64 };
const CARD_W = 240;
const CARD_H = 288;
const CARD_Y = 300;
const CARD_GAP = 20;
/** Cards: the three presets, then CREATE YOUR OWN (doc 29). */
const OWN = AVATAR_IDS.length;
const CARDS = OWN + 1;
const BACK: Button = { id: 'back', label: '', x: 370, y: 624, w: 200, h: 50 };
const START: Button = { id: 'start', label: '', x: 590, y: 624, w: 320, h: 50, primary: true };

const ERRORS: Readonly<Record<Exclude<CallsignCheck, 'ok'>, UiKey>> = {
  'too-short': 'newPilot.tooShort',
  'too-long': 'newPilot.tooLong',
  'invalid-chars': 'newPilot.invalid',
  taken: 'newPilot.taken',
};

const cardRect = (i: number): Rect => ({
  x: 640 - (CARD_W * CARDS + CARD_GAP * (CARDS - 1)) / 2 + i * (CARD_W + CARD_GAP), y: CARD_Y, w: CARD_W, h: CARD_H,
});

/** NEW PILOT: type a callsign, pick a preset avatar or build your own, report for duty (docs 08, 29). */
export class NewPilotScene implements Scene {
  private time = 0;
  private avatar = 0;
  private shake = 0;
  private error: UiKey | null = null;
  /** The look built in the avatar builder (card 4); null until then. */
  private readonly look: AvatarLook | null;
  /** Card 4 shows a new random look every few seconds until one is built. */
  private readonly teaserSeed = Math.floor(Math.random() * 1e6);
  private readonly field: TextField;

  constructor(private readonly game: GameContext, draft?: NewPilotDraft) {
    this.look = draft?.look ?? null;
    this.avatar = draft ? Math.max(0, Math.min(OWN, Math.floor(draft.pick))) : 0;
    this.field = new TextField(game.dom.host, game.dom.viewport, FIELD, {
      maxLength: CALLSIGN_MAX, placeholder: t('newPilot.placeholder'), label: t('newPilot.callsign'),
      filter: filterCallsignInput,
      onEnter: () => this.submit(),
      onEscape: () => this.back(),
      onArrow: (d) => this.pick(this.avatar + d),
      onUpDown: (d) => {
        if (d > 0) this.openBuilder();
      },
    });
    if (draft) this.field.value = draft.callsign;
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
    this.avatar = ((i % CARDS) + CARDS) % CARDS;
    this.game.audio.play('uiMove');
  }

  private teaser(): AvatarLook {
    return randomLook(this.teaserSeed + Math.floor(this.time / 2.4));
  }

  /** Card 4's look: the built one, or the current random teaser. */
  private face(i: number): PilotFace {
    return i < OWN ? AVATAR_IDS[i] ?? 'pilot1' : this.look ?? this.teaser();
  }

  private openBuilder(): void {
    this.game.audio.play('uiSelect');
    const draft: NewPilotDraft = { callsign: this.field.value, look: this.look, pick: this.avatar };
    this.game.go({ to: 'avatarBuilder', target: { kind: 'new', draft, start: this.look ?? this.teaser() } });
  }

  private back(): void {
    this.game.audio.play('uiBack');
    this.game.go({ to: this.game.profiles.length > 0 ? 'pilots' : 'title' });
  }

  private submit(): void {
    if (this.avatar === OWN && !this.look) return this.openBuilder();
    const look = this.avatar === OWN ? this.look : null;
    const id: AvatarId = look ? lookPreset(look) : AVATAR_IDS[this.avatar] ?? 'pilot1';
    const r = this.game.createProfile(this.field.value, id);
    if (r.ok) {
      if (look) this.game.setSave({ ...this.game.save, look }); // the new pilot is the active one now
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
      const card = Array.from({ length: CARDS }, (_, i) => i).find((i) => hit(tap, cardRect(i)));
      if (card === OWN) {
        this.avatar = OWN;
        return this.openBuilder();
      }
      if (card !== undefined) this.pick(card);
      if (hit(tap, BACK)) return this.back();
      if (hit(tap, START)) return this.submit();
    }
    if (input.pressed('left')) this.pick(this.avatar - 1);
    if (input.pressed('right')) this.pick(this.avatar + 1);
    if (input.pressed('down') || input.pressed('special')) {
      this.avatar = OWN;
      return this.openBuilder();
    }
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
    for (let i = 0; i < CARDS; i++) this.renderCard(ctx, i);
    const ok = this.check() === 'ok' && !this.full;
    drawButton(ctx, { ...BACK, label: t('newPilot.back') }, false, this.time);
    drawButton(ctx, { ...START, label: t('newPilot.start'), enabled: ok }, ok, this.time);
    text(ctx, t('newPilot.hint'), 640, 704, { size: 13, align: 'center', color: COLORS.faint });
  }

  private renderCard(ctx: CanvasRenderingContext2D, i: number): void {
    const r = cardRect(i);
    const selected = i === this.avatar;
    const lift = selected ? -6 + Math.sin(this.time * 3) * 2 : 0;
    const box = { ...r, y: r.y + lift };
    drawPilotAvatar(ctx, this.face(i), box, { t: this.time + i, mood: selected ? 'happy' : 'neutral', selected });
    if (i !== OWN) return;
    const band: Rect = { x: box.x + 10, y: box.y + box.h - 52, w: box.w - 20, h: 42 };
    drawPanel(ctx, band, { fill: 'rgba(6,10,18,0.86)', edge: selected ? COLORS.gold : COLORS.panelEdge, radius: 6 });
    const title = this.look ? t('avatar.yours') : t('avatar.create');
    text(ctx, title, band.x + band.w / 2, band.y + 18, { size: 15, display: true, italic: true, align: 'center', color: COLORS.gold, maxWidth: band.w - 12 });
    text(ctx, t(this.look ? 'avatar.edit' : 'avatar.open'), band.x + band.w / 2, band.y + 34, { size: 11, align: 'center', color: COLORS.dim, maxWidth: band.w - 12 });
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
