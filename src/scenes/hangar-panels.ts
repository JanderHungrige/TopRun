import type { LiveryId } from '../data/liveries';
import { PLANES } from '../data/planes';
import type { PlaneId } from '../data/types';
import { gunLevelDef, MAX_GUN2_LEVEL, SECONDARIES } from '../data/weapons';
import type { ShopItem } from '../game/economy';
import { doubleFirepower, equipmentCap, gunCap } from '../game/firepower';
import { mapTwoOpen } from '../game/progress';
import { isLiveryUnlocked } from '../game/liveries';
import type { SaveData } from '../game/save';
import { drawPlaneTop } from '../render/draw-planes';
import { drawPlaneSide } from '../render/draw-planes-side';
import { drawEquipmentIcon, drawWeaponIcon } from '../render/icons';
import { drawItemPicture } from '../render/items';
import { COLORS, paragraph, text } from '../render/text';
import { drawBar, drawPanel, type Rect } from '../ui/widgets';
import { equipmentLevelText, planeSpecialName } from '../i18n/content';
import { t as tr } from '../i18n/i18n';
import { gunSummary, itemDescription, itemName, itemStatus, secondaryTargets, statusIsOwned, unlockText } from './hangar-items';

export const LIST = { x: 24, y: 132, w: 536, row: 68 };
export const DETAIL: Rect = { x: 584, y: 76, w: 672, h: 628 };

export function slotRects(hardpoints: number): Rect[] {
  return Array.from({ length: hardpoints }, (_, i) => ({ x: DETAIL.x + 24 + i * 112, y: DETAIL.y + 498, w: 102, h: 46 }));
}

/** Lists longer than this (the 21 paint jobs with map 2, doc 09) run in two columns. */
const ONE_COLUMN = 12;

/** Rows shrink so long lists (7 equipment items) stay above the crew chief. */
export const rowHeight = (count: number): number =>
  Math.min(LIST.row, Math.floor(412 / Math.max(1, count > ONE_COLUMN ? Math.ceil(count / 2) : count)));

export function rowRect(i: number, count: number): Rect {
  const h = rowHeight(count);
  if (count <= ONE_COLUMN) return { x: LIST.x, y: LIST.y + i * h, w: LIST.w, h: h - 8 };
  const half = Math.ceil(count / 2);
  const w = (LIST.w - 8) / 2;
  return { x: LIST.x + (i < half ? 0 : w + 8), y: LIST.y + (i % half) * h, w, h: h - 6 };
}

function padlock(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.strokeStyle = COLORS.gold;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y - 4, 4, Math.PI, 0);
  ctx.stroke();
  ctx.fillStyle = COLORS.gold;
  ctx.fillRect(x - 6, y - 4, 12, 9);
}

function liveryThumb(ctx: CanvasRenderingContext2D, save: SaveData, id: LiveryId, x: number, y: number, t: number): void {
  const unlocked = isLiveryUnlocked(save.progress, id);
  const opts = { t, throttle: unlocked ? 0.3 : 0, sweep: 0.3, livery: id };
  // Nose to the right so the jet fits the short PAINT rows.
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(Math.PI / 2);
  drawPlaneTop(ctx, save.selectedPlane, 0, 0, 0.5, opts);
  // Locked: darken with the solid outline twice (transparency would show the art's layers).
  if (!unlocked) for (let i = 0; i < 2; i++) drawPlaneTop(ctx, save.selectedPlane, 0, 0, 0.5, { ...opts, shadow: true });
  ctx.restore();
  if (!unlocked) padlock(ctx, x + 26, y + 4);
}

function drawThumb(ctx: CanvasRenderingContext2D, save: SaveData, item: ShopItem, x: number, y: number, t: number): void {
  switch (item.type) {
    case 'plane': drawPlaneTop(ctx, item.id, x, y, 0.9, { t, throttle: 0.3, sweep: 0.3, livery: save.livery[item.id] }); return;
    case 'gun': if (!drawItemPicture(ctx, 'gun', x, y, true)) drawWeaponIcon(ctx, 'gun', x, y, 0.8); return;
    case 'gun2': drawWeaponIcon(ctx, 'gun2', x, y, 0.8); return;
    case 'secondary': if (!drawItemPicture(ctx, item.id, x, y, true)) drawWeaponIcon(ctx, item.id, x, y, 0.7); return;
    case 'equipment': if (!drawItemPicture(ctx, item.id, x, y, true)) drawEquipmentIcon(ctx, item.id, x, y, 32); return;
    case 'livery': liveryThumb(ctx, save, item.id, x, y, t); return;
    default: throw new Error(`unhandled: ${item satisfies never}`);
  }
}

export function drawList(ctx: CanvasRenderingContext2D, save: SaveData, items: readonly ShopItem[], focus: number, t: number): void {
  items.forEach((item, i) => {
    const r = rowRect(i, items.length);
    const active = i === focus;
    drawPanel(ctx, r, { fill: active ? 'rgba(40,70,105,0.92)' : 'rgba(14,24,36,0.85)', edge: active ? COLORS.gold : COLORS.panelEdge, radius: 8 });
    const status = itemStatus(save, item);
    const statusColor = statusIsOwned(save, item) ? COLORS.green : COLORS.gold;
    if (r.w < LIST.w / 2) return narrowRow(ctx, save, item, r, active, status, statusColor, t);
    drawThumb(ctx, save, item, r.x + 48, r.y + r.h / 2, t);
    // Short rows (the 11 paint jobs) show one line; the unlock condition is in the detail panel.
    const compact = r.h < 44;
    const line = compact ? r.y + r.h / 2 + 6 : r.y + 26;
    text(ctx, status, r.x + r.w - 14, line, { size: 13, align: 'right', color: statusColor });
    text(ctx, itemName(item), r.x + 100, line, { size: compact ? 15 : 16, display: true, color: active ? COLORS.gold : COLORS.ink, maxWidth: r.w - 250 });
    if (!compact) text(ctx, subtitle(save, item), r.x + 100, r.y + 46, { size: 12, color: COLORS.dim, maxWidth: r.w - 116 });
  });
}

/** A row of the two-column list (doc 09): small thumbnail, the name over its status. */
function narrowRow(
  ctx: CanvasRenderingContext2D, save: SaveData, item: ShopItem, r: Rect, active: boolean, status: string, color: string, t: number,
): void {
  ctx.save();
  ctx.translate(r.x + 34, r.y + r.h / 2);
  ctx.scale(0.75, 0.75);
  drawThumb(ctx, save, item, 0, 0, t);
  ctx.restore();
  text(ctx, itemName(item), r.x + 66, r.y + r.h / 2 - 2, { size: 13, display: true, color: active ? COLORS.gold : COLORS.ink, maxWidth: r.w - 76 });
  text(ctx, status, r.x + 66, r.y + r.h / 2 + 12, { size: 11, color, maxWidth: r.w - 76 });
}

function subtitle(save: SaveData, item: ShopItem): string {
  switch (item.type) {
    case 'plane': return tr('hangar.planeSub', { hardpoints: PLANES[item.id].hardpoints, special: planeSpecialName(item.id) });
    case 'gun': return tr('hangar.gunSub');
    case 'gun2': return tr('hangar.gun2Sub');
    case 'secondary': {
      const d = SECONDARIES[item.id];
      return tr('hangar.secSub', { damage: d.damage, ammo: d.ammoPerSlot, targets: secondaryTargets(item.id) });
    }
    case 'equipment': return equipmentLevelText(item.id).join(' / ');
    case 'livery':
      return isLiveryUnlocked(save.progress, item.id) ? tr('hangar.paintFree', { plane: PLANES[save.selectedPlane].short }) : unlockText(item.id);
    default: throw new Error(`unhandled: ${item satisfies never}`);
  }
}

function statRow(ctx: CanvasRenderingContext2D, label: string, value: string, ratio: number, y: number): void {
  const x = DETAIL.x + 24;
  text(ctx, label, x, y + 12, { size: 13, color: COLORS.dim, letterSpacing: 1, maxWidth: 150 });
  drawBar(ctx, { x: x + 160, y: y + 2, w: 280, h: 12 }, ratio, COLORS.cyan);
  text(ctx, value, x + 456, y + 13, { size: 14, color: COLORS.ink });
}

/** Gun or second gun (doc 37): the level now and next, level bar and DPS; level 0 = not fitted. */
function gunStats(ctx: CanvasRenderingContext2D, level: number, cap: number, y: number): void {
  if (level > 0) text(ctx, tr('hangar.gunNow', { level, summary: gunSummary(level) }), DETAIL.x + 24, y + 4, { size: 15, color: COLORS.ink, maxWidth: DETAIL.w - 48 });
  if (level < cap) text(ctx, tr('hangar.gunNext', { level: level + 1, summary: gunSummary(level + 1) }), DETAIL.x + 24, y + 28, { size: 15, color: COLORS.green, maxWidth: DETAIL.w - 48 });
  const d = gunLevelDef(Math.max(1, level));
  statRow(ctx, tr('hangar.statLevel'), `${level}/${cap}`, level / cap, y + 52);
  statRow(ctx, 'DPS', level > 0 ? String(Math.round(d.damage * d.shotsPerSec * d.pattern.length)) : '0', level > 0 ? (d.damage * d.shotsPerSec * d.pattern.length) / 1500 : 0, y + 76);
}

function drawStats(ctx: CanvasRenderingContext2D, save: SaveData, item: ShopItem): void {
  const y = DETAIL.y + 376;
  switch (item.type) {
    case 'plane': {
      const p = PLANES[item.id];
      statRow(ctx, tr('hangar.statHull'), String(p.hull), p.hull / 180, y);
      statRow(ctx, tr('hangar.statSpeed'), `${p.speed} kn`, p.speed / 420, y + 26);
      statRow(ctx, tr('hangar.statHardpoints'), String(p.hardpoints), p.hardpoints / 4, y + 52);
      statRow(ctx, tr('hangar.statFirepower'), `×${p.gunDamageMul.toFixed(1)}`, p.gunDamageMul / 1.5, y + 78);
      text(ctx, tr('hangar.special', { name: planeSpecialName(p.id) }), DETAIL.x + 24, y + 124, { size: 15, color: COLORS.gold });
      return;
    }
    case 'gun':
      gunStats(ctx, save.gunLevel, gunCap(save), y);
      if (doubleFirepower(save.selectedPlane) && mapTwoOpen(save)) text(ctx, tr('hangar.gunNewJets'), DETAIL.x + 24, y + 112, { size: 12, color: COLORS.dim, maxWidth: DETAIL.w - 48 });
      return;
    case 'gun2':
      gunStats(ctx, save.gun2Level, MAX_GUN2_LEVEL, y);
      return;
    case 'secondary': {
      const d = SECONDARIES[item.id];
      statRow(ctx, tr('hangar.statDamage'), String(d.damage * (d.behavior === 'fan' ? 5 : 1)), d.damage * (d.behavior === 'fan' ? 5 : 1) / 320, y);
      const twin = doubleFirepower(save.selectedPlane) && save.twinSecondaries.includes(item.id);
      statRow(ctx, tr('hangar.statAmmo'), twin ? `${d.ammoPerSlot} ×2` : String(d.ammoPerSlot), (d.ammoPerSlot * (twin ? 2 : 1)) / 12, y + 26);
      const guidance = tr(d.behavior === 'homing' ? 'hangar.guided' : d.behavior === 'fan' ? 'hangar.salvo' : 'hangar.freefall');
      text(ctx, tr('hangar.targets', { targets: secondaryTargets(item.id), guidance }), DETAIL.x + 24, y + 70, { size: 14, color: COLORS.ink });
      if (mapTwoOpen(save)) text(ctx, tr('hangar.twinInfo'), DETAIL.x + 24, y + 98, { size: 12, color: COLORS.dim, maxWidth: DETAIL.w - 250 });
      return;
    }
    case 'equipment': {
      const lvl = save.equipment[item.id];
      const max = equipmentCap(save, item.id);
      equipmentLevelText(item.id).slice(0, max).forEach((lt, i) => {
        text(ctx, `${i < lvl ? '■' : '□'}  ${max > 1 ? tr('hangar.levelRow', { n: i + 1, text: lt }) : lt}`, DETAIL.x + 24, y + 12 + i * 26, { size: 15, color: i < lvl ? COLORS.green : COLORS.ink });
      });
      return;
    }
    case 'livery':
      text(ctx, tr('hangar.paintSide'), DETAIL.x + 24, y + 4, { size: 12, color: COLORS.dim, letterSpacing: 1.5 });
      drawPlaneSide(ctx, save.selectedPlane, DETAIL.x + DETAIL.w / 2, y + 112, 1.5, { gear: 1, livery: item.id });
      return;
    default: throw new Error(`unhandled: ${item satisfies never}`);
  }
}

function showcase(ctx: CanvasRenderingContext2D, plane: PlaneId, livery: LiveryId, cx: number, cy: number, t: number): void {
  const bob = Math.sin(t * 1.4) * 4;
  drawPlaneTop(ctx, plane, cx + 20, cy + 22 + bob, 3, { shadow: true });
  drawPlaneTop(ctx, plane, cx, cy + bob, 3, {
    t, throttle: 0.5 + Math.sin(t * 2) * 0.2, sweep: (Math.sin(t * 0.8) + 1) / 2, bank: Math.sin(t * 0.7) * 0.3, livery,
  });
}

function drawPreview(ctx: CanvasRenderingContext2D, save: SaveData, item: ShopItem, t: number): void {
  const cx = DETAIL.x + DETAIL.w / 2;
  const cy = DETAIL.y + 166;
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(DETAIL.x + 16, DETAIL.y + 66, DETAIL.w - 32, 200, 8);
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.fill();
  ctx.restore();
  switch (item.type) {
    case 'plane': return showcase(ctx, item.id, save.livery[item.id], cx, cy, t);
    case 'livery': return showcase(ctx, save.selectedPlane, item.id, cx, cy, t);
    case 'gun': if (!drawItemPicture(ctx, 'gun', cx, cy, false)) drawWeaponIcon(ctx, 'gun', cx, cy, 3); return;
    case 'gun2': drawWeaponIcon(ctx, 'gun2', cx, cy, 3); return;
    case 'secondary': if (!drawItemPicture(ctx, item.id, cx, cy, false)) drawWeaponIcon(ctx, item.id, cx, cy, 3); return;
    case 'equipment': if (!drawItemPicture(ctx, item.id, cx, cy, false)) drawEquipmentIcon(ctx, item.id, cx, cy, 130); return;
    default: throw new Error(`unhandled: ${item satisfies never}`);
  }
}

export function drawDetail(ctx: CanvasRenderingContext2D, save: SaveData, item: ShopItem, t: number): void {
  drawPanel(ctx, DETAIL);
  text(ctx, itemName(item).toUpperCase(), DETAIL.x + 24, DETAIL.y + 48, { size: 28, display: true, italic: true });
  drawPreview(ctx, save, item, t);
  paragraph(ctx, itemDescription(item), DETAIL.x + 24, DETAIL.y + 300, DETAIL.w - 48, { size: 15, color: COLORS.ink });
  drawStats(ctx, save, item);
}

export function drawLoadout(ctx: CanvasRenderingContext2D, save: SaveData, highlight: string | null): void {
  const plane = PLANES[save.selectedPlane];
  text(ctx, tr('hangar.loadout', { plane: plane.short, n: plane.hardpoints }), DETAIL.x + 24, DETAIL.y + 488, { size: 12, color: COLORS.dim, letterSpacing: 1.5 });
  slotRects(plane.hardpoints).forEach((r, i) => {
    const id = save.loadout[plane.id][i] ?? null;
    drawPanel(ctx, r, { fill: id ? 'rgba(30,60,40,0.9)' : 'rgba(0,0,0,0.3)', edge: id && id === highlight ? COLORS.gold : COLORS.panelEdge, radius: 6 });
    text(ctx, id ? SECONDARIES[id].short : tr('hangar.slot', { n: i + 1 }), r.x + r.w / 2, r.y + r.h / 2 + 5, { size: 14, display: !!id, align: 'center', color: id ? COLORS.green : COLORS.faint });
  });
}
