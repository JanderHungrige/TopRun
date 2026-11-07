import type { Scene } from '../core/scene';
import type { MissionDef } from '../data/types';
import { createDive, DIVE, stepDive, type DiveGrade, type DiveInput, type DiveState } from '../game/dive-launch';
import type { GameContext } from '../game/state';
import { missionName } from '../i18n/content';
import { t } from '../i18n/i18n';
import type { UiKey } from '../i18n/ui-en';
import { drawPlaneSide } from '../render/draw-planes-side';
import { ballastBubbles, drawDiveWorld, PX, SURFACE_Y, toScreen } from '../render/dive';
import { COLORS, text } from '../render/text';
import { drawButton, drawPanel, hit } from '../ui/widgets';
import { ACTION_BTN, SKIP_BTN } from './takeoff-hud';

// The sub's dive launch (doc 71): the well deck floods, the sub moves out, and the pilot floods or blows ballast to pass
// the gap between the anti-sub net and the reef; then the mission starts with the rating.

const GRADE: Readonly<Record<DiveGrade, UiKey>> = { perfect: 'dive.perfect', good: 'dive.good', early: 'dive.early', late: 'dive.late' };
const GAUGE = { x: 36, y: SURFACE_Y, w: 34, metres: 30 };
const SUB_X = 22;

export class DiveLaunchScene implements Scene {
  private s: DiveState = createDive();
  private t = 0;
  private shake = 0;
  private leaving = false;

  constructor(private readonly game: GameContext, private readonly mission: MissionDef) {}

  enter(): void {
    this.game.music.stop();
    this.game.audio.play('splash');
  }

  update(dt: number): void {
    this.t += dt;
    this.shake = Math.max(0, this.shake - dt * 3);
    if (this.game.input.pressed('back') && !this.leaving) {
      this.leaving = true;
      this.game.audio.play('uiBack');
      this.game.go({ to: 'map', select: this.mission.id });
      return;
    }
    const before = this.s;
    this.s = stepDive(this.s, this.readInput(), dt);
    if (before.phase === 'flood' && this.s.phase === 'dive') this.game.audio.play('uiMove');
    if (before.phase === 'dive' && this.s.phase === 'clear') this.graded();
    if (this.s.phase === 'done' && !this.leaving) {
      this.leaving = true;
      this.game.go({ to: 'mission', mission: this.mission, takeoff: this.s.rating ?? 'skipped' });
    }
  }

  private readInput(): DiveInput {
    const input = this.game.input;
    const onSkip = (p: { x: number; y: number }): boolean => hit(p, SKIP_BTN);
    const touching = input.pointer.down && input.device === 'touch' && !onSkip(input.pointer);
    return {
      flood: input.held('fire') || input.held('down') || touching,
      skip: input.pressed('skip') || input.taps.some(onSkip),
    };
  }

  private graded(): void {
    const a = this.game.audio;
    if (this.s.scraped) {
      a.play('playerHit');
      this.shake = 1;
    }
    a.play(this.s.grade === 'perfect' ? 'cash' : this.s.grade === 'good' ? 'uiSelect' : 'denied');
  }

  private get camX(): number {
    return Math.max(-12, this.s.x - SUB_X);
  }

  private drawSub(ctx: CanvasRenderingContext2D): void {
    const save = this.game.save;
    const plane = save.sub.selectedPlane;
    const [x, y] = toScreen(this.s.x, this.s.depth, this.camX);
    const pitch = -Math.atan2(this.s.vz, DIVE.speed) * (this.s.phase === 'flood' ? 0 : 1);
    if (this.s.phase !== 'flood' && this.s.vz > 0.5) ballastBubbles(ctx, x, y - 10, this.t, Math.min(1, this.s.vz / 3));
    drawPlaneSide(ctx, plane, x, y + 8, 0.9, { pitch, t: this.t, livery: save.livery[plane] });
  }

  private drawGauge(ctx: CanvasRenderingContext2D): void {
    const y = (m: number): number => GAUGE.y + m * PX;
    drawPanel(ctx, { x: GAUGE.x - 8, y: GAUGE.y - 34, w: GAUGE.w + 16, h: GAUGE.metres * PX + 44 }, { fill: 'rgba(6,14,24,0.7)', radius: 6 });
    text(ctx, t('dive.depth'), GAUGE.x + GAUGE.w / 2, GAUGE.y - 14, { size: 12, align: 'center', color: COLORS.dim, letterSpacing: 1.5 });
    ctx.fillStyle = 'rgba(255,90,70,0.35)';
    ctx.fillRect(GAUGE.x, y(0), GAUGE.w, y(DIVE.netBottom) - y(0));
    ctx.fillRect(GAUGE.x, y(DIVE.reef), GAUGE.w, y(GAUGE.metres) - y(DIVE.reef));
    ctx.fillStyle = 'rgba(255,210,90,0.35)';
    ctx.fillRect(GAUGE.x, y(DIVE.netBottom), GAUGE.w, y(DIVE.reef) - y(DIVE.netBottom));
    ctx.fillStyle = 'rgba(90,230,120,0.7)';
    ctx.fillRect(GAUGE.x, y(15 - 6 * DIVE.perfect), GAUGE.w, y(15 + 6 * DIVE.perfect) - y(15 - 6 * DIVE.perfect));
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(GAUGE.x - 6, y(this.s.depth) - 2, GAUGE.w + 12, 4);
  }

  private drawHud(ctx: CanvasRenderingContext2D): void {
    text(ctx, t('takeoff.title', { n: this.mission.number, name: missionName(this.mission).toUpperCase() }), 24, 40, { size: 20, display: true, italic: true, shadow: true });
    text(ctx, t('dive.subtitle'), 24, 64, { size: 13, color: COLORS.ink, letterSpacing: 2, shadow: true });
    this.drawGauge(ctx);
    const s = this.s;
    if (s.phase === 'flood') text(ctx, t('dive.flooding'), 640, 120, { size: 26, display: true, align: 'center', color: COLORS.gold, shadow: true });
    else if (s.phase === 'dive') {
      const key = this.game.input.device === 'touch' ? 'dive.touch' : 'dive.keys';
      text(ctx, t(key), 640, 120, { size: 16, align: 'center', color: COLORS.ink, shadow: true, maxWidth: 1000 });
    } else if (s.grade) {
      text(ctx, t(GRADE[s.grade]), 640, 120, { size: 34, display: true, align: 'center', color: s.grade === 'perfect' || s.grade === 'good' ? COLORS.gold : COLORS.red, shadow: true });
      if (s.scraped) text(ctx, t(s.grade === 'early' ? 'dive.snag' : 'dive.scrape'), 640, 156, { size: 18, align: 'center', color: COLORS.ink, shadow: true });
    }
    if (s.phase === 'flood' || s.phase === 'dive') {
      drawButton(ctx, { id: 'skip', label: t('takeoff.skip'), ...SKIP_BTN, hint: 'S' }, false, this.t);
      if (this.game.input.device === 'touch') drawButton(ctx, { id: 'dive', label: t('dive.button'), ...ACTION_BTN }, false, this.t);
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    if (this.shake > 0) ctx.translate((Math.random() - 0.5) * 10 * this.shake, (Math.random() - 0.5) * 10 * this.shake);
    drawDiveWorld(ctx, this.camX, this.t);
    this.drawSub(ctx);
    ctx.restore();
    this.drawHud(ctx);
  }
}
