import type { Input } from '../../core/input';
import { approach, clamp } from '../../core/math';
import { rpm, type ShiftRating } from '../../game/minigames/motorbike-bike';
import { COURSE, type Mishap } from '../../game/minigames/motorbike-course';
import { BURNER_AT, LIFTOFF_T, ROTATE_TIME } from '../../game/minigames/motorbike-jet';
import {
  createRace, finalScore, MOTORBIKE_MEDALS, raceGap, stepRace, type RaceEvent, type RaceState, type RideInput,
} from '../../game/minigames/motorbike';
import type { GameContext } from '../../game/state';
import { signedMetres, type MotorbikeKey } from '../../i18n/minigames/motorbike';
import { BIKE } from '../../render/minigames/motorbike-bike';
import { MotorbikeFx } from '../../render/minigames/motorbike-fx';
import { drawTach } from '../../render/minigames/motorbike-gauge';
import { drawBanner, drawPopups, drawPrompt, drawRaceStrip, POPUP_LIFE, type Popup } from '../../render/minigames/motorbike-hud';
import { drawMotorbikeIcon } from '../../render/minigames/motorbike-icon';
import { faceOf } from '../../render/avatars/person';
import { riderLook, type RiderLook } from '../../render/minigames/motorbike-rider';
import { drawRace } from '../../render/minigames/motorbike-view';
import { ROAD_Y } from '../../render/minigames/motorbike-world';
import { drawRadio } from '../../render/minigames/formation-radio';
import { COLORS } from '../../render/text';
import type { MinigameModule, MinigameRound } from './contract';
import { promptView, raceView, stripView, tachView, tx } from './motorbike-frame';
import { RideReader } from './motorbike-input';
import { BikeRadio } from './motorbike-radio';

// Motorbike vs. Jet (doc 22): reads the controls, steps the pure race, plays sounds and effects, holds the result.

const END_HOLD = 4;
const FRONT_SX = 420;
const IDLE: RideInput = { throttle: 0, brake: false, lean: 0, shift: false };
const SHIFT_POP: Readonly<Record<ShiftRating, { key: MotorbikeKey; color: string }>> = {
  perfect: { key: 'popPerfect', color: COLORS.green }, early: { key: 'popEarly', color: COLORS.amber },
  late: { key: 'popLate', color: COLORS.dim }, auto: { key: 'popAuto', color: COLORS.red },
};
const MISHAP_POP: Readonly<Record<Mishap, MotorbikeKey>> = { bump: 'popBump', slide: 'popSlide', gate: 'popGate', truck: 'popTruck' };

class MotorbikeRound implements MinigameRound {
  private s: RaceState = createRace();
  private t = 0;
  private hold = 0;
  private input: RideInput = IDLE;
  private readonly reader = new RideReader();
  private readonly fx = new MotorbikeFx();
  private readonly radio: BikeRadio;
  private readonly look: RiderLook;
  private readonly you: string;
  private popups: Popup[] = [];
  private bias = 0;
  private flash = 0;
  private flashGood = false;
  private hop = 0;
  private shake = 0;
  private gateLift: number[] = COURSE.map(() => 0);

  constructor(private readonly game: GameContext) {
    const callsign = game.profile?.callsign ?? 'PILOT';
    this.look = riderLook(faceOf(game.profile));
    this.you = game.profile?.callsign ?? tx('you');
    this.radio = new BikeRadio(game.audio, tx('duke'), callsign);
  }

  update(dt: number, input: Input): number | null {
    this.t += dt;
    const prev = this.s;
    this.input = prev.margin === null ? this.reader.read(input, dt) : IDLE;
    this.s = stepRace(prev, this.input, dt);
    for (const e of this.s.events) this.onEvent(e);
    this.tick(prev, dt);
    if (this.s.margin === null) return null;
    this.hold += dt;
    return this.hold >= END_HOLD ? finalScore(this.s) : null;
  }

  private popup(key: MotorbikeKey, color: string, size = 26, dy = 0): void {
    this.popups.push({ text: tx(key), color, x: FRONT_SX + this.bias - 50, y: 470 + dy, age: 0, size });
  }

  private onEvent(e: RaceEvent): void {
    const a = this.game.audio;
    switch (e.kind) {
      case 'shift': return this.onShift(e.rating);
      case 'clear':
        if (e.close) this.popup('popClose', COLORS.cyan, 30);
        else this.popup('popClean', COLORS.green, 22, 30);
        return a.play(e.close ? 'pickup' : 'uiMove', { pitch: e.close ? 1.2 : 1.5, volume: 0.6 });
      case 'mishap': return this.onMishap(e.index, e.mishap);
      case 'truckGo':
        this.radio.say('truck');
        return a.play('warning', { volume: 0.35 });
      case 'marker':
        this.popup('popMarker', COLORS.gold, 28, -30);
        return a.play('cash');
      case 'liftoff':
        this.radio.say(e.margin > 0 ? 'win' : 'lose');
        a.play('catapult', { volume: 0.8 });
        return a.play(e.margin > 0 ? 'powerup' : 'denied');
      default: throw new Error(`unhandled: ${e satisfies never}`);
    }
  }

  private onShift(r: ShiftRating): void {
    const a = this.game.audio;
    const p = SHIFT_POP[r];
    this.popup(p.key, p.color, r === 'perfect' ? 30 : 22);
    this.flash = 1;
    this.flashGood = r === 'perfect';
    a.play('uiMove', { pitch: 0.55, volume: 0.6 });
    if (r === 'perfect') a.play('pickup', { pitch: 1.1 });
    if (r === 'early') a.play('uiBack', { pitch: 0.8 });
    this.fx.puff(this.s.bike.x - 13, ROAD_Y - 43, r === 'perfect' ? 5 : 3);
  }

  private onMishap(index: number, m: Mishap): void {
    const a = this.game.audio;
    this.popup(MISHAP_POP[m], COLORS.red, 32);
    const x = this.s.bike.x;
    if (m === 'bump') {
      this.hop = 9;
      return a.play('hit', { pitch: 0.7 });
    }
    this.fx.dust(x - 6, ROAD_Y, m === 'slide' ? 10 : 18);
    this.shake = m === 'slide' ? 4 : 8;
    if (m === 'gate') this.gateLift[index] = 0.01;
    a.play(m === 'gate' ? 'playerHit' : 'flare', { pitch: m === 'gate' ? 1 : 0.5, volume: 0.8 });
    if (m === 'truck') a.play('playerHit', { volume: 0.6 });
    this.radio.say('crash');
  }

  private tick(prev: RaceState, dt: number): void {
    const s = this.s;
    const b = s.bike;
    for (const p of this.popups) p.age += dt;
    this.popups = this.popups.filter((p) => p.age < POPUP_LIFE);
    this.fx.step(dt);
    this.flash = Math.max(0, this.flash - dt * 3);
    this.hop = Math.max(0, this.hop - dt * 40);
    this.shake = Math.max(0, this.shake - dt * 16);
    this.gateLift = this.gateLift.map((l) => (l > 0 ? approach(l, 1, dt * 4) : 0));
    if (this.input.brake && b.v > 15 && Math.random() < 0.6) this.fx.smoke(b.x - BIKE.wheelbase / 8, ROAD_Y);
    if (b.limiter > 0 && Math.floor(this.t * 60) % 5 === 0) this.game.audio.play('hit', { pitch: 0.5, volume: 0.3 });
    this.calls(prev);
    this.radio.update(dt);
    const gap = raceGap(s);
    const near = clamp(1 - Math.abs(gap) / 90, 0, 1) * (s.t >= BURNER_AT ? 1 : 0.7);
    const engine = s.margin === null ? 0.15 + 0.55 * Math.min(1, rpm(b)) * (this.input.throttle > 0 ? 1 : 0.75) : 0.15;
    this.game.audio.setJet(clamp(engine * 0.7 + 0.35 * near, 0, 1));
    const target = Math.abs(gap) < 70 ? clamp(gap * 4.5, -50, 130) : 0;
    this.bias += (target - this.bias) * Math.min(1, dt * 1.5);
  }

  /** Duke's lines at the race's moments. */
  private calls(prev: RaceState): void {
    const s = this.s;
    if (s.t >= 0.4) this.radio.say('start');
    const gap = raceGap(s);
    if (s.t > 7 && gap > 40) this.radio.say('lead');
    if (prev.t < BURNER_AT && s.t >= BURNER_AT) this.radio.say('closing');
    if (s.t > 8 && raceGap(prev) >= 0 && gap < 0) this.radio.say('pass');
    if (prev.t < LIFTOFF_T - ROTATE_TIME && s.t >= LIFTOFF_T - ROTATE_TIME) this.radio.say('rotate');
  }

  liveScore(): string {
    return tx('live', { m: signedMetres(this.s.margin ?? raceGap(this.s)) });
  }

  dispose(): void {
    this.game.audio.setJet(0);
  }

  render(ctx: CanvasRenderingContext2D): void {
    const s = this.s;
    const frontSx = FRONT_SX + this.bias;
    const sway = s.stun > 0 ? Math.sin(this.t * 18) * Math.min(1, s.stun * 2) : 0;
    const f = {
      frontSx, t: this.t, look: this.look, plane: this.game.save.selectedPlane, livery: this.game.save.livery[this.game.save.selectedPlane],
      fx: this.fx, sway, hop: this.hop, gateLift: this.gateLift, input: this.input,
    };
    ctx.save();
    if (this.shake > 0) ctx.translate((Math.random() - 0.5) * this.shake, (Math.random() - 0.5) * this.shake);
    drawRace(ctx, raceView(s, f));
    ctx.restore();
    this.renderHud(ctx);
  }

  private renderHud(ctx: CanvasRenderingContext2D): void {
    const s = this.s;
    drawTach(ctx, tachView(s, this.flash, this.flashGood, this.t));
    drawRaceStrip(ctx, stripView(s, this.you));
    const prompt = promptView(s, this.input, this.t);
    if (prompt) drawPrompt(ctx, prompt);
    const radio = this.radio.view();
    if (radio) drawRadio(ctx, radio);
    drawPopups(ctx, this.popups);
    if (s.margin !== null) {
      const win = s.margin > 0;
      const sub = tx(win ? 'marginAhead' : 'marginBehind', { m: Math.abs(Math.round(s.margin)) });
      drawBanner(ctx, tx(win ? 'win' : 'lose'), sub, win ? COLORS.gold : COLORS.red, this.hold);
    }
  }
}

export const MOTORBIKE: MinigameModule = {
  id: 'motorbike',
  medals: MOTORBIKE_MEDALS,
  higherIsBetter: true,
  formatScore: (score) => tx('score', { m: signedMetres(score) }),
  rules: () => ({
    lines: [tx('rule1'), tx('rule2'), tx('rule3'), tx('rule4')],
    controls: [tx('ctrlKeys'), tx('ctrlPad'), tx('ctrlTouch')],
  }),
  drawIcon: drawMotorbikeIcon,
  create: (game) => new MotorbikeRound(game),
};
