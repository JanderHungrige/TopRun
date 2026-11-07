import { TAU } from '../core/math';
import type { ModuleId } from '../data/ship-modules';
import { ellipse, fillPoly, fillSym } from './shapes';

// The spacecraft's modules as parts of one sleek starfighter (doc 54), each drawn around its cell's centre (0, 0),
// nose up (−y), `s` = cell size. The hitbox stays the cell; a nose, a wing tip or a plume may reach past it.

type Ctx = CanvasRenderingContext2D;

export interface Paint {
  hull: string;
  shade: string;
  dark: string;
  accent: string;
  glass: string;
  line: string;
  /** Silhouette pass (shadow, hit flash): one colour, no details. */
  solid: boolean;
  t: number;
  throttle: number;
}

type PartFn = (ctx: Ctx, s: number, p: Paint, side: -1 | 1) => void;

const sc = (pts: readonly number[], s: number): number[] => pts.map((v) => v * s);

function pane(ctx: Ctx, x: number, y: number, rx: number, ry: number, p: Paint): void {
  ellipse(ctx, x, y, rx, ry, p.glass);
  if (!p.solid) ellipse(ctx, x - rx * 0.3, y - ry * 0.35, rx * 0.35, ry * 0.3, 'rgba(255,255,255,0.65)');
}

function stripe(ctx: Ctx, pts: readonly number[], s: number, p: Paint): void {
  if (!p.solid) fillPoly(ctx, sc(pts, s), p.accent);
}

/** The cockpit pod: a lozenge pointed forward, canopy, side stripes, a short nose gun. */
const core: PartFn = (ctx, s, p) => {
  fillPoly(ctx, sc([-0.05, -0.62, 0.05, -0.62, 0.05, -0.8, -0.05, -0.8], s), p.dark);
  fillSym(ctx, sc([0, -0.66, 0.28, -0.32, 0.38, 0.18, 0.26, 0.5, 0, 0.52], s), p.hull, p.line);
  if (!p.solid) fillSym(ctx, sc([0, -0.6, 0.12, -0.3, 0.14, 0.4, 0, 0.44], s), p.shade);
  stripe(ctx, [0.27, -0.2, 0.33, -0.2, 0.36, 0.25, 0.3, 0.25], s, p);
  stripe(ctx, [-0.27, -0.2, -0.33, -0.2, -0.36, 0.25, -0.3, 0.25], s, p);
  pane(ctx, 0, -0.18 * s, 0.13 * s, 0.24 * s, p);
};

/** The front capsule: a long nose cone reaching past its cell, canopy slits, a chevron, the radar light. */
const capsule: PartFn = (ctx, s, p) => {
  fillSym(ctx, sc([0, -1.0, 0.16, -0.66, 0.32, -0.1, 0.4, 0.5, 0, 0.52], s), p.hull, p.line);
  if (p.solid) return;
  fillSym(ctx, sc([0, -0.92, 0.07, -0.66, 0.12, 0.45, 0, 0.46], s), p.shade);
  fillSym(ctx, sc([0, 0.02, 0.3, 0.26, 0.3, 0.36, 0, 0.12], s), p.accent);
  for (const dx of [-0.13, 0.13]) pane(ctx, dx * s, -0.28 * s, 0.07 * s, 0.14 * s, p);
  const blink = Math.sin(p.t * 5) > 0.2;
  ellipse(ctx, 0, -0.78 * s, 0.05 * s, 0.05 * s, blink ? '#ff5a4a' : '#5a1a14');
};

/** Armour: a bevelled, chamfered hull section with panel lines. */
const plate: PartFn = (ctx, s, p) => {
  const outer = [-0.3, -0.48, 0.3, -0.48, 0.48, -0.24, 0.48, 0.3, 0.32, 0.48, -0.32, 0.48, -0.48, 0.3, -0.48, -0.24];
  fillPoly(ctx, sc(outer, s), p.shade, p.line);
  if (p.solid) return;
  fillPoly(ctx, sc([-0.24, -0.38, 0.24, -0.38, 0.38, -0.18, 0.38, 0.24, 0.26, 0.38, -0.26, 0.38, -0.38, 0.24, -0.38, -0.18], s), p.hull);
  ctx.strokeStyle = p.line;
  ctx.lineWidth = Math.max(0.4, s * 0.02);
  ctx.beginPath();
  ctx.moveTo(-0.38 * s, 0.02 * s);
  ctx.lineTo(0.38 * s, 0.02 * s);
  ctx.moveTo(0, 0.02 * s);
  ctx.lineTo(0, 0.38 * s);
  ctx.stroke();
  stripe(ctx, [-0.24, -0.38, 0.24, -0.38, 0.3, -0.3, -0.3, -0.3], s, p);
};

/** An engine nacelle: intake in front, bell nozzle behind, a blue plume that grows with the throttle. */
const engine: PartFn = (ctx, s, p) => {
  if (!p.solid) {
    const f = p.throttle * (0.8 + Math.sin(p.t * 40) * 0.2);
    ellipse(ctx, 0, (0.75 + f * 0.25) * s, 0.2 * s, (0.2 + f * 0.35) * s, 'rgba(110,180,255,0.5)');
    ellipse(ctx, 0, (0.66 + f * 0.12) * s, 0.1 * s, (0.1 + f * 0.16) * s, 'rgba(225,245,255,0.9)');
  }
  fillPoly(ctx, sc([-0.18, 0.28, 0.18, 0.28, 0.26, 0.6, -0.26, 0.6], s), p.dark, p.line);
  ctx.beginPath();
  ctx.roundRect(-0.26 * s, -0.48 * s, 0.52 * s, 0.8 * s, 0.26 * s);
  ctx.fillStyle = p.hull;
  ctx.fill();
  ctx.strokeStyle = p.line;
  ctx.lineWidth = Math.max(0.4, s * 0.025);
  ctx.stroke();
  if (p.solid) return;
  ellipse(ctx, 0, -0.36 * s, 0.17 * s, 0.08 * s, p.dark);
  fillPoly(ctx, sc([0.08, -0.4, 0.2, -0.3, 0.2, 0.24, 0.08, 0.24], s), p.shade);
  stripe(ctx, [-0.26, 0.08, 0.26, 0.08, 0.26, 0.15, -0.26, 0.15], s, p);
};

/** A laser: a mount, a long barrel with a cooling ring and a glowing emitter tip. */
const laser: PartFn = (ctx, s, p) => {
  ctx.beginPath();
  ctx.roundRect(-0.22 * s, -0.05 * s, 0.44 * s, 0.4 * s, 0.1 * s);
  ctx.fillStyle = p.hull;
  ctx.fill();
  ctx.strokeStyle = p.line;
  ctx.lineWidth = Math.max(0.4, s * 0.025);
  ctx.stroke();
  fillPoly(ctx, sc([-0.06, 0.05, 0.06, 0.05, 0.06, -0.86, -0.06, -0.86], s), p.dark);
  fillPoly(ctx, sc([-0.11, -0.36, 0.11, -0.36, 0.11, -0.24, -0.11, -0.24], s), p.solid ? p.dark : p.shade);
  if (p.solid) return;
  fillPoly(ctx, sc([0.02, 0.0, 0.05, 0.0, 0.05, -0.82, 0.02, -0.82], s), 'rgba(255,255,255,0.25)');
  ellipse(ctx, 0, -0.88 * s, 0.07 * s, 0.07 * s, 'rgba(120,230,255,0.95)');
  stripe(ctx, [-0.22, 0.2, 0.22, 0.2, 0.22, 0.26, -0.22, 0.26], s, p);
};

/** A swept wing reaching out on its open side, three rocket pods under it. */
const rockets: PartFn = (ctx, s, p, side) => {
  const m = (pts: readonly number[]): number[] => pts.map((v, i) => (i % 2 === 0 ? v * side : v) * s);
  fillPoly(ctx, m([-0.5, -0.32, 0.64, 0.14, 0.64, 0.4, -0.5, 0.46]), p.hull, p.line);
  if (p.solid) return;
  fillPoly(ctx, m([-0.5, 0.24, 0.64, 0.32, 0.64, 0.4, -0.5, 0.46]), p.shade);
  fillPoly(ctx, m([-0.5, -0.32, 0.64, 0.14, 0.64, 0.2, -0.5, -0.22]), p.accent);
  for (const k of [-0.18, 0.12, 0.4]) {
    const y = -0.05 + (k + 0.5) * 0.35;
    ctx.beginPath();
    ctx.roundRect((k * side - 0.05) * s, (y - 0.18) * s, 0.1 * s, 0.36 * s, 0.05 * s);
    ctx.fillStyle = '#eef2f7';
    ctx.fill();
    ellipse(ctx, k * side * s, (y - 0.18) * s, 0.05 * s, 0.05 * s, '#ff6a4a');
  }
};

/** Twin torpedo tubes with orange glowing mouths. */
const torpedo: PartFn = (ctx, s, p) => {
  fillPoly(ctx, sc([-0.4, -0.1, 0.4, -0.1, 0.4, 0.4, -0.4, 0.4], s), p.shade, p.line);
  for (const dx of [-0.17, 0.17]) {
    ctx.beginPath();
    ctx.roundRect((dx - 0.12) * s, -0.6 * s, 0.24 * s, 0.94 * s, 0.1 * s);
    ctx.fillStyle = p.hull;
    ctx.fill();
    ctx.strokeStyle = p.line;
    ctx.lineWidth = Math.max(0.4, s * 0.025);
    ctx.stroke();
    if (p.solid) continue;
    ellipse(ctx, dx * s, -0.52 * s, 0.09 * s, 0.07 * s, `rgba(255,150,70,${(0.65 + Math.sin(p.t * 7 + dx * 9) * 0.3).toFixed(2)})`);
    fillPoly(ctx, sc([dx - 0.12, 0.05, dx + 0.12, 0.05, dx + 0.12, 0.12, dx - 0.12, 0.12], s), p.accent);
  }
};

/** A shield emitter: a dish with rings and a pulsing core. */
const shield: PartFn = (ctx, s, p) => {
  fillPoly(ctx, sc([-0.2, -0.46, 0.2, -0.46, 0.46, -0.2, 0.46, 0.2, 0.2, 0.46, -0.2, 0.46, -0.46, 0.2, -0.46, -0.2], s), p.shade, p.line);
  ellipse(ctx, 0, 0, 0.32 * s, 0.32 * s, p.hull);
  if (p.solid) return;
  ellipse(ctx, 0, 0, 0.22 * s, 0.22 * s, p.dark);
  const a = 0.55 + Math.sin(p.t * 5) * 0.3;
  ellipse(ctx, 0, 0, 0.13 * s, 0.13 * s, `rgba(140,220,255,${a.toFixed(2)})`);
  ctx.strokeStyle = `rgba(160,225,255,${(a * 0.8).toFixed(2)})`;
  ctx.lineWidth = Math.max(0.5, s * 0.04);
  ctx.beginPath();
  ctx.arc(0, 0, 0.27 * s, p.t * 1.5, p.t * 1.5 + 1.6);
  ctx.moveTo(Math.cos(p.t * 1.5 + Math.PI) * 0.27 * s, Math.sin(p.t * 1.5 + Math.PI) * 0.27 * s);
  ctx.arc(0, 0, 0.27 * s, p.t * 1.5 + Math.PI, p.t * 1.5 + Math.PI + 1.6);
  ctx.stroke();
};

/** Point defence: a domed turret with twin barrels that slowly sweeps. */
const pointdef: PartFn = (ctx, s, p) => {
  ellipse(ctx, 0, 0, 0.36 * s, 0.36 * s, p.shade);
  ctx.save();
  ctx.rotate(Math.sin(p.t * 1.7) * 0.7);
  for (const dx of [-0.07, 0.07]) fillPoly(ctx, sc([dx - 0.035, 0, dx + 0.035, 0, dx + 0.035, -0.55, dx - 0.035, -0.55], s), p.dark);
  ellipse(ctx, 0, 0, 0.22 * s, 0.22 * s, p.hull);
  if (!p.solid) ellipse(ctx, -0.06 * s, -0.07 * s, 0.08 * s, 0.07 * s, 'rgba(255,255,255,0.5)');
  ctx.restore();
};

/** The reactor: a torus with cooling fins round a glowing core. */
const reactor: PartFn = (ctx, s, p) => {
  for (let k = 0; k < 4; k++) {
    ctx.save();
    ctx.rotate(TAU / 8 + (k * TAU) / 4);
    fillPoly(ctx, sc([-0.07, -0.5, 0.07, -0.5, 0.07, -0.28, -0.07, -0.28], s), p.dark);
    ctx.restore();
  }
  ellipse(ctx, 0, 0, 0.38 * s, 0.38 * s, p.hull);
  if (p.solid) return;
  ellipse(ctx, 0, 0, 0.26 * s, 0.26 * s, p.dark);
  const g = 0.7 + Math.sin(p.t * 6) * 0.25;
  ellipse(ctx, 0, 0, 0.18 * s, 0.18 * s, `rgba(255,190,90,${g.toFixed(2)})`);
  ellipse(ctx, 0, 0, 0.08 * s, 0.08 * s, '#fff3d6');
};

export const PARTS: Readonly<Record<ModuleId, PartFn>> = { core, capsule, plate, engine, laser, rockets, torpedo, shield, pointdef, reactor };

/** Drawing order, back to front: wings and engines under the hull, the cockpit pods on top. */
export const LAYER: Readonly<Record<ModuleId, number>> = {
  rockets: 0, engine: 1, plate: 2, reactor: 2, shield: 2, pointdef: 3, torpedo: 3, laser: 3, capsule: 4, core: 5,
};
