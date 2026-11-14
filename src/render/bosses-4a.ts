import { TAU } from '../core/math';
import { cachedHull, liveOf, roundPts, turn, type HullFn } from './bosses-4';
import { shade } from './detail/color';
import { bolts, cable, edges, glow, grille, path } from './detail/parts';
import { smoke } from './enemies/fx';
import { dish } from './enemies/space-gear';
import { drop, lamp, plating, rgbOf, seams } from './enemies/space-kit';
import { grain } from './enemies/space-surface';
import type { ShipPal } from './enemies/space-pal';

// HALO — a ring battle station: the torus of 24 plated segments with lit habitat windows, four trussed spokes with
// their pipes, four docking pods on the ring and the armoured hub round the reactor; lights run round the ring and the
// core pulses. QUARRY — a hollowed asteroid: a faceted rock with craters, ore seams glowing in its cracks, four dug-in
// gun pits with armoured collars, pipes, a dish and the mining drill at its front, the core shaft glowing, smoke
// rising (docs 56, 119).

type Ctx = CanvasRenderingContext2D;

/** The torus: the tube rounded across, lit from the upper left, segment seams and habitat windows. */
function haloRing(g: Ctx, a: ShipPal): void {
  const ring = new Path2D();
  ring.arc(0, 0, 116, 0, TAU);
  ring.arc(0, 0, 94, TAU, 0, true);
  g.fillStyle = a.hull;
  g.fill(ring);
  const across = g.createRadialGradient(0, 0, 94, 0, 0, 116);
  across.addColorStop(0, 'rgba(0,0,0,0.42)');
  across.addColorStop(0.4, 'rgba(255,255,255,0.2)');
  across.addColorStop(0.62, 'rgba(255,255,255,0.06)');
  across.addColorStop(1, 'rgba(0,0,0,0.45)');
  const light = g.createLinearGradient(-116, -116, 116, 116);
  light.addColorStop(0, 'rgba(255,255,255,0.22)');
  light.addColorStop(0.5, 'rgba(255,255,255,0)');
  light.addColorStop(1, 'rgba(0,0,0,0.34)');
  for (const f of [across, light]) {
    g.fillStyle = f;
    g.fill(ring);
  }
  const list: number[] = [];
  for (let k = 0; k < 24; k++) {
    const b = (k / 24) * TAU;
    list.push(Math.cos(b) * 95, Math.sin(b) * 95, Math.cos(b) * 115, Math.sin(b) * 115);
    for (const d of [0.07, 0.13, 0.19]) {
      g.fillStyle = (k + Math.round(d * 100)) % 3 ? '#ffe6a0' : 'rgba(20,24,30,0.9)';
      g.fillRect(Math.cos(b + d) * 105 - 0.9, Math.sin(b + d) * 105 - 0.9, 1.8, 1.8);
    }
  }
  seams(g, list, 0.8);
  g.strokeStyle = a.ink;
  g.lineWidth = 1.4;
  g.stroke(ring);
}

/** A trussed spoke at angle `b` from the hub to the ring: two rails, the braces between them and a pipe. */
function spoke(g: Ctx, a: ShipPal, b: number): void {
  cable(g, turn([40, 0, 96, 0], b), 2.2, '#2c3038');
  const braces: number[] = [];
  for (let k = 0; k <= 7; k++) braces.push(44 + k * 7, k % 2 ? -4.6 : 4.6);
  g.strokeStyle = shade(a.metal, 0.15);
  g.lineWidth = 1.1;
  g.stroke(path(turn(braces, b), false));
  for (const off of [-4.6, 4.6]) plating(g, turn([40, off - 1.5, 96, off - 1.5, 96, off + 1.5, 40, off + 1.5], b), a.metal, a, 0.5);
}

/** A round armoured module (a pod, a tower): domed, its armour segments and bolts round where a gun sits. */
export function podDisc(g: Ctx, a: ShipPal, x: number, y: number, r: number): void {
  g.fillStyle = a.ink;
  g.beginPath();
  g.arc(x, y, r + 0.8, 0, TAU);
  g.fill();
  const d = g.createRadialGradient(x - r * 0.35, y - r * 0.35, 2, x, y, r);
  d.addColorStop(0, shade(a.light, 0.25));
  d.addColorStop(0.55, a.hull);
  d.addColorStop(1, shade(a.hull, -0.45));
  g.fillStyle = d;
  g.beginPath();
  g.arc(x, y, r, 0, TAU);
  g.fill();
  const list: number[] = [];
  const pts: number[] = [];
  for (let k = 0; k < 10; k++) {
    const c = (k / 10) * TAU;
    list.push(x + Math.cos(c) * r * 0.73, y + Math.sin(c) * r * 0.73, x + Math.cos(c) * r * 0.98, y + Math.sin(c) * r * 0.98);
    pts.push(x + Math.cos(c + 0.31) * r * 0.87, y + Math.sin(c + 0.31) * r * 0.87);
  }
  seams(g, list, 0.7);
  bolts(g, pts, 0.9);
}

/** A docking pod on the ring: its clamps and the module. */
function haloPod(g: Ctx, a: ShipPal, x: number, y: number): void {
  const b = Math.atan2(y, x) + Math.PI / 2;
  for (const s of [-1, 1]) plating(g, turn([s * 24, -10, s * 34, -10, s * 34, 10, s * 24, 10], b).map((v, i) => v + (i % 2 ? y : x)), a.dark, a, 0.6);
  podDisc(g, a, x, y, 26);
}

/** The hub: armour segments round the reactor, radiator vanes, docking arms and the dark well of the core. */
function haloHub(g: Ctx, a: ShipPal): void {
  for (let k = 0; k < 12; k++) {
    const b0 = (k / 12) * TAU + 0.03, b1 = b0 + TAU / 12 - 0.06;
    const pts = [...roundArc(44, b0, b1), ...roundArc(32, b1, b0)];
    plating(g, pts, k % 2 ? a.hull : shade(a.hull, 0.12), a, 0.7);
  }
  drop(g, roundPts(0, 0, 32), 2, path(roundPts(0, 0, 44)));
  g.fillStyle = a.ink;
  g.beginPath();
  g.arc(0, 0, 32.6, 0, TAU);
  g.fill();
  const d = g.createRadialGradient(-10, -10, 2, 0, 0, 32);
  d.addColorStop(0, shade(a.light, 0.3));
  d.addColorStop(1, shade(a.hull, -0.2));
  g.fillStyle = d;
  g.beginPath();
  g.arc(0, 0, 32, 0, TAU);
  g.fill();
  for (const s of [-1, 1]) plating(g, [s * 18, -5, s * 31, -5, s * 31, 5, s * 18, 5], a.dark, a, 0.6); // docking arms
  const vanes: number[] = [];
  for (let k = 0; k < 8; k++) {
    const b = (k / 8) * TAU + TAU / 16;
    vanes.push(Math.cos(b) * 21, Math.sin(b) * 21, Math.cos(b) * 30, Math.sin(b) * 30);
  }
  seams(g, vanes, 1.1);
  g.fillStyle = '#141820';
  g.beginPath();
  g.arc(0, 0, 19, 0, TAU);
  g.fill();
  edges(g, roundPts(0, 0, 19, 16), 1.2, 'rgba(0,0,0,0.5)', 'rgba(255,255,255,0.35)');
}

const roundArc = (r: number, b0: number, b1: number): number[] =>
  Array.from({ length: 5 }, (_, i) => b0 + ((b1 - b0) * i) / 4).flatMap((b) => [Math.cos(b) * r, Math.sin(b) * r]);

function haloHull(g: Ctx, a: ShipPal): void {
  for (let k = 0; k < 4; k++) spoke(g, a, (k * TAU) / 4 + Math.PI / 4);
  haloRing(g, a);
  for (const [x, y] of [[0, 105], [0, -105], [-105, 0], [105, 0]] as const) haloPod(g, a, x, y);
  haloHub(g, a);
}

export const halo: HullFn = (ctx, p, s) => {
  const q = liveOf('halo', p);
  cachedHull(ctx, 'halo', p, haloHull);
  if (q.mono) return;
  for (let k = 0; k < 12; k++) { // lights running round the ring, dimmed over the pods
    const b = (k * TAU) / 12 + s.t * 0.25;
    const m = ((b % (TAU / 4)) + TAU / 4) % (TAU / 4);
    if (m < 0.2 || m > TAU / 4 - 0.2) continue;
    lamp(ctx, q, Math.cos(b) * 105, Math.sin(b) * 105, 2, k % 3 === 0 ? rgbOf(q.trim) : '220,236,255', 0.55 + 0.45 * Math.sin(s.t * 4 + k));
  }
  const pulse = Math.sin(s.t * 3);
  glow(ctx, 0, 0, 34, rgbOf(q.glass), 0.55 + pulse * 0.2);
  ctx.fillStyle = q.glass;
  ctx.beginPath();
  ctx.arc(0, 0, 14 + pulse * 2, 0, TAU);
  ctx.fill();
  glow(ctx, 0, 0, 10, '255,255,255', 0.95);
};

const ROCK = [0, -112, 52, -100, 98, -62, 112, -4, 96, 52, 70, 86, 28, 118, -30, 116, -74, 90, -104, 40, -110, -18, -84, -74, -40, -106];
const CRACKS = [[-52, -8, -12, 12, 30, -4, 62, 22], [-24, -64, -6, -44, 16, -46, 40, -24], [-86, 30, -58, 26, -40, 52]];
const CRATERS = [-30, -22, 14, 34, 8, 10, -8, 42, 8, 22, -54, 7, -64, 0, 6, 82, 8, 7, -36, 86, 5, -46, -84, 6, 30, 98, 5];

/** The rock in facets: an outer ring and an inner fan, each shaded by the way it faces the light. */
function rockFacets(g: Ctx, a: ShipPal): void {
  const n = ROCK.length / 2;
  const cx = -12, cy = -16;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const [x0, y0, x1, y1] = [ROCK[i * 2] ?? 0, ROCK[i * 2 + 1] ?? 0, ROCK[j * 2] ?? 0, ROCK[j * 2 + 1] ?? 0];
    const ix0 = cx + (x0 - cx) * 0.6, iy0 = cy + (y0 - cy) * 0.6, ix1 = cx + (x1 - cx) * 0.6, iy1 = cy + (y1 - cy) * 0.6;
    const mx = (x0 + x1) / 2 - cx, my = (y0 + y1) / 2 - cy, m = Math.hypot(mx, my) || 1;
    const lit = -(mx + my) / m / Math.SQRT2;
    const jitter = (((i * 7) % 5) - 2) * 0.03;
    g.fillStyle = shade(a.hull, lit * 0.26 + jitter);
    g.fill(path([x0, y0, x1, y1, ix1, iy1, ix0, iy0]));
    g.fillStyle = shade(a.hull, lit * 0.1 - jitter + 0.04);
    g.fill(path([cx, cy, ix0, iy0, ix1, iy1]));
  }
  g.strokeStyle = 'rgba(0,0,0,0.22)';
  g.lineWidth = 0.8;
  for (let i = 0; i < n; i++) g.stroke(path([cx + ((ROCK[i * 2] ?? 0) - cx) * 0.6, cy + ((ROCK[i * 2 + 1] ?? 0) - cy) * 0.6, ROCK[i * 2] ?? 0, ROCK[i * 2 + 1] ?? 0], false));
  edges(g, ROCK, 2.2, 'rgba(255,240,220,0.35)', 'rgba(0,0,0,0.45)');
  g.strokeStyle = a.ink;
  g.lineWidth = 1.6;
  g.stroke(path(ROCK));
}

/** The part of the circle (x, y, r) outside the circle shifted by (d, d) with radius r2: a crescent of shade or light. */
export function crescent(g: Ctx, x: number, y: number, r: number, d: number, r2: number, fill: string): void {
  g.save();
  g.beginPath();
  g.arc(x, y, r, 0, TAU);
  g.clip();
  g.beginPath();
  g.arc(x, y, r, 0, TAU);
  g.arc(x + d, y + d, r2, 0, TAU);
  g.fillStyle = fill;
  g.fill('evenodd');
  g.restore();
}

/** A crater: the dark bowl, its upper-left wall in shade, the lower-right wall and the outer rim lit. */
export function craterPit(g: Ctx, x: number, y: number, r: number, base: string): void {
  g.fillStyle = shade(base, -0.3);
  g.beginPath();
  g.arc(x, y, r, 0, TAU);
  g.fill();
  crescent(g, x, y, r, r * 0.3, r * 0.85, 'rgba(0,0,0,0.35)');
  g.lineWidth = Math.max(0.8, r * 0.16);
  g.strokeStyle = 'rgba(255,236,210,0.32)';
  g.beginPath();
  g.arc(x, y, r * 0.9, -0.2, Math.PI * 0.7);
  g.stroke();
  g.beginPath();
  g.arc(x, y, r * 1.08, Math.PI * 0.95, Math.PI * 1.65);
  g.stroke();
}

function quarryWorks(g: Ctx, a: ShipPal): void {
  for (const [x, y] of [[-70, -40], [70, -40], [-60, 50], [60, 50]] as const) cable(g, [0, 0, x * 0.5, y * 0.7, x, y], 3, '#2a2420');
  for (const c of CRACKS) {
    g.strokeStyle = '#1a120c';
    g.lineWidth = 3.2;
    g.stroke(path(c, false));
  }
  for (const [x, y] of [[-70, -40], [70, -40], [-60, 50], [60, 50]] as const) { // dug-in gun pits
    craterPit(g, x, y, 25, a.hull);
    g.strokeStyle = a.metal;
    g.lineWidth = 3;
    g.beginPath();
    g.arc(x, y, 21, 0, TAU);
    g.stroke();
    bolts(g, roundPts(x, y, 21, 12), 0.9);
  }
  plating(g, [-22, 62, 22, 62, 26, 82, -26, 82], a.metal, a, 0.9); // the drill's housing
  grille(g, -16, 66, 32, 8, 6, 'y');
  const cone = [0, 126, 16, 104, 24, 82, -24, 82, -16, 104];
  plating(g, cone, shade(a.metal, 0.1), a, 0.9);
  seams(g, [-22, 88, 22, 96, -19, 98, 19, 106, -14, 108, 14, 114, -8, 117, 8, 121], 0.9);
  dish(g, 44, -78, 9, a);
  g.fillStyle = '#20242a';
  g.beginPath();
  g.arc(0, 0, 20, 0, TAU);
  g.fill();
  g.strokeStyle = a.metal;
  g.lineWidth = 3.4;
  g.beginPath();
  g.arc(0, 0, 21.6, 0, TAU);
  g.stroke();
  bolts(g, roundPts(0, 0, 21.6, 12), 0.9);
}

function quarryHull(g: Ctx, a: ShipPal): void {
  rockFacets(g, a);
  grain(g, path(ROCK), [-112, -112, 112, 120], 640, 3, 1.5);
  for (let i = 0; i < CRATERS.length; i += 3) craterPit(g, CRATERS[i] ?? 0, CRATERS[i + 1] ?? 0, CRATERS[i + 2] ?? 0, a.hull);
  quarryWorks(g, a);
}

export const quarry: HullFn = (ctx, p, s) => {
  const q = liveOf('quarry', p);
  cachedHull(ctx, 'quarry', p, quarryHull);
  if (q.mono) return;
  const hot = 0.55 + Math.sin(s.t * 2) * 0.2;
  for (const [w, k] of [[6, 0.25], [2, 1]] as const) {
    ctx.strokeStyle = `rgba(255,170,90,${(hot * k).toFixed(2)})`;
    ctx.lineWidth = w;
    for (const c of CRACKS) ctx.stroke(path(c, false));
  }
  glow(ctx, 0, 0, 26, rgbOf(q.glass), 0.6);
  ctx.fillStyle = q.glass;
  ctx.beginPath();
  ctx.arc(0, 0, 9 + Math.sin(s.t * 3), 0, TAU);
  ctx.fill();
  lamp(ctx, q, 44, -88, 1.6, '255,157,74', Math.sin(s.t * 3) > 0.3 ? 1 : 0);
  if (p.live) smoke(ctx, -42, 72, 4, s.t, 2);
};
