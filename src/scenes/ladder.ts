import { deletePilot, fetchLadder } from '../core/ladder-api';
import { formatPoints } from '../core/math';
import type { Scene } from '../core/scene';
import type { PublicPilot } from '../game/ladder';
import { ladderAvatar, type LadderLink, type LadderView, type PostReply } from '../game/ladder-stats';
import type { GameContext } from '../game/state';
import { t } from '../i18n/i18n';
import { drawSunset } from '../render/backdrop';
import { drawLadderMessage, drawLadderTable, drawPinnedRow, ROWS_PER_PAGE, TABLE, type LadderRow } from '../render/ladder';
import { RANK_KEY } from '../render/ranks';
import { COLORS, text } from '../render/text';
import { ButtonGroup, type Button } from '../ui/widgets';
import { pilotStanding } from './pilot-rating';

type Phase = 'loading' | 'ready' | 'offline';

const ARROW_X = TABLE.x + TABLE.w + 14;

/** ONLINE LADDER (doc 28), the hangar base's ladder area: every pilot by name and rating, your own row always shown. */
export class LadderScene implements Scene {
  private time = 0;
  private phase: Phase = 'loading';
  private view: LadderView | null = null;
  private mine: PostReply | null = null;
  private top = 0;
  private alive = true;
  private busy = false;
  private readonly buttons = new ButtonGroup([], 'horizontal');

  constructor(private readonly game: GameContext) {}

  enter(): void {
    this.game.music.play('menu');
    // A pilot who has never saved gets a ladder link now (setSave adds it).
    if (this.game.profile && !this.game.save.ladder) this.game.setSave(this.game.save);
    this.buildButtons();
    void this.load();
  }

  exit(): void {
    this.alive = false;
  }

  private get link(): LadderLink | null {
    return this.game.profile ? this.game.save.ladder : null;
  }

  private buildButtons(): void {
    const link = this.link;
    const list: Button[] = [
      { id: 'back', label: t('ladder.back'), x: TABLE.x, y: 604, w: 180, h: 46 },
      { id: 'refresh', label: t('ladder.refresh'), x: TABLE.x + 196, y: 604, w: 230, h: 46, enabled: !this.busy },
      { id: 'up', label: '▲', x: ARROW_X, y: TABLE.y, w: 54, h: 54 },
      { id: 'down', label: '▼', x: ARROW_X, y: TABLE.y + TABLE.h - 54, w: 54, h: 54 },
    ];
    if (link) {
      const label = t(link.share ? 'ladder.shareOn' : 'ladder.shareOff');
      list.splice(2, 0, { id: 'share', label, x: TABLE.x + 442, y: 604, w: TABLE.w - 442, h: 46, primary: link.share, enabled: !this.busy });
    }
    const focus = this.buttons.focused?.id;
    this.buttons.setButtons(list);
    if (focus) this.buttons.focusId(focus);
  }

  private async load(): Promise<void> {
    this.phase = 'loading';
    const link = this.link;
    // Opt-out is retried here in case the last DELETE did not get through.
    if (link && !link.share) await deletePilot(link.id, link.secret);
    const mine = await this.game.ladder.flush();
    const view = await fetchLadder();
    if (!this.alive) return;
    this.mine = mine;
    this.view = view;
    this.phase = view ? 'ready' : 'offline';
    this.top = Math.min(this.top, this.maxTop());
  }

  private async toggleShare(): Promise<void> {
    const link = this.link;
    if (!link || this.busy) return;
    const share = !link.share;
    this.busy = true;
    this.game.setSave({ ...this.game.save, ladder: { ...link, share } });
    this.game.ladder.forget(link.id);
    this.buildButtons();
    await this.load();
    if (!this.alive) return;
    this.busy = false;
    this.buildButtons();
  }

  private maxTop(): number {
    return Math.max(0, (this.view?.pilots.length ?? 0) - ROWS_PER_PAGE);
  }

  private scroll(d: number): void {
    const next = Math.max(0, Math.min(this.maxTop(), this.top + d));
    if (next !== this.top) this.game.audio.play('uiMove');
    this.top = next;
  }

  update(dt: number): void {
    this.time += dt;
    const input = this.game.input;
    if (input.pressed('back')) return this.leave();
    if (input.pressed('up')) this.scroll(-1);
    if (input.pressed('down')) this.scroll(1);
    if (input.pressed('left') || input.pressed('right')) this.game.audio.play('uiMove');
    const id = this.buttons.update(input);
    if (id) this.activate(id);
  }

  private activate(id: string): void {
    switch (id) {
      case 'back': return this.leave();
      case 'refresh':
        if (this.busy || this.phase === 'loading') return;
        this.game.audio.play('uiSelect');
        void this.load();
        return;
      case 'share':
        this.game.audio.play('uiSelect');
        void this.toggleShare();
        return;
      case 'up': return this.scroll(-ROWS_PER_PAGE);
      case 'down': return this.scroll(ROWS_PER_PAGE);
      default: return;
    }
  }

  private leave(): void {
    this.game.audio.play('uiBack');
    this.game.go({ to: 'base' });
  }

  /** Index of the player's own entry: by the place from the last post, else by callsign; -1 if absent. */
  private ownIndex(): number {
    const you = this.link?.share ? this.game.profile?.callsign : undefined;
    const pilots = this.view?.pilots ?? [];
    if (!you) return -1;
    const byPlace = this.mine ? this.mine.place - 1 : -1;
    return pilots[byPlace]?.callsign === you ? byPlace : pilots.findIndex((p) => p.callsign === you);
  }

  private rows(): LadderRow[] {
    const own = this.ownIndex();
    return (this.view?.pilots ?? []).slice(this.top, this.top + ROWS_PER_PAGE)
      .map((pilot, i) => ({ place: this.top + i + 1, pilot, you: this.top + i === own }));
  }

  /** The player's row when it is not on this page (or beyond the public list). */
  private pinned(): LadderRow | null {
    const own = this.ownIndex();
    const pilot = this.view?.pilots[own];
    if (pilot) return own >= this.top && own < this.top + ROWS_PER_PAGE ? null : { place: own + 1, pilot, you: true };
    const p = this.game.profile;
    if (!this.mine || !p || !this.link?.share) return null;
    const local: PublicPilot = {
      callsign: p.callsign, avatar: ladderAvatar(p.avatar, p.save.look), rating: this.mine.rating, rank: this.mine.rank, updatedAt: 0,
    };
    return { place: this.mine.place, pilot: local, you: true };
  }

  private statusLine(): string {
    const p = this.game.profile;
    if (!p) return t('ladder.noPilot');
    if (this.link && !this.link.share) return t('ladder.hidden', { callsign: p.callsign });
    if (this.mine && this.phase === 'ready') {
      const { place, rating, rank } = this.mine;
      return t('ladder.you', { place, rating: formatPoints(rating), rank: t(RANK_KEY[rank]) });
    }
    const s = pilotStanding(this.game.save);
    return t('ladder.local', { callsign: p.callsign, rating: formatPoints(s.rating), rank: t(RANK_KEY[s.rank]) });
  }

  render(ctx: CanvasRenderingContext2D): void {
    drawSunset(ctx, this.time);
    ctx.fillStyle = 'rgba(4,8,16,0.66)';
    ctx.fillRect(0, 0, 1280, 720);
    text(ctx, t('ladder.title'), 640, 78, { size: 42, display: true, italic: true, align: 'center', color: COLORS.gold, stroke: '#000', strokeWidth: 6 });
    this.renderBody(ctx);
    const pinned = this.phase === 'ready' ? this.pinned() : null;
    if (pinned) drawPinnedRow(ctx, pinned);
    else text(ctx, this.statusLine(), 640, 584, { size: 17, type: true, align: 'center', color: COLORS.ink, maxWidth: TABLE.w });
    this.buttons.render(ctx, this.time);
    text(ctx, t('ladder.public'), 640, 678, { size: 12, align: 'center', color: COLORS.faint, maxWidth: 1000 });
    text(ctx, t('ladder.hint'), 640, 702, { size: 13, align: 'center', color: COLORS.faint });
  }

  private renderBody(ctx: CanvasRenderingContext2D): void {
    if (this.phase === 'loading') return drawLadderMessage(ctx, t('ladder.loading'), COLORS.cyan);
    if (this.phase === 'offline') return drawLadderMessage(ctx, t('ladder.offline'), COLORS.amber);
    const total = this.view?.pilots.length ?? 0;
    if (total === 0) return drawLadderMessage(ctx, t('ladder.empty'));
    drawLadderTable(ctx, this.rows());
    const page = { from: this.top + 1, to: Math.min(total, this.top + ROWS_PER_PAGE), total };
    text(ctx, t('ladder.page', page), ARROW_X + 27, TABLE.y + TABLE.h / 2, { size: 11, align: 'center', color: COLORS.faint, maxWidth: 120 });
  }
}
