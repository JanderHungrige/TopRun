import type { Device, Input } from '../../core/input';
import { clamp, type Vec } from '../../core/math';
import { headingTo } from '../../game/combat';
import {
  createEvasion, EVASION_MEDALS, EVASION_RULES as R, stepEvasion, type EvasionInput, type EvasionState,
} from '../../game/minigames/evasion';
import { breakLevel, breakReady, gLoad, JET } from '../../game/minigames/evasion-flight';
import { DECOY, decoyChance, impactTime, tailAngle, type Missile } from '../../game/minigames/evasion-missiles';
import { WAVES } from '../../game/minigames/evasion-waves';
import type { GameContext } from '../../game/state';
import type { Params } from '../../i18n/i18n';
import { mt } from '../../i18n/minigame-text';
import { clockText, EVASION_TEXT, gText, type EvasionKey } from '../../i18n/minigames/evasion';
import { drawPlaneTop } from '../../render/draw-planes';
import {
  BREAK_BTN, drawBanner, drawBreakButton, drawClock, drawFlareButton, drawGMeter, drawHull, drawPopups, drawTunnel, FLARE_BTN, type Rect,
} from '../../render/minigames/evasion-hud';
import { drawEvasionIcon } from '../../render/minigames/evasion-icon';
import { drawFlare, drawMissile } from '../../render/minigames/evasion-ordnance';
import { drawDecoyCone, drawEdgeMarker, drawRwr, type RwrBlip, type Urgency } from '../../render/minigames/evasion-rwr';
import { EvasionWorld, FIELD } from '../../render/minigames/evasion-world';
import { COLORS, text } from '../../render/text';
import type { MinigameModule, MinigameRound } from './contract';
import { EvasionEffects } from './evasion-effects';

// Missile Evasion (doc 16): maps input onto the pure rules, follows the jet with the camera, draws
// the world, the threats and the HUD. Rules live in game/minigames/evasion*.ts.

const tx = (k: EvasionKey, p?: Params): string => mt(EVASION_TEXT, k, p);
/** Touch / mouse drags that start here steer (the buttons sit to the right of it). */
const STEER: Rect = { x: 0, y: 56, w: 1000, h: 664 };
const DRAG_FULL = 60;
const END_HOLD = 2.6;
const JET_SCALE = 0.88;
const WAVE_BANNER = 1.8;
const inRect = (p: Vec, r: Rect): boolean => p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;
const KEYS: Readonly<Record<Device, { flare: string; brk: string }>> = {
  keyboard: { flare: 'F', brk: 'E' }, gamepad: { flare: 'X', brk: 'Y' }, joystick: { flare: '', brk: '' },
  mouse: { flare: '', brk: '' }, touch: { flare: '', brk: '' },
};

/** RWR colour: red inside the break window, flashing when only a high-G break still helps. */
function urgency(m: Missile, s: EvasionState): Urgency {
  const t = impactTime(m, s.jet);
  return t < 0.65 ? 'now' : t < 1.3 ? 'near' : 'far';
}

const flareable = (m: Missile, s: EvasionState): boolean =>
  m.mode === 'tracking' && Math.hypot(m.x - s.jet.x, m.y - s.jet.y) < DECOY.range && decoyChance(tailAngle(s.jet, m.x, m.y)) >= 0.5;

class EvasionRound implements MinigameRound {
  private s: EvasionState;
  private t = 0;
  private hold = 0;
  private cam: Vec;
  private drag: Vec = { x: 0, y: 0 };
  private device: Device = 'keyboard';
  private readonly world: EvasionWorld;
  private readonly fx: EvasionEffects;

  constructor(private readonly game: GameContext, seed: number) {
    this.s = createEvasion(seed);
    this.world = new EvasionWorld(seed);
    this.fx = new EvasionEffects(game.audio);
    this.cam = { x: this.s.jet.x, y: this.s.jet.y + this.s.jet.vy * 0.3 };
  }

  private readInput(input: Input): EvasionInput {
    this.device = input.device;
    if (input.touchingIn(STEER)) {
      const d = input.dragDelta(STEER);
      const x = this.drag.x + d.x;
      const y = this.drag.y + d.y;
      const k = Math.min(1, DRAG_FULL / Math.max(1e-6, Math.hypot(x, y)));
      this.drag = { x: x * k, y: y * k };
    } else this.drag = { x: 0, y: 0 };
    const dragging = Math.hypot(this.drag.x, this.drag.y) > 6;
    const steer = dragging ? { x: this.drag.x / DRAG_FULL, y: this.drag.y / DRAG_FULL } : input.moveVector();
    const taps = input.taps;
    return {
      steerX: steer.x, steerY: steer.y,
      flare: input.pressed('flare') || input.pressed('fire') || taps.some((p) => inRect(p, FLARE_BTN)),
      brk: input.pressed('special') || input.pressed('secondary') || taps.some((p) => inRect(p, BREAK_BTN)),
    };
  }

  update(dt: number, input: Input): number | null {
    this.t += dt;
    if (this.s.over) {
      this.hold += dt;
      this.fx.step(dt, this.s, this.t);
      this.game.audio.setJet(this.s.over === 'down' ? 0 : 0.4);
      return this.hold >= END_HOLD ? this.s.evaded : null;
    }
    const before = Math.ceil(R.roundTime - this.s.t);
    this.s = stepEvasion(this.s, this.readInput(input), dt);
    this.fx.handle(this.s, this.t);
    this.fx.step(dt, this.s, this.t);
    const j = this.s.jet;
    const k = Math.min(1, 4 * dt);
    this.cam = { x: this.cam.x + (j.x + j.vx * 0.3 - this.cam.x) * k, y: this.cam.y + (j.y + j.vy * 0.3 - this.cam.y) * k };
    const now = Math.ceil(R.roundTime - this.s.t);
    if (now !== before && now <= 5 && now > 0) this.game.audio.play('uiMove', { pitch: 2 });
    this.game.audio.setJet(0.45 + 0.4 * breakLevel(j));
    return null;
  }

  liveScore(): string {
    return tx('live', { n: this.s.evaded, time: clockText(R.roundTime - this.s.t) });
  }

  dispose(): void {
    this.game.audio.setJet(0);
  }

  /** A tracking missile sits in the bright decoy cone and a flare is ready. */
  private get hot(): boolean {
    const s = this.s;
    return s.charges > 0 && s.missiles.some((m) => flareable(m, s) && decoyChance(tailAngle(s.jet, m.x, m.y)) >= DECOY.tailChance);
  }

  render(ctx: CanvasRenderingContext2D): void {
    const ox = FIELD.cx - this.cam.x;
    const oy = FIELD.cy - this.cam.y;
    ctx.save();
    if (this.fx.shake > 0) ctx.translate((Math.random() - 0.5) * this.fx.shake, (Math.random() - 0.5) * this.fx.shake);
    ctx.save();
    ctx.translate(ox, oy);
    this.world.ground(ctx, this.cam.x, this.cam.y);
    this.fx.launchers.drawSites(ctx, this.t);
    ctx.restore();
    this.world.cloudShadows(ctx, this.cam.x, this.cam.y);
    const j = this.s.jet;
    if (!this.s.over) drawDecoyCone(ctx, j.x + ox, j.y + oy, j.heading, DECOY.range, DECOY.cone, this.hot, this.t);
    ctx.save();
    ctx.translate(ox, oy);
    this.renderAir(ctx);
    ctx.restore();
    this.world.cloudTops(ctx, this.cam.x, this.cam.y);
    if (!this.s.over) this.renderThreats(ctx, j.x + ox, j.y + oy);
    drawTunnel(ctx, gLoad(j), j.x + ox, j.y + oy);
    ctx.restore();
    this.renderHud(ctx);
    this.renderBanners(ctx);
  }

  /** Everything in the air, world coordinates. */
  private renderAir(ctx: CanvasRenderingContext2D): void {
    const s = this.s;
    this.fx.trails.draw(ctx, this.t);
    for (const f of s.flares) drawFlare(ctx, f, this.t);
    for (const m of s.missiles) drawMissile(ctx, m, this.t);
    if (s.over !== 'down') this.renderJet(ctx);
    this.fx.fx.render(ctx);
    this.fx.launchers.drawFighters(ctx, this.t);
    drawPopups(ctx, this.fx.popups);
  }

  private renderJet(ctx: CanvasRenderingContext2D): void {
    const j = this.s.jet;
    const plane = this.game.save.selectedPlane;
    const lvl = breakLevel(j);
    const opts = { bank: clamp(j.omega / JET.turn, -1, 1), t: this.t, throttle: 0.45 + 0.55 * lvl, sweep: 0.25 + 0.65 * lvl, livery: this.game.save.livery[plane] };
    ctx.save();
    ctx.translate(j.x + 24, j.y + 32);
    ctx.rotate(j.heading);
    drawPlaneTop(ctx, plane, 0, 0, JET_SCALE, { ...opts, shadow: true });
    ctx.restore();
    const blink = this.s.grace > 0 && Math.floor(this.t * 16) % 2 === 0;
    ctx.save();
    ctx.translate(j.x, j.y);
    ctx.rotate(j.heading);
    drawPlaneTop(ctx, plane, 0, 0, JET_SCALE, { ...opts, flash: blink && this.fx.hitFlash > 0.4 });
    ctx.restore();
  }

  /** RWR ring around the jet and markers at the screen edge (screen coordinates). */
  private renderThreats(ctx: CanvasRenderingContext2D, jx: number, jy: number): void {
    const s = this.s;
    const j = s.jet;
    const label = (m: { kind: 'sam' | 'aam' }): string => tx(m.kind);
    const live = s.missiles.filter((m) => m.mode === 'tracking');
    const blips: RwrBlip[] = live.map((m) => ({
      bearing: headingTo(j.x, j.y, m.x, m.y), urgency: urgency(m, s), label: label(m), flareable: s.charges > 0 && flareable(m, s),
    }));
    const warned = s.pending.filter((p) => p.warned && s.t < p.at);
    const launches = warned.map((p) => ({ bearing: headingTo(0, 0, p.offset.x, p.offset.y), label: label(p), progress: 1 - (p.at - s.t) / WAVES.warn }));
    drawRwr(ctx, jx, jy, blips, launches, this.t);
    for (const p of warned) drawEdgeMarker(ctx, jx + p.offset.x, jy + p.offset.y, label(p), true, 1 - (p.at - s.t) / WAVES.warn, this.t);
    for (const m of live) drawEdgeMarker(ctx, m.x - j.x + jx, m.y - j.y + jy, label(m), false, 0, this.t);
  }

  private renderHud(ctx: CanvasRenderingContext2D): void {
    const s = this.s;
    const j = s.jet;
    const keys = KEYS[this.device];
    drawHull(ctx, s.hull, R.hull, tx('hull'), tx('wave', { n: Math.max(1, s.wave) }), this.fx.hitFlash);
    drawClock(ctx, R.roundTime - s.t, R.roundTime, clockText(R.roundTime - s.t));
    drawGMeter(ctx, gLoad(j), tx('gUnit', { g: gText(gLoad(j)) }));
    const ready = breakReady(j);
    const active = j.breakT > 0;
    drawBreakButton(ctx, {
      ready, active, cooldown: j.breakCd / JET.breakCooldown, label: tx('breakKey'), key: keys.brk,
      status: active ? tx('active') : ready ? tx('ready') : '',
    }, this.t);
    const hot = this.hot;
    drawFlareButton(ctx, { charges: s.charges, max: R.flareCharges, recharge: s.recharge / R.flareRecharge, hot, label: tx('flareKey'), key: keys.flare }, this.t);
    if (hot && !s.over && Math.sin(this.t * 12) > -0.3) {
      text(ctx, tx('flareNow'), FLARE_BTN.x + FLARE_BTN.w / 2, FLARE_BTN.y - 12, { size: 18, display: true, align: 'center', color: COLORS.green, stroke: 'rgba(0,0,0,0.7)', strokeWidth: 4 });
    }
  }

  private renderBanners(ctx: CanvasRenderingContext2D): void {
    const s = this.s;
    if (s.over) {
      const title = s.over === 'down' ? tx('shotDown') : tx('survived');
      drawBanner(ctx, title, tx('final', { n: s.evaded }), s.over === 'down' ? COLORS.red : COLORS.gold, this.hold, END_HOLD, 330);
      return;
    }
    if (this.fx.wave > 0) drawBanner(ctx, tx('wave', { n: this.fx.wave }), '', COLORS.gold, this.fx.waveAge, WAVE_BANNER, 250);
    if (this.fx.launchFlash > 0 && Math.sin(this.t * 14) > 0) {
      text(ctx, tx('launch'), 640, 128, { size: 16, display: true, align: 'center', color: COLORS.red, stroke: 'rgba(0,0,0,0.7)', strokeWidth: 4, letterSpacing: 2 });
    }
  }
}

export const EVASION: MinigameModule = {
  id: 'evasion',
  medals: EVASION_MEDALS,
  higherIsBetter: true,
  formatScore: (n) => (n === 1 ? tx('scoreOne') : tx('score', { n })),
  rules: () => ({
    lines: [tx('rule1'), tx('rule2'), tx('rule3'), tx('rule4')],
    controls: [tx('ctrlKeys'), tx('ctrlPad'), tx('ctrlTouch')],
  }),
  drawIcon: drawEvasionIcon,
  create: (game) => new EvasionRound(game, Math.floor(Math.random() * 0x7fffffff)),
};
