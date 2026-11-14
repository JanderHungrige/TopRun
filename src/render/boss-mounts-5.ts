import type { BossPartDef } from '../data/bosses';
import type { BossId } from '../data/types';
import type { MountFn } from './boss-mounts';
import { liveOf, ORGAN, SEA_5, type Map5Boss } from './bosses-5';
import { shade } from './detail/color';
import { plateShell, shell, spines, veins } from './detail/organic';
import { bolts, glow } from './detail/parts';
import { drawCached, variantOf } from './detail/sprite';
import type { Pal } from './draw-ground-units';
import { tubeMouth, turret } from './enemies/sea-arms';
import { hullInk, metalInk, rgb, rgba, type SeaPal } from './enemies/sea-pal';

// The detailed weapon mounts of the sea's bosses (map 4; the file keeps the world's old number, doc 120), drawn at the
// part's centre, guns turned by `aim` (heading: 0 = up, clockwise), registered in CUSTOM_MOUNTS (bosses-later.ts). The
// machines' are armoured rings with single, twin and triple turrets, the BARRACUDA's bow torpedo tubes and the BASTION's
// missile silo; the monsters' are organs — the MEDUSA's glowing bulbs, the GOLIATH's eyes that follow the player, its
// tentacle clubs and ink sac, the JORMUNGAND's bony crest and the glands along its body. Static housings go through the
// sprite cache; what turns or glows is drawn live.

type Ctx = CanvasRenderingContext2D;

function housing(ctx: Ctx, id: Map5Boss, p: Pal, key: string, r: number, paint: (g: Ctx, a: SeaPal) => void): void {
  drawCached(ctx, `sea-mount-${id}-${key}-${r}`, [r * 1.7, r * 1.7], (g) => paint(g, SEA_5[id]), variantOf(p));
}

/** An armoured gun ring: plates and bolts round a dark well. */
function gunRing(g: Ctx, a: SeaPal, r: number): void {
  shell(g, 0, 0, r, r, hullInk(a), 0);
  for (let i = 0; i < 8; i++) {
    const b0 = (i / 8) * Math.PI * 2 + 0.05, b1 = b0 + Math.PI / 4 - 0.1, c = Math.cos, s = Math.sin;
    plateShell(g, [c(b0) * r * 0.96, s(b0) * r * 0.96, c(b1) * r * 0.96, s(b1) * r * 0.96, c(b1) * r * 0.7, s(b1) * r * 0.7, c(b0) * r * 0.7, s(b0) * r * 0.7], hullInk(a), r * 0.03);
  }
  bolts(g, Array.from({ length: 8 }, (_, i) => [Math.cos(i * 0.785 + 0.39) * r * 0.83, Math.sin(i * 0.785 + 0.39) * r * 0.83]).flat(), r * 0.05);
  shell(g, 0, 0, r * 0.68, r * 0.68, { base: a.dark, dark: '#05080c', light: a.hull, ink: a.ink }, 0);
}

function turned(ctx: Ctx, id: Map5Boss, d: BossPartDef, aim: number, p: Pal, n: number, k: number, len: number): void {
  housing(ctx, id, p, 'ring', d.r, (g, a) => gunRing(g, a, d.r));
  ctx.save();
  ctx.rotate(aim - Math.PI);
  turret(ctx, liveOf(id, p), d.r * k, n, len);
  ctx.restore();
}

/** A bow torpedo tube: the bolted mouth, its torpedo's nose, the shutter doors folded back. */
function tube(ctx: Ctx, id: Map5Boss, d: BossPartDef, p: Pal): void {
  housing(ctx, id, p, 'tube', d.r, (g, a) => {
    for (const s of [-1, 1]) plateShell(g, [s * d.r * 0.7, -d.r * 0.9, s * d.r * 1.15, -d.r * 0.6, s * d.r * 1.15, d.r * 0.6, s * d.r * 0.7, d.r * 0.9], metalInk(a), d.r * 0.05);
    tubeMouth(g, a, 0, 0, d.r * 0.9, '#9aa0a8');
  });
}

/** The fortress's missile silo: an armoured lid ring with four cells, red noses waiting in them, hazard marks. */
function silo(ctx: Ctx, id: Map5Boss, d: BossPartDef, p: Pal): void {
  const r = d.r;
  housing(ctx, id, p, 'silo', r, (g, a) => {
    gunRing(g, a, r);
    for (const [x, y] of [[-1, -1], [1, -1], [-1, 1], [1, 1]] as const) tubeMouth(g, a, x * r * 0.32, y * r * 0.32, r * 0.27, '#c8312a');
    g.fillStyle = a.trim;
    for (let k = 0; k < 4; k++) g.fillRect(-r * 0.06, -r * 0.62 + k * r * 0.34, r * 0.12, r * 0.16);
  });
}

function gun(id: Map5Boss): MountFn {
  return (ctx, d, aim, p) => {
    switch (d.weapon) {
      case 'missile': return id === 'barracuda' ? tube(ctx, id, d, p) : silo(ctx, id, d, p);
      case 'flak': return turned(ctx, id, d, aim, p, 2, 0.62, 2.1);
      case 'spread3': return turned(ctx, id, d, aim, p, 3, 0.72, 1.8);
      case 'aimed': case 'single': case 'none': case 'ring': case 'ray': return turned(ctx, id, d, aim, p, 1, 0.74, 2.3);
      default: throw new Error(`unhandled: ${d.weapon satisfies never}`);
    }
  };
}

/** The direction a part looks, `k` of the way to its rim. */
const look = (aim: number, k: number): readonly [number, number] => [Math.sin(aim) * k, -Math.cos(aim) * k];

/** A glowing gland: a fleshy sac with veins and a rim of bumps; its core glows in its weapon's colour, turned to the aim. */
function gland(ctx: Ctx, id: Map5Boss, d: BossPartDef, aim: number, p: Pal): void {
  const r = d.r;
  housing(ctx, id, p, 'gland', r, (g, a) => {
    for (let k = 0; k < 10; k++) shell(g, Math.cos(k * 0.628) * r * 0.92, Math.sin(k * 0.628) * r * 0.92, r * 0.24, r * 0.24, hullInk(a), 0);
    shell(g, 0, 0, r * 0.9, r * 0.9, { base: shade(a.hull, 0.1), dark: a.dark, light: a.light, ink: a.ink }, 0);
    veins(g, 0, 0, [r * 0.3, -r * 0.5, r * 0.2, -r * 0.85, -r * 0.5, r * 0.1, -r * 0.85, r * 0.2, r * 0.4, r * 0.4, r * 0.7, r * 0.6], rgba(a.dark, 0.7), r * 0.06);
    shell(g, 0, 0, r * 0.55, r * 0.55, { base: '#1a0a14', dark: '#050206', light: '#5a3a4a', ink: a.ink }, 0);
  });
  const q = liveOf(id, p);
  if (q.mono) return;
  const c = ORGAN[d.weapon], [lx, ly] = look(aim, r * 0.18);
  glow(ctx, lx, ly, r * 1.2, rgb(c), 0.5);
  shell(ctx, lx, ly, r * 0.36, r * 0.36, { base: c, dark: shade(c, -0.4), light: '#ffffff', ink: 'rgba(0,0,0,0.5)' }, 0);
}

/** The squid's eye: a socket of skin, the dark glossy ball, an amber iris and pupil turned to the player. */
function eye(ctx: Ctx, d: BossPartDef, aim: number, p: Pal): void {
  const r = d.r;
  housing(ctx, 'goliath', p, 'eye', r, (g, a) => {
    shell(g, 0, 0, r * 1.15, r * 1.05, hullInk(a), 1);
    shell(g, 0, 0, r * 0.88, r * 0.85, { base: '#2a2a36', dark: '#06060a', light: '#8a8aa0', ink: a.ink }, 0);
    g.strokeStyle = 'rgba(220,226,236,0.7)';
    g.lineWidth = r * 0.06;
    g.beginPath();
    g.arc(0, 0, r * 0.78, 0, Math.PI * 2);
    g.stroke();
  });
  const q = liveOf('goliath', p);
  if (q.mono) return;
  const [lx, ly] = look(aim, r * 0.22);
  shell(ctx, lx, ly, r * 0.52, r * 0.52, { base: ORGAN[d.weapon], dark: '#8a5a10', light: '#fff4c0', ink: 'rgba(0,0,0,0.6)' }, 0);
  ctx.fillStyle = '#05050a';
  ctx.beginPath();
  ctx.ellipse(lx * 1.25, ly * 1.25, r * 0.36, r * 0.2, aim, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.beginPath();
  ctx.arc(-r * 0.3, -r * 0.32, r * 0.13, 0, Math.PI * 2);
  ctx.fill();
}

/** A tentacle club: a broad pad with rings of suckers and hooks round a light organ. */
function club(ctx: Ctx, d: BossPartDef, aim: number, p: Pal): void {
  const r = d.r;
  housing(ctx, 'goliath', p, 'club', r, (g, a) => {
    shell(g, 0, 0, r * 0.95, r * 1.25, hullInk(a), 0);
    for (let k = 0; k < 12; k++) {
      const b = (k / 12) * Math.PI * 2, x = Math.cos(b) * r * 0.62, y = Math.sin(b) * r * 0.86;
      shell(g, x, y, r * 0.16, r * 0.16, { base: a.light, dark: a.hull, light: '#ffffff', ink: a.ink }, 0);
      spines(g, [x, y, b, r * 0.2, r * 0.05], metalInk(a));
    }
  });
  gland(ctx, 'goliath', { ...d, r: r * 0.5 }, aim, p);
}

/** The ink sac on the mantle's back: a dark glossy bag with veins, its siphon turned to the aim. */
function inkSac(ctx: Ctx, d: BossPartDef, aim: number, p: Pal): void {
  const r = d.r;
  housing(ctx, 'goliath', p, 'ink', r, (g, a) => {
    shell(g, 0, 0, r, r * 1.1, { base: '#2a1a2a', dark: '#06030a', light: '#7a5a7a', ink: a.ink }, 0);
    veins(g, 0, r * 0.4, [-r * 0.6, 0, -r * 0.5, -r * 0.8, r * 0.5, 0, r * 0.4, -r * 0.8, 0, -r * 0.3, r * 0.1, -r], rgba(a.hull, 0.55), r * 0.06);
  });
  const q = liveOf('goliath', p);
  ctx.save();
  ctx.rotate(aim - Math.PI);
  plateShell(ctx, [-r * 0.28, 0, r * 0.28, 0, r * 0.2, r * 1.3, -r * 0.2, r * 1.3], hullInk(q), r * 0.05);
  ctx.restore();
  if (!q.mono) glow(ctx, 0, 0, r * 0.9, rgb(ORGAN[d.weapon]), 0.4);
}

/** The serpent's crest: bony spines fanned back over a fleshy base, three glands glowing in a triangle. */
function crest(ctx: Ctx, d: BossPartDef, aim: number, p: Pal): void {
  const r = d.r;
  housing(ctx, 'jormungand', p, 'crest', r, (g, a) => {
    const bone = { base: a.metal, dark: shade(a.metal, -0.5), light: '#ffffff', ink: a.ink };
    const fan: number[] = [];
    for (let k = 0; k < 7; k++) fan.push(Math.cos(Math.PI * (1.15 + k * 0.117)) * r * 0.4, Math.sin(Math.PI * (1.15 + k * 0.117)) * r * 0.4, Math.PI * (1.15 + k * 0.117), r * 0.95, r * 0.12);
    spines(g, fan, bone);
    shell(g, 0, 0, r * 0.62, r * 0.55, hullInk(a), 1);
  });
  const q = liveOf('jormungand', p);
  if (q.mono) return;
  for (let k = 0; k < 3; k++) {
    const b = aim + (k / 3) * Math.PI * 2, x = Math.sin(b) * r * 0.26, y = -Math.cos(b) * r * 0.24;
    glow(ctx, x, y, r * 0.45, rgb(ORGAN[d.weapon]), 0.6);
    shell(ctx, x, y, r * 0.13, r * 0.13, { base: ORGAN[d.weapon], dark: '#6a1a5a', light: '#ffffff', ink: 'rgba(0,0,0,0.5)' }, 0);
  }
}

function organ(id: Map5Boss): MountFn {
  return (ctx, d, aim, p) => {
    if (id === 'goliath' && d.id.startsWith('eye')) return eye(ctx, d, aim, p);
    if (id === 'goliath' && d.id.startsWith('arm')) return club(ctx, d, aim, p);
    if (id === 'goliath') return inkSac(ctx, d, aim, p);
    if (id === 'jormungand' && d.id === 'head') return crest(ctx, d, aim, p);
    return gland(ctx, id, d, aim, p);
  };
}

export const MOUNTS_5: Readonly<Partial<Record<BossId, MountFn>>> = {
  barracuda: gun('barracuda'),
  medusa: organ('medusa'),
  bastion: gun('bastion'),
  goliath: organ('goliath'),
  jormungand: organ('jormungand'),
};
