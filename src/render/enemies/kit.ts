import { circle } from '../shapes';
import { hash } from './fx';

/**
 * Shared kit for the detailed top-down enemy aircraft. Noses point down (+y), light comes from -x in
 * the body frame. Geometry is built once into Path2D objects (lazily: Path2D is a DOM type) and
 * gradients are cached per context; the static result is cached once more as a sprite (layer.ts).
 */

export type Pts = readonly number[];

export interface AirPal {
  /** Silhouette pass (hit flash / shadow sprite): every colour is the same, details are skipped. */
  mono: boolean;
  /** Animated extras: afterburners, beacons. */
  live: boolean;
  base: string;
  /** Camouflage colours, one per `Frame.camo` path. */
  camo: readonly string[];
  dark: string;
  metal: string;
  radome: string;
  outline: string;
  panel: string;
  hinge: string;
  store: string;
}

const MONO = new Map<string, AirPal>();

export function monoAir(c: string, live: boolean): AirPal {
  const key = `${c}${live ? '+' : '-'}`;
  let p = MONO.get(key);
  if (!p) {
    p = { mono: true, live, base: c, camo: [], dark: c, metal: c, radome: c, outline: c, panel: c, hinge: c, store: c };
    MONO.set(key, p);
  }
  return p;
}

export function lazy<T>(make: () => T): () => T {
  let v: T | undefined;
  return () => (v ??= make());
}

// ---------- geometry ----------

function signedArea(pts: Pts): number {
  let s = 0;
  for (let i = 0; i < pts.length; i += 2) {
    const j = (i + 2) % pts.length;
    s += (pts[i] ?? 0) * (pts[j + 1] ?? 0) - (pts[j] ?? 0) * (pts[i + 1] ?? 0);
  }
  return s;
}

/** Adds a closed polygon with normalised winding, so overlapping parts union under the nonzero rule. */
export function addPoly(p: Path2D, pts: Pts, mirror = false): void {
  const sx = mirror ? -1 : 1;
  const n = pts.length / 2;
  const rev = signedArea(pts) * sx < 0;
  for (let k = 0; k < n; k++) {
    const i = (rev ? n - 1 - k : k) * 2;
    const x = (pts[i] ?? 0) * sx;
    const y = pts[i + 1] ?? 0;
    if (k === 0) p.moveTo(x, y);
    else p.lineTo(x, y);
  }
  p.closePath();
}

/** Full outline from its right half (top centre → down the right side); the left side is mirrored. */
export function sym(right: Pts): number[] {
  const out = [...right];
  for (let i = right.length - 2; i >= 0; i -= 2) {
    const x = right[i] ?? 0;
    if (x !== 0) out.push(-x, right[i + 1] ?? 0); // points on the centre line are not doubled
  }
  return out;
}

/** Points along an ellipse arc (angles in radians, canvas convention). */
export function arc(cx: number, cy: number, rx: number, ry: number, a0: number, a1: number, n: number): number[] {
  const out: number[] = [];
  for (let i = 0; i <= n; i++) {
    const a = a0 + ((a1 - a0) * i) / n;
    out.push(cx + Math.cos(a) * rx, cy + Math.sin(a) * ry);
  }
  return out;
}

/** Half-width of a `sym` right-half outline at height y (linear between its points). */
function widthAt(right: Pts, y: number): number {
  for (let i = 2; i < right.length; i += 2) {
    const y0 = right[i - 1] ?? 0;
    const y1 = right[i + 1] ?? 0;
    if ((y - y0) * (y - y1) <= 0 && y0 !== y1) return (right[i - 2] ?? 0) + ((right[i] ?? 0) - (right[i - 2] ?? 0)) * ((y - y0) / (y1 - y0));
  }
  return 0;
}

/** Fuselage frame lines across the outline `right` at the given heights. */
export function frames(right: Pts, ys: Pts, inset = 0.05): number[][] {
  return ys.map((y) => {
    const w = widthAt(right, y) - inset;
    return [-w, y, w, y];
  });
}

/** Union of polygons; `pairs` are added together with their mirror image. */
export function shape(polys: readonly Pts[], pairs: readonly Pts[] = []): Path2D {
  const p = new Path2D();
  for (const q of polys) addPoly(p, q);
  for (const q of pairs) {
    addPoly(p, q);
    addPoly(p, q, true);
  }
  return p;
}

/** Open polylines for stroking; `pairs` are mirrored too. */
export function lines(chains: readonly Pts[], pairs: readonly Pts[] = []): Path2D {
  const p = new Path2D();
  const add = (c: Pts, s: number): void => {
    for (let i = 0; i < c.length; i += 2) {
      if (i === 0) p.moveTo((c[i] ?? 0) * s, c[i + 1] ?? 0);
      else p.lineTo((c[i] ?? 0) * s, c[i + 1] ?? 0);
    }
  };
  for (const c of chains) add(c, 1);
  for (const c of pairs) {
    add(c, 1);
    add(c, -1);
  }
  return p;
}

/** Soft camouflage blotches; `list` holds groups of cx, cy, rx, ry, rotation, seed. */
export function blobs(list: Pts): Path2D {
  const p = new Path2D();
  for (let g = 0; g < list.length; g += 6) {
    const [cx, cy, rx, ry, rot, seed] = [0, 1, 2, 3, 4, 5].map((k) => list[g + k] ?? 0) as [number, number, number, number, number, number];
    const pts: number[] = [];
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2;
      const k = 0.7 + 0.5 * hash(seed * 7.3 + i);
      const ex = Math.cos(a) * rx * k;
      const ey = Math.sin(a) * ry * k;
      pts.push(cx + ex * Math.cos(rot) - ey * Math.sin(rot), cy + ex * Math.sin(rot) + ey * Math.cos(rot));
    }
    const mid = (i: number, j: number): [number, number] => [((pts[i] ?? 0) + (pts[j] ?? 0)) / 2, ((pts[i + 1] ?? 0) + (pts[j + 1] ?? 0)) / 2];
    p.moveTo(...mid(16, 0));
    for (let i = 0; i < 18; i += 2) p.quadraticCurveTo(pts[i] ?? 0, pts[i + 1] ?? 0, ...mid(i, (i + 2) % 18));
    p.closePath();
  }
  return p;
}

// ---------- paint ----------

export const LIGHT = 'rgba(255,255,255,0.13)';
export const SHADE = 'rgba(0,0,0,0.2)';
const GLARE = 'rgba(255,255,255,0.55)';
const FRAME = 'rgba(30,34,36,0.85)';
const RIM = 'rgba(8,10,12,0.8)';

export function fillPath(ctx: CanvasRenderingContext2D, p: Path2D, fill: string | CanvasGradient): void {
  ctx.fillStyle = fill;
  ctx.fill(p);
}

export function strokePath(ctx: CanvasRenderingContext2D, p: Path2D, stroke: string, w: number): void {
  ctx.lineWidth = w;
  ctx.strokeStyle = stroke;
  ctx.stroke(p);
}

const GRADS = new WeakMap<CanvasRenderingContext2D, Map<string, CanvasGradient>>();

/** Gradient cache per context (gradients live in the body frame, so they survive translate/rotate). */
export function cached(ctx: CanvasRenderingContext2D, key: string, make: () => CanvasGradient): CanvasGradient {
  let m = GRADS.get(ctx);
  if (!m) GRADS.set(ctx, (m = new Map()));
  let g = m.get(key);
  if (!g) m.set(key, (g = make()));
  return g;
}

/** Cylinder shading overlay across x0..x1 (lit from -x). */
export function tube(ctx: CanvasRenderingContext2D, x0: number, x1: number): CanvasGradient {
  return cached(ctx, `t${x0}:${x1}`, () => {
    const g = ctx.createLinearGradient(x0, 0, x1, 0);
    g.addColorStop(0, 'rgba(0,0,0,0.3)');
    g.addColorStop(0.28, 'rgba(255,255,255,0.2)');
    g.addColorStop(0.5, 'rgba(255,255,255,0.04)');
    g.addColorStop(0.78, 'rgba(0,0,0,0.1)');
    g.addColorStop(1, 'rgba(0,0,0,0.42)');
    return g;
  });
}

function glassGrad(ctx: CanvasRenderingContext2D, rear: number, front: number): CanvasGradient {
  return cached(ctx, `g${rear}:${front}`, () => {
    const g = ctx.createLinearGradient(-1, rear, 1, front);
    g.addColorStop(0, '#0d171d');
    g.addColorStop(0.5, '#28495a');
    g.addColorStop(1, '#6a99a8');
    return g;
  });
}

/** Static airframe: one silhouette path, camouflage, shading overlays, panel and hinge lines. */
export interface Frame {
  body: Path2D;
  camo: readonly Path2D[];
  tubes: readonly { path: Path2D; x0: number; x1: number }[];
  light: Path2D;
  shade: Path2D;
  panels: Path2D;
  hinges: Path2D;
}

export function drawFrame(ctx: CanvasRenderingContext2D, a: AirPal, f: Frame): void {
  strokePath(ctx, f.body, a.outline, a.mono ? 0.8 : 0.6);
  fillPath(ctx, f.body, a.base);
  if (a.mono) return;
  ctx.save();
  ctx.clip(f.body);
  f.camo.forEach((c, i) => fillPath(ctx, c, a.camo[i] ?? a.base));
  for (const tb of f.tubes) fillPath(ctx, tb.path, tube(ctx, tb.x0, tb.x1));
  fillPath(ctx, f.light, LIGHT);
  fillPath(ctx, f.shade, SHADE);
  strokePath(ctx, f.panels, a.panel, 0.22);
  strokePath(ctx, f.hinges, a.hinge, 0.3);
  ctx.restore();
}

export interface Canopy { glass: Path2D; frame: Path2D; glare: Path2D; rear: number; front: number; seats: Pts }

export function makeCanopy(right: Pts, frame: readonly Pts[], glare: Pts, seats: Pts): Canopy {
  const ys = right.filter((_, i) => i % 2 === 1);
  return { glass: shape([sym(right)]), frame: lines(frame), glare: shape([glare]), rear: Math.min(...ys), front: Math.max(...ys), seats };
}

export function drawCanopy(ctx: CanvasRenderingContext2D, a: AirPal, c: Canopy): void {
  if (a.mono) return;
  fillPath(ctx, c.glass, glassGrad(ctx, c.rear, c.front));
  for (let i = 0; i < c.seats.length; i += 2) circle(ctx, c.seats[i] ?? 0, c.seats[i + 1] ?? 0, 0.55, 'rgba(196,198,190,0.55)');
  fillPath(ctx, c.glare, GLARE);
  strokePath(ctx, c.frame, FRAME, 0.3);
  strokePath(ctx, c.glass, RIM, 0.3);
}
