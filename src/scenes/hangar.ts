import { formatMoney } from '../core/math';
import type { Scene } from '../core/scene';
import { PLANES } from '../data/planes';
import { liveryName } from '../i18n/content';
import { t } from '../i18n/i18n';
import type { SecondaryId } from '../data/types';
import { buy, canBuy, canMount, mount, selectPlane, unmount, type ShopItem } from '../game/economy';
import { buyTwin, canBuyTwin } from '../game/firepower';
import { applyLivery } from '../game/liveries';
import type { SaveData } from '../game/save';
import type { GameContext } from '../game/state';
import { COLORS, measure, text } from '../render/text';
import { pilotContext } from '../ui/speech';
import { drawButton, hit, type Button } from '../ui/widgets';
import { DETAIL, drawDetail, drawList, drawLoadout, rowRect, slotRects } from './hangar-panels';
import { HangarChief } from './hangar-chief';
import { itemAction, itemName, tabs, twinAction } from './hangar-items';

/** The LOADOUT's two exits (doc 02): BASE (the hangar base, key B) and MAP (ESC). */
const BASE_BTN = { x: 1030, y: 14, w: 110, h: 44 };
const MAP_BTN = { x: 1150, y: 14, w: 110, h: 44 };

export class HangarScene implements Scene {
  private t = 0;
  private tab = 0;
  private focus = [0, 0, 0];
  private toast = '';
  private toastTime = 0;
  private slotCursor = 0;
  private readonly chief: HangarChief;

  constructor(private readonly game: GameContext) {
    this.chief = new HangarChief(game.audio, pilotContext(game));
  }

  enter(): void {
    this.game.music.play('menu');
    this.chief.greet(this.game.save);
  }

  private get items(): readonly ShopItem[] {
    return tabs(this.game.save)[this.tab]?.items ?? [];
  }

  private get item(): ShopItem | undefined {
    return this.items[this.focus[this.tab] ?? 0];
  }

  private actionButton(): Button | null {
    const item = this.item;
    if (!item) return null;
    const a = itemAction(this.game.save, item);
    return { id: 'action', label: a.label, enabled: a.enabled, primary: true, x: DETAIL.x + DETAIL.w - 294, y: DETAIL.y + DETAIL.h - 66, w: 270, h: 48, hint: 'ENTER' };
  }

  /** TWIN PODS for an owned weapon once map 2 is open (doc 37), right of the weapon's stats. */
  private twinButton(): Button | null {
    const item = this.item;
    const a = item ? twinAction(this.game.save, item) : null;
    if (!a) return null;
    return { id: 'twin', label: a.label, enabled: a.enabled, x: DETAIL.x + DETAIL.w - 214, y: DETAIL.y + 452, w: 196, h: 32, hint: 'E' };
  }

  private buyTwinFocused(): void {
    const item = this.item;
    if (item?.type !== 'secondary' || !twinAction(this.game.save, item)) return;
    const check = canBuyTwin(this.game.save, item.id);
    if (!check.ok) return this.say(t(check.reason === 'insufficient-funds' ? 'hangar.cannotBuy' : 'hangar.maxed'), false);
    this.commit(buyTwin(this.game.save, item.id), t('hangar.twinBought', { item: itemName(item) }));
    this.chief.bought(item);
  }

  private tabButtons(): Button[] {
    return tabs(this.game.save).map((tab, i) => ({ id: `tab${i}`, label: t(tab.name), x: 24 + i * 135, y: 76, w: 130, h: 42, primary: i === this.tab }));
  }

  update(dt: number): void {
    this.t += dt;
    this.toastTime = Math.max(0, this.toastTime - dt);
    const input = this.game.input;
    this.chief.update(dt, input);
    if (input.taps.length > 0 || input.pressed('confirm') || input.pressed('up') || input.pressed('down')) this.chief.poke();
    if (input.pressed('back')) return this.leave('map');
    if (input.pressed('base')) return this.leave('base');
    if (input.pressed('left')) this.setTab(this.tab - 1);
    if (input.pressed('right')) this.setTab(this.tab + 1);
    if (input.pressed('up')) this.setFocus((this.focus[this.tab] ?? 0) - 1);
    if (input.pressed('down')) this.setFocus((this.focus[this.tab] ?? 0) + 1);
    if (input.pressed('confirm')) this.doAction();
    if (input.pressed('secondary')) this.unmountFocused();
    if (input.pressed('special')) this.buyTwinFocused();
    for (const tap of input.taps) this.handleTap(tap);
  }

  private handleTap(p: { x: number; y: number }): void {
    if (hit(p, MAP_BTN)) return this.leave('map');
    if (hit(p, BASE_BTN)) return this.leave('base');
    this.tabButtons().forEach((b, i) => {
      if (hit(p, b)) this.setTab(i);
    });
    this.items.forEach((_, i) => {
      if (hit(p, rowRect(i, this.items.length))) this.setFocus(i);
    });
    const action = this.actionButton();
    if (action && action.enabled !== false && hit(p, action)) this.doAction();
    const twin = this.twinButton();
    if (twin && twin.enabled !== false && hit(p, twin)) this.buyTwinFocused();
    if (this.tab === 1) {
      slotRects(PLANES[this.game.save.selectedPlane].hardpoints).forEach((r, i) => {
        if (hit(p, r)) this.clickSlot(i);
      });
    }
  }

  private leave(to: 'map' | 'base'): void {
    this.game.audio.play('uiBack');
    this.game.go({ to });
  }

  private setTab(i: number): void {
    const n = tabs(this.game.save).length;
    const next = ((i % n) + n) % n;
    if (next !== this.tab) this.game.audio.play('uiMove');
    this.tab = next;
  }

  private setFocus(i: number): void {
    const n = this.items.length;
    const next = ((i % n) + n) % n;
    if (next !== this.focus[this.tab]) this.game.audio.play('uiMove');
    this.focus[this.tab] = next;
  }

  private say(msg: string, ok: boolean): void {
    this.toast = msg;
    this.toastTime = 2.2;
    this.game.audio.play(ok ? 'buy' : 'denied');
  }

  private commit(next: SaveData, msg: string): void {
    this.game.setSave(next);
    this.say(msg, true);
  }

  private doAction(): void {
    const item = this.item;
    if (!item) return;
    const save = this.game.save;
    const a = itemAction(save, item);
    if (!a.enabled) {
      this.chief.refused(a);
      return this.say(a.note || `${a.label}`, false);
    }
    switch (a.kind) {
      case 'buy': {
        const check = canBuy(save, item);
        if (!check.ok) return this.say(a.note || t('hangar.cannotBuy'), false);
        this.commit(buy(save, item), t('hangar.acquired', { item: itemName(item) }));
        this.chief.bought(item);
        return;
      }
      case 'select':
        if (item.type !== 'plane') return;
        this.commit(selectPlane(save, item.id), t('hangar.readyOnCat', { plane: PLANES[item.id].name }));
        this.chief.selected(item.id);
        return;
      case 'mount':
        if (item.type === 'secondary') this.mountNext(item.id);
        return;
      case 'paint':
        if (item.type !== 'livery') return;
        this.commit(applyLivery(save, save.selectedPlane, item.id), t('hangar.painted', { plane: PLANES[save.selectedPlane].name, livery: liveryName(item.id) }));
        this.chief.painted(liveryName(item.id));
        return;
      case 'none':
        return;
      default:
        throw new Error(`unhandled: ${a.kind satisfies never}`);
    }
  }

  private mountNext(id: SecondaryId): void {
    const save = this.game.save;
    const plane = save.selectedPlane;
    const slots = save.loadout[plane];
    let slot = slots.findIndex((s) => s === null);
    if (slot < 0) {
      slot = this.slotCursor % slots.length;
      this.slotCursor++;
    }
    if (!canMount(save, plane, id, slot).ok) return this.say(t('hangar.cannotMount'), false);
    this.commit(mount(save, plane, id, slot), t('hangar.mountedOn', { n: slot + 1 }));
    this.chief.mounted(id);
  }

  private unmountFocused(): void {
    const item = this.item;
    if (item?.type !== 'secondary') return;
    const slots = this.game.save.loadout[this.game.save.selectedPlane];
    const slot = slots.lastIndexOf(item.id);
    if (slot < 0) return;
    this.commit(unmount(this.game.save, this.game.save.selectedPlane, slot), t('hangar.removedFrom', { n: slot + 1 }));
    this.chief.unmounted();
  }

  private clickSlot(i: number): void {
    const save = this.game.save;
    const plane = save.selectedPlane;
    if (save.loadout[plane][i]) {
      this.commit(unmount(save, plane, i), t('hangar.cleared', { n: i + 1 }));
      return this.chief.unmounted();
    }
    const item = this.item;
    if (item?.type !== 'secondary') return;
    const check = canMount(save, plane, item.id, i);
    if (!check.ok) return this.say(t(check.reason === 'not-owned' ? 'hangar.buyFirst' : 'hangar.notAllowed'), false);
    this.commit(mount(save, plane, item.id, i), t('hangar.mountedOn', { n: i + 1 }));
    this.chief.mounted(item.id);
  }

  render(ctx: CanvasRenderingContext2D): void {
    const save = this.game.save;
    const bg = ctx.createLinearGradient(0, 0, 0, 720);
    bg.addColorStop(0, '#0d1824');
    bg.addColorStop(1, '#05090f');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 1280, 720);
    const title = t('hangar.title');
    const money = formatMoney(save.money);
    text(ctx, title, 24, 50, { size: 30, display: true, italic: true });
    text(ctx, money, 1010, 46, { size: 28, display: true, align: 'right', color: COLORS.green });
    drawButton(ctx, { id: 'base', label: t('hangar.base'), ...BASE_BTN, hint: 'B' }, false, this.t);
    drawButton(ctx, { id: 'back', label: t('hangar.map'), ...MAP_BTN, hint: 'ESC' }, false, this.t);
    this.tabButtons().forEach((b) => drawButton(ctx, b, false, this.t));
    drawList(ctx, save, this.items, this.focus[this.tab] ?? 0, this.t);
    const item = this.item;
    if (item) drawDetail(ctx, save, item, this.t);
    if (this.tab === 1) drawLoadout(ctx, save, item?.type === 'secondary' ? item.id : null);
    this.renderAction(ctx);
    const hintText = t(this.game.input.device === 'touch' ? 'hangar.hintTouch' : 'hangar.hintKeys');
    const hintX = Math.max(220, 52 + measure(ctx, title, 30, true));
    text(ctx, hintText, hintX, 48, { size: 12, color: COLORS.faint, maxWidth: 990 - measure(ctx, money, 28, true) - hintX });
    this.chief.render(ctx);
    if (this.toastTime > 0) {
      text(ctx, this.toast, DETAIL.x + 24, DETAIL.y + DETAIL.h - 36, { size: 16, color: COLORS.gold, alpha: Math.min(1, this.toastTime * 2), maxWidth: DETAIL.w - 340 });
    }
  }

  private renderAction(ctx: CanvasRenderingContext2D): void {
    const b = this.actionButton();
    const item = this.item;
    if (!b || !item) return;
    drawButton(ctx, b, b.enabled !== false, this.t);
    const twin = this.twinButton();
    if (twin) drawButton(ctx, twin, false, this.t);
    const note = itemAction(this.game.save, item).note;
    if (note && this.toastTime <= 0) text(ctx, note, DETAIL.x + 24, DETAIL.y + DETAIL.h - 36, { size: 14, color: COLORS.red, maxWidth: DETAIL.w - 340 });
  }
}
