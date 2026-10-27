import { formatPoints } from '../core/math';
import type { PublicPilot } from '../game/ladder';
import { ladderFace } from '../game/ladder-stats';
import { t } from '../i18n/i18n';
import { drawPanel, type Rect } from '../ui/widgets';
import { drawPilotAvatar, pilotAccent } from './avatars';
import { drawFlag } from './flags';
import { drawPlaceholder } from './portraits/image';
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
/** The avatar thumbnail left of the callsign: a face crop of the 240 × 288 portrait drawn at a fifth. */
const THUMB_W = 28;
const NAME_X = COL.pilot + THUMB_W + 12;

/** The pilot's face in a row's thumbnail, or a dark silhouette for an entry without an avatar. */
function drawThumb(ctx: CanvasRenderingContext2D, avatar: string | null, y: number): void {
  const box: Rect = { x: COL.pilot, y, w: THUMB_W, h: ROW_H - 4 };
  const face = ladderFace(avatar);
  if (!face) return drawPlaceholder(ctx, box, { t: 0 }, true);
  ctx.save();
  ctx.beginPath();
  ctx.rect(box.x, box.y, box.w, box.h);
  ctx.clip();
  drawPilotAvatar(ctx, face, { x: box.x - 10, y: box.y - 6, w: 48, h: 57.6 }, { t: 0 }); // head ≈ x 50–190, y 30–190
  ctx.restore();
  ctx.strokeStyle = pilotAccent(face);
  ctx.lineWidth = 1.5;
  ctx.strokeRect(box.x, box.y, box.w, box.h);
}

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
  drawFlag(ctx, p.country, COL.pilot - 32, mid - 9);
  drawThumb(ctx, p.avatar, y);
  text(ctx, p.callsign, NAME_X, mid, { size: 20, display: true, italic: true, baseline: 'middle', color: ink, maxWidth: 300 });
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
