import { formatPoints } from '../core/math';
import type { PublicPilot } from '../game/ladder';
import { t } from '../i18n/i18n';
import { drawPanel, type Rect } from '../ui/widgets';
import { drawRankBoard, RANK_KEY } from './ranks';
import { COLORS, text } from './text';

// The online ladder table (doc 28).

export interface LadderRow {
  place: number;
  pilot: PublicPilot;
  you: boolean;
}

export const ROWS_PER_PAGE = 10;
export const TABLE: Rect = { x: 170, y: 116, w: 940, h: 444 };
const ROW_H = 36;
const HEAD_Y = TABLE.y + 30;
const FIRST_Y = TABLE.y + 54;
const COL = { place: TABLE.x + 70, board: TABLE.x + 100, rank: TABLE.x + 136, pilot: TABLE.x + 420, rating: TABLE.x + TABLE.w - 30 };

/** One ladder row with its top edge at `y`; the player's own row is highlighted. */
export function drawLadderRow(ctx: CanvasRenderingContext2D, row: LadderRow, y: number): void {
  const p = row.pilot;
  if (row.you) {
    ctx.fillStyle = 'rgba(255,200,61,0.18)';
    ctx.fillRect(TABLE.x + 12, y, TABLE.w - 24, ROW_H - 4);
    ctx.strokeStyle = 'rgba(255,200,61,0.75)';
    ctx.lineWidth = 2;
    ctx.strokeRect(TABLE.x + 13, y + 1, TABLE.w - 26, ROW_H - 6);
  }
  const mid = y + (ROW_H - 4) / 2;
  const podium = row.place <= 3;
  const ink = row.you ? COLORS.gold : COLORS.ink;
  text(ctx, `#${row.place}`, COL.place, mid, { size: podium ? 20 : 17, display: podium, align: 'right', baseline: 'middle', color: podium ? COLORS.gold : COLORS.dim });
  drawRankBoard(ctx, p.rank, COL.board, y + 2, 1.15);
  text(ctx, t(RANK_KEY[p.rank]), COL.rank, mid, { size: 15, baseline: 'middle', color: COLORS.dim, maxWidth: COL.pilot - COL.rank - 40 });
  text(ctx, p.callsign, COL.pilot, mid, { size: 20, display: true, italic: true, baseline: 'middle', color: ink, maxWidth: 300 });
  text(ctx, formatPoints(p.rating), COL.rating, mid, { size: 20, display: true, align: 'right', baseline: 'middle', color: row.you ? COLORS.gold : COLORS.green });
}

/** Header plus up to ROWS_PER_PAGE rows. */
export function drawLadderTable(ctx: CanvasRenderingContext2D, rows: readonly LadderRow[]): void {
  drawPanel(ctx, TABLE);
  const head = { size: 12, color: COLORS.faint, letterSpacing: 2 };
  text(ctx, t('ladder.place'), COL.place, HEAD_Y, { ...head, align: 'right' });
  text(ctx, t('ladder.rank'), COL.board, HEAD_Y, head);
  text(ctx, t('ladder.pilot'), COL.pilot, HEAD_Y, head);
  text(ctx, t('ladder.rating'), COL.rating, HEAD_Y, { ...head, align: 'right' });
  rows.slice(0, ROWS_PER_PAGE).forEach((row, i) => drawLadderRow(ctx, row, FIRST_Y + i * ROW_H));
}

/** Loading / offline / empty: one line in the table's place. */
export function drawLadderMessage(ctx: CanvasRenderingContext2D, message: string, color: string = COLORS.dim): void {
  drawPanel(ctx, TABLE);
  text(ctx, message, TABLE.x + TABLE.w / 2, TABLE.y + TABLE.h / 2, { size: 22, type: true, align: 'center', baseline: 'middle', color, maxWidth: TABLE.w - 80 });
}

/** The player's own row under the table, when it is not on the current page. */
export function drawPinnedRow(ctx: CanvasRenderingContext2D, row: LadderRow): void {
  const y = TABLE.y + TABLE.h + 4;
  drawPanel(ctx, { x: TABLE.x, y: y - 2, w: TABLE.w, h: ROW_H + 2 });
  drawLadderRow(ctx, row, y);
}
