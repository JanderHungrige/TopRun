import { BASE_AREA_IDS, BASE_AREAS, type BaseAreaId } from '../../data/base-areas';
import { NAME_PLATE, pixelFrame, RPG_BOX, type FrameStyle } from '../pixel/frame';
import { measure, text } from '../text';

// Hangar base (doc 30): the readable layer over the pixel art — a name plate per area (gold when highlighted),
// the bottom strip with the highlighted area's name, its one-line hint and the controls, and the title plate.
// All strings come in already translated (t()).

export interface HangarText {
  names: Readonly<Record<BaseAreaId, string>>;
  hint: string;
  keys: string;
  title: string;
}

const DIM_PLATE: FrameStyle = { outline: '#06080f', light: '#8a96b8', shadow: '#3a4562', inner: '#06080f', fill: '#121a2e' };
const GOLD = '#ffd76a';
const INK = '#f3ead2';
const DIM = '#9aa6bf';
const STRIP = { x: 300, y: 652, w: 680, h: 58 } as const;

function plate(ctx: CanvasRenderingContext2D, cx: number, cy: number, label: string, on: boolean): void {
  const size = on ? 15 : 13;
  const w = measure(ctx, label, size, true) + (on ? 30 : 24);
  const h = on ? 28 : 24;
  pixelFrame(ctx, { x: cx - w / 2, y: cy - h / 2, w, h }, on ? NAME_PLATE : DIM_PLATE, 2);
  text(ctx, label, cx, cy + size * 0.36, { size, display: true, align: 'center', color: on ? GOLD : '#c9d3e6' });
}

function strip(ctx: CanvasRenderingContext2D, name: string, hint: string, keys: string): void {
  pixelFrame(ctx, STRIP, RPG_BOX, 2);
  const x = STRIP.x + 22;
  const nameW = Math.min(240, measure(ctx, name, 18, true));
  text(ctx, name, x, STRIP.y + 26, { size: 18, display: true, color: GOLD, maxWidth: 240 });
  text(ctx, hint, x + nameW + 14, STRIP.y + 25, { size: 15, type: true, color: INK, maxWidth: STRIP.x + STRIP.w - 22 - (x + nameW + 14) });
  text(ctx, keys, STRIP.x + STRIP.w - 22, STRIP.y + 47, { size: 12, align: 'right', color: DIM, maxWidth: STRIP.w - 44 });
}

function title(ctx: CanvasRenderingContext2D, s: string): void {
  const w = measure(ctx, s, 18, true) + 34;
  pixelFrame(ctx, { x: 1262 - w, y: 12, w, h: 32 }, NAME_PLATE, 2);
  text(ctx, s, 1262 - w / 2, 34, { size: 18, display: true, italic: true, align: 'center', color: GOLD });
}

/** Plates, strip and title for the highlighted area. */
export function drawLabels(ctx: CanvasRenderingContext2D, focus: BaseAreaId, tx: HangarText): void {
  for (const id of BASE_AREA_IDS) {
    if (id === focus) continue;
    const a = BASE_AREAS[id];
    plate(ctx, a.plate.x, a.plate.y, tx.names[id], false);
  }
  const f = BASE_AREAS[focus];
  plate(ctx, f.plate.x, f.plate.y, tx.names[focus], true);
  strip(ctx, tx.names[focus], tx.hint, tx.keys);
  title(ctx, tx.title);
}
