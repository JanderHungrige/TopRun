import { TAU } from '../core/math';
import { CELL_PX, GRID, type ModuleId } from '../data/ship-modules';
import { allModules, moduleLinks, wingSide, type Placed } from '../game/ship';
import type { Look } from './livery-art';
import { ellipse, fillPoly } from './shapes';
import { LAYER, PARTS, type Paint } from './ship-parts';

// The spacecraft drawn from its modules as one sleek starfighter (doc 54): hull fairings join side-by-side modules, each
// module is a part (ship-parts.ts), nose up (−y), the core's cell centred on the origin. Used in the mission
// (CELL_PX per cell), the shipyard (bigger cells) and as the "starship" in plane lists.

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

const ACCENT = '#3f74ff';
const DARK = '#2b3140';
const GLASS = '#7fd0ff';

const cx = (m: Placed, s: number): number => (m.col - GRID.core.col) * s;
const cy = (m: Placed, s: number): number => (m.row - GRID.core.row) * s;

function paint(look: Look, d: ShipDraw): Paint {
  const solid = d.solid ?? null;
  return {
    hull: solid ?? look.base, shade: solid ?? look.under, dark: solid ?? DARK, accent: solid ?? look.trim ?? ACCENT, // trim: a paint job's (doc 100)
    glass: solid ?? GLASS, line: solid ?? look.ink, solid: solid !== null, t: d.t ?? 0, throttle: d.throttle ?? 0.6,
  };
}

/** A hull fairing joining two side-by-side modules: a wide band of hull with a seam down its middle. */
function fairing(ctx: Ctx, a: Placed, b: Placed, s: number, p: Paint): void {
  const w = s * 0.27;
  const horizontal = a.row === b.row;
  const x0 = Math.min(cx(a, s), cx(b, s));
  const y0 = Math.min(cy(a, s), cy(b, s));
  const band = horizontal ? [x0, y0 - w, x0 + s, y0 - w, x0 + s, y0 + w, x0, y0 + w] : [x0 - w, y0, x0 + w, y0, x0 + w, y0 + s, x0 - w, y0 + s];
  fillPoly(ctx, band, p.shade, p.line);
  if (p.solid) return;
  const ridge = horizontal ? [x0, y0 - w, x0 + s, y0 - w, x0 + s, y0 - w * 0.45, x0, y0 - w * 0.45] : [x0 - w, y0, x0 - w * 0.45, y0, x0 - w * 0.45, y0 + s, x0 - w, y0 + s];
  fillPoly(ctx, ridge, 'rgba(255,255,255,0.22)');
  ctx.strokeStyle = p.line;
  ctx.beginPath();
  if (horizontal) {
    ctx.moveTo(x0, y0 + w * 0.2);
    ctx.lineTo(x0 + s, y0 + w * 0.2);
  } else {
    ctx.moveTo(x0 + w * 0.2, y0);
    ctx.lineTo(x0 + w * 0.2, y0 + s);
  }
  ctx.stroke();
}

/** The whole ship: the fairings first, then every module's part back to front. */
export function drawShip(ctx: Ctx, modules: readonly Placed[], look: Look, d: ShipDraw = {}): void {
  const s = d.cell ?? CELL_PX;
  const list = allModules({ modules: [...modules] });
  const p = paint(look, d);
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineWidth = Math.max(0.4, s * 0.025);
  for (const [a, b] of moduleLinks(list)) fairing(ctx, a, b, s, p);
  for (const m of [...list].sort((a, b) => LAYER[a.id] - LAYER[b.id])) {
    ctx.save();
    ctx.translate(cx(m, s), cy(m, s));
    PARTS[m.id](ctx, s, p, m.id === 'rockets' ? wingSide(m, list) : 1);
    ctx.restore();
  }
  ctx.restore();
}

/** The ship's outline as one path: every occupied cell (its hitbox). */
export function shipSilhouette(modules: readonly Placed[], cell = CELL_PX): Path2D {
  const path = new Path2D();
  for (const m of allModules({ modules: [...modules] })) path.rect(cx(m, cell) - cell * 0.5, cy(m, cell) - cell * 0.5, cell, cell);
  return path;
}

/** A side view for launch and lists: a sleek hull, canopy, swept wing, engine plume (nose to the right). */
export function drawShipSide(ctx: Ctx, look: Look, t: number): void {
  const f = 0.8 + Math.sin(t * 30) * 0.2;
  ellipse(ctx, -50 - f * 4, -7, 10 + f * 6, 3.5, 'rgba(110,180,255,0.55)');
  ellipse(ctx, -46, -7, 5, 2, 'rgba(230,245,255,0.9)');
  fillPoly(ctx, [-36, -3, -16, -3, -4, 6, -22, 6], DARK);
  fillPoly(ctx, [48, -7, 30, -15, 6, -19, -30, -17, -40, -12, -40, -2, -30, 0, 26, 0], look.base, look.ink);
  fillPoly(ctx, [44, -5, 26, 0, -30, 0, -40, -2, -40, -5, 26, -4], look.under);
  fillPoly(ctx, [-24, -17, -6, -19, -34, -30, -40, -30], look.base, look.ink);
  fillPoly(ctx, [-2, -10, 30, -10, 34, -8, -2, -8], ACCENT);
  ctx.beginPath();
  ctx.ellipse(16, -16, 11, 4.5, -0.12, Math.PI, TAU);
  ctx.fillStyle = GLASS;
  ctx.fill();
  ellipse(ctx, 13, -18, 4, 1.4, 'rgba(255,255,255,0.7)');
  fillPoly(ctx, [-44, -13, -38, -13, -38, -3, -44, -3], DARK);
}

/** One module on its own (shipyard list icons), centred on (x, y). */
export function drawModuleIcon(ctx: Ctx, id: ModuleId, x: number, y: number, s: number, look: Look, t: number): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.lineJoin = 'round';
  ctx.lineWidth = Math.max(0.4, s * 0.025);
  PARTS[id](ctx, s, paint(look, { t, throttle: 0.6 }), 1);
  ctx.restore();
}
