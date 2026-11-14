import type { Input } from '../core/input';
import type { LiveryId } from '../data/liveries';
import { applyLivery, isLiveryUnlocked, liveriesFor, liveryOnShow } from '../game/liveries';
import type { GameContext } from '../game/state';
import { liveryName } from '../i18n/content';
import { t } from '../i18n/i18n';
import { liverySwatch } from '../render/livery-art';
import { COLORS, text } from '../render/text';
import { drawButton, drawPanel, hit, type Rect } from '../ui/widgets';
import { unlockText } from './hangar-paint';

// The spacecraft's paint jobs in the shipyard (doc 100): the shipyard has no tabs, so P (or the PAINT button) opens a
// list of map 5's paint jobs over the yard; ↑/↓ pick, ENTER (or a tap) paints the ship, P / ESC closes.

export const PAINT_BTN: Rect = { x: 300, y: 22, w: 130, h: 44 };
const PANEL: Rect = { x: 300, y: 76, w: 400, h: 0 };
const ROW = 34;

const rowRect = (i: number): Rect => ({ x: PANEL.x + 12, y: PANEL.y + 44 + i * ROW, w: PANEL.w - 24, h: ROW - 4 });

export class ShipPaint {
  open = false;
  private index = 0;

  constructor(private readonly game: GameContext) {}

  private get list(): LiveryId[] {
    return liveriesFor('ship').filter((id) => liveryOnShow(this.game.save.progress, id));
  }

  /** Opens or closes the list; while open it takes every input (true). */
  update(input: Input): boolean {
    if (!this.open) {
      if (input.pressed('pause') && !input.pressed('back')) this.toggle();
      return false;
    }
    if (input.pressed('pause') || input.pressed('back')) this.toggle();
    else if (input.pressed('up')) this.index = Math.max(0, this.index - 1);
    else if (input.pressed('down')) this.index = Math.min(this.list.length - 1, this.index + 1);
    else if (input.pressed('confirm')) this.apply(this.index);
    for (const p of input.taps) this.tap(p);
    return true;
  }

  /** The PAINT button (tap). */
  toggle(): void {
    this.open = !this.open;
    this.index = Math.max(0, this.list.indexOf(this.game.save.livery.starship));
    this.game.audio.play(this.open ? 'uiSelect' : 'uiBack');
  }

  private tap(p: { x: number; y: number }): void {
    const i = this.list.findIndex((_, k) => hit(p, rowRect(k)));
    if (i >= 0) this.apply(i);
    else if (!hit(p, { ...PANEL, h: 60 + this.list.length * ROW })) this.toggle();
  }

  private apply(i: number): void {
    const id = this.list[i];
    if (!id) return;
    this.index = i;
    const save = this.game.save;
    if (!isLiveryUnlocked(save.progress, id)) return this.game.audio.play('denied');
    this.game.setSave(applyLivery(save, 'starship', id));
    this.game.audio.play('buy');
  }

  /** The PAINT button, and the list over the yard while it is open. */
  render(ctx: CanvasRenderingContext2D, time: number): void {
    drawButton(ctx, { id: 'paint', label: t('hangar.tabPaint'), ...PAINT_BTN, hint: 'P' }, this.open, time);
    if (!this.open) return;
    const list = this.list;
    const save = this.game.save;
    drawPanel(ctx, { ...PANEL, h: 60 + list.length * ROW }, { fill: 'rgba(8,14,28,0.94)' });
    text(ctx, t('shipyard.paintTitle'), PANEL.x + 20, PANEL.y + 30, { size: 18, display: true, color: COLORS.gold });
    list.forEach((id, i) => {
      const r = rowRect(i);
      const open = isLiveryUnlocked(save.progress, id);
      drawPanel(ctx, r, { fill: i === this.index ? 'rgba(40,70,105,0.92)' : 'rgba(14,24,36,0.85)', edge: i === this.index ? COLORS.gold : COLORS.panelEdge, radius: 6 });
      liverySwatch(id).forEach((c, k) => {
        ctx.fillStyle = open ? c : 'rgba(120,130,140,0.4)';
        ctx.fillRect(r.x + 10 + k * 14, r.y + 8, 12, r.h - 16);
      });
      text(ctx, liveryName(id), r.x + 64, r.y + r.h / 2 + 5, { size: 14, display: true, color: open ? COLORS.ink : COLORS.faint, maxWidth: 160 });
      const status = save.livery.starship === id ? t('hangar.inUse') : open ? t('hangar.paintReady') : unlockText(id);
      text(ctx, status, r.x + r.w - 10, r.y + r.h / 2 + 5, { size: 11, align: 'right', color: open ? COLORS.green : COLORS.dim, maxWidth: 150 });
    });
  }
}
