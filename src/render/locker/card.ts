import { formatPoints } from '../../core/math';
import { MEDALS, type MedalGroup, type MedalId } from '../../data/medals';
import type { RankId } from '../../data/ranks';
import { medalCitation, medalName } from '../../i18n/content';
import { getLang, t } from '../../i18n/i18n';
import type { UiKey } from '../../i18n/ui-en';
import { twinkle } from '../ceremony-card';
import { drawMedal, drawRibbonBar, MEDAL_H, medalBottom } from '../medals';
import { pixelFrame, pixelRect, RPG_BOX } from '../pixel/frame';
import { drawRankBoard, RANK_KEY } from '../ranks';
import { CREAM, GOLD, LILAC } from '../rooms-chrome';
import { paragraph, setFont, text, wrap } from '../text';
import { typedLines } from '../typed-text';

// Locker (doc 31): the card in the right column — the selected medal close up with a shine sweep and twinkles,
// its group, name, ribbon bar and the typed citation; below, the pilot's rank board, rank and rating.

export const PANEL = { x: 806, y: 72, w: 442, h: 590 } as const;
const CX = PANEL.x + PANEL.w / 2;
const PAD = 24;
const TEXT_W = PANEL.w - 2 * PAD;
const SIZE = 172;
const GROUP_KEY: Readonly<Record<MedalGroup, UiKey>> = {
  campaign: 'cer.group.campaign', combat: 'cer.group.combat', offduty: 'cer.group.offduty', dedication: 'cer.group.dedication',
};

export interface CardView {
  medal: MedalId | null;
  /** Characters of the citation typed so far. */
  typed: number;
  rank: RankId;
  rating: number;
  /** Logical px per art pixel of the scene. */
  G: number;
  clock: number;
}

function nameSize(ctx: CanvasRenderingContext2D, name: string): number {
  ctx.save();
  let size = 32;
  for (; size > 18; size -= 2) {
    setFont(ctx, size, true);
    if (ctx.measureText(name).width <= TEXT_W) break;
  }
  ctx.restore();
  return size;
}

/** Citations wrapped once per language and medal. */
const wrapped = new Map<string, string[]>();

const SPARKS: readonly (readonly [number, number, number])[] = [[-78, -60, 0], [70, -40, 0.4], [-64, 50, 0.75], [84, 64, 0.2]];

function closeUp(ctx: CanvasRenderingContext2D, v: CardView, id: MedalId): void {
  const cy = PANEL.y + 128;
  const h = (SIZE * medalBottom(id)) / MEDAL_H;
  const sweep = (v.clock * 0.45) % 1.6;
  drawMedal(ctx, id, CX, Math.round(cy - h / 2), SIZE, { px: v.G, ...(sweep <= 1 ? { shine: sweep } : {}) });
  for (const [dx, dy, ph] of SPARKS) {
    const f = Math.floor(((v.clock * 1.2 + ph) % 1) * 8);
    twinkle(ctx, CX + dx, cy + dy, [0, 1, 2, 3, 2, 1, 0, 0][f] ?? 0, v.G, GOLD);
  }
}

function medalText(ctx: CanvasRenderingContext2D, v: CardView, id: MedalId): void {
  const name = medalName(id).toUpperCase();
  text(ctx, name, CX, PANEL.y + 280, { size: nameSize(ctx, name), display: true, align: 'center', color: '#ffc83d', stroke: '#1a0e04', strokeWidth: 5 });
  text(ctx, t(GROUP_KEY[MEDALS[id].group]), CX, PANEL.y + 306, { size: 13, weight: 800, align: 'center', color: LILAC, letterSpacing: 3 });
  drawRibbonBar(ctx, id, CX - 21, PANEL.y + 318, 42, 14, { px: v.G });
  const key = `${getLang()}|${id}`;
  const lines = wrapped.get(key) ?? wrap(ctx, medalCitation(id), TEXT_W, 19, true);
  wrapped.set(key, lines);
  const on = Math.floor(v.clock * 3.4) % 2 === 0;
  typedLines(ctx, lines, v.typed, PANEL.x + PAD, PANEL.y + 370, { size: 19, color: CREAM, lineHeight: 27, cursor: on ? GOLD : null });
}

function empty(ctx: CanvasRenderingContext2D): void {
  text(ctx, t('locker.none'), CX, PANEL.y + 150, { size: 26, display: true, align: 'center', color: '#8f86a8' });
  paragraph(ctx, t('locker.noneHint'), PANEL.x + PAD, PANEL.y + 210, TEXT_W, { size: 18, type: true, color: CREAM, lineHeight: 27 });
}

function standing(ctx: CanvasRenderingContext2D, v: CardView): void {
  const y = PANEL.y + PANEL.h - 92;
  pixelRect(ctx, PANEL.x + PAD, y, TEXT_W, 2, '#3a4466');
  drawRankBoard(ctx, v.rank, PANEL.x + PAD, y + 18, 2);
  text(ctx, t(RANK_KEY[v.rank]).toUpperCase(), PANEL.x + PAD + 64, y + 40, { size: 17, display: true, color: '#e9eff5', maxWidth: TEXT_W - 64 });
  text(ctx, t('locker.rating', { rating: formatPoints(v.rating) }), PANEL.x + PAD + 64, y + 62, { size: 13, weight: 800, color: LILAC, letterSpacing: 2 });
}

/** The right-hand card. */
export function drawLockerCard(ctx: CanvasRenderingContext2D, v: CardView): void {
  pixelFrame(ctx, PANEL, RPG_BOX, 2);
  if (v.medal) {
    closeUp(ctx, v, v.medal);
    medalText(ctx, v, v.medal);
  } else {
    empty(ctx);
  }
  standing(ctx, v);
}
