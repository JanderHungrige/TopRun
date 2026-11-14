import { boardIdentity, boardLink } from '../core/chalkboard-link';
import type { Scene } from '../core/scene';
import { BASE_AREA_IDS, baseAreas, baseLookOf, RUN_SPEED, WALK_SPEED, type AreaTable, type BaseAreaId, type BaseLook } from '../data/base-areas';
import {
  areaAt, areaRoute, arrivedAt, neighbour, stepWalker, walkerAtArea, walkToArea, type NavDir, type Walker,
} from '../game/base-hangar';
import { baseLine } from '../game/dialogue-scripts';
import type { GameContext } from '../game/state';
import { t } from '../i18n/i18n';
import type { UiKey } from '../i18n/ui-en';
import { faceOf } from '../render/avatars/person';
import { drawHangar, type HangarText } from '../render/base';
import { drawDock } from '../render/base/dock';
import { pilotContext, SpeechBox } from '../ui/speech';
import { pilotStanding } from './pilot-rating';

/** The area this session's hangar opened last: coming back from it, the pilot stands there (doc 30). */
let lastOpened: BaseAreaId | null = null;

const NAME_KEY: Readonly<Record<BaseAreaId, UiKey>> = {
  fun: 'hbase.fun', tv: 'hbase.tv', locker: 'hbase.locker', photos: 'hbase.photos', jet: 'hbase.jet', base: 'hbase.base', lab: 'hbase.lab',
  ladder: 'hbase.ladder', chalk: 'hbase.chalk', exit: 'hbase.exit',
};
const HINT_KEY: Readonly<Record<BaseAreaId, UiKey>> = {
  fun: 'hbase.hint.fun', tv: 'hbase.hint.tv', locker: 'hbase.hint.locker', photos: 'hbase.hint.photos', jet: 'hbase.hint.jet',
  base: 'hbase.hint.base', lab: 'hbase.hint.lab', ladder: 'hbase.hint.ladder', chalk: 'hbase.hint.chalk', exit: 'hbase.hint.exit',
};
/** How often the hangar asks for the chalkboard (doc 40). */
const BOARD_POLL_MS = 20_000;
const DIRS: readonly NavDir[] = ['left', 'right', 'up', 'down'];

/**
 * BASE (doc 30): the home-base hangar in animated pixel art. The highlight moves between the areas (arrows,
 * hover), the pilot walks to the highlighted one, ENTER / click opens it once the pilot gets there; ESC → map.
 * Maps 1–3 show the carrier lounge in the base's light (doc 91), map 4 the sea dock, map 5 the space dock (docs 73, 74),
 * map 6 the jungle base's hut with the ground base and the lab (doc 86).
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
  private readonly look: BaseLook;
  private readonly areas: AreaTable;

  constructor(private readonly game: GameContext) {
    this.look = baseLookOf(game.home);
    this.areas = baseAreas(this.look);
    const back = lastOpened && this.areas[lastOpened] ? lastOpened : null;
    this.greet = back === null;
    this.focus = back ?? 'fun';
    this.walker = back
      ? walkerAtArea(back, this.areas)
      : walkToArea(walkerAtArea('exit', this.areas, -1), 'fun', this.areas);
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
    boardLink().refresh();
    this.game.music.play('menu');
    if (this.greet) this.wingman.say(baseLine('base'));
  }

  update(dt: number): void {
    this.time += dt;
    boardLink().tick(performance.now(), BOARD_POLL_MS, boardIdentity(this.game.save));
    this.wingman.update(dt, this.game.input);
    if (!this.opening && !this.left) this.handleInput();
    this.walker = stepWalker(this.walker, dt, this.opening ? RUN_SPEED : WALK_SPEED);
    if (this.opening && arrivedAt(this.walker, this.opening, this.areas)) this.leave(this.opening);
  }

  private handleInput(): void {
    const input = this.game.input;
    if (input.pressed('back') || input.pressed('base')) return this.toMap();
    for (const dir of DIRS) if (input.pressed(dir)) this.setFocus(neighbour(this.focus, dir, this.areas));
    const p = input.pointer;
    if (input.device !== 'touch' && (p.x !== this.pointer.x || p.y !== this.pointer.y)) {
      this.pointer.x = p.x;
      this.pointer.y = p.y;
      const hover = areaAt(p, this.areas);
      if (hover) this.setFocus(hover);
    }
    for (const tap of input.taps) {
      const id = areaAt(tap, this.areas);
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
    this.walker = walkToArea(this.walker, id, this.areas);
  }

  /** The pilot hurries to the area; the route is taken on arrival (update). */
  private open(id: BaseAreaId): void {
    this.opening = id;
    this.game.audio.play('uiSelect');
    this.walker = walkToArea(this.walker, id, this.areas);
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

  /** The mech bay on the jungle base (doc 79), the motor pool and Dr. Novak's lab in the steppe tent (doc 111). */
  private hintKey(): UiKey {
    if (this.focus === 'jet' && this.look === 'jungle') return 'hbase.hint.mech';
    if (this.focus === 'jet' && this.look === 'steppe') return 'hbase.hint.tank';
    if (this.focus === 'lab' && this.look === 'steppe') return 'hbase.hint.steppeLab';
    return HINT_KEY[this.focus];
  }

  private text(): HangarText {
    const hint = this.hintKey();
    return { names: this.names, hint: t(hint), keys: t('hbase.keys'), title: t('hbase.title') };
  }

  render(ctx: CanvasRenderingContext2D): void {
    const save = this.game.save;
    const sync = boardLink().sync;
    const view = {
      t: this.time, focus: this.focus, plane: save.selectedPlane, livery: save.livery[save.selectedPlane],
      face: faceOf(this.game.profile), walker: this.walker, board: this.board, text: this.text(),
      chalk: { cells: sync.known ? sync.view : null, version: sync.version }, light: this.game.baseLight,
    };
    if (!drawDock(ctx, this.look, view, this.areas)) drawHangar(ctx, view); // the code-drawn hangar while a picture loads
    this.wingman.render(ctx);
  }
}
