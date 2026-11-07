import { formatMoney } from '../core/math';
import { GRID, MAX_LASER_LEVEL, type ModuleId } from '../data/ship-modules';
import { canPlace, shipStats } from '../game/ship';
import { canBuyLaser, canBuyModule, laserPrice, modulePrice } from '../game/ship-shop';
import type { SaveData } from '../game/save';
import { t } from '../i18n/i18n';
import type { UiKey } from '../i18n/ui-en';
import { liveryLook } from '../render/livery-art';
import { drawModuleIcon, drawShip } from '../render/ship';
import { COLORS, paragraph, text } from '../render/text';
import { drawButton, drawPanel, type Rect } from '../ui/widgets';

// The shipyard's screen (doc 55): the grid with the ship on it, the module list, the stats and the BUY button.

export type YardRow = 'power' | ModuleId;

export interface YardView {
  save: SaveData;
  row: YardRow;
  rowIndex: number;
  mode: 'list' | 'grid';
  cursor: { col: number; row: number };
  note: string;
  time: number;
}

const CELL = 54;
const GRID_X = 40;
const GRID_Y = 110;
const LIST = { x: 450, y: 110, w: 400, row: 60 };
const DETAIL: Rect = { x: 870, y: 110, w: 370, h: 540 };
export const BTN = Object.freeze({
  map: { x: 1150, y: 22, w: 110, h: 44 },
  base: { x: 1030, y: 22, w: 110, h: 44 },
  buy: { x: DETAIL.x + 20, y: DETAIL.y + DETAIL.h - 66, w: DETAIL.w - 40, h: 48 },
});

const MODULE_KEY: Readonly<Record<YardRow, { name: UiKey; desc: UiKey }>> = {
  power: { name: 'shipyard.power', desc: 'shipyard.powerDesc' },
  core: { name: 'module.core', desc: 'moduleDesc.core' },
  capsule: { name: 'module.capsule', desc: 'moduleDesc.capsule' },
  plate: { name: 'module.plate', desc: 'moduleDesc.plate' },
  engine: { name: 'module.engine', desc: 'moduleDesc.engine' },
  laser: { name: 'module.laser', desc: 'moduleDesc.laser' },
  rockets: { name: 'module.rockets', desc: 'moduleDesc.rockets' },
  shield: { name: 'module.shield', desc: 'moduleDesc.shield' },
  reactor: { name: 'module.reactor', desc: 'moduleDesc.reactor' },
};

export const rowRect = (i: number): Rect => ({ x: LIST.x, y: LIST.y + i * LIST.row, w: LIST.w, h: LIST.row - 6 });
const cellRect = (col: number, row: number): Rect => ({ x: GRID_X + col * CELL, y: GRID_Y + row * CELL, w: CELL, h: CELL });

export function cellAt(p: { x: number; y: number }): { col: number; row: number } | null {
  const col = Math.floor((p.x - GRID_X) / CELL);
  const row = Math.floor((p.y - GRID_Y) / CELL);
  return col >= 0 && col < GRID.cols && row >= 0 && row < GRID.rows ? { col, row } : null;
}

function drawGrid(ctx: CanvasRenderingContext2D, v: YardView): void {
  drawPanel(ctx, { x: GRID_X - 12, y: GRID_Y - 12, w: GRID.cols * CELL + 24, h: GRID.rows * CELL + 24 }, { fill: 'rgba(8,14,30,0.92)' });
  const picked = v.row === 'power' || v.row === 'core' ? null : v.row;
  for (let col = 0; col < GRID.cols; col++) {
    for (let row = 0; row < GRID.rows; row++) {
      const r = cellRect(col, row);
      const ok = v.mode === 'grid' && picked !== null && v.save.ship.stock[picked] > 0 && canPlace(v.save.ship, picked, col, row).ok;
      ctx.fillStyle = ok ? 'rgba(91,227,125,0.22)' : 'rgba(255,255,255,0.03)';
      ctx.fillRect(r.x + 1, r.y + 1, r.w - 2, r.h - 2);
    }
  }
  ctx.save();
  const core = cellRect(GRID.core.col, GRID.core.row);
  ctx.translate(core.x + CELL / 2, core.y + CELL / 2);
  drawShip(ctx, v.save.ship.modules, liveryLook('starship', 'standard'), { cell: CELL, t: v.time, throttle: 0.5 });
  ctx.restore();
  if (v.mode === 'grid') {
    const c = cellRect(v.cursor.col, v.cursor.row);
    ctx.strokeStyle = COLORS.gold;
    ctx.lineWidth = 3;
    ctx.strokeRect(c.x + 2, c.y + 2, c.w - 4, c.h - 4);
  }
}

function rowSub(v: YardView, row: YardRow): string {
  if (row === 'power' || row === 'core') return t('shipyard.powerSub', { level: v.save.ship.laserLevel, max: MAX_LASER_LEVEL });
  const placed = v.save.ship.modules.filter((m) => m.id === row).length;
  return t('shipyard.stockSub', { stock: v.save.ship.stock[row], placed });
}

const priceOf = (v: YardView, row: YardRow): number | null =>
  (row === 'power' || row === 'core' ? laserPrice(v.save) : modulePrice(v.save, row));

function drawList(ctx: CanvasRenderingContext2D, v: YardView, rows: readonly YardRow[]): void {
  const look = liveryLook('starship', 'standard');
  rows.forEach((row, i) => {
    const r = rowRect(i);
    const on = i === v.rowIndex;
    drawPanel(ctx, r, { fill: on ? 'rgba(30,52,80,0.95)' : 'rgba(10,18,30,0.9)', edge: on ? COLORS.gold : COLORS.panelEdge, radius: 8 });
    drawModuleIcon(ctx, row === 'power' ? 'laser' : row, r.x + 32, r.y + r.h / 2, 30, look, v.time);
    text(ctx, t(MODULE_KEY[row].name), r.x + 64, r.y + 22, { size: 16, display: true, color: on ? COLORS.gold : COLORS.ink, maxWidth: 230 });
    text(ctx, rowSub(v, row), r.x + 64, r.y + 42, { size: 12, color: COLORS.dim, maxWidth: 230 });
    const price = priceOf(v, row);
    text(ctx, price === null ? t('hangar.maxed') : formatMoney(price), r.x + r.w - 12, r.y + 32, { size: 14, align: 'right', color: price === null ? COLORS.dim : COLORS.green });
  });
}

function statLine(ctx: CanvasRenderingContext2D, label: UiKey, value: string, y: number): void {
  text(ctx, t(label), DETAIL.x + 20, y, { size: 12, color: COLORS.dim, letterSpacing: 1.5 });
  text(ctx, value, DETAIL.x + DETAIL.w - 20, y, { size: 15, align: 'right', display: true });
}

function drawDetail(ctx: CanvasRenderingContext2D, v: YardView): void {
  drawPanel(ctx, DETAIL);
  text(ctx, t(MODULE_KEY[v.row].name).toUpperCase(), DETAIL.x + 20, DETAIL.y + 36, { size: 22, display: true, italic: true, maxWidth: DETAIL.w - 40 });
  const st = shipStats(v.save.ship);
  paragraph(ctx, t(MODULE_KEY[v.row].desc, { barrels: st.barrels.length }), DETAIL.x + 20, DETAIL.y + 68, DETAIL.w - 40, { size: 14, color: COLORS.ink });
  const y = DETAIL.y + 230;
  statLine(ctx, 'shipyard.hull', String(st.hull), y);
  statLine(ctx, 'shipyard.shield', String(st.shield), y + 30);
  statLine(ctx, 'shipyard.speed', `${st.speed} kn`, y + 60);
  statLine(ctx, 'shipyard.powerLeft', String(st.power), y + 90);
  statLine(ctx, 'shipyard.mass', String(st.mass), y + 120);
  statLine(ctx, 'shipyard.lasers', String(st.barrels.length), y + 150);
  statLine(ctx, 'shipyard.wings', String(st.rocketWings), y + 180);
  const price = priceOf(v, v.row);
  const ok = v.row === 'power' || v.row === 'core' ? canBuyLaser(v.save).ok : canBuyModule(v.save, v.row).ok;
  const label = price === null ? t('hangar.maxed') : t('shipyard.buy', { price: formatMoney(price) });
  drawButton(ctx, { id: 'buy', label, ...BTN.buy, primary: true, enabled: ok, hint: 'ENTER' }, v.mode === 'list' && ok, v.time);
}

export function drawShipyard(ctx: CanvasRenderingContext2D, v: YardView, rows: readonly YardRow[] = ['power', 'capsule', 'plate', 'engine', 'laser', 'rockets', 'shield', 'reactor']): void {
  ctx.fillStyle = '#060a16';
  ctx.fillRect(0, 0, 1280, 720);
  for (let i = 0; i < 90; i++) {
    ctx.fillStyle = i % 9 === 0 ? 'rgba(255,255,255,0.8)' : 'rgba(190,205,255,0.35)';
    ctx.fillRect((i * 137.3) % 1280, (i * 71.9 + 13) % 720, 1.5, 1.5);
  }
  text(ctx, t('shipyard.title'), 40, 58, { size: 34, display: true, italic: true, color: COLORS.gold });
  text(ctx, formatMoney(v.save.money), 1010, 56, { size: 26, display: true, align: 'right', color: COLORS.green });
  drawButton(ctx, { id: 'base', label: t('hangar.base'), ...BTN.base, hint: 'B' }, false, v.time);
  drawButton(ctx, { id: 'map', label: t('shipyard.map'), ...BTN.map, hint: 'ESC' }, false, v.time);
  drawGrid(ctx, v);
  drawList(ctx, v, rows);
  drawDetail(ctx, v);
  const hint = t(v.mode === 'grid' ? 'shipyard.hintGrid' : 'shipyard.hintList');
  text(ctx, v.note || hint, 640, 700, { size: 14, align: 'center', color: v.note ? COLORS.gold : COLORS.faint });
}
