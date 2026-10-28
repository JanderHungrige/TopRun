import { BUCKET, FLOOR_Y, FRAME_W, LEDGE, SLATE, TOOL_SPOT, TOOLS, toolColor, type Box, type ToolId } from '../../data/chalkboard-layout';

// Chalkboard scene (doc 40): the room around the slate in chunky pixel steps — the hangar's corrugated wall, the
// wooden frame and ledge, the chalk sticks and the sponge waiting on the ledge, the water bucket on the floor.

const P = 4;
export const CHALK_HEX: readonly string[] = ['#eeece2', '#f6de7a', '#f2a8c6', '#a6cef2'];
const CHALK_SHADE: readonly string[] = ['#b9b6aa', '#c9a83e', '#c7779a', '#6f9cc8'];

const box = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, c: string): void => {
  ctx.fillStyle = c;
  ctx.fillRect(x, y, w, h);
};

function wall(ctx: CanvasRenderingContext2D): void {
  box(ctx, 0, 0, 1280, FLOOR_Y, '#17203a');
  for (let x = 0; x < 1280; x += 32) {
    box(ctx, x, 0, P, FLOOR_Y, '#121a30');
    box(ctx, x + P, 0, 2, FLOOR_Y, '#1e2946');
  }
  box(ctx, 0, FLOOR_Y, 1280, 720 - FLOOR_Y, '#25272e');
  box(ctx, 0, FLOOR_Y, 1280, P, '#383b45');
  for (let x = 60; x < 1280; x += 220) box(ctx, x, FLOOR_Y + 40, 120, 2, '#2d3038');
}

function frame(ctx: CanvasRenderingContext2D): void {
  const x = SLATE.x - FRAME_W;
  const y = SLATE.y - FRAME_W;
  const w = SLATE.w + 2 * FRAME_W;
  const h = SLATE.h + 2 * FRAME_W;
  box(ctx, x - P, y - P, w + 2 * P, h + 2 * P, '#140c06');
  box(ctx, x, y, w, h, '#6b4526');
  box(ctx, x, y, w, P, '#9a6a3e');
  box(ctx, x, y, P, h, '#87582f');
  box(ctx, x, y + h - P, w, P, '#4a2e18');
  box(ctx, x + w - P, y, P, h, '#4a2e18');
  for (let gx = x + 60; gx < x + w - 40; gx += 170) box(ctx, gx, y + 6, 40, 2, '#5c3a20');
  box(ctx, SLATE.x - 2, SLATE.y - 2, SLATE.w + 4, SLATE.h + 4, '#2a180c');
}

function ledge(ctx: CanvasRenderingContext2D): void {
  box(ctx, LEDGE.x - P, LEDGE.y - P, LEDGE.w + 2 * P, LEDGE.h + 2 * P, '#140c06');
  box(ctx, LEDGE.x, LEDGE.y, LEDGE.w, LEDGE.h, '#7c5434');
  box(ctx, LEDGE.x, LEDGE.y, LEDGE.w, P, '#a87a4c');
  box(ctx, LEDGE.x, LEDGE.y + LEDGE.h - P, LEDGE.w, P, '#4f321b');
  box(ctx, LEDGE.x + 8, LEDGE.y + LEDGE.h + P, LEDGE.w - 16, P, 'rgba(0,0,0,0.35)');
  for (let i = 0; i < 26; i++) box(ctx, LEDGE.x + 30 + ((i * 197) % (LEDGE.w - 60)), LEDGE.y + 1 + (i % 2) * 2, 2, 2, 'rgba(238,236,226,0.45)');
}

/** A chalk stick lying on the ledge (or anywhere): `x, y` = its left end on the ground line. */
export function chalkStick(ctx: CanvasRenderingContext2D, x: number, y: number, color: number, dim: boolean): void {
  box(ctx, x - 1, y - 11, 46, 12, '#140c06');
  box(ctx, x, y - 10, 44, 8, dim ? '#5a5650' : CHALK_HEX[color] ?? '#fff');
  box(ctx, x, y - 4, 44, 2, dim ? '#3e3b36' : CHALK_SHADE[color] ?? '#999');
  box(ctx, x + 40, y - 10, 4, 8, dim ? '#6a665f' : '#ffffff');
}

/** The sponge block, `wet` 0 … 1 (darker, glistening when wet); `x, y` = its top-left, `w × h`. */
export function spongeBlock(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, wet: number): void {
  box(ctx, x - 2, y - 2, w + 4, h + 4, '#2a1a04');
  box(ctx, x, y, w, h, wet > 0.05 ? '#c98a1a' : '#f2c84a');
  box(ctx, x, y + h - 10, w, 10, '#3f7a3a');
  box(ctx, x, y + h - 10, w, 2, '#5e9c4e');
  for (let py = y + 4; py < y + h - 12; py += 8) {
    for (let px = x + 4 + ((py / 8) % 2) * 6; px < x + w - 4; px += 12) box(ctx, px, py, 4, 4, wet > 0.05 ? '#9a6410' : '#d9a62c');
  }
  if (wet > 0.05) {
    box(ctx, x + 6, y + 4, Math.round((w - 12) * Math.min(1, wet)), 3, 'rgba(160,210,255,0.75)');
    box(ctx, x + 8, y + 10, 4, 4, 'rgba(220,240,255,0.8)');
  }
}

/** A tin pail on the floor: tapered body with two ribs, a rolled rim, rippling water, the wire handle. */
function bucket(ctx: CanvasRenderingContext2D, t: number, hot: boolean): void {
  const b = BUCKET;
  const top = b.y + 22;
  const rows = Math.round((b.y + b.h - top) / P);
  for (let i = 0; i < rows; i++) {
    const inset = Math.round((i / rows) * 14 / P) * P;
    const y = top + i * P;
    const rib = i === 4 || i === rows - 6;
    box(ctx, b.x + inset - P, y, b.w - 2 * inset + 2 * P, P, '#1a1e24');
    box(ctx, b.x + inset, y, b.w - 2 * inset, P, rib ? '#5d666e' : '#8a939b');
    box(ctx, b.x + inset, y, 12, P, rib ? '#7b848c' : '#b4bcc3');
    box(ctx, b.x + b.w - inset - 16, y, 16, P, '#6c757d');
  }
  box(ctx, b.x - 2 * P, top - 10, b.w + 4 * P, 12, '#1a1e24');
  box(ctx, b.x - P, top - 8, b.w + 2 * P, 8, '#c8cfd5');
  box(ctx, b.x + 2, top - 6, b.w - 4, 5, '#2a4c9c');
  const wave = Math.round(Math.sin(t * 2.6) * 3);
  box(ctx, b.x + 14 + wave * 2, top - 6, 34, 2, '#6fa8ee');
  box(ctx, b.x + 66 - wave * 2, top - 4, 26, 2, '#b0d4ff');
  ctx.strokeStyle = '#3a4048';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(b.x + b.w / 2, top - 6, b.w / 2 + 2, 30, 0, Math.PI * 1.06, Math.PI * 1.94);
  ctx.stroke();
  if (hot) box(ctx, b.x - 8, b.y + b.h + 6, b.w + 16, P, '#ffd76a');
}

const spotGround = (s: Box): number => s.y + s.h - 18;

/** The tools still on the ledge: every one except the one in hand; chalk greyed out when this pilot may not draw. */
function tray(ctx: CanvasRenderingContext2D, inHand: ToolId, canChalk: boolean, wet: number): void {
  for (const id of TOOLS) {
    if (id === inHand) continue;
    const s = TOOL_SPOT[id];
    const c = toolColor(id);
    if (c === null) spongeBlock(ctx, s.x + 8, spotGround(s) - 34, 80, 34, wet);
    else chalkStick(ctx, s.x + 10, spotGround(s), c, !canChalk);
  }
}

export interface RoomView { t: number; inHand: ToolId; canChalk: boolean; wet: number; bucketHot: boolean }

/** Everything except the slate, the hand-held tool and the text. */
export function drawRoom(ctx: CanvasRenderingContext2D, v: RoomView): void {
  wall(ctx);
  frame(ctx);
  ledge(ctx);
  tray(ctx, v.inHand, v.canChalk, v.wet);
  bucket(ctx, v.t, v.bucketHot);
}
