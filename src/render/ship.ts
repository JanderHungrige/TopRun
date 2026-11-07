import { TAU } from '../core/math';
import { CELL_PX, GRID, type ModuleId } from '../data/ship-modules';
import { allModules, type Placed } from '../game/ship';
import type { Look } from './livery-art';

// The spacecraft drawn from its modules (doc 54): one cell per module, nose up (−y), the core's cell centred on the
// origin. Used in the mission (CELL_PX per cell), the shipyard (bigger cells) and as the "starship" in plane lists.

type Ctx = CanvasRenderingContext2D;

export interface ShipDraw {
  /** Pixels per cell. */
  cell?: number;
  t?: number;
  /** Solid silhouette (shadows, hit flashes). */
  solid?: string;
  /** Engines burning (0–1). */
  throttle?: number;
}

/** The display ship for lists and the cockpit: a capsule, two lasers and an engine on the core. */
export const DISPLAY_SHIP: readonly Placed[] = Object.freeze([
  { id: 'capsule', col: GRID.core.col, row: GRID.core.row - 1 },
  { id: 'laser', col: GRID.core.col - 1, row: GRID.core.row },
  { id: 'laser', col: GRID.core.col + 1, row: GRID.core.row },
  { id: 'engine', col: GRID.core.col, row: GRID.core.row + 1 },
]);

const cx = (m: Placed, s: number): number => (m.col - GRID.core.col) * s;
const cy = (m: Placed, s: number): number => (m.row - GRID.core.row) * s;

function rr(ctx: Ctx, x: number, y: number, w: number, h: number, r: number, fill: string): void {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
}

/** One module's details over its cell's base block. `s` = cell size, (x, y) = cell centre. */
function detail(ctx: Ctx, id: ModuleId, x: number, y: number, s: number, look: Look, d: ShipDraw): void {
  const h = s / 2;
  const t = d.t ?? 0;
  switch (id) {
    case 'core':
      rr(ctx, x - h * 0.5, y - h * 0.55, h, h * 1.1, h * 0.4, '#1d2a3a');
      rr(ctx, x - h * 0.3, y - h * 0.45, h * 0.35, h * 0.5, h * 0.2, 'rgba(160,215,255,0.8)');
      rr(ctx, x - s * 0.06, y - h * 1.15, s * 0.12, h * 0.6, 1, '#2b2f38');
      return;
    case 'capsule':
      ctx.fillStyle = look.base;
      ctx.beginPath();
      ctx.moveTo(x, y - h * 1.25);
      ctx.lineTo(x + h, y + h * 0.2);
      ctx.lineTo(x + h, y + h);
      ctx.lineTo(x - h, y + h);
      ctx.lineTo(x - h, y + h * 0.2);
      ctx.closePath();
      ctx.fill();
      rr(ctx, x - h * 0.35, y - h * 0.25, h * 0.7, h * 0.45, h * 0.2, 'rgba(160,215,255,0.85)');
      return;
    case 'plate':
      rr(ctx, x - h * 0.75, y - h * 0.75, s * 0.75, s * 0.75, 1.5, 'rgba(0,0,0,0.18)');
      rr(ctx, x - h * 0.6, y - h * 0.6, s * 0.6, s * 0.15, 1, 'rgba(255,255,255,0.22)');
      return;
    case 'engine': {
      rr(ctx, x - h * 0.6, y + h * 0.35, s * 0.6, h * 0.75, 1.5, '#2b2f38');
      const f = (d.throttle ?? 0.6) * (0.8 + Math.sin(t * 40 + x) * 0.2);
      ctx.fillStyle = 'rgba(120,190,255,0.6)';
      ctx.beginPath();
      ctx.ellipse(x, y + h * 1.2 + f * h * 0.6, h * 0.42, h * (0.4 + f * 0.9), 0, 0, TAU);
      ctx.fill();
      return;
    }
    case 'laser':
      rr(ctx, x - s * 0.09, y - h * 1.3, s * 0.18, s * 0.95, 1, '#2b2f38');
      rr(ctx, x - s * 0.13, y - h * 1.35, s * 0.26, s * 0.12, 1, 'rgba(120,230,255,0.95)');
      return;
    case 'rockets':
      for (const dx of [-0.45, 0, 0.45]) rr(ctx, x + dx * h - s * 0.07, y - h * 0.9, s * 0.14, s * 0.75, 1, '#d8dee8');
      rr(ctx, x - h * 0.8, y + h * 0.45, s * 0.8, h * 0.35, 1, '#5b7cff');
      return;
    case 'torpedo': {
      rr(ctx, x - h * 0.55, y - h * 1.2, s * 0.55, s * 0.95, h * 0.25, '#2b2f38');
      const glow = 0.6 + Math.sin(t * 7 + x) * 0.3;
      ctx.fillStyle = `rgba(255,150,70,${glow.toFixed(2)})`;
      ctx.beginPath();
      ctx.arc(x, y - h * 0.95, h * 0.3, 0, TAU);
      ctx.fill();
      return;
    }
    case 'pointdef': {
      rr(ctx, x - h * 0.5, y - h * 0.5, h, h, h * 0.5, '#2b2f38');
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(Math.sin(t * 1.7 + x) * 0.6);
      for (const dx of [-0.16, 0.16]) rr(ctx, dx * s - s * 0.04, -h * 1.05, s * 0.08, h * 0.8, 1, '#c9d2e0');
      ctx.restore();
      return;
    }
    case 'shield':
      ctx.strokeStyle = `rgba(140,210,255,${(0.55 + Math.sin(t * 5) * 0.25).toFixed(2)})`;
      ctx.lineWidth = Math.max(1, s * 0.09);
      ctx.beginPath();
      ctx.arc(x, y, h * 0.55, 0, TAU);
      ctx.stroke();
      rr(ctx, x - s * 0.08, y - s * 0.08, s * 0.16, s * 0.16, 1, '#e8f4ff');
      return;
    case 'reactor':
      rr(ctx, x - h * 0.6, y - h * 0.6, s * 0.6, s * 0.6, h * 0.3, '#1d2a3a');
      ctx.fillStyle = `rgba(255,190,90,${(0.7 + Math.sin(t * 6) * 0.25).toFixed(2)})`;
      ctx.beginPath();
      ctx.arc(x, y, h * 0.32, 0, TAU);
      ctx.fill();
      return;
    default:
      throw new Error(`unhandled: ${id satisfies never}`);
  }
}

/** The whole ship: every cell's base block (slightly overlapping, so neighbours join), then each module's details. */
export function drawShip(ctx: Ctx, modules: readonly Placed[], look: Look, d: ShipDraw = {}): void {
  const s = d.cell ?? CELL_PX;
  const list = allModules({ modules: [...modules] });
  ctx.save();
  for (const m of list) {
    if (m.id === 'capsule' && !d.solid) continue;
    rr(ctx, cx(m, s) - s * 0.55, cy(m, s) - s * 0.55, s * 1.1, s * 1.1, s * 0.18, d.solid ?? look.under);
  }
  if (d.solid) return ctx.restore();
  for (const m of list) {
    if (m.id === 'capsule') continue;
    rr(ctx, cx(m, s) - s * 0.46, cy(m, s) - s * 0.46, s * 0.92, s * 0.92, s * 0.14, look.base);
  }
  for (const m of list) detail(ctx, m.id, cx(m, s), cy(m, s), s, look, d);
  ctx.restore();
}

/** The ship's outline as one path: every occupied cell. */
export function shipSilhouette(modules: readonly Placed[], cell = CELL_PX): Path2D {
  const p = new Path2D();
  for (const m of allModules({ modules: [...modules] })) p.rect(cx(m, cell) - cell * 0.55, cy(m, cell) - cell * 0.55, cell * 1.1, cell * 1.1);
  return p;
}

/** A side view for launch and lists: a sleek hull with a canopy and the engine glow (nose to the right). */
export function drawShipSide(ctx: Ctx, look: Look, t: number): void {
  ctx.fillStyle = look.base;
  ctx.beginPath();
  ctx.moveTo(46, -8);
  ctx.lineTo(10, -18);
  ctx.lineTo(-34, -16);
  ctx.lineTo(-40, -4);
  ctx.lineTo(-34, 0);
  ctx.lineTo(30, 0);
  ctx.closePath();
  ctx.fill();
  rr(ctx, 4, -20, 18, 6, 3, 'rgba(160,215,255,0.85)');
  rr(ctx, -38, -12, 8, 8, 2, '#2b2f38');
  ctx.fillStyle = 'rgba(120,190,255,0.6)';
  ctx.beginPath();
  ctx.ellipse(-46 - Math.sin(t * 30) * 2, -8, 8, 3, 0, 0, TAU);
  ctx.fill();
}

/** One module on its own (shipyard list icons): its base block and details, centred on (x, y). */
export function drawModuleIcon(ctx: Ctx, id: ModuleId, x: number, y: number, s: number, look: Look, t: number): void {
  if (id !== 'capsule') {
    rr(ctx, x - s * 0.55, y - s * 0.55, s * 1.1, s * 1.1, s * 0.18, look.under);
    rr(ctx, x - s * 0.46, y - s * 0.46, s * 0.92, s * 0.92, s * 0.14, look.base);
  }
  detail(ctx, id, x, y, s, look, { t, throttle: 0.6 });
}
