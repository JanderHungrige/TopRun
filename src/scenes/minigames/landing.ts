import type { Input } from '../../core/input';
import { clamp } from '../../core/math';
import { deckPitch, DECK, gustAt } from '../../game/minigames/landing-deck';
import { luTol } from '../../game/minigames/landing-grade';
import {
  aoaOf, createLanding, LANDING_MEDALS, LANDING_RULES as R, landingScore, stepLanding,
  type LandingEvent, type LandingInput, type LandingState, type PassResult,
} from '../../game/minigames/landing';
import type { GameContext } from '../../game/state';
import { mt } from '../../i18n/minigame-text';
import { LANDING_TEXT, passComment, type LandingKey } from '../../i18n/minigames/landing';
import { drawCarrier, shipFrame } from '../../render/minigames/landing-carrier';
import { drawCockpit } from '../../render/minigames/landing-cockpit';
import { drawAoaIndexer, drawHud } from '../../render/minigames/landing-hud';
import { drawLandingIcon } from '../../render/minigames/landing-icon';
import { drawBallRepeater, drawLensWorld, type LensView } from '../../render/minigames/landing-lens';
import { drawShipLights } from '../../render/minigames/landing-lights';
import {
  drawBoard, drawEndBanner, drawFade, drawGradeCard, drawPassBanner, drawPopup, drawRadio, GRADE_COLOR,
} from '../../render/minigames/landing-panel';
import { drawNight } from '../../render/minigames/landing-sky';
import { v3, type Cam } from '../../render/minigames/landing-view';
import { COLORS } from '../../render/text';
import type { MinigameModule, MinigameRound } from './contract';
import { PaddlesRadio } from './landing-radio';

// Carrier Landing (doc 18): reads input, steps the pure rules, lets Paddles talk, plays sounds, animates the
// camera (bank, touchdown slam, shake) and draws the night cockpit view.

const tx = (k: LandingKey, p?: Record<string, string | number>): string => mt(LANDING_TEXT, k, p);
const RAD = Math.PI / 180;
const END_HOLD = 2.4;
const LEFT = { x: 0, y: 56, w: 768, h: 664 };
const RIGHT = { x: 768, y: 56, w: 512, h: 664 };
/** Touch drag (px) for full stick deflection. */
const DRAG_FULL = 70;
/** Nose attitude above the flight path on speed (°) and per m/s slow. */
const AOA_ON = 8.1;
const AOA_PER = 0.35;
const NM = 1852;
const ease = (v: number, to: number, k: number, dt: number): number => v + (to - v) * Math.min(1, k * dt);

class LandingRound implements MinigameRound {
  private s: LandingState;
  private t = 0;
  private end = 0;
  private drag = { x: 0, y: 0 };
  private cmd: LandingInput = { x: 0, y: 0, throttle: R.keyPower, next: false };
  private readonly radio: PaddlesRadio;
  private popup: { label: string; color: string; age: number } | null = null;
  private shake = 0;
  private cam = { pitch: 0, yaw: 0, roll: 0, sink: 0 };

  constructor(private readonly game: GameContext, seed: number) {
    this.s = createLanding(seed);
    this.radio = new PaddlesRadio(game.audio, tx('paddles'), game.profile?.callsign ?? 'PILOT');
    this.snapCamera();
  }

  private readInput(input: Input): LandingInput {
    if (input.touchingIn(LEFT)) {
      const d = input.dragDelta(LEFT);
      this.drag = { x: this.drag.x + d.x, y: this.drag.y + d.y };
    } else this.drag = { x: 0, y: 0 };
    const m = input.moveVector();
    const boost = input.held('fire') || input.touchingIn(RIGHT);
    return {
      x: clamp(m.x + this.drag.x / DRAG_FULL, -1, 1),
      y: clamp(-m.y - this.drag.y / DRAG_FULL, -1, 1),
      throttle: boost ? 1 : (input.throttle ?? R.keyPower),
      next: input.pressed('fire') || input.pressed('confirm') || input.taps.length > 0,
    };
  }

  update(dt: number, input: Input): number | null {
    this.t += dt;
    if (this.popup) this.popup.age += dt;
    this.shake = Math.max(0, this.shake - dt * 9);
    if (this.s.phase === 'over') {
      this.end += dt;
      this.radio.idle(dt);
      this.game.audio.setJet(0.15);
      return this.end >= END_HOLD ? landingScore(this.s) : null;
    }
    this.cmd = this.readInput(input);
    const prev = this.s;
    this.s = stepLanding(prev, this.cmd, dt);
    if (this.s.events !== prev.events && this.s.event) this.onEvent(this.s.event);
    if (this.s.phase === 'approach') this.radio.update(this.s, dt);
    else this.radio.idle(dt);
    this.animateCamera(dt);
    this.game.audio.setJet(this.jetLevel());
    return null;
  }

  private onEvent(e: LandingEvent): void {
    const a = this.game.audio;
    const r = this.s.pending;
    switch (e.kind) {
      case 'trap':
        this.shake = 9;
        this.cam.pitch -= 2.2 * RAD;
        this.cam.sink = 0.7;
        a.play('explosionSmall', { pitch: 0.55, volume: 0.8 });
        a.play('hit', { pitch: 0.5, volume: 0.8 });
        a.play('catapult', { pitch: 1.25, volume: 0.5 });
        this.popup = { label: tx('wirePop', { wire: r?.outcome.kind === 'trap' ? r.outcome.wire : 0 }), color: COLORS.gold, age: 0 };
        if (r?.grade === 'ok') this.radio.call('welcome');
        return;
      case 'bolter':
        this.shake = 6;
        a.play('explosionSmall', { pitch: 0.8, volume: 0.6 });
        a.play('uiBack');
        this.popup = { label: tx('bolterPop'), color: GRADE_COLOR.bolter, age: 0 };
        return this.radio.call('bolter');
      case 'waveoff':
        a.play('denied');
        this.popup = { label: tx('waveoffPop'), color: COLORS.red, age: 0 };
        return this.radio.call('waveoff');
      case 'graded': return this.gradeSound(this.lastResult());
      case 'pass':
        this.popup = null;
        return this.snapCamera();
      case 'over': return;
      default: throw new Error(`unhandled: ${e.kind satisfies never}`);
    }
  }

  private gradeSound(r: PassResult | null): void {
    if (!r) return;
    const a = this.game.audio;
    if (r.grade === 'ok') return a.play('pickup');
    if (r.grade === 'fair' || r.grade === 'noGrade') return a.play('uiSelect');
    a.play('uiBack');
  }

  private lastResult(): PassResult | null {
    return this.s.results[this.s.results.length - 1] ?? null;
  }

  private onDeck(): boolean {
    const s = this.s;
    return s.phase === 'trap' || ((s.phase === 'graded' || s.phase === 'over') && this.lastResult()?.outcome.kind === 'trap');
  }

  private camTarget(): { pitch: number; yaw: number; roll: number } {
    const j = this.s.jet;
    if (this.onDeck()) return { pitch: deckPitch(this.s.sea, this.s.passT) + 1.2 * RAD, yaw: 0, roll: 0 };
    const aoa = clamp(AOA_ON - AOA_PER * j.dv, 4, 13) * RAD;
    const bank = clamp((this.cmd.x * R.latMax - j.vxa) * 0.07, -0.3, 0.3);
    return { pitch: j.gamma + aoa, yaw: Math.atan2(j.vxa, Math.max(30, j.vz)), roll: this.s.phase === 'approach' ? bank : 0 };
  }

  private snapCamera(): void {
    this.cam = { ...this.camTarget(), sink: 0 };
  }

  private animateCamera(dt: number): void {
    const to = this.camTarget();
    this.cam = {
      pitch: ease(this.cam.pitch, to.pitch, 7, dt),
      yaw: ease(this.cam.yaw, to.yaw, 6, dt),
      roll: ease(this.cam.roll, to.roll, 4, dt),
      sink: ease(this.cam.sink, 0, 5, dt),
    };
  }

  private jetLevel(): number {
    const s = this.s;
    switch (s.phase) {
      case 'approach': return 0.25 + 0.5 * s.jet.engine;
      case 'trap': return s.phaseT < 0.9 ? 1 : 0.18;
      case 'bolter':
      case 'waveoff': return 1;
      case 'graded':
      case 'over': return this.onDeck() ? 0.15 : 0.6;
      default: throw new Error(`unhandled: ${s.phase satisfies never}`);
    }
  }

  liveScore(): string {
    return tx('live', { n: this.s.pass + 1, of: R.passes, pts: landingScore(this.s) });
  }

  dispose(): void {
    this.game.audio.setJet(0);
  }

  private camera(): Cam {
    const j = this.s.jet;
    return { x: j.x, y: j.y + DECK.eyeY - this.cam.sink, z: j.z + DECK.eyeZ, pitch: this.cam.pitch, yaw: this.cam.yaw, roll: this.cam.roll };
  }

  render(ctx: CanvasRenderingContext2D): void {
    const s = this.s;
    const cam = this.camera();
    const f = shipFrame(s.sea, s.passT);
    const lens: LensView = { ball: s.ball, waveoff: s.phase === 'waveoff', t: this.t };
    const rumble = this.onDeck() ? (s.jet.vz / R.speed) * 2.5 : 0;
    const g = gustAt(s.sea, s.passT);
    const amp = this.shake + rumble;
    ctx.save();
    ctx.translate((Math.random() - 0.5) * amp + g.x * 0.6, (Math.random() - 0.5) * amp + g.y * 0.8);
    drawNight(ctx, cam, this.t);
    drawCarrier(ctx, cam, f);
    drawShipLights(ctx, cam, f, this.t);
    drawLensWorld(ctx, cam, f, lens);
    drawCockpit(ctx);
    ctx.restore();
    this.renderHud(ctx, cam, lens);
    this.renderPanels(ctx);
  }

  private renderHud(ctx: CanvasRenderingContext2D, cam: Cam, lens: LensView): void {
    const s = this.s;
    const j = s.jet;
    const flying = s.phase === 'approach' || s.phase === 'bolter' || s.phase === 'waveoff';
    const vv = v3(j.vxa - DECK.drift, j.vy, Math.max(1, j.vz));
    drawHud(ctx, { cam, vv, rangeNm: (DECK.target - j.z) / NM, alpha: flying ? 0.85 : 0.3 });
    drawAoaIndexer(ctx, flying ? aoaOf(j.dv) : 'onSpeed', j.engine);
    drawBallRepeater(ctx, lens, j.x / luTol(j.z), s.phase === 'approach' || s.phase === 'waveoff' ? 1 : 0.4);
  }

  private renderPanels(ctx: CanvasRenderingContext2D): void {
    const s = this.s;
    const radio = this.radio.view(this.t);
    if (radio) drawRadio(ctx, radio);
    drawBoard(ctx, s.results, s.pass, this.t);
    if (s.phase === 'approach') drawPassBanner(ctx, tx('passOf', { n: s.pass + 1, of: R.passes }), s.passT);
    if (this.popup) drawPopup(ctx, this.popup.label, this.popup.color, this.popup.age);
    const last = this.lastResult();
    if (s.phase === 'graded' && last) {
      drawGradeCard(ctx, last, passComment(last), s.phaseT, s.pass + 1 >= R.passes, s.phaseT >= R.cardSkip);
    }
    if (s.phase === 'over') drawEndBanner(ctx, tx('recovered'), tx('total', { pts: landingScore(s) }), this.end);
    if (s.pass > 0 && s.phase === 'approach') drawFade(ctx, 1 - s.passT / 0.5);
  }
}

export const LANDING: MinigameModule = {
  id: 'landing',
  medals: LANDING_MEDALS,
  higherIsBetter: true,
  formatScore: (score) => tx('score', { pts: score }),
  rules: () => ({
    lines: [tx('rule1'), tx('rule2'), tx('rule3'), tx('rule4')],
    controls: [tx('ctrlKeys'), tx('ctrlPad'), tx('ctrlTouch')],
  }),
  drawIcon: drawLandingIcon,
  create: (game) => new LandingRound(game, Math.floor(Math.random() * 0x7fffffff)),
};
