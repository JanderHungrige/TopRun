import { TAU } from '../../core/math';
import type { PodLight, Vec3 } from '../../game/minigames/refuel';
import { project, v3, type Cam, type Pt } from './refuel-view';

// The tanker (doc 15): an original four-engine design in plain grey, no markings, drawn in true perspective
// from behind / below: swept low wing with four podded engines, tailplane, fin, tapered fuselage and the
// hose drum pod under the tail with its three signal lights. Tanker frame: the free basket trails at (0,0,0).

/** Where the hose leaves the pod. */
export const HOSE_EXIT: Vec3 = Object.freeze(v3(0, 4.55, 21.2));

const BODY = [
  [20.8, 6.0, 0.35], [23.5, 6.25, 1.2], [27, 6.45, 2.0], [31, 6.6, 2.6], [36, 6.6, 2.8], [70, 6.6, 2.8],
] as const;
const WING = { rootX: 2.4, rootY: 4.8, rootLE: 46, rootTE: 38.5, tipX: 21.5, tipY: 6.9, tipLE: 55, tipTE: 52 };
const ENGINES = [7.6, 14.2] as const;
const LIGHT_COLORS: Readonly<Record<Exclude<PodLight, 'off'>, [string, string]>> = {
  red: ['#ff3b30', '#4a1512'],
  amber: ['#ffb020', '#4a3510'],
  green: ['#3dff6e', '#123f20'],
};

/** Convex hull (monotone chain) of projected points. */
function hull(pts: Pt[]): Pt[] {
  const p = [...pts].sort((a, b) => a.x - b.x || a.y - b.y);
  const cross = (o: Pt, a: Pt, b: Pt): number => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  const half = (list: Pt[]): Pt[] => {
    const out: Pt[] = [];
    for (const q of list) {
      while (out.length >= 2 && cross(out[out.length - 2] as Pt, out[out.length - 1] as Pt, q) <= 0) out.pop();
      out.push(q);
    }
    out.pop();
    return out;
  };
  return [...half(p), ...half([...p].reverse())];
}

function path(ctx: CanvasRenderingContext2D, pts: readonly Pt[]): void {
  ctx.beginPath();
  pts.forEach((q, i) => (i === 0 ? ctx.moveTo(q.x, q.y) : ctx.lineTo(q.x, q.y)));
  ctx.closePath();
}

function fill3(ctx: CanvasRenderingContext2D, cam: Cam, pts: readonly Vec3[], fill: string | CanvasGradient): void {
  path(ctx, pts.map((q) => project(cam, q)));
  ctx.fillStyle = fill;
  ctx.fill();
}

/** Points around a circle across the flight path. */
const ring = (cam: Cam, x: number, y: number, z: number, r: number, n = 14): Pt[] =>
  Array.from({ length: n }, (_, i) => project(cam, v3(x + Math.cos((i / n) * TAU) * r, y + Math.sin((i / n) * TAU) * r, z)));

/** Fills the hull of the points, lit from above and darker towards its left / right edges (round bodies). */
function shaded(ctx: CanvasRenderingContext2D, pts: Pt[], top: string, bottom: string): void {
  const ys = pts.map((q) => q.y);
  const xs = pts.map((q) => q.x);
  const g = ctx.createLinearGradient(0, Math.min(...ys), 0, Math.max(...ys));
  g.addColorStop(0, top);
  g.addColorStop(1, bottom);
  path(ctx, hull(pts));
  ctx.fillStyle = g;
  ctx.fill();
  const side = ctx.createLinearGradient(Math.min(...xs), 0, Math.max(...xs), 0);
  side.addColorStop(0, 'rgba(20,26,32,0.32)');
  side.addColorStop(0.3, 'rgba(20,26,32,0)');
  side.addColorStop(0.7, 'rgba(20,26,32,0)');
  side.addColorStop(1, 'rgba(20,26,32,0.32)');
  ctx.fillStyle = side;
  ctx.fill();
}

const span = (x: number): number => (x - WING.rootX) / (WING.tipX - WING.rootX);
const wingY = (x: number): number => WING.rootY + (WING.tipY - WING.rootY) * span(x);
const wingLE = (x: number): number => WING.rootLE + (WING.tipLE - WING.rootLE) * span(x);
const wingTE = (x: number): number => WING.rootTE + (WING.tipTE - WING.rootTE) * span(x);
/** A point on the wing's underside at span x, `c` of the chord forward of the trailing edge. */
const onWing = (s: number, x: number, c: number): Vec3 => v3(s * x, wingY(x) - 0.02, wingTE(x) + c * (wingLE(x) - wingTE(x)));

function line(ctx: CanvasRenderingContext2D, a: Pt, b: Pt, color: string, width: number): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.stroke();
}

function drawWings(ctx: CanvasRenderingContext2D, cam: Cam): void {
  const w = WING;
  for (const s of [-1, 1]) {
    fill3(ctx, cam, [onWing(s, w.rootX, 0), onWing(s, w.rootX, 1), onWing(s, w.tipX, 1), onWing(s, w.tipX, 0)], '#7c858e');
    // flap hinge line and the sunlit trailing edge
    line(ctx, project(cam, onWing(s, w.rootX, 0.28)), project(cam, onWing(s, w.tipX * 0.68, 0.28)), 'rgba(40,46,53,0.5)', 1);
    const root = project(cam, onWing(s, w.rootX, 0));
    line(ctx, root, project(cam, onWing(s, w.tipX, 0)), '#b3bbc3', Math.max(1, root.s * 0.12));
  }
}

function drawEngine(ctx: CanvasRenderingContext2D, cam: Cam, x: number): void {
  const wy = wingY(Math.abs(x));
  const yc = wy - 1.35;
  const front = wingLE(Math.abs(x)) + 3;
  const rear = front - 6.5;
  fill3(ctx, cam, [v3(x - 0.15, yc + 0.8, rear + 1.5), v3(x - 0.15, wy, rear + 2.5), v3(x + 0.15, wy, rear + 2.5), v3(x + 0.15, yc + 0.8, rear + 1.5)], '#6f777f');
  shaded(ctx, [...ring(cam, x, yc, front, 1.05), ...ring(cam, x, yc, rear, 0.8)], '#a9b1b9', '#666e77');
  const c = project(cam, v3(x, yc, rear));
  const disc = (r: number, fill: string): void => {
    ctx.beginPath();
    ctx.arc(c.x, c.y, r * c.s, 0, TAU);
    ctx.fillStyle = fill;
    ctx.fill();
  };
  disc(0.74, '#3a4047');
  disc(0.5, '#25292e');
  disc(0.22, '#4b5056');
}

function drawTail(ctx: CanvasRenderingContext2D, cam: Cam): void {
  for (const s of [-1, 1]) {
    fill3(ctx, cam, [v3(s * 1, 7.3, 24.8), v3(s * 1, 7.3, 29.5), v3(s * 8.8, 8.3, 25.5), v3(s * 8.8, 8.3, 23.2)], '#87909a');
  }
  fill3(ctx, cam, [v3(-0.28, 7.8, 23.8), v3(-0.12, 15.5, 21.8), v3(0.12, 15.5, 21.8), v3(0.28, 7.8, 23.8)], '#959da6');
}

function drawBody(ctx: CanvasRenderingContext2D, cam: Cam): void {
  const pts = BODY.flatMap(([z, y, r]) => ring(cam, 0, y, z, r, 18));
  shaded(ctx, pts, '#c4cad0', '#68717a');
  const tail = project(cam, v3(0, 6.0, 20.8));
  ctx.beginPath();
  ctx.arc(tail.x, tail.y, 0.22 * tail.s, 0, TAU);
  ctx.fillStyle = '#2e3338';
  ctx.fill();
}

function drawLight(ctx: CanvasRenderingContext2D, p: Pt, kind: Exclude<PodLight, 'off'>, lit: boolean): void {
  const [on, off] = LIGHT_COLORS[kind];
  const r = Math.max(2.2, 0.11 * p.s);
  ctx.beginPath();
  ctx.arc(p.x, p.y, r, 0, TAU);
  ctx.fillStyle = lit ? on : off;
  ctx.fill();
  if (!lit) return;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 7);
  g.addColorStop(0, on);
  g.addColorStop(0.25, `${on}88`);
  g.addColorStop(1, `${on}00`);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(p.x, p.y, r * 7, 0, TAU);
  ctx.fill();
  ctx.restore();
}

/** Hose drum pod under the tail: housing, hose tunnel and the red / amber / green lights. */
function drawPod(ctx: CanvasRenderingContext2D, cam: Cam, light: PodLight, t: number): void {
  const box = [21.2, 25.5].flatMap((z) => [v3(-0.75, 4.25, z), v3(0.75, 4.25, z), v3(0.75, 5.5, z), v3(-0.75, 5.5, z)]);
  shaded(ctx, box.map((q) => project(cam, q)), '#9aa2aa', '#5b636c');
  fill3(ctx, cam, [v3(-0.72, 4.28, 21.2), v3(0.72, 4.28, 21.2), v3(0.72, 5.4, 21.2), v3(-0.72, 5.4, 21.2)], '#4c535b');
  const exit = project(cam, HOSE_EXIT);
  ctx.beginPath();
  ctx.ellipse(exit.x, exit.y, 0.3 * exit.s, 0.22 * exit.s, 0, 0, TAU);
  ctx.fillStyle = '#16191c';
  ctx.fill();
  const flash = Math.sin(t * 12) > -0.2;
  const kinds = ['red', 'amber', 'green'] as const;
  kinds.forEach((k, i) => drawLight(ctx, project(cam, v3((i - 1) * 0.45, 5.05, 21.15)), k, light === k && (k !== 'red' || flash)));
}

/** The whole tanker, far parts first. */
export function drawTanker(ctx: CanvasRenderingContext2D, cam: Cam, light: PodLight, t: number): void {
  drawWings(ctx, cam);
  for (const x of ENGINES) {
    drawEngine(ctx, cam, -x);
    drawEngine(ctx, cam, x);
  }
  drawTail(ctx, cam);
  drawBody(ctx, cam);
  drawPod(ctx, cam, light, t);
}
