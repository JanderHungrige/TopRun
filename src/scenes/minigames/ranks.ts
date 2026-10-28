import type { Input } from '../../core/input';
import type { Vec } from '../../core/math';
import type { Force } from '../../data/rank-quiz';
import { answerPoints, makeQuiz, RANK_QUIZ, RANKS_MEDALS, rankAt, type Question } from '../../game/minigames/ranks';
import type { GameContext } from '../../game/state';
import type { Params } from '../../i18n/i18n';
import { mt } from '../../i18n/minigame-text';
import { RANKS_TEXT, type RanksKey } from '../../i18n/minigames/ranks';
import {
  answerBoxes, drawAnswer, drawBoard, drawFact, drawRanksIcon, drawRoom, drawTimer, type AnswerState,
} from '../../render/minigames/ranks';
import type { MinigameModule, MinigameRound } from './contract';

// Rank Quiz (doc 41): ten seeded questions against a 12-second clock; after each answer the verdict and the fact
// behind it, then the next question (CONFIRM / tap, or by itself). Questions and points: game/minigames/ranks.ts.

/** Seconds the verdict and fact stay up before the next question; CONFIRM / tap skips after SKIP_AFTER. */
const FEEDBACK = 2.6;
const SKIP_AFTER = 0.3;

const tx = (k: RanksKey, p?: Params): string => mt(RANKS_TEXT, k, p);
const forceName = (f: Force): string => tx(f);
const inBox = (p: Vec, b: { x: number; y: number; w: number; h: number }): boolean => p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h;

function questionText(q: Question): string {
  const rank = rankAt(q.subject).name;
  const force = forceName(q.subject.force);
  const other = q.target ? forceName(q.target) : '';
  switch (q.kind) {
    case 'higher': return tx('qHigher', { force });
    case 'next': return tx('qNext', { force, rank });
    case 'grade': return tx('qGrade', { force, rank });
    case 'usEquiv': return tx('qUsEquiv', { force, rank, other });
    case 'natoEquiv': return tx('qNatoEquiv', { force, rank, other });
    case 'code': return tx('qCode', { force, rank });
    default: throw new Error(`unhandled: ${q.kind satisfies never}`);
  }
}

function factText(q: Question): string {
  const a = rankAt(q.subject);
  const b = q.partner ? rankAt(q.partner) : null;
  const force = forceName(q.subject.force);
  switch (q.kind) {
    case 'higher': {
      const high = q.partner && q.partner.index > q.subject.index ? b : a;
      return tx('fHigher', { high: high?.name ?? '', low: (high === a ? b : a)?.name ?? '' });
    }
    case 'next': return tx('fNext', { force, rank: a.name, next: b?.name ?? '' });
    case 'grade': return tx('fGrade', { rank: a.name, grade: a.grade ?? '' });
    case 'code': return tx('fCode', { rank: a.name, code: a.nato ?? '' });
    case 'usEquiv':
    case 'natoEquiv': {
      const tag = (f: Force | null, r: typeof a | null): string => `${f ? forceName(f) : ''}, ${(q.kind === 'usEquiv' ? r?.grade : r?.nato) ?? ''}`;
      return tx('fEquiv', { rank: a.name, a: tag(q.subject.force, a), other: b?.name ?? '', b: tag(q.target, b) });
    }
    default: throw new Error(`unhandled: ${q.kind satisfies never}`);
  }
}

class RankQuizRound implements MinigameRound {
  private readonly quiz: Question[];
  private n = 0;
  private sel = 0;
  private left: number = RANK_QUIZ.time;
  private points = 0;
  /** The option picked (−1: time ran out) while the verdict shows; null while the question is open. */
  private picked: number | null = null;
  private shown = 0;
  private t = 0;
  private pointer: Vec;

  constructor(private readonly game: GameContext, seed: number) {
    this.quiz = makeQuiz(seed);
    this.pointer = { x: game.input.pointer.x, y: game.input.pointer.y };
  }

  private get q(): Question | undefined {
    return this.quiz[this.n];
  }

  update(dt: number, input: Input): number | null {
    this.t += dt;
    const q = this.q;
    if (!q) return this.points;
    if (this.picked !== null) return this.afterAnswer(dt, input);
    this.left -= dt;
    if (this.left <= 0) {
      this.answer(q, -1);
      return null;
    }
    this.choose(q, input);
    return null;
  }

  private choose(q: Question, input: Input): void {
    const boxes = answerBoxes(q.options.length);
    const cols = 2;
    const move = (d: number): void => {
      const next = this.sel + d;
      if (next < 0 || next >= boxes.length) return;
      this.sel = next;
      this.game.audio.play('uiMove');
    };
    if (input.pressed('left') && this.sel % cols === 1) move(-1);
    if (input.pressed('right') && this.sel % cols === 0) move(1);
    if (input.pressed('up') && this.sel >= cols) move(-cols);
    if (input.pressed('down') && this.sel + cols < boxes.length) move(cols);
    const p = input.pointer;
    if (input.device !== 'touch' && (p.x !== this.pointer.x || p.y !== this.pointer.y)) {
      const i = boxes.findIndex((b) => inBox(p, b));
      if (i >= 0 && i !== this.sel) move(i - this.sel);
    }
    this.pointer = { x: p.x, y: p.y };
    for (const tap of input.taps) {
      const i = boxes.findIndex((b) => inBox(tap, b));
      if (i >= 0) return this.answer(q, i);
    }
    if (input.pressed('confirm')) this.answer(q, this.sel);
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
    this.sel = 0;
    return this.n >= this.quiz.length ? this.points : null;
  }

  liveScore(): string {
    return tx('score', { n: this.points });
  }

  render(ctx: CanvasRenderingContext2D): void {
    drawRoom(ctx);
    const q = this.q;
    if (!q) return;
    drawBoard(ctx, {
      counter: tx('question', { n: this.n + 1, total: this.quiz.length }),
      force: forceName(q.subject.force),
      question: questionText(q),
    });
    drawTimer(ctx, this.picked === null ? this.left / RANK_QUIZ.time : 0);
    answerBoxes(q.options.length).forEach((b, i) => drawAnswer(ctx, b, i + 1, q.options[i] ?? '', this.stateOf(q, i), this.t));
    if (this.picked === null) return;
    const right = this.picked === q.answer;
    const verdict = right ? tx('right') : this.picked < 0 ? tx('timeout') : tx('wrong');
    drawFact(ctx, verdict, right, factText(q), tx('next'), this.t);
  }

  private stateOf(q: Question, i: number): AnswerState {
    if (this.picked === null) return i === this.sel ? 'selected' : 'idle';
    if (i === q.answer) return 'right';
    return i === this.picked ? 'wrong' : 'dim';
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
