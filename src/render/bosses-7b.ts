import { harvester, longshanks } from './bosses-7a';
import { cachedHull, liveOf, type HullFn, type Map7Boss } from './bosses-7';
import { eyes, limb, plateShell, shell, spines } from './detail/organic';
import { bolts, glow, grille, plate } from './detail/parts';
import { ink, metalInk, type AlienPal } from './enemies/steppe-pal';

// JUGGERNAUT — a siege beast: the banded hide with bony ridge plates, harness straps, the plank-and-iron gun fort on
// its back, the riders' saddles, the armoured brow, tusks and amber eyes; six heavy legs and the swinging tail live.
// DREADNOUGHT — a siege ship: the long plated hull with armour seams, teal trim, the bridge tower with lit windows,
// engine pods, hangar doors, antennae; its anti-grav pads glow and its running lights blink. The MOTHERSHIP — a vast
// disc of armour segments round the dark inner ring with four hangar mouths and the dome over its pulsing core, lights
// running round the rim (docs 105, 116).

type Ctx = CanvasRenderingContext2D;

const hide = (a: AlienPal) => ({ base: a.shell, dark: a.dark, light: a.light, ink: a.ink });

function juggernautHull(g: Ctx, a: AlienPal): void {
  shell(g, 0, -10, 60, 118, hide(a), 6);
  g.fillStyle = 'rgba(30,20,12,0.3)';
  for (let k = 0; k < 6; k++) g.fillRect(-50, -100 + k * 34, 100, 4); // hide bands
  for (const y of [-112, -96, -80, -64, 34, 50, 66, 82]) plateShell(g, [-7, y, 7, y, 5, y + 13, -5, y + 13], { ...hide(a), base: '#c8b89a', light: '#f0e6d0' }, 0.6);
  for (const y of [-46, 22]) { // harness straps with their buckles
    g.fillStyle = '#2a1e14';
    g.fillRect(-58, y, 116, 4);
    for (const x of [-40, 36]) plate(g, x, y - 1, 5, 6, '#8a8a7a', a.ink, 0.4);
  }
  for (const s of [-1, 1]) plateShell(g, [s * 34, 22, s * 54, 22, s * 56, 40, s * 34, 40], { ...ink(a), base: '#5a3a2a' }, 0.6); // saddles
  plateShell(g, [-30, -38, 30, -38, 34, 18, -34, 18], { base: '#6a5038', dark: '#3a2a1c', light: '#9a7c5a', ink: a.ink }, 1); // the fort
  g.strokeStyle = 'rgba(30,20,10,0.6)';
  g.lineWidth = 0.8;
  for (let x = -24; x <= 24; x += 8) {
    g.beginPath();
    g.moveTo(x, -36);
    g.lineTo(x * 1.12, 16);
    g.stroke();
  }
  for (const [x, y] of [[-30, -38], [30, -38], [-34, 18], [34, 18]] as const) plate(g, x - 4, y - 4, 8, 8, '#6a6a62', a.ink, 0.5);
  for (let k = 0; k < 5; k++) plate(g, -28 + k * 13, -44, 6, 6, '#3a2e24', a.ink, 0.4); // crenels
  shell(g, 0, 112, 31, 25, { ...hide(a), base: a.dark }, 1);
  plateShell(g, [-24, 98, 24, 98, 18, 112, -18, 112], metalInk(a), 1); // the armoured brow
  bolts(g, [-18, 102, -6, 102, 6, 102, 18, 102], 1.2);
  spines(g, [-14, 124, Math.PI * 0.7, 30, 4, 14, 124, Math.PI * 0.3, 30, 4], { base: '#e8dcc0', dark: '#8a7a5a', light: '#fff6e0', ink: a.ink });
  eyes(g, [-12, 118, 12, 118], 3, '#ffb03a', '#fff0c0', true);
}

export const juggernaut: HullFn = (ctx, p, s) => {
  const q = liveOf('juggernaut', p);
  for (let i = 0; i < 3; i++) for (const side of [-1, 1]) { // six heavy legs
    const step = Math.sin(s.t * 1.8 + i * 1.9 + (side > 0 ? 1.2 : 0)) * 12;
    limb(ctx, [side * 40, -70 + i * 60, side * 62, -74 + i * 60 + step * 0.4, side * 72, -66 + i * 60 + step], 11, hide(q));
  }
  limb(ctx, [0, -120, Math.sin(s.t) * 20, -146, Math.sin(s.t + 1) * 14, -162], 11, hide(q)); // the tail
  cachedHull(ctx, 'juggernaut', p, juggernautHull);
};

const DREAD = [0, -112, 40, -100, 70, -40, 130, -14, 140, 20, 100, 40, 60, 70, 30, 96, 0, 104, -30, 96, -60, 70, -100, 40, -140, 20, -130, -14, -70, -40, -40, -100];

function dreadnoughtHull(g: Ctx, a: AlienPal): void {
  plateShell(g, DREAD, metalInk(a), 1.4);
  plateShell(g, [0, -100, 32, -90, 54, -40, 0, -50, -54, -40, -32, -90], { ...metalInk(a), base: a.light }, 0.8);
  plateShell(g, [0, -30, 50, -20, 90, 0, 50, 20, 0, 24, -50, 20, -90, 0, -50, -20], ink(a), 0.8); // the deck
  g.strokeStyle = 'rgba(0,0,0,0.3)';
  g.lineWidth = 1;
  for (const [x, y] of [[120, 10], [80, 44], [40, 80], [-40, 80], [-80, 44], [-120, 10], [60, -60], [-60, -60]] as const) {
    g.beginPath();
    g.moveTo(0, 0);
    g.lineTo(x, y);
    g.stroke();
  }
  g.strokeStyle = a.trim;
  g.lineWidth = 2;
  for (const side of [-1, 1]) {
    g.beginPath();
    g.moveTo(side * 20, -96);
    g.lineTo(side * 128, 4);
    g.stroke();
  }
  for (const [x, y] of [[-70, -40], [70, -40], [-70, 50], [70, 50]] as const) {
    shell(g, x, y, 22, 16, metalInk(a), 1); // engine pods
    grille(g, x - 10, y - 4, 20, 8, 4, 'y');
  }
  for (const s of [-1, 1]) grille(g, s > 0 ? 6 : -30, 72, 24, 16, 5); // hangar doors
  plateShell(g, [-14, -96, 14, -96, 18, -64, -18, -64], { ...metalInk(a), base: a.light }, 0.8); // the bridge
  for (let k = 0; k < 4; k++) plate(g, -11 + k * 6, -84, 3.4, 2.2, '#ffd86a', a.ink, 0.3);
  spines(g, [-8, -108, -Math.PI / 2, 14, 1.4, 8, -108, -Math.PI / 2, 10, 1.2], metalInk(a));
  bolts(g, [-110, 18, 110, 18, -84, 42, 84, 42, -50, 70, 50, 70], 1.4);
}

export const dreadnought: HullFn = (ctx, p, s) => {
  const q = liveOf('dreadnought', p);
  if (!q.mono) for (const [x, y] of [[-70, -40], [70, -40], [-70, 50], [70, 50]] as const) { // the anti-grav pads glowing below
    glow(ctx, x, y, 34, '255,74,216', 0.25 + 0.15 * Math.sin(s.t * 4 + x));
  }
  cachedHull(ctx, 'dreadnought', p, dreadnoughtHull);
  if (q.mono) return;
  for (let k = 0; k < 6; k++) {
    eyes(ctx, [-50 + k * 20, 64], 1.8, `rgba(255,220,120,${(0.4 + 0.6 * Math.max(0, Math.sin(s.t * 3 + k))).toFixed(2)})`, '#fff8e0');
  }
};

function mothershipHull(g: Ctx, a: AlienPal): void {
  shell(g, 0, 0, 138, 102, metalInk(a), 0);
  for (let i = 0; i < 24; i++) { // armour segments round the rim
    const a0 = (i / 24) * Math.PI * 2 + 0.02, a1 = a0 + (Math.PI * 2) / 24 - 0.04;
    const pts = [Math.cos(a0) * 134, Math.sin(a0) * 99, Math.cos(a1) * 134, Math.sin(a1) * 99, Math.cos(a1) * 106, Math.sin(a1) * 78, Math.cos(a0) * 106, Math.sin(a0) * 78];
    plateShell(g, pts, i % 2 ? ink(a) : { ...ink(a), base: a.light }, 0.6);
  }
  shell(g, 0, 0, 104, 76, { ...ink(a), base: a.dark }, 3);
  for (const ang of [0, Math.PI / 2, Math.PI, Math.PI * 1.5]) { // hangar mouths
    const x = Math.cos(ang) * 82, y = Math.sin(ang) * 60;
    shell(g, x, y, 15, 11, { base: '#120c18', dark: '#06040a', light: '#3a2a4a', ink: a.ink }, 0);
    for (let k = -1; k <= 1; k++) plate(g, x + k * 6 - 1, y + 6, 2, 3, '#ffd86a', a.ink, 0.2);
  }
  shell(g, 0, 0, 52, 40, { ...metalInk(a), base: a.light, light: '#ecebf6' }, 1); // the dome
}

export const mothership: HullFn = (ctx, p, s) => {
  const q = liveOf('mothership', p);
  cachedHull(ctx, 'mothership', p, mothershipHull);
  if (q.mono) return;
  for (let i = 0; i < 24; i++) { // the rim lights running round
    const a = (i / 24) * Math.PI * 2 - s.t * 0.8;
    const on = 0.3 + 0.7 * Math.max(0, Math.sin(s.t * 5 + i));
    ctx.fillStyle = `rgba(90,230,220,${on.toFixed(2)})`;
    ctx.beginPath();
    ctx.arc(Math.cos(a) * 120, Math.sin(a) * 88, 3, 0, Math.PI * 2);
    ctx.fill();
  }
  const core = 0.5 + 0.5 * Math.sin(s.t * 2.2);
  glow(ctx, 0, 0, 46, '255,74,216', 0.45 + core * 0.4);
  eyes(ctx, [0, 0], 10, q.glow, q.core);
};

export const HULLS_7: Readonly<Record<Map7Boss, HullFn>> = { harvester, longshanks, juggernaut, dreadnought, mothership };
