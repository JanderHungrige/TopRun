import type { Vec } from '../../core/math';
import { FONT_TYPE } from '../text';

// Dogfight Tactics (doc 19): whiteboard marker drawing — slightly wobbly strokes, arrowheads, hand-drawn
// circles, handwriting and the jet glyph the instructor sketches.

export const INK = { blue: '#1d5fc4', red: '#cf3229', black: '#26292f', green: '#1f8a52' } as const;
/** The whiteboard lettering uses the game-wide typewriter face too (doc 20). */
export const MARKER_FONT = FONT_TYPE;

/** Deterministic noise in [−1, 1]. */
export const wobble = (seed: number, i: number): number => {
  const x = Math.sin(seed * 12.9898 + i * 78.233) * 43758.5453;
  return (x - Math.floor(x)) * 2 - 1;
};

export const pathLength = (pts: readonly Vec[]): number => {
  let n = 0;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1];
    const b = pts[i];
    if (a && b) n += Math.hypot(b.x - a.x, b.y - a.y);
  }
  return n;
};

/** The first `p` (0 … 1) of the polyline by length; the last point is interpolated. */
export function partial(pts: readonly Vec[], p: number): Vec[] {
  if (p >= 1) return [...pts];
  const goal = pathLength(pts) * Math.max(0, p);
  const out: Vec[] = pts[0] ? [pts[0]] : [];
  let run = 0;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1];
    const b = pts[i];
    if (!a || !b) continue;
    const seg = Math.hypot(b.x - a.x, b.y - a.y);
    if (run + seg >= goal) {
      const k = seg > 0 ? (goal - run) / seg : 0;
      out.push({ x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k });
      return out;
    }
    run += seg;
    out.push(b);
  }
  return out;
}

/** A marker stroke along `pts` (with a faint second pass for the ink texture). */
export function stroke(ctx: CanvasRenderingContext2D, pts: readonly Vec[], color: string, width = 4, seed = 1, dash?: number[]): void {
  if (pts.length < 2) return;
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = color;
  if (dash) ctx.setLineDash(dash);
  for (const pass of [0, 1]) {
    ctx.globalAlpha = pass === 0 ? 0.92 : 0.3;
    ctx.lineWidth = pass === 0 ? width : width * 0.55;
    ctx.beginPath();
    pts.forEach((p, i) => {
      const w = 0.9 * wobble(seed + pass * 31, i);
      if (i === 0) ctx.moveTo(p.x + w, p.y - w);
      else ctx.lineTo(p.x + w, p.y - w);
    });
    ctx.stroke();
  }
  ctx.restore();
}

export function arrowHead(ctx: CanvasRenderingContext2D, tip: Vec, angle: number, color: string, size = 13, width = 4): void {
  const back = (a: number): Vec => ({ x: tip.x - Math.cos(angle + a) * size, y: tip.y - Math.sin(angle + a) * size });
  stroke(ctx, [back(0.5), tip, back(-0.5)], color, width, 7);
}

/** Polyline with an arrowhead at its (partial) end. */
export function arrow(ctx: CanvasRenderingContext2D, pts: readonly Vec[], color: string, p = 1, width = 4, seed = 1, dash?: number[]): void {
  const shown = partial(pts, p);
  stroke(ctx, shown, color, width, seed, dash);
  const end = shown[shown.length - 1];
  const before = shown[shown.length - 2];
  if (end && before && (end.x !== before.x || end.y !== before.y)) {
    arrowHead(ctx, end, Math.atan2(end.y - before.y, end.x - before.x), color, 8 + width * 1.4, width);
  }
}

/** A hand-drawn ellipse that overshoots its start a little. */
export function ring(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, color: string, width = 3, seed = 3): void {
  const pts: Vec[] = [];
  for (let i = 0; i <= 26; i++) {
    const a = -0.6 + (i / 24) * Math.PI * 2;
    const k = 1 + 0.04 * wobble(seed, i);
    pts.push({ x: x + Math.cos(a) * rx * k, y: y + Math.sin(a) * ry * k });
  }
  stroke(ctx, pts, color, width, seed);
}

export interface WriteOpts {
  size?: number;
  color?: string;
  align?: CanvasTextAlign;
  rot?: number;
  maxWidth?: number;
  alpha?: number;
}

/** Handwriting in marker. */
export function write(ctx: CanvasRenderingContext2D, s: string, x: number, y: number, o: WriteOpts = {}): void {
  ctx.save();
  ctx.translate(x, y);
  if (o.rot) ctx.rotate(o.rot);
  ctx.font = `700 ${o.size ?? 20}px ${MARKER_FONT}`;
  ctx.textAlign = o.align ?? 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.globalAlpha *= o.alpha ?? 1;
  ctx.fillStyle = o.color ?? INK.black;
  ctx.fillText(s, 0, 0, o.maxWidth);
  ctx.restore();
}

export function writtenWidth(ctx: CanvasRenderingContext2D, s: string, size: number): number {
  ctx.save();
  ctx.font = `700 ${size}px ${MARKER_FONT}`;
  const w = ctx.measureText(s).width;
  ctx.restore();
  return w;
}

/** Greedy word wrap for the handwriting font. */
export function wrapWritten(ctx: CanvasRenderingContext2D, s: string, maxWidth: number, size: number): string[] {
  const lines: string[] = [];
  let line = '';
  for (const w of s.split(/\s+/).filter(Boolean)) {
    const next = line ? `${line} ${w}` : w;
    if (line && writtenWidth(ctx, next, size) > maxWidth) {
      lines.push(line);
      line = w;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

const GLYPH: readonly number[] = [
  0, -19, 3, -10, 3, -3, 15, 6, 15, 9, 3, 7, 3, 12, 8, 17, 8, 19, 0, 17, -8, 19, -8, 17, -3, 12, -3, 7, -15, 9, -15, 6, -3, -3, -3, -10,
];

/** The jet as the instructor sketches it: a marker outline with a light tint, nose along `heading` (0 = up). */
export function jetGlyph(ctx: CanvasRenderingContext2D, x: number, y: number, heading: number, color: string, scale = 1.2): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(heading);
  ctx.scale(scale, scale);
  ctx.beginPath();
  for (let i = 0; i < GLYPH.length; i += 2) {
    const px = GLYPH[i] ?? 0;
    const py = GLYPH[i + 1] ?? 0;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.globalAlpha = 0.22;
  ctx.fillStyle = color;
  ctx.fill();
  ctx.globalAlpha = 0.95;
  ctx.lineJoin = 'round';
  ctx.lineWidth = 2.6 / scale;
  ctx.strokeStyle = color;
  ctx.stroke();
  ctx.restore();
}
