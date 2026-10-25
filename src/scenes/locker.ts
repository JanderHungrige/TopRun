import type { Scene } from '../core/scene';
import { MEDAL_IDS, type MedalId } from '../data/medals';
import { typewriter } from '../game/dialogue';
import { earnedMedals } from '../game/medals';
import type { GameContext } from '../game/state';
import { moveSlot, slotAt, uniformLayout, type SlotDir, type UniformLayout } from '../game/uniform-layout';
import { medalCitation } from '../i18n/content';
import { t } from '../i18n/i18n';
import { drawDust, drawFlicker, swayOffset } from '../render/locker/ambient';
import { drawLockerCard, PANEL } from '../render/locker/card';
import { drawBoards, drawNamePlate } from '../render/locker/insignia';
import { drawJacket } from '../render/locker/jacket';
import { drawRack } from '../render/locker/rack';
import { lockerBackdrop } from '../render/locker/set';
import { BACK_BTN, backButton, blitLayer, hintLine, inRect, roomGrid, roomHeader } from '../render/rooms-chrome';
import { goldCount } from './minigames/registry';
import { pilotStanding } from './pilot-rating';

const DIRS: readonly SlotDir[] = ['left', 'right', 'up', 'down'];

/**
 * LOCKER (doc 31): the pilot's open locker with the dress whites — every earned medal and ribbon on the chest,
 * rank boards, wings and name plate. Arrows / hover / tap select a medal; the card shows it with its citation.
 * BACK returns to the hangar base.
 */
export class LockerScene implements Scene {
  private time = 0;
  private selected: number;
  /** Seconds the current citation has been typing. */
  private cite = 0;
  private leaving = false;
  private hoverBack = false;
  private lastPointer = { x: -1, y: -1 };
  private readonly medals: MedalId[];
  private readonly layout: UniformLayout;
  private readonly standing: ReturnType<typeof pilotStanding>;

  constructor(private readonly game: GameContext) {
    this.medals = earnedMedals(game.save, goldCount(game.save));
    this.layout = uniformLayout(this.medals);
    this.standing = pilotStanding(game.save);
    this.selected = this.layout.slots.length > 0 ? 0 : -1;
  }

  enter(): void {
    this.game.music.play('menu');
  }

  private medal(): MedalId | null {
    return this.layout.slots[this.selected]?.id ?? null;
  }

  private select(i: number): void {
    if (i < 0 || i === this.selected) return;
    this.selected = i;
    this.cite = 0;
    this.game.audio.play('uiMove');
  }

  update(dt: number): void {
    this.time += dt;
    this.cite += dt;
    const input = this.game.input;
    if (input.pressed('back') || input.pressed('base')) return this.leave();
    for (const d of DIRS) if (input.pressed(d)) this.select(moveSlot(this.layout, this.selected, d));
    const p = input.pointer;
    const moved = p.x !== this.lastPointer.x || p.y !== this.lastPointer.y;
    this.lastPointer = { x: p.x, y: p.y };
    if (moved && input.device !== 'touch') this.select(slotAt(this.layout, p, this.selected));
    this.hoverBack = input.device !== 'touch' && inRect(p, BACK_BTN);
    for (const tap of input.taps) {
      if (inRect(tap, BACK_BTN)) return this.leave();
      this.select(slotAt(this.layout, tap, this.selected));
    }
    if (input.pressed('confirm')) this.cite = 999;
  }

  private leave(): void {
    if (this.leaving) return;
    this.leaving = true;
    this.game.audio.play('uiBack');
    this.game.go({ to: 'base' });
  }

  render(ctx: CanvasRenderingContext2D): void {
    const g = roomGrid(ctx);
    const bg = lockerBackdrop(g);
    if (bg) blitLayer(ctx, bg, g);
    const dx = swayOffset(this.time, g.G);
    drawJacket(ctx, g.G, dx);
    drawBoards(ctx, this.standing.rank, g.G, dx);
    drawNamePlate(ctx, (this.game.profile?.callsign ?? 'PILOT').toUpperCase(), g.G, dx);
    drawRack(ctx, this.layout, this.selected, g.G, dx, this.time);
    drawFlicker(ctx, this.time);
    drawDust(ctx, this.time, g.G);
    roomHeader(ctx, t('rooms.locker'), PANEL.x, t('locker.count', { n: this.medals.length, total: MEDAL_IDS.length }), PANEL.x + PANEL.w);
    const id = this.medal();
    const typed = id ? typewriter(medalCitation(id), this.cite).length : 0;
    drawLockerCard(ctx, { medal: id, typed, rank: this.standing.rank, rating: this.standing.rating, G: g.G, clock: this.time });
    const touch = this.game.input.device === 'touch';
    hintLine(ctx, t(touch ? 'locker.hintTouch' : 'locker.hint'), PANEL.x, BACK_BTN.x - PANEL.x - 12);
    backButton(ctx, this.hoverBack);
  }
}
