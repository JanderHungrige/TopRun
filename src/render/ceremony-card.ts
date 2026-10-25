import { easeOutCubic } from '../core/math';
import { MEDALS, type MedalGroup, type MedalId } from '../data/medals';
import { medalCitation, medalName } from '../i18n/content';
import { t as tr } from '../i18n/i18n';
import type { UiKey } from '../i18n/ui-en';
import type { Grid } from './ceremony-set';
import { drawMedal, drawRibbonBar, MEDAL_H, medalBottom } from './medals';
import { SpriteCache } from './pixel/blit';
import { pixelRect } from './pixel/frame';
import { rays } from './pixel/fx';
import { PAL } from './pixel/palette';
import { toCanvas } from './pixel/post';
import { and, bayer, minus, Pix } from './pixel/raster';
import { setFont, text, wrap } from './text';
import { typedLines } from './typed-text';

// Medal ceremony (doc 25): the close-up card — the deck dims, a slowly turning pixel sunburst, the medal drops in
// big with a flash, sparkles and a shine sweep; beside it who it is awarded to, the group, the name, its ribbon
// bar and the citation typed out. Plus the cut-scene letterbox with the title and the input hints.

export const BAR_TOP = 48;
export const BAR_BOTTOM = 40;
const CX = 330;
const CY = 300;
const SIZE = 330;
const COL_X = 620;
const COL_W = 610;
const GOLD = '#ffd76a';
const CREAM = '#f3ead2';
const GROUP_KEY: Readonly<Record<MedalGroup, UiKey>> = {
  campaign: 'cer.group.campaign', combat: 'cer.group.combat', offduty: 'cer.group.offduty', dedication: 'cer.group.dedication',
};

export interface CardView {
  medal: MedalId;
  index: number;
  count: number;
  /** Seconds since this close-up appeared. */
  t: number;
  /** 0 … 1 card opacity (fades in, and out before the next medal). */
  fade: number;
  callsign: string;
  /** Characters of the citation shown so far. */
  typed: number;
  clock: number;
}

const bursts = new SpriteCache(20);

/** Slowly turning sunburst behind the medal (12 rays; 15 frames per ray period). */
function burst(ctx: CanvasRenderingContext2D, g: Grid, clock: number, alpha: number): void {
  const R = 260;
  const w = 2 * Math.ceil(R / g.G);
  const frame = Math.floor(clock * 6) % 15;
  const art = bursts.get(`${w}|${frame}|${g.G.toFixed(3)}`, () => {
    const p = new Pix(w, w, 1 / g.G, w / 2, w / 2);
    const m = rays(p, 0, 0, 12, 0.14, (frame / 15) * ((Math.PI * 2) / 12), R);
    const inner = p.oval(0, 0, R * 0.62, R * 0.62);
    p.paint(and(m, inner), PAL.gold[3] ?? 0);
    p.paint(and(m, minus(p.oval(0, 0, R * 0.8, R * 0.8), inner)), PAL.gold[3] ?? 0, undefined, bayer(0.5));
    p.paint(and(m, minus(p.oval(0, 0, R, R), p.oval(0, 0, R * 0.8, R * 0.8))), PAL.gold[3] ?? 0, undefined, bayer(0.2));
    p.paint(p.oval(0, 0, R * 0.36, R * 0.36), PAL.gold[4] ?? 0, undefined, bayer(0.5));
    return toCanvas(p);
  });
  if (!art) return;
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(art, Math.round((CX - (w / 2) * g.G) / g.G) * g.G, Math.round((CY - (w / 2) * g.G) / g.G) * g.G, w * g.G, w * g.G);
  ctx.restore();
}

/** A 4-point pixel twinkle of arm length r art pixels (u logical px each). */
export function twinkle(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, u: number, color: string): void {
  if (r <= 0) return;
  const x0 = Math.round(x / u) * u;
  const y0 = Math.round(y / u) * u;
  pixelRect(ctx, x0 - r * u, y0, (2 * r + 1) * u, u, color);
  pixelRect(ctx, x0, y0 - r * u, u, (2 * r + 1) * u, color);
  pixelRect(ctx, x0, y0, u, u, '#ffffff');
}

const SPARKS: readonly (readonly [number, number, number])[] = [[-120, -130, 0], [110, -96, 0.35], [-136, 40, 0.7], [128, 70, 0.15], [-40, -168, 0.55], [60, 150, 0.85]];

function sparkles(ctx: CanvasRenderingContext2D, g: Grid, clock: number): void {
  for (const [dx, dy, ph] of SPARKS) {
    const f = Math.floor(((clock * 1.4 + ph) % 1) * 8);
    const r = [0, 1, 2, 3, 2, 1, 0, 0][f] ?? 0;
    twinkle(ctx, CX + dx, CY + dy, r, g.G, GOLD);
  }
}

/** The display-font name, shrunk until it fits the column. */
function nameSize(ctx: CanvasRenderingContext2D, name: string): number {
  for (let size = 46; size > 24; size -= 2) {
    ctx.save();
    setFont(ctx, size, true);
    const w = ctx.measureText(name).width;
    ctx.restore();
    if (w <= COL_W) return size;
  }
  return 24;
}

function column(ctx: CanvasRenderingContext2D, g: Grid, v: CardView): void {
  const def = MEDALS[v.medal];
  text(ctx, tr('cer.awarded', { callsign: v.callsign }), COL_X, 150, { size: 16, weight: 800, color: GOLD, letterSpacing: 2 });
  text(ctx, tr(GROUP_KEY[def.group]), COL_X, 176, { size: 14, weight: 700, color: '#c9b8e8', letterSpacing: 3 });
  const name = medalName(v.medal).toUpperCase();
  text(ctx, name, COL_X, 232, { size: nameSize(ctx, name), display: true, color: '#ffc83d', stroke: '#1a0e04', strokeWidth: 6 });
  drawRibbonBar(ctx, v.medal, COL_X + 2, 254, 108, 30, { px: g.G });
  const cite = medalCitation(v.medal);
  const lines = wrap(ctx, cite, COL_W - 20, 22, true);
  const on = Math.floor(v.clock * 3.4) % 2 === 0;
  typedLines(ctx, lines, v.typed, COL_X, 334, { size: 22, color: CREAM, lineHeight: 30, cursor: on ? GOLD : null });
}

/** The close-up card over the dimmed deck. */
export function drawCard(ctx: CanvasRenderingContext2D, g: Grid, v: CardView): void {
  if (v.fade <= 0) return;
  ctx.save();
  ctx.globalAlpha = v.fade;
  ctx.fillStyle = 'rgba(12,7,26,0.8)';
  ctx.fillRect(0, 0, 1280, 720);
  burst(ctx, g, v.clock, 0.32);
  const drop = (1 - easeOutCubic(Math.min(1, v.t / 0.42))) * -110;
  const h = (SIZE * medalBottom(v.medal)) / MEDAL_H;
  const shine = (v.clock * 0.5) % 1.7;
  drawMedal(ctx, v.medal, CX, Math.round(CY - h / 2 + drop), SIZE, { px: g.G, ...(shine <= 1 ? { shine } : {}) });
  if (v.t > 0.42) sparkles(ctx, g, v.clock);
  column(ctx, g, v);
  const flash = 1 - Math.abs(v.t - 0.44) / 0.14;
  if (flash > 0) {
    ctx.fillStyle = `rgba(255,248,224,${(flash * 0.55).toFixed(3)})`;
    ctx.fillRect(0, 0, 1280, 720);
  }
  ctx.restore();
}

/** Cut-scene letterbox: the title on top (and "medal n of m" when there are several), the input hints below. */
export function drawLetterbox(ctx: CanvasRenderingContext2D, hint: boolean, clock: number, medal?: { n: number; total: number }): void {
  ctx.fillStyle = '#05040a';
  ctx.fillRect(0, 0, 1280, BAR_TOP);
  ctx.fillRect(0, 720 - BAR_BOTTOM, 1280, BAR_BOTTOM);
  text(ctx, tr('cer.title'), 640, 32, { size: 18, display: true, align: 'center', color: GOLD, letterSpacing: 4 });
  if (medal && medal.total > 1) text(ctx, tr('cer.count', medal), 1240, 30, { size: 13, weight: 800, color: '#c9b8e8', align: 'right', letterSpacing: 2 });
  const y = 720 - BAR_BOTTOM / 2 + 5;
  text(ctx, tr('cer.skip'), 40, y, { size: 13, weight: 700, color: '#8f86a8', letterSpacing: 1 });
  if (hint && Math.floor(clock * 2.2) % 2 === 0) text(ctx, `${tr('cer.next')}  ▶`, 1240, y, { size: 13, weight: 800, color: GOLD, align: 'right', letterSpacing: 1 });
}
