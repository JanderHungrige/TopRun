import { PLANES } from '../data/planes';
import type { EquipmentId, PlaneId } from '../data/types';
import { equipmentEffect, planeCardStats } from '../game/hangar-stats';
import type { SaveData } from '../game/save';
import { t as tr } from '../i18n/i18n';
import { planeSpecialName } from '../i18n/content';
import { COLORS, text } from '../render/text';
import { drawBar, type Rect } from '../ui/widgets';

// The hangar's stat rows (doc 02): a plane's hull and speed as it flies them — with the armour and engine tuning
// fitted (bug B1) — and what the next armour or engine level adds.

export function statRow(ctx: CanvasRenderingContext2D, d: Rect, label: string, value: string, ratio: number, y: number, barW = 280): void {
  const x = d.x + 24;
  text(ctx, label, x, y + 12, { size: 13, color: COLORS.dim, letterSpacing: 1, maxWidth: 150 });
  drawBar(ctx, { x: x + 160, y: y + 2, w: barW, h: 12 }, ratio, COLORS.cyan);
  text(ctx, value, x + barW + 176, y + 13, { size: 14, color: COLORS.ink, maxWidth: d.w - barW - 200 });
}

/** "325 · base 100" when the equipment changes it, else just the value. */
const fitted = (value: number, base: number, unit = ''): string =>
  (value === base ? `${value}${unit}` : tr('hangar.statFitted', { value: `${value}${unit}`, base: `${base}${unit}` }));

/** A plane's card: hull and speed as fitted (bars compare the planes themselves), hardpoints, firepower, special. */
export function planeStats(ctx: CanvasRenderingContext2D, d: Rect, save: SaveData, id: PlaneId, y: number): void {
  const p = PLANES[id];
  const c = planeCardStats(save, id);
  statRow(ctx, d, tr('hangar.statHull'), fitted(c.hull, c.baseHull), p.hull / 180, y);
  statRow(ctx, d, tr('hangar.statSpeed'), fitted(c.speed, c.baseSpeed, ' kn'), p.speed / 420, y + 26);
  statRow(ctx, d, tr('hangar.statHardpoints'), String(p.hardpoints), p.hardpoints / 4, y + 52);
  statRow(ctx, d, tr('hangar.statFirepower'), `×${p.gunDamageMul.toFixed(1)}`, p.gunDamageMul / 1.5, y + 78);
  text(ctx, tr('hangar.special', { name: planeSpecialName(p.id) }), d.x + 24, y + 124, { size: 15, color: COLORS.gold });
}

/** Armour or engine tuning: the selected plane's hull or speed now → after the next level. Returns the rows used. */
export function equipmentEffectRow(ctx: CanvasRenderingContext2D, d: Rect, save: SaveData, id: EquipmentId, y: number): number {
  const e = equipmentEffect(save, id);
  if (!e) return 0;
  const unit = e.stat === 'speed' ? ' kn' : '';
  const value = e.next === null ? `${e.now}${unit}` : `${e.now} → ${e.next}${unit}`;
  const label = tr(e.stat === 'hull' ? 'hangar.statHull' : 'hangar.statSpeed');
  statRow(ctx, d, label, value, e.now / 600, y);
  return 1;
}
