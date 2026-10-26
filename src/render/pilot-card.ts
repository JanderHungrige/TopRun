import { formatMoney } from '../core/math';
import type { MedalId } from '../data/medals';
import type { RankId } from '../data/ranks';
import { t } from '../i18n/i18n';
import { avatarFrames, drawPilotAvatar, type PilotFace } from './avatars';
import { drawMedal } from './medals';
import { frameAround, NAME_PLATE, pixelFrame, PORTRAIT_FRAME } from './pixel/frame';
import { whenImagesReady } from './portraits/image';
import { drawRankBoard, RANK_KEY } from './ranks';
import { COLORS, text } from './text';

// The pilot ID card (doc 08): a 720 × 432 collectible with the pixel portrait 1 : 1, callsign, rank, rating,
// progress, money, jet and medals. Drawn once on its own canvas and saved as a PNG (the pilot code is added to
// the file by game/pilot-card.ts).

export const CARD_W = 720;
export const CARD_H = 432;
const PORTRAIT = { x: 28, y: 76, w: 240, h: 288 };
const COL = 296;
const MAX_MEDALS = 9;

export interface PilotCardData {
  face: PilotFace;
  callsign: string;
  rank: RankId;
  rating: number;
  cleared: number;
  stars: number;
  money: number;
  plane: string;
  medals: readonly MedalId[];
  issued: string;
}

function drawFrame(ctx: CanvasRenderingContext2D): void {
  const g = ctx.createLinearGradient(0, 0, 0, CARD_H);
  g.addColorStop(0, '#13203a');
  g.addColorStop(1, '#070b14');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, CARD_W, CARD_H);
  pixelFrame(ctx, { x: 0, y: 0, w: CARD_W, h: CARD_H }, NAME_PLATE, 3, true);
  ctx.fillStyle = 'rgba(255, 200, 61, 0.12)';
  ctx.fillRect(12, 12, CARD_W - 24, 46);
  text(ctx, t('card.brand'), 28, 43, { size: 18, display: true, color: COLORS.gold, letterSpacing: 2, maxWidth: 420 });
  text(ctx, t('card.title'), CARD_W - 28, 43, { size: 18, display: true, align: 'right', color: COLORS.ink, letterSpacing: 3, maxWidth: 240 });
}

function drawDetails(ctx: CanvasRenderingContext2D, d: PilotCardData): void {
  text(ctx, d.callsign, COL, 112, { size: 36, display: true, color: COLORS.gold, maxWidth: CARD_W - COL - 28 });
  drawRankBoard(ctx, d.rank, COL, 128, 1.25);
  text(ctx, t(RANK_KEY[d.rank]), COL + 42, 151, { size: 17, display: true, color: COLORS.gold, maxWidth: CARD_W - COL - 70 });
  text(ctx, t('locker.rating', { rating: d.rating.toLocaleString('en-US') }), COL, 192, { size: 14, color: COLORS.dim, letterSpacing: 1 });
  text(ctx, t('map.progress', { done: d.cleared, stars: d.stars }), COL, 222, { size: 15, color: COLORS.ink, maxWidth: CARD_W - COL - 28 });
  text(ctx, formatMoney(d.money), COL, 254, { size: 20, display: true, color: COLORS.green });
  text(ctx, d.plane, COL, 282, { size: 14, color: COLORS.dim, maxWidth: CARD_W - COL - 28 });
  const shown = d.medals.slice(0, MAX_MEDALS);
  if (shown.length === 0) {
    text(ctx, t('locker.none'), COL, 336, { size: 14, color: COLORS.faint, letterSpacing: 1 });
    return;
  }
  shown.forEach((id, i) => drawMedal(ctx, id, COL + 18 + i * 44, 300, 56));
}

/** The whole card at (0, 0) in logical units (one unit = one pixel of the saved PNG). */
export function drawPilotCard(ctx: CanvasRenderingContext2D, d: PilotCardData): void {
  drawFrame(ctx);
  drawPilotAvatar(ctx, d.face, PORTRAIT, { t: 0 });
  frameAround(ctx, PORTRAIT, PORTRAIT_FRAME, 3);
  drawDetails(ctx, d);
  ctx.fillStyle = 'rgba(255, 200, 61, 0.35)';
  ctx.fillRect(28, 384, CARD_W - 56, 2);
  text(ctx, t('card.hint'), 28, 410, { size: 12, color: COLORS.dim, maxWidth: 470 });
  text(ctx, t('card.issued', { date: d.issued }), CARD_W - 28, 410, { size: 12, align: 'right', color: COLORS.dim, maxWidth: 200 });
}

/** The card as PNG bytes, once its portrait has loaded; null where the browser cannot encode it. */
export async function pilotCardPng(d: PilotCardData): Promise<Uint8Array | null> {
  const frames = avatarFrames(d.face);
  if (frames) await whenImagesReady([frames.base]);
  const canvas = document.createElement('canvas');
  canvas.width = CARD_W;
  canvas.height = CARD_H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  drawPilotCard(ctx, d);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
  return blob ? new Uint8Array(await blob.arrayBuffer()) : null;
}
