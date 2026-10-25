import type { Camo } from '../livery-art';
import type { Pts, Rect } from './geom';
import { lines } from './geom';
import type { Surface, TailZone, Zone } from './surface';

/**
 * Livery patterns, drawn inside the airframe clip: camouflage (generated once per surface and cached as
 * Path2D layers), tiger stripes, sunburst rays, wingtip bands, nose bands, show stripes and pinstripes.
 */

function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Soft camouflage blob: a smooth closed curve through jittered points, stretched along the airflow. */
function blob(p: Path2D, cx: number, cy: number, r: number, rand: () => number): void {
  const n = 7;
  const pts: number[] = [];
  const rot = -0.5;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const k = r * (0.7 + rand() * 0.45);
    const lx = Math.cos(a) * k * 1.35;
    const ly = Math.sin(a) * k * 0.85;
    pts.push(cx + lx * Math.cos(rot) - ly * Math.sin(rot), cy + lx * Math.sin(rot) + ly * Math.cos(rot));
  }
  const mid = (i: number): [number, number] => {
    const j = (i + 1) % n;
    return [((pts[i * 2] ?? 0) + (pts[j * 2] ?? 0)) / 2, ((pts[i * 2 + 1] ?? 0) + (pts[j * 2 + 1] ?? 0)) / 2];
  };
  const start = mid(n - 1);
  p.moveTo(start[0], start[1]);
  for (let i = 0; i < n; i++) {
    const m = mid(i);
    p.quadraticCurveTo(pts[i * 2] ?? 0, pts[i * 2 + 1] ?? 0, m[0], m[1]);
  }
  p.closePath();
}

/** Angular splinter shard: a quad whose edges follow two fixed directions per layer. */
function shard(p: Path2D, cx: number, cy: number, r: number, rand: () => number, layer: number): void {
  const a1 = -0.42 + layer * 0.38;
  const a2 = a1 + 1.2 + rand() * 0.25;
  const l = [1.15, 0.6, 1.05, 0.55].map((k) => r * k * (0.65 + rand() * 0.6));
  const dirs = [a1, a2, a1 + Math.PI, a2 + Math.PI];
  dirs.forEach((a, i) => {
    const x = cx + Math.cos(a) * (l[i] ?? r);
    const y = cy + Math.sin(a) * (l[i] ?? r);
    if (i === 0) p.moveTo(x, y);
    else p.lineTo(x, y);
  });
  p.closePath();
}

function buildCamo(c: Camo, s: Surface): Path2D[] {
  const cell = s.cell * c.size;
  const rand = rng(c.seed);
  const layers = c.colors.map(() => new Path2D());
  const { x, y, w, h } = s.box;
  for (let gy = y - cell; gy < y + h + cell * 0.5; gy += cell) {
    for (let gx = x - cell; gx < x + w + cell * 0.5; gx += cell) {
      const pick = rand();
      const jx = rand();
      const jy = rand();
      const size = cell * (0.6 + rand() * 0.45);
      let acc = 0;
      const k = c.cover.findIndex((v) => pick < (acc += v));
      const layer = layers[k];
      if (k < 0 || !layer) continue;
      if (c.kind === 'blobs') blob(layer, gx + jx * cell, gy + jy * cell, size, rand);
      else shard(layer, gx + jx * cell, gy + jy * cell, size * 1.1, rand, k);
    }
  }
  return layers;
}

const camoCache = new Map<string, Path2D[]>();

export function drawCamo(ctx: CanvasRenderingContext2D, c: Camo, s: Surface): void {
  const key = `${s.key}:${c.kind}:${c.seed}:${c.size}`;
  let layers = camoCache.get(key);
  if (!layers) {
    layers = buildCamo(c, s);
    camoCache.set(key, layers);
  }
  const alpha = ctx.globalAlpha;
  layers.forEach((p, i) => {
    const color = c.colors[i] ?? '#000';
    ctx.fillStyle = color;
    ctx.fill(p);
    switch (c.kind) {
      case 'blobs': // feathered spray edge
        ctx.globalAlpha = alpha * 0.45;
        ctx.strokeStyle = color;
        ctx.lineWidth = s.cell * c.size * 0.2;
        ctx.stroke(p);
        ctx.globalAlpha = alpha;
        break;
      case 'splinter': break;
      default: throw new Error(`unhandled: ${c.kind satisfies never}`);
    }
  });
}

/** Maps (along, across) zone coordinates to x/y for a zone whose stripes run along `dir`. */
function zonePt(z: Zone, along: number, across: number): [number, number] {
  return z.dir === 'x' ? [z.x + along, z.y + across] : [z.x + across, z.y + along];
}

function tigerStripes(ctx: CanvasRenderingContext2D, z: Zone, color: string, cell: number): void {
  const len = z.dir === 'x' ? z.w : z.h;
  const cross = z.dir === 'x' ? z.h : z.w;
  const n = Math.max(2, Math.round(cross / Math.max(1.4, cell * 0.36)));
  const sp = cross / n;
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let k = 0; k < n; k++) {
    const c = (k + 0.5) * sp;
    const depth = len * (0.5 + ((k * 5) % 3) * 0.17);
    const fromEnd = k % 2 === 1;
    const a = (d: number): number => (fromEnd ? len - d : d);
    const bw = sp * 0.62;
    const pts = [
      zonePt(z, a(-0.5), c - bw / 2), zonePt(z, a(depth * 0.45), c - bw * 0.1), zonePt(z, a(depth), c + sp * 0.28),
      zonePt(z, a(depth * 0.55), c + bw * 0.42), zonePt(z, a(-0.5), c + bw / 2),
    ];
    pts.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
    ctx.closePath();
  }
  ctx.fill();
}

export function tigerZones(ctx: CanvasRenderingContext2D, [orange, black]: readonly [string, string], s: Surface): void {
  const zones: Zone[] = [...(s.nose ? [s.nose] : []), ...(s.tips ?? []), ...(s.tails ?? [])];
  for (const z of zones) {
    ctx.fillStyle = orange;
    ctx.fillRect(z.x, z.y, z.w, z.h);
    tigerStripes(ctx, z, black, s.cell);
  }
}

/** Sunburst: alternating wedges fanning out from the zone's origin, clipped to the zone. */
export function rayZones(ctx: CanvasRenderingContext2D, [base, ray]: readonly [string, string], zones: readonly TailZone[]): void {
  for (const z of zones) {
    const corners = [z.x, z.y, z.x + z.w, z.y, z.x + z.w, z.y + z.h, z.x, z.y + z.h];
    const mid = Math.atan2(z.y + z.h / 2 - z.oy, z.x + z.w / 2 - z.ox);
    let lo = 0;
    let hi = 0;
    let reach = 0;
    for (let i = 0; i < 8; i += 2) {
      const dx = (corners[i] ?? 0) - z.ox;
      const dy = (corners[i + 1] ?? 0) - z.oy;
      const d = Math.atan2(Math.sin(Math.atan2(dy, dx) - mid), Math.cos(Math.atan2(dy, dx) - mid));
      lo = Math.min(lo, d);
      hi = Math.max(hi, d);
      reach = Math.max(reach, Math.hypot(dx, dy));
    }
    ctx.save();
    ctx.beginPath();
    ctx.rect(z.x, z.y, z.w, z.h);
    ctx.clip();
    ctx.fillStyle = base;
    ctx.fillRect(z.x, z.y, z.w, z.h);
    ctx.fillStyle = ray;
    ctx.beginPath();
    const n = 9;
    for (let i = 0; i < n; i += 2) {
      const a0 = mid + lo + ((hi - lo) * i) / n;
      const a1 = mid + lo + ((hi - lo) * (i + 1)) / n;
      ctx.moveTo(z.ox, z.oy);
      ctx.arc(z.ox, z.oy, reach + 1, a0, a1);
      ctx.closePath();
    }
    ctx.fill();
    ctx.restore();
  }
}

export function tipBands(ctx: CanvasRenderingContext2D, colors: readonly string[], tips: readonly Zone[]): void {
  for (const z of tips) {
    const cross = z.dir === 'x' ? z.h : z.w;
    const bw = cross * 0.25;
    colors.forEach((color, i) => {
      const from = z.out === 1 ? cross - bw * (i + 1) : bw * i;
      ctx.fillStyle = color;
      if (z.dir === 'x') ctx.fillRect(z.x, z.y + from, z.w, bw + 0.05);
      else ctx.fillRect(z.x + from, z.y, bw + 0.05, z.h);
    });
  }
}

export function noseBand(
  ctx: CanvasRenderingContext2D, kind: 'solid' | 'diagonal', [a, b]: readonly [string, string], r: Rect,
): void {
  ctx.fillStyle = a;
  ctx.fillRect(r.x, r.y, r.w, r.h);
  if (kind === 'solid') return;
  const sp = Math.min(r.w, r.h) * 0.8;
  ctx.save();
  ctx.beginPath();
  ctx.rect(r.x, r.y, r.w, r.h);
  ctx.clip();
  ctx.fillStyle = b;
  ctx.beginPath();
  for (let t = -r.h; t < r.w + r.h; t += sp * 2) {
    ctx.moveTo(r.x + t, r.y);
    ctx.lineTo(r.x + t + sp, r.y);
    ctx.lineTo(r.x + t + sp - r.h, r.y + r.h);
    ctx.lineTo(r.x + t - r.h, r.y + r.h);
    ctx.closePath();
  }
  ctx.fill();
  ctx.restore();
}

const pathCache = new WeakMap<readonly Pts[], Path2D>();

function curvesPath(curves: readonly Pts[]): Path2D {
  let p = pathCache.get(curves);
  if (!p) {
    p = new Path2D();
    for (const c of curves) {
      p.moveTo(c[0] ?? 0, c[1] ?? 0);
      p.quadraticCurveTo(c[2] ?? 0, c[3] ?? 0, c[4] ?? 0, c[5] ?? 0);
    }
    pathCache.set(curves, p);
  }
  return p;
}

/** Show stripes: concentric strokes, widest first, so the colours read as parallel bands. */
export function showStripes(ctx: CanvasRenderingContext2D, colors: readonly string[], curves: readonly Pts[], cell: number): void {
  const p = curvesPath(curves);
  const n = colors.length;
  colors.forEach((color, i) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = cell * 0.6 * ((n - i) / n);
    ctx.stroke(p);
  });
}

export function trimLines(ctx: CanvasRenderingContext2D, color: string, trim: readonly Pts[], cell: number): void {
  let p = pathCache.get(trim);
  if (!p) {
    p = lines(trim);
    pathCache.set(trim, p);
  }
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(0.3, cell * 0.055);
  ctx.stroke(p);
}
