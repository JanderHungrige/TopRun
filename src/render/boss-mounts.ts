import type { BossPartDef } from '../data/bosses';
import type { BossId } from '../data/types';
import { eyes, plateShell, shell, spines } from './detail/organic';
import { bolts, glow, plate } from './detail/parts';
import { drawCached, variantOf } from './detail/sprite';
import type { Pal } from './draw-ground-units';
import { helmet, rifle } from './enemies/steppe-kit';
import { alienMono, hideInk, ink, metalInk, STEPPE_PAL, type AlienPal } from './enemies/steppe-pal';

// The alien steppe's bosses' weapon mounts in detail (doc 116), drawn at the part's centre, its gun turned by `aim`
// (heading: 0 = up, clockwise): heat-ray emitters with a glowing lens, armoured missile pods, triple and single plasma
// guns, twin lobbers; the JUGGERNAUT's are its tusks, the gun fort on its back, its riders and its tail club. Static
// housings go through the sprite cache; what turns or glows is drawn live.

type Ctx = CanvasRenderingContext2D;
export type MountFn = (ctx: Ctx, d: BossPartDef, aim: number, p: Pal) => void;

const live = (p: Pal): AlienPal => (p.mono ? alienMono(p.body) : STEPPE_PAL.wartripod);

function housing(ctx: Ctx, p: Pal, key: string, r: number, paint: (g: Ctx, a: AlienPal) => void): void {
  drawCached(ctx, `steppe-mount-${key}-${r}`, [r * 1.7, r * 1.7], (g) => paint(g, STEPPE_PAL.wartripod), variantOf(p));
}

function emitter(ctx: Ctx, d: BossPartDef, aim: number, p: Pal): void {
  const r = d.r;
  housing(ctx, p, 'emitter', r, (g, a) => {
    shell(g, 0, 0, r, r, metalInk(a), 0);
    for (let k = 0; k < 6; k++) {
      const b = (k / 6) * Math.PI * 2;
      plate(g, Math.cos(b) * r * 0.78 - 1, Math.sin(b) * r * 0.78 - 1, 2, 2, a.dark, a.ink, 0.3);
    }
    shell(g, 0, 0, r * 0.6, r * 0.6, { ...metalInk(a), base: a.dark }, 0);
  });
  const q = live(p);
  const lx = Math.sin(aim) * r * 0.22, ly = -Math.cos(aim) * r * 0.22;
  if (q.mono) return;
  glow(ctx, lx, ly, r * 1.1, '255,140,60', 0.55);
  eyes(ctx, [lx, ly], r * 0.32, '#ff9a3a', '#fff4d0');
}

function pod(ctx: Ctx, d: BossPartDef, _aim: number, p: Pal): void {
  const r = d.r;
  housing(ctx, p, 'pod', r, (g, a) => {
    plateShell(g, [-r, -r * 1.2, r, -r * 1.2, r * 1.15, r * 0.9, 0, r * 1.25, -r * 1.15, r * 0.9], ink(a), 0.8);
    bolts(g, [-r * 0.8, -r * 0.95, r * 0.8, -r * 0.95, -r * 0.9, r * 0.6, r * 0.9, r * 0.6], 0.8);
    for (let k = 0; k < 4; k++) eyes(g, [(k % 2 ? 1 : -1) * r * 0.42, (k < 2 ? -1 : 1) * r * 0.36], r * 0.24, '#1a1020', '#c8312a');
  });
}

/** A plasma gun: a domed base and `n` barrels turned to the aim, coil rings glowing teal. */
function plasma(ctx: Ctx, d: BossPartDef, aim: number, p: Pal, n: number): void {
  const r = d.r;
  housing(ctx, p, `plasma${n}`, r, (g, a) => {
    shell(g, 0, 0, r, r, metalInk(a), 0);
    bolts(g, [-r * 0.7, -r * 0.5, r * 0.7, -r * 0.5, -r * 0.7, r * 0.5, r * 0.7, r * 0.5], 0.7);
  });
  const q = live(p);
  ctx.save();
  ctx.rotate(aim - Math.PI);
  for (let k = 0; k < n; k++) {
    const x = (k - (n - 1) / 2) * r * 0.42;
    plateShell(ctx, [x - r * 0.16, 0, x + r * 0.16, 0, x + r * 0.13, r * 1.55, x - r * 0.13, r * 1.55], metalInk(q), 0.5);
    if (!q.mono) for (let c = 0; c < 2; c++) plate(ctx, x - r * 0.18, r * (0.6 + c * 0.4), r * 0.36, r * 0.12, q.trim, q.ink, 0.25);
  }
  ctx.restore();
  shell(ctx, 0, 0, r * 0.52, r * 0.52, { ...metalInk(q), base: q.light }, 0);
  if (!q.mono) eyes(ctx, [0, 0], r * 0.18, q.glow, q.core);
}

const STEPPE_GUN = (ctx: Ctx, d: BossPartDef, aim: number, p: Pal): void => {
  switch (d.weapon) {
    case 'ray': return emitter(ctx, d, aim, p);
    case 'missile': return pod(ctx, d, aim, p);
    case 'spread3': return plasma(ctx, d, aim, p, 3);
    case 'flak': return plasma(ctx, d, aim, p, 2);
    default: return plasma(ctx, d, aim, p, 1);
  }
};

/** The JUGGERNAUT's parts: tusks round a glowing throat, the gun fort, the riders, the tail club. */
function juggernautPart(ctx: Ctx, d: BossPartDef, aim: number, p: Pal): void {
  const r = d.r;
  const q = live(p);
  if (d.id === 'tusks') {
    const bone = q.mono ? hideInk(q) : { base: '#e8dcc0', dark: '#8a7a5a', light: '#fff6e0', ink: q.ink };
    spines(ctx, [-r * 0.6, 0, Math.PI * 0.7, r * 1.4, r * 0.25, r * 0.6, 0, Math.PI * 0.3, r * 1.4, r * 0.25], bone);
    shell(ctx, 0, 0, r * 0.7, r * 0.6, hideInk(q), 1);
    if (!q.mono) glow(ctx, 0, r * 0.2, r, '255,176,58', 0.5);
    return;
  }
  if (d.id === 'tail') {
    shell(ctx, 0, 0, r, r * 0.9, hideInk(q), 2);
    spines(ctx, [-r * 0.8, 0, Math.PI, r * 0.7, r * 0.2, r * 0.8, 0, 0, r * 0.7, r * 0.2, 0, -r * 0.8, -Math.PI / 2, r * 0.7, r * 0.2], hideInk(q));
    if (!q.mono) eyes(ctx, [0, 0], r * 0.25, '#ff7a3a', '#ffe2c0', true);
    return;
  }
  if (d.id === 'howdah') return plasma(ctx, d, aim, p, 2);
  ctx.save(); // a rider on the beast's flank
  ctx.rotate(aim - Math.PI);
  rifle(ctx, q, r * 0.35, r * 1.3);
  ctx.restore();
  plateShell(ctx, [-r * 0.6, -r * 0.1, -r * 0.4, -r * 0.4, r * 0.4, -r * 0.4, r * 0.6, -r * 0.1, r * 0.5, r * 0.4, -r * 0.5, r * 0.4], ink(q), 0.5);
  helmet(ctx, q, 0, r * 0.15, r * 0.35);
}

export const MOUNTS_7: Readonly<Partial<Record<BossId, MountFn>>> = {
  harvester: STEPPE_GUN,
  longshanks: STEPPE_GUN,
  juggernaut: juggernautPart,
  dreadnought: STEPPE_GUN,
  mothership: STEPPE_GUN,
};
