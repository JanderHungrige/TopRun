export const LOGICAL_W = 1280;
export const LOGICAL_H = 720;

export interface Viewport {
  scale: number;
  offsetX: number;
  offsetY: number;
  dpr: number;
  cssW: number;
  cssH: number;
}

/** Fits the logical 1280×720 frame into a CSS-pixel window, centred with letterbox bars. */
export function computeViewport(cssW: number, cssH: number, dpr: number): Viewport {
  const scale = Math.min(cssW / LOGICAL_W, cssH / LOGICAL_H);
  return {
    scale,
    offsetX: (cssW - LOGICAL_W * scale) / 2,
    offsetY: (cssH - LOGICAL_H * scale) / 2,
    dpr,
    cssW,
    cssH,
  };
}

export function toLogical(vp: Viewport, cssX: number, cssY: number): { x: number; y: number } {
  return { x: (cssX - vp.offsetX) / vp.scale, y: (cssY - vp.offsetY) / vp.scale };
}

export class Screen {
  readonly canvas: HTMLCanvasElement;
  readonly ctx: CanvasRenderingContext2D;
  vp: Viewport;

  constructor(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) throw new Error('Canvas 2D is not supported in this browser');
    this.canvas = canvas;
    this.ctx = ctx;
    this.vp = computeViewport(LOGICAL_W, LOGICAL_H, 1);
    this.resize();
  }

  resize(): void {
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    const cssW = window.innerWidth;
    const cssH = window.innerHeight;
    this.vp = computeViewport(cssW, cssH, dpr);
    this.canvas.width = Math.round(cssW * dpr);
    this.canvas.height = Math.round(cssH * dpr);
    this.canvas.style.width = `${cssW}px`;
    this.canvas.style.height = `${cssH}px`;
  }

  /** Clears the whole canvas and sets the transform so game code draws in logical units. */
  begin(): CanvasRenderingContext2D {
    const { ctx, vp } = this;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    const s = vp.scale * vp.dpr;
    ctx.setTransform(s, 0, 0, s, vp.offsetX * vp.dpr, vp.offsetY * vp.dpr);
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, LOGICAL_W, LOGICAL_H);
    ctx.clip();
    return ctx;
  }

  end(): void {
    this.ctx.restore();
  }
}
