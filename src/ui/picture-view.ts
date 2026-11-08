import type { AudioEngine } from '../core/audio';
import type { Input } from '../core/input';
import { t } from '../i18n/i18n';
import { pixelButton } from '../render/rooms-chrome';
import { COLORS, text } from '../render/text';
import { drawButton, hit, type Rect } from './widgets';

// Picture mode (doc 76): on the screens with a generated picture behind their panels (the LOADOUT, the shipyard, the
// GROUND BASE, the LAB) an eye button and the key V hide the panels so the picture shows whole and undimmed; V, ESC,
// ENTER or a tap anywhere brings them back. The scene asks `on` before it draws its panels and its wash.

/** How long the way-back hint shows before it fades out (s). */
const HINT_TIME = 3;
/** How faint the eye button is over the bare picture. */
const FAINT = 0.45;

/** 'panel' = the loadout's rounded buttons, 'pixel' = the base rooms' pixel frames. */
export type EyeStyle = 'panel' | 'pixel';

export class PictureView {
  private shown = false;
  private since = 0;
  private hover = false;
  private time = 0;

  constructor(private readonly audio: AudioEngine, readonly button: Rect, private readonly style: EyeStyle) {}

  /** The picture alone is on screen: the scene draws no panels and no wash. */
  get on(): boolean {
    return this.shown;
  }

  /** Reads the toggle. True when the frame's input is used up (picture mode on, or just switched): the scene reads nothing else. */
  update(dt: number, input: Input): boolean {
    this.time += dt;
    this.since += dt;
    this.hover = input.device !== 'touch' && hit(input.pointer, this.button);
    const back = input.pressed('view') || input.pressed('back') || input.pressed('confirm') || input.taps.length > 0;
    if (this.shown) {
      if (back) this.toggle();
      return true;
    }
    if (!input.pressed('view') && !input.taps.some((p) => hit(p, this.button))) return false;
    this.toggle();
    return true;
  }

  private toggle(): void {
    this.shown = !this.shown;
    this.since = 0;
    this.audio.play(this.shown ? 'uiSelect' : 'uiBack');
  }

  /** The eye button; over the bare picture faint, with the way back as a hint line that fades. */
  draw(ctx: CanvasRenderingContext2D, touch: boolean): void {
    const b = this.button;
    ctx.save();
    if (this.shown) ctx.globalAlpha = this.hover ? 0.8 : FAINT;
    if (this.style === 'pixel') pixelButton(ctx, b, '', this.hover);
    else drawButton(ctx, { id: 'picture', label: '', ...b, hint: 'V' }, this.hover, this.time);
    drawEye(ctx, b.x + b.w / 2, b.y + b.h / 2, this.hover ? COLORS.gold : COLORS.ink, this.shown);
    ctx.restore();
    const alpha = Math.min(1, HINT_TIME - this.since);
    if (!this.shown || alpha <= 0) return;
    text(ctx, t(touch ? 'picture.backTouch' : 'picture.back'), 640, 700, {
      size: 14, weight: 700, align: 'center', color: COLORS.ink, alpha, stroke: '#0a0710', strokeWidth: 4,
    });
  }
}

/** An eye (open: the panels show) or the same eye with a stroke through it (the panels are hidden). */
function drawEye(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, struck: boolean): void {
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(x - 13, y);
  ctx.quadraticCurveTo(x, y - 12, x + 13, y);
  ctx.quadraticCurveTo(x, y + 12, x - 13, y);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x, y, 4, 0, Math.PI * 2);
  ctx.fill();
  if (!struck) return;
  ctx.beginPath();
  ctx.moveTo(x - 12, y + 10);
  ctx.lineTo(x + 12, y - 10);
  ctx.stroke();
}
