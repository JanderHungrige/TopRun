import { formatMoney } from '../core/math';
import type { Scene } from '../core/scene';
import { MAX_PROFILES, profileSummary, type Profile } from '../game/profiles';
import type { GameContext } from '../game/state';
import { t } from '../i18n/i18n';
import { AVATAR_COLORS, drawAvatar } from '../render/avatars';
import { drawSunset } from '../render/backdrop';
import { COLORS, text } from '../render/text';
import { drawButton, drawPanel, hit, type Button, type Rect } from '../ui/widgets';

const CARD_W = 380;
const CARD_H = 230;
const BACK: Button = { id: 'back', label: '', x: 370, y: 632, w: 200, h: 50 };
const NEW: Button = { id: 'new', label: '', x: 590, y: 632, w: 320, h: 50 };
const CONFIRM_YES: Button = { id: 'yes', label: '', x: 450, y: 404, w: 180, h: 46, primary: true };
const CONFIRM_NO: Button = { id: 'no', label: '', x: 650, y: 404, w: 180, h: 46 };

const cardRect = (i: number): Rect => ({ x: 50 + (i % 3) * (CARD_W + 20), y: 116 + Math.floor(i / 3) * (CARD_H + 20), w: CARD_W, h: CARD_H });
const flyRect = (r: Rect): Rect => ({ x: r.x + 186, y: r.y + 134, w: 178, h: 42 });
const delRect = (r: Rect): Rect => ({ x: r.x + 186, y: r.y + 186, w: 120, h: 30 });

/** CONTINUE: pick which pilot flies, or delete one (doc 08). */
export class PilotsScene implements Scene {
  private time = 0;
  private focus = 0;
  private confirmDelete: Profile | null = null;

  constructor(private readonly game: GameContext) {}

  enter(): void {
    this.game.music.play('menu');
  }

  private get list(): readonly Profile[] {
    return this.game.profiles;
  }

  private fly(p: Profile): void {
    this.game.audio.play('uiSelect');
    this.game.selectProfile(p.id);
    this.game.go({ to: 'map' });
  }

  private move(d: number): void {
    const n = this.list.length;
    if (n === 0) return;
    this.focus = (((this.focus + d) % n) + n) % n;
    this.game.audio.play('uiMove');
  }

  update(dt: number): void {
    this.time += dt;
    const input = this.game.input;
    if (this.confirmDelete) return this.updateConfirm();
    for (const tap of input.taps) {
      if (hit(tap, BACK)) return this.leave('title');
      if (hit(tap, NEW) && this.list.length < MAX_PROFILES) return this.leave('newPilot');
      const i = this.list.findIndex((_, k) => hit(tap, cardRect(k)));
      const p = this.list[i];
      if (!p) continue;
      this.focus = i;
      if (hit(tap, delRect(cardRect(i)))) this.askDelete(p);
      else this.fly(p);
      return;
    }
    if (input.pressed('left') || input.pressed('up')) this.move(input.pressed('up') ? -3 : -1);
    if (input.pressed('right') || input.pressed('down')) this.move(input.pressed('down') ? 3 : 1);
    const p = this.list[this.focus];
    if (p && input.pressed('confirm')) return this.fly(p);
    if (p && input.pressed('delete')) return this.askDelete(p);
    if (input.pressed('back')) this.leave('title');
  }

  private leave(to: 'title' | 'newPilot'): void {
    this.game.audio.play(to === 'title' ? 'uiBack' : 'uiSelect');
    this.game.go({ to });
  }

  private askDelete(p: Profile): void {
    this.confirmDelete = p;
    this.game.audio.play('warning');
  }

  private updateConfirm(): void {
    const input = this.game.input;
    const p = this.confirmDelete;
    if (!p) return;
    const yes = input.taps.some((tap) => hit(tap, CONFIRM_YES));
    const no = input.taps.some((tap) => hit(tap, CONFIRM_NO)) || input.pressed('back');
    if (yes) {
      this.game.deleteProfile(p.id);
      this.game.audio.play('explosionSmall');
      this.focus = 0;
      this.confirmDelete = null;
      if (this.list.length === 0) this.leave('title');
    } else if (no) {
      this.confirmDelete = null;
      this.game.audio.play('uiBack');
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    drawSunset(ctx, this.time);
    ctx.fillStyle = 'rgba(4,8,16,0.6)';
    ctx.fillRect(0, 0, 1280, 720);
    text(ctx, t('pilots.title'), 640, 82, { size: 42, display: true, italic: true, align: 'center', color: COLORS.gold, stroke: '#000', strokeWidth: 6 });
    this.list.forEach((p, i) => this.renderCard(ctx, p, i));
    drawButton(ctx, { ...BACK, label: t('pilots.back') }, false, this.time);
    drawButton(ctx, { ...NEW, label: t('pilots.newPilot'), enabled: this.list.length < MAX_PROFILES }, false, this.time);
    text(ctx, t('pilots.hint'), 640, 706, { size: 13, align: 'center', color: COLORS.faint });
    if (this.confirmDelete) this.renderConfirm(ctx, this.confirmDelete);
  }

  private renderCard(ctx: CanvasRenderingContext2D, p: Profile, i: number): void {
    const r = cardRect(i);
    const focused = i === this.focus && !this.confirmDelete;
    drawPanel(ctx, r, { fill: focused ? 'rgba(30,52,80,0.95)' : 'rgba(10,18,30,0.9)', edge: focused ? COLORS.gold : AVATAR_COLORS[p.avatar], radius: 12 });
    drawAvatar(ctx, p.avatar, { x: r.x + 14, y: r.y + 16, w: 160, h: 198 }, { t: this.time + i * 1.3, mood: focused ? 'happy' : 'neutral' });
    const s = profileSummary(p);
    text(ctx, p.callsign, r.x + 188, r.y + 52, { size: 26, display: true, italic: true, color: focused ? COLORS.gold : COLORS.ink, maxWidth: CARD_W - 200 });
    text(ctx, t('map.progress', { done: s.cleared, stars: s.stars }), r.x + 188, r.y + 82, { size: 12, color: COLORS.dim, maxWidth: CARD_W - 200 });
    text(ctx, formatMoney(s.money), r.x + 188, r.y + 112, { size: 20, display: true, color: COLORS.green });
    drawButton(ctx, { id: 'fly', label: t('pilots.fly'), ...flyRect(r), primary: true }, focused, this.time);
    drawButton(ctx, { id: 'del', label: t('pilots.delete'), ...delRect(r) }, false, this.time);
  }

  private renderConfirm(ctx: CanvasRenderingContext2D, p: Profile): void {
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, 1280, 720);
    drawPanel(ctx, { x: 400, y: 280, w: 480, h: 196 });
    text(ctx, t('pilots.deleteTitle', { callsign: p.callsign }), 640, 330, { size: 24, display: true, align: 'center', color: COLORS.red, maxWidth: 440 });
    text(ctx, t('pilots.deleteText'), 640, 366, { size: 15, align: 'center', color: COLORS.dim, maxWidth: 440 });
    drawButton(ctx, { ...CONFIRM_YES, label: t('pilots.delete') }, false, this.time);
    drawButton(ctx, { ...CONFIRM_NO, label: t('title.cancel') }, true, this.time);
  }
}
