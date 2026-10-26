import type { Viewport } from '../core/canvas';
import type { Rect } from './widgets';

export interface TextAreaOptions {
  label: string;
  placeholder?: string;
  /** Read-only: shows text to select and copy (the pilot code to back up). */
  readOnly?: boolean;
  maxLength?: number;
}

/**
 * A real DOM <textarea> laid over a rectangle of the logical 1280×720 canvas (doc 08, pilot code): phones get
 * their keyboard and paste menu, desktop gets ⌘V / Ctrl+V and text selection. The canvas draws the frame; the
 * box itself is transparent. Keys typed here never reach the game (core/input.ts); ESC leaves the box.
 */
export class TextArea {
  private readonly el: HTMLTextAreaElement;

  constructor(private readonly host: HTMLElement, private readonly viewport: () => Viewport, private readonly rect: Rect, opts: TextAreaOptions) {
    const el = document.createElement('textarea');
    el.className = 'canvas-text-area';
    el.readOnly = opts.readOnly ?? false;
    el.placeholder = opts.placeholder ?? '';
    if (opts.maxLength) el.maxLength = opts.maxLength;
    el.spellcheck = false;
    el.autocomplete = 'off';
    el.setAttribute('autocapitalize', 'off');
    el.setAttribute('aria-label', opts.label);
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        el.blur();
      }
    });
    this.el = el;
  }

  get value(): string {
    return this.el.value;
  }

  set value(v: string) {
    this.el.value = v;
  }

  /** Selects everything (so ⌘C / Ctrl+C copies it when the clipboard API is refused). */
  selectAll(): void {
    this.el.focus({ preventScroll: true });
    this.el.select();
  }

  get focused(): boolean {
    return document.activeElement === this.el;
  }

  set visible(on: boolean) {
    this.el.style.visibility = on ? 'visible' : 'hidden';
  }

  mount(): void {
    if (!this.el.isConnected) this.host.appendChild(this.el);
    this.layout();
  }

  unmount(): void {
    this.el.blur();
    this.el.remove();
  }

  /** Keeps the box glued to its canvas rectangle (call every frame; cheap). */
  layout(): void {
    const vp = this.viewport();
    const s = this.el.style;
    s.left = `${vp.offsetX + this.rect.x * vp.scale}px`;
    s.top = `${vp.offsetY + this.rect.y * vp.scale}px`;
    s.width = `${this.rect.w * vp.scale}px`;
    s.height = `${this.rect.h * vp.scale}px`;
    s.fontSize = `${Math.max(10, Math.round(14 * vp.scale))}px`;
  }
}
