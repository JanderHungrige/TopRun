import { TAU } from '../core/math';
import { cachedHull, liveOf, roundPts, type HullFn, type Map4Boss } from './bosses-4';
import { craterPit, crescent, halo, podDisc, quarry } from './bosses-4a';
import { ark } from './bosses-4c';
import { mix, shade } from './detail/color';
import { antenna, bolts, cable, DARK, edges, glow, grille, hatch, LIGHT, path, plate, sym } from './detail/parts';
import { fire } from './enemies/fx';
import { cells, dish, solar, windows } from './enemies/space-gear';
import { bell, drop, flipX, keel, lamp, plating, plume, rgbOf, seams, tints } from './enemies/space-kit';
import { grain, scatter } from './enemies/space-surface';
import type { ShipPal } from './enemies/space-pal';

// CRATER — the lunar citadel in its crater: the regolith floor with the crater wall in shade and in light, small craters,
// the fortress's armoured walls round a recessed yard of floor plates, four round bastions, the missile silo with its
// blast doors and hazard stripes, the geodesic dome over the reactor, a landing pad, solar arrays, pipes and dishes;
// the core pulses, lights run along the front wall, a fire burns. TRIDENT — a three-hulled dreadnought: the central hull
// with its raised spine, bridge tower, hangar doors and red keel stripe, two shorter hulls, trusses joining them, every
// hull's engines glowing and its running lights blinking (docs 56, 58, 119).

type Ctx = CanvasRenderingContext2D;

const WALL = [-110, -58, -92, -76, 92, -76, 110, -58, 110, 58, 92, 76, -92, 76, -110, 58];
const YARD = WALL.map((v) => v * 0.9);

function craterGround(g: Ctx, a: ShipPal): void {
  const floor = shade(a.dark, -0.12);
  g.fillStyle = floor;
  g.beginPath();
  g.arc(0, 0, 150, 0, TAU);
  g.fill();
  crescent(g, 0, 0, 146, 16, 136, 'rgba(0,0,0,0.34)'); // the crater's inner wall in shade at the upper left
  crescent(g, 0, 0, 146, -10, 140, 'rgba(255,255,255,0.1)'); // and lit at the lower right
  grain(g, path(roundPts(0, 0, 150, 48)), [-150, -150, 150, 150], 520, 7, 1.6);
  const rim = g.createLinearGradient(-150, -150, 150, 150);
  rim.addColorStop(0, shade(a.light, 0.15));
  rim.addColorStop(1, shade(a.dark, -0.35));
  g.strokeStyle = rim;
  g.lineWidth = 6;
  g.beginPath();
  g.arc(0, 0, 147, 0, TAU);
  g.stroke();
  for (const [x, y, r] of [[-112, 84, 9], [98, -98, 7], [-58, 122, 7], [128, 44, 6], [-134, -36, 6], [42, 128, 6], [-82, -110, 7], [108, 88, 5]] as const) {
    craterPit(g, x, y, r, floor);
  }
}

/** The fortress's armoured walls round a recessed yard of floor plates. */
function citadelWalls(g: Ctx, a: ShipPal): void {
  drop(g, WALL, 6, path(roundPts(0, 0, 146, 48)));
  plating(g, WALL, a.dark, a, 1.4);
  const yard = path(YARD);
  g.fillStyle = shade(a.dark, -0.18);
  g.fill(yard);
  edges(g, YARD, 1.6, DARK, LIGHT); // a recess: its upper-left lip in shade
  const plates: number[] = [];
  for (let x = -96; x < 96; x += 24) for (let y = -66; y < 66; y += 22) plates.push(x, y, 24, 22, ((((x + y) / 2) % 3) - 1) * 0.04);
  tints(g, yard, plates);
  scatter(g, yard, [-100, -70, 100, 70], 34, 31, a, 1.6);
  g.strokeStyle = a.ink;
  g.lineWidth = 0.8;
  g.stroke(yard);
  const blocks: number[] = [];
  for (let x = -84; x <= 76; x += 16) blocks.push(x, -75, 8, 3.4, x + 4, 71.6, 8, 3.4);
  for (let k = 0; k < blocks.length; k += 4) plate(g, blocks[k] ?? 0, blocks[k + 1] ?? 0, blocks[k + 2] ?? 0, blocks[k + 3] ?? 0, shade(a.dark, 0.12), a.ink, 0.4);
}

/** The silo: its blast doors between hazard stripes. */
function silo(g: Ctx, a: ShipPal): void {
  plating(g, [-15, -127, 15, -127, 15, -81, -15, -81], a.hull, a, 1);
  for (const s of [-1, 1]) plating(g, s > 0 ? [0.6, -121, 12, -121, 12, -87, 0.6, -87] : [-12, -121, -0.6, -121, -0.6, -87, -12, -87], shade(a.hull, -0.12), a, 0.6);
  for (const y0 of [-126, -86]) {
    g.save();
    g.beginPath();
    g.rect(-14, y0, 28, 4);
    g.clip();
    g.fillStyle = '#e0b424';
    g.fillRect(-14, y0, 28, 4);
    g.fillStyle = '#1c1c1c';
    for (let x = -18; x < 16; x += 5) g.fill(path([x, y0 + 4, x + 2.5, y0 + 4, x + 6.5, y0, x + 4, y0]));
    g.restore();
  }
}

/** The geodesic dome over the reactor: its bolted collar, the dome lit from the upper left, the lattice, the core's window. */
function dome(g: Ctx, a: ShipPal): void {
  drop(g, roundPts(0, 0, 62, 32), 5, path(YARD));
  plating(g, roundPts(0, 0, 62, 32), a.hull, a, 1.2);
  bolts(g, roundPts(0, 0, 56, 18), 1.2);
  const d = g.createRadialGradient(-18, -18, 4, 0, 0, 52);
  d.addColorStop(0, '#f4f6fa');
  d.addColorStop(0.45, a.light);
  d.addColorStop(1, shade(a.hull, -0.35));
  g.fillStyle = d;
  g.beginPath();
  g.arc(0, 0, 50, 0, TAU);
  g.fill();
  const lattice: number[] = [];
  const rings = [14, 26, 38, 50];
  for (let k = 0; k < 12; k++) {
    const b = (k / 12) * TAU, c = ((k + 1) / 12) * TAU;
    lattice.push(Math.cos(b) * 14, Math.sin(b) * 14, Math.cos(b) * 50, Math.sin(b) * 50);
    for (let i = 0; i < 3; i++) {
      const [r0, r1] = [rings[i] ?? 0, rings[i + 1] ?? 0];
      const [u, v] = i % 2 ? [b, c] : [c, b];
      lattice.push(Math.cos(b) * r1, Math.sin(b) * r1, Math.cos(c) * r1, Math.sin(c) * r1, Math.cos(u) * r0, Math.sin(u) * r0, Math.cos(v) * r1, Math.sin(v) * r1);
    }
  }
  seams(g, lattice, 0.7);
  g.strokeStyle = a.ink;
  g.lineWidth = 1;
  g.stroke(path(roundPts(0, 0, 50, 48)));
  g.fillStyle = '#141820';
  g.beginPath();
  g.arc(0, 0, 14, 0, TAU);
  g.fill();
}

function yardKit(g: Ctx, a: ShipPal): void {
  for (const [x, y] of [[-95, -60], [95, -60], [-95, 60], [95, 60]] as const) cable(g, [x * 0.6, y * 0.6, x * 0.78, y * 0.78], 3, '#2a2e36');
  cable(g, [0, -60, 0, -82], 3, '#2a2e36');
  g.fillStyle = shade(a.dark, -0.3); // the landing pad, its ring and chevrons
  g.beginPath();
  g.arc(-82, 0, 14, 0, TAU);
  g.fill();
  g.strokeStyle = a.trim;
  g.lineWidth = 1.4;
  g.beginPath();
  g.arc(-82, 0, 11, 0, TAU);
  g.stroke();
  for (const s of [-1, 1]) plating(g, [-86, s * 2, -82, s * 6, -78, s * 2, -82, s * 4], '#e0b424', a, 0.3);
  solar(g, 70, -30, 26, 24, 4, a);
  solar(g, 70, 6, 26, 24, 4, a);
  dish(g, -78, -36, 7, a);
  dish(g, -76, 38, 6, a);
  for (const [x, y] of [[-95, -60], [95, -60], [-95, 60], [95, 60]] as const) podDisc(g, a, x, y, 26);
}

function craterHull(g: Ctx, a: ShipPal): void {
  craterGround(g, a);
  citadelWalls(g, a);
  yardKit(g, a);
  silo(g, a);
  dome(g, a);
}

export const crater: HullFn = (ctx, p, s) => {
  const q = liveOf('crater', p);
  cachedHull(ctx, 'crater', p, craterHull);
  if (q.mono) return;
  const pulse = Math.sin(s.t * 4);
  glow(ctx, 0, 0, 30, rgbOf(q.glass), 0.6 + pulse * 0.2);
  ctx.fillStyle = q.glass;
  ctx.beginPath();
  ctx.arc(0, 0, 11 + pulse * 1.5, 0, TAU);
  ctx.fill();
  glow(ctx, 0, 0, 7, '255,255,255', 0.95);
  for (let k = 0; k < 12; k++) { // lights running along the front wall
    const on = ((k - s.t * 8) % 12 + 12) % 12 < 2.5 ? 1 : 0.25;
    lamp(ctx, q, -55 + k * 10, 70.6, 1.3, rgbOf(q.trim), on);
  }
  if (p.live) fire(ctx, 70, 10, 4, s.t, 3);
};

const MAIN = [0, 160, 10, 150, 22, 128, 36, 60, 40, -80, 32, -132, 14, -140, 0, -142];
const SIDE = [0, 96, 8, 86, 16, 70, 22, 10, 20, -60, 12, -84, 0, -88];

/** A truss joining the hulls at y: two rails, braces between them and a pipe. */
function truss(g: Ctx, a: ShipPal, y: number): void {
  cable(g, [-72, y, 72, y], 2.6, '#2a2e36');
  const braces: number[] = [];
  for (let x = -60; x <= 60; x += 8) braces.push(x, y + ((x / 8) % 2 ? -5 : 5));
  g.strokeStyle = shade(a.metal, 0.15);
  g.lineWidth = 1.4;
  g.stroke(path(braces, false));
  for (const d of [-7, 4]) plating(g, [-72, y + d, 72, y + d, 72, y + d + 3, -72, y + d + 3], a.metal, a, 0.5);
}

function sideHull(g: Ctx, a: ShipPal, sx: number): void {
  g.save();
  g.translate(sx * 72, 20);
  const h = keel(g, SIDE, a.hull, a, 1.1);
  tints(g, h, [-22, -40, 10, 30, 0.06, 12, -40, 10, 30, -0.06, -20, 30, 9, 26, -0.05]);
  scatter(g, h, [-22, -84, 22, 92], 26, 5 + sx, a, 1.2);
  const deck = plating(g, sym([0, 86, 8, 74, 12, 10, 10, -56, 0, -62]), mix(a.hull, a.light, 0.5), a, 0.8);
  scatter(g, deck, [-12, -60, 12, 86], 16, 9 + sx, a, 1.1);
  seams(g, [-11, -40, 11, -40, -12, -20, 12, -20, -12, 0, 12, 0, -11, 30, 11, 30, -10, 50, 10, 50], 0.6);
  windows(g, [-16, -30, -16, -24, -16, -18, 16, -30, 16, -24, 16, -18, -17, 20, -17, 26, 17, 20, 17, 26], 1);
  bell(g, 0, -82, 7, 7, a);
  g.restore();
}

function mainHull(g: Ctx, a: ShipPal): void {
  const h = keel(g, MAIN, a.hull, a, 1.4);
  tints(g, h, [-40, -110, 14, 40, 0.06, 26, -110, 14, 40, -0.07, -38, -40, 12, 50, -0.05, 26, 10, 12, 40, 0.05]);
  scatter(g, h, [-40, -132, 40, 150], 54, 11, a, 1.5);
  for (const s of [-1, 1]) {
    plating(g, s > 0 ? [32, 50, 37.4, 50, 38.6, -78, 33.4, -78] : flipX([32, 50, 37.4, 50, 38.6, -78, 33.4, -78]), shade(a.hull, -0.2), a, 0.6);
    bolts(g, Array.from({ length: 6 }, (_, k) => [s * 35.6, 40 - k * 22]).flat(), 0.8);
    windows(g, Array.from({ length: 6 }, (_, k) => [s * 28, -100 + k * 6]).flat(), 1);
  }
  const bow = plating(g, sym([0, 150, 16, 124, 26, 64, 0, 60]), mix(a.hull, a.light, 0.6), a, 1);
  scatter(g, bow, [-26, 60, 26, 150], 18, 13, a, 1.3);
  for (const y of [136, 128]) plating(g, [0, y + 6, 10, y, 10, y - 3, 0, y + 3, -10, y - 3, -10, y], a.trim, a, 0.5);
  drop(g, sym([0, 40, 14, 36, 16, -110, 10, -122, 0, -124]), 2.6, h);
  const spine = plating(g, sym([0, 40, 14, 36, 16, -110, 10, -122, 0, -124]), shade(a.hull, 0.08), a, 0.9);
  tints(g, spine, [-16, -110, 32, 20, -0.08, -16, -60, 32, 16, 0.06]);
  scatter(g, spine, [-16, -124, 16, 40], 16, 17, a, 1.2);
  grille(g, -9, -104, 18, 14, 6, 'y');
  cells(g, -8, -78, 4, 3, 4, a);
  cells(g, -8, -50, 4, 3, 4, a);
  grille(g, -12, 68, 24, 18, 6);
  plate(g, -2, 92, 4, 28, a.trim, a.ink, 0.5);
  plating(g, [-16, -20, 16, -20, 18, 14, 12, 22, -12, 22, -18, 14], shade(a.hull, -0.06), a, 1); // the bridge
  windows(g, [-10, 12, -5, 12, 0, 12, 5, 12, 10, 12], 1.4, '#9fe0ff');
  dish(g, 8, -10, 5, a);
  hatch(g, -8, -8, 3, shade(a.hull, 0.05));
  antenna(g, -12, -16, 9, -0.3);
  for (const x of [-16, 0, 16]) bell(g, x, -136, 7, 8, a);
}

function tridentHull(g: Ctx, a: ShipPal): void {
  for (const y of [-40, 50]) truss(g, a, y);
  for (const sx of [-1, 1]) sideHull(g, a, sx);
  mainHull(g, a);
}

export const trident: HullFn = (ctx, p, s) => {
  const q = liveOf('trident', p);
  for (const x of [-16, 0, 16]) plume(ctx, x, -144, 7, s.t, q);
  for (const sx of [-1, 1]) plume(ctx, sx * 72, -69, 7, s.t, q);
  cachedHull(ctx, 'trident', p, tridentHull);
  if (q.mono) return;
  for (const [x, y, k] of [[-40, -76, 0], [40, -76, 0], [-94, 30, 1], [94, 30, 1], [-72, 116, 2], [72, 116, 2]] as const) {
    lamp(ctx, q, x, y, 1.8, x < 0 ? '255,70,60' : '90,255,140', Math.sin(s.t * 3 + k) > 0.2 ? 1 : 0);
  }
  lamp(ctx, q, 0, 158, 1.6, '255,255,255', Math.sin(s.t * 6) > 0.85 ? 1 : 0);
};

export const HULLS_4: Readonly<Record<Map4Boss, HullFn>> = { halo, quarry, crater, trident, ark };
