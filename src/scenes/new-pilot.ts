import type { Scene } from '../core/scene';
import { lookPreset, randomLook, type AvatarLook } from '../game/avatar-look';
import { CALLSIGN_MAX, filterCallsignInput, validateCallsign, type CallsignCheck } from '../game/callsign';
import { cardCell, cardOrder, moveCard, NEW_PILOT_COLS } from '../game/pilot-cards';
import { MAX_PROFILES, type AvatarId } from '../game/profiles';
import type { GameContext, NewPilotDraft } from '../game/state';
import { t } from '../i18n/i18n';
import type { UiKey } from '../i18n/ui-en';
import { drawPilotAvatar, preloadCustomPortraits, type PilotFace } from '../render/avatars';
import { drawSunset } from '../render/backdrop';
import { COLORS, text } from '../render/text';
import { TextField } from '../ui/text-field';
import { drawButton, drawPanel, hit, type Button, type Rect } from '../ui/widgets';

const FIELD: Rect = { x: 390, y: 96, w: 500, h: 56 };
/** Rows of five cards at ¾ of the 240 × 288 portraits, so two rows fit (doc 08). */
const CARD_W = 180;
const CARD_H = 216;
const CARD_Y = 186;
const CARD_GAP = 10;
/** Row 1: pilot1–4 + CREATE YOUR OWN (doc 29); row 2: the next presets. */
const ORDER = cardOrder();
const OWN = ORDER.indexOf('own');
const CARDS = ORDER.length;
const BACK: Button = { id: 'back', label: '', x: 250, y: 640, w: 200, h: 46 };
const START: Button = { id: 'start', label: '', x: 470, y: 640, w: 320, h: 46, primary: true };
/** Restore a pilot from a pilot code on a fresh device (doc 08). */
const CODE: Button = { id: 'code', label: '', x: 810, y: 640, w: 220, h: 46 };

const ERRORS: Readonly<Record<Exclude<CallsignCheck, 'ok'>, UiKey>> = {
  'too-short': 'newPilot.tooShort',
  'too-long': 'newPilot.tooLong',
  'invalid-chars': 'newPilot.invalid',
  taken: 'newPilot.taken',
};

const cardRect = (i: number): Rect => {
  const { row, col } = cardCell(i);
  const left = 640 - (CARD_W * NEW_PILOT_COLS + CARD_GAP * (NEW_PILOT_COLS - 1)) / 2;
  return { x: left + col * (CARD_W + CARD_GAP), y: CARD_Y + row * (CARD_H + CARD_GAP), w: CARD_W, h: CARD_H };
};

/** NEW PILOT: type a callsign, pick a preset avatar or build your own, report for duty (docs 08, 29). */
export class NewPilotScene implements Scene {
  private time = 0;
  private avatar = 0;
  private shake = 0;
  private error: UiKey | null = null;
  /** The look built in the avatar builder (the CREATE YOUR OWN card); null until then. */
  private readonly look: AvatarLook | null;
  /** CREATE YOUR OWN shows a new random look every few seconds until one is built. */
  private readonly teaserSeed = Math.floor(Math.random() * 1e6);
  private readonly field: TextField;

  constructor(private readonly game: GameContext, draft?: NewPilotDraft) {
    this.look = draft?.look ?? null;
    this.avatar = draft ? Math.max(0, Math.min(CARDS - 1, Math.floor(draft.pick))) : 0;
    this.field = new TextField(game.dom.host, game.dom.viewport, FIELD, {
      maxLength: CALLSIGN_MAX, placeholder: t('newPilot.placeholder'), label: t('newPilot.callsign'),
      filter: filterCallsignInput,
      onEnter: () => this.submit(),
      onEscape: () => this.back(),
      onArrow: (d) => this.move(d, 0),
      onUpDown: (d) => this.move(0, d),
    });
    if (draft) this.field.value = draft.callsign;
  }

  enter(): void {
    this.game.music.play('menu');
    this.field.mount();
    preloadCustomPortraits(); // CREATE YOUR OWN cycles through the builder's portraits
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
    this.avatar = i;
    this.game.audio.play('uiMove');
  }

  private move(dx: number, dy: number): void {
    if (dy < 0 && this.avatar === OWN) return this.openBuilder(); // ↑ on CREATE YOUR OWN (top row) builds a look
    this.pick(moveCard(this.avatar, dx, dy, CARDS));
  }

  private teaser(): AvatarLook {
    return { ...randomLook(this.teaserSeed + Math.floor(this.time / 2.4)), face: 'f1' }; // only face 1 is preloaded
  }

  /** A preset, or on CREATE YOUR OWN the built look / the current random teaser. */
  private face(i: number): PilotFace {
    const card = ORDER[i] ?? 'pilot1';
    return card === 'own' ? this.look ?? this.teaser() : card;
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
    const card = ORDER[this.avatar];
    const id: AvatarId = look ? lookPreset(look) : card && card !== 'own' ? card : 'pilot1';
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
      if (hit(tap, CODE)) {
        this.game.audio.play('uiSelect');
        return this.game.go({ to: 'pilotCode', from: 'newPilot' });
      }
    }
    if (input.pressed('left')) this.move(-1, 0);
    if (input.pressed('right')) this.move(1, 0);
    if (input.pressed('up')) this.move(0, -1);
    if (input.pressed('down')) this.move(0, 1);
    if (input.pressed('special')) {
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
    text(ctx, t('newPilot.title'), 640, 54, { size: 40, display: true, italic: true, align: 'center', color: COLORS.gold, stroke: '#000', strokeWidth: 6 });
    this.renderField(ctx);
    for (let i = 0; i < CARDS; i++) this.renderCard(ctx, i);
    const ok = this.check() === 'ok' && !this.full;
    drawButton(ctx, { ...BACK, label: t('newPilot.back') }, false, this.time);
    drawButton(ctx, { ...START, label: t('newPilot.start'), enabled: ok }, ok, this.time);
    drawButton(ctx, { ...CODE, label: t('pilots.code') }, false, this.time);
    text(ctx, t('newPilot.hint'), 640, 708, { size: 13, align: 'center', color: COLORS.faint });
  }

  private renderCard(ctx: CanvasRenderingContext2D, i: number): void {
    const r = cardRect(i);
    const selected = i === this.avatar;
    const lift = selected ? -6 + Math.sin(this.time * 3) * 2 : 0;
    const box = { ...r, y: r.y + lift };
    drawPilotAvatar(ctx, this.face(i), box, { t: this.time + i, mood: selected ? 'happy' : 'neutral', selected });
    if (i !== OWN) return;
    const band: Rect = { x: box.x + 8, y: box.y + box.h - 48, w: box.w - 16, h: 40 };
    drawPanel(ctx, band, { fill: 'rgba(6,10,18,0.86)', edge: selected ? COLORS.gold : COLORS.panelEdge, radius: 6 });
    const title = this.look ? t('avatar.yours') : t('avatar.create');
    text(ctx, title, band.x + band.w / 2, band.y + 18, { size: 15, display: true, italic: true, align: 'center', color: COLORS.gold, maxWidth: band.w - 12 });
    text(ctx, t(this.look ? 'avatar.edit' : 'avatar.open'), band.x + band.w / 2, band.y + 34, { size: 11, align: 'center', color: COLORS.dim, maxWidth: band.w - 12 });
  }

  private renderField(ctx: CanvasRenderingContext2D): void {
    this.field.layout();
    const dx = this.shake > 0 ? Math.sin(this.shake * 60) * 8 : 0;
    text(ctx, t('newPilot.callsign'), 640, 86, { size: 13, align: 'center', color: COLORS.dim, letterSpacing: 2 });
    drawPanel(ctx, { ...FIELD, x: FIELD.x + dx }, {
      fill: 'rgba(8,14,24,0.9)', edge: this.field.focused ? COLORS.gold : COLORS.panelEdge, radius: 10,
    });
    const msg = this.full ? 'newPilot.full' : this.error;
    if (msg) text(ctx, t(msg), 640, 176, { size: 15, align: 'center', color: COLORS.red });
    else text(ctx, t('newPilot.avatar'), 640, 176, { size: 13, align: 'center', color: COLORS.dim, letterSpacing: 2 });
  }
}
