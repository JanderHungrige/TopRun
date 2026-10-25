import type { Input } from '../../core/input';
import { approach, clamp, easeInOutQuad } from '../../core/math';
import {
  createPushups, PUSHUP_MEDALS, PUSHUP_RULES as R, rivalPhase, rivalReps, stepPushups, tempoClock, winner,
  type PushupInput, type PushupState, type Winner,
} from '../../game/minigames/pushups';
import type { GameContext } from '../../game/state';
import type { Params } from '../../i18n/i18n';
import { mt } from '../../i18n/minigame-text';
import { PUSHUP_TEXT, type PushupKey } from '../../i18n/minigames/pushups';
import { drawScoreboard } from '../../render/minigames/pushups-board';
import { drawPushupCrowd } from '../../render/minigames/pushups-crowd';
import {
  drawBanner, drawBurnoutLabel, drawKeyHints, drawPopups, drawStaminaBar, drawTempoMeter, POPUP_LIFE, RATING_COLOR, type Popup,
} from '../../render/minigames/pushups-hud';
import { drawPushupIcon } from '../../render/minigames/pushups-icon';
import { faceOf, playerPerson } from '../../render/avatars/person';
import { RIVAL_LOOK } from '../../render/minigames/pushups-looks';
import { drawPushupPilot, type PilotLook } from '../../render/minigames/pushups-pilot';
import { drawBoardPosts, drawPushupSet, FLOOR_Y, type PushupSetting } from '../../render/minigames/pushups-set';
import { COLORS } from '../../render/text';
import type { MinigameModule, MinigameRound } from './contract';

// Push-up Challenge (doc 12): maps input onto the pure rules, animates, sounds, holds the result banner.

const END_HOLD = 2.4;
const PLAYER_X = 120;
const RIVAL_X = 1160;
const tx = (k: PushupKey, p?: Params): string => mt(PUSHUP_TEXT, k, p);
const RATING_KEY = { clean: 'clean', fast: 'fast', slow: 'slow' } as const satisfies Record<string, PushupKey>;
const BANNER: Readonly<Record<Winner, { key: PushupKey; color: string }>> = {
  player: { key: 'win', color: COLORS.gold },
  rival: { key: 'lose', color: COLORS.red },
  tie: { key: 'tie', color: COLORS.cyan },
};

/** The rival's body through one scheduled rep: down, a short hold, back up. */
function rivalDepth(f: number): number {
  if (f < 0.45) return easeInOutQuad(f / 0.45);
  if (f < 0.6) return 1;
  return 1 - easeInOutQuad((f - 0.6) / 0.4);
}

function readInput(input: Input): PushupInput {
  const taps = input.taps.filter((p) => p.y > 56);
  return {
    left: input.pressed('left') || taps.some((p) => p.x < 640),
    right: input.pressed('right') || taps.some((p) => p.x >= 640),
  };
}

class PushupRound implements MinigameRound {
  private s: PushupState;
  private readonly setting: PushupSetting;
  private readonly look: PilotLook;
  private readonly you: string;
  private t = 0;
  private hold = 0;
  private depth = 0;
  private collapse = 0;
  private rivalCollapse = 0;
  private cheer = 0;
  private flashLeft = 0;
  private flashRight = 0;
  private popups: Popup[] = [];

  constructor(private readonly game: GameContext, seed: number) {
    this.s = createPushups(seed);
    this.setting = seed % 2 === 0 ? 'gym' : 'beach';
    this.look = playerPerson(faceOf(game.profile));
    this.you = game.profile?.callsign ?? tx('you');
  }

  update(dt: number, input: Input): number | null {
    this.t += dt;
    const prev = this.s;
    const inp = readInput(input);
    this.s = stepPushups(prev, inp, dt);
    this.effects(prev, inp);
    this.animate(dt);
    if (!this.s.over) return null;
    if (this.hold === 0) this.game.audio.play(winner(this.s) === 'player' ? 'powerup' : 'denied');
    this.hold += dt;
    return this.hold >= END_HOLD ? this.s.reps : null;
  }

  private effects(prev: PushupState, inp: PushupInput): void {
    const s = this.s;
    const audio = this.game.audio;
    if (inp.left) this.flashLeft = 1;
    if (inp.right) this.flashRight = 1;
    if (s.reps > prev.reps && s.last) {
      const r = s.last.rating;
      this.popup('+1', RATING_COLOR[r], 410, 440, 34);
      this.popup(tx(RATING_KEY[r]), RATING_COLOR[r], 410, 474, 20);
      if (r === 'fast') audio.play('hit', { pan: -0.4 });
      else audio.play('uiMove', { pan: -0.4, pitch: r === 'slow' ? 0.8 : 1 + Math.min(12, s.streak) * 0.05 });
      if (r === 'clean') this.cheer = Math.max(this.cheer, 0.55);
    }
    if (s.burnout > 0 && prev.burnout === 0) audio.play('playerHit', { pan: -0.4 });
    if (rivalReps(s) > rivalReps(prev)) audio.play('uiMove', { pan: 0.5, pitch: 0.7, volume: 0.3 });
    const before = Math.ceil(R.roundTime - prev.time);
    const now = Math.ceil(R.roundTime - s.time);
    if (now !== before && now <= 5 && now > 0) audio.play('uiMove', { pitch: 2 });
  }

  private popup(text: string, color: string, x: number, y: number, size: number): void {
    this.popups.push({ text, color, x, y, age: 0, size });
  }

  private animate(dt: number): void {
    const s = this.s;
    const w = s.over ? winner(s) : null;
    this.depth += ((s.down && !s.over ? 1 : 0) - this.depth) * Math.min(1, dt * 16);
    const flop = s.burnout > 0 || w === 'rival';
    this.collapse = approach(this.collapse, flop ? 1 : 0, dt * (flop ? 6 : 2.5));
    this.rivalCollapse = approach(this.rivalCollapse, w === 'player' ? 1 : 0, dt * 6);
    const hurry = R.roundTime - s.time <= 5 ? 0.65 : 0;
    this.cheer = Math.max(hurry, w === 'player' ? 1 : 0, this.cheer - dt * 1.1);
    this.flashLeft = Math.max(0, this.flashLeft - dt * 5);
    this.flashRight = Math.max(0, this.flashRight - dt * 5);
    for (const p of this.popups) p.age += dt;
    this.popups = this.popups.filter((p) => p.age < POPUP_LIFE);
  }

  liveScore(): string {
    return PUSHUPS.formatScore(this.s.reps);
  }

  render(ctx: CanvasRenderingContext2D): void {
    const s = this.s;
    drawPushupSet(ctx, this.setting, this.t);
    drawBoardPosts(ctx, this.setting);
    drawPushupCrowd(ctx, this.setting, this.cheer, this.t);
    drawScoreboard(ctx, {
      you: this.you, reps: s.reps, rival: tx('rival'), rivalReps: rivalReps(s), left: R.roundTime - s.time, roundTime: R.roundTime, t: this.t,
    });
    const rivalD = s.over ? 0 : rivalDepth(rivalPhase(s));
    const w = s.over ? winner(s) : null;
    drawPushupPilot(ctx, this.look, {
      depth: this.depth, collapse: this.collapse, strain: clamp(1 - s.stamina / 50, 0, 1), t: this.t, grin: w === 'player',
    }, PLAYER_X, FLOOR_Y, 1);
    drawPushupPilot(ctx, RIVAL_LOOK, {
      depth: rivalD, collapse: this.rivalCollapse, strain: (s.time / R.roundTime) * 0.75, t: this.t + 1.3, grin: w === 'rival',
    }, RIVAL_X, FLOOR_Y, -1);
    if (s.burnout > 0) drawBurnoutLabel(ctx, tx('burnout'), 300, 500, this.t);
    this.renderHud(ctx);
    drawPopups(ctx, this.popups);
    if (s.over) {
      const b = BANNER[winner(s)];
      drawBanner(ctx, tx(b.key), `${s.reps} : ${rivalReps(s)}`, b.color, this.hold);
    }
  }

  private renderHud(ctx: CanvasRenderingContext2D): void {
    const s = this.s;
    drawTempoMeter(ctx, {
      x: 80, y: 646, w: 440, label: tx('tempo'), zone: { min: R.zoneMin, max: R.zoneMax },
      clock: s.burnout > 0 ? null : tempoClock(s), last: s.last, time: s.time, t: this.t,
    });
    drawStaminaBar(ctx, {
      x: 80, y: 694, w: 440, label: tx('stamina'), hint: tx('recover'), burnoutLabel: tx('burnout'),
      value: s.stamina / R.staminaMax, burnout: s.burnout > 0 ? 1 - s.burnout / R.burnoutTime : null, t: this.t,
    });
    drawKeyHints(ctx, {
      x: 760, y: 646, down: tx('down'), up: tx('up'), nextDown: s.over || s.burnout > 0 ? null : !s.down, flashLeft: this.flashLeft, flashRight: this.flashRight, t: this.t,
    });
  }
}

export const PUSHUPS: MinigameModule = {
  id: 'pushups',
  medals: PUSHUP_MEDALS,
  higherIsBetter: true,
  formatScore: (n) => (n === 1 ? tx('scoreOne') : tx('score', { n })),
  rules: () => ({
    lines: [tx('rule1'), tx('rule2'), tx('rule3'), tx('rule4')],
    controls: [tx('ctrlKeys'), tx('ctrlPad'), tx('ctrlTouch')],
  }),
  drawIcon: drawPushupIcon,
  create: (game) => new PushupRound(game, Math.floor(Math.random() * 0x7fffffff)),
};
