import { t } from '../i18n/i18n';
import type { UiKey } from '../i18n/ui-en';
import { drawSunset } from '../render/backdrop';
import { COLORS, text } from '../render/text';
import { drawButton, drawPanel, type Button, type Rect } from '../ui/widgets';

// PILOT CODE screen (doc 08): layout shared with the scene's hit tests, and the drawing. Left: back up the chosen
// pilot (code box, COPY, SAVE FILE); right: restore (paste box, LOAD, OPEN FILE); a confirm before replacing.

const LEFT: Rect = { x: 60, y: 136, w: 560, h: 470 };
const RIGHT: Rect = { x: 660, y: 136, w: 560, h: 470 };
export const BACKUP_BOX: Rect = { x: 84, y: 250, w: 512, h: 206 };
export const RESTORE_BOX: Rect = { x: 684, y: 226, w: 512, h: 230 };

export type CodeButtonId = 'prev' | 'next' | 'copy' | 'save' | 'load' | 'open' | 'back' | 'replace' | 'cancel';
export type CodeButton = Button & { id: CodeButtonId };

const B = (id: CodeButtonId, x: number, y: number, w: number, h: number, primary = false): CodeButton => ({ id, label: '', x, y, w, h, primary });
export const MAIN_BUTTONS: readonly CodeButton[] = [
  B('prev', 84, 190, 48, 42), B('next', 548, 190, 48, 42),
  B('copy', 84, 474, 250, 48, true), B('save', 346, 474, 250, 48),
  B('load', 684, 474, 250, 48, true), B('open', 946, 474, 250, 48),
  B('back', 540, 628, 200, 50),
];
export const CONFIRM_BUTTONS: readonly CodeButton[] = [B('replace', 450, 412, 180, 46, true), B('cancel', 650, 412, 180, 46)];

const LABEL: Readonly<Record<CodeButtonId, UiKey | null>> = {
  prev: null, next: null, copy: 'code.copy', save: 'code.save', load: 'code.load', open: 'code.open',
  back: 'pilots.back', replace: 'code.replace', cancel: 'title.cancel',
};

export interface CodeStatus {
  key: UiKey;
  params?: Record<string, string>;
  error: boolean;
  /** Shown under the panel whose button caused it. */
  side: 'backup' | 'restore';
}

function drawStatus(ctx: CanvasRenderingContext2D, s: CodeStatus | null, side: CodeStatus['side'], panel: Rect, y: number): void {
  if (!s || s.side !== side) return;
  text(ctx, t(s.key, s.params), panel.x + panel.w / 2, y, { size: 14, align: 'center', color: s.error ? COLORS.red : COLORS.green, maxWidth: panel.w - 40 });
}

export interface CodeView {
  t: number;
  /** The pilot being backed up; null when this device has none. */
  callsign: string | null;
  pilots: number;
  status: CodeStatus | null;
  confirm: { callsign: string; here: string; code: string } | null;
}

function label(b: CodeButton): string {
  if (b.id === 'prev') return '◀';
  if (b.id === 'next') return '▶';
  const key = LABEL[b.id];
  return key ? t(key) : '';
}

function drawBackup(ctx: CanvasRenderingContext2D, v: CodeView): void {
  drawPanel(ctx, LEFT);
  text(ctx, t('code.backup'), LEFT.x + 24, LEFT.y + 34, { size: 18, display: true, color: COLORS.gold, letterSpacing: 2 });
  if (v.callsign === null) {
    text(ctx, t('code.none'), LEFT.x + LEFT.w / 2, LEFT.y + 220, { size: 16, align: 'center', color: COLORS.dim, maxWidth: LEFT.w - 48 });
    return;
  }
  text(ctx, v.callsign, LEFT.x + LEFT.w / 2, LEFT.y + 77, { size: 24, display: true, align: 'center', baseline: 'middle', color: COLORS.ink, maxWidth: 380 });
  drawPanel(ctx, BACKUP_BOX, { fill: 'rgba(4,8,14,0.92)', edge: COLORS.panelEdge, radius: 8 });
  text(ctx, t('code.warning'), LEFT.x + LEFT.w / 2, 556, { size: 13, align: 'center', color: COLORS.dim, maxWidth: LEFT.w - 40 });
  drawStatus(ctx, v.status, 'backup', LEFT, 586);
}

function drawRestore(ctx: CanvasRenderingContext2D, v: CodeView): void {
  drawPanel(ctx, RIGHT);
  text(ctx, t('code.restore'), RIGHT.x + 24, RIGHT.y + 34, { size: 18, display: true, color: COLORS.gold, letterSpacing: 2 });
  text(ctx, t('code.pasteHint'), RIGHT.x + 24, RIGHT.y + 70, { size: 13, color: COLORS.dim, maxWidth: RIGHT.w - 48 });
  drawPanel(ctx, RESTORE_BOX, { fill: 'rgba(4,8,14,0.92)', edge: COLORS.panelEdge, radius: 8 });
  drawStatus(ctx, v.status, 'restore', RIGHT, 560);
}

function drawConfirm(ctx: CanvasRenderingContext2D, c: NonNullable<CodeView['confirm']>, time: number): void {
  ctx.fillStyle = 'rgba(0,0,0,0.65)';
  ctx.fillRect(0, 0, 1280, 720);
  drawPanel(ctx, { x: 380, y: 250, w: 520, h: 236 });
  text(ctx, t('code.replaceTitle', { callsign: c.callsign }), 640, 298, { size: 24, display: true, align: 'center', color: COLORS.gold, maxWidth: 480 });
  text(ctx, t('code.replaceHere', { progress: c.here }), 640, 336, { size: 14, align: 'center', color: COLORS.dim, maxWidth: 480 });
  text(ctx, t('code.replaceCode', { progress: c.code }), 640, 364, { size: 14, align: 'center', color: COLORS.ink, maxWidth: 480 });
  for (const b of CONFIRM_BUTTONS) drawButton(ctx, { ...b, label: label(b) }, b.id === 'cancel', time);
}

/** The whole screen. */
export function drawPilotCode(ctx: CanvasRenderingContext2D, v: CodeView): void {
  drawSunset(ctx, v.t);
  ctx.fillStyle = 'rgba(4,8,16,0.6)';
  ctx.fillRect(0, 0, 1280, 720);
  text(ctx, t('code.title'), 640, 70, { size: 40, display: true, align: 'center', color: COLORS.gold, stroke: '#000', strokeWidth: 6 });
  text(ctx, t('code.intro'), 640, 108, { size: 15, align: 'center', color: COLORS.ink, maxWidth: 1100 });
  drawBackup(ctx, v);
  drawRestore(ctx, v);
  for (const b of MAIN_BUTTONS) {
    const off = v.callsign === null && (b.id === 'copy' || b.id === 'save' || b.id === 'prev' || b.id === 'next');
    if (off || ((b.id === 'prev' || b.id === 'next') && v.pilots < 2)) continue;
    drawButton(ctx, { ...b, label: label(b) }, false, v.t);
  }
  text(ctx, t('code.hint'), 640, 704, { size: 13, align: 'center', color: COLORS.faint });
  if (v.confirm) drawConfirm(ctx, v.confirm, v.t);
}
