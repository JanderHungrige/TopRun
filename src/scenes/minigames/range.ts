import type { Input } from '../../core/input';
import { createRange, RANGE, RANGE_MEDALS, rangeOver, shoot, SPOTS, stepRange, type RangeState } from '../../game/minigames/range';
import type { GameContext } from '../../game/state';
import type { Params } from '../../i18n/i18n';
import { mt } from '../../i18n/minigame-text';
import { RANGE_TEXT, type RangeKey } from '../../i18n/minigames/range';
import { drawBerm, drawBoard, drawCrosshair, drawGun, drawRangeBack, drawRangeIcon } from '../../render/minigames/range';
import { COLORS, text } from '../../render/text';
import type { MinigameModule, MinigameRound } from './contract';

// FIRING RANGE (doc 90): a minute at the mech gunnery range — aim, fire at the walker boards, spare the monkeys. Timing
// and points: game/minigames/range.ts.

const tx = (k: RangeKey, p?: Params): string => mt(RANGE_TEXT, k, p);
const AIM_SPEED = 720;
/** The far row stands behind the first berm, the near row behind the second. */
const FAR = SPOTS.filter((s) => s.s < 0.8).map((_, i) => i);

class RangeRound implements MinigameRound {
  private s: RangeState = createRange(Math.floor(Math.random() * 1e6));
  private aim = { x: 640, y: 380 };
  private flash = 0;
  private popups: Array<{ text: string; x: number; y: number; age: number; color: string }> = [];
  private t = 0;

  constructor(private readonly game: GameContext) {}

  update(dt: number, input: Input): number | null {
    this.t += dt;
    this.flash = Math.max(0, this.flash - dt);
    this.s = stepRange(this.s, dt);
    const v = input.moveVector();
    this.aim = { x: Math.max(20, Math.min(1260, this.aim.x + v.x * AIM_SPEED * dt)), y: Math.max(90, Math.min(700, this.aim.y + v.y * AIM_SPEED * dt)) };
    if (input.device === 'mouse') this.aim = { x: input.pointer.x, y: input.pointer.y };
    for (const p of input.taps) {
      this.aim = { x: p.x, y: p.y };
      this.fire();
    }
    if (input.pressed('fire')) this.fire();
    this.popups = this.popups.map((p) => ({ ...p, age: p.age + dt, y: p.y - dt * 40 })).filter((p) => p.age < 0.9);
    return rangeOver(this.s) ? this.s.points : null;
  }

  private fire(): void {
    const r = shoot(this.s, this.aim);
    this.s = r.state;
    this.flash = 0.08;
    this.game.audio.play('gun', { volume: 0.6 });
    const pop = (label: string, color: string): void => { this.popups.push({ text: label, x: this.aim.x, y: this.aim.y - 40, age: 0, color }); };
    if (r.result.kind === 'foe') {
      pop(tx('hit', { n: r.result.points }), COLORS.gold);
      this.game.audio.play('hit');
    } else if (r.result.kind === 'friend') {
      pop(tx('friend', { n: r.result.points }), COLORS.red);
      this.game.audio.play('denied');
    }
  }

  liveScore(): string {
    return tx('score', { n: this.s.points });
  }

  render(ctx: CanvasRenderingContext2D): void {
    drawRangeBack(ctx, this.t);
    for (const b of this.s.boards) if (FAR.includes(b.spot)) drawBoard(ctx, b, this.s.t);
    drawBerm(ctx, 360, 0.75);
    for (const b of this.s.boards) if (!FAR.includes(b.spot)) drawBoard(ctx, b, this.s.t);
    drawBerm(ctx, 545, 1);
    drawGun(ctx, this.aim, this.flash);
    drawCrosshair(ctx, this.aim.x, this.aim.y);
    for (const p of this.popups) text(ctx, p.text, p.x, p.y, { size: 22, display: true, align: 'center', color: p.color, shadow: true, alpha: 1 - p.age });
    text(ctx, tx('time', { n: Math.ceil(RANGE.length - this.s.t) }), 24, 96, { size: 20, display: true, color: COLORS.ink, shadow: true });
    if (this.s.streak > 1) text(ctx, tx('streak', { n: this.s.streak }), 24, 126, { size: 18, display: true, color: COLORS.gold, shadow: true });
  }
}

export const RANGE_GAME: MinigameModule = {
  id: 'range',
  medals: RANGE_MEDALS,
  higherIsBetter: true,
  formatScore: (n) => tx('score', { n }),
  rules: () => ({ lines: [tx('rule1'), tx('rule2'), tx('rule3')], controls: [tx('ctrlKeys'), tx('ctrlPad'), tx('ctrlTouch')] }),
  drawIcon: drawRangeIcon,
  create: (game) => new RangeRound(game),
};
