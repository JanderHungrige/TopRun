import { eyes, limb, plateShell, shell, spines } from './detail/organic';
import { bolts, grille, plate } from './detail/parts';
import { cachedHull, liveOf, type HullFn } from './bosses-7';
import { ink, metalInk, type AlienPal } from './enemies/steppe-pal';

// HARVESTER — a squat reaper machine on six legs: the plated body with side armour, cooling grilles, the chimney and
// the cab's glass, the reaper bar with its teeth across the front, the drums of blades spinning, chaff and smoke — and
// LONGSHANKS — a giant tripod: the domed hull of radial armour plates, cooling fins, the hood, the glowing visor and
// the emitter housings, three huge legs with pistons striding in turn (docs 105, 116).

type Ctx = CanvasRenderingContext2D;

function harvesterHull(g: Ctx, a: AlienPal): void {
  plateShell(g, [-126, 46, 126, 46, 126, 80, -126, 80], metalInk(a), 1.2); // the reaper bar
  bolts(g, Array.from({ length: 12 }, (_, k) => [-115 + k * 21, 52]).flat(), 1);
  spines(g, Array.from({ length: 25 }, (_, k) => [k * 10 - 120, 80, Math.PI / 2, 11, 3]).flat(), { base: '#c8c8b8', dark: '#6a6a5e', light: '#f0f0e4', ink: a.ink });
  const body = [0, -76, 46, -70, 64, -36, 64, 40, 52, 54, 0, 56, -52, 54, -64, 40, -64, -36, -46, -70];
  plateShell(g, body, ink(a), 1.4);
  for (const s of [-1, 1]) {
    plateShell(g, [s * 30, -60, s * 58, -34, s * 58, 30, s * 30, 38], { ...ink(a), base: a.light }, 0.8); // side armour
    bolts(g, [s * 34, -50, s * 54, -30, s * 54, 26, s * 34, 32], 1.1);
  }
  grille(g, -26, -68, 52, 14, 6, 'y');
  plateShell(g, [26, -62, 44, -62, 42, -92, 28, -92], metalInk(a), 0.8); // the chimney
  plate(g, -64, -8, 128, 4, a.trim, a.ink, 0.4);
  shell(g, 0, -30, 20, 14, { base: '#3aa8a0', dark: '#164a46', light: '#a8fff4', ink: a.ink }, 0); // the cab's glass
  shell(g, 0, -27, 5.5, 6.5, { base: '#3a2a46', dark: '#1a1020', light: '#6a5a76', ink: a.ink }, 0); // the driver
}

export const harvester: HullFn = (ctx, p, s) => {
  const q = liveOf('harvester', p);
  for (let i = 0; i < 3; i++) for (const side of [-1, 1]) { // six squat legs
    const step = Math.sin(s.t * 2 + i * 2 + (side > 0 ? 1 : 0)) * 10;
    limb(ctx, [side * 54, -40 + i * 34, side * 80, -50 + i * 34 + step * 0.4, side * 96, -46 + i * 34 + step], 9, metalInk(q));
  }
  cachedHull(ctx, 'harvester', p, harvesterHull);
  if (q.mono) return;
  for (const side of [-1, 1]) for (let k = 0; k < 8; k++) { // two spinning drums of blades
    const y = 50 + ((k * 3.5 + s.t * 50) % 28);
    ctx.fillStyle = k % 2 ? '#d0d0c0' : '#6a6a5e';
    ctx.fillRect(side * 84 - 34, y, 68, 1.8);
  }
  for (let i = 0; i < 18; i++) { // chaff thrown up by the reapers
    const k = (s.t * 1.3 + i * 0.37) % 1;
    ctx.fillStyle = `rgba(240,210,120,${(0.85 * (1 - k)).toFixed(2)})`;
    ctx.fillRect(((i * 53) % 240) - 120, 92 + k * 46, 3, 3);
  }
  for (let i = 0; i < 4; i++) { // the chimney's smoke
    const k = (s.t * 0.6 + i * 0.25) % 1;
    ctx.fillStyle = `rgba(80,70,60,${(0.5 * (1 - k)).toFixed(2)})`;
    ctx.beginPath();
    ctx.arc(35 - k * 14, -96 - k * 50, 6 + k * 10, 0, Math.PI * 2);
    ctx.fill();
  }
};

function longshanksHull(g: Ctx, a: AlienPal): void {
  for (const side of [-1, 1]) shell(g, side * 58, 34, 17, 15, metalInk(a), 1); // the emitter housings
  shell(g, 0, 0, 55, 49, metalInk(a), 0);
  for (let k = 0; k < 6; k++) { // radial armour plates
    const a0 = (k / 6) * Math.PI * 2 + 0.12, a1 = a0 + Math.PI / 3 - 0.24;
    const pts: number[] = [];
    for (let i = 0; i <= 5; i++) pts.push(Math.cos(a0 + ((a1 - a0) * i) / 5) * 52, Math.sin(a0 + ((a1 - a0) * i) / 5) * 46);
    for (let i = 5; i >= 0; i--) pts.push(Math.cos(a0 + ((a1 - a0) * i) / 5) * 34, Math.sin(a0 + ((a1 - a0) * i) / 5) * 30);
    plateShell(g, pts, ink(a), 0.8);
  }
  grille(g, -30, -50, 60, 12, 8, 'y'); // cooling fins
  shell(g, 0, -10, 36, 26, { ...metalInk(a), base: a.light, light: '#ecebf6' }, 2); // the hood
  g.strokeStyle = a.trim;
  g.lineWidth = 2.4;
  g.beginPath();
  g.ellipse(0, 0, 46, 40, 0, 0.25, Math.PI - 0.25);
  g.stroke();
  plateShell(g, [-20, 22, 20, 22, 14, 30, -14, 30], { base: a.glow, dark: '#6a1a5a', light: a.core, ink: a.ink }, 0.8); // visor
  eyes(g, [-30, 20, 30, 20], 2.2, a.glow, a.core, true);
}

export const longshanks: HullFn = (ctx, p, s) => {
  const q = liveOf('longshanks', p);
  for (let i = 0; i < 3; i++) { // three huge legs striding in turn, each with its piston
    const a = (i / 3) * Math.PI * 2 - Math.PI / 2 + 0.2;
    const lift = Math.max(0, Math.sin(s.t * 1.2 + i * 2.1)) * 22;
    const r = 150 - lift;
    const kx = Math.cos(a) * 80 + (i - 1) * 24, ky = Math.sin(a) * 80 + 14;
    limb(ctx, [Math.cos(a) * 30, Math.sin(a) * 30, kx, ky], 10, metalInk(q));
    limb(ctx, [Math.cos(a) * 44 + 8, Math.sin(a) * 44, kx * 0.92, ky * 0.92], 3.5, { ...metalInk(q), base: q.light });
    limb(ctx, [kx, ky, Math.cos(a) * r, Math.sin(a) * r + 40], 8, metalInk(q));
    shell(ctx, Math.cos(a) * r, Math.sin(a) * r + 40, 12, 9, { ...metalInk(q), base: q.light }, 0);
  }
  cachedHull(ctx, 'longshanks', p, longshanksHull);
};

