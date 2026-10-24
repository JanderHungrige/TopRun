import { ENEMIES, isAir } from '../data/enemies';
import type { EnemyKind } from '../data/types';
import { GROUND_UNITS, monoPal, rect, type Pal, type UnitFn } from './draw-ground-units';
import { circle, ellipse, fillPair, fillPoly, fillSym, flame } from './shapes';

/** Enemy aircraft art + the dispatch for every enemy kind. Noses / bows point down (+y). */

/** heading: 0 = nose down (rotates the unit); aim: turret angle, 0 = up, clockwise; bank: -1..1 roll (air). */
export interface EnemyDrawOpts { t: number; flash?: boolean; shadow?: boolean; heading?: number; aim?: number; bank?: number }

const pal = (body: string, dark: string, light: string, trim: string, glass = '#58a6bd'): Pal =>
  ({ body, dark, light, trim, glass, red: '#c8312a', line: 'rgba(12,14,16,0.6)', mono: false, live: true });

const PALS: Readonly<Record<EnemyKind, Pal>> = {
  drone: pal('#5f6368', '#3d4145', '#7f848a', '#4b4f53'),
  fishbed: pal('#a38f5e', '#6b6241', '#c2b182', '#5d693d'),
  fulcrum: pal('#6f787f', '#4b535a', '#8f989f', '#5a636a'),
  flanker: pal('#7a8794', '#525f6d', '#9eabb7', '#5f6e7d'),
  hind: pal('#6b6e45', '#47492d', '#8c8f60', '#a38f5f'),
  bear: pal('#8d959b', '#636b71', '#b0b7bc', '#798187'),
  aa: pal('#b5a274', '#3f3b2e', '#cdbd8e', '#59633f'),
  sam: pal('#8e8d85', '#4a5436', '#a9a89f', '#5d6844'),
  tank: pal('#5d6838', '#3a4123', '#7b8850', '#2c2f24'),
  radar: pal('#9c998b', '#5f5d55', '#d8dbd4', '#7f7d72', '#2b3a44'),
  depot: pal('#c6c8c0', '#6d6f69', '#e4e6e0', '#7b7869'),
  boat: pal('#8e98a0', '#4f5960', '#b0b9bf', '#3d454b', '#22303a'),
  destroyer: pal('#7f8a92', '#4f5961', '#a7b0b7', '#3d454b', '#22303a'),
};
const FLASH = monoPal('#ffffff', true);
const SILHOUETTE = monoPal('#000000', false);
const BURNT: Pal = { ...pal('#2e2a26', '#1a1816', '#3e3933', '#25221f', '#141312'), red: '#3b2a22', line: 'rgba(0,0,0,0.55)', live: false };

// fx shared with the bosses
/** Deterministic 0..1 hash. */
export function hash(n: number): number {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}

/** Three looping smoke puffs rising from (x, y) and drifting toward -y. */
export function smoke(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, t: number, seed: number): void {
  const a0 = ctx.globalAlpha;
  for (let i = 0; i < 3; i++) {
    const k = (((t * 0.5 + hash(seed) + i / 3) % 1) + 1) % 1;
    ctx.globalAlpha = a0 * (1 - k) * 0.55;
    const px = x + Math.sin(seed * 3 + k * 4) * size * 0.4 + k * size * 0.8;
    circle(ctx, px, y - k * size * 3.4, size * (0.45 + k * 1.1), k < 0.35 ? '#262422' : '#57534d');
  }
  ctx.globalAlpha = a0;
}

export function fire(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, t: number, seed: number): void {
  const f = 0.8 + 0.14 * Math.sin(t * 23 + seed * 7) + 0.08 * Math.sin(t * 41 + seed);
  ellipse(ctx, x, y - size * 0.25, size * f, size * 1.3 * f, 'rgba(255,84,24,0.6)');
  ellipse(ctx, x, y, size * 0.62 * f, size * 0.8 * f, 'rgba(255,184,56,0.9)');
  circle(ctx, x, y + size * 0.1, size * 0.28 * f, '#fff2c0');
}

/** Irregular burn mark. */
export function scorch(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, seed: number, fill = 'rgba(22,18,14,0.62)'): void {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    const d = r * (0.6 + 0.4 * hash(seed * 13 + i));
    ctx.lineTo(x + Math.cos(a) * d, y + Math.sin(a) * d); // first lineTo on an empty path acts as moveTo
  }
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}

/** Afterburner pointing backwards (-y) from (x, y), scaled by k. */
export function exhaust(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, power: number, t: number, k = 1): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(k, -k);
  flame(ctx, 0, 0, w, power, t);
  ctx.restore();
}

/** Hostile insignia at (±x, y): black disc with a red chevron pointing at the nose. */
export function roundel(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, p: Pal): void {
  for (const sx of [x, -x]) {
    circle(ctx, sx, y, r, '#151515');
    fillPoly(ctx, [sx - r * 0.72, y - r * 0.5, sx, y + r * 0.15, sx + r * 0.72, y - r * 0.5, sx + r * 0.72, y + r * 0.12, sx, y + r * 0.8, sx - r * 0.72, y + r * 0.12], p.red);
  }
}

function canopy(ctx: CanvasRenderingContext2D, y: number, rx: number, ry: number, p: Pal): void {
  ellipse(ctx, 0, y, rx, ry, p.glass);
  ellipse(ctx, -rx * 0.35, y - ry * 0.3, rx * 0.32, ry * 0.42, 'rgba(255,255,255,0.55)');
}

function blotches(ctx: CanvasRenderingContext2D, pts: readonly number[], c: string): void {
  for (let i = 0; i < pts.length; i += 5) ellipse(ctx, pts[i] ?? 0, pts[i + 1] ?? 0, pts[i + 2] ?? 1, pts[i + 3] ?? 1, c, pts[i + 4] ?? 0);
}

/** Spinning prop disc seen slightly from the front; two counter-rotating sets when `contra`. */
function prop(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, t: number, p: Pal, contra: boolean): void {
  const a0 = ctx.globalAlpha;
  const lw = ctx.lineWidth;
  ctx.globalAlpha = a0 * (p.mono ? 0.35 : 0.22);
  ellipse(ctx, x, y, r, r * 0.42, p.mono ? p.dark : '#15171a');
  ctx.globalAlpha = a0;
  ctx.strokeStyle = p.mono ? p.dark : 'rgba(25,27,30,0.75)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let k = 0; k < (contra ? 2 : 1); k++) {
    const a = t * (k ? -41 : 47);
    for (let b = 0; b < 4; b++) {
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(a + b * 1.5708) * r, y + Math.sin(a + b * 1.5708) * r * 0.42);
    }
  }
  ctx.stroke();
  ctx.lineWidth = lw;
  circle(ctx, x, y, r * 0.18, p.dark);
}

function rotor(ctx: CanvasRenderingContext2D, r: number, a: number, p: Pal): void {
  const a0 = ctx.globalAlpha;
  ctx.globalAlpha = a0 * (p.mono ? 0.3 : 0.14);
  circle(ctx, 0, 0, r, p.mono ? p.dark : '#141410');
  for (let ghost = 1; ghost >= 0; ghost--) {
    ctx.globalAlpha = a0 * (p.mono ? 1 : ghost ? 0.25 : 0.8);
    for (let i = 0; i < 5; i++) {
      const b = a - ghost * 0.16 + i * 1.2566;
      const c = Math.cos(b);
      const s = Math.sin(b);
      fillPoly(ctx, [-s * 1.2, c * 1.2, c * r - s * 0.7, s * r + c * 0.7, c * r + s * 0.7, s * r - c * 0.7, s * 1.2, -c * 1.2], p.mono ? p.dark : '#26261f');
    }
  }
  ctx.globalAlpha = a0;
  circle(ctx, 0, 0, 2.2, p.dark);
}

const drone: UnitFn = (ctx, p, t) => {
  fillSym(ctx, [0, 12, 3, 6, 13, -5, 13, -7.5, 4, -6.5, 2.5, -9, 0, -9], p.body, p.line);
  fillPair(ctx, [12, -3.5, 13.8, -3.5, 13.8, -8.5, 12.2, -8.5], p.red);
  fillSym(ctx, [0, 10.5, 2, 6.5, 2.4, -6.5, 0, -8], p.light);
  if (!p.mono) {
    circle(ctx, 0, 9.8, 1.7, p.red);
    canopy(ctx, 5.5, 1.1, 1.8, p);
  }
  prop(ctx, 0, -10, 5, t, p, false);
};

const fishbed: UnitFn = (ctx, p, t) => {
  if (p.live) exhaust(ctx, 0, -20.5, 3.6, 0.3, t);
  fillPair(ctx, [3.4, 7, 13.5, -7, 13.5, -9.5, 3.4, -9.5], p.body, p.line);
  fillPair(ctx, [3, -14.5, 8.5, -19, 8.5, -21, 3, -20], p.dark, p.line);
  fillSym(ctx, [0, 21, 2.4, 20.6, 3.2, 17, 3.8, 8, 3.9, -13, 3.3, -19, 2.4, -21, 0, -21], p.body, p.line);
  fillSym(ctx, [0, 15, 1.8, 11, 2, -18, 0, -19], p.light);
  if (p.mono) return;
  blotches(ctx, [8.5, -4.5, 2.8, 1.5, -0.7, -7.5, -6.5, 2.4, 1.4, 0.6, 1.6, 2, 1.1, 3.2, 0, -1.8, -11, 1.1, 3, 0], p.trim);
  circle(ctx, 0, 20.3, 2, p.dark);
  circle(ctx, 0, 20.3, 1, p.light);
  canopy(ctx, 11.5, 1.7, 3.6, p);
  rect(ctx, -0.6, -20.5, 1.2, 12, p.dark);
  rect(ctx, -0.6, -20.5, 1.2, 3, p.red);
  roundel(ctx, 9.6, -6.8, 2, p);
};

const fulcrum: UnitFn = (ctx, p, t) => {
  if (p.live) for (const s of [-1, 1]) exhaust(ctx, s * 5.8, -20.5, 3.8, 0.45, t + s * 0.15);
  fillPair(ctx, [9, 2, 16.5, -8, 16.5, -11, 9, -11.5], p.body, p.line);
  fillPair(ctx, [8, -14, 14.5, -18.5, 14.5, -21.5, 8, -21], p.dark, p.line);
  fillSym(ctx, [0, 23.5, 1.6, 22, 2.6, 17, 3.2, 12, 6.5, 6, 9.5, 1, 10, -8, 9, -17, 3, -17, 1.8, -14, 0, -14], p.body, p.line);
  fillPair(ctx, [3.8, 3, 8, 3, 8.2, -20.5, 3.6, -20.5], p.dark, p.line);
  fillSym(ctx, [0, 15, 1.8, 11, 2.6, -13, 0, -14], p.light);
  fillPair(ctx, [6.8, -8, 8.8, -8, 8.6, -20, 7, -20], p.trim, p.line);
  if (p.mono) return;
  fillPair(ctx, [7, -17.2, 8.6, -17.2, 8.6, -20, 7, -20], p.red);
  blotches(ctx, [12.5, -5.5, 2.4, 1.3, -0.9, -13, -7, 2, 1.2, 0.8, 0, 6, 1.3, 2.5, 0], p.trim);
  canopy(ctx, 13.5, 1.9, 4, p);
  roundel(ctx, 13.4, -7.6, 1.9, p);
};

const flanker: UnitFn = (ctx, p, t) => {
  if (p.live) for (const s of [-1, 1]) exhaust(ctx, s * 5.7, -23.5, 4.2, 0.4, t + s * 0.2);
  fillPair(ctx, [10, 3, 20, -10, 20, -13.5, 10, -13], p.body, p.line);
  fillPair(ctx, [19.4, -2, 21, -2, 21, -14.5, 19.4, -14.5], p.dark);
  fillPair(ctx, [9, -16, 16.5, -21, 16.5, -24.5, 9, -24], p.dark, p.line);
  fillSym(ctx, [0, 30, 1.8, 28, 3, 22, 3.6, 15, 6.5, 9, 10.5, 3, 11, -9, 9.5, -17, 8, -22, 3.5, -22, 2, -20, 2, -27, 0, -28.5], p.body, p.line);
  fillPair(ctx, [3.5, 5, 7.8, 5, 8, -23.5, 3.5, -23.5], p.dark, p.line);
  fillSym(ctx, [0, 20, 2, 14, 2.4, -26, 0, -27], p.light);
  fillPair(ctx, [7.6, -9, 9.6, -9, 9.4, -23, 7.8, -23], p.trim, p.line);
  if (p.mono) return;
  fillPair(ctx, [7.8, -20, 9.4, -20, 9.4, -23, 7.8, -23], p.red);
  blotches(ctx, [15, -4, 3, 1.5, -0.9, -14, -8.5, 2.6, 1.4, 0.7, 0, 8, 1.4, 3, 0, 2.2, -8, 1, 3.5, 0], p.trim);
  canopy(ctx, 18, 2, 4.8, p);
  roundel(ctx, 16, -8.6, 2.3, p);
};

const hind: UnitFn = (ctx, p, t) => {
  fillPair(ctx, [1.2, -23, 6.5, -24.5, 6.5, -26.8, 1.2, -26.5], p.body, p.line);
  fillPair(ctx, [4, 1.5, 12.5, 0.5, 12.5, -3.5, 4, -4.5], p.body, p.line);
  for (const x of [8.2, 11.8]) fillPair(ctx, [x - 1.3, 3.5, x + 1.3, 3.5, x + 1.3, -4.5, x - 1.3, -4.5], p.dark, p.line);
  fillSym(ctx, [0, 21, 2.6, 19, 3.9, 14, 4.6, 6, 4.6, -6, 3.2, -10, 1.6, -14, 1.4, -30, 0, -30.5], p.body, p.line);
  fillSym(ctx, [0, 7, 3, 5, 3.3, -7, 0, -9], p.light);
  if (!p.mono) {
    blotches(ctx, [2.2, -1, 1.3, 3, 0.2, -2.6, 12, 1.2, 2.8, -0.2, -0.6, -19, 0.9, 3, 0, 10, -1.2, 1.4, 1, 0], p.trim);
    canopy(ctx, 16.5, 2.3, 2.6, p);
    canopy(ctx, 11, 2.7, 3, p);
    rect(ctx, -0.7, -30.5, 1.4, 2.6, p.red);
  }
  ellipse(ctx, 2.6, -28.5, 0.9, 4.6, p.mono ? p.dark : 'rgba(30,30,25,0.4)'); // tail rotor
  ctx.save();
  ctx.translate(0, 1);
  rotor(ctx, 23, t * 26, p);
  ctx.restore();
};

const bear: UnitFn = (ctx, p, t) => {
  fillPair(ctx, [4.5, 10, 45, -15, 45, -19.5, 4.5, -5], p.body, p.line);
  fillPair(ctx, [3.6, -26, 16, -35, 16, -38, 2.6, -37.5], p.body, p.line);
  for (const x of [14, 29]) {
    const y = 10 - (x - 4.5) * 0.617;
    fillPair(ctx, [x - 2.3, y + 7, x + 2.3, y + 7, x + 2, y - 12, x - 2, y - 12], p.dark, p.line);
  }
  fillSym(ctx, [0, 41, 2.5, 39.5, 3.8, 36, 4.6, 28, 4.8, -20, 4, -30, 2.6, -38, 1.6, -40.5, 0, -41], p.body, p.line);
  fillSym(ctx, [0, 33, 2.4, 28, 2.6, -32, 0, -36], p.light);
  if (!p.mono) {
    canopy(ctx, 37.5, 2.3, 2.6, p);
    canopy(ctx, 31, 2.2, 2.4, p);
    rect(ctx, -0.7, -40, 1.4, 17, p.dark);
    rect(ctx, -0.4, 40, 0.8, 5, p.dark);
    rect(ctx, -0.7, -40, 1.4, 3.5, p.red);
    fillPair(ctx, [40, -12, 45, -15, 45, -19.5, 40, -17], p.red);
    roundel(ctx, 32, -11, 2.8, p);
  }
  for (const x of [-29, -14, 14, 29]) prop(ctx, x, 10 - (Math.abs(x) - 4.5) * 0.617 + 7.5, 7.5, t, p, true);
};

const DRAW: Readonly<Record<EnemyKind, UnitFn>> = { drone, fishbed, fulcrum, flanker, hind, bear, ...GROUND_UNITS };

const sprites = new Map<EnemyKind, HTMLCanvasElement>();

/** Uniform shadow: the silhouette is rendered once per kind into a sprite, then blitted at 28 % alpha. */
function drawShadow(ctx: CanvasRenderingContext2D, kind: EnemyKind): void {
  const r = Math.ceil(ENEMIES[kind].radius * 1.35 + 6);
  let c = sprites.get(kind);
  if (!c) {
    c = document.createElement('canvas');
    c.width = c.height = r * 4;
    const g = c.getContext('2d');
    if (!g) return;
    g.scale(2, 2);
    g.translate(r, r);
    g.lineWidth = 0.8;
    DRAW[kind](g, SILHOUETTE, 0, Math.PI);
    sprites.set(kind, c);
  }
  ctx.globalAlpha *= 0.28;
  ctx.drawImage(c, -r, -r, r * 2, r * 2);
}

export function drawEnemy(ctx: CanvasRenderingContext2D, kind: EnemyKind, x: number, y: number, o: EnemyDrawOpts): void {
  const heading = o.heading ?? 0;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(heading);
  if (isAir(kind)) ctx.scale(1 - Math.min(1, Math.abs(o.bank ?? 0)) * 0.3, 1);
  if (o.shadow) drawShadow(ctx, kind);
  else {
    ctx.lineWidth = 0.8;
    ctx.lineJoin = 'round';
    DRAW[kind](ctx, o.flash ? FLASH : PALS[kind], o.t, (o.aim ?? Math.PI) - heading);
  }
  ctx.restore();
}

/** Burnt wreck/crater left on the ground after a ground or sea unit dies (scrolls with terrain). */
export function drawWreck(ctx: CanvasRenderingContext2D, kind: EnemyKind, x: number, y: number, t: number): void {
  const r = ENEMIES[kind].radius;
  const seed = hash(Math.round(x) * 0.37 + r) * 100;
  const sea = kind === 'boat' || kind === 'destroyer';
  ctx.save();
  ctx.translate(x, y);
  ctx.lineWidth = 0.8;
  ctx.lineJoin = 'round';
  if (sea) ellipse(ctx, 0, 0, r * 0.75, r * 1.25, 'rgba(12,14,18,0.4)');
  else scorch(ctx, 0, 0, r * 1.3, seed, 'rgba(20,16,12,0.72)');
  ctx.save();
  ctx.rotate((hash(seed) - 0.5) * 0.7);
  ctx.scale(0.9, sea ? 0.75 : 0.9);
  if (sea) ctx.globalAlpha *= 0.7;
  if (isAir(kind)) scorch(ctx, 0, 0, r * 0.6, seed + 1, BURNT.dark);
  else DRAW[kind](ctx, BURNT, 0, seed);
  ctx.restore();
  const fx = (hash(seed + 2) - 0.5) * r * 0.6;
  const fy = (hash(seed + 3) - 0.5) * r * 0.6;
  fire(ctx, fx, fy, Math.max(2, r * 0.16), t, seed);
  smoke(ctx, fx, fy - 2, Math.max(3, r * 0.3), t, seed);
  ctx.restore();
}
