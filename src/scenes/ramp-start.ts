import type { Scene } from '../core/scene';
import type { MissionDef } from '../data/types';
import { crewLook } from '../game/crew-looks';
import { shooterLine, type ShooterEvent } from '../game/dialogue-scripts';
import { createRamp, RAMP, stepRamp, type RampGrade, type RampInput, type RampState } from '../game/ramp-start';
import type { GameContext } from '../game/state';
import { missionName } from '../i18n/content';
import { t } from '../i18n/i18n';
import type { UiKey } from '../i18n/ui-en';
import { drawPlaneSide } from '../render/draw-planes-side';
import { drawRampDust, drawRampWorld, vehicleAt, type RampView } from '../render/ramp';
import { COLORS, text } from '../render/text';
import { pilotContext, SpeechBox } from '../ui/speech';
import { drawButton, drawPanel, hit } from '../ui/widgets';
import { ACTION_BTN, SKIP_BTN } from './takeoff-hud';

// The ramp start (doc 109): the lander's ramp comes down on the steppe, the lights count down, and the pilot holds the
// revs in the green band to roll off on green; then the mission starts with the rating. Shooter, the launch controller
// in her steppe kit (doc 111), calls it.

const GRADE: Readonly<Record<RampGrade, UiKey>> = { perfect: 'ramp.perfect', good: 'ramp.good', early: 'ramp.early', late: 'ramp.late' };
const CALL: Readonly<Record<RampGrade, ShooterEvent>> = { perfect: 'rampPerfect', good: 'rampGood', early: 'rampEarly', late: 'rampLate' };
const GAUGE = { x: 36, y: 150, w: 34, h: 380 };
/** Roll-off speed (px / s) by grade: a perfect start shoots off, a late one crawls. */
const SPEED: Readonly<Record<RampGrade, number>> = { perfect: 520, good: 420, early: 300, late: 180 };
const BAY_X = 470;

export class RampStartScene implements Scene {
  private s: RampState = createRamp();
  private t = 0;
  private x = BAY_X;
  private leaving = false;
  private readonly shooter: SpeechBox;

  constructor(private readonly game: GameContext, private readonly mission: MissionDef) {
    this.shooter = new SpeechBox(game.audio, {
      portrait: { x: 130, y: 552, w: 112, h: 136 },
      bubble: { x: 256, y: 566, w: 470, h: 104 },
      fontSize: 17, style: 'comic', persistent: true,
    }, 'shooter', pilotContext(game));
    this.shooter.look = crewLook(mission.campaign);
    this.call('rampOpen');
  }

  private call(ev: ShooterEvent): void {
    this.shooter.say(shooterLine(ev), true);
  }

  enter(): void {
    this.game.music.stop();
    this.game.audio.play('catapult', { volume: 0.5 });
  }

  update(dt: number): void {
    this.t += dt;
    if (this.game.input.pressed('back') && !this.leaving) {
      this.leaving = true;
      this.game.audio.play('uiBack');
      this.game.go({ to: 'map', select: this.mission.id });
      return;
    }
    this.shooter.update(dt, this.game.input);
    const before = this.s;
    this.s = stepRamp(this.s, this.readInput(), dt);
    if (before.phase === 'ramp' && this.s.phase === 'lights') this.call('rampLights');
    if (before.phase === 'lights' && this.s.phase === 'go') this.go();
    if (this.s.phase === 'lights' && Math.random() < dt * this.s.revs * 10) this.game.audio.play('rocket', { volume: 0.15 + this.s.revs * 0.2 });
    if (this.s.phase === 'go' && this.s.grade) this.x += SPEED[this.s.grade] * Math.min(1, this.s.t * 1.5) * dt;
    if (this.s.phase === 'done' && !this.leaving) {
      this.leaving = true;
      this.game.go({ to: 'mission', mission: this.mission, takeoff: this.s.rating ?? 'skipped' });
    }
  }

  private readInput(): RampInput {
    const input = this.game.input;
    const onSkip = (p: { x: number; y: number }): boolean => hit(p, SKIP_BTN);
    const touching = input.pointer.down && input.device === 'touch' && !onSkip(input.pointer);
    return { throttle: input.held('fire') || input.held('up') || touching, skip: input.pressed('skip') || input.taps.some(onSkip) };
  }

  private go(): void {
    const a = this.game.audio;
    const g = this.s.grade;
    a.play(g === 'perfect' ? 'cash' : g === 'good' ? 'uiSelect' : 'denied');
    a.play('catapult');
    if (g) this.call(CALL[g]);
  }

  private drawGauge(ctx: CanvasRenderingContext2D): void {
    const y = (r: number): number => GAUGE.y + GAUGE.h - r * GAUGE.h;
    drawPanel(ctx, { x: GAUGE.x - 8, y: GAUGE.y - 34, w: GAUGE.w + 16, h: GAUGE.h + 50 }, { fill: 'rgba(14,12,6,0.7)', radius: 6 });
    text(ctx, t('ramp.revs'), GAUGE.x + GAUGE.w / 2, GAUGE.y - 14, { size: 11, align: 'center', color: COLORS.dim, letterSpacing: 1 });
    const [g0, g1] = RAMP.good;
    const [p0, p1] = RAMP.perfect;
    ctx.fillStyle = 'rgba(255,210,90,0.4)';
    ctx.fillRect(GAUGE.x, y(g1 ?? 0.95), GAUGE.w, y(g0 ?? 0.55) - y(g1 ?? 0.95));
    ctx.fillStyle = 'rgba(90,230,120,0.75)';
    ctx.fillRect(GAUGE.x, y(p1 ?? 0.85), GAUGE.w, y(p0 ?? 0.7) - y(p1 ?? 0.85));
    ctx.fillStyle = 'rgba(255,80,60,0.45)';
    ctx.fillRect(GAUGE.x, y(1), GAUGE.w, y(g1 ?? 0.95) - y(1));
    const shake = this.s.revs > 0.9 ? (Math.random() - 0.5) * 6 : 0;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(GAUGE.x - 6, y(this.s.revs) - 2 + shake, GAUGE.w + 12, 4);
  }

  private drawHud(ctx: CanvasRenderingContext2D): void {
    text(ctx, t('takeoff.title', { n: this.mission.number, name: missionName(this.mission).toUpperCase() }), 24, 40, { size: 20, display: true, italic: true, shadow: true });
    text(ctx, t('ramp.subtitle'), 24, 64, { size: 13, color: COLORS.ink, letterSpacing: 2, shadow: true });
    this.drawGauge(ctx);
    const s = this.s;
    if (s.phase === 'ramp') text(ctx, t('ramp.ramp'), 640, 200, { size: 26, display: true, align: 'center', color: COLORS.gold, shadow: true });
    else if (s.phase === 'lights') {
      text(ctx, t(this.game.input.device === 'touch' ? 'ramp.touch' : 'ramp.keys'), 640, 200, { size: 16, align: 'center', color: COLORS.ink, shadow: true, maxWidth: 1000 });
    } else if (s.grade) {
      const good = s.grade === 'perfect' || s.grade === 'good';
      text(ctx, t(GRADE[s.grade]), 640, 200, { size: 34, display: true, align: 'center', color: good ? COLORS.gold : COLORS.red, shadow: true });
      text(ctx, t('ramp.atGreen', { n: Math.round(s.revs * 100) }), 640, 236, { size: 18, align: 'center', color: COLORS.ink, shadow: true });
    }
    if (s.phase === 'ramp' || s.phase === 'lights') {
      drawButton(ctx, { id: 'skip', label: t('takeoff.skip'), ...SKIP_BTN, hint: 'S' }, false, this.t);
      if (this.game.input.device === 'touch') drawButton(ctx, { id: 'gas', label: t('ramp.button'), ...ACTION_BTN }, false, this.t);
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    const s = this.s;
    const camX = Math.max(0, this.x - 760);
    const v: RampView = { t: this.t, phase: s.phase, phaseT: s.t, camX, vehicleX: this.x, spin: s.grade === 'early' };
    drawRampWorld(ctx, v);
    const at = vehicleAt(this.x);
    const save = this.game.save;
    const plane = save.tank.selectedPlane;
    const idle = s.phase === 'lights' ? Math.sin(this.t * 40) * s.revs * 1.5 : 0;
    drawPlaneSide(ctx, plane, at.x - camX, at.y + idle, 2.8, { t: s.phase === 'go' ? this.t * 2 : 0, pitch: at.pitch, livery: save.livery[plane] });
    drawRampDust(ctx, v);
    this.drawHud(ctx);
    this.shooter.render(ctx);
  }
}
