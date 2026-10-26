import { LOOK_PARTS, lookOptions, type AvatarLook, type LookPart } from '../game/avatar-look';
import { t } from '../i18n/i18n';
import type { UiKey } from '../i18n/ui-en';
import { drawPilotAvatar } from '../render/avatars';
import { drawSunset } from '../render/backdrop';
import { frameAround, NAME_PLATE, pixelFrame, pixelRect, PORTRAIT_FRAME } from '../render/pixel/frame';
import { COLORS, text } from '../render/text';
import { drawButton, drawPanel, type Button, type Rect } from '../ui/widgets';

// Avatar builder screen (docs 29, 33): layout shared with the scene's hit tests, and the drawing. The preview is the
// generated portrait nearest the pick, 1.5× its 240 × 288 grid (whole device pixels on DPR 2 screens).

export const PREVIEW: Rect = { x: 110, y: 116, w: 360, h: 432 };
const PLATE: Rect = { x: 130, y: 566, w: 320, h: 44 };
const ROWS_X = 530;
const ROWS_Y = 150;
const ROW_W = 670;
const ROW_H = 72;
const ROW_STEP = 90;
const ARROW_W = 56;

export const rowRect = (i: number): Rect => ({ x: ROWS_X, y: ROWS_Y + i * ROW_STEP, w: ROW_W, h: ROW_H });
/** The ◀ (dir -1) and ▶ (dir 1) arrow of a row. */
export function arrowRect(i: number, dir: -1 | 1): Rect {
  const r = rowRect(i);
  return { x: dir < 0 ? r.x + 286 : r.x + r.w - ARROW_W - 8, y: r.y + 8, w: ARROW_W, h: r.h - 16 };
}

export type BarId = 'random' | 'original' | 'cancel' | 'done';
const BAR_LABEL: Readonly<Record<BarId, UiKey>> = {
  random: 'avatar.random', original: 'avatar.original', cancel: 'avatar.cancel', done: 'avatar.done',
};

export type BarButton = Button & { id: BarId };

/** RANDOM · (ORIGINAL, for an existing pilot: back to the preset portrait) · CANCEL · DONE, filling the row width. */
export function barButtons(original: boolean): BarButton[] {
  const ids: BarId[] = original ? ['random', 'original', 'cancel', 'done'] : ['random', 'cancel', 'done'];
  const gap = 14;
  const w = (ROW_W - gap * (ids.length - 1)) / ids.length;
  return ids.map((id, i) => ({
    id, label: t(BAR_LABEL[id]), x: ROWS_X + i * (w + gap), y: 520, w, h: 56, primary: id === 'done', hint: id === 'random' ? 'R' : undefined,
  }));
}

export interface BuilderView {
  t: number;
  look: AvatarLook;
  /** 0 … rows-1 = a part row, rows = the button bar. */
  focus: number;
  bar: number;
  buttons: readonly Button[];
  title: string;
  callsign: string;
}

/** The option name of one part of a pick (every option has its own UI key). */
export function optionLabel(look: AvatarLook, part: LookPart): string {
  switch (part) {
    case 'age': return t(`avatar.age.${look.age}`);
    case 'skin': return t(`avatar.skin.${look.skin}`);
    case 'hair': return t(`avatar.hair.${look.hair}`);
    case 'length': return t(`avatar.length.${look.length}`);
    default: throw new Error(`unhandled: ${part satisfies never}`);
  }
}

/** A chunky pixel triangle pointing left (dir -1) or right (dir 1), centred on (cx, cy). */
function pixelArrow(ctx: CanvasRenderingContext2D, cx: number, cy: number, dir: -1 | 1, color: string): void {
  for (let i = 0; i < 6; i++) {
    const h = 2 + (5 - i) * 4;
    pixelRect(ctx, cx - dir * 5 + dir * i * 2 - (dir < 0 ? 2 : 0), cy - h / 2, 2, h, color);
  }
}

function renderRow(ctx: CanvasRenderingContext2D, v: BuilderView, part: LookPart, i: number): void {
  const r = rowRect(i);
  const focused = v.focus === i;
  drawPanel(ctx, r, { fill: focused ? 'rgba(30,52,80,0.95)' : 'rgba(10,18,30,0.86)', edge: focused ? COLORS.gold : COLORS.panelEdge, radius: 8 });
  text(ctx, t(`avatar.part.${part}`), r.x + 20, r.y + r.h / 2 + 1, { size: 16, baseline: 'middle', color: focused ? COLORS.ink : COLORS.dim, letterSpacing: 1.5, maxWidth: 256 });
  for (const dir of [-1, 1] as const) {
    const a = arrowRect(i, dir);
    pixelFrame(ctx, a, focused ? NAME_PLATE : PORTRAIT_FRAME, 2);
    pixelArrow(ctx, a.x + a.w / 2, a.y + a.h / 2, dir, focused ? COLORS.gold : COLORS.dim);
  }
  const options = lookOptions(part) as readonly string[];
  const left = arrowRect(i, -1);
  const mid = (left.x + left.w + arrowRect(i, 1).x) / 2;
  text(ctx, optionLabel(v.look, part), mid, r.y + r.h / 2 + 1, {
    size: 24, display: true, italic: true, align: 'center', baseline: 'middle', color: focused ? COLORS.gold : COLORS.ink, maxWidth: 220,
  });
  text(ctx, `${options.indexOf(v.look[part]) + 1}/${options.length}`, arrowRect(i, 1).x - 8, r.y + r.h - 7, { size: 10, align: 'right', color: COLORS.faint });
}

function renderPreview(ctx: CanvasRenderingContext2D, v: BuilderView): void {
  drawPilotAvatar(ctx, v.look, PREVIEW, { t: v.t });
  frameAround(ctx, PREVIEW, PORTRAIT_FRAME, 3);
  pixelFrame(ctx, PLATE, NAME_PLATE, 2);
  text(ctx, v.callsign || '· · ·', PLATE.x + PLATE.w / 2, PLATE.y + PLATE.h / 2 + 1, {
    size: 22, display: true, italic: true, align: 'center', baseline: 'middle', color: COLORS.gold, maxWidth: PLATE.w - 24,
  });
}

/** The whole builder screen. */
export function drawBuilder(ctx: CanvasRenderingContext2D, v: BuilderView): void {
  drawSunset(ctx, v.t);
  ctx.fillStyle = 'rgba(4,8,16,0.6)';
  ctx.fillRect(0, 0, 1280, 720);
  text(ctx, v.title, 640, 72, { size: 38, display: true, italic: true, align: 'center', color: COLORS.gold, stroke: '#000', strokeWidth: 6, maxWidth: 1180 });
  renderPreview(ctx, v);
  LOOK_PARTS.forEach((part, i) => renderRow(ctx, v, part, i));
  v.buttons.forEach((b, i) => drawButton(ctx, b, v.focus === LOOK_PARTS.length && v.bar === i, v.t));
  text(ctx, t('avatar.hint'), 640, 704, { size: 13, align: 'center', color: COLORS.faint });
}
