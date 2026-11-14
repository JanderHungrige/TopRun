import { TAU } from '../core/math';
import { cachedHull, liveOf, roundPts, type HullFn } from './bosses-4';
import { podDisc } from './bosses-4a';
import { mix, shade } from './detail/color';
import { antenna, bolts, DARK, edges, glow, grille, LIGHT, path, sym } from './detail/parts';
import { smoke } from './enemies/fx';
import { dish, windows } from './enemies/space-gear';
import { bell, drop, greebles, keel, lamp, plating, plume, rgbOf, seams, tints } from './enemies/space-kit';
import { scatter } from './enemies/space-surface';
import type { ShipPal } from './enemies/space-pal';

// The ARK — the mothership: a broad hull of heavy plates, a darker armour skirt round its raised deck, ribs, the prow's
// armour with its chevrons, two launch bays recessed into the stern quarters with their landing lights and hazard
// stripes, sponsons for the broadside batteries, flak platforms, the armoured well of its core, rows of lit ports,
// antennae and dishes, a bank of five engines; the core pulses, the bays' lights run, the engines glow and a hit
// smokes (docs 58, 119).

type Ctx = CanvasRenderingContext2D;

const ARK = sym([0, 172, 40, 140, 100, 96, 160, 40, 168, -20, 140, -80, 70, -130, 30, -150, 0, -150]);
const DECK = ARK.map((v, i) => (i % 2 ? 8 + (v - 8) * 0.84 : v * 0.84));
const PROW = sym([0, 160, 34, 130, 86, 92, 60, 60, 0, 70]);
const ENGINES = [-105, -102, -40, -142, 0, -147, 40, -142, 105, -102];

function arkArmour(g: Ctx, a: ShipPal): Path2D {
  const h = keel(g, [0, 172, 40, 140, 100, 96, 160, 40, 168, -20, 140, -80, 70, -130, 30, -150, 0, -150], a.hull, a, 1.6);
  const band = new Path2D();
  band.addPath(path(ARK));
  band.addPath(path(DECK));
  g.fillStyle = 'rgba(10,6,16,0.3)';
  g.fill(band, 'evenodd');
  const list: number[] = [];
  for (let i = 0; i < ARK.length; i += 2) list.push(ARK[i] ?? 0, ARK[i + 1] ?? 0, DECK[i] ?? 0, DECK[i + 1] ?? 0);
  for (let i = 0; i < ARK.length; i += 2) {
    const j = (i + 2) % ARK.length;
    const mx = ((ARK[i] ?? 0) + (ARK[j] ?? 0)) / 2, my = ((ARK[i + 1] ?? 0) + (ARK[j + 1] ?? 0)) / 2;
    const nx = ((DECK[i] ?? 0) + (DECK[j] ?? 0)) / 2, ny = ((DECK[i + 1] ?? 0) + (DECK[j + 1] ?? 0)) / 2;
    list.push(mx, my, nx, ny);
  }
  seams(g, list, 1);
  drop(g, DECK, 3, h);
  const deck = path(DECK);
  g.fillStyle = 'rgba(255,255,255,0.05)';
  g.fill(deck);
  edges(g, DECK, 1.6);
  const plates: number[] = [];
  for (let x = -140; x < 140; x += 40) for (let y = -120; y < 150; y += 36) plates.push(x, y, 40, 36, ((((x + y) / 4) % 3) - 1) * 0.045);
  tints(g, deck, plates);
  scatter(g, deck, [-140, -124, 140, 150], 70, 21, a, 1.7);
  const ribs: number[] = [];
  for (let y = -110; y < 120; y += 24) ribs.push(-60, y, 60, y);
  seams(g, ribs, 0.8);
  g.strokeStyle = a.ink;
  g.lineWidth = 0.9;
  g.stroke(deck);
  return h;
}

/** A launch bay recessed into the stern quarter: its frame, the dark hangar, landing lights and hazard stripes. */
function bay(g: Ctx, a: ShipPal, x: number): void {
  plating(g, [x - 31, -88, x + 31, -88, x + 31, -34, x - 31, -34], a.dark, a, 1);
  const inner = [x - 24, -81, x + 24, -81, x + 24, -40, x - 24, -40];
  const d = g.createLinearGradient(0, -81, 0, -40);
  d.addColorStop(0, '#07050c');
  d.addColorStop(1, '#1e1628');
  g.fillStyle = d;
  g.fill(path(inner));
  edges(g, inner, 1.4, DARK, LIGHT);
  for (const dx of [-11, 11]) windows(g, Array.from({ length: 6 }, (_, k) => [x + dx, -76 + k * 6]).flat(), 1, '#ffb0c8');
  g.save();
  g.beginPath();
  g.rect(x - 24, -42, 48, 4);
  g.clip();
  g.fillStyle = '#e0b424';
  g.fillRect(x - 24, -42, 48, 4);
  g.fillStyle = '#1c1c1c';
  for (let k = x - 30; k < x + 26; k += 6) g.fill(path([k, -38, k + 3, -38, k + 7, -42, k + 4, -42]));
  g.restore();
  g.strokeStyle = a.ink;
  g.lineWidth = 0.8;
  g.stroke(path(inner));
}

/** The core's armoured well: segments round it, bolts, the dark shaft. */
function coreWell(g: Ctx, a: ShipPal): void {
  for (let k = 0; k < 16; k++) {
    const b0 = (k / 16) * TAU + 0.02, b1 = b0 + TAU / 16 - 0.04;
    const arc = (r: number, u: number, v: number): number[] =>
      [0, 1, 2, 3].map((i) => u + ((v - u) * i) / 3).flatMap((b) => [Math.cos(b) * r, Math.sin(b) * r]);
    plating(g, [...arc(47, b0, b1), ...arc(35, b1, b0)], k % 2 ? a.hull : shade(a.hull, 0.14), a, 0.7);
  }
  bolts(g, roundPts(0, 0, 41, 16), 1.1);
  g.fillStyle = '#1a1420';
  g.beginPath();
  g.arc(0, 0, 34, 0, TAU);
  g.fill();
  edges(g, roundPts(0, 0, 34, 20), 1.6, DARK, LIGHT);
}

function arkKit(g: Ctx, a: ShipPal, h: Path2D): void {
  drop(g, PROW, 3, h);
  const prow = plating(g, PROW, mix(a.hull, a.light, 0.55), a, 1.2);
  scatter(g, prow, [-86, 60, 86, 160], 22, 23, a, 1.6);
  for (const y of [112, 102]) plating(g, [0, y + 8, 16, y, 16, y - 4, 0, y + 4, -16, y - 4, -16, y], a.trim, a, 0.6);
  for (const x of [-110, 110]) bay(g, a, x);
  for (const s of [-1, 1]) {
    podDisc(g, a, s * 130, 30, 22); // the broadside battery's sponson
    podDisc(g, a, s * 60, -120, 18); // the flak platform
    windows(g, Array.from({ length: 7 }, (_, k) => [s * (120 - k * 8), 60 + k * 7]).flat(), 1.2);
    windows(g, Array.from({ length: 6 }, (_, k) => [s * (146 - k * 4), -10 - k * 9]).flat(), 1.2);
    grille(g, s > 0 ? 66 : -90, -6, 24, 14, 6, 'y');
    dish(g, s * 76, 36, 8, a);
    antenna(g, s * 36, 128, 12, s * 0.3);
  }
  greebles(g, [-40, -40, 10, 8, 30, -44, 12, 10, -24, 54, 8, 10, 18, 50, 10, 8, -6, -112, 12, 10], a, -0.15);
  coreWell(g, a);
  for (let i = 0; i < ENGINES.length; i += 2) bell(g, ENGINES[i] ?? 0, (ENGINES[i + 1] ?? 0) + 4, 8, 9, a);
}

function arkHull(g: Ctx, a: ShipPal): void {
  const h = arkArmour(g, a);
  arkKit(g, a, h);
}

export const ark: HullFn = (ctx, p, s) => {
  const q = liveOf('ark', p);
  for (let i = 0; i < ENGINES.length; i += 2) plume(ctx, ENGINES[i] ?? 0, (ENGINES[i + 1] ?? 0) - 5, 8, s.t, q);
  cachedHull(ctx, 'ark', p, arkHull);
  if (q.mono) return;
  const pulse = 0.65 + Math.sin(s.t * 2.5) * 0.25;
  glow(ctx, 0, 0, 48, rgbOf(q.trim), pulse * 0.8);
  ctx.fillStyle = `rgba(255,106,138,${pulse.toFixed(2)})`;
  ctx.beginPath();
  ctx.arc(0, 0, 30, 0, TAU);
  ctx.fill();
  ctx.fillStyle = q.glass;
  ctx.beginPath();
  ctx.arc(0, 0, 16, 0, TAU);
  ctx.fill();
  glow(ctx, 0, 0, 9, '255,255,255', 1);
  for (const x of [-110, 110]) for (let k = 0; k < 5; k++) { // the bays' landing lights running in
    const on = ((k + s.t * 4) % 5) < 1 ? 1 : 0;
    lamp(ctx, q, x - 18 + k * 9, -45, 1.3, rgbOf(q.trim), on);
  }
  if (p.live) smoke(ctx, 120, 40, 5, s.t, 4);
};
