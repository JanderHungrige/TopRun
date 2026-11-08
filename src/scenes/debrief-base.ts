import { formatAlloy } from '../core/math';
import type { DayReport } from '../game/outpost-day';
import { t } from '../i18n/i18n';
import { COLORS, text } from '../render/text';
import { projectName } from './lab-view';

// The debrief on map 6 (doc 82): what the ground base made during the sortie — alloy from the refinery and the wrecks,
// research — and, in gold, anything the lab invented.

export function drawBaseReport(ctx: CanvasRenderingContext2D, r: DayReport, x: number, y: number, time: number): void {
  const line = t('debrief.baseLine', { alloy: formatAlloy(r.refined + r.salvage), research: r.research });
  text(ctx, line, x, y, { size: 14, align: 'right', color: COLORS.cyan, maxWidth: 560 });
  if (!r.invented) return;
  const pulse = 0.8 + Math.sin(time * 4) * 0.2;
  text(ctx, t('debrief.invented', { project: projectName(r.invented) }), x, y + 22, { size: 16, display: true, align: 'right', color: COLORS.gold, alpha: pulse, maxWidth: 560 });
}
