import type { LiveryId } from '../data/liveries';
import { PLANES } from '../data/planes';
import type { MechId, PlaneId, SecondaryId } from '../data/types';
import { AMMO_LEVELS, INCENDIARY_LEVELS } from '../data/arsenal';
import { heLevelDef, MAX_HE_LEVEL } from '../data/he-gun';
import { FLEET, isFleet, type FleetKitId } from '../data/fleet';
import { gunLevelDef, jetGunDef, MAX_GUN2_LEVEL, MAX_GUN_LEVEL, SECONDARIES } from '../data/weapons';
import { incendiaryCap } from '../game/ammo';
import { ammoCap, markOf } from '../game/arsenal';
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
import { drawPanel, type Rect } from '../ui/widgets';
import { equipmentLevelText, planeSpecialName } from '../i18n/content';
import { t as tr } from '../i18n/i18n';
import {
  FLEET_UI, gunSummary, itemDescription, itemName, itemStatus, markName, secondaryTargets, statusIsOwned, unlockText, weaponNowNext,
} from './hangar-items';
import { equipmentEffectRow, planeStats, statRow } from './hangar-stats-view';
import { guidanceKey, roundsLine } from './hangar-mech';
import { heliLevel, heliMax, heliPicture, heliRows, heliSubtitle } from './hangar-heli';

export const LIST = { x: 24, y: 132, w: 536, row: 68 };
export const DETAIL: Rect = { x: 584, y: 76, w: 672, h: 628 };

/** The loadout row; the Hind's six stations get narrower slots (doc 51). */
export function slotRects(hardpoints: number): Rect[] {
  const w = Math.min(102, Math.floor((DETAIL.w - 38) / hardpoints) - 10);
  return Array.from({ length: hardpoints }, (_, i) => ({ x: DETAIL.x + 24 + i * (w + 10), y: DETAIL.y + 498, w, h: 46 }));
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
    case 'gun': if (!drawItemPicture(ctx, item.fleet ? FLEET[item.fleet].gunPicture : 'gun', x, y, true)) drawWeaponIcon(ctx, 'gun', x, y, 0.8); return;
    case 'gun2': drawWeaponIcon(ctx, 'gun2', x, y, 0.8); return;
    case 'ammo': if (!drawItemPicture(ctx, 'ammo', x, y, true)) drawWeaponIcon(ctx, 'ammo', x, y, 0.8); return;
    case 'incendiary':
    case 'he': if (!drawItemPicture(ctx, item.type, x, y, true)) drawWeaponIcon(ctx, item.type, x, y, 0.8); return;
    case 'secondary': if (!drawItemPicture(ctx, item.id, x, y, true)) drawWeaponIcon(ctx, item.id, x, y, 0.7); return;
    case 'heliMod': case 'heliRounds': if (!drawItemPicture(ctx, heliPicture(item), x, y, true)) drawWeaponIcon(ctx, heliPicture(item), x, y, 0.8); return;
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
    case 'ammo': return tr('arsenal.ammoSub');
    case 'incendiary': return tr('arsenal.incSub');
    case 'he': return tr('arsenal.heSub');
    case 'secondary': {
      const w = weaponNowNext(save, item.id).now;
      const fan = SECONDARIES[item.id].behavior === 'fan' ? 5 : 1;
      return tr('hangar.secSub', { damage: w.damage * fan, ammo: w.ammoPerSlot, targets: secondaryTargets(item.id) });
    }
    case 'heliMod': case 'heliRounds': return heliSubtitle(item);
    case 'equipment': {
      // The level on sale next (doc 43: lists of up to seven levels no longer fit one line), else the current one.
      const texts = equipmentLevelText(item.id);
      const lvl = save.equipment[item.id];
      const next = lvl < equipmentCap(save, item.id) ? texts[lvl] : undefined;
      return next ? tr('arsenal.next', { text: next }) : texts[Math.max(0, lvl - 1)] ?? '';
    }
    case 'livery':
      return isLiveryUnlocked(save.progress, item.id) ? tr('hangar.paintFree', { plane: PLANES[save.selectedPlane].short }) : unlockText(item.id);
    default: throw new Error(`unhandled: ${item satisfies never}`);
  }
}

/** A labelled bar; `barW` shrinks it for the weapons, whose UPGRADE and TWIN PODS buttons sit on the right. */
/** Gun or second gun (doc 37): the level now and next, level bar and DPS; level 0 = not fitted; `twin`: a new jet's gun;
 *  `fleet`: a fleet kit's gun, measured against its own top level (docs 49, 66). */
function gunStats(ctx: CanvasRenderingContext2D, level: number, cap: number, y: number, twin = false, fleet?: FleetKitId): void {
  if (level > 0) text(ctx, tr('hangar.gunNow', { level, summary: gunSummary(level, twin, fleet) }), DETAIL.x + 24, y + 4, { size: 15, color: COLORS.ink, maxWidth: DETAIL.w - 48 });
  if (level < cap) text(ctx, tr('hangar.gunNext', { level: level + 1, summary: gunSummary(level + 1, twin, fleet) }), DETAIL.x + 24, y + 28, { size: 15, color: COLORS.green, maxWidth: DETAIL.w - 48 });
  const d = fleet ? FLEET[fleet].gunDef(Math.max(1, level)) : jetGunDef(Math.max(1, level), twin);
  statRow(ctx, DETAIL, tr('hangar.statLevel'), `${level}/${cap}`, level / cap, y + 52);
  const top = fleet ? FLEET[fleet].gunDef(FLEET[fleet].maxGun) : gunLevelDef(MAX_GUN_LEVEL);
  const dps = (g: typeof d): number => g.damage * g.shotsPerSec * g.pattern.length;
  statRow(ctx, DETAIL, 'DPS', level > 0 ? String(Math.round(dps(d))) : '0', level > 0 ? dps(d) / dps(top) : 0, y + 76);
}

/** The Bofors HE gun (doc 46): now and next, level bar and its single-target DPS. */
function heStats(ctx: CanvasRenderingContext2D, level: number, y: number): void {
  const line = (l: number): string => {
    const d = heLevelDef(l);
    return d ? tr('arsenal.heSummary', { rate: d.shotsPerSec, damage: d.damage, radius: d.radius }) : '';
  };
  if (level > 0) text(ctx, tr('hangar.gunNow', { level, summary: line(level) }), DETAIL.x + 24, y + 4, { size: 15, color: COLORS.ink, maxWidth: DETAIL.w - 48 });
  if (level < MAX_HE_LEVEL) text(ctx, tr('hangar.gunNext', { level: level + 1, summary: line(level + 1) }), DETAIL.x + 24, y + 28, { size: 15, color: COLORS.green, maxWidth: DETAIL.w - 48 });
  const dps = (l: number): number => { const d = heLevelDef(l); return d ? d.damage * d.shotsPerSec : 0; };
  statRow(ctx, DETAIL, tr('hangar.statLevel'), `${level}/${MAX_HE_LEVEL}`, level / MAX_HE_LEVEL, y + 52);
  statRow(ctx, DETAIL, 'DPS', String(Math.round(dps(level))), dps(level) / dps(MAX_HE_LEVEL), y + 76);
}

/** Ammo rows leave room for the LOAD button on the right (doc 45) and stop above the loadout slots. */
const AMMO_ROWS = { maxW: DETAIL.w - 290, rows: 4 };

/** Rows shown at most: a long ladder (wave 3, doc 43) shows the window around the next level. */
const LEVEL_ROWS = 6;

/** One row per level on sale: ■ owned, □ not yet (equipment, ammo). */
function levelRows(ctx: CanvasRenderingContext2D, level: number, cap: number, texts: readonly string[], y: number, o = { maxW: DETAIL.w - 48, rows: LEVEL_ROWS }): void {
  const step = cap > 5 ? 24 : 26;
  const first = Math.max(0, Math.min(cap - o.rows, level - 2));
  texts.slice(0, cap).forEach((lt, i) => {
    if (i < first || i >= first + o.rows) return;
    const row = `${i < level ? '■' : '□'}  ${cap > 1 ? tr('hangar.levelRow', { n: i + 1, text: lt }) : lt}`;
    text(ctx, row, DETAIL.x + 24, y + 12 + (i - first) * step, { size: 15, color: i < level ? COLORS.green : COLORS.ink, maxWidth: o.maxW });
  });
}

/** A weapon at its mark: damage and ammo now → after the next mark, the marks owned, targets (doc 43). */
function weaponStatsRows(ctx: CanvasRenderingContext2D, save: SaveData, id: SecondaryId, y: number): void {
  const d = SECONDARIES[id];
  const { now, next } = weaponNowNext(save, id);
  const fan = d.behavior === 'fan' ? 5 : 1;
  const twin = doubleFirepower(save.selectedPlane) && save.twinSecondaries.includes(id) ? 2 : 1;
  const arrow = (a: number, b: number | undefined): string => (b !== undefined && b !== a ? `${a} → ${b}` : String(a));
  statRow(ctx, DETAIL, tr('hangar.statDamage'), arrow(now.damage * fan, next ? next.damage * fan : undefined), (now.damage * fan) / 480, y, 150);
  const ammo = arrow(now.ammoPerSlot, next?.ammoPerSlot);
  statRow(ctx, DETAIL, tr('hangar.statAmmo'), twin > 1 ? `${ammo} ×2` : ammo, (now.ammoPerSlot * twin) / 14, y + 23, 150);
  const mark = markOf(save, id);
  const marks = `${[1, 2, 3, 4, 5, 6].map((m) => (m <= mark ? '■' : '□')).join(' ')}   ${markName(mark)}`;
  text(ctx, tr('arsenal.statMark'), DETAIL.x + 24, y + 58, { size: 13, color: COLORS.dim, letterSpacing: 1, maxWidth: 150 });
  text(ctx, marks, DETAIL.x + 184, y + 58, { size: 14, color: COLORS.green });
  const guidance = tr(guidanceKey(d.behavior));
  text(ctx, tr('hangar.targets', { targets: secondaryTargets(id), guidance }), DETAIL.x + 24, y + 78, { size: 14, color: COLORS.ink, maxWidth: DETAIL.w - 300 });
  const info = isFleet(save.kit) ? [roundsLine(save, id), tr(FLEET_UI[save.kit].markInfo)].filter(Boolean).join(' · ') : mapTwoOpen(save) ? tr('hangar.twinInfo') : tr('arsenal.markInfo');
  text(ctx, info, DETAIL.x + 24, y + 96, { size: 12, color: COLORS.dim, maxWidth: DETAIL.w - 300 });
}

function drawStats(ctx: CanvasRenderingContext2D, save: SaveData, item: ShopItem): void {
  const y = DETAIL.y + 376;
  switch (item.type) {
    case 'plane': return planeStats(ctx, DETAIL, save, item.id, y);
    case 'gun':
      gunStats(ctx, save.gunLevel, gunCap(save), y, false, item.fleet);
      if (doubleFirepower(save.selectedPlane) && mapTwoOpen(save)) text(ctx, tr('hangar.gunNewJets'), DETAIL.x + 24, y + 112, { size: 12, color: COLORS.dim, maxWidth: DETAIL.w - 48 });
      return;
    case 'gun2':
      gunStats(ctx, save.gun2Level, MAX_GUN2_LEVEL, y, true);
      return;
    case 'ammo': return levelRows(ctx, save.ammoLevel, ammoCap(save), AMMO_LEVELS.map((a) => tr('arsenal.ammoRow', {
      damage: Math.round((a.damageMul - 1) * 100), ground: Math.round(a.groundFactor * 100),
    })), y, AMMO_ROWS);
    case 'incendiary': return levelRows(ctx, save.incendiaryLevel, incendiaryCap(save), INCENDIARY_LEVELS.map((a) => tr('arsenal.incRow', {
      damage: Math.round((a.airMul - 1) * 100), burn: Math.round(a.burn * 100),
    })), y, AMMO_ROWS);
    case 'he': return heStats(ctx, save.heLevel, y);
    case 'secondary': return weaponStatsRows(ctx, save, item.id, y);
    case 'heliMod': case 'heliRounds': return levelRows(ctx, heliLevel(save, item), heliMax(item), heliRows(item), y, item.type === 'heliRounds' ? AMMO_ROWS : undefined);
    case 'equipment': {
      const used = equipmentEffectRow(ctx, DETAIL, save, item.id, y);
      return levelRows(ctx, save.equipment[item.id], equipmentCap(save, item.id), equipmentLevelText(item.id), y + used * 30, { maxW: DETAIL.w - 48, rows: LEVEL_ROWS - used });
    }
    case 'livery':
      text(ctx, tr('hangar.paintSide'), DETAIL.x + 24, y + 4, { size: 12, color: COLORS.dim, letterSpacing: 1.5 });
      drawPlaneSide(ctx, save.selectedPlane, DETAIL.x + DETAIL.w / 2, y + 112, 1.5, { gear: 1, livery: item.id });
      return;
    default: throw new Error(`unhandled: ${item satisfies never}`);
  }
}

function showcase(ctx: CanvasRenderingContext2D, plane: PlaneId, livery: LiveryId, cx: number, cy: number, t: number, paint: string | null = null): void {
  if (PLANES[plane].kind === 'mech') return drawPlaneSide(ctx, plane, cx, cy + 82, 2.6, { t, paint, stride: t * 0.8 }); // a mech walks (doc 80)
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
    case 'plane': return showcase(ctx, item.id, save.livery[item.id], cx, cy, t, save.mechPaint[item.id as MechId] ?? null);
    case 'livery': return showcase(ctx, save.selectedPlane, item.id, cx, cy, t);
    case 'gun': if (!drawItemPicture(ctx, item.fleet ? FLEET[item.fleet].gunPicture : 'gun', cx, cy, false)) drawWeaponIcon(ctx, 'gun', cx, cy, 3); return;
    case 'gun2': drawWeaponIcon(ctx, 'gun2', cx, cy, 3); return;
    case 'ammo': if (!drawItemPicture(ctx, 'ammo', cx, cy, false)) drawWeaponIcon(ctx, 'ammo', cx, cy, 3); return;
    case 'incendiary':
    case 'he': if (!drawItemPicture(ctx, item.type, cx, cy, false)) drawWeaponIcon(ctx, item.type, cx, cy, 3); return;
    case 'secondary': if (!drawItemPicture(ctx, item.id, cx, cy, false)) drawWeaponIcon(ctx, item.id, cx, cy, 3); return;
    case 'heliMod': case 'heliRounds': if (!drawItemPicture(ctx, heliPicture(item), cx, cy, false)) drawWeaponIcon(ctx, heliPicture(item), cx, cy, 3); return;
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
    text(ctx, id ? SECONDARIES[id].short : tr('hangar.slot', { n: i + 1 }), r.x + r.w / 2, r.y + r.h / 2 + 5, { size: 14, display: !!id, align: 'center', color: id ? COLORS.green : COLORS.faint, maxWidth: r.w - 8 });
  });
}
