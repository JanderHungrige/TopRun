import type { Scene } from '../core/scene';
import { THEATERS } from '../data/theaters';
import type { MissionDef } from '../data/types';
import { createLiftoff, stepLiftoff, type LiftoffState } from '../game/liftoff';
import type { GameContext } from '../game/state';
import { missionName } from '../i18n/content';
import { t } from '../i18n/i18n';
import { DECK_Y, drawCarrier, drawSea, drawSky } from '../render/draw-carrier';
import { drawPlaneSide } from '../render/draw-planes-side';
import { Particles } from '../render/particles';
import { COLORS, text } from '../render/text';
import { drawButton, hit } from '../ui/widgets';
import { drawGoButton, drawHeight, drawLiftoffPrompt, drawPitchGauge } from './liftoff-hud';
import { ACTION_BTN, SKIP_BTN } from './takeoff-hud';

const SCALE = 1.25;
/** Pixels per metre in the side view at SCALE (6.9 units per metre, doc 50). */
const PX_PER_M = 6.9 * SCALE;
const SPOT_X = 520;

/** The helicopters' deck liftoff (doc 53): spool up, lift in gusting wind keeping level, E noses over and goes. */
export class LiftoffScene implements Scene {
  private s: LiftoffState = createLiftoff();
  private readonly particles = new Particles();
  private t = 0;
  private rotor = 0;
  private awayX = 0;
  private leaving = false;
  /** Where a touch began: sliding from there is the cyclic. */
  private pressX: number | null = null;

  constructor(private readonly game: GameContext, private readonly mission: MissionDef) {}

  enter(): void {
    this.game.music.stop();
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
    const before = this.s.phase;
    this.s = stepLiftoff(this.s, this.readInput(), dt);
    if (this.s.phase !== before) this.onPhase();
    this.rotor += dt * (0.25 + this.s.rpm);
    if (this.s.phase === 'away' || this.s.phase === 'done') this.awayX += dt * 140 * Math.min(1, this.s.t * 2);
    this.wash(dt);
    if (this.s.phase === 'done' && !this.leaving) {
      this.leaving = true;
      this.game.go({ to: 'mission', mission: this.mission, takeoff: this.s.rating ?? 'skipped' });
    }
  }

  private readInput(): Parameters<typeof stepLiftoff>[1] {
    const input = this.game.input;
    const onButton = (p: { x: number; y: number }): boolean => hit(p, SKIP_BTN) || hit(p, ACTION_BTN);
    const touching = input.pointer.down && input.device === 'touch' && !onButton(input.pointer);
    if (touching && this.pressX === null) this.pressX = input.pointer.x;
    if (!touching) this.pressX = null;
    const slide = this.pressX === null ? 0 : (input.pointer.x - this.pressX) / 80;
    const keys = (input.held('right') ? 1 : 0) - (input.held('left') ? 1 : 0) + input.stick.x;
    return {
      collective: input.held('fire') || input.held('up') || touching,
      stick: Math.max(-1, Math.min(1, keys + slide)),
      action: input.pressed('special') || input.taps.some((p) => hit(p, ACTION_BTN)),
      skip: input.pressed('skip') || input.taps.some((p) => hit(p, SKIP_BTN)),
    };
  }

  private onPhase(): void {
    const a = this.game.audio;
    if (this.s.phase === 'lift') a.play('powerup');
    if (this.s.phase === 'hover') a.play('uiSelect');
    if (this.s.phase === 'away') a.play(this.s.rating === 'perfect' ? 'cash' : 'uiSelect');
  }

  /** Rotor wash: spray off the deck while the helicopter is low. */
  private wash(dt: number): void {
    this.particles.update(dt, 0, 500);
    if (this.s.rpm < 0.5 || this.s.alt > 8 || Math.random() > this.s.rpm * 0.6) return;
    for (const side of [-1, 1]) this.particles.steam(SPOT_X + this.awayX + side * (40 + Math.random() * 60), DECK_Y - 4, 0.6);
  }

  render(ctx: CanvasRenderingContext2D): void {
    const th = THEATERS[this.mission.theater];
    const camX = -SPOT_X;
    drawSky(ctx, th.terrain, camX, this.t);
    drawSea(ctx, th.palette, camX, this.t);
    drawCarrier(ctx, { camX, t: this.t, jbd: 0, shooterPose: 0.9, launched: true });
    const id = this.game.save.selectedPlane;
    drawPlaneSide(ctx, id, SPOT_X + this.awayX, DECK_Y - this.s.alt * PX_PER_M, SCALE, { pitch: this.s.pitch, gear: 1, t: this.rotor, livery: this.game.save.livery[id] });
    this.particles.render(ctx);
    text(ctx, t('takeoff.title', { n: this.mission.number, name: missionName(this.mission).toUpperCase() }), 24, 40, { size: 20, display: true, italic: true, shadow: true });
    text(ctx, t('liftoff.subtitle'), 24, 64, { size: 13, color: COLORS.ink, letterSpacing: 2, shadow: true });
    drawLiftoffPrompt(ctx, this.s, this.game.input.device, this.t);
    if (this.s.phase === 'lift' || this.s.phase === 'hover') {
      drawPitchGauge(ctx, this.s);
      drawHeight(ctx, this.s);
    }
    drawGoButton(ctx, this.s, this.t);
    if (this.s.phase !== 'away' && this.s.phase !== 'done') drawButton(ctx, { id: 'skip', label: t('takeoff.skip'), ...SKIP_BTN, hint: 'S' }, false, this.t);
  }
}
