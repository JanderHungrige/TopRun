import { formatMoney } from '../core/math';
import type { Scene } from '../core/scene';
import { STEPPE_PROJECTS, type SteppeProjectId } from '../data/steppe-research';
import { novakLine } from '../game/dialogue-scripts';
import {
  buySteppeLab, labLevelPrice, labResearch, startSteppeProject, steppeLabList, steppeProjectState,
} from '../game/steppe-lab';
import type { GameContext } from '../game/state';
import { t } from '../i18n/i18n';
import { BACK_BTN, backButton, EYE_BTN, hintLine } from '../render/rooms-chrome';
import { COLORS, text } from '../render/text';
import { PictureView } from '../ui/picture-view';
import { pilotContext, SpeechBox } from '../ui/speech';
import { drawButton, hit } from '../ui/widgets';
import {
  drawSteppeProject, drawSteppeProjects, labButton, rowRect, ROWS, scrollFor, steppeProjectName, steppeStartButton,
} from './steppe-lab-view';

// The STEPPE LAB (doc 107): Dr. Novak's projects — ↑/↓ or a click picks one, ENTER starts it, U buys the next lab level;
// after every map-7 sortie the lab's research goes into the running one (game/steppe-lab.ts). V or the eye shows the lab
// without the panels.

const FILES = import.meta.glob<string>('../assets/outpost/*.png', { eager: true, query: '?url', import: 'default' });

let backdrop: HTMLImageElement | null = null;
function picture(): HTMLImageElement | null {
  if (!backdrop && typeof Image !== 'undefined') {
    const url = FILES['../assets/outpost/lab-steppe.png'];
    if (!url) return null;
    backdrop = new Image();
    backdrop.src = url;
  }
  return backdrop?.complete && backdrop.naturalWidth > 0 ? backdrop : null;
}

export class SteppeLabScene implements Scene {
  private time = 0;
  private focus = 0;
  private hoverBack = false;
  private readonly novak: SpeechBox;
  private readonly picture: PictureView;

  constructor(private readonly game: GameContext) {
    this.picture = new PictureView(game.audio, EYE_BTN, 'pixel');
    this.novak = new SpeechBox(game.audio, {
      portrait: { x: 20, y: 70, w: 100, h: 120 },
      bubble: { x: 132, y: 76, w: 640, h: 104 },
      fontSize: 16, style: 'comic', persistent: true,
    }, 'novak', pilotContext(game));
    picture();
  }

  private get list(): SteppeProjectId[] {
    return steppeLabList(this.game.save.steppeLab);
  }

  enter(): void {
    this.game.music.play('menu');
    const lab = this.game.save.steppeLab;
    this.novak.say(lab.level > 0 ? novakLine('nov.hello') : novakLine('nov.noLab', { price: formatMoney(labLevelPrice(lab) ?? 0) }));
  }

  update(dt: number): void {
    this.time += dt;
    const input = this.game.input;
    if (this.picture.update(dt, input)) return;
    this.novak.update(dt, input);
    this.hoverBack = input.device !== 'touch' && hit(input.pointer, BACK_BTN);
    if (input.pressed('back') || input.taps.some((p) => hit(p, BACK_BTN))) {
      this.game.audio.play('uiBack');
      this.game.go({ to: 'base' });
      return;
    }
    const n = this.list.length;
    if (input.pressed('up')) this.pick(Math.max(0, this.focus - 1));
    if (input.pressed('down')) this.pick(Math.min(n - 1, this.focus + 1));
    if (input.pressed('confirm')) this.start();
    if (input.pressed('upgrade')) this.buyLevel();
    for (const p of input.taps) this.tap(p);
  }

  private tap(p: { x: number; y: number }): void {
    const lab = this.game.save.steppeLab;
    const id = this.list[this.focus];
    if (hit(p, labButton(lab, this.game.save.money))) return this.buyLevel();
    if (id && hit(p, steppeStartButton(lab, id))) return this.start();
    const top = scrollFor(this.focus, this.list.length);
    for (let k = 0; k < ROWS; k++) if (hit(p, rowRect(k)) && this.list[top + k]) return this.pick(top + k);
  }

  private pick(i: number): void {
    if (i !== this.focus) this.game.audio.play('uiMove');
    this.focus = i;
  }

  private buyLevel(): void {
    const after = buySteppeLab(this.game.save);
    if (!after) {
      this.game.audio.play('denied');
      if (labLevelPrice(this.game.save.steppeLab) !== null) this.novak.say(novakLine('nov.broke'));
      return;
    }
    this.game.setSave(after);
    this.game.audio.play('buy');
    this.novak.say(novakLine('nov.bought', { level: after.steppeLab.level }));
  }

  private start(): void {
    const save = this.game.save;
    const id = this.list[this.focus];
    if (!id) return;
    const state = steppeProjectState(save.steppeLab, id);
    if (state !== 'open') {
      this.game.audio.play('denied');
      const p = STEPPE_PROJECTS[id];
      if (state === 'lab') this.novak.say(novakLine('nov.needsLab', { level: p.lab }));
      if (state === 'needs' && p.needs) this.novak.say(novakLine('nov.needsFirst', { project: steppeProjectName(p.needs) }));
      return;
    }
    const r = startSteppeProject(save.steppeLab, id);
    this.game.setSave({ ...save, steppeLab: r.lab });
    this.game.audio.play('uiSelect');
    this.novak.say(novakLine(r.invented ? 'nov.invented' : 'nov.started', { project: steppeProjectName(id) }));
    this.focus = Math.max(0, steppeLabList(r.lab).indexOf(id));
  }

  render(ctx: CanvasRenderingContext2D): void {
    const save = this.game.save;
    const lab = save.steppeLab;
    const img = picture();
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    if (img) ctx.drawImage(img, 0, 0, 1280, 720);
    else {
      ctx.fillStyle = '#1a1610';
      ctx.fillRect(0, 0, 1280, 720);
    }
    ctx.fillStyle = 'rgba(10,8,4,0.3)';
    if (!this.picture.on) ctx.fillRect(0, 0, 1280, 720);
    ctx.restore();
    const touch = this.game.input.device === 'touch';
    if (this.picture.on) return this.picture.draw(ctx, touch);
    text(ctx, t('slab.title'), 1256, 46, { size: 30, display: true, italic: true, align: 'right', color: COLORS.gold });
    const sub = lab.level > 0
      ? `${t('slab.level', { n: lab.level })} · ${t('lab.perSortie', { n: labResearch(lab) })}${lab.research > 0 ? ` · ${t('lab.banked', { n: lab.research })}` : ''}`
      : t('slab.none');
    text(ctx, sub, 1256, 70, { size: 14, align: 'right', color: lab.level > 0 ? COLORS.ink : COLORS.amber, maxWidth: 460 });
    drawButton(ctx, labButton(lab, save.money), !touch, this.time);
    const list = this.list;
    drawSteppeProjects(ctx, lab, list, this.focus);
    const id = list[this.focus];
    if (id) drawSteppeProject(ctx, lab, id, this.time);
    this.novak.render(ctx);
    hintLine(ctx, t('slab.keys'), 30, 1016);
    backButton(ctx, this.hoverBack);
    this.picture.draw(ctx, touch);
  }
}
