import type { Input } from '../../core/input';
import { createSonar, ping, SONAR_GRID, SONAR_MEDALS, SONAR_RULES, subPoints, torpedo, type Cell, type SonarState } from '../../game/minigames/sonar';
import type { GameContext } from '../../game/state';
import type { Params } from '../../i18n/i18n';
import { mt } from '../../i18n/minigame-text';
import { SONAR_TEXT, type SonarKey } from '../../i18n/minigames/sonar';
import { CHART, cellAtPoint, drawChart, drawCursor, drawPings, drawSinking, drawSonarIcon, drawStatus } from '../../render/minigames/sonar';
import { drawButton, hit, type Button } from '../../ui/widgets';
import type { MinigameModule, MinigameRound } from './contract';

// SONAR HUNT (doc 88): find the hidden sub with pings, sink it with a torpedo. Rules and points:
// game/minigames/sonar.ts.

const tx = (k: SonarKey, p?: Params): string => mt(SONAR_TEXT, k, p);
const PING_BTN: Button = { id: 'ping', label: '', x: CHART.x + CHART.w / 2 - 250, y: 670, w: 230, h: 42 };
const TORP_BTN: Button = { id: 'torpedo', label: '', x: CHART.x + CHART.w / 2 + 20, y: 670, w: 230, h: 42 };

class SonarRound implements MinigameRound {
  private s: SonarState;
  private cursor: Cell = { x: 4, y: 3 };
  private flash: { text: string; age: number } | null = null;
  private sinking: { at: Cell; age: number } | null = null;
  private t = 0;
  private endIn = -1;

  constructor(private readonly game: GameContext) {
    this.s = createSonar(Math.floor(Math.random() * 1e6));
  }

  update(dt: number, input: Input): number | null {
    this.t += dt;
    if (this.flash) this.flash = this.flash.age > 1.4 ? null : { ...this.flash, age: this.flash.age + dt };
    if (this.sinking) this.sinking = this.sinking.age > 1 ? null : { ...this.sinking, age: this.sinking.age + dt };
    if (this.endIn >= 0) {
      this.endIn -= dt;
      return this.endIn <= 0 ? this.s.points : null;
    }
    this.move(input);
    for (const p of input.taps) {
      if (hit(p, PING_BTN)) this.doPing();
      else if (hit(p, TORP_BTN)) this.doTorpedo();
      else this.cursor = cellAtPoint(p) ?? this.cursor;
    }
    if (input.pressed('fire')) this.doPing();
    if (input.pressed('flare') || input.pressed('weaponSwitch')) this.doTorpedo();
    if (this.s.over && this.endIn < 0) this.endIn = 1.6;
    return null;
  }

  private move(input: Input): void {
    const dx = (input.pressed('right') ? 1 : 0) - (input.pressed('left') ? 1 : 0);
    const dy = (input.pressed('down') ? 1 : 0) - (input.pressed('up') ? 1 : 0);
    this.cursor = {
      x: Math.max(0, Math.min(SONAR_GRID.w - 1, this.cursor.x + dx)),
      y: Math.max(0, Math.min(SONAR_GRID.h - 1, this.cursor.y + dy)),
    };
  }

  private doPing(): void {
    const r = ping(this.s, this.cursor);
    this.s = r.state;
    this.game.audio.play('sonar', { volume: 0.7 });
    if (this.s.slipped) this.flash = { text: tx('slipped'), age: 0 };
  }

  private doTorpedo(): void {
    const before = this.s;
    const r = torpedo(this.s, this.cursor);
    this.s = r.state;
    if (r.event === 'miss') {
      this.game.audio.play('splash', { volume: 0.6 });
      this.flash = { text: tx('miss'), age: 0 };
    }
    if (r.event === 'sunk') {
      this.game.audio.play('explosionLarge', { volume: 0.7 });
      this.sinking = { at: this.cursor, age: 0 };
      this.flash = { text: tx('sunk', { n: subPoints(before.pingsNow, before.missesNow) }), age: 0 };
    }
  }

  liveScore(): string {
    return tx('score', { n: this.s.points });
  }

  render(ctx: CanvasRenderingContext2D): void {
    drawChart(ctx, this.t);
    drawPings(ctx, this.s.pings, this.t);
    if (this.sinking) drawSinking(ctx, this.sinking.at, this.sinking.age);
    drawCursor(ctx, this.cursor, this.t);
    const sub = tx('sub', { n: Math.min(SONAR_RULES.subs, this.s.sunk + 1), total: SONAR_RULES.subs });
    drawStatus(ctx, sub, tx('torpedoes', { n: this.s.torpedoes }), this.flash?.text ?? null);
    drawButton(ctx, { ...PING_BTN, label: tx('ping'), hint: 'SPACE' }, false, this.t);
    drawButton(ctx, { ...TORP_BTN, label: tx('torpedo'), primary: true, hint: 'F' }, false, this.t);
  }
}

export const SONAR: MinigameModule = {
  id: 'sonar',
  medals: SONAR_MEDALS,
  higherIsBetter: true,
  formatScore: (n) => tx('score', { n }),
  rules: () => ({ lines: [tx('rule1'), tx('rule2'), tx('rule3')], controls: [tx('ctrlKeys'), tx('ctrlPad'), tx('ctrlTouch')] }),
  drawIcon: drawSonarIcon,
  create: (game) => new SonarRound(game),
};
