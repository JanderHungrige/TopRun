import type { Viewport } from '../core/canvas';
import type { Rect } from './widgets';

export interface TextFieldOptions {
  maxLength: number;
  placeholder: string;
  label: string;
  /** Cleans every keystroke (e.g. upper-case + whitelist). */
  filter: (raw: string) => string;
  onEnter: () => void;
  onEscape: () => void;
  /** ←/→ while typing (the field is short, so caret movement is not needed). */
  onArrow: (dir: -1 | 1) => void;
  /** ↑/↓ while typing (e.g. open the avatar builder, doc 29); unset = the browser default. */
  onUpDown?: (dir: -1 | 1) => void;
}

/**
 * A real DOM <input> laid over a rectangle of the logical 1280×720 canvas, so phones get their
 * keyboard, IMEs work and screen readers see a labelled field (doc 08). The canvas draws the frame;
 * the input itself is transparent and only renders the typed text.
 */
export class TextField {
  private readonly el: HTMLInputElement;

  constructor(private readonly host: HTMLElement, private readonly viewport: () => Viewport, private readonly rect: Rect, opts: TextFieldOptions) {
    const el = document.createElement('input');
    el.type = 'text';
    el.className = 'canvas-text-field';
    el.maxLength = opts.maxLength;
    el.placeholder = opts.placeholder;
    el.autocomplete = 'off';
    el.spellcheck = false;
    el.setAttribute('autocapitalize', 'characters');
    el.setAttribute('aria-label', opts.label);
    el.addEventListener('input', () => {
      const clean = opts.filter(el.value);
      if (clean !== el.value) el.value = clean;
    });
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        opts.onEnter();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        opts.onEscape();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        opts.onArrow(e.key === 'ArrowLeft' ? -1 : 1);
      } else if ((e.key === 'ArrowUp' || e.key === 'ArrowDown') && opts.onUpDown) {
        e.preventDefault();
        opts.onUpDown(e.key === 'ArrowUp' ? -1 : 1);
      }
    });
    this.el = el;
  }

  get value(): string {
    return this.el.value;
  }

  /** Refills the field (e.g. the callsign typed before the avatar builder opened). */
  set value(v: string) {
    this.el.value = v;
  }

  set placeholder(v: string) {
    this.el.placeholder = v;
  }

  mount(): void {
    if (!this.el.isConnected) this.host.appendChild(this.el);
    this.layout();
    this.el.focus({ preventScroll: true });
  }

  unmount(): void {
    this.el.blur();
    this.el.remove();
  }

  focus(): void {
    this.el.focus({ preventScroll: true });
  }

  get focused(): boolean {
    return document.activeElement === this.el;
  }

  /** Keeps the input glued to its canvas rectangle (call every frame; cheap). */
  layout(): void {
    const vp = this.viewport();
    const s = this.el.style;
    s.left = `${vp.offsetX + this.rect.x * vp.scale}px`;
    s.top = `${vp.offsetY + this.rect.y * vp.scale}px`;
    s.width = `${this.rect.w * vp.scale}px`;
    s.height = `${this.rect.h * vp.scale}px`;
    s.fontSize = `${Math.round(this.rect.h * 0.55 * vp.scale)}px`;
  }
}
