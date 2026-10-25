import type { Input } from '../../core/input';
import { clamp } from '../../core/math';
import {
  basketPos, createRefuel, fuelScore, holdOf, KNOTS_PER_MS, offsetOf, podLight, REFUEL_MEDALS, REFUEL_RULES as R, refuelStatus,
  stepRefuel, type RefuelEvent, type RefuelInput, type RefuelState, type RefuelStatus, type Vec3,
} from '../../game/minigames/refuel';
import type { GameContext } from '../../game/state';
import type { Params } from '../../i18n/i18n';
import { mt } from '../../i18n/minigame-text';
import { clockText, REFUEL_TEXT, refuelNum, type RefuelKey } from '../../i18n/minigames/refuel';
import { drawCanopy, drawProbe } from '../../render/minigames/refuel-cockpit';
import { drawBasket, drawHose, DROGUE } from '../../render/minigames/refuel-drogue';
import { drawAim, drawClosureTape, drawFuelGauge, HUD_GREEN } from '../../render/minigames/refuel-hud';
import { drawRefuelIcon } from '../../render/minigames/refuel-icon';
import { drawEndBanner, drawHoldBox, drawMilestone, drawPopup, drawStatusPanel, type PopupView } from '../../render/minigames/refuel-panel';
import { drawTanker, HOSE_EXIT } from '../../render/minigames/refuel-tanker';
import { camFor, drawSky, project, v3, type Cam } from '../../render/minigames/refuel-view';
import { COLORS } from '../../render/text';
import type { MinigameModule, MinigameRound } from './contract';

// Air Refuelling (doc 15): reads input, steps the pure rules, plays sounds, animates and draws the cockpit view.

const tx = (k: RefuelKey, p?: Params): string => mt(REFUEL_TEXT, k, p);
const END_HOLD = 2.2;
const LEFT = { x: 0, y: 56, w: 768, h: 664 };
const RIGHT = { x: 768, y: 56, w: 512, h: 664 };
/** Touch drag (px) for full stick deflection. */
const DRAG_FULL = 70;
const MILESTONE = 1000;
const crossed = (a: number, b: number, at: number): boolean => a < at && b >= at;

const STATUS: Readonly<Record<RefuelStatus, { key: RefuelKey; color: string }>> = {
  cleared: { key: 'cleared', color: COLORS.amber },
  pushIn: { key: 'pushIn', color: COLORS.amber },
  flowing: { key: 'flowing', color: HUD_GREEN },
  tooFar: { key: 'tooFar', color: COLORS.amber },
  backOff: { key: 'backOff', color: COLORS.red },
  over: { key: 'time', color: COLORS.gold },
};

function popupFor(e: RefuelEvent): PopupView {
  switch (e.kind) {
    case 'contact': return { main: tx('contact'), sub: '', good: true };
    case 'miss': return { main: tx('miss'), sub: tx('missSub', { cm: Math.round(e.offset * 100) }), good: false };
    case 'tooFast': return { main: tx('tooFast'), sub: tx('tooFastSub', { kt: refuelNum(e.closure * KNOTS_PER_MS, 1) }), good: false };
    case 'tooSoft': return { main: tx('tooSoft'), sub: tx('tooSoftSub'), good: false };
    case 'droppedOff': return { main: tx('droppedOff'), sub: tx('droppedOffSub'), good: false };
    case 'slack': return { main: tx('slack'), sub: tx('slackSub'), good: false };
    case 'brokeOff': return { main: tx('brokeOff'), sub: tx('brokeOffSub'), good: false };
    default: throw new Error(`unhandled: ${e.kind satisfies never}`);
  }
}

class RefuelRound implements MinigameRound {
  private s: RefuelState;
  private t = 0;
  private end = 0;
  private drag = { x: 0, y: 0 };
  private throttle = 0;
  private popup: { view: PopupView; age: number } | null = null;
  private milestone: { label: string; age: number } | null = null;
  private shake = 0;
  /** How far the probe has slid into the coupling (m, visual). */
  private seat = 0;
  private tilt = 0;
  private lean = { x: 0, y: 0 };
  private lastBasket: Vec3;
  private chatterFrom = 0.2;

  constructor(private readonly game: GameContext, seed: number) {
    this.s = createRefuel(seed);
    this.lastBasket = basketPos(this.s);
  }

  private readInput(input: Input): RefuelInput {
    if (input.touchingIn(LEFT)) {
      const d = input.dragDelta(LEFT);
      this.drag = { x: this.drag.x + d.x, y: this.drag.y + d.y };
    } else this.drag = { x: 0, y: 0 };
    const m = input.moveVector();
    const boost = input.held('fire') || input.touchingIn(RIGHT);
    this.throttle = boost ? 1 : (input.throttle ?? 0);
    return { x: clamp(m.x + this.drag.x / DRAG_FULL, -1, 1), y: clamp(-m.y - this.drag.y / DRAG_FULL, -1, 1), throttle: this.throttle };
  }

  update(dt: number, input: Input): number | null {
    const before = this.t;
    this.t += dt;
    this.tickFx(dt);
    this.chatter(before, this.t);
    if (this.s.phase === 'over') {
      this.end += dt;
      this.game.audio.setJet(0.3);
      return this.end >= END_HOLD ? fuelScore(this.s) : null;
    }
    const prev = this.s;
    this.s = stepRefuel(prev, this.readInput(input), dt);
    if (this.s.events !== prev.events && this.s.event) this.onEvent(this.s.event);
    if (this.s.phase === 'over') this.radio(0.1);
    if (Math.floor(this.s.fuel / MILESTONE) > Math.floor(prev.fuel / MILESTONE)) {
      this.milestone = { label: tx('milestone', { lbs: refuelNum(MILESTONE) }), age: 0 };
      this.game.audio.play('pickup', { volume: 0.6 });
    }
    this.game.audio.setJet(0.3 + 0.45 * this.throttle);
    return null;
  }

  private tickFx(dt: number): void {
    if (this.popup) this.popup.age += dt;
    if (this.milestone) this.milestone.age += dt;
    this.shake = Math.max(0, this.shake - dt * 16);
    const seatTo = this.s.phase === 'contact' ? DROGUE.depth : 0;
    this.seat += clamp(seatTo - this.seat, -dt * 3, dt * 2.5);
    this.tilt += (-this.s.jet.vx * 0.03 - this.tilt) * Math.min(1, dt * 4);
    const b = basketPos(this.s);
    const k = Math.min(1, dt * 6);
    const vx = (b.x - this.lastBasket.x) / dt;
    const vy = (b.y - this.lastBasket.y) / dt;
    this.lean = { x: this.lean.x + (clamp(-vx * 0.15, -0.2, 0.2) - this.lean.x) * k, y: this.lean.y + (clamp(-vy * 0.15, -0.2, 0.2) - this.lean.y) * k };
    this.lastBasket = b;
  }

  private onEvent(e: RefuelEvent): void {
    const a = this.game.audio;
    this.popup = { view: popupFor(e), age: 0 };
    switch (e.kind) {
      case 'contact':
        a.play('hit', { volume: 0.7, pitch: 0.6 });
        return a.play('uiSelect');
      case 'tooFast':
      case 'slack':
        this.shake = 9;
        a.play('playerHit');
        return this.radio(0.3);
      case 'miss':
      case 'tooSoft':
      case 'droppedOff':
      case 'brokeOff':
        a.play('uiBack');
        return this.radio(0.3);
      default: throw new Error(`unhandled: ${e.kind satisfies never}`);
    }
  }

  /** Queues a burst of tanker radio chatter `delay` s from now. */
  private radio(delay: number): void {
    this.chatterFrom = this.t + delay;
  }

  private chatter(from: number, to: number): void {
    const a = this.game.audio;
    const at = this.chatterFrom;
    if (crossed(from, to, at) || crossed(from, to, at + 0.9)) a.play('radioClick', { volume: 0.6 });
    for (let k = 0; k < 6; k++) {
      if (crossed(from, to, at + 0.1 + k * 0.12)) a.play('radioVoice', { pitch: 0.85 + ((k * 37) % 10) / 45, volume: 0.42 });
    }
  }

  liveScore(): string {
    return tx('live', { lbs: refuelNum(fuelScore(this.s)), time: clockText(R.roundTime - this.s.t) });
  }

  dispose(): void {
    this.game.audio.setJet(0);
  }

  render(ctx: CanvasRenderingContext2D): void {
    const s = this.s;
    const cam = camFor(s.jet);
    const rough = s.rough * s.turbulence;
    ctx.save();
    const jx = (Math.sin(this.t * 23) * 0.6 + Math.sin(this.t * 37) * 0.4) * rough * 0.8;
    const jy = (Math.sin(this.t * 29 + 1) * 0.6 + Math.sin(this.t * 41) * 0.4) * rough * 0.8;
    const sh = this.shake > 0 ? this.shake : 0;
    ctx.translate(jx + (Math.random() - 0.5) * sh, jy + (Math.random() - 0.5) * sh);
    drawSky(ctx, this.t, this.tilt);
    drawTanker(ctx, cam, podLight(s), this.t);
    this.renderDrogue(ctx, cam);
    drawCanopy(ctx);
    ctx.restore();
    this.renderHud(ctx, cam);
  }

  private renderDrogue(ctx: CanvasRenderingContext2D, cam: Cam): void {
    const s = this.s;
    const b = basketPos(s);
    const ring = v3(b.x, b.y, b.z - this.seat);
    const coupling = v3(ring.x + this.lean.x, ring.y + this.lean.y, ring.z + DROGUE.depth + 0.15);
    drawHose(ctx, cam, HOSE_EXIT, coupling, 1.3 + Math.max(0, s.push - 2.5) * 1.6);
    const behind = s.phase !== 'contact' && s.gap < -0.3;
    if (behind) drawProbe(ctx);
    drawBasket(ctx, cam, ring, this.t * 0.35, this.lean);
    if (!behind) drawProbe(ctx);
  }

  private renderHud(ctx: CanvasRenderingContext2D, cam: Cam): void {
    const s = this.s;
    const b = basketPos(s);
    if (s.phase === 'approach' || s.phase === 'backoff') {
      const o = offsetOf(s);
      const alpha = clamp((s.gap - 0.15) / 0.5, 0, 1) * (s.phase === 'approach' ? 1 : 0.45);
      drawAim(ctx, project(cam, v3(s.jet.x, s.jet.y, b.z)), Math.hypot(o.x, o.y) <= R.captureR, alpha);
    }
    if (s.phase === 'contact') drawHoldBox(ctx, holdOf(s), s.push, clamp(this.seat / DROGUE.depth, 0, 1));
    drawClosureTape(ctx, s.closure, this.throttle, s.phase === 'contact' ? null : Math.max(0, s.gap));
    drawFuelGauge(ctx, s.fuel, s.valve, this.t);
    const st = STATUS[refuelStatus(s)];
    drawStatusPanel(ctx, tx(st.key), st.color, podLight(s), this.t);
    if (this.popup) drawPopup(ctx, this.popup.view, this.popup.age);
    if (this.milestone) drawMilestone(ctx, this.milestone.label, this.milestone.age);
    if (s.phase === 'over') drawEndBanner(ctx, tx('time'), tx('onBoard', { lbs: refuelNum(fuelScore(s)) }), this.end);
  }
}

export const REFUEL: MinigameModule = {
  id: 'refuel',
  medals: REFUEL_MEDALS,
  higherIsBetter: true,
  formatScore: (score) => tx('score', { lbs: refuelNum(score) }),
  rules: () => ({
    lines: [tx('rule1'), tx('rule2'), tx('rule3'), tx('rule4')],
    controls: [tx('ctrlKeys'), tx('ctrlPad'), tx('ctrlTouch')],
  }),
  drawIcon: drawRefuelIcon,
  create: (game) => new RefuelRound(game, Math.floor(Math.random() * 0x7fffffff)),
};
