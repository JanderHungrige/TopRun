import { easeOutCubic } from '../../core/math';
import { pixelFrame, pixelRect, RPG_BOX } from '../pixel/frame';
import { COLORS, FONT_TYPE, text } from '../text';

// Beach Volleyball HUD (doc 21): the scoreboard with serve ball, touch pips and MATCH POINT flag, pop-ups,
// the point / match banners, the serve and aim hints and the touch strip.

export const TEAM_COLOR = { home: COLORS.cyan, away: '#ff6a5a' } as const;
export const BOARD = { x: 388, y: 64, w: 504, h: 76 } as const;

export interface BoardView {
  home: string;
  away: string;
  score: { home: number; away: number };
  serving: 'home' | 'away';
  /** Team in possession and its touches so far (pips), or null. */
  touches: { team: 'home' | 'away'; count: number } | null;
  matchPoint: string | null;
  t: number;
}

function pip(ctx: CanvasRenderingContext2D, x: number, y: number, on: boolean, color: string): void {
  pixelRect(ctx, x, y, 10, 10, '#06080f');
  pixelRect(ctx, x + 2, y + 2, 6, 6, on ? color : '#2a3350');
}

function serveBall(ctx: CanvasRenderingContext2D, x: number, y: number, t: number): void {
  const bob = Math.floor(t * 3) % 2 === 0 ? 0 : 2;
  pixelRect(ctx, x + 2, y + bob, 8, 12, '#3a2232');
  pixelRect(ctx, x, y + 2 + bob, 12, 8, '#3a2232');
  pixelRect(ctx, x + 2, y + 2 + bob, 8, 8, '#f2c12e');
  pixelRect(ctx, x + 4, y + 2 + bob, 4, 8, '#f4f1ea');
  pixelRect(ctx, x + 2, y + 6 + bob, 8, 2, '#2f63ad');
}

export function drawBoard(ctx: CanvasRenderingContext2D, v: BoardView): void {
  const b = BOARD;
  pixelFrame(ctx, b, RPG_BOX, 2);
  const mid = b.x + b.w / 2;
  text(ctx, ':', mid, b.y + 52, { size: 34, display: true, align: 'center', color: COLORS.dim });
  for (const team of ['home', 'away'] as const) {
    const s = team === 'home' ? -1 : 1;
    const color = TEAM_COLOR[team];
    const lead = v.score[team] > v.score[team === 'home' ? 'away' : 'home'];
    text(ctx, String(v.score[team]), mid + s * 46, b.y + 56, { size: 44, display: true, align: 'center', color: lead ? COLORS.gold : COLORS.ink, stroke: '#06080f', strokeWidth: 5 });
    text(ctx, team === 'home' ? v.home : v.away, mid + s * 150, b.y + 30, { size: 15, display: true, align: 'center', color, maxWidth: 170 });
    const px0 = mid + s * 150 - 17;
    const own = v.touches?.team === team;
    for (let i = 0; i < 3; i++) pip(ctx, px0 + i * 12, b.y + 44, own && (v.touches?.count ?? 0) > i, color);
    if (v.serving === team) serveBall(ctx, px0 + (team === 'home' ? -24 : 48), b.y + 42, v.t);
  }
  if (v.matchPoint && Math.floor(v.t * 2.5) % 2 === 0) {
    const w = 170;
    pixelFrame(ctx, { x: mid - w / 2, y: b.y + b.h - 4, w, h: 26 }, RPG_BOX, 2);
    text(ctx, v.matchPoint, mid, b.y + b.h + 14, { size: 13, display: true, align: 'center', color: COLORS.gold, letterSpacing: 2 });
  }
}

export interface Popup { text: string; color: string; x: number; y: number; age: number; size: number }
export const POPUP_LIFE = 1.0;

export function drawPopups(ctx: CanvasRenderingContext2D, list: readonly Popup[]): void {
  for (const p of list) {
    const k = p.age / POPUP_LIFE;
    text(ctx, p.text, p.x, p.y - easeOutCubic(Math.min(1, k * 1.5)) * 40, {
      size: p.size, display: true, italic: true, align: 'center', color: p.color, alpha: 1 - k * k, stroke: '#1a0c18', strokeWidth: 5,
    });
  }
}

export interface Banner { title: string; sub: string; color: string; age: number; big: boolean }

export function drawBanner(ctx: CanvasRenderingContext2D, b: Banner): void {
  const k = easeOutCubic(Math.min(1, b.age * 4));
  const y = b.big ? 300 : 196;
  const h = b.big ? 140 : 70;
  ctx.save();
  ctx.globalAlpha = Math.min(1, b.age * 6);
  pixelRect(ctx, 0, y - h / 2, 1280, h, 'rgba(16,10,30,0.72)');
  pixelRect(ctx, 0, y - h / 2, 1280, 4, b.color);
  pixelRect(ctx, 0, y + h / 2 - 4, 1280, 4, b.color);
  ctx.translate(640, y);
  ctx.scale(0.75 + 0.25 * k, 0.75 + 0.25 * k);
  text(ctx, b.title, 0, b.big ? -2 : 12, { size: b.big ? 66 : 38, display: true, italic: true, align: 'center', color: b.color, stroke: '#1a0c18', strokeWidth: 7 });
  if (b.sub) text(ctx, b.sub, 0, b.big ? 46 : 32, { size: b.big ? 24 : 16, display: true, align: 'center', color: COLORS.ink, letterSpacing: 1 });
  ctx.restore();
}

/** A key-cap style hint pill. */
export function drawHint(ctx: CanvasRenderingContext2D, label: string, x: number, y: number, t: number, pulse = true): void {
  ctx.save();
  ctx.font = `700 15px ${FONT_TYPE}`;
  const w = ctx.measureText(label).width + 28;
  ctx.restore();
  ctx.save();
  ctx.globalAlpha = pulse ? 0.75 + 0.25 * Math.sin(t * 6) : 0.85;
  pixelFrame(ctx, { x: x - w / 2, y: y - 16, w, h: 30 }, RPG_BOX, 2);
  text(ctx, label, x, y + 5, { size: 15, display: true, align: 'center', color: COLORS.gold });
  ctx.restore();
}

/** Top of the touch drag strip (touches that start below it run, taps above it hit / jump). */
export const STRIP_Y = 620;

/** Touch devices: the drag strip along the bottom and where to tap. */
export function drawTouchStrip(ctx: CanvasRenderingContext2D, drag: string, tap: string, active: boolean): void {
  pixelRect(ctx, 0, STRIP_Y, 1280, 720 - STRIP_Y, active ? 'rgba(255,240,210,0.24)' : 'rgba(255,240,210,0.14)');
  pixelRect(ctx, 0, STRIP_Y, 1280, 2, 'rgba(255,255,255,0.4)');
  text(ctx, drag, 640, 698, { size: 18, display: true, align: 'center', color: 'rgba(60,30,30,0.7)', letterSpacing: 3 });
  text(ctx, tap, 1262, STRIP_Y - 10, { size: 13, display: true, align: 'right', color: 'rgba(255,255,255,0.85)', stroke: '#1a0c18', strokeWidth: 4 });
}

/** A small pixel arrow over your head so you never lose yourself in a rally. */
export function drawYouMarker(ctx: CanvasRenderingContext2D, x: number, y: number, t: number): void {
  const bob = Math.floor(t * 3) % 2 === 0 ? 0 : 2;
  for (let i = 0; i < 4; i++) pixelRect(ctx, x - 8 + i * 2, y + bob + i * 2, 16 - i * 4, 2, COLORS.cyan);
  pixelRect(ctx, x - 10, y + bob - 2, 20, 2, '#1a0c18');
}
