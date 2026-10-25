import { formatMoney } from '../core/math';
import type { Scene } from '../core/scene';
import { missionById, MISSIONS } from '../data/missions';
import { PLANES } from '../data/planes';
import { THEATERS } from '../data/theaters';
import { enemyName, missionBriefing, missionName, objectiveText, theaterName } from '../i18n/content';
import { t } from '../i18n/i18n';
import type { MissionDef } from '../data/types';
import { SECONDARIES } from '../data/weapons';
import { campaignComplete, isCleared, isUnlocked, nextMission, totalStars } from '../game/progress';
import type { GameContext } from '../game/state';
import { COLORS, paragraph, text } from '../render/text';
import { drawAvatar } from '../render/avatars';
import { drawButton, drawPanel, hit, type Button } from '../ui/widgets';
import { drawMapBase, drawNode, drawRoute } from './map-render';

const PANEL = { x: 882, y: 76, w: 378, h: 628 };

export class MapScene implements Scene {
  private t = 0;
  private selected: MissionDef;
  private buttons: Button[] = [];

  constructor(private readonly game: GameContext, select?: string) {
    this.selected = (select ? missionById(select) : undefined) ?? nextMission(game.save);
  }

  enter(): void {
    this.game.music.play('menu');
  }

  private layoutButtons(): void {
    const open = isUnlocked(this.game.save, this.selected);
    const y = PANEL.y + PANEL.h - 64;
    this.buttons = [
      { id: 'launch', label: t('map.launch'), x: PANEL.x + 16, y, w: 170, h: 48, primary: true, enabled: open, hint: 'ENTER' },
      { id: 'hangar', label: t('map.hangar'), x: PANEL.x + 196, y, w: 166, h: 48, hint: 'H' },
    ];
  }

  update(dt: number): void {
    this.t += dt;
    const input = this.game.input;
    this.layoutButtons();
    if (input.pressed('left') || input.pressed('up')) this.step(-1);
    if (input.pressed('right') || input.pressed('down')) this.step(1);
    for (const tap of input.taps) {
      const b = this.buttons.find((x) => x.enabled !== false && hit(tap, x));
      if (b) return this.activate(b.id);
      if (hit(tap, { x: 1150, y: 14, w: 110, h: 44 })) return this.activate('title');
      const node = MISSIONS.find((m) => Math.hypot(tap.x - m.map.x, tap.y - m.map.y) < 22);
      if (node) this.select(node);
    }
    if (input.pressed('confirm')) this.activate('launch');
    if (input.pressed('hangar')) this.activate('hangar');
    if (input.pressed('back')) this.activate('title');
  }

  private step(d: number): void {
    const idx = this.selected.number - 1 + d;
    const m = MISSIONS[idx];
    if (m && isUnlocked(this.game.save, m)) this.select(m);
  }

  private select(m: MissionDef): void {
    if (m.id === this.selected.id) return;
    this.selected = m;
    this.game.audio.play('uiMove');
  }

  private activate(id: string): void {
    if (id === 'launch') {
      if (!isUnlocked(this.game.save, this.selected)) {
        this.game.audio.play('denied');
        return;
      }
      this.game.audio.play('uiSelect');
      this.game.go({ to: 'takeoff', mission: this.selected });
    } else if (id === 'hangar') {
      this.game.audio.play('uiSelect');
      this.game.go({ to: 'hangar' });
    } else if (id === 'title') {
      this.game.audio.play('uiBack');
      this.game.go({ to: 'title' });
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#071019';
    ctx.fillRect(0, 0, 1280, 720);
    drawMapBase(ctx);
    drawRoute(ctx, this.game.save, this.t);
    for (const m of MISSIONS) drawNode(ctx, m, this.game.save, m.id === this.selected.id, this.t);
    this.renderTopBar(ctx);
    this.renderBriefing(ctx);
  }

  private renderTopBar(ctx: CanvasRenderingContext2D): void {
    const s = this.game.save;
    text(ctx, t('map.title'), 24, 46, { size: 26, display: true, italic: true, color: COLORS.ink, maxWidth: 430 });
    const done = MISSIONS.filter((m) => isCleared(s, m)).length;
    text(ctx, t('map.progress', { done, stars: totalStars(s) }), 470, 44, { size: 15, color: COLORS.dim });
    const pilot = this.game.profile;
    if (pilot) {
      drawAvatar(ctx, pilot.avatar, { x: 882, y: 8, w: 50, h: 60 }, { t: this.t, mood: 'happy' });
      text(ctx, pilot.callsign, 942, 32, { size: 17, display: true, italic: true, color: COLORS.gold, maxWidth: 196 });
    }
    text(ctx, formatMoney(s.money), 942, 60, { size: 20, display: true, color: COLORS.green });
    drawButton(ctx, { id: 'title', label: t('map.menu'), x: 1150, y: 14, w: 110, h: 44 }, false, this.t);
    if (campaignComplete(s)) text(ctx, t('map.campaignComplete'), 690, 44, { size: 15, color: COLORS.gold });
  }

  private renderBriefing(ctx: CanvasRenderingContext2D): void {
    const m = this.selected;
    const s = this.game.save;
    const th = THEATERS[m.theater];
    const x = PANEL.x + 20;
    drawPanel(ctx, PANEL);
    text(ctx, t('map.missionHeader', { n: String(m.number).padStart(2, '0'), theater: theaterName(m.theater).toUpperCase() }), x, PANEL.y + 32, { size: 12, color: th.palette.accent, letterSpacing: 1.5 });
    text(ctx, missionName(m).toUpperCase(), x, PANEL.y + 66, { size: 26, display: true, italic: true, maxWidth: PANEL.w - 40 });
    text(ctx, objectiveText(m.objective), x, PANEL.y + 96, { size: 15, color: COLORS.gold, maxWidth: PANEL.w - 40 });
    const threat = Math.ceil(m.difficulty / 6);
    text(ctx, t('map.threat'), x, PANEL.y + 128, { size: 11, color: COLORS.dim, letterSpacing: 1.5 });
    text(ctx, '▲'.repeat(threat) + '△'.repeat(5 - threat), x + 70, PANEL.y + 129, { size: 14, color: COLORS.red });
    const cleared = isCleared(s, m);
    text(ctx, t('map.reward'), x + 180, PANEL.y + 128, { size: 11, color: COLORS.dim, letterSpacing: 1.5 });
    text(ctx, formatMoney(cleared ? m.reward * 0.5 : m.reward) + (cleared ? `  ${t('map.replay')}` : ''), x + 244, PANEL.y + 129, { size: 14, color: COLORS.green });
    const h = paragraph(ctx, missionBriefing(m), x, PANEL.y + 164, PANEL.w - 40, { size: 15, color: COLORS.ink });
    let y = PANEL.y + 182 + h;
    text(ctx, t('map.contacts'), x, y, { size: 11, color: COLORS.dim, letterSpacing: 1.5 });
    paragraph(ctx, m.pool.map((k) => enemyName(k)).join('  ·  '), x, y + 22, PANEL.w - 40, { size: 13, color: COLORS.cyan });
    y += 76;
    this.renderLoadout(ctx, x, y);
    if (!isUnlocked(s, m)) text(ctx, t('map.locked'), x, PANEL.y + PANEL.h - 82, { size: 13, color: COLORS.red });
    else if (cleared) text(ctx, `${t('map.best')}  ${'★'.repeat(s.progress[m.id]?.stars ?? 0)}`, x, PANEL.y + PANEL.h - 82, { size: 14, color: COLORS.gold });
    for (const b of this.buttons) drawButton(ctx, b, b.id === 'launch' && b.enabled !== false, this.t);
  }

  private renderLoadout(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    const s = this.game.save;
    const weapons = s.loadout[s.selectedPlane].map((id) => (id ? SECONDARIES[id].short : '—')).join(' / ');
    text(ctx, t('map.yourJet'), x, y, { size: 11, color: COLORS.dim, letterSpacing: 1.5 });
    text(ctx, t('map.gunLevel', { plane: PLANES[s.selectedPlane].name, level: s.gunLevel }), x, y + 22, { size: 15, color: COLORS.ink, maxWidth: PANEL.w - 40 });
    text(ctx, weapons, x, y + 44, { size: 13, color: COLORS.dim, maxWidth: PANEL.w - 40 });
  }
}
