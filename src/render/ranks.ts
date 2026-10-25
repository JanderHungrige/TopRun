import type { RankId } from '../data/ranks';
import type { UiKey } from '../i18n/ui-en';

// Naval rank boards (doc 28): gold sleeve stripes on navy, a wide stripe for flag officers.
// Generic: no national insignia. Drawn in whole logical pixels so it stays crisp at small sizes.

type Stripe = 'wide' | 'mid' | 'thin';

/** Bottom to top. */
const STRIPES: Readonly<Record<RankId, readonly Stripe[]>> = {
  ensign: ['mid'],
  ltjg: ['mid', 'thin'],
  lt: ['mid', 'mid'],
  lcdr: ['mid', 'thin', 'mid'],
  cdr: ['mid', 'mid', 'mid'],
  capt: ['mid', 'mid', 'mid', 'mid'],
  radm: ['wide', 'mid'],
  adm: ['wide', 'mid', 'mid', 'mid'],
};

export const RANK_KEY: Readonly<Record<RankId, UiKey>> = {
  ensign: 'rank.ensign', ltjg: 'rank.ltjg', lt: 'rank.lt', lcdr: 'rank.lcdr',
  cdr: 'rank.cdr', capt: 'rank.capt', radm: 'rank.radm', adm: 'rank.adm',
};

const HEIGHT: Readonly<Record<Stripe, number>> = { wide: 5, mid: 2, thin: 1 };
const GOLD = '#f2c14e';
const GOLD_DARK = '#a8781f';

function drawStar(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number): void {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 === 0 ? r : r * 0.45;
    ctx.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
  }
  ctx.closePath();
  ctx.fill();
}

/** A rank board 24×24 logical px × `scale`, top-left at (x, y). */
export function drawRankBoard(ctx: CanvasRenderingContext2D, rank: RankId, x: number, y: number, scale = 1): void {
  const w = 24 * scale;
  const h = 24 * scale;
  ctx.save();
  ctx.fillStyle = '#0d1a33';
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = '#1d3158';
  ctx.fillRect(x, y, w, scale);
  let at = y + h - 2 * scale;
  for (const s of STRIPES[rank]) {
    const sh = HEIGHT[s] * scale;
    at -= sh;
    ctx.fillStyle = GOLD;
    ctx.fillRect(x + scale, at, w - 2 * scale, sh);
    if (s !== 'thin') {
      const shade = Math.max(1, scale * 0.5);
      ctx.fillStyle = GOLD_DARK;
      ctx.fillRect(x + scale, at + sh - shade, w - 2 * scale, shade);
    }
    at -= scale;
  }
  ctx.fillStyle = GOLD;
  if (at - y >= 4 * scale) drawStar(ctx, x + w / 2, y + (at - y) / 2 + scale * 0.5, Math.min(3 * scale, (at - y) / 2 - scale * 0.5));
  ctx.strokeStyle = 'rgba(0,0,0,0.6)';
  ctx.lineWidth = Math.max(1, scale * 0.5);
  ctx.strokeRect(x, y, w, h);
  ctx.restore();
}
