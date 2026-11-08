import type { Scene } from '../core/scene';
import { GRID, type ModuleId } from '../data/ship-modules';
import { canPlace, place, remove } from '../game/ship';
import { buyLaser, buyModule, buyShipMark, canBuyLaser, canBuyModule, canBuyShipMark } from '../game/ship-shop';
import type { GameContext } from '../game/state';
import { t } from '../i18n/i18n';
import { PictureView } from '../ui/picture-view';
import { hit } from '../ui/widgets';
import { markName } from './hangar-items';
import { BTN, cellAt, drawShipyard, drawYardBackdrop, familyOf, ROWS, rowRect, type YardView } from './shipyard-view';

// The shipyard (doc 55): map 4's hangar. Buy modules into stock and laser power; place modules on the ship's grid.
// List focus: ↑/↓ pick, ENTER buys, U buys the module's next mark (doc 57), E (or →) goes to the grid. Grid focus:
// arrows move the cursor, ENTER places the picked module, X / Delete takes the one under the cursor off, E / ESC back
// to the list. Tap a row, BUY, UPGRADE, or a cell. V or the eye shows the picture alone (doc 76).

export class ShipyardScene implements Scene {
  private time = 0;
  private row = 1;
  private mode: 'list' | 'grid' = 'list';
  private cursor = { col: GRID.core.col, row: GRID.core.row - 1 };
  private note = '';
  private noteT = 0;
  private readonly picture: PictureView;

  constructor(private readonly game: GameContext) {
    this.picture = new PictureView(game.audio, BTN.eye, 'panel');
  }

  enter(): void {
    this.game.music.play('menu');
  }

  private get picked(): ModuleId | null {
    const r = ROWS[this.row];
    return r && r !== 'power' ? r : null;
  }

  update(dt: number): void {
    this.time += dt;
    this.noteT = Math.max(0, this.noteT - dt);
    const input = this.game.input;
    if (this.picture.update(dt, input)) return;
    for (const tap of input.taps) this.tap(tap);
    if (input.pressed('base')) return this.leave('base');
    if (this.mode === 'grid') return this.updateGrid();
    if (input.pressed('back')) return this.leave('map');
    if (input.pressed('up')) this.pick(this.row - 1);
    if (input.pressed('down')) this.pick(this.row + 1);
    if (input.pressed('confirm')) this.buy();
    if (input.pressed('upgrade')) this.upgrade();
    if ((input.pressed('special') || input.pressed('right')) && this.picked) this.mode = 'grid';
  }

  private updateGrid(): void {
    const input = this.game.input;
    const move = (dc: number, dr: number): void => {
      this.cursor = { col: Math.max(0, Math.min(GRID.cols - 1, this.cursor.col + dc)), row: Math.max(0, Math.min(GRID.rows - 1, this.cursor.row + dr)) };
    };
    if (input.pressed('left')) move(-1, 0);
    if (input.pressed('right')) move(1, 0);
    if (input.pressed('up')) move(0, -1);
    if (input.pressed('down')) move(0, 1);
    if (input.pressed('confirm')) this.placeAt(this.cursor.col, this.cursor.row);
    if (input.pressed('weaponSwitch') || input.pressed('delete')) this.removeAt(this.cursor.col, this.cursor.row);
    if (input.pressed('special') || input.pressed('back')) this.mode = 'list';
  }

  private tap(p: { x: number; y: number }): void {
    if (hit(p, BTN.map)) return this.leave('map');
    if (hit(p, BTN.base)) return this.leave('base');
    if (hit(p, BTN.buy)) return this.buy();
    if (hit(p, BTN.mark)) return this.upgrade();
    const i = ROWS.findIndex((_, k) => hit(p, rowRect(k)));
    if (i >= 0) return this.pick(i);
    const cell = cellAt(p);
    if (!cell) return;
    this.cursor = cell;
    this.mode = 'grid';
    const s = this.game.save.ship;
    if (s.modules.some((m) => m.col === cell.col && m.row === cell.row)) this.removeAt(cell.col, cell.row);
    else this.placeAt(cell.col, cell.row);
  }

  private pick(i: number): void {
    const next = Math.max(0, Math.min(ROWS.length - 1, i));
    if (next !== this.row) this.game.audio.play('uiMove');
    this.row = next;
  }

  private buy(): void {
    const save = this.game.save;
    const id = this.picked;
    const check = id ? canBuyModule(save, id) : canBuyLaser(save);
    if (!check.ok) return this.say(t(check.reason === 'insufficient-funds' ? 'hangar.cannotBuy' : check.reason === 'max' ? 'hangar.maxed' : 'hangar.locked'), false);
    this.game.setSave(id ? buyModule(save, id) : buyLaser(save));
    this.say(t('shipyard.bought'), true);
  }

  /** The picked module family's next mark (doc 57). */
  private upgrade(): void {
    const id = this.picked;
    const f = id ? familyOf(id) : null;
    if (!id || !f) return;
    const save = this.game.save;
    const check = canBuyShipMark(save, f);
    if (!check.ok) return this.say(t(check.reason === 'insufficient-funds' ? 'hangar.cannotBuy' : check.reason === 'max' ? 'hangar.maxed' : 'hangar.locked'), false);
    const next = buyShipMark(save, f);
    this.game.setSave(next);
    this.say(t('arsenal.markBought', { item: t(`module.${id}`), mark: markName(next.ship.marks[f]) }), true);
  }

  private placeAt(col: number, row: number): void {
    const id = this.picked;
    const save = this.game.save;
    if (!id) return;
    const check = canPlace(save.ship, id, col, row);
    if (!check.ok) return this.say(t(check.reason === 'no-stock' ? 'shipyard.noStock' : 'shipyard.cantGo'), false);
    this.game.setSave({ ...save, ship: place(save.ship, id, col, row) });
    this.game.audio.play('uiSelect');
  }

  private removeAt(col: number, row: number): void {
    const save = this.game.save;
    const after = remove(save.ship, col, row);
    if (after === save.ship) return this.say(t('shipyard.cantRemove'), false);
    this.game.setSave({ ...save, ship: after });
    this.game.audio.play('uiBack');
  }

  private say(note: string, good: boolean): void {
    this.note = note;
    this.noteT = 2.2;
    this.game.audio.play(good ? 'buy' : 'denied');
  }

  private leave(to: 'map' | 'base'): void {
    this.game.audio.play('uiBack');
    this.game.go({ to });
  }

  render(ctx: CanvasRenderingContext2D): void {
    const touch = this.game.input.device === 'touch';
    if (this.picture.on) {
      drawYardBackdrop(ctx, false);
      return this.picture.draw(ctx, touch);
    }
    const view: YardView = {
      save: this.game.save, row: ROWS[this.row] ?? 'power', rowIndex: this.row, mode: this.mode, cursor: this.cursor,
      note: this.noteT > 0 ? this.note : '', time: this.time,
    };
    drawShipyard(ctx, view);
    this.picture.draw(ctx, touch);
  }
}
