import { formatMoney } from '../core/math';
import type { Scene } from '../core/scene';
import { objectiveText } from '../data/missions';
import { THEATERS } from '../data/theaters';
import type { MissionDef, MissionResult, TakeoffRating } from '../data/types';
import { applyResult, type Payout } from '../game/economy';
import { campaignComplete } from '../game/progress';
import type { GameContext } from '../game/state';
import { COLORS, text } from '../render/text';
import { ButtonGroup, drawPanel } from '../ui/widgets';

const TAKEOFF_LABEL: Readonly<Record<TakeoffRating, string>> = {
  perfect: 'Perfect', good: 'Good', early: 'Early rotation', late: 'Late — close call', skipped: 'Skipped',
};

export class DebriefScene implements Scene {
  private t = 0;
  private readonly payout: Payout;
  private readonly stars: number;
  private readonly newBest: boolean;
  private readonly finale: boolean;
  private buttons: ButtonGroup;

  constructor(private readonly game: GameContext, private readonly mission: MissionDef, private readonly result: MissionResult) {
    const before = game.save.progress[mission.id]?.stars ?? 0;
    const applied = applyResult(game.save, mission, result);
    game.setSave(applied.save);
    this.payout = applied.payout;
    this.stars = applied.stars;
    this.newBest = result.success && applied.stars > before;
    this.finale = result.success && mission.number === 30 && campaignComplete(applied.save);
    this.buttons = new ButtonGroup([
      { id: 'map', label: 'CONTINUE', x: 400, y: 630, w: 200, h: 50, primary: true },
      { id: 'retry', label: 'FLY AGAIN', x: 620, y: 630, w: 160, h: 50 },
      { id: 'hangar', label: 'HANGAR', x: 800, y: 630, w: 160, h: 50 },
    ], 'horizontal');
  }

  enter(): void {
    this.game.audio.play(this.result.success ? 'cash' : 'uiBack');
  }

  update(dt: number): void {
    this.t += dt;
    const input = this.game.input;
    if (input.pressed('hangar')) return this.leave('hangar');
    if (input.pressed('back')) return this.leave('map');
    const id = this.buttons.update(input);
    if (input.pressed('left') || input.pressed('right')) this.game.audio.play('uiMove');
    if (id === 'map' || id === 'retry' || id === 'hangar') this.leave(id);
  }

  private leave(to: 'map' | 'retry' | 'hangar'): void {
    this.game.audio.play('uiSelect');
    if (to === 'retry') this.game.go({ to: 'takeoff', mission: this.mission });
    else if (to === 'hangar') this.game.go({ to: 'hangar' });
    else this.game.go({ to: 'map', select: this.result.success ? undefined : this.mission.id });
  }

  render(ctx: CanvasRenderingContext2D): void {
    const th = THEATERS[this.mission.theater];
    const bg = ctx.createLinearGradient(0, 0, 0, 720);
    bg.addColorStop(0, th.palette.seaDeep);
    bg.addColorStop(1, '#04070c');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 1280, 720);
    const r = this.result;
    const title = r.success ? 'MISSION COMPLETE' : r.aborted ? 'MISSION ABORTED' : 'MISSION FAILED';
    text(ctx, title, 640, 92, { size: 54, display: true, italic: true, align: 'center', color: r.success ? COLORS.gold : COLORS.red, stroke: '#000', strokeWidth: 6 });
    text(ctx, `MISSION ${this.mission.number} · ${this.mission.name.toUpperCase()}`, 640, 128, { size: 16, align: 'center', color: COLORS.dim, letterSpacing: 2 });
    this.renderStats(ctx);
    this.renderPayout(ctx);
    this.renderStars(ctx);
    if (this.finale) text(ctx, '🎖  CAMPAIGN COMPLETE — YOU ARE TOP GUN  🎖', 640, 600, { size: 22, display: true, align: 'center', color: COLORS.gold });
    this.buttons.render(ctx, this.t);
  }

  private renderStats(ctx: CanvasRenderingContext2D): void {
    const r = this.result;
    drawPanel(ctx, { x: 120, y: 170, w: 500, h: 300 });
    const rows: Array<[string, string, string]> = [
      ['Objective', objectiveText(this.mission.objective), r.objectiveDone ? COLORS.green : COLORS.red],
      ['Result', r.objectiveDone ? 'Accomplished' : 'Not accomplished', r.objectiveDone ? COLORS.green : COLORS.red],
      ['Kills', `${r.kills} of ${r.spawned} contacts`, COLORS.ink],
      ['Hull', `${Math.round(r.hullRatio * 100)}%`, r.hullRatio >= 0.7 ? COLORS.green : r.hullRatio > 0.3 ? COLORS.amber : COLORS.red],
      ['Carrier launch', TAKEOFF_LABEL[r.takeoff], r.takeoff === 'perfect' ? COLORS.gold : COLORS.ink],
    ];
    text(ctx, 'DEBRIEF', 144, 208, { size: 13, color: COLORS.dim, letterSpacing: 2 });
    rows.forEach(([k, v, c], i) => {
      text(ctx, k, 144, 252 + i * 44, { size: 15, color: COLORS.dim });
      text(ctx, v, 300, 252 + i * 44, { size: 15, color: c, maxWidth: 300 });
    });
  }

  private renderPayout(ctx: CanvasRenderingContext2D): void {
    const p = this.payout;
    drawPanel(ctx, { x: 660, y: 170, w: 500, h: 300 });
    text(ctx, 'PAYOUT', 684, 208, { size: 13, color: COLORS.dim, letterSpacing: 2 });
    const rows: Array<[string, number]> = this.result.success
      ? [['Mission reward', p.base], ['Launch bonus', p.takeoffBonus], ['Hull bonus', p.hullBonus], ['Cash collected', p.collected]]
      : [['Salvage (50% of cash)', p.salvage]];
    const reveal = Math.min(1, this.t / 1.2);
    rows.forEach(([k, v], i) => {
      text(ctx, k, 684, 252 + i * 40, { size: 15, color: COLORS.ink });
      text(ctx, formatMoney(v * reveal), 1136, 252 + i * 40, { size: 17, align: 'right', color: v > 0 ? COLORS.green : COLORS.faint });
    });
    ctx.fillStyle = COLORS.panelEdge;
    ctx.fillRect(684, 410, 452, 1.5);
    text(ctx, 'TOTAL', 684, 446, { size: 18, display: true });
    text(ctx, formatMoney(p.total * reveal), 1136, 448, { size: 28, display: true, align: 'right', color: COLORS.green });
    text(ctx, `Account: ${formatMoney(this.game.save.money)}`, 1136, 500, { size: 15, align: 'right', color: COLORS.dim });
  }

  private renderStars(ctx: CanvasRenderingContext2D): void {
    if (!this.result.success) return;
    for (let i = 0; i < 3; i++) {
      const appear = Math.min(1, Math.max(0, (this.t - 0.6 - i * 0.35) * 4));
      const earned = i < this.stars;
      const size = 54 * (earned ? 0.6 + appear * 0.4 : 1);
      text(ctx, '★', 560 + i * 80, 560, { size, align: 'center', color: earned && appear > 0 ? COLORS.gold : 'rgba(255,255,255,0.15)' });
    }
    if (this.newBest && this.t > 1.8) text(ctx, 'NEW BEST', 640, 590, { size: 14, display: true, align: 'center', color: COLORS.cyan, letterSpacing: 3 });
    text(ctx, '★ complete   ★ hull ≥ 70%   ★ 80% of contacts destroyed', 640, 506, { size: 12, align: 'center', color: COLORS.faint });
  }
}
