import type { Input } from '../../core/input';
import type { MinigameId } from '../../data/minigames';
import type { Medals } from '../../game/minigames/core';
import type { GameContext } from '../../game/state';

// What a minigame implements (doc 10). The shell (shell.ts) does the rules card, the 3-2-1
// countdown, pause, the result card and saving the personal best.

/** One running round. */
export interface MinigameRound {
  /** One fixed 1/60 s tick. Return the final score once the round is over, otherwise null. */
  update(dt: number, input: Input): number | null;
  /** Draws the whole 1280×720 field. The shell draws its top bar (y < 56) on top. */
  render(ctx: CanvasRenderingContext2D): void;
  /** Live score for the top bar, already formatted. */
  liveScore(): string;
  /** Stop any sounds (pause, quit, round over). */
  dispose?(): void;
}

export interface MinigameModule {
  id: MinigameId;
  /** Medal limits; with higherIsBetter = false lower scores (times) are better. */
  medals: Medals;
  higherIsBetter: boolean;
  /** Localized, e.g. "42 push-ups". */
  formatScore(score: number): string;
  /** Localized rules card text. */
  rules(): { lines: readonly string[]; controls: readonly string[] };
  /** Hub / offer card icon, centred on (0, 0), within ±40 px. */
  drawIcon(ctx: CanvasRenderingContext2D, t: number): void;
  create(game: GameContext): MinigameRound;
}
