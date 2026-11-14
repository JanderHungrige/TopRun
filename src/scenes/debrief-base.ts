import { formatAlloy } from '../core/math';
import type { DayReport } from '../game/outpost-day';
import { t } from '../i18n/i18n';
import { COLORS, text } from '../render/text';
import type { SteppeDayReport } from '../game/steppe-lab';
import { projectName } from './lab-view';
import { steppeProjectName } from './steppe-lab-view';

// The debrief on map 6 (doc 82): what the ground base made during the sortie — alloy from the refinery and the wrecks,
// research — and, in gold, anything the lab invented.

export function drawBaseReport(ctx: CanvasRenderingContext2D, r: DayReport, x: number, y: number, time: number): void {
  const line = t('debrief.baseLine', { alloy: formatAlloy(r.refined + r.salvage), research: r.research });
  text(ctx, line, x, y, { size: 14, align: 'right', color: COLORS.cyan, maxWidth: 560 });
  if (!r.invented) return;
  const pulse = 0.8 + Math.sin(time * 4) * 0.2;
  text(ctx, t('debrief.invented', { project: projectName(r.invented) }), x, y + 22, { size: 16, display: true, align: 'right', color: COLORS.gold, alpha: pulse, maxWidth: 560 });
}

/** The debrief on map 7 (doc 107): the steppe lab's research and, in gold, anything it invented. */
export function drawLabReport(ctx: CanvasRenderingContext2D, r: SteppeDayReport, x: number, y: number, time: number): void {
  if (r.research <= 0 && !r.invented) return;
  text(ctx, t('debrief.labLine', { n: r.research }), x, y, { size: 14, align: 'right', color: COLORS.cyan, maxWidth: 560 });
  if (!r.invented) return;
  const pulse = 0.8 + Math.sin(time * 4) * 0.2;
  text(ctx, t('debrief.invented', { project: steppeProjectName(r.invented) }), x, y + 22, { size: 16, display: true, align: 'right', color: COLORS.gold, alpha: pulse, maxWidth: 560 });
}
