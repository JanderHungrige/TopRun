import type { Pal, UnitFn } from '../draw-ground-units';
import { eyes, limb, plateShell, shell } from '../detail/organic';
import { bolts, cable, cylinder, glow, grille, plate } from '../detail/parts';
import { detailUnit } from '../detail/unit';
import { art } from './steppe-kit';
import { hideInk, ink, metalInk, type AlienPal } from './steppe-pal';

// The invasion's machines in detail (docs 105, 115), heads down (+y): the tripod — a domed, plated hull with vents and a
// teal light band on three long hydraulic legs, its heat-ray emitter glowing hotter before it fires; the siege crawler —
// an armoured beetle of overlapping bolted plates on eight stubby legs, its lobbing tube turning to the target; the
// plasma cannon — a ring of bio-sacs round a hexagonal base with cables, twin coil barrels turning, its core pulsing; the
// war tripod — map 7's mini-boss, an armoured head with a visor slit, missile pods and two emitters on heavy legs.

type Ctx = CanvasRenderingContext2D;

/** Three long legs, each with a hydraulic piston beside its upper strut, lifting in turn. */
function tripodLegs(ctx: Ctx, p: AlienPal, t: number, reach: number, w: number): void {
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + Math.PI / 2;
    const lift = Math.max(0, Math.sin(t * 2.2 + i * 2.1)) * reach * 0.18;
    const fx = Math.cos(a) * (reach - lift), fy = Math.sin(a) * (reach - lift);
    const kx = fx * 0.55 + Math.cos(a + 0.5) * reach * 0.17, ky = fy * 0.55 + Math.sin(a + 0.5) * reach * 0.17;
    limb(ctx, [Math.cos(a) * w * 2, Math.sin(a) * w * 2, kx, ky], w * 1.1, metalInk(p));
    limb(ctx, [Math.cos(a) * w * 3.2 + Math.cos(a + 1.2) * w, Math.sin(a) * w * 3.2 + Math.sin(a + 1.2) * w, kx * 0.9, ky * 0.9], w * 0.4, { ...metalInk(p), base: p.light });
    limb(ctx, [kx, ky, fx, fy], w * 0.85, metalInk(p));
    shell(ctx, fx, fy, w * 1.3, w * 1.3, { ...metalInk(p), base: p.light }, 0);
  }
}

/** A heat-ray emitter's glow, hotter just before it fires. */
function heat(ctx: Ctx, p: AlienPal, x: number, y: number, r: number, t: number): void {
  if (p.mono) return;
  const h = 0.5 + 0.5 * Math.sin(t * 5);
  glow(ctx, x, y, r * 2.4, `255,${Math.round(90 + h * 120)},60`, 0.5 + h * 0.4);
  eyes(ctx, [x, y], r * 0.5, `rgb(255,${Math.round(110 + h * 110)},70)`, '#fff4d0');
}

/** A domed machine hull: radial armour plates, vents at the back, the teal band, sensor eyes and the emitter housing. */
function hull(ctx: Ctx, p: AlienPal, rx: number, ry: number, emitters: readonly number[]): void {
  shell(ctx, 0, 0, rx, ry, metalInk(p), 0);
  for (let k = 0; k < 3; k++) {
    const a0 = -Math.PI / 2 + (k * Math.PI * 2) / 3 + 0.2, a1 = a0 + (Math.PI * 2) / 3 - 0.4;
    const pts: number[] = [];
    for (let s = 0; s <= 6; s++) {
      const a = a0 + ((a1 - a0) * s) / 6;
      pts.push(Math.cos(a) * rx * 0.95, Math.sin(a) * ry * 0.95);
    }
    for (let s = 6; s >= 0; s--) {
      const a = a0 + ((a1 - a0) * s) / 6;
      pts.push(Math.cos(a) * rx * 0.62, Math.sin(a) * ry * 0.62);
    }
    plateShell(ctx, pts, ink(p), 0.5);
  }
  grille(ctx, -rx * 0.35, -ry * 0.92, rx * 0.7, ry * 0.25, 4, 'y');
  shell(ctx, 0, -ry * 0.18, rx * 0.55, ry * 0.45, { ...metalInk(p), base: p.light, light: '#e8e4f4' }, 1);
  ctx.strokeStyle = p.trim;
  ctx.lineWidth = Math.max(0.8, rx * 0.07);
  ctx.beginPath();
  ctx.ellipse(0, 0, rx * 0.8, ry * 0.8, 0, 0.35, Math.PI - 0.35);
  ctx.stroke();
  eyes(ctx, [-rx * 0.42, ry * 0.36, rx * 0.42, ry * 0.36], Math.max(0.7, rx * 0.07), p.glow, p.core, true);
  for (let i = 0; i < emitters.length; i += 2) shell(ctx, emitters[i] ?? 0, emitters[i + 1] ?? 0, rx * 0.3, rx * 0.3, { ...metalInk(p), base: p.dark }, 0);
}

const TRIPOD = art('tripod', {
  under: (ctx, p, t) => tripodLegs(ctx, p, t, 24, 2.4),
  body: (ctx, p) => hull(ctx, p, 12, 11, [0, 9]),
  over: (ctx, p, t) => heat(ctx, p, 0, 9, 3.6, t),
});

const WARTRIPOD = art('wartripod', {
  under: (ctx, p, t) => tripodLegs(ctx, p, t * 0.7, 54, 5),
  body: (ctx, p) => {
    for (const s of [-1, 1]) { // missile pods
      plateShell(ctx, [s * 22, -16, s * 35, -12, s * 35, 4, s * 22, 2], ink(p));
      for (let k = 0; k < 3; k++) eyes(ctx, [s * 30, -9 + k * 4.6], 1.4, '#1a1020', '#3a2a40');
      bolts(ctx, [s * 24, -13, s * 33, -10, s * 33, 2], 0.45);
    }
    hull(ctx, p, 27, 24, [-15, 16, 15, 16]);
    plateShell(ctx, [-14, -14, 14, -14, 18, -2, 10, 6, -10, 6, -18, -2], { ...metalInk(p), base: p.light }, 0.7); // the armoured head
    plateShell(ctx, [-8, 1, 8, 1, 6, 5, -6, 5], { base: p.glow, dark: '#7a1a6a', light: p.core, ink: p.ink }, 0.5); // visor slit
    bolts(ctx, [-12, -11, 12, -11, -15, -3, 15, -3], 0.5);
  },
  over: (ctx, p, t) => {
    for (const s of [-1, 1]) heat(ctx, p, s * 15, 16, 5, t + s);
  },
});

const SIEGEBUG = art('siegebug', {
  under: (ctx, p, t) => {
    for (let i = 0; i < 4; i++) for (const s of [-1, 1]) {
      const g = Math.sin(t * 3 + i * 1.6 + (s > 0 ? 1 : 0)) * 2.5;
      limb(ctx, [s * 14, -14 + i * 9, s * 20, -15 + i * 9 + g * 0.5, s * 24, -12 + i * 9 + g], 2.2, ink(p));
    }
  },
  body: (ctx, p) => {
    shell(ctx, 0, 0, 19, 26, ink(p), 0);
    for (let k = 0; k < 5; k++) { // overlapping armour plates, back to front
      const y = -22 + k * 9.5;
      const w = 18 - Math.abs(k - 2) * 2.2;
      plateShell(ctx, [-w, y + 4, -w * 0.7, y - 1, w * 0.7, y - 1, w, y + 4, w * 0.8, y + 8, -w * 0.8, y + 8], ink(p), 0.6);
      bolts(ctx, [-w * 0.75, y + 3.5, w * 0.75, y + 3.5], 0.5);
    }
    plate(ctx, -1, -24, 2, 44, p.trim, p.ink, 0.25);
    shell(ctx, 0, 24, 10, 7, { ...ink(p), base: p.dark }, 1);
    for (const s of [-1, 1]) limb(ctx, [s * 4, 29, s * 7, 33, s * 3, 35], 1.4, { ...ink(p), base: p.light });
    eyes(ctx, [-4.5, 26.5, 4.5, 26.5, -2, 28.5, 2, 28.5], 1, p.glow, p.core, true);
  },
  over: (ctx, p, _t, aim) => {
    ctx.save();
    ctx.translate(0, -4);
    ctx.rotate(aim - Math.PI);
    plateShell(ctx, [-3.8, -2, 3.8, -2, 3, 16, -3, 16], metalInk(p), 0.6);
    if (p.mono) plateShell(ctx, [-2.4, 13, 2.4, 13, 2.4, 16.4, -2.4, 16.4], metalInk(p), 0.3);
    else {
      cylinder(ctx, -2.4, 13, 4.8, 3.4, p.dark, 'x');
      glow(ctx, 0, 16.6, 3.4, '255,122,58', 0.7);
    }
    ctx.restore();
    shell(ctx, 0, -4, 6, 6, { ...metalInk(p), base: p.light }, 0);
  },
});

const PLASMAGUN = art('plasmagun', {
  body: (ctx, p) => {
    for (let i = 0; i < 8; i++) { // the ring of bio-sacs
      const a = (i / 8) * Math.PI * 2;
      shell(ctx, Math.cos(a) * 15.5, Math.sin(a) * 15.5, 6, 4.5, hideInk(p), 1, a + Math.PI / 2);
    }
    cable(ctx, [-8, 2, -12, 8, -16, 6], 1, p.dark);
    cable(ctx, [8, -2, 13, -7, 17, -4], 1, p.dark);
    plateShell(ctx, [-9.5, -5.5, 0, -11, 9.5, -5.5, 9.5, 5.5, 0, 11, -9.5, 5.5], metalInk(p), 0.7); // hexagonal base
    plateShell(ctx, [-6, -3.5, 0, -7, 6, -3.5, 6, 3.5, 0, 7, -6, 3.5], ink(p), 0.4);
    bolts(ctx, [-8, -4.5, 8, -4.5, -8, 4.5, 8, 4.5, 0, -9.5, 0, 9.5], 0.45);
  },
  over: (ctx, p, t, aim) => {
    ctx.save();
    ctx.rotate(aim - Math.PI);
    for (const dx of [-3, 3]) { // twin coil barrels
      plateShell(ctx, [dx - 1.9, 2, dx + 1.9, 2, dx + 1.6, 19, dx - 1.6, 19], metalInk(p), 0.5);
      for (let k = 0; k < 3; k++) plate(ctx, dx - 2.1, 6 + k * 4, 4.2, 1.2, p.trim, p.ink, 0.2);
    }
    ctx.restore();
    shell(ctx, 0, 0, 5.5, 5.5, { ...metalInk(p), base: p.light }, 0);
    if (p.mono) return;
    const coil = 0.5 + 0.5 * Math.sin(t * 6);
    glow(ctx, 0, 0, 6, '255,74,216', 0.5 + coil * 0.4);
    eyes(ctx, [0, 0], 2, p.glow, p.core);
  },
});

export const STEPPE_MACHINES: Readonly<Record<'tripod' | 'siegebug' | 'plasmagun' | 'wartripod', UnitFn>> = {
  tripod: detailUnit('tripod', TRIPOD),
  siegebug: detailUnit('siegebug', SIEGEBUG),
  plasmagun: detailUnit('plasmagun', PLASMAGUN),
  wartripod: detailUnit('wartripod', WARTRIPOD),
};

export const steppeMachinePals = (pal: (body: string, dark: string, light: string, trim: string, glass?: string) => Pal): Readonly<Record<keyof typeof STEPPE_MACHINES, Pal>> => ({
  tripod: pal('#6a6478', '#2e2a38', '#a8a2b8', '#3ad8c8', '#ff4ad8'),
  siegebug: pal('#5a4a5e', '#2a2030', '#8a7a90', '#3ad8c8', '#ff7a3a'),
  plasmagun: pal('#5a5a6a', '#2a2a36', '#9898a8', '#3ad8c8', '#ff4ad8'),
  wartripod: pal('#585266', '#262230', '#98928e', '#3ad8c8', '#ff4ad8'),
});
