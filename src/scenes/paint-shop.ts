import type { Scene } from '../core/scene';
import { PLANES } from '../data/planes';
import type { MechId } from '../data/types';
import { brush, defaultPaint, fill, PAINT_COLORS, PAINT_SIZE, randomPaint, stripes, type Paint } from '../game/mech-paint';
import type { GameContext } from '../game/state';
import { t } from '../i18n/i18n';
import { drawLoadoutBackdrop } from '../render/loadout-backdrop';
import { hintLine } from '../render/rooms-chrome';
import { COLORS, text } from '../render/text';
import { hit } from '../ui/widgets';
import { cellUnder, drawGrid, drawPalette, drawPreview, drawTools, swatchRect, TOOLS, toolButton, type Tool } from './paint-shop-view';

// The PAINT SHOP (doc 87): a mech's 16 × 16 camo tile painted by hand — brush, fill, stamps, undo — with the mech
// wearing it alongside; ESC or DONE saves it and returns to the mech bay.

const UNDO_DEPTH = 30;

export class PaintShopScene implements Scene {
  private time = 0;
  private paint: Paint;
  private color = 0;
  private tool: Tool = 'brush1';
  private cursor = { x: 8, y: 8 };
  private undo: Paint[] = [];
  private stroking = false;
  private left = false;

  constructor(private readonly game: GameContext, private readonly mech: MechId) {
    this.paint = game.save.mechPaint[mech] ?? defaultPaint(mech);
  }

  enter(): void {
    this.game.music.play('menu');
  }

  update(dt: number): void {
    this.time += dt;
    const input = this.game.input;
    if (input.pressed('back')) return this.leave();
    if (input.pressed('left')) this.moveCursor(-1, 0);
    if (input.pressed('right')) this.moveCursor(1, 0);
    if (input.pressed('up')) this.moveCursor(0, -1);
    if (input.pressed('down')) this.moveCursor(0, 1);
    if (input.pressed('special')) this.color = (this.color + 1) % PAINT_COLORS.length;
    if (input.pressed('weaponSwitch')) this.tool = this.tool === 'brush1' ? 'brush2' : this.tool === 'brush2' ? 'brush3' : 'brush1';
    if (input.pressed('flare')) this.apply('fill', this.cursor);
    if (input.pressed('upgrade')) this.apply('undo', this.cursor);
    if (input.pressed('fire')) this.apply(this.tool, this.cursor);
    for (const p of input.taps) this.tap(p);
    this.drag();
  }

  private moveCursor(dx: number, dy: number): void {
    this.cursor = { x: (this.cursor.x + dx + PAINT_SIZE) % PAINT_SIZE, y: (this.cursor.y + dy + PAINT_SIZE) % PAINT_SIZE };
  }

  /** Holding the pointer down over the tile paints as it moves (brushes only; one undo step per stroke). */
  private drag(): void {
    const p = this.game.input.pointer;
    const cell = p.down ? cellUnder(p) : null;
    if (!cell || !this.tool.startsWith('brush')) {
      this.stroking = false;
      return;
    }
    if (!this.stroking) this.remember();
    this.stroking = true;
    this.cursor = cell;
    this.paint = brush(this.paint, cell.x, cell.y, this.color, this.size());
  }

  private tap(p: { x: number; y: number }): void {
    const swatch = PAINT_COLORS.findIndex((_, i) => hit(p, swatchRect(i)));
    if (swatch >= 0) {
      this.color = swatch;
      this.game.audio.play('uiMove');
      return;
    }
    const i = TOOLS.findIndex((tl, k) => hit(p, toolButton(tl, k, false)));
    const tool = TOOLS[i];
    if (!tool) {
      const cell = cellUnder(p);
      if (cell && this.tool === 'fill') this.apply('fill', cell);
      return;
    }
    if (tool === 'brush1' || tool === 'brush2' || tool === 'brush3' || tool === 'fill') this.tool = tool;
    else this.apply(tool, this.cursor);
    this.game.audio.play('uiSelect');
  }

  private size(): number {
    return this.tool === 'brush3' ? 3 : this.tool === 'brush2' ? 2 : 1;
  }

  private remember(): void {
    this.undo = [...this.undo.slice(-(UNDO_DEPTH - 1)), this.paint];
  }

  private apply(tool: Tool, at: { x: number; y: number }): void {
    if (tool === 'done') return this.leave();
    if (tool === 'undo') {
      this.paint = this.undo.pop() ?? this.paint;
      return;
    }
    this.remember();
    switch (tool) {
      case 'brush1':
      case 'brush2':
      case 'brush3': this.paint = brush(this.paint, at.x, at.y, this.color, this.size()); return;
      case 'fill': this.paint = fill(this.paint, at.x, at.y, this.color); return;
      case 'blobs': this.paint = randomPaint(Math.floor(this.time * 1000)); return;
      case 'stripes': this.paint = stripes(this.color, (this.color + 4) % PAINT_COLORS.length); return;
      case 'solid': this.paint = String(this.color).repeat(PAINT_SIZE * PAINT_SIZE); return;
      default: throw new Error(`unhandled: ${tool satisfies never}`);
    }
  }

  /** Saves the paint on the mech and returns to the mech bay. */
  private leave(): void {
    if (this.left) return;
    this.left = true;
    const save = this.game.save;
    this.game.setSave({ ...save, mechPaint: { ...save.mechPaint, [this.mech]: this.paint } });
    this.game.audio.play('buy');
    this.game.go({ to: 'hangar' });
  }

  render(ctx: CanvasRenderingContext2D): void {
    if (!drawLoadoutBackdrop(ctx, 'mech')) {
      ctx.fillStyle = '#10180e';
      ctx.fillRect(0, 0, 1280, 720);
    }
    text(ctx, t('paint.title'), 60, 70, { size: 30, display: true, italic: true, color: COLORS.gold });
    drawGrid(ctx, this.paint, this.cursor, this.time);
    drawPalette(ctx, this.color);
    drawPreview(ctx, this.mech, this.paint, PLANES[this.mech].name, this.time);
    drawTools(ctx, this.tool, this.time);
    hintLine(ctx, t('paint.keys'), 60, 1160);
  }
}
