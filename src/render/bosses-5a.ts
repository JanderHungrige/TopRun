import { shade } from './detail/color';
import { plateShell, shell } from './detail/organic';
import { bolts, glow, hatch, path } from './detail/parts';
import { cachedHull, liveOf, type HullFn } from './bosses-5';
import { beam, bubbles, fin, finPair, hull, lamp, port, rivets, sail, screw } from './enemies/sea-kit';
import { hullInk, metalInk, rgb, type SeaPal } from './enemies/sea-pal';
import { coral, pebbles, polyps, rockFacets } from './enemies/sea-reef';

// BARRACUDA — a long, sleek hunter-killer sub: an anechoic-tiled hull with frames and limber holes, the bow's sonar
// dome and tube doors, a swept sail with its planes, masts and bridge, the X-tail and a towed-array fairing; its great
// bronze screw turns, bubbles stream back and the bow lamp glows red ahead — and BASTION — a seabed fortress on a
// faceted rock shelf grown with coral: armoured gun pads, flanged pipes, a plated ring of lit windows round a geodesic
// glass dome, an airlock; its windows breathe and its vents bubble (docs 65, 120).

type Ctx = CanvasRenderingContext2D;

const BARRACUDA = [0, 160, 14, 150, 26, 126, 34, 92, 38, 40, 38, -60, 34, -110, 24, -148, 12, -168, 0, -176];

function limberRows(g: Ctx, x: number, y0: number, y1: number): void {
  for (let y = y0; y <= y1; y += 6) for (const s of [-1, 1]) {
    g.fillStyle = 'rgba(0,0,0,0.55)';
    g.fillRect(s * x - 1.2, y, 2.4, 2.6);
    g.fillStyle = 'rgba(255,255,255,0.1)';
    g.fillRect(s * x - 1.2, y + 2.6, 2.4, 0.7);
  }
}

function barracudaHull(g: Ctx, a: SeaPal): void {
  finPair(g, [10, -146, 42, -176, 46, -186, 36, -186, 4, -160], a, 1.2);
  fin(g, [-2, -150, 2, -150, 2, -188, -2, -188], a, 0.8); // the upper rudder, edge-on
  hull(g, BARRACUDA, a, { frames: [128, 94, 62, 4, -40, -86, -128], tile: 6, seam: 1.3 });
  limberRows(g, 33, -90, 70);
  shell(g, 0, 146, 13, 10, { base: shade(a.hull, 0.18), dark: a.dark, light: shade(a.light, 0.3), ink: 'rgba(0,0,0,0.35)' }, 0); // sonar dome
  for (const s of [-1, 1]) { // the torpedo pods on the bow's flanks
    plateShell(g, [s * 8, 118, s * 26, 122, s * 35, 136, s * 33, 152, s * 22, 160, s * 9, 156], { ...hullInk(a), base: shade(a.hull, 0.06) }, 1);
    bolts(g, [s * 12, 124, s * 26, 126, s * 31, 150, s * 13, 153], 0.9);
  }
  plateShell(g, [26, -96, 29, -96, 28, -140, 26, -136], metalInk(a), 0.6); // towed-array fairing
  for (const y of [104, -62]) hatch(g, 0, y, 5, shade(a.hull, 0.08));
  rivets(g, 28, -120, 116, 8, 0.9);
  shell(g, 0, -150, 18, 18, { base: a.dark, dark: '#05080c', light: a.hull, ink: a.ink }, 0); // the aft gun's ring
  finPair(g, [8, 46, 44, 38, 46, 30, 8, 28], a, 0.9);
  sail(g, [0, 64, 8, 58, 12, 44, 12, 10, 8, 0, 0, -4], a, [24, 16, 8, 2], a.light);
}

export const barracuda: HullFn = (ctx, p, s) => {
  const q = liveOf('barracuda', p);
  bubbles(ctx, q, 0, -192, s.t, 12, 80, 3);
  screw(ctx, q, 0, -182, 16, s.t, 7);
  beam(ctx, q, 0, 160, 40, 14, 0.16);
  cachedHull(ctx, 'barracuda', p, barracudaHull);
  lamp(ctx, q, 0, 158, 2.2, '#ff5a4a', 0.65 + 0.35 * Math.sin(s.t * 3));
};

const SHELF = [-130, 40, -120, -60, -60, -96, 40, -100, 120, -70, 132, 30, 100, 80, 20, 96, -90, 84];
const PADS = [[-95, 40], [95, 40], [-80, -55], [80, -55]] as const;

/** A flanged pipe from the dome to a pad: a lit tube with clamps. */
function pipe(g: Ctx, a: SeaPal, x: number, y: number): void {
  const p = path([0, 0, x, y], false);
  g.lineCap = 'butt';
  for (const [w, c] of [[9, a.ink], [7, shade(a.light, -0.2)], [2.4, shade(a.light, 0.35)]] as const) {
    g.strokeStyle = c;
    g.lineWidth = w;
    g.save();
    if (w < 3) g.translate(-1.4, -1.4);
    g.stroke(p);
    g.restore();
  }
  const l = Math.hypot(x, y), nx = -y / l, ny = x / l;
  for (const f of [0.55, 0.75]) {
    const cx = x * f, cy = y * f;
    plateShell(g, [cx + nx * 6, cy + ny * 6, cx - nx * 6, cy - ny * 6, cx - nx * 6 + (x / l) * 2.4, cy - ny * 6 + (y / l) * 2.4, cx + nx * 6 + (x / l) * 2.4, cy + ny * 6 + (y / l) * 2.4], metalInk(a), 0.5);
  }
}

/** A gun pad: an armoured octagon with a hazard ring and bolts. */
function pad(g: Ctx, a: SeaPal, x: number, y: number): void {
  const oct: number[] = [];
  for (let k = 0; k < 8; k++) oct.push(x + Math.cos(k * 0.785 + 0.39) * 25, y + Math.sin(k * 0.785 + 0.39) * 25);
  plateShell(g, oct, hullInk(a), 1);
  g.strokeStyle = '#1a1a18';
  g.lineWidth = 2.4;
  g.beginPath();
  g.arc(x, y, 19.5, 0, Math.PI * 2);
  g.stroke();
  g.strokeStyle = a.trim;
  g.setLineDash([4, 4]);
  g.stroke();
  g.setLineDash([]);
  bolts(g, Array.from({ length: 8 }, (_, k) => [x + Math.cos(k * 0.785) * 22.4, y + Math.sin(k * 0.785) * 22.4]).flat(), 0.9);
}

function seabed(g: Ctx, a: SeaPal): void {
  rockFacets(g, SHELF, -10, -10, '#4c5452', a.ink);
  pebbles(g, -66, 70, 24, 9, '#6a706a', a.ink);
  pebbles(g, 100, -40, 20, 7, '#5e6662', a.ink);
  pebbles(g, -96, -60, 16, 6, '#6a706a', a.ink);
  coral(g, -116, 10, -1.9, 34, '#ff8a78', a.ink);
  coral(g, 116, 40, -1.2, 30, '#ffb84a', a.ink);
  coral(g, 30, -92, -2.6, 26, '#e86ac8', a.ink);
  polyps(g, -42, 80, 6, '#c87ae8', a.ink);
  polyps(g, 70, -84, 5, '#6ae8c8', a.ink, 4);
  polyps(g, -104, 58, 4.5, '#ff6a9a', a.ink);
  polyps(g, 118, -20, 4, '#ffd27a', a.ink, 4);
}

function bastionHull(g: Ctx, a: SeaPal): void {
  seabed(g, a);
  for (const [x, y] of PADS) pipe(g, a, x, y);
  for (const [x, y] of PADS) pad(g, a, x, y);
  plateShell(g, [-12, 54, 12, 54, 12, 80, -12, 80], hullInk(a), 0.8); // the airlock
  hatch(g, 0, 72, 6, shade(a.hull, 0.1));
  shell(g, 0, 0, 62, 62, hullInk(a), 0);
  for (let i = 0; i < 24; i++) { // the ring of plates
    const a0 = (i / 24) * Math.PI * 2 + 0.02, a1 = a0 + Math.PI / 12 - 0.04;
    const c = Math.cos, s = Math.sin;
    plateShell(g, [c(a0) * 61, s(a0) * 61, c(a1) * 61, s(a1) * 61, c(a1) * 49, s(a1) * 49, c(a0) * 49, s(a0) * 49], i % 2 ? hullInk(a) : { ...hullInk(a), base: shade(a.hull, 0.1) }, 0.6);
  }
  for (let i = 0; i < 12; i++) port(g, Math.cos((i / 12) * Math.PI * 2) * 55, Math.sin((i / 12) * Math.PI * 2) * 55, 2.6, a, '#22303a');
  dome(g, a);
}

/** The glass dome: lit from the upper left, a geodesic frame, a mast. */
function dome(g: Ctx, a: SeaPal): void {
  shell(g, 0, 0, 47, 47, { base: '#6a8a9a', dark: '#1e323c', light: '#d8eef6', ink: a.ink }, 0);
  g.save();
  g.beginPath();
  g.arc(0, 0, 47, 0, Math.PI * 2);
  g.clip();
  g.strokeStyle = 'rgba(30,44,52,0.75)';
  g.lineWidth = 1.2;
  for (const r of [16, 32]) {
    g.beginPath();
    g.arc(0, 0, r, 0, Math.PI * 2);
    g.stroke();
  }
  for (let i = 0; i < 12; i++) {
    const b = (i / 12) * Math.PI * 2;
    g.stroke(path([Math.cos(b) * 16, Math.sin(b) * 16, Math.cos(b + 0.26) * 32, Math.sin(b + 0.26) * 32, Math.cos(b) * 48, Math.sin(b) * 48], false));
  }
  g.restore();
  plateShell(g, [26, 18, 30, 18, 30, 22, 26, 22], metalInk(a), 0.4);
}

export const bastion: HullFn = (ctx, p, s) => {
  const q = liveOf('bastion', p);
  cachedHull(ctx, 'bastion', p, bastionHull);
  if (q.mono) return;
  for (let i = 0; i < 12; i++) { // the windows breathing
    const b = (i / 12) * Math.PI * 2, on = 0.55 + 0.45 * Math.sin(s.t * 1.6 + i * 1.3);
    glow(ctx, Math.cos(b) * 55, Math.sin(b) * 55, 9, rgb(q.glow), 0.35 * on);
    port(ctx, Math.cos(b) * 55, Math.sin(b) * 55, 2.6, q, q.glass);
  }
  for (const [x, y] of [[-58, -82], [64, 62], [-112, 20]] as const) bubbles(ctx, q, x, y, s.t + x, 5, 50, 2.2);
  lamp(ctx, q, 28, 20, 1.8, '#ff4a3a', Math.sin(s.t * 4) > 0 ? 1 : 0);
};
