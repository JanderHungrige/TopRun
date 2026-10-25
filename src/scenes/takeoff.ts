import { lerp } from '../core/math';
import type { Scene } from '../core/scene';
import { THEATERS } from '../data/theaters';
import type { MissionDef } from '../data/types';
import { shooterLine, type ShooterEvent } from '../game/dialogue-scripts';
import { createTakeoff, stepTakeoff, type TakeoffPhase, type TakeoffState } from '../game/takeoff-logic';
import type { GameContext } from '../game/state';
import { DECK_Y, drawCarrier, drawSea, drawSky, SEA_Y } from '../render/draw-carrier';
import { drawPlaneSide, SIDE_TAIL_X } from '../render/draw-planes-side';
import { Particles } from '../render/particles';
import { COLORS, text } from '../render/text';
import { missionName } from '../i18n/content';
import { t } from '../i18n/i18n';
import { pilotContext, SpeechBox } from '../ui/speech';
import { drawButton, hit } from '../ui/widgets';
import { drawPrompt, drawThrottle, SKIP_BTN } from './takeoff-hud';

const PLANE_SCALE = 1.25;
const PLANE_SCREEN_X = 520;

export class TakeoffScene implements Scene {
  private s: TakeoffState = createTakeoff();
  private particles = new Particles();
  private t = 0;
  private planeX = 0;
  private camX = -PLANE_SCREEN_X;
  private shake = 0;
  private sinkY = 0;
  private sinkV = 0;
  private sunk = false;
  private doneTimer = 0;
  private launched = false;
  private leaving = false;
  private readonly shooter: SpeechBox;
  private saidGreen = false;
  private saidOverspeed = false;

  constructor(private readonly game: GameContext, private readonly mission: MissionDef) {
    this.shooter = new SpeechBox(game.audio, {
      portrait: { x: 24, y: 552, w: 112, h: 136 },
      bubble: { x: 150, y: 566, w: 470, h: 104 },
      fontSize: 17, style: 'comic', persistent: true,
    }, 'shooter', pilotContext(game));
    this.shooter.say(shooterLine('spool'));
  }

  private coach(ev: ShooterEvent, interrupt = true): void {
    this.shooter.say(shooterLine(ev), interrupt);
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
    const skipTap = input.taps.some((p) => hit(p, SKIP_BTN));
    const tapped = input.taps.some((p) => !hit(p, SKIP_BTN));
    const touching = input.pointer.down && input.device === 'touch' && !hit(input.pointer, SKIP_BTN);
    if (input.pressed('back') && !this.leaving) {
      this.leaving = true;
      this.game.audio.play('uiBack');
      this.game.go({ to: 'map', select: this.mission.id });
      return;
    }
    const before = this.s.phase;
    this.s = stepTakeoff(this.s, {
      throttleHeld: input.held('fire') || input.held('up') || touching,
      pressed: input.pressed('fire') || input.pressed('up') || tapped,
      skip: input.pressed('skip') || skipTap,
    }, dt);
    if (this.s.phase !== before) this.onPhase(before, this.s.phase);
    this.coachSpool();
    this.shooter.update(dt, input);
    this.movePlane(dt);
    this.effects(dt);
    this.game.audio.setJet(this.jetLevel());
    if (this.s.phase === 'done' && !this.leaving) {
      this.doneTimer += dt;
      if (this.doneTimer > 0.5 || this.s.rating === 'skipped') {
        this.leaving = true;
        this.game.go({ to: 'mission', mission: this.mission, takeoff: this.s.rating ?? 'skipped' });
      }
    }
  }

  private jetLevel(): number {
    switch (this.s.phase) {
      case 'spool': return this.s.throttle;
      case 'catapult':
      case 'edge': return 1;
      case 'climb': return 0.8;
      case 'ditched': return 0;
      case 'done': return 0.5;
      default: throw new Error(`unhandled: ${this.s.phase satisfies never}`);
    }
  }

  private onPhase(from: TakeoffPhase, to: TakeoffPhase): void {
    const a = this.game.audio;
    if (to === 'catapult') {
      a.play('catapult');
      this.shake = 8;
      this.launched = true;
      this.coach('launch');
    }
    if (to === 'climb') {
      a.play(this.s.rating === 'perfect' ? 'cash' : 'uiSelect');
      const r = this.s.rating;
      if (r && r !== 'skipped') this.coach(r);
    }
    if (to === 'edge') {
      a.play('warning');
      this.coach('edge');
    }
    if (to === 'ditched') {
      this.coach('ditched');
      this.sinkY = 0;
      this.sinkV = 0;
      this.sunk = false;
    }
    if (from === 'ditched' && to === 'spool') {
      this.planeX = 0;
      this.launched = false;
      this.camX = -PLANE_SCREEN_X;
      a.play('uiSelect');
      this.saidGreen = false;
      this.saidOverspeed = false;
      this.coach('spool');
    }
  }

  /** Deck officer reacts to the throttle while spooling (once per attempt each). */
  private coachSpool(): void {
    if (this.s.phase !== 'spool') return;
    if (this.s.overspeed && !this.saidOverspeed) {
      this.saidOverspeed = true;
      this.coach('overspeed');
    } else if (this.s.greenTime > 0.25 && !this.saidGreen) {
      this.saidGreen = true;
      this.coach('green');
    }
  }

  private movePlane(dt: number): void {
    const s = this.s;
    if (s.phase === 'catapult') this.planeX = s.deckPos;
    else if (s.phase === 'edge' || s.phase === 'climb' || s.phase === 'done') this.planeX += s.speed * dt;
    else if (s.phase === 'ditched') this.planeX += Math.max(0, 160 - s.t * 120) * dt;
    if (s.phase === 'ditched' && !this.sunk) {
      this.sinkV += 500 * dt;
      this.sinkY += this.sinkV * dt;
      if (DECK_Y - s.altitude + this.sinkY >= SEA_Y + 4) {
        this.sunk = true;
        this.particles.splash(this.planeX - this.camX, SEA_Y, 30);
        this.game.audio.play('splash');
        this.shake = 6;
      }
    }
    const target = this.planeX - PLANE_SCREEN_X;
    this.camX = lerp(this.camX, target, Math.min(1, dt * 6));
  }

  private effects(dt: number): void {
    this.shake = Math.max(0, this.shake - dt * 20);
    this.particles.update(dt, 0, 500);
    const tail = this.planeX - this.camX + SIDE_TAIL_X[this.game.save.selectedPlane] * PLANE_SCALE;
    if (this.s.phase === 'spool' && Math.random() < 0.25) this.particles.steam(this.planeX - this.camX + Math.random() * 500, DECK_Y - 6, 0.5);
    if (this.s.phase === 'catapult') {
      for (let i = 0; i < 3; i++) this.particles.steam(tail + Math.random() * 40, DECK_Y - 4, 1.5);
    }
    if (this.s.phase === 'spool' && this.s.throttle > 0.5 && Math.random() < this.s.throttle * 0.4) {
      this.particles.steam(tail - 20, DECK_Y - 20, 0.3);
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    const th = THEATERS[this.mission.theater];
    ctx.save();
    if (this.shake > 0) ctx.translate((Math.random() - 0.5) * this.shake, (Math.random() - 0.5) * this.shake);
    drawSky(ctx, th.terrain, this.camX, this.t);
    drawSea(ctx, th.palette, this.camX, this.t);
    drawCarrier(ctx, {
      camX: this.camX, t: this.t, jbd: this.launched ? 1 : Math.min(1, this.t * 2),
      shooterPose: this.s.phase === 'spool' && this.s.greenTime > 0.3 ? -0.2 : this.launched ? 0.9 : 2.2, launched: this.launched,
    });
    this.renderPlane(ctx);
    this.particles.render(ctx);
    ctx.restore();
    this.renderHud(ctx);
  }

  private renderPlane(ctx: CanvasRenderingContext2D): void {
    const s = this.s;
    if (this.sunk) return;
    const pitch = s.phase === 'climb' || s.phase === 'done' ? Math.min(0.32, 0.1 + s.t * 0.2)
      : s.phase === 'edge' ? -0.06 : s.phase === 'ditched' ? -0.25 : 0;
    const gear = s.phase === 'climb' || s.phase === 'done' ? Math.max(0, 1 - s.t * 1.2) : 1;
    const y = DECK_Y - s.altitude + this.sinkY;
    drawPlaneSide(ctx, this.game.save.selectedPlane, this.planeX - this.camX, y, PLANE_SCALE, {
      pitch, gear, throttle: s.phase === 'spool' ? s.throttle : s.phase === 'ditched' ? 0 : 1, t: this.t,
    });
  }

  private renderHud(ctx: CanvasRenderingContext2D): void {
    text(ctx, t('takeoff.title', { n: this.mission.number, name: missionName(this.mission).toUpperCase() }), 24, 40, { size: 20, display: true, italic: true, shadow: true });
    text(ctx, t('takeoff.subtitle') + (this.s.attempts > 1 ? `  ·  ${t('takeoff.attempt', { n: this.s.attempts })}` : ''), 24, 64, { size: 13, color: COLORS.ink, letterSpacing: 2, shadow: true });
    drawPrompt(ctx, this.s, this.game.input.device === 'touch', this.t);
    if (this.s.phase === 'spool') drawThrottle(ctx, this.s, this.t);
    if (this.s.phase !== 'done') drawButton(ctx, { id: 'skip', label: t('takeoff.skip'), ...SKIP_BTN, hint: 'S' }, false, this.t);
    this.shooter.render(ctx);
  }
}
