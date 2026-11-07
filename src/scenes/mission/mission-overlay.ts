import { t } from '../../i18n/i18n';
import { COLORS, text } from '../../render/text';
import { drawPanel, type ButtonGroup } from '../../ui/widgets';

// What the mission draws over the cockpit: the big banner (start, warnings, the end) and the pause menu (doc 05).

export interface Banner {
  title: string;
  sub: string;
  color: string;
  time: number;
}

/** The banner; a red WARNING blinks. */
export function renderBanner(ctx: CanvasRenderingContext2D, b: Banner | null, clock: number): void {
  if (!b || b.time <= 0) return;
  const alpha = Math.min(1, b.time * 2);
  if (b.color === COLORS.red && b.time > 0 && b.title === t('mission.warning') && Math.sin(clock * 14) < 0) return;
  text(ctx, b.title, 640, 300, { size: 46, display: true, italic: true, align: 'center', color: b.color, stroke: '#000', strokeWidth: 7, alpha });
  text(ctx, b.sub, 640, 336, { size: 18, align: 'center', color: COLORS.ink, stroke: '#000', strokeWidth: 4, alpha });
}

export function renderPause(ctx: CanvasRenderingContext2D, menu: ButtonGroup, clock: number): void {
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(0, 0, 1280, 720);
  drawPanel(ctx, { x: 500, y: 230, w: 280, h: 240 });
  text(ctx, t('mission.paused'), 640, 290, { size: 34, display: true, italic: true, align: 'center', color: COLORS.gold });
  menu.render(ctx, clock);
  text(ctx, t('mission.abortNote'), 640, 462, { size: 12, align: 'center', color: COLORS.dim });
}
