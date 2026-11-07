import type { Scene } from '../core/scene';
import type { MissionDef } from '../data/types';
import { crewLook } from '../game/crew-looks';
import { SEPARATION_CALL, shooterLine, type ShooterEvent } from '../game/dialogue-scripts';
import { createLaunch, LAUNCH, stepLaunch, type LaunchInput, type LaunchState } from '../game/rocket-launch';
import type { GameContext } from '../game/state';
import { missionName } from '../i18n/content';
import { t } from '../i18n/i18n';
import { liveryLook } from '../render/livery-art';
import { drawFalling, drawFreeShip, drawStack, PIECES, type StackPiece } from '../render/rocket';
import { ellipse } from '../render/shapes';
import { COLORS, text } from '../render/text';
import { pilotContext, SpeechBox } from '../ui/speech';
import { drawButton, hit } from '../ui/widgets';
import { drawFuel, drawLaunchPrompt, drawLaunchSky, drawSeparateButton } from './rocket-hud';
import { ACTION_BTN, SKIP_BTN } from './takeoff-hud';

const X = 560;
/** The ground under the pad at the start, and how far the stack climbs up the screen before the camera follows. */
const PAD_Y = 610;
const RISE = 170;
const PX_PER_KM = 120;
const CLOUDS: readonly [number, number][] = [[1.5, 300], [2.6, 820], [3.8, 180], [5, 700], [6.5, 420], [8, 960]];

interface Falling { piece: StackPiece; x: number; y: number; vx: number; vy: number; rot: number; vr: number }

/** The spacecraft's rocket launch (doc 59): countdown, two stage burns, E separates each spent stage, then orbit.
 *  Shooter calls it from launch control (doc 76). */
export class RocketLaunchScene implements Scene {
  private s: LaunchState = createLaunch();
  private t = 0;
  private falling: Falling[] = [];
  private leaving = false;
  private readonly shooter: SpeechBox;

  constructor(private readonly game: GameContext, private readonly mission: MissionDef) {
    this.shooter = new SpeechBox(game.audio, {
      portrait: { x: 24, y: 552, w: 112, h: 136 },
      bubble: { x: 150, y: 566, w: 470, h: 104 },
      fontSize: 17, style: 'comic', persistent: true,
    }, 'shooter', pilotContext(game));
    this.shooter.look = crewLook(mission.campaign);
    this.call('countdown');
  }

  private call(ev: ShooterEvent): void {
    this.shooter.say(shooterLine(ev), true);
  }

  enter(): void {
    this.game.music.stop();
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
    this.s = stepLaunch(this.s, this.readInput(), dt);
    this.events(before);
    for (const f of this.falling) {
      f.vy += 240 * dt;
      f.x += f.vx * dt;
      f.y += f.vy * dt;
      f.rot += f.vr * dt;
    }
    this.falling = this.falling.filter((f) => f.y < 1000);
    if (this.s.phase === 'done' && !this.leaving) {
      this.leaving = true;
      this.game.go({ to: 'mission', mission: this.mission, takeoff: this.s.rating ?? 'skipped' });
    }
  }

  private readInput(): LaunchInput {
    const input = this.game.input;
    return {
      action: input.pressed('special') || input.taps.some((p) => hit(p, ACTION_BTN)),
      skip: input.pressed('skip') || input.taps.some((p) => hit(p, SKIP_BTN)),
    };
  }

  /** Sounds, and the pieces that drop away at each separation. */
  private events(before: LaunchState): void {
    const a = this.game.audio;
    const s = this.s;
    if (s.phase === 'countdown' && Math.ceil(LAUNCH.countdown - s.t) !== Math.ceil(LAUNCH.countdown - before.t)) a.play('uiMove');
    if (before.phase === 'countdown' && s.phase === 'burn') {
      a.play('powerup');
      this.call('liftoff');
    }
    if (before.phase !== 'orbit' && s.phase === 'orbit') this.call('orbit');
    if (before.phase === 'burn' && s.phase === 'spent') a.play('uiMove');
    if (s.grades.length === before.grades.length) return;
    const grade = s.grades[s.grades.length - 1];
    a.play(grade === 'perfect' ? 'cash' : grade === 'good' ? 'uiSelect' : 'denied');
    if (grade && s.phase !== 'orbit') this.call(SEPARATION_CALL[grade]);
    const nose = this.noseY(before);
    const drop = (piece: StackPiece, vx: number, vr: number): void => {
      const p = PIECES[piece];
      this.falling.push({ piece, x: X, y: nose + (p.top + p.bottom) / 2, vx, vy: 30, rot: 0, vr });
    };
    if (s.stage === 2 && before.stage === 1) drop('booster', -18, -0.5);
    else {
      drop('upper', 14, 0.45);
      drop('fairing', 40, 1.2);
    }
  }

  private rise(s: LaunchState): number {
    return s.alt * PX_PER_KM;
  }

  private noseY(s: LaunchState): number {
    return PAD_Y - PIECES.booster.bottom - Math.min(this.rise(s), RISE);
  }

  private renderWorld(ctx: CanvasRenderingContext2D): void {
    const camera = Math.max(0, this.rise(this.s) - RISE);
    drawLaunchSky(ctx, this.s.alt);
    for (const [km, x] of CLOUDS) {
      const y = PAD_Y + camera - km * PX_PER_KM;
      if (y < -60 || y > 780) continue;
      for (const [dx, dy, r] of [[-50, 6, 34], [0, 0, 46], [52, 8, 30]] as const) ellipse(ctx, x + dx, y + dy, r * 1.4, r * 0.6, 'rgba(255,255,255,0.7)');
    }
    const ground = PAD_Y + camera;
    if (ground < 760) {
      ctx.fillStyle = '#4b5a3e';
      ctx.fillRect(0, ground, 1280, 720 - ground + 40);
      ctx.fillStyle = '#7a7d82';
      ctx.fillRect(X - 70, ground - 10, 140, 12);
      ctx.strokeStyle = '#c84a3a';
      ctx.lineWidth = 3;
      for (let y = ground - 290; y < ground - 10; y += 24) ctx.strokeRect(X - 72, y, 22, 24);
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    this.renderWorld(ctx);
    const look = liveryLook('starship', 'standard');
    for (const f of this.falling) drawFalling(ctx, f.piece, f.x, f.y, f.rot, look);
    const nose = this.noseY(this.s);
    const free = this.s.phase === 'orbit' || this.s.phase === 'done';
    if (free) drawFreeShip(ctx, X + 10, nose + 30 - this.s.t * 120, look, this.t);
    else drawStack(ctx, X, nose, this.s.stage === 1 ? ['fairing', 'upper', 'booster'] : ['fairing', 'upper'], look, this.s.phase === 'burn', this.t);
    text(ctx, t('takeoff.title', { n: this.mission.number, name: missionName(this.mission).toUpperCase() }), 24, 40, { size: 20, display: true, italic: true, shadow: true });
    text(ctx, t('rocket.subtitle'), 24, 64, { size: 13, color: COLORS.ink, letterSpacing: 2, shadow: true });
    drawLaunchPrompt(ctx, this.s, this.game.input.device, this.t);
    if (!free) drawFuel(ctx, this.s, this.t);
    drawSeparateButton(ctx, this.s, this.t);
    if (!free) drawButton(ctx, { id: 'skip', label: t('takeoff.skip'), ...SKIP_BTN, hint: 'S' }, false, this.t);
    this.shooter.render(ctx);
  }
}
