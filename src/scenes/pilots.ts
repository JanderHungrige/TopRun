import { fetchCloudSave } from '../core/ladder-api';
import { formatMoney, formatPoints } from '../core/math';
import type { Scene } from '../core/scene';
import { cloudIsAhead } from '../game/cloud-pilot';
import { MAX_PROFILES, profileSummary, type Profile } from '../game/profiles';
import type { SaveData } from '../game/save';
import type { GameContext } from '../game/state';
import { t } from '../i18n/i18n';
import { drawPilotAvatar, pilotAccent, pilotFace } from '../render/avatars';
import { drawSunset } from '../render/backdrop';
import { drawRankBoard, RANK_KEY } from '../render/ranks';
import { COLORS, text } from '../render/text';
import { drawButton, drawPanel, hit, type Button, type Rect } from '../ui/widgets';
import { pilotStanding } from './pilot-rating';

const CARD_W = 380;
const CARD_H = 230;
const BACK: Button = { id: 'back', label: '', x: 250, y: 632, w: 200, h: 50 };
const NEW: Button = { id: 'new', label: '', x: 470, y: 632, w: 300, h: 50 };
/** Bring a pilot from another device by callsign (doc 34); the pilot code is switched off for now (doc 08). */
const LOAD: Button = { id: 'load', label: '', x: 790, y: 632, w: 240, h: 50 };
const OFFER_LOAD: Button = { id: 'offerLoad', label: '', x: 430, y: 404, w: 200, h: 46, primary: true };
const OFFER_KEEP: Button = { id: 'offerKeep', label: '', x: 650, y: 404, w: 200, h: 46 };
/** How long a pilot pick waits for the cloud before it simply flies (doc 34). */
const CLOUD_WAIT_MS = 2500;

interface Offer { p: Profile; save: SaveData; cloud: number; local: number }
const rating = (s: SaveData): number => pilotStanding(s).rating;
const CONFIRM_YES: Button = { id: 'yes', label: '', x: 450, y: 404, w: 180, h: 46, primary: true };
const CONFIRM_NO: Button = { id: 'no', label: '', x: 650, y: 404, w: 180, h: 46 };

const cardRect = (i: number): Rect => ({ x: 50 + (i % 3) * (CARD_W + 20), y: 116 + Math.floor(i / 3) * (CARD_H + 20), w: CARD_W, h: CARD_H });
const flyRect = (r: Rect): Rect => ({ x: r.x + 186, y: r.y + 134, w: 178, h: 42 });
/** EDIT LOOK opens the avatar builder for this pilot (doc 29). */
const lookRect = (r: Rect): Rect => ({ x: r.x + 186, y: r.y + 186, w: 92, h: 30 });
const delRect = (r: Rect): Rect => ({ x: r.x + 284, y: r.y + 186, w: 80, h: 30 });

/** CONTINUE: pick which pilot flies, edit a pilot's look, or delete one (docs 08, 29). */
export class PilotsScene implements Scene {
  private time = 0;
  private focus = 0;
  private confirmDelete: Profile | null = null;
  /** The pilot whose cloud save is being checked, and the offer when another device is further (doc 34). */
  private checking: Profile | null = null;
  private offer: Offer | null = null;
  private gone = false;

  constructor(private readonly game: GameContext) {}

  enter(): void {
    this.game.music.play('menu');
  }

  exit(): void {
    this.gone = true;
  }

  private get list(): readonly Profile[] {
    return this.game.profiles;
  }

  /** Asks the cloud first (doc 34): when another device is further, offer that progress before anything posts. */
  private fly(p: Profile): void {
    this.game.audio.play('uiSelect');
    const link = p.save.ladder;
    if (!link?.share) return this.takeOff(p);
    this.checking = p;
    void fetchCloudSave(link.id, CLOUD_WAIT_MS).then((cloud) => {
      if (this.gone || this.checking !== p) return;
      this.checking = null;
      if (cloud && cloudIsAhead(p.save, cloud, rating)) this.offer = { p, save: cloud, cloud: rating(cloud), local: rating(p.save) };
      else this.takeOff(p);
    });
  }

  private takeOff(p: Profile, save?: SaveData): void {
    this.game.selectProfile(p.id);
    if (save) this.game.setSave(save);
    this.game.go({ to: 'map' });
  }

  private updateOffer(o: Offer): void {
    const input = this.game.input;
    if (input.taps.some((tap) => hit(tap, OFFER_LOAD)) || input.pressed('confirm')) return this.takeOff(o.p, o.save);
    if (input.taps.some((tap) => hit(tap, OFFER_KEEP))) return this.takeOff(o.p);
    if (input.pressed('back')) {
      this.offer = null;
      this.game.audio.play('uiBack');
    }
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
    if (this.checking) return;
    if (this.offer) return this.updateOffer(this.offer);
    if (this.confirmDelete) return this.updateConfirm();
    for (const tap of input.taps) {
      if (hit(tap, BACK)) return this.leave('title');
      if (hit(tap, NEW) && this.list.length < MAX_PROFILES) return this.leave('newPilot');
      if (hit(tap, LOAD)) return this.openLoad();
      const i = this.list.findIndex((_, k) => hit(tap, cardRect(k)));
      const p = this.list[i];
      if (!p) continue;
      this.focus = i;
      if (hit(tap, delRect(cardRect(i)))) this.askDelete(p);
      else if (hit(tap, lookRect(cardRect(i)))) this.editLook(p);
      else this.fly(p);
      return;
    }
    if (input.pressed('left') || input.pressed('up')) this.move(input.pressed('up') ? -3 : -1);
    if (input.pressed('right') || input.pressed('down')) this.move(input.pressed('down') ? 3 : 1);
    const p = this.list[this.focus];
    if (p && input.pressed('confirm')) return this.fly(p);
    if (p && input.pressed('delete')) return this.askDelete(p);
    if (p && input.pressed('special')) return this.editLook(p);
    if (input.pressed('secondary')) return this.openLoad();
    if (input.pressed('back')) this.leave('title');
  }

  private editLook(p: Profile): void {
    this.game.audio.play('uiSelect');
    this.game.go({ to: 'avatarBuilder', target: { kind: 'pilot', profileId: p.id } });
  }

  private openLoad(): void {
    this.game.audio.play('uiSelect');
    this.game.go({ to: 'pilotLoad', from: 'pilots' });
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
    drawButton(ctx, { ...LOAD, label: t('cloud.load'), hint: 'R' }, false, this.time);
    text(ctx, t('pilots.hint'), 640, 706, { size: 13, align: 'center', color: COLORS.faint });
    if (this.confirmDelete) this.renderConfirm(ctx, this.confirmDelete);
    if (this.checking) this.renderNotice(ctx, t('cloud.checking'));
    if (this.offer) this.renderOffer(ctx, this.offer);
  }

  private renderNotice(ctx: CanvasRenderingContext2D, line: string): void {
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, 1280, 720);
    text(ctx, line, 640, 360, { size: 22, type: true, align: 'center', color: COLORS.dim });
  }

  private renderOffer(ctx: CanvasRenderingContext2D, o: Offer): void {
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, 1280, 720);
    drawPanel(ctx, { x: 380, y: 270, w: 520, h: 206 }, { edge: COLORS.gold });
    text(ctx, t('cloud.aheadTitle'), 640, 318, { size: 24, display: true, align: 'center', color: COLORS.gold, maxWidth: 480 });
    const line = t('cloud.aheadText', { cloud: formatPoints(o.cloud), local: formatPoints(o.local) });
    text(ctx, line, 640, 356, { size: 15, align: 'center', color: COLORS.ink, maxWidth: 480 });
    drawButton(ctx, { ...OFFER_LOAD, label: t('cloud.aheadLoad') }, true, this.time);
    drawButton(ctx, { ...OFFER_KEEP, label: t('cloud.aheadKeep') }, false, this.time);
  }

  private renderCard(ctx: CanvasRenderingContext2D, p: Profile, i: number): void {
    const r = cardRect(i);
    const focused = i === this.focus && !this.confirmDelete;
    const face = pilotFace(p);
    drawPanel(ctx, r, { fill: focused ? 'rgba(30,52,80,0.95)' : 'rgba(10,18,30,0.9)', edge: focused ? COLORS.gold : pilotAccent(face), radius: 12 });
    drawPilotAvatar(ctx, face, { x: r.x + 14, y: r.y + 16, w: 160, h: 198 }, { t: this.time + i * 1.3, mood: focused ? 'happy' : 'neutral' });
    const s = profileSummary(p);
    text(ctx, p.callsign, r.x + 188, r.y + 48, { size: 26, display: true, italic: true, color: focused ? COLORS.gold : COLORS.ink, maxWidth: CARD_W - 200 });
    text(ctx, t('map.progress', { done: s.cleared, stars: s.stars }), r.x + 188, r.y + 72, { size: 12, color: COLORS.dim, maxWidth: CARD_W - 200 });
    const rank = pilotStanding(p.save).rank;
    drawRankBoard(ctx, rank, r.x + 188, r.y + 82, 0.75);
    text(ctx, t(RANK_KEY[rank]), r.x + 214, r.y + 97, { size: 13, color: COLORS.gold, maxWidth: CARD_W - 230 });
    text(ctx, formatMoney(s.money), r.x + 188, r.y + 124, { size: 18, display: true, color: COLORS.green });
    drawButton(ctx, { id: 'fly', label: t('pilots.fly'), ...flyRect(r), primary: true }, focused, this.time);
    drawButton(ctx, { id: 'look', label: t('avatar.editLook'), ...lookRect(r) }, false, this.time);
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
