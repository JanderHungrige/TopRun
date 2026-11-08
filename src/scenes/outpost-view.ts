import { formatAlloy, formatMoney } from '../core/math';
import { BUILDINGS, MAX_BUILDING_LEVEL, ROUND_COST, ROUNDS_IDS, type BuildingId, type RoundsId } from '../data/outpost';
import {
  bayEquipmentCap, bayGunCap, buildingPrice, magazineCap, powerDemand, powerShare, powerSupply, roundsOrder, type Outpost,
} from '../game/outpost';
import { t } from '../i18n/i18n';
import type { UiKey } from '../i18n/ui-en';
import { COLORS, paragraph, text } from '../render/text';
import { drawButton, drawPanel, type Button, type Rect } from '../ui/widgets';
import { roundsName } from './hangar-mech';

// The GROUND BASE's panels (doc 82): the top bar with money, alloy, power and research, the picked building's panel with
// its level, what it does now and next, BUILD / UPGRADE and — for the factory — an order button per kind of round.

export const PANEL: Rect = { x: 760, y: 76, w: 500, h: 360 };

const NAME: Readonly<Record<BuildingId, UiKey>> = {
  generator: 'outpost.generator', refinery: 'outpost.refinery', factory: 'outpost.factory', lab: 'outpost.lab', mechbay: 'outpost.mechbay',
};
const DESC: Readonly<Record<BuildingId, UiKey>> = {
  generator: 'outpost.generatorDesc', refinery: 'outpost.refineryDesc', factory: 'outpost.factoryDesc', lab: 'outpost.labDesc', mechbay: 'outpost.mechbayDesc',
};

export const buildingName = (id: BuildingId): string => t(NAME[id]);

/** What a building gives at a level, as a line. */
export function effectText(id: BuildingId, level: number): string {
  const n = BUILDINGS[id].output[level] ?? 0;
  switch (id) {
    case 'generator': return t('outpost.genEffect', { n });
    case 'refinery': return t('outpost.refEffect', { n });
    case 'factory': return t('outpost.facEffect', { n });
    case 'lab': return t('outpost.labEffect', { n });
    case 'mechbay': return t('outpost.bayEffect', { gun: n, eq: level + 1 });
    default: throw new Error(`unhandled: ${id satisfies never}`);
  }
}

export function drawTopBar(ctx: CanvasRenderingContext2D, money: number, o: Outpost): void {
  ctx.fillStyle = 'rgba(6,10,8,0.72)';
  ctx.fillRect(0, 0, 1280, 64);
  text(ctx, t('outpost.title'), 24, 46, { size: 30, display: true, italic: true, color: COLORS.gold });
  const share = Math.round(powerShare(o) * 100);
  const power = `${t('outpost.power', { supply: powerSupply(o), demand: powerDemand(o) })}${share < 100 ? `  ${t('outpost.share', { n: share })}` : ''}`;
  text(ctx, formatMoney(money), 1256, 30, { size: 22, display: true, align: 'right', color: COLORS.green });
  text(ctx, `${formatAlloy(o.alloy)}   ${power}   ${t('outpost.research', { n: o.research + o.progress })}`, 1256, 54, {
    size: 14, align: 'right', color: share < 100 ? COLORS.amber : COLORS.ink,
  });
}

/** The action button of the panel: BUILD / UPGRADE with the price, or FULLY BUILT. */
export function buildButton(o: Outpost, id: BuildingId, money: number): Button {
  const price = buildingPrice(o, id);
  const label = price === null ? t('outpost.max') : t(o.buildings[id] > 0 ? 'outpost.upgrade' : 'outpost.build', { price: formatMoney(price) });
  return { id: 'build', label, x: PANEL.x + 20, y: PANEL.y + PANEL.h - 64, w: 300, h: 46, primary: true, enabled: price !== null && money >= price, hint: 'ENTER' };
}

/** The factory's order buttons, one per kind of round. */
export function orderButtons(o: Outpost): Button[] {
  return ROUNDS_IDS.map((r, i) => {
    const n = roundsOrder(o, r);
    const label = t('outpost.order', { n: Math.max(n, 10), kind: roundsName(r), price: formatAlloy(Math.max(n, 10) * ROUND_COST[r]) });
    return { id: r, label, x: PANEL.x + 20 + i * 158, y: PANEL.y + 214, w: 150, h: 40, enabled: n > 0 };
  });
}

/** The picked building's panel; `row` is the focused button (0 = BUILD, 1–3 = the factory's orders). */
export function drawBuildingPanel(ctx: CanvasRenderingContext2D, o: Outpost, id: BuildingId, money: number, time: number, row: number): void {
  drawPanel(ctx, PANEL, { fill: 'rgba(8,14,10,0.88)' });
  const lvl = o.buildings[id];
  const x = PANEL.x + 20;
  text(ctx, buildingName(id).toUpperCase(), x, PANEL.y + 40, { size: 24, display: true, italic: true });
  const dots = Array.from({ length: MAX_BUILDING_LEVEL }, (_, i) => (i < lvl ? '●' : '○')).join(' ');
  text(ctx, lvl > 0 ? `${dots}  ${t('outpost.level', { n: lvl })}` : t('outpost.notBuilt'), PANEL.x + PANEL.w - 20, PANEL.y + 38, { size: 14, align: 'right', color: lvl > 0 ? COLORS.green : COLORS.amber });
  paragraph(ctx, t(DESC[id]), x, PANEL.y + 70, PANEL.w - 40, { size: 14, color: COLORS.ink });
  if (lvl > 0) text(ctx, t('outpost.now', { effect: effectText(id, lvl) }), x, PANEL.y + 136, { size: 14, color: COLORS.green, maxWidth: PANEL.w - 40 });
  if (lvl < MAX_BUILDING_LEVEL) text(ctx, t('outpost.next', { effect: effectText(id, lvl + 1) }), x, PANEL.y + 158, { size: 14, color: COLORS.gold, maxWidth: PANEL.w - 40 });
  const draw = BUILDINGS[id].draw[Math.min(MAX_BUILDING_LEVEL, lvl + 1) - 1] ?? 0;
  if (id !== 'generator' && lvl < MAX_BUILDING_LEVEL) text(ctx, t('outpost.draws', { n: draw }), x, PANEL.y + 180, { size: 12, color: COLORS.dim });
  if (id === 'factory') factoryRows(ctx, o, time, row);
  if (id === 'mechbay') text(ctx, t('outpost.bayEffect', { gun: bayGunCap(o), eq: bayEquipmentCap(o) }), x, PANEL.y + 204, { size: 12, color: COLORS.dim });
  drawButton(ctx, buildButton(o, id, money), row === 0, time);
}

function factoryRows(ctx: CanvasRenderingContext2D, o: Outpost, time: number, row: number): void {
  const max = magazineCap(o);
  const line = ROUNDS_IDS.map((r: RoundsId) => t('outpost.held', { kind: roundsName(r), n: o.magazine[r], max })).join('   ');
  text(ctx, `${t('outpost.magazine')}  ${line}`, PANEL.x + 20, PANEL.y + 204, { size: 12, color: COLORS.cyan, maxWidth: PANEL.w - 40 });
  if (o.buildings.factory > 0) orderButtons(o).forEach((b, i) => drawButton(ctx, b, row === i + 1, time));
}
