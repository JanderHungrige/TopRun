import type { Scene } from '../core/scene';
import { docLine } from '../game/dialogue-scripts';
import { labList, projectState, startProject } from '../game/lab';
import { researchPerDay } from '../game/outpost';
import type { GameContext } from '../game/state';
import { t } from '../i18n/i18n';
import { BACK_BTN, backButton, EYE_BTN, hintLine } from '../render/rooms-chrome';
import { COLORS, text } from '../render/text';
import { PictureView } from '../ui/picture-view';
import { pilotContext, SpeechBox } from '../ui/speech';
import { hit } from '../ui/widgets';
import { PROJECTS, type ProjectId } from '../data/research';
import { drawProject, drawProjects, projectName, rowRect, startButton } from './lab-view';

// The LAB (doc 83): Dr. Moreau's projects — ↑/↓ or a click picks one, ENTER starts it; after every sortie the lab's
// research goes into the running one (game/outpost-day.ts). V or the eye shows the lab without the panels (doc 76).

const FILES = import.meta.glob<string>('../assets/outpost/*.png', { eager: true, query: '?url', import: 'default' });

let backdrop: HTMLImageElement | null = null;
function picture(): HTMLImageElement | null {
  if (!backdrop && typeof Image !== 'undefined') {
    const url = FILES['../assets/outpost/lab.png'];
    if (!url) return null;
    backdrop = new Image();
    backdrop.src = url;
  }
  return backdrop?.complete && backdrop.naturalWidth > 0 ? backdrop : null;
}

export class LabScene implements Scene {
  private time = 0;
  private focus = 0;
  private hoverBack = false;
  private readonly doc: SpeechBox;
  private readonly picture: PictureView;

  constructor(private readonly game: GameContext) {
    this.picture = new PictureView(game.audio, EYE_BTN, 'pixel');
    this.doc = new SpeechBox(game.audio, {
      portrait: { x: 20, y: 70, w: 100, h: 120 },
      bubble: { x: 132, y: 76, w: 640, h: 104 },
      fontSize: 16, style: 'comic', persistent: true,
    }, 'doc', pilotContext(game));
    picture();
  }

  private get list(): ProjectId[] {
    return labList(this.game.save.outpost);
  }

  enter(): void {
    this.game.music.play('menu');
    this.doc.say(docLine(this.game.save.outpost.buildings.lab > 0 ? 'doc.hello' : 'doc.noLab'));
  }

  update(dt: number): void {
    this.time += dt;
    const input = this.game.input;
    if (this.picture.update(dt, input)) return;
    this.doc.update(dt, input);
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
    for (const p of input.taps) {
      const id = this.list[this.focus];
      if (id && hit(p, startButton(this.game.save.outpost, id))) return this.start();
      const i = this.list.findIndex((_, k) => hit(p, rowRect(k)));
      if (i >= 0) this.pick(i);
    }
  }

  private pick(i: number): void {
    if (i !== this.focus) this.game.audio.play('uiMove');
    this.focus = i;
  }

  private start(): void {
    const save = this.game.save;
    const id = this.list[this.focus];
    if (!id) return;
    const state = projectState(save.outpost, id);
    if (state !== 'open') {
      this.game.audio.play('denied');
      const p = PROJECTS[id];
      if (state === 'lab') this.doc.say(docLine(save.outpost.buildings.lab > 0 ? 'doc.needsLab' : 'doc.noLab', { level: p.lab }));
      if (state === 'needs' && p.needs) this.doc.say(docLine('doc.needsFirst', { project: projectName(p.needs) }));
      return;
    }
    const r = startProject(save.outpost, id);
    this.game.setSave({ ...save, outpost: r.outpost });
    this.game.audio.play('uiSelect');
    this.doc.say(docLine(r.invented ? 'doc.invented' : 'doc.started', { project: projectName(id) }));
    this.focus = Math.max(0, labList(r.outpost).indexOf(id));
  }

  render(ctx: CanvasRenderingContext2D): void {
    const o = this.game.save.outpost;
    const img = picture();
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    if (img) ctx.drawImage(img, 0, 0, 1280, 720);
    ctx.fillStyle = 'rgba(4,10,8,0.3)';
    if (!this.picture.on) ctx.fillRect(0, 0, 1280, 720);
    ctx.restore();
    const touch = this.game.input.device === 'touch';
    if (this.picture.on) return this.picture.draw(ctx, touch);
    text(ctx, t('lab.title'), 1256, 46, { size: 30, display: true, italic: true, align: 'right', color: COLORS.gold });
    const sub = o.buildings.lab > 0
      ? `${t('outpost.level', { n: o.buildings.lab })} · ${t('lab.perSortie', { n: researchPerDay(o) })}${o.research > 0 ? ` · ${t('lab.banked', { n: o.research })}` : ''}`
      : t('lab.noLab');
    text(ctx, sub, 1256, 70, { size: 14, align: 'right', color: o.buildings.lab > 0 ? COLORS.ink : COLORS.amber, maxWidth: 460 });
    const list = this.list;
    drawProjects(ctx, o, list, this.focus);
    const id = list[this.focus];
    if (id) drawProject(ctx, o, id, this.time);
    this.doc.render(ctx);
    hintLine(ctx, t('lab.keys'), 30, 1016);
    backButton(ctx, this.hoverBack);
    this.picture.draw(ctx, touch);
  }
}
