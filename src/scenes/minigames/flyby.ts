import type { Input } from '../../core/input';
import { clamp } from '../../core/math';
import {
  createFlyby, FLYBY_MEDALS, PASSES, SCRAPE_DEPTH, speedMult, SPILL_BONUS, stepFlyby, totalScore, TOWER_ROOF, type FlybyInput, type FlybyState, type PassResult,
} from '../../game/minigames/flyby';
import { burnerLevel, feet, JET_SCALE, jetSpan, lowestPoint } from '../../game/minigames/flyby-jet';
import type { GameContext } from '../../game/state';
import { mt } from '../../i18n/minigame-text';
import { FLYBY_TEXT, flybyNum } from '../../i18n/minigames/flyby';
import { drawPlaneSide } from '../../render/draw-planes-side';
import { drawAirBase, drawJetShadow, flybyCamera, GROUND_Y } from '../../render/minigames/flyby-base';
import type { ControllerMood } from '../../render/minigames/flyby-controller';
import { drawSpeedLines, FlybyFx } from '../../render/minigames/flyby-fx';
import {
  drawBanner, drawBurnerGauge, drawFlybyIcon, drawLadder, drawPassSlots, drawPopup, drawRoofGuide, type PopupView,
} from '../../render/minigames/flyby-hud';
import { drawTower } from '../../render/minigames/flyby-tower';
import type { MinigameModule, MinigameRound } from './contract';

// Tower Flyby (doc 13): three low passes over the tower. Rules live in game/minigames/flyby.ts.

const ROOF_Y = GROUND_Y - TOWER_ROOF;
const LEFT = { x: 0, y: 56, w: 768, h: 664 };
const RIGHT = { x: 768, y: 56, w: 512, h: 664 };
/** Touch drag (px) for full stick deflection. */
const DRAG_FULL = 70;
/** Moods by how a pass went; flinch below this clearance (px). */
const FLINCH_BELOW = 75;
const crossed = (a: number, b: number, at: number): boolean => a < at && b >= at;

function popupFor(r: PassResult): PopupView {
  const ft = r.clearance === null ? 0 : feet(r.clearance);
  switch (r.outcome) {
    case 'scored': return {
      main: mt(FLYBY_TEXT, 'points', { points: flybyNum(r.points) }),
      detail: mt(FLYBY_TEXT, 'detail', { ft, mult: flybyNum(r.mult, 2) }),
      bonus: r.spill ? mt(FLYBY_TEXT, 'spill', { bonus: SPILL_BONUS }) : '', good: true,
    };
    case 'tooHigh': return { main: mt(FLYBY_TEXT, 'tooHigh'), detail: mt(FLYBY_TEXT, 'ft', { ft }), bonus: '', good: false };
    case 'tower': {
      const scrape = (r.clearance ?? 0) > -SCRAPE_DEPTH;
      return { main: mt(FLYBY_TEXT, scrape ? 'scrape' : 'nearMiss'), detail: mt(FLYBY_TEXT, 'noScore'), bonus: '', good: false };
    }
    case 'ground': return { main: mt(FLYBY_TEXT, 'ground'), detail: mt(FLYBY_TEXT, 'noScore'), bonus: '', good: false };
    default: throw new Error(`unhandled: ${r.outcome satisfies never}`);
  }
}

class FlybyRound implements MinigameRound {
  private s: FlybyState;
  private t = 0;
  private drag = 0;
  private readonly fx = new FlybyFx();
  private mood: ControllerMood = 'idle';
  private moodT = 0;
  private stains = 0;
  private popup: { view: PopupView; age: number } | null = null;
  private shake = 0;
  private rattle = 0;

  constructor(private readonly game: GameContext) {
    this.s = createFlyby(game.save.selectedPlane);
  }

  private readInput(input: Input): FlybyInput {
    if (input.touchingIn(LEFT)) this.drag += input.dragDelta(LEFT).y;
    else this.drag = 0;
    const climb = clamp(-input.moveVector().y - this.drag / DRAG_FULL, -1, 1);
    const lever = input.throttle;
    const burner = input.held('fire') || input.touchingIn(RIGHT) || (lever !== null && lever > 0.85);
    return { climb, burner };
  }

  update(dt: number, input: Input): number | null {
    const prev = this.s;
    this.s = stepFlyby(prev, this.readInput(input), dt);
    this.t += dt;
    this.tickEffects(prev, dt);
    if (!prev.result && this.s.result) this.onResult(this.s.result);
    if (this.s.pass !== prev.pass) this.setMood('idle');
    this.chatter(prev.t, this.s.t);
    const j = this.s.jet;
    const near = clamp(1 - Math.abs(j.x) / 500, 0, 1);
    this.game.audio.setJet(0.5 + 0.35 * burnerLevel(j.speed) + 0.15 * near);
    return this.s.done ? totalScore(this.s) : null;
  }

  private setMood(m: ControllerMood): void {
    this.mood = m;
    this.moodT = 0;
  }

  private tickEffects(prev: FlybyState, dt: number): void {
    this.moodT += dt;
    if (this.popup) this.popup.age += dt;
    this.shake = Math.max(0, this.shake - dt * 14);
    this.rattle = Math.max(0, this.rattle - dt * 5);
    if (this.mood === 'spill' && crossed(this.moodT - dt, this.moodT, 0.35)) this.stains++;
    this.fx.step(dt);
    const j = this.s.jet;
    const low = lowestPoint(this.s.plane, j.alt, j.pitch);
    if (low < 45 && !this.s.done && Math.random() < 0.7) this.fx.dust(j.x - jetSpan(this.s.plane, j.pitch).back * 0.5, GROUND_Y + 2, 1);
    if (this.s.pass === prev.pass && !prev.result && !this.s.result) {
      const over = Math.abs(j.x) < 140 ? clamp(1 - (low - TOWER_ROOF) / 120, 0, 1) : 0;
      this.rattle = Math.max(this.rattle, over * 3);
    }
  }

  private onResult(r: PassResult): void {
    const a = this.game.audio;
    const j = this.s.jet;
    this.popup = { view: popupFor(r), age: 0 };
    switch (r.outcome) {
      case 'scored':
        if (r.spill) this.setMood('spill');
        else if ((r.clearance ?? 999) < FLINCH_BELOW) this.setMood('flinch');
        if (r.spill) a.play('splash', { volume: 0.8 });
        a.play(r.points >= 500 ? 'cash' : 'pickup');
        return;
      case 'tooHigh': return a.play('uiBack');
      case 'tower':
        this.setMood('duck');
        if ((r.clearance ?? 0) > -SCRAPE_DEPTH) this.fx.sparks(j.x, ROOF_Y, j.speed);
        this.shake = 7;
        this.rattle = 4;
        return a.play('playerHit');
      case 'ground':
        this.fx.sparks(j.x, GROUND_Y, j.speed);
        this.fx.dust(j.x, GROUND_Y, 14);
        this.shake = 8;
        return a.play('playerHit');
      default: throw new Error(`unhandled: ${r.outcome satisfies never}`);
    }
  }

  /** Tower radio chatter at the start of each pass. */
  private chatter(from: number, to: number): void {
    if (to < from) from = 0;
    const a = this.game.audio;
    if (crossed(from, to, 0.15) || crossed(from, to, 1.05)) a.play('radioClick', { volume: 0.6 });
    for (let k = 0; k < 7; k++) {
      if (crossed(from, to, 0.25 + k * 0.11)) a.play('radioVoice', { pitch: 0.9 + ((k * 37) % 10) / 40, volume: 0.45 });
    }
  }

  liveScore(): string {
    return mt(FLYBY_TEXT, 'live', { pass: Math.min(this.s.pass + 1, PASSES), total: PASSES, score: flybyNum(totalScore(this.s)) });
  }

  dispose(): void {
    this.game.audio.setJet(0);
  }

  render(ctx: CanvasRenderingContext2D): void {
    const s = this.s;
    const camX = flybyCamera(s.jet.x);
    const towerX = -camX;
    ctx.save();
    if (this.shake > 0) ctx.translate((Math.random() - 0.5) * this.shake, (Math.random() - 0.5) * this.shake);
    drawAirBase(ctx, camX, this.t);
    drawTower(ctx, towerX, {
      roofY: ROOF_Y, rattle: this.rattle, t: this.t, splashes: this.stains,
      controller: { mood: this.mood, moodT: this.moodT, t: this.t, look: clamp((s.jet.x - camX - towerX) / 300, -1, 1), stains: this.stains },
    });
    this.renderHud(ctx, camX, towerX);
    this.renderJet(ctx, camX);
    this.fx.draw(ctx, camX);
    ctx.restore();
    this.renderOverlay(ctx, towerX);
  }

  private renderJet(ctx: CanvasRenderingContext2D, camX: number): void {
    const { jet, plane } = this.s;
    const x = jet.x - camX;
    const lvl = burnerLevel(jet.speed);
    const span = jetSpan(plane, 0);
    drawJetShadow(ctx, x, jet.alt, (span.front + span.back) / 2);
    if (lvl > 0.2 || jet.alt < 120) drawSpeedLines(ctx, x, GROUND_Y - jet.alt - 20, jet.x, lvl);
    const livery = this.game.save.livery[plane];
    drawPlaneSide(ctx, plane, x, GROUND_Y - jet.alt, JET_SCALE, { pitch: jet.pitch, throttle: 0.55 + 0.45 * lvl, gear: 0, t: this.t, livery });
  }

  /** Ladder, readout and roof guide while the pass is open. */
  private renderHud(ctx: CanvasRenderingContext2D, camX: number, towerX: number): void {
    const s = this.s;
    if (s.result || s.done) return;
    const j = s.jet;
    const clear = lowestPoint(s.plane, j.alt, j.pitch) - TOWER_ROOF;
    const ladderX = Math.min(1214, towerX + 92);
    const alpha = clamp(s.t / 0.4, 0, 1);
    const nose = j.x - camX + jetSpan(s.plane, j.pitch).front;
    drawRoofGuide(ctx, nose + 12, Math.min(ladderX - 24, towerX - 70), ROOF_Y, alpha * 0.9);
    drawLadder(ctx, ladderX, ROOF_Y, clear, feet(clear), alpha);
  }

  private renderOverlay(ctx: CanvasRenderingContext2D, towerX: number): void {
    const s = this.s;
    const j = s.jet;
    if (this.popup) {
      const atTower = towerX > 140 && towerX < 1140;
      drawPopup(ctx, atTower ? towerX + 30 : 640, atTower ? ROOF_Y - 150 : 330, this.popup.view, this.popup.age);
    }
    drawPassSlots(ctx, s.result ? [...s.results, s.result] : s.results, s.pass, (n) => flybyNum(n));
    drawBurnerGauge(ctx, burnerLevel(j.speed), j.burner, flybyNum(speedMult(j.speed), 2));
    if (!s.done) {
      const label = s.pass === PASSES - 1 && PASSES > 1 ? mt(FLYBY_TEXT, 'finalPass') : mt(FLYBY_TEXT, 'banner', { pass: s.pass + 1, total: PASSES });
      drawBanner(ctx, label, s.t);
    }
    if (s.pass > 0 && s.t < 0.3) {
      ctx.fillStyle = `rgba(4,8,14,${(1 - s.t / 0.3).toFixed(3)})`;
      ctx.fillRect(0, 0, 1280, 720);
    }
  }
}

export const FLYBY: MinigameModule = {
  id: 'flyby',
  medals: FLYBY_MEDALS,
  higherIsBetter: true,
  formatScore: (score) => mt(FLYBY_TEXT, 'score', { score: flybyNum(score) }),
  rules: () => ({
    lines: [mt(FLYBY_TEXT, 'rule1'), mt(FLYBY_TEXT, 'rule2'), mt(FLYBY_TEXT, 'rule3'), mt(FLYBY_TEXT, 'rule4', { bonus: SPILL_BONUS })],
    controls: [mt(FLYBY_TEXT, 'ctrlKeys'), mt(FLYBY_TEXT, 'ctrlPad'), mt(FLYBY_TEXT, 'ctrlTouch')],
  }),
  drawIcon: drawFlybyIcon,
  create: (game) => new FlybyRound(game),
};
