import { boardIdentity, boardLink } from '../core/chalkboard-link';
import type { Scene } from '../core/scene';
import { BUCKET, SLATE, TOOL_SPOT, TOOLS, toolColor, type ToolId } from '../data/chalkboard-layout';
import { CELL_PX, emptyCells, type Cells } from '../game/chalkboard';
import { applyOp, WET_MAX } from '../game/chalkboard-ops';
import { Stroke, toBoardPx } from '../game/chalkboard-stroke';
import type { GameContext } from '../game/state';
import { t } from '../i18n/i18n';
import { Bits, drawHeld } from '../render/chalkboard/fx';
import { CHALK_HEX, drawRoom } from '../render/chalkboard/room';
import { Slate } from '../render/chalkboard/slate';
import { WetMap } from '../render/chalkboard/wet';
import { BACK_BTN, backButton, hintLine, inRect, roomHeader } from '../render/rooms-chrome';
import { text } from '../render/text';

const POLL_MS = 2500;
const CURSOR_SPEED = 520;
const NOTE_S = 3.5;
const BARE = emptyCells();

/**
 * CHALKBOARD (doc 40): the shared board under the hangar's ladder. Chalk (ladder pilots only) and the sponge — wet it
 * in the bucket to wipe clean, dry it only smears. Strokes go to the ladder service; others' strokes come in by poll.
 */
export class ChalkboardScene implements Scene {
  private time = 0;
  private tool: ToolId;
  /** The sponge's wetness (WET_MAX = just dipped), and what is left along the stroke being wiped. */
  private wet = 0;
  private liveWet = 0;
  private stroke: Stroke | null = null;
  private shown: Cells | null = null;
  private paintKey = 0;
  private seenVersion = -1;
  private dirty = false;
  private readonly cursor = { x: SLATE.x + SLATE.w / 2, y: SLATE.y + SLATE.h / 2 };
  private keyMode = false;
  private lastPointer = { x: -1, y: -1 };
  private hoverBack = false;
  private note: { key: 'chalk.dry' | 'chalk.ladderOnly'; until: number } | null = null;
  private sfxAt = 0;
  private dripAt = 0;
  private leaving = false;
  private ladderReady = false;
  private readonly link = boardLink();
  private readonly slate = new Slate();
  private readonly wetMap = new WetMap();
  private readonly bits = new Bits();

  constructor(private readonly game: GameContext) {
    this.tool = this.canChalk() ? 'white' : 'sponge';
  }

  enter(): void {
    this.link.refresh();
    this.game.music.play('menu');
    // chalk is signed with the ladder entry: make sure the service has it before the first stroke goes out
    void this.game.ladder.flush().finally(() => {
      this.ladderReady = true;
    });
  }

  private canChalk(): boolean {
    return boardIdentity(this.game.save) !== null && !this.link.refused;
  }

  update(dt: number): void {
    this.time += dt;
    this.link.tick(performance.now(), POLL_MS, boardIdentity(this.game.save), !this.ladderReady);
    this.bits.update(dt);
    this.wetMap.update(dt);
    if (this.leaving) return;
    const input = this.game.input;
    if (input.pressed('back') || input.pressed('base')) return this.leave();
    this.hoverBack = input.device !== 'touch' && inRect(input.pointer, BACK_BTN);
    if (input.pressed('weaponSwitch')) this.pick(TOOLS[(TOOLS.indexOf(this.tool) + 1) % TOOLS.length] ?? 'white');
    if (input.pressed('special')) this.dip();
    for (const tap of input.taps) {
      if (inRect(tap, BACK_BTN)) return this.leave();
      if (inRect(tap, BUCKET)) this.dip();
      for (const id of TOOLS) if (inRect(tap, TOOL_SPOT[id])) this.pick(id);
    }
    this.moveCursor(dt);
    this.draw(dt);
    this.refresh();
    this.drip();
  }

  private moveCursor(dt: number): void {
    const input = this.game.input;
    const p = input.pointer;
    if (p.x !== this.lastPointer.x || p.y !== this.lastPointer.y) {
      this.lastPointer = { x: p.x, y: p.y };
      this.cursor.x = p.x;
      this.cursor.y = p.y;
      this.keyMode = false;
    }
    const v = input.moveVector();
    if (v.x === 0 && v.y === 0) return;
    this.keyMode = true;
    this.cursor.x = Math.max(SLATE.x, Math.min(SLATE.x + SLATE.w - 1, this.cursor.x + v.x * CURSOR_SPEED * dt));
    this.cursor.y = Math.max(SLATE.y, Math.min(SLATE.y + SLATE.h - 1, this.cursor.y + v.y * CURSOR_SPEED * dt));
  }

  /** Pen down / moving / up, from the pointer (pressed on the slate) or the keys (held while the cursor moves). */
  private draw(dt: number): void {
    const input = this.game.input;
    const down = this.keyMode ? input.held('fire') || input.held('confirm') : input.touchingIn(SLATE);
    if (!down) return this.lift();
    const [bx, by] = toBoardPx(this.cursor, SLATE.x, SLATE.y);
    if (!this.stroke) return this.press(bx, by);
    const [lx, ly] = this.stroke.last;
    if (!this.stroke.add(bx, by)) return;
    this.dirty = true;
    this.effects(lx, ly, bx, by, dt);
    if (this.stroke.full) {
      this.lift();
      this.press(bx, by);
    }
  }

  private press(bx: number, by: number): void {
    const color = toolColor(this.tool);
    if (color !== null && !this.canChalk()) {
      this.note = { key: 'chalk.ladderOnly', until: this.time + NOTE_S };
      this.game.audio.play('denied');
      this.pick('sponge');
      return;
    }
    this.stroke = new Stroke(color === null ? { wet: this.wet } : { color }, bx, by);
    this.liveWet = this.wet;
    this.dirty = true;
  }

  /** The stroke so far goes to the board (and the service). */
  private lift(): void {
    if (!this.stroke) return;
    this.refresh();
    this.link.sync.add(this.stroke.op);
    if (this.stroke.op.t === 'w') this.wet = this.liveWet;
    this.stroke = null;
    this.dirty = true;
  }

  private effects(lx: number, ly: number, bx: number, by: number, dt: number): void {
    const sx = SLATE.x + bx;
    const sy = SLATE.y + by;
    const color = toolColor(this.tool);
    if (color !== null) {
      if (Math.random() < 0.5) this.bits.burst(sx, sy, 'dust', 1, CHALK_HEX[color] ?? '#fff');
      return this.sound('chalk', 0.07);
    }
    if (this.liveWet > 0) {
      const n = Math.max(1, Math.ceil(Math.hypot(bx - lx, by - ly) / 8));
      for (let i = 1; i <= n; i++) this.wetMap.soak(Math.round(lx + ((bx - lx) * i) / n), Math.round(ly + ((by - ly) * i) / n));
    } else {
      if (Math.random() < 0.3) this.bits.burst(sx, sy + 12, 'puff', 1, '#d8d6cc');
      this.note = { key: 'chalk.dry', until: this.time + NOTE_S };
    }
    this.sound('wipe', 0.12 + dt);
  }

  private sound(name: 'chalk' | 'wipe', gap: number): void {
    if (this.time < this.sfxAt) return;
    this.sfxAt = this.time + gap;
    this.game.audio.play(name, { volume: 0.7, pitch: 0.9 + Math.random() * 0.2 });
  }

  private pick(id: ToolId): void {
    if (id === this.tool) return;
    this.lift();
    if (toolColor(id) !== null && !this.canChalk()) {
      this.note = { key: 'chalk.ladderOnly', until: this.time + NOTE_S };
      return this.game.audio.play('denied');
    }
    this.tool = id;
    this.game.audio.play('uiMove');
  }

  private dip(): void {
    this.pick('sponge');
    this.wet = WET_MAX;
    this.note = null;
    this.game.audio.play('splash', { volume: 0.5 });
    this.bits.burst(BUCKET.x + BUCKET.w / 2, BUCKET.y + 10, 'drop', 8, '#8cc4ff');
  }

  /** What the slate shows: the board with the live stroke on top. */
  private refresh(): void {
    const sync = this.link.sync;
    if (!this.dirty && sync.version === this.seenVersion) return;
    this.seenVersion = sync.version;
    this.dirty = false;
    this.paintKey++;
    if (!this.stroke) {
      this.shown = sync.known || sync.waiting > 0 ? sync.view : null;
      return;
    }
    this.shown = sync.view.slice();
    const left = applyOp(this.shown, this.stroke.op);
    if (this.stroke.op.t === 'w') this.liveWet = left;
  }

  private leave(): void {
    if (this.leaving) return;
    this.lift();
    this.leaving = true;
    this.game.audio.play('uiBack');
    this.game.go({ to: 'base' });
  }

  /** A well-soaked sponge in hand drips now and then. */
  private drip(): void {
    const wet = (this.stroke?.op.t === 'w' ? this.liveWet : this.wet) / WET_MAX;
    if (wet < 0.5 || this.time < this.dripAt || this.tool !== 'sponge' || !this.cursorShown()) return;
    this.dripAt = this.time + 0.25 + Math.random() * 0.3;
    this.bits.burst(this.cursor.x + (Math.random() - 0.5) * 50, this.cursor.y + 20, 'drop', 1, '#8cc4ff');
  }

  private cursorShown(): boolean {
    return this.keyMode || inRect(this.game.input.pointer, SLATE);
  }

  private status(): string {
    if (this.link.status === 'offline') return t('chalk.offline');
    return t(this.link.status === 'loading' ? 'chalk.loading' : 'chalk.online');
  }

  render(ctx: CanvasRenderingContext2D): void {
    const wet = (this.stroke?.op.t === 'w' ? this.liveWet : this.wet) / WET_MAX;
    const p = this.game.input.pointer;
    drawRoom(ctx, { t: this.time, inHand: this.tool, canChalk: this.canChalk(), wet: this.wet / WET_MAX, bucketHot: inRect(p, BUCKET) });
    this.slate.paint(this.shown ?? BARE, this.shown ? this.paintKey : -2, this.wetMap.any ? this.wetMap.level : null);
    this.slate.draw(ctx, SLATE.x, SLATE.y, CELL_PX);
    this.bits.draw(ctx);
    if (this.cursorShown()) drawHeld(ctx, this.tool, toolColor(this.tool), this.cursor.x, this.cursor.y, wet);
    roomHeader(ctx, t('chalk.title'), SLATE.x, this.status(), SLATE.x + SLATE.w);
    if (this.note && this.time < this.note.until) {
      text(ctx, t(this.note.key), 500, 568, { size: 15, weight: 700, color: '#ffd76a', maxWidth: 420, stroke: '#0a0710', strokeWidth: 4 });
    }
    const touch = this.game.input.device === 'touch';
    hintLine(ctx, t(touch ? 'chalk.keysTouch' : 'chalk.keys'), SLATE.x, BACK_BTN.x - SLATE.x - 16);
    backButton(ctx, this.hoverBack);
  }
}
