import { FAR_VEIL, LINE } from './palette';
import type { Tone } from './types';

// People kit (doc 17): smooth outlines from control points, body parts with generated shading bands,
// and the painter that shades a part from the side the light comes from.

export type Pts = readonly number[];

/** Built on first use and kept: Path2D does not exist in Node, where tests import these modules. */
export function lazy<T>(make: () => T): () => T {
  let v: T | undefined;
  return () => (v ??= make());
}

/** Paths that depend on a few discrete inputs (a turn, a jaw opening): built once per key. */
export function memo(make: () => Path2D, cache: Map<string, Path2D>, key: string): Path2D {
  let p = cache.get(key);
  if (!p) {
    p = make();
    cache.set(key, p);
  }
  return p;
}

const px = (p: Pts, i: number): number => p[i * 2] ?? 0;
const py = (p: Pts, i: number): number => p[i * 2 + 1] ?? 0;

/** Closed smooth loop through the midpoints of consecutive control points. */
export function smoothClosed(path: CanvasPath, p: Pts): void {
  const n = p.length / 2;
  path.moveTo((px(p, n - 1) + px(p, 0)) / 2, (py(p, n - 1) + py(p, 0)) / 2);
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    path.quadraticCurveTo(px(p, i), py(p, i), (px(p, i) + px(p, j)) / 2, (py(p, i) + py(p, j)) / 2);
  }
  path.closePath();
}

/** Open smooth curve from the first to the last control point (continues the current path). */
export function smoothOpen(path: CanvasPath, p: Pts, move = true): void {
  const n = p.length / 2;
  if (move) path.moveTo(px(p, 0), py(p, 0));
  else path.lineTo(px(p, 0), py(p, 0));
  for (let i = 1; i < n - 1; i++) path.quadraticCurveTo(px(p, i), py(p, i), (px(p, i) + px(p, i + 1)) / 2, (py(p, i) + py(p, i + 1)) / 2);
  path.lineTo(px(p, n - 1), py(p, n - 1));
}

export function closedPath(p: Pts): Path2D {
  const path = new Path2D();
  smoothClosed(path, p);
  return path;
}

/** Several closed soft shapes in one path (muscle definition, folds). */
export function shapes(list: readonly Pts[]): Path2D {
  const path = new Path2D();
  for (const p of list) smoothClosed(path, p);
  return path;
}

/** Control points of a closed sliver along `line`, `w` wide in the middle and pointed at both ends. */
export function taper(line: Pts, w: number): number[] {
  const n = line.length / 2;
  const left: number[] = [];
  const right: number[] = [];
  for (let i = 0; i < n; i++) {
    const a = Math.max(0, i - 1);
    const b = Math.min(n - 1, i + 1);
    const tx = px(line, b) - px(line, a);
    const ty = py(line, b) - py(line, a);
    const len = Math.hypot(tx, ty) || 1;
    const h = (w / 2) * Math.sin((Math.PI * i) / (n - 1));
    left.push(px(line, i) - (ty / len) * h, py(line, i) + (tx / len) * h);
    right.unshift(px(line, i) + (ty / len) * h, py(line, i) - (tx / len) * h);
  }
  return [...left, ...right];
}

/** Points with every y scaled by k (towards the bone axis). */
function squeeze(p: Pts, k: number): number[] {
  return p.map((v, i) => (i % 2 ? v * k : v));
}

function reversed(p: Pts): number[] {
  const out: number[] = [];
  for (let i = p.length - 2; i >= 0; i -= 2) out.push(p[i] ?? 0, p[i + 1] ?? 0);
  return out;
}

/**
 * A body part along its own +x axis (joint at 0, pointing down the body). `ant` is the anterior
 * contour on −y, `post` the posterior contour on +y, both from the proximal to the distal end.
 */
export interface PartSpec {
  ant: Pts;
  post: Pts;
  /** Soft muscle-definition shapes, filled in the shadow colour. */
  defs?: readonly Pts[];
}

export interface Part {
  body: Path2D;
  shA: Path2D;
  shP: Path2D;
  hiA: Path2D;
  hiP: Path2D;
  defs: Path2D | null;
}

const band = (edge: Pts, k0: number, k1: number): Path2D => closedPath([...squeeze(edge, k0), ...reversed(squeeze(edge, k1))]);

export function makePart(s: PartSpec): Part {
  return {
    body: closedPath([...s.ant, ...reversed(s.post)]),
    shA: band(s.ant, 1.3, 0.42),
    shP: band(s.post, 1.3, 0.42),
    hiA: band(s.ant, 0.86, 0.5),
    hiP: band(s.post, 0.86, 0.5),
    defs: s.defs ? shapes(s.defs) : null,
  };
}

export const lazyPart = (s: PartSpec): (() => Part) => lazy(() => makePart(s));

/** How much the anterior (−y) side of a bone at world angle `angle` faces the light: −1 … 1. */
export function litOf(angle: number, flip: boolean, lx = 0, ly = -1): number {
  const s = flip ? -1 : 1;
  return (Math.sin(angle) * lx - Math.cos(angle) * ly) * s;
}

export function outline(ctx: CanvasRenderingContext2D, path: Path2D, lw: number): void {
  ctx.lineWidth = lw;
  ctx.strokeStyle = LINE;
  ctx.stroke(path);
}

/** Flat base, shadow band away from the light, highlight stripe towards it, soft muscle definition. */
export function paintPart(ctx: CanvasRenderingContext2D, part: Part, tone: Tone, lit: number, far = false, defs = true): void {
  const a = 0.5 + 0.5 * lit;
  ctx.fillStyle = tone.base;
  ctx.fill(part.body);
  ctx.save();
  ctx.clip(part.body);
  ctx.fillStyle = tone.shadow;
  ctx.globalAlpha = 0.22 + 0.78 * (1 - a);
  ctx.fill(part.shA);
  ctx.globalAlpha = 0.22 + 0.78 * a;
  ctx.fill(part.shP);
  if (part.defs && defs) {
    ctx.globalAlpha = 0.6;
    ctx.fill(part.defs);
  }
  ctx.fillStyle = tone.light;
  ctx.globalAlpha = 0.7 * a * a;
  ctx.fill(part.hiA);
  ctx.globalAlpha = 0.7 * (1 - a) * (1 - a);
  ctx.fill(part.hiP);
  if (far) {
    ctx.globalAlpha = 1;
    ctx.fillStyle = FAR_VEIL;
    ctx.fill(part.body);
  }
  ctx.restore();
}

/** Moves the context into a bone frame: origin at (x, y), +x along `angle`; `sx` stretches the bone, `sy` its girth. */
export function enterBone(ctx: CanvasRenderingContext2D, x: number, y: number, angle: number, sx = 1, flip = false, sy = 1): void {
  ctx.translate(x, y);
  ctx.rotate(angle);
  if (sx !== 1 || sy !== 1 || flip) ctx.scale(sx, flip ? -sy : sy);
}
