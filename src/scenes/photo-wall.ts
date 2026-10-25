import type { Scene } from '../core/scene';
import { MISSIONS } from '../data/missions';
import { PLANES } from '../data/planes';
import { formatPhotoDate, monthList, type DateFormat } from '../game/photo-date';
import { gridMove, pageCount, pageItems, pageOf, PER_PAGE, photoKey, photoList, wallSlot, type GridDir, type PhotoSpec } from '../game/photos';
import type { GameContext } from '../game/state';
import { liveryName, missionName, theaterName } from '../i18n/content';
import { t } from '../i18n/i18n';
import { photoArt, photoReady } from '../render/photos/art';
import { BIG, drawEnlarged } from '../render/photos/enlarged';
import { drawEmptyNote, drawPolaroid } from '../render/photos/polaroid';
import { drawWallAmbient, wallBackdrop } from '../render/photos/wall';
import { BACK_BTN, backButton, blitLayer, hintLine, inRect, LILAC, pixelButton, roomGrid, roomHeader, type Rect } from '../render/rooms-chrome';
import { text, wrap } from '../render/text';

const PREV_BTN: Rect = { x: 880, y: 672, w: 52, h: 40 };
const NEXT_BTN: Rect = { x: 1048, y: 672, w: 52, h: 40 };
const DIRS: readonly GridDir[] = ['left', 'right', 'up', 'down'];
/** Seconds a fresh photo takes to develop. */
const DEVELOP = 1.1;

/** What the wall writes about a photo (fixed while the room is open). */
interface Label { key: string; name: string; caption: string; date: string | null }

function labelOf(spec: PhotoSpec, fmt: DateFormat): Label {
  const m = MISSIONS.find((x) => x.id === spec.mission);
  const name = m ? missionName(m) : spec.mission;
  const date = spec.at === null ? null : formatPhotoDate(spec.at, fmt, new Date(spec.at).getTimezoneOffset());
  return { key: photoKey(spec), name, caption: `${String(spec.number).padStart(2, '0')} · ${name.toUpperCase()}`, date };
}

/**
 * PICTURE WALL (doc 32): a corkboard with one generated polaroid per cleared mission, 12 per page. Arrows / hover
 * select, CONFIRM / click / tap enlarges with all its details; ◀ ▶ flip. BACK returns to the hangar base.
 */
export class PhotoWallScene implements Scene {
  private time = 0;
  private index: number;
  private open = false;
  private leaving = false;
  private hover: 'back' | 'prev' | 'next' | null = null;
  private lastPointer = { x: -1, y: -1 };
  private readonly list: PhotoSpec[];
  private readonly labels: Label[];
  /** When each photo became visible (scene time); −10 = was ready before the room opened. */
  private readonly born = new Map<string, number>();

  constructor(private readonly game: GameContext) {
    this.list = photoList(game.save);
    const fmt: DateFormat = { pattern: t('photo.datePattern'), months: monthList(t('photo.months')) };
    this.labels = this.list.map((s) => labelOf(s, fmt));
    this.index = this.list.length > 0 ? 0 : -1;
    this.list.forEach((p, i) => {
      const key = this.labels[i]?.key ?? '';
      if (photoReady(p, key)) this.born.set(key, -10);
    });
  }

  enter(): void {
    this.game.music.play('menu');
  }

  private page(): number {
    return pageOf(Math.max(0, this.index));
  }

  private select(i: number): void {
    if (i < 0 || i >= this.list.length || i === this.index) return;
    this.index = i;
    this.game.audio.play('uiMove');
  }

  update(dt: number): void {
    this.time += dt;
    const input = this.game.input;
    const p = input.pointer;
    const moved = p.x !== this.lastPointer.x || p.y !== this.lastPointer.y;
    this.lastPointer = { x: p.x, y: p.y };
    this.hover = input.device === 'touch' ? null : inRect(p, BACK_BTN) ? 'back' : inRect(p, PREV_BTN) ? 'prev' : inRect(p, NEXT_BTN) ? 'next' : null;
    if (this.open) this.updateOpen();
    else this.updateWall(moved && input.device !== 'touch');
  }

  private updateWall(hover: boolean): void {
    const input = this.game.input;
    if (input.pressed('back') || input.pressed('base')) return this.leave();
    for (const d of DIRS) if (input.pressed(d)) this.select(gridMove(this.index, d, this.list.length));
    if (hover) {
      const i = this.slotAt(input.pointer);
      if (i >= 0) this.select(i);
    }
    if (input.pressed('confirm') && this.index >= 0) this.setOpen(true);
    for (const tap of input.taps) {
      if (inRect(tap, BACK_BTN)) return this.leave();
      if (inRect(tap, PREV_BTN)) this.flipPage(-1);
      else if (inRect(tap, NEXT_BTN)) this.flipPage(1);
      else {
        const i = this.slotAt(tap);
        if (i >= 0) {
          this.select(i);
          this.setOpen(true);
        }
      }
    }
  }

  private updateOpen(): void {
    const input = this.game.input;
    if (input.pressed('back') || input.pressed('confirm')) return this.setOpen(false);
    if (input.pressed('left')) this.select(this.index - 1);
    if (input.pressed('right')) this.select(this.index + 1);
    for (const tap of input.taps) {
      if (inRect(tap, PREV_BTN)) this.select(this.index - 1);
      else if (inRect(tap, NEXT_BTN)) this.select(this.index + 1);
      else return this.setOpen(false);
    }
  }

  private setOpen(open: boolean): void {
    this.open = open;
    this.game.audio.play(open ? 'uiSelect' : 'uiBack');
  }

  private flipPage(d: number): void {
    const next = this.page() + d;
    if (next < 0 || next >= pageCount(this.list.length)) return this.game.audio.play('denied');
    this.select(next * PER_PAGE);
  }

  /** The photo (list index) under a point on the current page, −1 for none. */
  private slotAt(pt: { x: number; y: number }): number {
    const first = this.page() * PER_PAGE;
    const items = pageItems(this.list, this.page());
    for (let s = items.length - 1; s >= 0; s--) {
      const spec = items[s];
      if (spec && inRect(pt, wallSlot(s, spec.number))) return first + s;
    }
    return -1;
  }

  private leave(): void {
    if (this.leaving) return;
    this.leaving = true;
    this.game.audio.play('uiBack');
    this.game.go({ to: 'base' });
  }

  /** Photo `i`'s art (building at most `budget.n` per frame) and how far it has developed. */
  private art(i: number, budget: { n: number }): { art: HTMLCanvasElement | null; develop: number } {
    const spec = this.list[i];
    const key = this.labels[i]?.key ?? '';
    if (!spec) return { art: null, develop: 0 };
    const ready = photoReady(spec, key);
    if (!ready && budget.n <= 0) return { art: null, develop: 0 };
    if (!ready) budget.n--;
    const art = photoArt(spec, true, key);
    if (!this.born.has(key)) this.born.set(key, this.time);
    return { art, develop: (this.time - (this.born.get(key) ?? 0)) / DEVELOP };
  }

  render(ctx: CanvasRenderingContext2D): void {
    const g = roomGrid(ctx);
    const bg = wallBackdrop(g);
    if (bg) blitLayer(ctx, bg, g);
    drawWallAmbient(ctx, this.time, g.G);
    const budget = { n: 1 };
    if (this.open) this.art(this.index, budget);
    this.renderPage(ctx, g.G, budget);
    roomHeader(ctx, t('rooms.photoWall'), 48, t('wall.count', { n: this.list.length, total: MISSIONS.length }), 1232);
    if (this.open) this.renderOpen(ctx, g.G, budget);
    this.renderFooter(ctx);
  }

  private renderPage(ctx: CanvasRenderingContext2D, G: number, budget: { n: number }): void {
    if (this.list.length === 0) {
      drawEmptyNote(ctx, t('wall.empty'), wrap(ctx, t('wall.emptyHint'), 410, 17, true), G);
      return;
    }
    const first = this.page() * PER_PAGE;
    const last = Math.min(this.list.length, first + PER_PAGE);
    for (let i = first; i < last; i++) {
      const spec = this.list[i];
      const label = this.labels[i];
      if (!spec || !label) continue;
      const { art, develop } = this.art(i, budget);
      drawPolaroid(ctx, wallSlot(i - first, spec.number), {
        art, develop, caption: label.caption, stars: spec.stars, date: label.date, number: spec.number,
        selected: !this.open && i === this.index, t: this.time, G,
      });
    }
  }

  private renderOpen(ctx: CanvasRenderingContext2D, G: number, budget: { n: number }): void {
    const spec = this.list[this.index];
    const label = this.labels[this.index];
    if (!spec || !label) return;
    const { art, develop } = this.art(this.index, budget);
    drawEnlarged(ctx, {
      art, develop, caption: label.caption, stars: spec.stars, date: label.date ?? '', G,
      missionLabel: t('wall.mission', { n: spec.number }), missionName: label.name, starsLabel: t('wall.stars'),
      rows: [
        [t('wall.theater'), theaterName(spec.theater)],
        [t('wall.date'), label.date ?? t('wall.noDate')],
        [t('wall.jet'), PLANES[spec.plane].name],
        [t('wall.paint'), liveryName(spec.livery)],
      ],
    });
    text(ctx, `${this.index + 1} / ${this.list.length}`, BIG.x + BIG.w / 2, BIG.y + BIG.h + 34, { size: 14, weight: 800, align: 'center', color: LILAC, letterSpacing: 2 });
  }

  private renderFooter(ctx: CanvasRenderingContext2D): void {
    const touch = this.game.input.device === 'touch';
    const browse = this.list.length > 0 ? t('wall.hint') : t('wall.hintEmpty');
    hintLine(ctx, this.open ? t('wall.hintOpen') : touch ? '' : browse, 48, PREV_BTN.x - 60);
    const pages = pageCount(this.list.length);
    if (this.open || pages > 1) {
      pixelButton(ctx, PREV_BTN, '◀', this.hover === 'prev');
      pixelButton(ctx, NEXT_BTN, '▶', this.hover === 'next');
    }
    if (!this.open && pages > 1) {
      text(ctx, t('wall.page', { n: this.page() + 1, total: pages }), (PREV_BTN.x + PREV_BTN.w + NEXT_BTN.x) / 2, 697, { size: 12, weight: 800, align: 'center', color: LILAC, letterSpacing: 1 });
    }
    backButton(ctx, this.hover === 'back');
  }
}
