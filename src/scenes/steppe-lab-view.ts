import { formatMoney } from '../core/math';
import { STEPPE_PROJECTS, type SteppeProjectId } from '../data/steppe-research';
import type { TowerId } from '../data/towers';
import { labLevelPrice, labResearch, steppeProjectState, type SteppeLab, type SteppeProjectState } from '../game/steppe-lab';
import { secondaryDescription, secondaryName } from '../i18n/content';
import { t } from '../i18n/i18n';
import type { UiKey } from '../i18n/ui-en';
import { towerName } from '../render/defence-hud';
import { drawItemPicture, type TowerPicture } from '../render/items';
import { drawWeaponIcon } from '../render/icons';
import { COLORS, paragraph, text } from '../render/text';
import { drawTower } from '../render/tower-art';
import { drawButton, drawPanel, type Button, type Rect } from '../ui/widgets';
import { markName } from './hangar-items';

// The STEPPE LAB's panels (doc 107): the list of projects (scrolling, 12 rows at a time) with each one's cost and state,
// the picked project's panel with its picture, what it does and START, and the lab's level with BUY / UPGRADE.

export const LIST: Rect = { x: 30, y: 200, w: 660, h: 456 };
export const DETAIL: Rect = { x: 720, y: 200, w: 530, h: 456 };
const ROW = 36;
export const ROWS = 12;

export const rowRect = (i: number): Rect => ({ x: LIST.x + 10, y: LIST.y + 10 + i * ROW, w: LIST.w - 20, h: ROW - 4 });

const PICTURE: Readonly<Record<TowerId, TowerPicture>> = {
  mgnest: 'mgnest', flak: 'flaktower', mortarpit: 'mortarpit', tesla: 'teslatower', jammer: 'jammer', rockets: 'rocketbattery',
};
const DESC: Readonly<Record<TowerId, UiKey>> = {
  mgnest: 'towerdesc.mgnest', flak: 'towerdesc.flak', mortarpit: 'towerdesc.mortarpit', tesla: 'towerdesc.tesla', jammer: 'towerdesc.jammer',
  rockets: 'towerdesc.rockets',
};

/** "AA Rockets", "ATGM Mk II", "Mortar Pit", "Towers Mk III". */
export function steppeProjectName(id: SteppeProjectId): string {
  const g = STEPPE_PROJECTS[id].gives;
  if (g.kind === 'tower') return towerName(g.tower);
  if (g.kind === 'towers') return `${t('slab.towers')} ${markName(g.mark)}`;
  return g.mark === 1 ? secondaryName(g.weapon) : `${secondaryName(g.weapon)} ${markName(g.mark)}`;
}

function stateText(lab: SteppeLab, id: SteppeProjectId, s: SteppeProjectState): string {
  const p = STEPPE_PROJECTS[id];
  switch (s) {
    case 'done': return t('lab.done');
    case 'active': return t('lab.progress', { n: lab.progress, cost: p.cost });
    case 'open': return t('lab.cost', { n: p.cost });
    case 'lab': return t('lab.needsLab', { n: p.lab });
    case 'needs': return t('lab.needs', { project: p.needs ? steppeProjectName(p.needs) : '' });
    default: throw new Error(`unhandled: ${s satisfies never}`);
  }
}

const COLOR: Readonly<Record<SteppeProjectState, string>> = {
  done: COLORS.green, active: COLORS.gold, open: COLORS.ink, lab: COLORS.faint, needs: COLORS.faint,
};

/** The first row shown, so the pick stays in view. */
export const scrollFor = (focus: number, n: number): number => Math.max(0, Math.min(n - ROWS, focus - Math.floor(ROWS / 2)));

export function drawSteppeProjects(ctx: CanvasRenderingContext2D, lab: SteppeLab, list: readonly SteppeProjectId[], focus: number): void {
  drawPanel(ctx, LIST, { fill: 'rgba(14,12,8,0.86)' });
  const top = scrollFor(focus, list.length);
  list.slice(top, top + ROWS).forEach((id, k) => {
    const i = top + k;
    const r = rowRect(k);
    const s = steppeProjectState(lab, id);
    if (i === focus) drawPanel(ctx, r, { fill: 'rgba(80,60,30,0.9)', edge: COLORS.gold, radius: 6 });
    text(ctx, steppeProjectName(id), r.x + 12, r.y + 21, { size: 14, display: true, color: i === focus ? COLORS.gold : COLOR[s], maxWidth: r.w - 230 });
    text(ctx, stateText(lab, id, s), r.x + r.w - 12, r.y + 21, { size: 13, align: 'right', color: COLOR[s] });
    if (s === 'active') {
      ctx.fillStyle = 'rgba(255,215,106,0.25)';
      ctx.fillRect(r.x + 2, r.y + r.h - 4, (r.w - 4) * Math.min(1, lab.progress / STEPPE_PROJECTS[id].cost), 3);
    }
  });
  if (top > 0) text(ctx, '▲', LIST.x + LIST.w - 22, LIST.y + 8, { size: 12, color: COLORS.dim });
  if (top + ROWS < list.length) text(ctx, '▼', LIST.x + LIST.w - 22, LIST.y + LIST.h - 2, { size: 12, color: COLORS.dim });
}

export function steppeStartButton(lab: SteppeLab, id: SteppeProjectId): Button {
  const s = steppeProjectState(lab, id);
  const label = s === 'active' ? t('lab.running') : s === 'done' ? t('lab.done') : t(lab.project ? 'lab.switch' : 'lab.start');
  return { id: 'start', label, x: DETAIL.x + 20, y: DETAIL.y + DETAIL.h - 62, w: 300, h: 46, primary: true, enabled: s === 'open', hint: 'ENTER' };
}

/** BUY LAB / LAB 2: $600,000 / TOP LAB, at the top right. */
export function labButton(lab: SteppeLab, money: number): Button {
  const price = labLevelPrice(lab);
  const label = price === null ? t('slab.top') : lab.level === 0 ? t('slab.buy', { price: formatMoney(price) })
    : t('slab.upgrade', { level: lab.level + 1, price: formatMoney(price) });
  return { id: 'lab', label, x: 900, y: 132, w: 350, h: 44, enabled: price !== null && money >= price, hint: 'U' };
}

function picture(ctx: CanvasRenderingContext2D, id: SteppeProjectId, cx: number, cy: number, time: number): void {
  const g = STEPPE_PROJECTS[id].gives;
  if (g.kind === 'weapon') {
    if (!drawItemPicture(ctx, g.weapon, cx, cy, false)) drawWeaponIcon(ctx, g.weapon, cx, cy, 2.5);
    return;
  }
  const tower = g.kind === 'tower' ? g.tower : 'mgnest';
  if (!drawItemPicture(ctx, PICTURE[tower], cx, cy, false)) drawTower(ctx, tower, cx, cy, { aim: Math.sin(time) * 0.6, level: g.kind === 'towers' ? g.mark : 1, heat: 0, t: time, scale: 3 });
}

function whatItDoes(id: SteppeProjectId): { head: string; body: string } {
  const g = STEPPE_PROJECTS[id].gives;
  if (g.kind === 'tower') return { head: t('slab.tower'), body: t(DESC[g.tower]) };
  if (g.kind === 'towers') return { head: t('slab.towersUp', { mark: markName(g.mark) }), body: '' };
  return {
    head: g.mark === 1 ? t('slab.weapon') : t('slab.markUp', { weapon: secondaryName(g.weapon), mark: markName(g.mark) }),
    body: secondaryDescription(g.weapon),
  };
}

export function drawSteppeProject(ctx: CanvasRenderingContext2D, lab: SteppeLab, id: SteppeProjectId, time: number): void {
  drawPanel(ctx, DETAIL, { fill: 'rgba(14,12,8,0.88)' });
  const p = STEPPE_PROJECTS[id];
  const x = DETAIL.x + 20;
  text(ctx, steppeProjectName(id).toUpperCase(), x, DETAIL.y + 40, { size: 22, display: true, italic: true, maxWidth: DETAIL.w - 40 });
  picture(ctx, id, DETAIL.x + DETAIL.w / 2, DETAIL.y + 140, time);
  const w = whatItDoes(id);
  text(ctx, w.head, x, DETAIL.y + 262, { size: 14, color: COLORS.gold, maxWidth: DETAIL.w - 40 });
  if (w.body) paragraph(ctx, w.body, x, DETAIL.y + 288, DETAIL.w - 40, { size: 14, color: COLORS.ink });
  const s = steppeProjectState(lab, id);
  const perDay = labResearch(lab);
  if ((s === 'active' || s === 'open') && perDay > 0) {
    const left = Math.max(0, p.cost - (s === 'active' ? lab.progress : lab.research));
    text(ctx, t('lab.sorties', { n: Math.ceil(left / perDay) }), x, DETAIL.y + 372, { size: 13, color: COLORS.dim });
  }
  drawButton(ctx, steppeStartButton(lab, id), true, time);
}
