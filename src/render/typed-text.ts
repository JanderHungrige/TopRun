import { pixelRect } from './pixel/frame';
import { measure, text } from './text';

// Typewriter text (doc 20): wrapped lines revealed character by character in the typewriter font, with a
// blinking block cursor after the last typed character. Wrapping happens on the full line up front, so words
// never jump to the next line while they are being typed.

export interface TypedOpts {
  size: number;
  color: string;
  lineHeight: number;
  weight?: number;
  /** Cursor colour; null hides it (blink off phase). */
  cursor?: string | null;
}

/** Draws `lines` (the wrapped full text, one space between lines) up to `shown` characters. */
export function typedLines(ctx: CanvasRenderingContext2D, lines: readonly string[], shown: number, x: number, y: number, o: TypedOpts): void {
  let rest = shown;
  let cx = x;
  let cy = y;
  for (let i = 0; i < lines.length; i++) {
    const ln = lines[i] ?? '';
    const by = y + i * o.lineHeight;
    const n = Math.max(0, Math.min(ln.length, rest));
    const part = ln.slice(0, n);
    if (n > 0) text(ctx, part, x, by, { size: o.size, weight: o.weight ?? 600, color: o.color, type: true });
    cx = x + (n > 0 ? measure(ctx, part, o.size, false, true) : 0);
    cy = by;
    rest -= ln.length + 1;
    if (rest < 0) break;
  }
  if (o.cursor) pixelRect(ctx, cx + o.size * 0.12, cy - o.size * 0.78, o.size * 0.5, o.size * 0.92, o.cursor);
}
