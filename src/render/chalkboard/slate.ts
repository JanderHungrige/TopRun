import { BOARD_H, BOARD_W, colorOf, densityOf, hash3, MAX_DENSITY, type Cells } from '../../game/chalkboard';
import { makeCanvas } from '../pixel/post';

// Chalkboard (doc 40): the slate with its chalk, one image pixel per board cell, drawn scaled with hard edges — 4×
// in the board scene, 1× as the hangar's miniature. Wet cells (the board scene's sponge) show darker slate.

const CHALK: readonly (readonly [number, number, number])[] = [[238, 236, 226], [246, 222, 122], [242, 168, 198], [166, 206, 242]];
/** Slate colour and its speckle. */
const SLATE: readonly [number, number, number] = [44, 72, 58];
/** How dark a fully wet cell is. */
const WET_DARK = 0.38;

export class Slate {
  readonly canvas: HTMLCanvasElement;
  private readonly g: CanvasRenderingContext2D | null;
  private readonly img: ImageData | null;
  private readonly base: Float32Array;
  private drawn = -1;

  /** `light` scales the slate and the chalk (the hangar's dusk is darker than the board scene). */
  constructor(private readonly light = 1) {
    this.canvas = makeCanvas(BOARD_W, BOARD_H);
    this.g = this.canvas.getContext('2d');
    this.img = this.g ? this.g.createImageData(BOARD_W, BOARD_H) : null;
    this.base = new Float32Array(BOARD_W * BOARD_H);
    for (let y = 0; y < BOARD_H; y++) {
      for (let x = 0; x < BOARD_W; x++) {
        const h = hash3(x, y, 77);
        const smudge = hash3(x >> 3, y >> 2, 5) % 9;
        this.base[y * BOARD_W + x] = (0.9 + (h % 13) / 100 + smudge / 140) * light;
      }
    }
  }

  /** Repaints when `version` (the board's change count) moved or anything is wet. */
  paint(cells: Cells, version: number, wet: Float32Array | null = null): void {
    if (!this.g || !this.img || (version === this.drawn && !wet)) return;
    const d = this.img.data;
    for (let i = 0; i < cells.length; i++) {
      const v = cells[i] ?? 0;
      const shade = (this.base[i] ?? 1) * (1 - WET_DARK * (wet?.[i] ?? 0));
      const a = Math.min(1, (densityOf(v) / MAX_DENSITY) * 1.3) * (0.84 + ((hash3(i, 3, 9) % 17) / 100));
      const ink = CHALK[colorOf(v)] ?? CHALK[0] ?? [255, 255, 255];
      const k = i * 4;
      for (let c = 0; c < 3; c++) d[k + c] = (SLATE[c] ?? 0) * shade * (1 - a) + (ink[c] ?? 0) * this.light * a;
      d[k + 3] = 255;
    }
    this.g.putImageData(this.img, 0, 0);
    this.drawn = version;
  }

  /** The slate at (x, y), `scale` logical px per cell, hard pixel edges. */
  draw(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number): void {
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(this.canvas, x, y, BOARD_W * scale, BOARD_H * scale);
    ctx.restore();
  }
}
