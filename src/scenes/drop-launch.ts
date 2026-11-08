import type { Scene } from '../core/scene';
import type { MissionDef } from '../data/types';
import { crewLook } from '../game/crew-looks';
import { DROP_CALL, shooterLine, type ShooterEvent } from '../game/dialogue-scripts';
import { createDrop, DROP, stepDrop, type DropGrade, type DropInput, type DropState } from '../game/drop-launch';
import type { GameContext } from '../game/state';
import { missionName } from '../i18n/content';
import { t } from '../i18n/i18n';
import type { UiKey } from '../i18n/ui-en';
import { drawPlaneSide } from '../render/draw-planes-side';
import { DROP_PX, drawDropFx, drawDropWorld, mechY } from '../render/drop';
import { COLORS, text } from '../render/text';
import { pilotContext, SpeechBox } from '../ui/speech';
import { drawButton, drawPanel, hit } from '../ui/widgets';
import { ACTION_BTN, SKIP_BTN } from './takeoff-hud';

// The mech's drop (doc 84): the dropship opens its bay over the jungle, the mech falls, and the pilot holds the retros to
// land softly on the pad; then the mission starts with the rating. Shooter, the drop controller in her jungle kit, calls
// it (doc 86).

const GRADE: Readonly<Record<DropGrade, UiKey>> = { perfect: 'drop.perfect', good: 'drop.good', early: 'drop.early', late: 'drop.late' };
const GAUGE = { x: 36, y: 150, w: 34, h: 420 };
/** Where firing the retros lands softly (altitudes, doc 84). */
const ZONE = { good: [21, 34], perfect: [24, 31] } as const;

export class DropLaunchScene implements Scene {
  private s: DropState = createDrop();
  private t = 0;
  private shake = 0;
  private leaving = false;
  private readonly shooter: SpeechBox;

  constructor(private readonly game: GameContext, private readonly mission: MissionDef) {
    this.shooter = new SpeechBox(game.audio, {
      portrait: { x: 130, y: 552, w: 112, h: 136 },
      bubble: { x: 256, y: 566, w: 470, h: 104 },
      fontSize: 17, style: 'comic', persistent: true,
    }, 'shooter', pilotContext(game));
    this.shooter.look = crewLook(mission.campaign);
    this.call('bayOpen');
  }

  private call(ev: ShooterEvent): void {
    this.shooter.say(shooterLine(ev), true);
  }

  enter(): void {
    this.game.music.stop();
    this.game.audio.play('catapult');
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
    this.shooter.update(dt, this.game.input);
    const before = this.s;
    this.s = stepDrop(this.s, this.readInput(), dt);
    if (before.phase === 'bay' && this.s.phase === 'fall') this.call('drop');
    if (this.s.burning && Math.random() < dt * 8) this.game.audio.play('rocket', { volume: 0.3 });
    if (before.phase === 'fall' && this.s.phase === 'landed') this.landed();
    if (this.s.phase === 'done' && !this.leaving) {
      this.leaving = true;
      this.game.go({ to: 'mission', mission: this.mission, takeoff: this.s.rating ?? 'skipped' });
    }
  }

  private readInput(): DropInput {
    const input = this.game.input;
    const onSkip = (p: { x: number; y: number }): boolean => hit(p, SKIP_BTN);
    const touching = input.pointer.down && input.device === 'touch' && !onSkip(input.pointer);
    return { burn: input.held('fire') || input.held('up') || touching, skip: input.pressed('skip') || input.taps.some(onSkip) };
  }

  private landed(): void {
    const a = this.game.audio;
    this.shake = Math.min(1, this.s.impact / 10);
    a.play(this.s.impact > DROP.good ? 'explosionLarge' : 'playerHit', { volume: 0.6 });
    a.play(this.s.grade === 'perfect' ? 'cash' : this.s.grade === 'good' ? 'uiSelect' : 'denied');
    if (this.s.grade) this.call(DROP_CALL[this.s.grade]);
  }

  private drawGauge(ctx: CanvasRenderingContext2D): void {
    const y = (m: number): number => GAUGE.y + GAUGE.h - (m / DROP.start) * GAUGE.h;
    drawPanel(ctx, { x: GAUGE.x - 8, y: GAUGE.y - 34, w: GAUGE.w + 16, h: GAUGE.h + 80 }, { fill: 'rgba(6,14,10,0.7)', radius: 6 });
    text(ctx, t('drop.alt'), GAUGE.x + GAUGE.w / 2, GAUGE.y - 14, { size: 12, align: 'center', color: COLORS.dim, letterSpacing: 1.5 });
    ctx.fillStyle = 'rgba(255,210,90,0.4)';
    ctx.fillRect(GAUGE.x, y(ZONE.good[1]), GAUGE.w, y(ZONE.good[0]) - y(ZONE.good[1]));
    ctx.fillStyle = 'rgba(90,230,120,0.75)';
    ctx.fillRect(GAUGE.x, y(ZONE.perfect[1]), GAUGE.w, y(ZONE.perfect[0]) - y(ZONE.perfect[1]));
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(GAUGE.x - 6, y(this.s.alt) - 2, GAUGE.w + 12, 4);
    ctx.fillStyle = '#ffb84a';
    ctx.fillRect(GAUGE.x, GAUGE.y + GAUGE.h + 14, GAUGE.w * (this.s.fuel / DROP.fuel), 8);
    text(ctx, t('drop.fuel'), GAUGE.x + GAUGE.w / 2, GAUGE.y + GAUGE.h + 40, { size: 11, align: 'center', color: COLORS.dim });
  }

  private drawHud(ctx: CanvasRenderingContext2D): void {
    text(ctx, t('takeoff.title', { n: this.mission.number, name: missionName(this.mission).toUpperCase() }), 24, 40, { size: 20, display: true, italic: true, shadow: true });
    text(ctx, t('drop.subtitle'), 24, 64, { size: 13, color: COLORS.ink, letterSpacing: 2, shadow: true });
    this.drawGauge(ctx);
    const s = this.s;
    if (s.phase === 'bay') text(ctx, t('drop.bay'), 640, 200, { size: 26, display: true, align: 'center', color: COLORS.gold, shadow: true });
    else if (s.phase === 'fall') {
      const key = this.game.input.device === 'touch' ? 'drop.touch' : 'drop.keys';
      text(ctx, t(key), 640, 200, { size: 16, align: 'center', color: COLORS.ink, shadow: true, maxWidth: 1000 });
    } else if (s.grade) {
      const good = s.grade === 'perfect' || s.grade === 'good';
      text(ctx, t(GRADE[s.grade]), 640, 200, { size: 34, display: true, align: 'center', color: good ? COLORS.gold : COLORS.red, shadow: true });
      text(ctx, t('drop.impact', { n: s.impact.toFixed(1) }), 640, 236, { size: 18, align: 'center', color: COLORS.ink, shadow: true });
    }
    if (s.phase === 'bay' || s.phase === 'fall') {
      drawButton(ctx, { id: 'skip', label: t('takeoff.skip'), ...SKIP_BTN, hint: 'S' }, false, this.t);
      if (this.game.input.device === 'touch') drawButton(ctx, { id: 'retro', label: t('drop.button'), ...ACTION_BTN }, false, this.t);
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    const s = this.s;
    const v = { alt: s.alt, t: this.t, bayOpen: s.phase === 'bay' ? Math.min(1, s.t / DROP.bay) : 1, burning: s.burning, landedT: s.phase === 'landed' ? s.t : null };
    const save = this.game.save;
    const plane = save.mech.selectedPlane;
    ctx.save();
    if (this.shake > 0) ctx.translate((Math.random() - 0.5) * 14 * this.shake, (Math.random() - 0.5) * 14 * this.shake);
    drawDropWorld(ctx, v);
    const y = s.phase === 'bay' ? mechY(s.alt) - (1 - v.bayOpen) * 4 * DROP_PX : mechY(s.alt);
    drawPlaneSide(ctx, plane, 640, y, 1.6, { t: this.t, paint: save.mechPaint[plane as keyof typeof save.mechPaint] ?? null });
    drawDropFx(ctx, v);
    ctx.restore();
    this.drawHud(ctx);
    this.shooter.render(ctx);
  }
}
