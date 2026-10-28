import type { Input } from '../../core/input';
import type { Vec } from '../../core/math';
import {
  beatTimes, createHighFive, HIGHFIVE_MEDALS, highFiveOver, repAt, stepHighFive, type Beat, type BeatKind, type HighFiveState, type Verdict,
} from '../../game/minigames/highfive';
import type { GameContext } from '../../game/state';
import type { Params } from '../../i18n/i18n';
import { mt } from '../../i18n/minigame-text';
import { HIGHFIVE_TEXT, type HighFiveKey } from '../../i18n/minigames/highfive';
import { faceOf } from '../../render/avatars/person';
import { drawDeck, drawHighFiveIcon } from '../../render/minigames/highfive-deck';
import { drawClap, drawCue, drawPips, drawPopups, VERDICT_COLOR, type Popup } from '../../render/minigames/highfive-hud';
import { drawFigure, dukeLook, figureAt, meetPoint, pilotLook } from '../../render/minigames/highfive-poses';
import type { PersonLook } from '../../render/people';
import type { MinigameModule, MinigameRound } from './contract';

// High Five (doc 42): eight runs at Duke on the flight deck, three beats each — JUMP, UP HIGH, DOWN LOW — on one
// button; a ring closes onto where the hands meet. Timing and points: game/minigames/highfive.ts.

const tx = (k: HighFiveKey, p?: Params): string => mt(HIGHFIVE_TEXT, k, p);
/** Seconds the cue ring needs to close. */
const CUE = 0.6;
const BEATS = beatTimes();
const dirOf = (rep: number): 1 | -1 => (rep % 2 === 0 ? 1 : -1);
const LABEL: Readonly<Record<BeatKind, HighFiveKey>> = { jump: 'jump', high: 'high', low: 'low' };
const VERDICT: Readonly<Record<Verdict, HighFiveKey>> = { perfect: 'perfect', good: 'good', miss: 'miss' };

class HighFiveRound implements MinigameRound {
  private s: HighFiveState = createHighFive();
  private readonly pilot: PersonLook;
  private readonly duke = dukeLook();
  private popups: Popup[] = [];
  private claps: Array<{ at: Vec; age: number }> = [];
  private t = 0;

  constructor(private readonly game: GameContext) {
    this.pilot = pilotLook(faceOf(game.profile));
  }

  update(dt: number, input: Input): number | null {
    this.t += dt;
    const pressed = input.pressed('confirm') || input.pressed('fire') || input.taps.length > 0;
    const r = stepHighFive(this.s, dt, pressed);
    this.s = r.state;
    if (r.judged) this.react(r.judged.beat, r.judged.verdict);
    this.popups = this.popups.map((p) => ({ ...p, age: p.age + dt })).filter((p) => p.age < 0.8);
    this.claps = this.claps.map((c) => ({ ...c, age: c.age + dt })).filter((c) => c.age < 0.3);
    return highFiveOver(this.s) ? this.s.points : null;
  }

  private react(beat: Beat, verdict: Verdict): void {
    const at = meetPoint(beat.kind, dirOf(beat.rep));
    this.popups.push({ text: tx(VERDICT[verdict]), color: VERDICT_COLOR[verdict], at, age: 0 });
    if (verdict === 'miss') return this.game.audio.play('uiBack', { volume: 0.5 });
    if (beat.kind !== 'jump') this.claps.push({ at, age: 0 });
    this.game.audio.play(beat.kind === 'jump' ? 'uiMove' : 'clap', { pitch: verdict === 'perfect' ? 1.1 : 1 });
  }

  liveScore(): string {
    return tx('score', { n: this.s.points });
  }

  render(ctx: CanvasRenderingContext2D): void {
    drawDeck(ctx);
    const { rep, f } = repAt(this.s.t);
    const dir = dirOf(rep);
    drawFigure(ctx, this.duke, figureAt(f, dir === 1 ? -1 : 1, true), this.t);
    drawFigure(ctx, this.pilot, figureAt(f, dir, true), this.t);
    const next = BEATS[this.s.next];
    if (next) {
      const k = (next.at - this.s.t) / CUE;
      if (k <= 1 && k >= -0.25) drawCue(ctx, meetPoint(next.kind, dirOf(next.rep)), k, tx(LABEL[next.kind]));
    }
    for (const c of this.claps) drawClap(ctx, c.at, c.age);
    drawPopups(ctx, this.popups);
    drawPips(ctx, this.s.verdicts, BEATS.length, tx('rep', { n: Math.min(rep + 1, 8), total: 8 }));
  }
}

export const HIGHFIVE: MinigameModule = {
  id: 'highfive',
  medals: HIGHFIVE_MEDALS,
  higherIsBetter: true,
  formatScore: (n) => tx('score', { n }),
  rules: () => ({
    lines: [tx('rule1'), tx('rule2'), tx('rule3'), tx('rule4')],
    controls: [tx('ctrlKeys'), tx('ctrlPad'), tx('ctrlTouch')],
  }),
  drawIcon: drawHighFiveIcon,
  create: (game) => new HighFiveRound(game),
};
