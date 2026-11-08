import type { Input } from '../../core/input';
import { createDocking, DOCK, DOCKING_MEDALS, speedOf, stepDocking, type DockState } from '../../game/minigames/docking';
import type { GameContext } from '../../game/state';
import type { Params } from '../../i18n/i18n';
import { mt } from '../../i18n/minigame-text';
import { DOCKING_TEXT, type DockingKey } from '../../i18n/minigames/docking';
import { drawDockHud, drawDockingIcon, drawShuttle, drawSpace, drawStation } from '../../render/minigames/docking';
import { COLORS, text } from '../../render/text';
import type { MinigameModule, MinigameRound } from './contract';

// STATION DOCKING (doc 89): thrusters, inertia and a port to touch slowly and centred, three times. Physics and points:
// game/minigames/docking.ts.

const tx = (k: DockingKey, p?: Params): string => mt(DOCKING_TEXT, k, p);

class DockingRound implements MinigameRound {
  private s: DockState = createDocking();
  private thrust = { x: 0, y: 0 };
  private t = 0;

  constructor(private readonly game: GameContext) {}

  update(dt: number, input: Input): number | null {
    this.t += dt;
    this.thrust = this.readThrust(input);
    const before = this.s;
    this.s = stepDocking(this.s, this.thrust, dt);
    if (before.phase === 'fly' && this.s.phase !== 'fly') this.react();
    if (this.s.fuel > 0 && (this.thrust.x || this.thrust.y) && Math.random() < dt * 6) this.game.audio.play('rocket', { volume: 0.15 });
    return this.s.over ? this.s.points : null;
  }

  /** Arrows / stick, or holding the pointer beside the shuttle: push away from that side. */
  private readThrust(input: Input): { x: number; y: number } {
    const v = input.moveVector();
    const p = input.pointer;
    if (p.down && input.device === 'touch') {
      const dx = this.s.x - p.x;
      const dy = this.s.y - p.y;
      const d = Math.hypot(dx, dy) || 1;
      return { x: Math.abs(dx / d) > 0.4 ? Math.sign(dx) : 0, y: Math.abs(dy / d) > 0.4 ? Math.sign(dy) : 0 };
    }
    return { x: Math.sign(Math.round(v.x)), y: Math.sign(Math.round(v.y)) };
  }

  private react(): void {
    const a = this.game.audio;
    if (this.s.phase === 'docked') a.play('cash');
    else if (this.s.phase === 'crashed') a.play('playerHit');
    else a.play('denied');
  }

  liveScore(): string {
    return tx('score', { n: this.s.points });
  }

  render(ctx: CanvasRenderingContext2D): void {
    drawSpace(ctx, this.t);
    drawStation(ctx, this.s.portY, this.t);
    drawShuttle(ctx, this.s, this.thrust, this.t);
    drawDockHud(ctx, this.s, {
      round: tx('round', { n: this.s.round + 1, total: DOCK.rounds }),
      speed: tx('speed', { n: Math.round(speedOf(this.s)) }),
      fuel: tx('fuel'),
      time: tx('time', { n: Math.max(0, Math.ceil(DOCK.time - this.s.t)) }),
    });
    const last = this.s.results[this.s.results.length - 1] ?? 0;
    const msg = this.s.phase === 'docked' ? tx('docked', { n: last }) : this.s.phase === 'crashed' ? tx('crashed') : this.s.phase === 'timeout' ? tx('timeout') : null;
    if (msg) text(ctx, msg, 640, 380, { size: 30, display: true, align: 'center', color: this.s.phase === 'docked' ? COLORS.gold : COLORS.red, shadow: true });
  }
}

export const DOCKING: MinigameModule = {
  id: 'docking',
  medals: DOCKING_MEDALS,
  higherIsBetter: true,
  formatScore: (n) => tx('score', { n }),
  rules: () => ({ lines: [tx('rule1'), tx('rule2'), tx('rule3')], controls: [tx('ctrlKeys'), tx('ctrlPad'), tx('ctrlTouch')] }),
  drawIcon: drawDockingIcon,
  create: (game) => new DockingRound(game),
};
