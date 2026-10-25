import { lerp } from '../core/math';
import type { Scene } from '../core/scene';
import { THEATERS } from '../data/theaters';
import type { MissionDef } from '../data/types';
import { shooterLine, type ShooterEvent } from '../game/dialogue-scripts';
import type { GameContext } from '../game/state';
import { createTakeoff, inGreen, stepTakeoff, type TakeoffPhase, type TakeoffState } from '../game/takeoff-logic';
import { missionName } from '../i18n/content';
import { t } from '../i18n/i18n';
import { DECK_Y, drawCarrier, drawSea, drawSky } from '../render/draw-carrier';
import { drawPlaneSide, SIDE_TAIL_X } from '../render/draw-planes-side';
import { Particles } from '../render/particles';
import { COLORS, text } from '../render/text';
import { pilotContext, SpeechBox } from '../ui/speech';
import { drawButton, hit } from '../ui/widgets';
import { ACTION_BTN, drawActionButton, drawPrompt, drawThrottle, SKIP_BTN } from './takeoff-hud';

const PLANE_SCALE = 1.25;
const PLANE_SCREEN_X = 520;

/** Carrier launch (doc 04): Space spools, E locks in the green, 3 s countdown, E launches. */
export class TakeoffScene implements Scene {
  private s: TakeoffState = createTakeoff();
  private particles = new Particles();
  private t = 0;
  private planeX = 0;
  private camX = -PLANE_SCREEN_X;
  private shake = 0;
  private doneTimer = 0;
  private leaving = false;
  private lastCount = 0;
  private readonly said = new Set<ShooterEvent>();
  private readonly shooter: SpeechBox;

  constructor(private readonly game: GameContext, private readonly mission: MissionDef) {
    this.shooter = new SpeechBox(game.audio, {
      portrait: { x: 24, y: 552, w: 112, h: 136 },
      bubble: { x: 150, y: 566, w: 470, h: 104 },
      fontSize: 17, style: 'comic', persistent: true,
    }, 'shooter', pilotContext(game));
    this.coach('spool');
  }

  private coach(ev: ShooterEvent, interrupt = true): void {
    this.shooter.say(shooterLine(ev), interrupt);
  }

  private coachOnce(ev: ShooterEvent): void {
    if (this.said.has(ev)) return;
    this.said.add(ev);
    this.coach(ev);
  }

  enter(): void {
    this.game.music.stop();
  }

  exit(): void {
    this.game.audio.setJet(0);
  }

  onBlur(): void {
    this.game.audio.setJet(0);
  }

  update(dt: number): void {
    this.t += dt;
    const input = this.game.input;
    if (input.pressed('back') && !this.leaving) {
      this.leaving = true;
      this.game.audio.play('uiBack');
      this.game.go({ to: 'map', select: this.mission.id });
      return;
    }
    const onButton = (p: { x: number; y: number }): boolean => hit(p, SKIP_BTN) || hit(p, ACTION_BTN);
    const touching = input.pointer.down && input.device === 'touch' && !onButton(input.pointer);
    const before = this.s;
    const action = input.pressed('special') || input.taps.some((p) => hit(p, ACTION_BTN));
    this.s = stepTakeoff(this.s, {
      throttleHeld: input.held('fire') || input.held('up') || touching,
      action,
      skip: input.pressed('skip') || input.taps.some((p) => hit(p, SKIP_BTN)),
    }, dt);
    this.react(before, action);
    this.shooter.update(dt, input);
    this.movePlane(dt);
    this.effects(dt);
    this.game.audio.setJet(this.jetLevel());
    this.maybeLeave(dt);
  }

  private maybeLeave(dt: number): void {
    if (this.s.phase !== 'done' || this.leaving) return;
    this.doneTimer += dt;
    if (this.doneTimer > 0.5 || this.s.rating === 'skipped') {
      this.leaving = true;
      this.game.go({ to: 'mission', mission: this.mission, takeoff: this.s.rating ?? 'skipped' });
    }
  }

  private jetLevel(): number {
    switch (this.s.phase) {
      case 'spool':
      case 'locked':
      case 'ready': return this.s.throttle;
      case 'catapult': return 1;
      case 'climb': return 0.8;
      case 'done': return 0.5;
      default: throw new Error(`unhandled: ${this.s.phase satisfies never}`);
    }
  }

  /** Sounds and deck-officer lines for what just happened. */
  private react(before: TakeoffState, action: boolean): void {
    const s = this.s;
    if (s.phase !== before.phase) return this.onPhase(s.phase);
    if (s.phase === 'spool') {
      if (action && s.rejected) {
        this.game.audio.play('denied');
        this.coach(s.rejected === 'high' ? 'overspeed' : 'notYet');
      } else if (s.overspeed) this.coachOnce('overspeed');
      else if (inGreen(s.throttle)) this.coachOnce('green');
    }
    if (s.phase === 'locked') {
      if (s.earlyPresses > before.earlyPresses) this.coach('waitForIt');
      const count = Math.ceil(s.countdown);
      if (count !== this.lastCount) this.game.audio.play('uiMove', { pitch: 1.4 });
      this.lastCount = count;
    }
  }

  private onPhase(to: TakeoffPhase): void {
    const a = this.game.audio;
    if (to === 'locked') {
      a.play('uiSelect');
      this.lastCount = Math.ceil(this.s.countdown);
      this.coach('locked');
    }
    if (to === 'ready') {
      a.play('powerup');
      this.coach('go');
    }
    if (to === 'catapult') {
      a.play('catapult');
      a.play(this.s.rating === 'perfect' ? 'cash' : 'uiSelect');
      this.shake = 8;
      const r = this.s.rating;
      this.coach(r === 'perfect' || r === 'good' || r === 'late' ? r : 'launch');
    }
  }

  private movePlane(dt: number): void {
    const s = this.s;
    if (s.phase === 'catapult') this.planeX = s.deckPos;
    else if (s.phase === 'climb' || s.phase === 'done') this.planeX += s.speed * dt;
    this.camX = lerp(this.camX, this.planeX - PLANE_SCREEN_X, Math.min(1, dt * 6));
  }

  private effects(dt: number): void {
    this.shake = Math.max(0, this.shake - dt * 20);
    this.particles.update(dt, 0, 500);
    const tail = this.planeX - this.camX + SIDE_TAIL_X[this.game.save.selectedPlane] * PLANE_SCALE;
    const waiting = this.s.phase === 'spool' || this.s.phase === 'locked' || this.s.phase === 'ready';
    if (waiting && Math.random() < 0.25) this.particles.steam(this.planeX - this.camX + Math.random() * 500, DECK_Y - 6, 0.5);
    if (waiting && this.s.throttle > 0.5 && Math.random() < this.s.throttle * 0.4) this.particles.steam(tail - 20, DECK_Y - 20, 0.3);
    if (this.s.phase === 'catapult') {
      for (let i = 0; i < 3; i++) this.particles.steam(tail + Math.random() * 40, DECK_Y - 4, 1.5);
    }
  }

  private shooterPose(): number {
    switch (this.s.phase) {
      case 'spool': return inGreen(this.s.throttle) ? -0.2 : 2.2;
      case 'locked': return 0.6;
      case 'ready': return 1.4;
      case 'catapult':
      case 'climb':
      case 'done': return 0.9;
      default: throw new Error(`unhandled: ${this.s.phase satisfies never}`);
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    const th = THEATERS[this.mission.theater];
    const launched = this.s.phase === 'catapult' || this.s.phase === 'climb' || this.s.phase === 'done';
    ctx.save();
    if (this.shake > 0) ctx.translate((Math.random() - 0.5) * this.shake, (Math.random() - 0.5) * this.shake);
    drawSky(ctx, th.terrain, this.camX, this.t);
    drawSea(ctx, th.palette, this.camX, this.t);
    drawCarrier(ctx, { camX: this.camX, t: this.t, jbd: launched ? 1 : Math.min(1, this.t * 2), shooterPose: this.shooterPose(), launched });
    this.renderPlane(ctx);
    this.particles.render(ctx);
    ctx.restore();
    this.renderHud(ctx);
  }

  private renderPlane(ctx: CanvasRenderingContext2D): void {
    const s = this.s;
    const flying = s.phase === 'climb' || s.phase === 'done';
    const pitch = flying ? Math.min(0.32, 0.1 + s.t * 0.2) : 0;
    const gear = flying ? Math.max(0, 1 - s.t * 1.2) : 1;
    const throttle = s.phase === 'catapult' || flying ? 1 : s.throttle;
    drawPlaneSide(ctx, this.game.save.selectedPlane, this.planeX - this.camX, DECK_Y - s.altitude, PLANE_SCALE, { pitch, gear, throttle, t: this.t });
  }

  private renderHud(ctx: CanvasRenderingContext2D): void {
    text(ctx, t('takeoff.title', { n: this.mission.number, name: missionName(this.mission).toUpperCase() }), 24, 40, { size: 20, display: true, italic: true, shadow: true });
    text(ctx, t('takeoff.subtitle'), 24, 64, { size: 13, color: COLORS.ink, letterSpacing: 2, shadow: true });
    drawPrompt(ctx, this.s, this.game.input.device, this.t);
    const waiting = this.s.phase === 'spool' || this.s.phase === 'locked' || this.s.phase === 'ready';
    if (waiting) drawThrottle(ctx, this.s, this.t);
    drawActionButton(ctx, this.s, this.t);
    if (this.s.phase !== 'done') drawButton(ctx, { id: 'skip', label: t('takeoff.skip'), ...SKIP_BTN, hint: 'S' }, false, this.t);
    this.shooter.render(ctx);
  }
}
