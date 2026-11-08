import type { Scene } from '../core/scene';
import { BUILDING_IDS, type BuildingId, type RoundsId } from '../data/outpost';
import { majorLine } from '../game/dialogue-scripts';
import { build, buildRounds, canBuild, canBuildRounds, powerShare, roundsOrder } from '../game/outpost';
import type { GameContext } from '../game/state';
import { t } from '../i18n/i18n';
import { drawBuilding } from '../render/outpost-buildings';
import { BACK_BTN, backButton, EYE_BTN, hintLine } from '../render/rooms-chrome';
import { PictureView } from '../ui/picture-view';
import { pilotContext, SpeechBox } from '../ui/speech';
import { hit, type Rect } from '../ui/widgets';
import { roundsName } from './hangar-mech';
import { buildButton, buildingName, drawBuildingPanel, drawTopBar, orderButtons } from './outpost-view';

// The GROUND BASE (doc 82): the jungle clearing with the base's five buildings on it, each drawn at its level; ←/→ or a
// click picks one, ENTER builds or upgrades it with money; at the factory ↑/↓ pick an order of rounds instead; Major
// Brennan comments. V or the eye shows the clearing without the panels (doc 76).

const FILES = import.meta.glob<string>('../assets/outpost/*.png', { eager: true, query: '?url', import: 'default' });

/** Where each building stands on the clearing (its foot, logical px). */
const PLOT_X: Readonly<Record<BuildingId, number>> = { generator: 150, refinery: 380, factory: 610, lab: 840, mechbay: 1080 };
const GROUND = 640;
const plotRect = (id: BuildingId): Rect => ({ x: PLOT_X[id] - 110, y: GROUND - 230, w: 220, h: 250 });

let backdrop: HTMLImageElement | null = null;
function picture(): HTMLImageElement | null {
  if (!backdrop && typeof Image !== 'undefined') {
    const url = FILES['../assets/outpost/base.png'];
    if (!url) return null;
    backdrop = new Image();
    backdrop.src = url;
  }
  return backdrop?.complete && backdrop.naturalWidth > 0 ? backdrop : null;
}

/** Whether the Major has explained the base this session. */
let explained = false;

export class OutpostScene implements Scene {
  private time = 0;
  private focus: BuildingId = 'generator';
  /** At the factory: 0 = BUILD, 1–3 = the order buttons. */
  private row = 0;
  private hoverBack = false;
  private readonly major: SpeechBox;
  private readonly picture: PictureView;

  constructor(private readonly game: GameContext) {
    this.picture = new PictureView(game.audio, EYE_BTN, 'pixel');
    this.major = new SpeechBox(game.audio, {
      portrait: { x: 20, y: 76, w: 100, h: 120 },
      bubble: { x: 132, y: 82, w: 600, h: 104 },
      fontSize: 16, style: 'comic', persistent: true,
    }, 'major', pilotContext(game));
    picture();
  }

  enter(): void {
    this.game.music.play('menu');
    const o = this.game.save.outpost;
    const first = !explained && o.buildings.generator === 0;
    explained = true;
    this.major.say(majorLine(first ? 'maj.firstVisit' : 'maj.hello'));
    if (powerShare(o) < 1) this.major.say(majorLine('maj.lowPower', { share: Math.round(powerShare(o) * 100) }));
  }

  update(dt: number): void {
    this.time += dt;
    const input = this.game.input;
    if (this.picture.update(dt, input)) return;
    this.major.update(dt, input);
    this.hoverBack = input.device !== 'touch' && hit(input.pointer, BACK_BTN);
    if (input.pressed('back') || input.taps.some((p) => hit(p, BACK_BTN))) {
      this.game.audio.play('uiBack');
      this.game.go({ to: 'base' });
      return;
    }
    if (input.pressed('left')) this.move(-1);
    if (input.pressed('right')) this.move(1);
    if (this.focus === 'factory' && input.pressed('up')) this.row = Math.max(0, this.row - 1);
    if (this.focus === 'factory' && input.pressed('down')) this.row = Math.min(3, this.row + 1);
    if (input.pressed('confirm')) this.activate();
    for (const p of input.taps) this.tap(p);
  }

  private tap(p: { x: number; y: number }): void {
    const save = this.game.save;
    if (hit(p, buildButton(save.outpost, this.focus, save.money))) return this.build();
    if (this.focus === 'factory') for (const b of orderButtons(save.outpost)) if (hit(p, b)) return this.order(b.id as RoundsId);
    const id = BUILDING_IDS.find((b) => hit(p, plotRect(b)));
    if (id && id !== this.focus) {
      this.focus = id;
      this.row = 0;
      this.game.audio.play('uiMove');
    }
  }

  private move(d: number): void {
    const i = BUILDING_IDS.indexOf(this.focus);
    const next = BUILDING_IDS[Math.max(0, Math.min(BUILDING_IDS.length - 1, i + d))] ?? this.focus;
    if (next !== this.focus) this.game.audio.play('uiMove');
    this.focus = next;
    this.row = 0;
  }

  private activate(): void {
    const r = (['rockets', 'missiles', 'shells'] as const)[this.row - 1];
    if (this.focus === 'factory' && r) this.order(r);
    else this.build();
  }

  private build(): void {
    const save = this.game.save;
    const check = canBuild(save, this.focus);
    if (!check.ok) {
      this.game.audio.play('denied');
      if (check.reason === 'insufficient-funds') this.major.say(majorLine('maj.broke'));
      return;
    }
    const next = build(save, this.focus);
    this.game.setSave(next);
    this.game.audio.play('buy');
    const level = next.outpost.buildings[this.focus];
    const building = buildingName(this.focus);
    this.major.say(majorLine(level === 1 ? 'maj.built' : 'maj.upgraded', { building, level }));
  }

  private order(r: RoundsId): void {
    const save = this.game.save;
    const check = canBuildRounds(save.outpost, r);
    if (!check.ok) {
      this.game.audio.play('denied');
      if (check.reason === 'no-factory') this.major.say(majorLine('maj.noFactory'));
      if (check.reason === 'full') this.major.say(majorLine('maj.magazineFull'));
      return;
    }
    const n = roundsOrder(save.outpost, r);
    this.game.setSave({ ...save, outpost: buildRounds(save.outpost, r) });
    this.game.audio.play('buy');
    this.major.say(majorLine('maj.rounds', { n, kind: roundsName(r) }));
  }

  render(ctx: CanvasRenderingContext2D): void {
    const save = this.game.save;
    const img = picture();
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    if (img) ctx.drawImage(img, 0, 0, 1280, 720);
    else {
      ctx.fillStyle = '#2a4a22';
      ctx.fillRect(0, 0, 1280, 720);
    }
    ctx.restore();
    for (const id of BUILDING_IDS) drawBuilding(ctx, id, save.outpost.buildings[id], PLOT_X[id], GROUND, this.time);
    const touch = this.game.input.device === 'touch';
    if (this.picture.on) return this.picture.draw(ctx, touch);
    const r = plotRect(this.focus);
    ctx.strokeStyle = `rgba(255,215,106,${(0.6 + Math.sin(this.time * 5) * 0.3).toFixed(2)})`;
    ctx.lineWidth = 3;
    ctx.strokeRect(r.x, r.y, r.w, r.h);
    drawTopBar(ctx, save.money, save.outpost);
    drawBuildingPanel(ctx, save.outpost, this.focus, save.money, this.time, this.focus === 'factory' ? this.row : 0);
    this.major.render(ctx);
    hintLine(ctx, t('outpost.keys'), 24, 1020);
    backButton(ctx, this.hoverBack);
    this.picture.draw(ctx, touch);
  }
}
