import type { Input } from '../../core/input';
import { approach, clamp, type Vec } from '../../core/math';
import type { PlaneId } from '../../data/types';
import {
  ALT_GROW, createFormation, finalScore, FORMATION_MEDALS, predict, rating, slotPoint, stepFormation, type FormationState, type Stick, type WingState,
} from '../../game/minigames/formation';
import { GROUND_SPEED, leadPose, segmentAt, SHOW_END, SHOW_START, SMOKE_OFF, SMOKE_ON, type LeadPose, type SegmentId } from '../../game/minigames/formation-script';
import type { GameContext } from '../../game/state';
import { mt } from '../../i18n/minigame-text';
import { FORMATION_TEXT, formationNum } from '../../i18n/minigames/formation';
import {
  drawFormationIcon, drawSegmentBanner, drawSlotGauge, drawSmokeBadge, drawTimeline, drawTouchStick, SEG_KEY,
} from '../../render/minigames/formation-hud';
import {
  drawJet, drawJetShadow, drawPip, drawSlotGhost, drawSlotRings, JET_SCALE, onJet, TAIL, WINGTIP, type JetPose,
} from '../../render/minigames/formation-jets';
import { drawRadio } from '../../render/minigames/formation-radio';
import { SmokeTrails } from '../../render/minigames/formation-smoke';
import { FormationWorld, PIVOT } from '../../render/minigames/formation-world';
import type { MinigameModule, MinigameRound } from './contract';
import { DukeRadio } from './formation-radio';

// Formation Flying (doc 14): hold the slot on Duke's right wing. Rules live in game/minigames/formation*.ts.

const PLAY = { x: 0, y: 56, w: 1280, h: 664 };
/** Touch drag (px) for full stick deflection. */
const TOUCH_FULL = 60;
const scaleAt = (alt: number): number => JET_SCALE * (1 + ALT_GROW * alt);
const crossed = (a: number, b: number, at: number): boolean => a < at && b >= at;

class FormationRound implements MinigameRound {
  private s: FormationState;
  private readonly plane: PlaneId;
  private readonly world: FormationWorld;
  private readonly smoke = new SmokeTrails();
  private readonly radio: DukeRadio;
  private touch: { base: Vec; d: Vec } | null = null;
  private stick: Stick = { x: 0, y: 0 };
  private bank = 0;
  private prevVx = 0;
  private banner: { label: string; age: number } | null = null;

  constructor(private readonly game: GameContext) {
    this.plane = game.save.selectedPlane;
    this.s = createFormation([{ slot: 'right', plane: this.plane }]);
    this.world = new FormationWorld(14 + (game.save.minigames.formation?.plays ?? 0) * 7919);
    this.radio = new DukeRadio(game.audio, mt(FORMATION_TEXT, 'duke'), game.profile?.callsign ?? 'PILOT');
    this.showBanner('join');
  }

  private get wing(): WingState {
    const w = this.s.wings[0];
    if (!w) throw new Error('formation without a wing');
    return w;
  }

  private readInput(input: Input): Stick {
    const mv = input.moveVector();
    if (input.touchingIn(PLAY)) {
      const d = input.dragDelta(PLAY);
      this.touch ??= { base: { x: input.pointer.x - d.x, y: input.pointer.y - d.y }, d: { x: 0, y: 0 } };
      this.touch.d = { x: this.touch.d.x + d.x, y: this.touch.d.y + d.y };
    } else {
      this.touch = null;
    }
    const tx = this.touch ? this.touch.d.x / TOUCH_FULL : 0;
    const ty = this.touch ? this.touch.d.y / TOUCH_FULL : 0;
    return { x: clamp(mv.x + tx, -1, 1), y: clamp(mv.y + ty, -1, 1) };
  }

  update(dt: number, input: Input): number | null {
    const prev = this.s;
    this.stick = this.readInput(input);
    this.s = stepFormation(prev, [this.stick], dt);
    const lead = leadPose(this.s.t);
    const speed = GROUND_SPEED * lead.ground;
    this.world.update(dt, this.s.heading, speed);
    this.smoke.update(dt, lead.turn, speed, PIVOT);
    this.animate(dt, lead);
    this.events(prev);
    this.radio.update(prev, this.s, dt);
    this.game.audio.setJet(0.42 + 0.22 * Math.max(0, -this.stick.y) + 0.1 * lead.alt);
    return this.s.done ? finalScore(this.s) : null;
  }

  private animate(dt: number, lead: LeadPose): void {
    const w = this.wing;
    const ax = (w.vx - this.prevVx) / dt;
    this.prevVx = w.vx;
    this.bank = approach(this.bank, clamp(ax / 260 + lead.turn / 0.45, -1, 1), dt * 4);
    if (this.banner) this.banner.age += dt;
    this.trails(lead);
  }

  /** Smoke from the tails while it is on; wingtip vapour in the hard turn and the pull of the pitch-up. */
  private trails(lead: LeadPose): void {
    const pulling = Math.abs(lead.turn) > 0.3 || leadPose(this.s.t).alt - leadPose(this.s.t - 0.1).alt > 0.03;
    for (const [plane, p, color] of [['f14', this.leadJet(lead), 'red'], [this.plane, this.wingJet(lead), 'blue']] as const) {
      if (lead.smoke) {
        const tail = onJet(p, { x: 0, y: TAIL[plane] });
        this.smoke.smoke(tail.x, tail.y, color, p.scale);
      }
      if (!pulling) continue;
      const tip = WINGTIP[plane];
      for (const side of [-1, 1]) {
        const at = onJet(p, { x: tip.x * side * (1 - Math.abs(p.bank) * 0.32), y: tip.y });
        this.smoke.vapor(at.x, at.y, p.scale);
      }
    }
  }

  private showBanner(id: SegmentId): void {
    const label = id === 'smoke' ? mt(FORMATION_TEXT, 'bannerSmoke') : id === 'break' ? mt(FORMATION_TEXT, 'showDone') : mt(FORMATION_TEXT, SEG_KEY[id]);
    this.banner = { label, age: 0 };
  }

  /** Banners, smoke hiss and slot sounds. */
  private events(prev: FormationState): void {
    const a = this.game.audio;
    const t = this.s.t;
    const seg = segmentAt(t);
    if (seg !== segmentAt(prev.t)) this.showBanner(seg);
    if (crossed(prev.t, t, SMOKE_ON) || crossed(prev.t, t, SMOKE_OFF)) a.play('flare', { volume: 0.6, pitch: 0.7 });
    const was = prev.wings[0]?.zone;
    const now = this.wing.zone;
    if (t <= SHOW_START || t > SHOW_END || was === now) return;
    if (now === 'inner') a.play('uiMove', { pitch: 1.6, volume: 0.35 });
    if (now === 'out') a.play('uiMove', { pitch: 0.6, volume: 0.45 });
  }

  private leadJet(lead: LeadPose): JetPose {
    const throttle = 0.4 + 0.45 * clamp(-lead.vy / 140, 0, 1);
    return { x: lead.x, y: lead.y, yaw: lead.yaw, bank: lead.bank, scale: scaleAt(lead.alt), throttle, alt: lead.alt };
  }

  private wingJet(lead: LeadPose): JetPose {
    const w = this.wing;
    const yaw = 0.6 * Math.atan2(w.vx, GROUND_SPEED * lead.ground - w.vy);
    const throttle = 0.35 + 0.6 * Math.max(0, -this.stick.y);
    return { x: w.x, y: w.y, yaw, bank: this.bank, scale: scaleAt(lead.alt), throttle, alt: lead.alt };
  }

  liveScore(): string {
    return mt(FORMATION_TEXT, 'live', { score: formationNum(this.wing.points) });
  }

  dispose(): void {
    this.game.audio.setJet(0);
  }

  render(ctx: CanvasRenderingContext2D): void {
    const lead = leadPose(this.s.t);
    const w = this.wing;
    const lp = this.leadJet(lead);
    const wp = this.wingJet(lead);
    this.world.renderSea(ctx);
    drawJetShadow(ctx, 'f14', lp, -this.s.heading);
    drawJetShadow(ctx, this.plane, wp, -this.s.heading);
    this.world.renderClouds(ctx);
    this.smoke.render(ctx);
    const slot = this.s.t <= SHOW_END ? slotPoint(lead, w.slot, w.plane) : null;
    if (slot) {
      drawSlotGhost(ctx, this.plane, slot, lead.yaw, scaleAt(lead.alt));
      drawPip(ctx, w, predict(this.s, 0));
    }
    drawJet(ctx, 'f14', lp, this.s.t);
    drawJet(ctx, this.plane, wp, this.s.t, this.game.save.livery[this.plane]);
    if (slot) drawSlotRings(ctx, slot, w.zone, this.s.t);
    this.world.renderVignette(ctx);
    this.renderHud(ctx, lead);
  }

  private renderHud(ctx: CanvasRenderingContext2D, lead: LeadPose): void {
    const t = this.s.t;
    const radio = this.radio.view();
    if (radio) drawRadio(ctx, radio);
    drawTimeline(ctx, t, segmentAt(t));
    drawSlotGauge(ctx, Math.round(rating(this.s, 0) * 100), this.wing.zone, t > SHOW_START && t <= SHOW_END, t);
    if (lead.smoke) drawSmokeBadge(ctx, t);
    if (this.banner) drawSegmentBanner(ctx, this.banner.label, this.banner.age);
    if (this.touch) {
      const d = this.touch.d;
      const len = Math.hypot(d.x, d.y);
      const k = len > TOUCH_FULL ? TOUCH_FULL / len : 1;
      drawTouchStick(ctx, this.touch.base, { x: this.touch.base.x + d.x * k, y: this.touch.base.y + d.y * k });
    }
  }
}

export const FORMATION: MinigameModule = {
  id: 'formation',
  medals: FORMATION_MEDALS,
  higherIsBetter: true,
  formatScore: (score) => mt(FORMATION_TEXT, 'score', { score: formationNum(score) }),
  rules: () => ({
    lines: [mt(FORMATION_TEXT, 'rule1'), mt(FORMATION_TEXT, 'rule2'), mt(FORMATION_TEXT, 'rule3'), mt(FORMATION_TEXT, 'rule4')],
    controls: [mt(FORMATION_TEXT, 'ctrlKeys'), mt(FORMATION_TEXT, 'ctrlPad'), mt(FORMATION_TEXT, 'ctrlTouch')],
  }),
  drawIcon: drawFormationIcon,
  create: (game) => new FormationRound(game),
};
