import type { Input } from '../../core/input';
import type { Vec } from '../../core/math';
import { CHART_SAMPLE, CHARTS, RANK_CHARTS, type Chart } from '../../data/rank-quiz';
import { RANK_QUIZ, type Question } from '../../game/minigames/ranks';
import type { GameContext } from '../../game/state';
import type { Params } from '../../i18n/i18n';
import { mt } from '../../i18n/minigame-text';
import { RANKS_TEXT, type RanksKey } from '../../i18n/minigames/ranks';
import {
  ANSWERS, drawAnswer, drawButton, drawHeader, drawPickCard, drawQuizBoard, drawStudyTile, drawTimer, drawVerdict, PICK_CARDS, READY,
  studyTiles, type Box, type CardState,
} from '../../render/minigames/ranks';

// Rank Quiz (doc 41): the three screens of a round — pick a chart, study it, the five questions — and the card
// chooser they share (arrows on a grid, the pointer hovering when it is not a touch screen, a tap, CONFIRM).

export const tx = (k: RanksKey, p?: Params): string => mt(RANKS_TEXT, k, p);
export const inBox = (p: Vec, b: Box): boolean => p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h;

export class Chooser {
  sel = 0;
  private pointer: Vec;

  constructor(private readonly game: GameContext, private readonly cols: number) {
    this.pointer = { x: game.input.pointer.x, y: game.input.pointer.y };
  }

  /** One tick: moves the selection; returns the card picked, or null. */
  step(input: Input, boxes: readonly Box[]): number | null {
    const move = (to: number): void => {
      if (to < 0 || to >= boxes.length || to === this.sel) return;
      this.sel = to;
      this.game.audio.play('uiMove');
    };
    const c = this.cols;
    if (input.pressed('left') && this.sel % c > 0) move(this.sel - 1);
    if (input.pressed('right') && this.sel % c < c - 1) move(this.sel + 1);
    if (input.pressed('up')) move(this.sel - c);
    if (input.pressed('down')) move(this.sel + c);
    const p = input.pointer;
    if (input.device !== 'touch' && (p.x !== this.pointer.x || p.y !== this.pointer.y)) {
      const i = boxes.findIndex((b) => inBox(p, b));
      if (i >= 0) move(i);
    }
    this.pointer = { x: p.x, y: p.y };
    for (const tap of input.taps) {
      const i = boxes.findIndex((b) => inBox(tap, b));
      if (i >= 0) return i;
    }
    return input.pressed('confirm') ? this.sel : null;
  }
}

const SUB: Readonly<Record<Chart, RanksKey>> = { usn: 'usnSub', usa: 'usaSub', marine: 'marineSub', heer: 'heerSub' };

export function renderPick(ctx: CanvasRenderingContext2D, sel: number, t: number): void {
  drawHeader(ctx, tx('pickTitle'), tx('pickHint'));
  CHARTS.forEach((chart, i) => {
    const b = PICK_CARDS[i];
    if (!b) return;
    const state: CardState = i === sel ? 'selected' : 'idle';
    drawPickCard(ctx, b, { title: tx(chart), subtitle: tx(SUB[chart]), chart, sample: CHART_SAMPLE[chart], state }, t);
  });
}

export function renderStudy(ctx: CanvasRenderingContext2D, chart: Chart, t: number): void {
  const ranks = RANK_CHARTS[chart];
  drawHeader(ctx, tx(chart), tx('studyHint', { n: ranks.length }));
  studyTiles(ranks.length).forEach((b, i) => drawStudyTile(ctx, b, chart, i, ranks[i]?.name ?? ''));
  drawButton(ctx, READY, tx('ready'), t);
}

export interface QuizState {
  chart: Chart;
  q: Question;
  n: number;
  sel: number;
  /** The option picked (−1: time ran out) while the verdict shows; null while the question is open. */
  picked: number | null;
  left: number;
  t: number;
}

function cardState(s: QuizState, i: number): CardState {
  if (s.picked === null) return i === s.sel ? 'selected' : 'idle';
  if (i === s.q.answer) return 'right';
  return i === s.picked ? 'wrong' : 'dim';
}

export function renderQuiz(ctx: CanvasRenderingContext2D, s: QuizState): void {
  const view = { counter: tx('question', { n: s.n + 1, total: RANK_QUIZ.questions }), chart: tx(s.chart), prompt: tx('prompt') };
  drawQuizBoard(ctx, view, s.chart, s.q.index);
  drawTimer(ctx, s.picked === null ? s.left / RANK_QUIZ.time : 0);
  ANSWERS.forEach((b, i) => drawAnswer(ctx, b, i + 1, s.q.options[i] ?? '', cardState(s, i), s.t));
  if (s.picked === null) return;
  const right = s.picked === s.q.answer;
  const verdict = right ? tx('right') : s.picked < 0 ? tx('timeout') : tx('wrong');
  drawVerdict(ctx, verdict, right, RANK_CHARTS[s.chart][s.q.index]?.name ?? '', tx('next'), s.t);
}
