import { PROJECTS, type ProjectId } from '../data/research';
import { projectState, type ProjectState } from '../game/lab';
import { researchPerDay, type Outpost } from '../game/outpost';
import { secondaryDescription, secondaryName } from '../i18n/content';
import { t } from '../i18n/i18n';
import { drawItemPicture } from '../render/items';
import { drawWeaponIcon } from '../render/icons';
import { COLORS, paragraph, text } from '../render/text';
import { drawButton, drawPanel, type Button, type Rect } from '../ui/widgets';
import { markName } from './hangar-items';

// The LAB's panels (doc 83): the list of projects with each one's cost and state (and the running one's progress), and
// the picked project's panel with the weapon's picture, what it does and START.

export const LIST: Rect = { x: 30, y: 200, w: 660, h: 456 };
export const DETAIL: Rect = { x: 720, y: 200, w: 530, h: 456 };
const ROW = 32;

export const rowRect = (i: number): Rect => ({ x: LIST.x + 10, y: LIST.y + 10 + i * ROW, w: LIST.w - 20, h: ROW - 4 });

/** "Seeker Missiles", "Seeker Missiles Mk II". */
export function projectName(id: ProjectId): string {
  const p = PROJECTS[id];
  return p.mark === 1 ? secondaryName(p.weapon) : `${secondaryName(p.weapon)} ${markName(p.mark)}`;
}

function stateText(o: Outpost, id: ProjectId, s: ProjectState): string {
  const p = PROJECTS[id];
  switch (s) {
    case 'done': return t('lab.done');
    case 'active': return t('lab.progress', { n: o.progress, cost: p.cost });
    case 'open': return t('lab.cost', { n: p.cost });
    case 'lab': return t('lab.needsLab', { n: p.lab });
    case 'needs': return t('lab.needs', { project: p.needs ? projectName(p.needs) : '' });
    default: throw new Error(`unhandled: ${s satisfies never}`);
  }
}

const COLOR: Readonly<Record<ProjectState, string>> = {
  done: COLORS.green, active: COLORS.gold, open: COLORS.ink, lab: COLORS.faint, needs: COLORS.faint,
};

export function drawProjects(ctx: CanvasRenderingContext2D, o: Outpost, list: readonly ProjectId[], focus: number): void {
  drawPanel(ctx, LIST, { fill: 'rgba(8,14,12,0.86)' });
  list.forEach((id, i) => {
    const r = rowRect(i);
    const s = projectState(o, id);
    if (i === focus) drawPanel(ctx, r, { fill: 'rgba(40,70,60,0.9)', edge: COLORS.gold, radius: 6 });
    text(ctx, projectName(id), r.x + 12, r.y + 19, { size: 14, display: true, color: i === focus ? COLORS.gold : COLOR[s], maxWidth: r.w - 230 });
    text(ctx, stateText(o, id, s), r.x + r.w - 12, r.y + 19, { size: 13, align: 'right', color: COLOR[s] });
    if (s === 'active') {
      const k = Math.min(1, o.progress / PROJECTS[id].cost);
      ctx.fillStyle = 'rgba(255,215,106,0.25)';
      ctx.fillRect(r.x + 2, r.y + r.h - 4, (r.w - 4) * k, 3);
    }
  });
}

export function startButton(o: Outpost, id: ProjectId): Button {
  const s = projectState(o, id);
  const label = s === 'active' ? t('lab.running') : s === 'done' ? t('lab.done') : t(o.project ? 'lab.switch' : 'lab.start');
  return { id: 'start', label, x: DETAIL.x + 20, y: DETAIL.y + DETAIL.h - 62, w: 300, h: 46, primary: true, enabled: s === 'open', hint: 'ENTER' };
}

export function drawProject(ctx: CanvasRenderingContext2D, o: Outpost, id: ProjectId, time: number): void {
  drawPanel(ctx, DETAIL, { fill: 'rgba(8,14,12,0.88)' });
  const p = PROJECTS[id];
  const x = DETAIL.x + 20;
  text(ctx, projectName(id).toUpperCase(), x, DETAIL.y + 40, { size: 22, display: true, italic: true, maxWidth: DETAIL.w - 40 });
  const cx = DETAIL.x + DETAIL.w / 2;
  if (!drawItemPicture(ctx, p.weapon, cx, DETAIL.y + 140, false)) drawWeaponIcon(ctx, p.weapon, cx, DETAIL.y + 140, 2.5);
  const what = p.mark === 1 ? t('lab.weapon') : t('lab.markUp', { weapon: secondaryName(p.weapon), mark: markName(p.mark) });
  text(ctx, what, x, DETAIL.y + 262, { size: 14, color: COLORS.gold, maxWidth: DETAIL.w - 40 });
  paragraph(ctx, secondaryDescription(p.weapon), x, DETAIL.y + 288, DETAIL.w - 40, { size: 14, color: COLORS.ink });
  const s = projectState(o, id);
  const perDay = researchPerDay(o);
  if ((s === 'active' || s === 'open') && perDay > 0) {
    const left = Math.max(0, p.cost - (s === 'active' ? o.progress : o.research));
    text(ctx, t('lab.sorties', { n: Math.ceil(left / perDay) }), x, DETAIL.y + 372, { size: 13, color: COLORS.dim });
  }
  drawButton(ctx, startButton(o, id), true, time);
}
