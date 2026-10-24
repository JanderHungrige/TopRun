import { EQUIPMENT, maxEquipmentLevel } from '../data/equipment';
import { PLANES } from '../data/planes';
import { gunLevelDef, MAX_GUN_LEVEL, SECONDARIES } from '../data/weapons';
import type { ShopItem } from '../game/economy';
import type { SaveData } from '../game/save';
import { drawPlaneTop } from '../render/draw-planes';
import { drawEquipmentIcon, drawWeaponIcon } from '../render/icons';
import { COLORS, paragraph, text } from '../render/text';
import { drawBar, drawPanel, type Rect } from '../ui/widgets';
import { gunSummary, itemDescription, itemName, itemStatus } from './hangar-items';

export const LIST = { x: 24, y: 132, w: 536, row: 78 };
export const DETAIL: Rect = { x: 584, y: 76, w: 672, h: 628 };

export function slotRects(hardpoints: number): Rect[] {
  return Array.from({ length: hardpoints }, (_, i) => ({ x: DETAIL.x + 24 + i * 112, y: DETAIL.y + 498, w: 102, h: 46 }));
}

export function rowRect(i: number): Rect {
  return { x: LIST.x, y: LIST.y + i * LIST.row, w: LIST.w, h: LIST.row - 10 };
}

function drawThumb(ctx: CanvasRenderingContext2D, item: ShopItem, x: number, y: number, t: number): void {
  switch (item.type) {
    case 'plane': drawPlaneTop(ctx, item.id, x, y, 0.9, { t, throttle: 0.3, sweep: 0.3 }); return;
    case 'gun': drawWeaponIcon(ctx, 'gun', x, y, 0.8); return;
    case 'secondary': drawWeaponIcon(ctx, item.id, x, y, 0.7); return;
    case 'equipment': drawEquipmentIcon(ctx, item.id, x, y, 32); return;
    default: throw new Error(`unhandled: ${item satisfies never}`);
  }
}

export function drawList(ctx: CanvasRenderingContext2D, save: SaveData, items: readonly ShopItem[], focus: number, t: number): void {
  items.forEach((item, i) => {
    const r = rowRect(i);
    const active = i === focus;
    drawPanel(ctx, r, { fill: active ? 'rgba(40,70,105,0.92)' : 'rgba(14,24,36,0.85)', edge: active ? COLORS.gold : COLORS.panelEdge, radius: 8 });
    drawThumb(ctx, item, r.x + 48, r.y + r.h / 2, t);
    text(ctx, itemName(item), r.x + 100, r.y + 30, { size: 17, display: true, color: active ? COLORS.gold : COLORS.ink });
    const status = itemStatus(save, item);
    const good = /OWNED|IN USE|MOUNTED|INSTALLED|MAX/.test(status);
    text(ctx, status, r.x + r.w - 16, r.y + 30, { size: 14, align: 'right', color: good ? COLORS.green : COLORS.gold });
    text(ctx, subtitle(item), r.x + 100, r.y + 52, { size: 13, color: COLORS.dim, maxWidth: r.w - 120 });
  });
}

function subtitle(item: ShopItem): string {
  switch (item.type) {
    case 'plane': return `${PLANES[item.id].hardpoints} hardpoints · special: ${PLANES[item.id].specialName}`;
    case 'gun': return 'Primary weapon upgrade';
    case 'secondary': {
      const d = SECONDARIES[item.id];
      return `${d.damage} dmg · ${d.ammoPerSlot} per hardpoint · vs ${d.hits === 'any' ? 'air + ground' : d.hits}`;
    }
    case 'equipment': return EQUIPMENT[item.id].levelText.join(' / ');
    default: throw new Error(`unhandled: ${item satisfies never}`);
  }
}

function statRow(ctx: CanvasRenderingContext2D, label: string, value: string, ratio: number, y: number): void {
  const x = DETAIL.x + 24;
  text(ctx, label, x, y + 12, { size: 13, color: COLORS.dim, letterSpacing: 1 });
  drawBar(ctx, { x: x + 120, y: y + 2, w: 300, h: 12 }, ratio, COLORS.cyan);
  text(ctx, value, x + 436, y + 13, { size: 14, color: COLORS.ink });
}

function drawStats(ctx: CanvasRenderingContext2D, save: SaveData, item: ShopItem): void {
  const y = DETAIL.y + 376;
  switch (item.type) {
    case 'plane': {
      const p = PLANES[item.id];
      statRow(ctx, 'HULL', String(p.hull), p.hull / 180, y);
      statRow(ctx, 'SPEED', `${p.speed} kn`, p.speed / 420, y + 26);
      statRow(ctx, 'HARDPOINTS', String(p.hardpoints), p.hardpoints / 4, y + 52);
      statRow(ctx, 'FIREPOWER', `×${p.gunDamageMul.toFixed(1)}`, p.gunDamageMul / 1.5, y + 78);
      text(ctx, `SPECIAL (E): ${p.specialName}`, DETAIL.x + 24, y + 124, { size: 15, color: COLORS.gold });
      return;
    }
    case 'gun': {
      text(ctx, `NOW   LV ${save.gunLevel}: ${gunSummary(save.gunLevel)}`, DETAIL.x + 24, y + 4, { size: 15, color: COLORS.ink });
      if (save.gunLevel < MAX_GUN_LEVEL) text(ctx, `NEXT  LV ${save.gunLevel + 1}: ${gunSummary(save.gunLevel + 1)}`, DETAIL.x + 24, y + 28, { size: 15, color: COLORS.green });
      statRow(ctx, 'LEVEL', `${save.gunLevel}/5`, save.gunLevel / 5, y + 52);
      statRow(ctx, 'DPS', String(Math.round(gunLevelDef(save.gunLevel).damage * gunLevelDef(save.gunLevel).shotsPerSec * gunLevelDef(save.gunLevel).pattern.length)), save.gunLevel / 5, y + 76);
      return;
    }
    case 'secondary': {
      const d = SECONDARIES[item.id];
      statRow(ctx, 'DAMAGE', String(d.damage * (d.behavior === 'fan' ? 5 : 1)), d.damage * (d.behavior === 'fan' ? 5 : 1) / 320, y);
      statRow(ctx, 'AMMO / SLOT', String(d.ammoPerSlot), d.ammoPerSlot / 12, y + 26);
      text(ctx, `Targets: ${d.hits === 'any' ? 'air and ground' : d.hits} · ${d.behavior === 'homing' ? 'guided' : d.behavior === 'fan' ? 'unguided salvo' : 'free-fall, area blast'}`, DETAIL.x + 24, y + 70, { size: 14, color: COLORS.ink });
      return;
    }
    case 'equipment': {
      const lvl = save.equipment[item.id];
      const max = maxEquipmentLevel(item.id);
      EQUIPMENT[item.id].levelText.forEach((lt, i) => {
        text(ctx, `${i < lvl ? '■' : '□'}  ${max > 1 ? `Level ${i + 1}: ` : ''}${lt}`, DETAIL.x + 24, y + 12 + i * 26, { size: 15, color: i < lvl ? COLORS.green : COLORS.ink });
      });
      return;
    }
    default: throw new Error(`unhandled: ${item satisfies never}`);
  }
}

function drawPreview(ctx: CanvasRenderingContext2D, item: ShopItem, t: number): void {
  const cx = DETAIL.x + DETAIL.w / 2;
  const cy = DETAIL.y + 166;
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(DETAIL.x + 16, DETAIL.y + 66, DETAIL.w - 32, 200, 8);
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.fill();
  ctx.restore();
  switch (item.type) {
    case 'plane':
      drawPlaneTop(ctx, item.id, cx + 20, cy + 22 + Math.sin(t * 1.4) * 4, 3, { shadow: true });
      drawPlaneTop(ctx, item.id, cx, cy + Math.sin(t * 1.4) * 4, 3, { t, throttle: 0.5 + Math.sin(t * 2) * 0.2, sweep: (Math.sin(t * 0.8) + 1) / 2, bank: Math.sin(t * 0.7) * 0.3 });
      return;
    case 'gun': drawWeaponIcon(ctx, 'gun', cx, cy, 3); return;
    case 'secondary': drawWeaponIcon(ctx, item.id, cx, cy, 3); return;
    case 'equipment': drawEquipmentIcon(ctx, item.id, cx, cy, 130); return;
    default: throw new Error(`unhandled: ${item satisfies never}`);
  }
}

export function drawDetail(ctx: CanvasRenderingContext2D, save: SaveData, item: ShopItem, t: number): void {
  drawPanel(ctx, DETAIL);
  text(ctx, itemName(item).toUpperCase(), DETAIL.x + 24, DETAIL.y + 48, { size: 28, display: true, italic: true });
  drawPreview(ctx, item, t);
  paragraph(ctx, itemDescription(item), DETAIL.x + 24, DETAIL.y + 300, DETAIL.w - 48, { size: 15, color: COLORS.ink });
  drawStats(ctx, save, item);
}

export function drawLoadout(ctx: CanvasRenderingContext2D, save: SaveData, highlight: string | null): void {
  const plane = PLANES[save.selectedPlane];
  text(ctx, `LOADOUT · ${plane.short} · ${plane.hardpoints} HARDPOINTS`, DETAIL.x + 24, DETAIL.y + 488, { size: 12, color: COLORS.dim, letterSpacing: 1.5 });
  slotRects(plane.hardpoints).forEach((r, i) => {
    const id = save.loadout[plane.id][i] ?? null;
    drawPanel(ctx, r, { fill: id ? 'rgba(30,60,40,0.9)' : 'rgba(0,0,0,0.3)', edge: id && id === highlight ? COLORS.gold : COLORS.panelEdge, radius: 6 });
    text(ctx, id ? SECONDARIES[id].short : `SLOT ${i + 1}`, r.x + r.w / 2, r.y + r.h / 2 + 5, { size: 14, display: !!id, align: 'center', color: id ? COLORS.green : COLORS.faint });
  });
}
