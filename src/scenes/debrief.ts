import { formatMoney } from '../core/math';
import type { Scene } from '../core/scene';
import { THEATERS } from '../data/theaters';
import { LIVERIES, type LiveryId } from '../data/liveries';
import type { MissionDef, MissionResult, TakeoffRating } from '../data/types';
import { debriefScript } from '../game/dialogue-scripts';
import { applyResult, type Payout } from '../game/economy';
import { newlyUnlocked } from '../game/liveries';
import { offerAfterMission } from '../game/minigames/core';
import { campaignComplete } from '../game/progress';
import type { GameContext } from '../game/state';
import { liveryName, missionName, objectiveText } from '../i18n/content';
import { t } from '../i18n/i18n';
import type { UiKey } from '../i18n/ui-en';
import { drawPlaneTop } from '../render/draw-planes';
import { COLORS, text } from '../render/text';
import { pilotContext, SpeechBox } from '../ui/speech';
import { playableIds } from './minigames/registry';
import { ButtonGroup, drawPanel } from '../ui/widgets';

const TAKEOFF_LABEL: Readonly<Record<TakeoffRating, UiKey>> = {
  perfect: 'debrief.launchPerfect', good: 'debrief.launchGood', early: 'debrief.launchEarly',
  late: 'debrief.launchLate', skipped: 'debrief.launchSkipped',
};

const STATS = { x: 310, y: 268, w: 455, h: 250 };
const PAY = { x: 785, y: 268, w: 455, h: 250 };
/** The pay counts up while the admiral delivers his first lines. */
const COUNT_UP = 3.2;

export class DebriefScene implements Scene {
  private time = 0;
  private readonly payout: Payout;
  private readonly stars: number;
  private readonly newBest: boolean;
  private readonly finale: boolean;
  private readonly buttons: ButtonGroup;
  private readonly admiral: SpeechBox;
  /** Paint jobs this mission unlocked (doc 09). */
  private readonly liveries: LiveryId[];
  /** Off-duty minigame offered on CONTINUE (doc 11). */
  private readonly offer: ReturnType<typeof offerAfterMission>;

  constructor(private readonly game: GameContext, private readonly mission: MissionDef, private readonly result: MissionResult) {
    const before = game.save.progress[mission.id]?.stars ?? 0;
    const applied = applyResult(game.save, mission, result);
    this.liveries = newlyUnlocked(game.save.progress, applied.save.progress);
    this.offer = result.success ? offerAfterMission({
      missionNumber: mission.number, before: game.save.progress, after: applied.save.progress,
      playable: playableIds(), enabled: game.settings.minigameOffers,
    }) : null;
    game.setSave(applied.save);
    this.payout = applied.payout;
    this.stars = applied.stars;
    this.newBest = result.success && applied.stars > before;
    this.finale = result.success && mission.number === 30 && campaignComplete(applied.save);
    this.buttons = new ButtonGroup([
      { id: 'map', label: t('debrief.continue'), x: 380, y: 648, w: 220, h: 50, primary: true },
      { id: 'retry', label: t('debrief.flyAgain'), x: 620, y: 648, w: 180, h: 50 },
      { id: 'hangar', label: t('debrief.hangar'), x: 820, y: 648, w: 180, h: 50 },
    ], 'horizontal');
    this.admiral = new SpeechBox(game.audio, {
      portrait: { x: 36, y: 136, w: 250, h: 300 },
      bubble: { x: 310, y: 140, w: 930, h: 112 },
      fontSize: 20, style: 'comic', persistent: true,
    }, 'admiral', pilotContext(game));
    this.admiral.say(debriefScript({
      mission, result, stars: applied.stars, totalText: formatMoney(applied.payout.total), campaignDone: this.finale,
      liveries: this.liveries.map((id) => ({ name: liveryName(id), rare: LIVERIES[id].unlock?.kind === 'stars' })),
    }));
  }

  enter(): void {
    this.game.audio.play(this.result.success ? 'cash' : 'uiBack');
  }

  update(dt: number): void {
    this.time += dt;
    const input = this.game.input;
    this.admiral.update(dt, input);
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
    else if (this.offer) this.game.go({ to: 'offer', id: this.offer.id, isNew: this.offer.isNew });
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
    const title = t(r.success ? 'debrief.complete' : r.aborted ? 'debrief.aborted' : 'debrief.failed');
    text(ctx, title, 640, 70, { size: 48, display: true, italic: true, align: 'center', color: r.success ? COLORS.gold : COLORS.red, stroke: '#000', strokeWidth: 6, maxWidth: 1200 });
    text(ctx, t('debrief.header', { n: this.mission.number, name: missionName(this.mission).toUpperCase() }), 640, 106, { size: 15, align: 'center', color: COLORS.dim, letterSpacing: 2 });
    this.admiral.render(ctx);
    this.renderStats(ctx);
    this.renderPayout(ctx);
    this.renderStars(ctx);
    this.renderPaint(ctx);
    if (this.finale) text(ctx, t('debrief.finale'), 640, 628, { size: 20, display: true, align: 'center', color: COLORS.gold, maxWidth: 1200 });
    this.buttons.render(ctx, this.time);
  }

  /** Gold banner with the new paint job(s), the selected jet shown wearing the first one. */
  private renderPaint(ctx: CanvasRenderingContext2D): void {
    const first = this.liveries[0];
    if (!first || this.time < COUNT_UP) return;
    const names = this.liveries.map((id) => liveryName(id)).join('  ·  ');
    const pulse = 0.85 + Math.sin(this.time * 4) * 0.15;
    drawPlaneTop(ctx, this.game.save.selectedPlane, 380, 600, 0.8, { t: this.time, throttle: 0.4, sweep: 0.3, livery: first });
    text(ctx, t('debrief.newPaint', { livery: names }), 420, 606, { size: 20, display: true, color: COLORS.gold, alpha: pulse, maxWidth: 800 });
  }

  private renderStats(ctx: CanvasRenderingContext2D): void {
    const r = this.result;
    drawPanel(ctx, STATS);
    const rows: Array<[UiKey, string, string]> = [
      ['debrief.objective', objectiveText(this.mission.objective), r.objectiveDone ? COLORS.green : COLORS.red],
      ['debrief.result', t(r.objectiveDone ? 'debrief.accomplished' : 'debrief.notAccomplished'), r.objectiveDone ? COLORS.green : COLORS.red],
      ['debrief.kills', t('debrief.killsValue', { kills: r.kills, spawned: r.spawned }), COLORS.ink],
      ['debrief.hull', `${Math.round(r.hullRatio * 100)}%`, r.hullRatio >= 0.7 ? COLORS.green : r.hullRatio > 0.3 ? COLORS.amber : COLORS.red],
      ['debrief.launch', t(TAKEOFF_LABEL[r.takeoff]), r.takeoff === 'perfect' ? COLORS.gold : COLORS.ink],
    ];
    text(ctx, t('debrief.debrief'), STATS.x + 22, STATS.y + 34, { size: 13, color: COLORS.dim, letterSpacing: 2 });
    rows.forEach(([k, v, c], i) => {
      text(ctx, t(k), STATS.x + 22, STATS.y + 74 + i * 36, { size: 14, color: COLORS.dim, maxWidth: 130 });
      text(ctx, v, STATS.x + 160, STATS.y + 74 + i * 36, { size: 14, color: c, maxWidth: STATS.w - 180 });
    });
  }

  private renderPayout(ctx: CanvasRenderingContext2D): void {
    const p = this.payout;
    drawPanel(ctx, PAY);
    const right = PAY.x + PAY.w - 22;
    text(ctx, t('debrief.payout'), PAY.x + 22, PAY.y + 34, { size: 13, color: COLORS.dim, letterSpacing: 2 });
    const rows: Array<[UiKey, number]> = this.result.success
      ? [['debrief.reward', p.base], ['debrief.launchBonus', p.takeoffBonus], ['debrief.hullBonus', p.hullBonus], ['debrief.collected', p.collected]]
      : [['debrief.salvage', p.salvage]];
    const reveal = Math.min(1, this.time / COUNT_UP);
    rows.forEach(([k, v], i) => {
      text(ctx, t(k), PAY.x + 22, PAY.y + 74 + i * 34, { size: 14, color: COLORS.ink, maxWidth: 240 });
      text(ctx, formatMoney(v * reveal), right, PAY.y + 74 + i * 34, { size: 16, align: 'right', color: v > 0 ? COLORS.green : COLORS.faint });
    });
    ctx.fillStyle = COLORS.panelEdge;
    ctx.fillRect(PAY.x + 22, PAY.y + 200, PAY.w - 44, 1.5);
    text(ctx, t('debrief.total'), PAY.x + 22, PAY.y + 234, { size: 18, display: true });
    text(ctx, formatMoney(p.total * reveal), right, PAY.y + 236, { size: 28, display: true, align: 'right', color: COLORS.green });
    text(ctx, t('debrief.account', { money: formatMoney(this.game.save.money) }), right, PAY.y + PAY.h + 26, { size: 14, align: 'right', color: COLORS.dim });
  }

  private renderStars(ctx: CanvasRenderingContext2D): void {
    if (!this.result.success) return;
    const cx = 161;
    for (let i = 0; i < 3; i++) {
      const appear = Math.min(1, Math.max(0, (this.time - COUNT_UP - i * 0.35) * 4));
      const earned = i < this.stars;
      const size = 46 * (earned ? 0.6 + appear * 0.4 : 1);
      text(ctx, '★', cx + (i - 1) * 64, 500, { size, align: 'center', color: earned && appear > 0 ? COLORS.gold : 'rgba(255,255,255,0.15)' });
    }
    if (this.newBest && this.time > COUNT_UP + 1) text(ctx, t('debrief.newBest'), cx, 530, { size: 13, display: true, align: 'center', color: COLORS.cyan, letterSpacing: 3 });
    text(ctx, t('debrief.starRules'), 640, 560, { size: 12, align: 'center', color: COLORS.faint, maxWidth: 1180 });
  }
}
