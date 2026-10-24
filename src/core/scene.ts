import { LOGICAL_H, LOGICAL_W } from './canvas';

export interface Scene {
  enter?(): void;
  exit?(): void;
  update(dt: number): void;
  render(ctx: CanvasRenderingContext2D): void;
  /** Called when the window loses focus or the tab is hidden. */
  onBlur?(): void;
}

const FADE_TIME = 0.25;

export class SceneManager {
  private current: Scene | null = null;
  private pending: Scene | null = null;
  private phase: 'idle' | 'out' | 'in' = 'idle';
  private fade = 0;

  constructor(private readonly onSwap: () => void) {}

  get scene(): Scene | null {
    return this.current;
  }

  go(next: Scene, instant = false): void {
    if (instant || !this.current) {
      this.swap(next);
      return;
    }
    this.pending = next;
    this.phase = 'out';
  }

  update(dt: number): void {
    if (this.phase === 'out') {
      this.fade = Math.min(1, this.fade + dt / FADE_TIME);
      if (this.fade >= 1 && this.pending) {
        const next = this.pending;
        this.pending = null;
        this.swap(next);
        this.fade = 1;
        this.phase = 'in';
      }
      return;
    }
    if (this.phase === 'in') {
      this.fade = Math.max(0, this.fade - dt / FADE_TIME);
      if (this.fade <= 0) this.phase = 'idle';
    }
    this.current?.update(dt);
  }

  render(ctx: CanvasRenderingContext2D): void {
    this.current?.render(ctx);
    if (this.fade > 0) {
      ctx.fillStyle = `rgba(0,0,0,${this.fade})`;
      ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);
    }
  }

  blur(): void {
    this.current?.onBlur?.();
  }

  private swap(next: Scene): void {
    this.current?.exit?.();
    this.current = next;
    this.onSwap();
    next.enter?.();
  }
}
