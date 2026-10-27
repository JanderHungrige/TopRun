import { formatPoints } from '../core/math';
import type { PilotMatch } from '../game/ladder-cloud';
import { ladderFace } from '../game/ladder-stats';
import { getLang, t } from '../i18n/i18n';
import { drawPanel, type Rect } from '../ui/widgets';
import { drawPilotAvatar } from './avatars';
import { drawFlag } from './flags';
import { drawPlaceholder } from './portraits/image';
import { drawRankBoard, RANK_KEY } from './ranks';
import { COLORS, text } from './text';

// LOAD PILOT (doc 34): the pilots a callsign lookup finds, and the pilot's honour check before loading one.

const savedDate = (at: number): string =>
  new Date(at).toLocaleDateString(getLang() === 'de' ? 'de-DE' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

/** A match's portrait, or a dark silhouette when its ladder entry has no avatar yet. */
function drawMatchFace(ctx: CanvasRenderingContext2D, avatar: string | null, box: Rect, time: number): void {
  const face = ladderFace(avatar);
  if (!face) return drawPlaceholder(ctx, box, { t: time }, true);
  drawPilotAvatar(ctx, face, box, { t: time, mood: 'happy' });
}

/** One pilot the lookup found: face, flag, callsign, rank, rating, when it was last saved. */
export function drawMatchRow(ctx: CanvasRenderingContext2D, m: PilotMatch, r: Rect, focused: boolean, time: number): void {
  drawPanel(ctx, r, { fill: focused ? 'rgba(30,52,80,0.95)' : 'rgba(10,18,30,0.9)', edge: focused ? COLORS.gold : COLORS.panelEdge, radius: 10 });
  drawMatchFace(ctx, m.avatar, { x: r.x + 8, y: r.y + 4, w: 50, h: r.h - 8 }, time);
  drawFlag(ctx, m.country, r.x + 72, r.y + 12);
  text(ctx, m.callsign, r.x + 106, r.y + 28, { size: 24, display: true, italic: true, color: focused ? COLORS.gold : COLORS.ink, maxWidth: 280 });
  drawRankBoard(ctx, m.rank, r.x + 72, r.y + 40, 0.75);
  text(ctx, t(RANK_KEY[m.rank]), r.x + 98, r.y + 54, { size: 13, color: COLORS.dim, maxWidth: 260 });
  text(ctx, formatPoints(m.rating), r.x + r.w - 20, r.y + 30, { size: 22, display: true, align: 'right', color: COLORS.green });
  text(ctx, t('cloud.saved', { date: savedDate(m.savedAt) }), r.x + r.w - 20, r.y + 54, { size: 12, align: 'right', color: COLORS.faint });
}

/** The pilot's honour check over a dimmed screen; the scene draws its two buttons on top. */
export function drawHonour(ctx: CanvasRenderingContext2D, m: PilotMatch, panel: Rect, time: number): void {
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.fillRect(0, 0, 1280, 720);
  drawPanel(ctx, panel, { radius: 14, edge: COLORS.gold });
  const cx = panel.x + panel.w / 2;
  text(ctx, t('cloud.honourTitle'), cx, panel.y + 54, { size: 34, display: true, italic: true, align: 'center', color: COLORS.gold, stroke: '#000', strokeWidth: 5 });
  drawMatchFace(ctx, m.avatar, { x: panel.x + 40, y: panel.y + 84, w: 150, h: 180 }, time);
  const x = panel.x + 220;
  const w = panel.w - 250;
  drawFlag(ctx, m.country, x, panel.y + 98);
  text(ctx, m.callsign, x + 34, panel.y + 116, { size: 30, display: true, italic: true, color: COLORS.ink, maxWidth: w - 34 });
  drawRankBoard(ctx, m.rank, x, panel.y + 132, 0.75);
  text(ctx, `${t(RANK_KEY[m.rank])}  ·  ${formatPoints(m.rating)}`, x + 26, panel.y + 147, { size: 14, color: COLORS.dim, maxWidth: w - 26 });
  text(ctx, t('cloud.honour1'), x, panel.y + 200, { size: 17, color: COLORS.ink, maxWidth: w });
  text(ctx, t('cloud.honour2', { callsign: m.callsign }), x, panel.y + 232, { size: 17, color: COLORS.gold, maxWidth: w });
}
