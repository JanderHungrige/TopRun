import type { Input } from '../core/input';
import type { Vec } from '../core/math';
import { COLORS, text } from '../render/text';

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Button extends Rect {
  id: string;
  label: string;
  enabled?: boolean;
  primary?: boolean;
  hint?: string;
}

export const hit = (p: Vec, r: Rect): boolean => p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;

export function drawPanel(ctx: CanvasRenderingContext2D, r: Rect, opts: { fill?: string; edge?: string; radius?: number } = {}): void {
  ctx.beginPath();
  ctx.roundRect(r.x, r.y, r.w, r.h, opts.radius ?? 10);
  ctx.fillStyle = opts.fill ?? COLORS.panel;
  ctx.fill();
  ctx.strokeStyle = opts.edge ?? COLORS.panelEdge;
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

export function drawBar(ctx: CanvasRenderingContext2D, r: Rect, ratio: number, color: string, bg = 'rgba(255,255,255,0.1)'): void {
  const f = Math.max(0, Math.min(1, ratio));
  ctx.beginPath();
  ctx.roundRect(r.x, r.y, r.w, r.h, r.h / 2);
  ctx.fillStyle = bg;
  ctx.fill();
  if (f > 0) {
    ctx.beginPath();
    ctx.roundRect(r.x, r.y, Math.max(r.h, r.w * f), r.h, r.h / 2);
    ctx.fillStyle = color;
    ctx.fill();
  }
}

export function drawButton(ctx: CanvasRenderingContext2D, b: Button, focused: boolean, t: number): void {
  const enabled = b.enabled !== false;
  const pulse = focused ? 0.5 + Math.sin(t * 6) * 0.5 : 0;
  ctx.beginPath();
  ctx.roundRect(b.x, b.y, b.w, b.h, 8);
  ctx.fillStyle = 'rgba(6,10,18,0.82)'; // dark backing keeps labels readable over bright scenery
  ctx.fill();
  const base = b.primary ? 'rgba(255,184,40,0.22)' : 'rgba(30,48,70,0.85)';
  ctx.fillStyle = !enabled ? 'rgba(30,38,48,0.6)' : focused ? (b.primary ? 'rgba(255,184,40,0.4)' : 'rgba(60,96,140,0.9)') : base;
  ctx.fill();
  ctx.lineWidth = focused ? 2.5 : 1.5;
  ctx.strokeStyle = !enabled ? 'rgba(120,130,140,0.3)' : focused ? `rgba(255,210,90,${0.7 + pulse * 0.3})` : b.primary ? COLORS.gold : COLORS.panelEdge;
  ctx.stroke();
  const color = !enabled ? COLORS.faint : b.primary || focused ? COLORS.gold : COLORS.ink;
  text(ctx, b.label, b.x + b.w / 2, b.y + b.h / 2 + 1, { size: Math.min(20, b.h * 0.42), display: true, align: 'center', baseline: 'middle', color, maxWidth: b.w - 20 });
  if (b.hint) {
    text(ctx, b.hint, b.x + b.w - 8, b.y + b.h - 6, { size: 10, align: 'right', color: COLORS.faint });
  }
}

export type NavAxis = 'vertical' | 'horizontal';

/** A focusable row/column of buttons driven by keyboard, gamepad, mouse and touch. */
export class ButtonGroup {
  focus = 0;

  constructor(public buttons: Button[], private axis: NavAxis = 'vertical') {}

  setButtons(buttons: Button[]): void {
    this.buttons = buttons;
    this.focus = Math.min(this.focus, Math.max(0, buttons.length - 1));
  }

  focusId(id: string): void {
    const i = this.buttons.findIndex((b) => b.id === id);
    if (i >= 0) this.focus = i;
  }

  get focused(): Button | undefined {
    return this.buttons[this.focus];
  }

  /** Returns the id of an activated button this tick, if any. */
  update(input: Input): string | null {
    const prev = this.axis === 'vertical' ? 'up' : 'left';
    const next = this.axis === 'vertical' ? 'down' : 'right';
    if (input.pressed(prev)) this.move(-1);
    if (input.pressed(next)) this.move(1);
    if (input.device === 'mouse') {
      const hover = this.buttons.findIndex((b) => b.enabled !== false && hit(input.pointer, b));
      if (hover >= 0) this.focus = hover;
    }
    for (const tap of input.taps) {
      const b = this.buttons.find((x) => hit(tap, x));
      if (b && b.enabled !== false) return b.id;
    }
    const f = this.focused;
    if (f && f.enabled !== false && input.pressed('confirm')) return f.id;
    return null;
  }

  render(ctx: CanvasRenderingContext2D, t: number, showFocus = true): void {
    this.buttons.forEach((b, i) => drawButton(ctx, b, showFocus && i === this.focus, t));
  }

  private move(d: number): void {
    const n = this.buttons.length;
    for (let step = 1; step <= n; step++) {
      const i = (this.focus + d * step + n * 4) % n;
      if (this.buttons[i]?.enabled !== false) {
        this.focus = i;
        return;
      }
    }
  }
}
