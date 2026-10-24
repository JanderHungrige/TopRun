export const FONT_DISPLAY = '"Arial Black", "Helvetica Neue", Arial, sans-serif';
export const FONT_BODY = 'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

export const COLORS = Object.freeze({
  ink: '#e9eff5',
  dim: '#90a4b8',
  faint: '#5c6f82',
  gold: '#ffc83d',
  amber: '#ff9d2e',
  red: '#ff4f4f',
  green: '#5be37d',
  cyan: '#5fd4ff',
  panel: 'rgba(9,16,26,0.86)',
  panelEdge: 'rgba(120,160,200,0.35)',
  hud: '#0b1622',
});

export interface TextOpts {
  size?: number;
  color?: string;
  align?: CanvasTextAlign;
  baseline?: CanvasTextBaseline;
  display?: boolean;
  italic?: boolean;
  weight?: number;
  shadow?: boolean;
  stroke?: string;
  strokeWidth?: number;
  alpha?: number;
  maxWidth?: number;
  letterSpacing?: number;
}

export function setFont(ctx: CanvasRenderingContext2D, size: number, display = false, weight = 600, italic = false): void {
  const family = display ? FONT_DISPLAY : FONT_BODY;
  ctx.font = `${italic ? 'italic ' : ''}${display ? 900 : weight} ${size}px ${family}`;
}

export function text(ctx: CanvasRenderingContext2D, s: string, x: number, y: number, o: TextOpts = {}): void {
  ctx.save();
  setFont(ctx, o.size ?? 16, o.display ?? false, o.weight ?? 600, o.italic ?? false);
  ctx.textAlign = o.align ?? 'left';
  ctx.textBaseline = o.baseline ?? 'alphabetic';
  if (o.letterSpacing) ctx.letterSpacing = `${o.letterSpacing}px`;
  ctx.globalAlpha *= o.alpha ?? 1;
  if (o.shadow) {
    ctx.shadowColor = 'rgba(0,0,0,0.75)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetY = 2;
  }
  if (o.stroke) {
    ctx.strokeStyle = o.stroke;
    ctx.lineWidth = o.strokeWidth ?? 4;
    ctx.lineJoin = 'round';
    ctx.strokeText(s, x, y, o.maxWidth);
  }
  ctx.fillStyle = o.color ?? COLORS.ink;
  ctx.fillText(s, x, y, o.maxWidth);
  ctx.restore();
}

export function measure(ctx: CanvasRenderingContext2D, s: string, size: number, display = false): number {
  ctx.save();
  setFont(ctx, size, display);
  const w = ctx.measureText(s).width;
  ctx.restore();
  return w;
}

/** Greedy word wrap into lines no wider than maxWidth. */
export function wrap(ctx: CanvasRenderingContext2D, s: string, maxWidth: number, size: number): string[] {
  const words = s.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = '';
  for (const w of words) {
    const candidate = line ? `${line} ${w}` : w;
    if (line && measure(ctx, candidate, size) > maxWidth) {
      lines.push(line);
      line = w;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export function paragraph(
  ctx: CanvasRenderingContext2D, s: string, x: number, y: number, maxWidth: number, o: TextOpts & { lineHeight?: number } = {},
): number {
  const size = o.size ?? 15;
  const lh = o.lineHeight ?? Math.round(size * 1.4);
  const lines = wrap(ctx, s, maxWidth, size);
  lines.forEach((l, i) => text(ctx, l, x, y + i * lh, { ...o, size }));
  return lines.length * lh;
}
