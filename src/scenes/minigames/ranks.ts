import type { Input } from '../../core/input';
import { CHARTS, type Chart } from '../../data/rank-quiz';
import { answerPoints, makeQuiz, RANK_QUIZ, RANKS_MEDALS, type Question } from '../../game/minigames/ranks';
import type { GameContext } from '../../game/state';
import { ANSWERS, drawRanksIcon, drawRoom, PICK_CARDS, READY } from '../../render/minigames/ranks';
import type { MinigameModule, MinigameRound } from './contract';
import { Chooser, inBox, renderPick, renderQuiz, renderStudy, tx } from './ranks-phases';

// Rank Quiz (doc 41): pick one of four charts, study all its insignia, then name five of them against a 12-second
// clock; after each answer the verdict and the rank's name, then the next (CONFIRM / tap, or by itself). Questions
// and points: game/minigames/ranks.ts; the screens: ranks-phases.ts.

/** Seconds the verdict stays up before the next question; CONFIRM / tap skips after SKIP_AFTER. */
const FEEDBACK = 1.8;
const SKIP_AFTER = 0.3;

type Phase = 'pick' | 'study' | 'quiz';

class RankQuizRound implements MinigameRound {
  private phase: Phase = 'pick';
  private chart: Chart = 'usn';
  private quiz: Question[] = [];
  private n = 0;
  private left: number = RANK_QUIZ.time;
  private points = 0;
  private picked: number | null = null;
  private shown = 0;
  private t = 0;
  private readonly cards: Chooser;
  private readonly answers: Chooser;

  constructor(private readonly game: GameContext, private readonly seed: number) {
    this.cards = new Chooser(game, PICK_CARDS.length);
    this.answers = new Chooser(game, 1);
  }

  update(dt: number, input: Input): number | null {
    this.t += dt;
    switch (this.phase) {
      case 'pick': return this.pick(input);
      case 'study': return this.study(input);
      case 'quiz': return this.ask(dt, input);
      default: throw new Error(`unhandled: ${this.phase satisfies never}`);
    }
  }

  private pick(input: Input): null {
    const i = this.cards.step(input, PICK_CARDS);
    const chart = i === null ? undefined : CHARTS[i];
    if (!chart) return null;
    this.chart = chart;
    this.quiz = makeQuiz(chart, this.seed);
    this.phase = 'study';
    this.game.audio.play('uiSelect');
    return null;
  }

  private study(input: Input): null {
    if (!input.pressed('confirm') && !input.taps.some((p) => inBox(p, READY))) return null;
    this.phase = 'quiz';
    this.left = RANK_QUIZ.time;
    this.game.audio.play('uiSelect');
    return null;
  }

  private ask(dt: number, input: Input): number | null {
    const q = this.quiz[this.n];
    if (!q) return this.points;
    if (this.picked !== null) return this.afterAnswer(dt, input);
    this.left -= dt;
    if (this.left <= 0) {
      this.answer(q, -1);
      return null;
    }
    const i = this.answers.step(input, ANSWERS);
    if (i !== null) this.answer(q, i);
    return null;
  }

  private answer(q: Question, i: number): void {
    const right = i === q.answer;
    this.points += answerPoints(right, this.left);
    this.picked = i;
    this.shown = 0;
    this.game.audio.play(right ? 'pickup' : 'denied');
  }

  private afterAnswer(dt: number, input: Input): number | null {
    this.shown += dt;
    const skip = this.shown >= SKIP_AFTER && (input.pressed('confirm') || input.taps.length > 0);
    if (!skip && this.shown < FEEDBACK) return null;
    this.n++;
    this.picked = null;
    this.left = RANK_QUIZ.time;
    this.answers.sel = 0;
    return this.n >= this.quiz.length ? this.points : null;
  }

  liveScore(): string {
    return tx('score', { n: this.points });
  }

  render(ctx: CanvasRenderingContext2D): void {
    drawRoom(ctx);
    switch (this.phase) {
      case 'pick': return renderPick(ctx, this.cards.sel, this.t);
      case 'study': return renderStudy(ctx, this.chart, this.t);
      case 'quiz': {
        const q = this.quiz[this.n];
        if (!q) return;
        return renderQuiz(ctx, { chart: this.chart, q, n: this.n, sel: this.answers.sel, picked: this.picked, left: this.left, t: this.t });
      }
      default: throw new Error(`unhandled: ${this.phase satisfies never}`);
    }
  }
}

export const RANKS: MinigameModule = {
  id: 'ranks',
  medals: RANKS_MEDALS,
  higherIsBetter: true,
  formatScore: (n) => tx('score', { n }),
  rules: () => ({
    lines: [tx('rule1'), tx('rule2'), tx('rule3'), tx('rule4')],
    controls: [tx('ctrlKeys'), tx('ctrlPad'), tx('ctrlTouch')],
  }),
  drawIcon: drawRanksIcon,
  create: (game) => new RankQuizRound(game, Math.floor(Math.random() * 0x7fffffff)),
};
