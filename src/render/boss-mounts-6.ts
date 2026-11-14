import type { BossPartDef } from '../data/bosses';
import type { BossId } from '../data/types';
import { eyes, shell } from './detail/organic';
import { bolts, cylinder, hatch, lens, path, plate, rectPts } from './detail/parts';
import { drawCached, variantOf } from './detail/sprite';
import type { Pal } from './draw-ground-units';
import type { MountFn } from './boss-mounts';
import { JUNGLE_6, liveOf, type Map6Boss } from './bosses-6';
import { armour, fang, glowOf, orb } from './enemies/jungle-kit';
import { bone, darkHide, hide, type JunglePal } from './enemies/jungle-pal';

// The jungle planet (map 6)'s bosses' weapon mounts in detail (doc 118), drawn at the part's centre, guns turned by `aim`
// (heading: 0 = up, clockwise), registered in CUSTOM_MOUNTS (bosses-later.ts): the RAVAGER's autocannons, triple gun and
// missile box; the SENTINEL's crystal eye in its carved socket, crystal palms and crown; the creatures' organs — the
// MANTIS's claw tips with venom glands, its ocelli and sting; the BASILISK's maw, quill clusters and tail club; the HIVE
// QUEEN's mandibles, wing-root glands, egg sac and ovipositor. Static housings go through the sprite cache.

type Ctx = CanvasRenderingContext2D;

function housing(ctx: Ctx, p: Pal, id: Map6Boss, key: string, r: number, paint: (g: Ctx, a: JunglePal) => void): void {
  drawCached(ctx, `jungle6-mount-${id}-${key}-${r}`, [r * 1.8, r * 1.8], (g) => paint(g, JUNGLE_6[id]), variantOf(p));
}

/** A worn gun turret: the armoured ring with bolts and a hatch, `n` barrels turned to the aim. */
function gun(ctx: Ctx, d: BossPartDef, aim: number, p: Pal, n: number): void {
  const r = d.r;
  housing(ctx, p, 'ravager', `gun${n}`, r, (g, a) => {
    shell(g, 0, 0, r, r, { base: a.dark, dark: '#14140c', light: a.light, ink: a.ink }, 0);
    for (let k = 0; k < 10; k++) bolts(g, [Math.cos((k / 10) * Math.PI * 2) * r * 0.84, Math.sin((k / 10) * Math.PI * 2) * r * 0.84], r * 0.06);
  });
  const q = liveOf('ravager', p);
  ctx.save();
  ctx.rotate(aim - Math.PI);
  for (let k = 0; k < n; k++) {
    const x = (k - (n - 1) / 2) * r * 0.4;
    if (q.mono) {
      ctx.fillStyle = q.body;
      ctx.fillRect(x - r * 0.15, 0, r * 0.3, r * 1.78);
    } else {
      cylinder(ctx, x - r * 0.13, r * 0.2, r * 0.26, r * 1.4, q.metal, 'y');
      plate(ctx, x - r * 0.18, r * 1.5, r * 0.36, r * 0.26, '#14140c', q.ink, 0.4); // the muzzle brake
    }
  }
  const mantlet = [-r * 0.7, r * 0.1, r * 0.7, r * 0.1, r * 0.6, r * 0.62, -r * 0.6, r * 0.62];
  if (q.mono) {
    ctx.fillStyle = q.body;
    ctx.fill(path(mantlet));
  } else armour(ctx, mantlet, q.body, q.ink, 0.6);
  ctx.restore();
  orb(ctx, q, 0, 0, r * 0.62, r * 0.62, hide(q), 0);
  if (!q.mono) hatch(ctx, -r * 0.12, -r * 0.12, r * 0.3, q.body);
}

/** The RAVAGER's missile box: six tubes with red warheads in a bolted frame. */
function missileBox(ctx: Ctx, d: BossPartDef, p: Pal): void {
  const r = d.r;
  housing(ctx, p, 'ravager', 'box', r, (g, a) => {
    armour(g, rectPts(-r * 1.1, -r * 0.85, r * 2.2, r * 1.7), a.dark, a.ink, 0.8);
    plate(g, -r * 1.1, -r * 0.85, r * 2.2, r * 0.16, a.trim, a.ink, 0.4); // the red band
    for (let i = 0; i < 3; i++) for (const y of [-0.38, 0.38]) {
      const x = (i - 1) * r * 0.7;
      shell(g, x, y * r, r * 0.27, r * 0.27, { base: '#14140c', dark: '#000000', light: '#3a3a30', ink: a.ink }, 0);
      shell(g, x, y * r + r * 0.04, r * 0.17, r * 0.17, { base: '#c8312a', dark: '#5a0a08', light: '#ff9a8a', ink: a.ink }, 0);
    }
    bolts(g, [-r * 0.98, -r * 0.72, r * 0.98, -r * 0.72, -r * 0.98, r * 0.72, r * 0.98, r * 0.72], r * 0.07);
  });
}

const RAVAGER_GUN: MountFn = (ctx, d, aim, p) => {
  switch (d.weapon) {
    case 'missile': return missileBox(ctx, d, p);
    case 'spread3': return gun(ctx, d, aim, p, 3);
    case 'flak': return gun(ctx, d, aim, p, 2);
    default: return gun(ctx, d, aim, p, 1);
  }
};

/** The SENTINEL's parts: a crystal eye in a carved socket, crystal palms that turn to the aim, a crystal crown. */
const SENTINEL_PART: MountFn = (ctx, d, aim, p) => {
  const r = d.r;
  const q = liveOf('sentinel', p);
  housing(ctx, p, 'sentinel', d.weapon, r, (g, a) => {
    shell(g, 0, 0, r, r, { base: a.dark, dark: '#2a2a22', light: a.light, ink: a.ink }, 0);
    for (let k = 0; k < 8; k++) {
      const b = (k / 8) * Math.PI * 2;
      plate(g, Math.cos(b) * r * 0.8 - r * 0.08, Math.sin(b) * r * 0.8 - r * 0.08, r * 0.16, r * 0.16, a.light, 'rgba(20,20,14,0.6)', 0.4);
    }
    shell(g, 0, 0, r * 0.66, r * 0.66, { base: '#1a2a26', dark: '#060c0a', light: '#3a5a50', ink: a.ink }, 0);
  });
  const crystal = { base: q.mono ? q.body : '#3ad8b0', dark: q.mono ? q.body : '#0a5a48', light: q.mono ? q.body : '#d8fff4', ink: q.ink };
  if (d.weapon === 'aimed') { // the eye, its pupil on the target
    glowOf(ctx, q, 0, 0, r * 1.5, 0.55);
    orb(ctx, q, 0, 0, r * 0.56, r * 0.56, crystal, 0);
    if (!q.mono) eyes(ctx, [Math.sin(aim) * r * 0.2, -Math.cos(aim) * r * 0.2], r * 0.18, '#0a3a30', q.core);
    return;
  }
  ctx.save();
  if (d.weapon !== 'missile') ctx.rotate(aim - Math.PI);
  const n = d.weapon === 'missile' ? 5 : 3;
  glowOf(ctx, q, 0, 0, r * 1.4, 0.5);
  for (let k = 0; k < n; k++) {
    const b = d.weapon === 'missile' ? (k / n) * Math.PI * 2 - Math.PI / 2 : Math.PI / 2 + (k - 1) * 0.42;
    fang(ctx, Math.cos(b) * r * 0.2, Math.sin(b) * r * 0.2, b, r * (d.weapon === 'missile' ? 0.95 : 1.25), r * 0.2, crystal);
  }
  ctx.restore();
  if (!q.mono) lens(ctx, 0, 0, r * 0.22, q.glow);
};

/** The MANTIS's organs: claw tips with venom glands, the ocelli, the sting. */
const MANTIS_PART: MountFn = (ctx, d, aim, p) => {
  const r = d.r;
  const q = liveOf('mantis', p);
  if (d.weapon === 'spread3') { // three ocelli on a chitin pad
    orb(ctx, q, 0, 0, r, r * 0.8, darkHide(q), 0);
    glowOf(ctx, q, 0, r * 0.1, r * 1.3, 0.5);
    if (!q.mono) eyes(ctx, [-r * 0.45, r * 0.1, r * 0.45, r * 0.1, 0, r * 0.45], r * 0.24, q.glow, q.core, true);
    return;
  }
  if (d.weapon === 'missile') { // the sting: a glossy sac and its barb
    fang(ctx, 0, -r * 0.4, -Math.PI / 2, r * 1.3, r * 0.34, bone(q));
    orb(ctx, q, 0, 0, r * 0.82, r, hide(q), 2);
    glowOf(ctx, q, 0, 0, r * 1.2, 0.5, '#c8ff5a');
    if (!q.mono) orb(ctx, q, 0, r * 0.1, r * 0.4, r * 0.5, { base: '#b8ff5a', dark: '#3a7a10', light: '#f0ffd0', ink: q.ink }, 0);
    return;
  }
  ctx.save(); // a claw tip on its venom gland, pointing at the target
  ctx.rotate(aim - Math.PI);
  fang(ctx, 0, r * 0.2, Math.PI / 2, r * 1.5, r * 0.36, bone(q));
  ctx.restore();
  orb(ctx, q, 0, 0, r * 0.7, r * 0.7, hide(q), 1);
  glowOf(ctx, q, 0, 0, r, 0.5);
  if (!q.mono) eyes(ctx, [0, 0], r * 0.26, q.glow, q.core);
};

/** A maw turned to the aim: dark gape, two rows of teeth, the glowing throat. */
function maw(ctx: Ctx, q: JunglePal, r: number, aim: number, lips: JunglePal['body']): void {
  ctx.save();
  ctx.rotate(aim - Math.PI);
  orb(ctx, q, 0, r * 0.1, r, r * 0.86, { ...hide(q), base: lips }, 0);
  ctx.fillStyle = q.mono ? q.body : '#2a0a0a';
  ctx.beginPath();
  ctx.ellipse(0, r * 0.25, r * 0.66, r * 0.48, 0, 0, Math.PI * 2);
  ctx.fill();
  if (!q.mono) {
    glowOf(ctx, q, 0, r * 0.25, r * 0.7, 0.75);
    for (let k = -2; k <= 2; k++) {
      fang(ctx, k * r * 0.24, r * -0.2 + Math.abs(k) * r * 0.06, Math.PI / 2, r * 0.3, r * 0.07, bone(q));
      fang(ctx, k * r * 0.24, r * 0.7 - Math.abs(k) * r * 0.06, -Math.PI / 2, r * 0.26, r * 0.06, bone(q));
    }
  }
  ctx.restore();
}

/** The BASILISK's organs: its maw, quill clusters, the tail club. */
const BASILISK_PART: MountFn = (ctx, d, aim, p) => {
  const r = d.r;
  const q = liveOf('basilisk', p);
  const gold = { base: q.trim, dark: q.mono ? q.trim : '#6a4a10', light: q.mono ? q.trim : '#fff0b0', ink: q.ink };
  if (d.weapon === 'spread3') return maw(ctx, q, r, aim, q.light);
  if (d.weapon === 'flak') { // a cluster of quills on a fleshy base
    for (let k = 0; k < 7; k++) {
      const b = (k / 7) * Math.PI * 2 - Math.PI / 2;
      fang(ctx, Math.cos(b) * r * 0.4, Math.sin(b) * r * 0.4, b, r * 1.1, r * 0.16, gold);
    }
    orb(ctx, q, 0, 0, r * 0.62, r * 0.62, hide(q), 1);
    glowOf(ctx, q, 0, 0, r * 0.8, 0.6);
    if (!q.mono) eyes(ctx, [0, 0], r * 0.2, q.glow, q.core);
    return;
  }
  for (let k = 0; k < 5; k++) { // the tail club, spiked, its bulb glowing
    const b = (k / 5) * Math.PI * 2 + Math.PI / 2;
    fang(ctx, Math.cos(b) * r * 0.6, Math.sin(b) * r * 0.6, b, r * 0.8, r * 0.18, bone(q));
  }
  orb(ctx, q, 0, 0, r * 0.85, r * 0.85, darkHide(q), 2);
  glowOf(ctx, q, 0, 0, r, 0.55);
  if (!q.mono) eyes(ctx, [0, 0], r * 0.3, q.glow, q.core);
};

/** The HIVE QUEEN's organs: her maw between the mandibles, wing-root glands, the egg sac, the ovipositor. */
const QUEEN_PART: MountFn = (ctx, d, aim, p) => {
  const r = d.r;
  const q = liveOf('queen', p);
  const pink = { base: q.mono ? q.body : '#ff7ad2', dark: q.mono ? q.body : '#7a1a5a', light: q.mono ? q.body : '#ffe0f4', ink: q.ink };
  if (d.weapon === 'spread3') return maw(ctx, q, r, aim, q.body);
  if (d.weapon === 'flak') { // the egg sac, eggs showing through
    orb(ctx, q, 0, 0, r, r, { ...pink, base: q.mono ? q.body : '#c85aa8' }, 0);
    glowOf(ctx, q, 0, 0, r * 1.3, 0.5, '#ff7ad2');
    if (!q.mono) for (const [x, y] of [[-0.35, -0.3], [0.3, -0.35], [0.4, 0.25], [-0.3, 0.35], [0, 0]] as const) {
      orb(ctx, q, x * r, y * r, r * 0.22, r * 0.26, { base: '#fff0c8', dark: '#c8a070', light: '#ffffff', ink: 'rgba(90,30,60,0.6)' }, 0);
    }
    return;
  }
  if (d.weapon === 'missile') { // the ovipositor's tip with an egg on it
    orb(ctx, q, 0, 0, r * 0.7, r, darkHide(q), 3);
    orb(ctx, q, 0, -r * 0.6, r * 0.42, r * 0.5, pink, 0);
    glowOf(ctx, q, 0, -r * 0.6, r * 0.9, 0.6, '#ff7ad2');
    return;
  }
  ctx.save(); // a wing-root gland with its barb on the target
  ctx.rotate(aim - Math.PI);
  fang(ctx, 0, r * 0.3, Math.PI / 2, r * 1.3, r * 0.3, { ...darkHide(q), light: q.light });
  ctx.restore();
  orb(ctx, q, 0, 0, r * 0.8, r * 0.8, pink, 1);
  glowOf(ctx, q, 0, 0, r * 1.1, 0.5, '#ff7ad2');
  if (!q.mono) eyes(ctx, [0, 0], r * 0.24, q.glow, q.core);
};

export const MOUNTS_6: Readonly<Partial<Record<BossId, MountFn>>> = {
  ravager: RAVAGER_GUN,
  mantis: MANTIS_PART,
  basilisk: BASILISK_PART,
  sentinel: SENTINEL_PART,
  queen: QUEEN_PART,
};

