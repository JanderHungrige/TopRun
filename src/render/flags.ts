import { FLAGS, flagMarks, type FlagMark, type FlagSpec } from '../data/flags';
import type { Rect } from '../ui/widgets';
import { text } from './text';

// Ladder flags (doc 28): the stripe / cross / mark flags of data/flags.ts, five hand-painted ones (GB, US, GR, AU,
// NZ), and for every other country a small badge with its code.

type Ctx = CanvasRenderingContext2D;

function bands(ctx: Ctx, kind: 'h' | 'v', colors: readonly string[], b: Rect): void {
  const n = colors.length;
  colors.forEach((color, i) => {
    ctx.fillStyle = color;
    if (kind === 'h') {
      const y0 = Math.round(b.y + (b.h * i) / n);
      ctx.fillRect(b.x, y0, b.w, Math.round(b.y + (b.h * (i + 1)) / n) - y0);
    } else {
      const x0 = Math.round(b.x + (b.w * i) / n);
      ctx.fillRect(x0, b.y, Math.round(b.x + (b.w * (i + 1)) / n) - x0, b.h);
    }
  });
}

function mark(ctx: Ctx, m: FlagMark, b: Rect): void {
  const x = b.x + m.x * b.w;
  const y = b.y + m.y * b.h;
  const w = m.w * b.w;
  const h = m.h * b.h;
  ctx.fillStyle = m.color;
  ctx.beginPath();
  switch (m.shape) {
    case 'rect': ctx.rect(x, y, w, h); break;
    case 'disc': ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2); break;
    case 'diamond': ctx.moveTo(x + w / 2, y); ctx.lineTo(x + w, y + h / 2); ctx.lineTo(x + w / 2, y + h); ctx.lineTo(x, y + h / 2); break;
    case 'hoist': ctx.moveTo(b.x, b.y); ctx.lineTo(b.x + w, b.y + b.h / 2); ctx.lineTo(b.x, b.y + b.h); break;
    default: throw new Error(`unhandled: ${m.shape satisfies never}`);
  }
  ctx.fill();
}

function cross(ctx: Ctx, b: Rect, color: string, thickness: number, cxRatio: number): void {
  const t = b.h * thickness;
  ctx.fillStyle = color;
  ctx.fillRect(b.x + b.w * cxRatio - t / 2, b.y, t, b.h);
  ctx.fillRect(b.x, b.y + b.h / 2 - t / 2, b.w, t);
}

function diagonals(ctx: Ctx, b: Rect, color: string, width: number): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(b.x, b.y); ctx.lineTo(b.x + b.w, b.y + b.h);
  ctx.moveTo(b.x + b.w, b.y); ctx.lineTo(b.x, b.y + b.h);
  ctx.stroke();
}

function unionJack(ctx: Ctx, b: Rect): void {
  ctx.fillStyle = '#012169';
  ctx.fillRect(b.x, b.y, b.w, b.h);
  diagonals(ctx, b, '#ffffff', b.h * 0.22);
  diagonals(ctx, b, '#c8102e', b.h * 0.08);
  cross(ctx, b, '#ffffff', 0.34, 0.5);
  cross(ctx, b, '#c8102e', 0.2, 0.5);
}

/** The blue ensign of AU and NZ: Union Jack canton, stars as small discs. */
function ensign(ctx: Ctx, b: Rect, star: string): void {
  ctx.fillStyle = '#012169';
  ctx.fillRect(b.x, b.y, b.w, b.h);
  unionJack(ctx, { x: b.x, y: b.y, w: b.w / 2, h: b.h / 2 });
  for (const [cx, cy, r] of [[0.25, 0.75, 0.1], [0.75, 0.2, 0.06], [0.65, 0.45, 0.06], [0.85, 0.42, 0.06], [0.75, 0.82, 0.06]] as const) {
    mark(ctx, { shape: 'disc', color: star, x: cx - (r * 2) / 3, y: cy - r, w: (r * 4) / 3, h: r * 2 }, b);
  }
}

const PAINTERS: Readonly<Record<string, (ctx: Ctx, b: Rect) => void>> = {
  GB: unionJack,
  US: (ctx, b) => {
    bands(ctx, 'h', ['#b22234', '#ffffff', '#b22234', '#ffffff', '#b22234', '#ffffff', '#b22234'], b);
    ctx.fillStyle = '#3c3b6e';
    ctx.fillRect(b.x, b.y, b.w * 0.42, b.h * (4 / 7));
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) ctx.fillRect(b.x + b.w * (0.07 + i * 0.12), b.y + b.h * (0.12 + j * 0.25), 1, 1);
  },
  GR: (ctx, b) => {
    bands(ctx, 'h', ['#0d5eaf', '#ffffff', '#0d5eaf', '#ffffff', '#0d5eaf', '#ffffff', '#0d5eaf', '#ffffff', '#0d5eaf'], b);
    const canton = { x: b.x, y: b.y, w: b.h * (5 / 9), h: b.h * (5 / 9) };
    ctx.fillStyle = '#0d5eaf';
    ctx.fillRect(canton.x, canton.y, canton.w, canton.h);
    cross(ctx, canton, '#ffffff', 0.2, 0.5);
  },
  AU: (ctx, b) => ensign(ctx, b, '#ffffff'),
  NZ: (ctx, b) => ensign(ctx, b, '#c8102e'),
};

function drawSpec(ctx: Ctx, code: string, spec: FlagSpec, b: Rect): boolean {
  switch (spec.kind) {
    case 'h':
    case 'v':
      bands(ctx, spec.kind, spec.bands, b);
      for (const m of flagMarks(spec)) mark(ctx, m, b);
      return true;
    case 'nordic':
      ctx.fillStyle = spec.field;
      ctx.fillRect(b.x, b.y, b.w, b.h);
      cross(ctx, b, spec.cross, 0.26, 0.37);
      if (spec.inner) cross(ctx, b, spec.inner, 0.12, 0.37);
      return true;
    case 'painted': {
      const paint = PAINTERS[code];
      paint?.(ctx, b);
      return paint !== undefined;
    }
    default: throw new Error(`unhandled: ${spec satisfies never}`);
  }
}

/** A country's flag in the box (3 : 2), or a small badge with its code; nothing when the country is unknown. */
export function drawFlag(ctx: Ctx, code: string | null, b: Rect): void {
  if (code === null) return;
  const spec = FLAGS[code];
  ctx.save();
  ctx.beginPath();
  ctx.rect(b.x, b.y, b.w, b.h);
  ctx.clip();
  const drawn = spec !== undefined && drawSpec(ctx, code, spec, b);
  if (!drawn) {
    ctx.fillStyle = '#1b2638';
    ctx.fillRect(b.x, b.y, b.w, b.h);
    text(ctx, code, b.x + b.w / 2, b.y + b.h / 2 + 0.5, { size: 9, align: 'center', baseline: 'middle', color: '#c9d4e6' });
  }
  ctx.restore();
  ctx.strokeStyle = 'rgba(255,255,255,0.3)';
  ctx.lineWidth = 1;
  ctx.strokeRect(b.x - 0.5, b.y - 0.5, b.w + 1, b.h + 1);
}
