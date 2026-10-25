import type { Scene } from '../core/scene';
import { BASE_AREA_IDS, BASE_AREAS, RUN_SPEED, WALK_SPEED, type BaseAreaId } from '../data/base-areas';
import {
  areaAt, areaRoute, arrivedAt, neighbour, stepWalker, walkerAt, walkTo, type NavDir, type Walker,
} from '../game/base-hangar';
import { baseLine } from '../game/dialogue-scripts';
import type { GameContext } from '../game/state';
import { t } from '../i18n/i18n';
import type { UiKey } from '../i18n/ui-en';
import { faceOf } from '../render/avatars/person';
import { drawHangar, type HangarText } from '../render/base';
import { pilotContext, SpeechBox } from '../ui/speech';
import { pilotStanding } from './pilot-rating';

/** The area this session's hangar opened last: coming back from it, the pilot stands there (doc 30). */
let lastOpened: BaseAreaId | null = null;

const NAME_KEY: Readonly<Record<BaseAreaId, UiKey>> = {
  fun: 'hbase.fun', locker: 'hbase.locker', photos: 'hbase.photos', ladder: 'hbase.ladder', exit: 'hbase.exit',
};
const HINT_KEY: Readonly<Record<BaseAreaId, UiKey>> = {
  fun: 'hbase.hint.fun', locker: 'hbase.hint.locker', photos: 'hbase.hint.photos', ladder: 'hbase.hint.ladder', exit: 'hbase.hint.exit',
};
const DIRS: readonly NavDir[] = ['left', 'right', 'up', 'down'];

/**
 * BASE (doc 30): the home-base hangar in animated pixel art. The highlight moves between the areas (arrows,
 * hover), the pilot walks to the highlighted one, ENTER / click opens it once the pilot gets there; ESC → map.
 */
export class HangarBaseScene implements Scene {
  private time = 0;
  private focus: BaseAreaId;
  private walker: Walker;
  private opening: BaseAreaId | null = null;
  private left = false;
  private readonly greet: boolean;
  private readonly pointer: { x: number; y: number };
  private readonly wingman: SpeechBox;
  private readonly names: Readonly<Record<BaseAreaId, string>>;
  private readonly board: readonly string[];

  constructor(private readonly game: GameContext) {
    const back = lastOpened;
    this.greet = back === null;
    this.focus = back ?? 'fun';
    this.walker = back
      ? walkerAt(BASE_AREAS[back].standX)
      : walkTo(walkerAt(BASE_AREAS.exit.standX, -1), BASE_AREAS.fun.standX);
    this.pointer = { x: game.input.pointer.x, y: game.input.pointer.y };
    this.wingman = new SpeechBox(game.audio, {
      portrait: { x: 20, y: 14, w: 84, h: 100 },
      bubble: { x: 116, y: 24, w: 500, h: 88 },
      fontSize: 16, style: 'comic', persistent: false,
    }, 'wingman', pilotContext(game));
    this.names = Object.fromEntries(BASE_AREA_IDS.map((id) => [id, t(NAME_KEY[id])])) as Record<BaseAreaId, string>;
    const callsign = (game.profile?.callsign ?? 'PILOT').toUpperCase();
    this.board = [t('hbase.ladder'), callsign, t('hbase.points', { n: pilotStanding(game.save).rating })];
  }

  enter(): void {
    this.game.music.play('menu');
    if (this.greet) this.wingman.say(baseLine('base'));
  }

  update(dt: number): void {
    this.time += dt;
    this.wingman.update(dt, this.game.input);
    if (!this.opening && !this.left) this.handleInput();
    this.walker = stepWalker(this.walker, dt, this.opening ? RUN_SPEED : WALK_SPEED);
    if (this.opening && arrivedAt(this.walker, this.opening)) this.leave(this.opening);
  }

  private handleInput(): void {
    const input = this.game.input;
    if (input.pressed('back') || input.pressed('base')) return this.toMap();
    for (const dir of DIRS) if (input.pressed(dir)) this.setFocus(neighbour(this.focus, dir));
    const p = input.pointer;
    if (input.device !== 'touch' && (p.x !== this.pointer.x || p.y !== this.pointer.y)) {
      this.pointer.x = p.x;
      this.pointer.y = p.y;
      const hover = areaAt(p);
      if (hover) this.setFocus(hover);
    }
    for (const tap of input.taps) {
      const id = areaAt(tap);
      if (!id) continue;
      this.setFocus(id);
      return this.open(id);
    }
    if (input.pressed('confirm')) this.open(this.focus);
  }

  private setFocus(id: BaseAreaId): void {
    if (id === this.focus) return;
    this.focus = id;
    this.game.audio.play('uiMove');
    this.walker = walkTo(this.walker, BASE_AREAS[id].standX);
  }

  /** The pilot hurries to the area; the route is taken on arrival (update). */
  private open(id: BaseAreaId): void {
    this.opening = id;
    this.game.audio.play('uiSelect');
    this.walker = walkTo(this.walker, BASE_AREAS[id].standX);
  }

  private leave(id: BaseAreaId): void {
    if (this.left) return;
    this.left = true;
    lastOpened = id === 'exit' ? null : id;
    this.game.go(areaRoute(id));
  }

  private toMap(): void {
    if (this.left) return;
    this.left = true;
    lastOpened = null;
    this.game.audio.play('uiBack');
    this.game.go({ to: 'map' });
  }

  private text(): HangarText {
    return { names: this.names, hint: t(HINT_KEY[this.focus]), keys: t('hbase.keys'), title: t('hbase.title') };
  }

  render(ctx: CanvasRenderingContext2D): void {
    const save = this.game.save;
    drawHangar(ctx, {
      t: this.time, focus: this.focus, plane: save.selectedPlane, livery: save.livery[save.selectedPlane],
      face: faceOf(this.game.profile), walker: this.walker, board: this.board, text: this.text(),
    });
    this.wingman.render(ctx);
  }
}
