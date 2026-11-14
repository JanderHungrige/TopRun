import type { UnitFn } from '../draw-ground-units';
import { limb, shell } from '../detail/organic';
import { bolts, cylinder, grille, hatch, plate, rectPts } from '../detail/parts';
import { detailUnit } from '../detail/unit';
import { DROPSHIP, GUNDRONE } from './jungle-craft';
import { armour, cachedPart, glowOf, variantFor, wear } from './jungle-kit';
import { art, JUNGLE_PAL, metal, type JunglePal } from './jungle-pal';

// The jungle planet's war machines in detail (docs 81, 117), fronts down (+y): the enemy walker — a worn, plated hull
// with an engine grille, a hatch, shoulder plates, two gun pods and a glowing visor with its red sensor, turning to its
// aim on a hip girder, its splayed feet striding on hydraulic legs; the brute — the walker at 2.6 times the size with
// missile racks on its shoulders; the hover tank — a skirted hull with lift-fan grilles and sponsons on a swirling dust
// cushion, its twin-barrel turret turning, the front lamps flickering; the artillery gun — a sandbag ring round a
// turntable with shells and a crate, the long barrel with its recoil cylinders and muzzle brake turning to its target.
// The gun drone and the dropship are in jungle-craft.ts.

type Ctx = CanvasRenderingContext2D;

/** A walker's foot (scale 1): a splayed plate with three toes forward and a heel spur round the ankle. */
function footPaint(g: Ctx, a: JunglePal): void {
  armour(g, [-2.4, -5, 2.4, -5, 3.3, 0.5, 3.5, 4.4, 1.4, 5.8, -1.4, 5.8, -3.5, 4.4, -3.3, 0.5], a.dark, a.ink, 0.45);
  for (const x of [-2.3, 0, 2.3]) armour(g, rectPts(x - 0.75, 3.4, 1.5, 3), a.metal, a.ink, 0.3);
  plate(g, -1, -6.4, 2, 2, a.metal, a.ink, 0.3);
  bolts(g, [-1.7, -3.6, 1.7, -3.6, -2.2, 1.6, 2.2, 1.6], 0.32);
  shell(g, 0, -0.6, 1.9, 1.9, metal(a), 0);
}

/** Two legs at scale k, the feet striding in turn under the hip girder. */
function walkerLegs(ctx: Ctx, p: JunglePal, live: JunglePal, key: string, t: number, k: number): void {
  const step = Math.sin(t * 4) * 5 * k;
  for (const side of [-1, 1]) {
    const fy = (side < 0 ? step : -step) - 2 * k;
    ctx.save();
    ctx.translate(side * 8 * k, fy);
    ctx.scale(k, k);
    cachedPart(ctx, `${key}-foot`, [4, 7], p, live, footPaint);
    ctx.restore();
    const kx = side * 12 * k, ky = fy * 0.45 - 1.5 * k;
    limb(ctx, [side * 6 * k, 0, kx, ky, side * 8 * k, fy - 0.6 * k], 2.4 * k, metal(p));
    limb(ctx, [side * 7.5 * k, -1.6 * k, kx * 0.92, ky - 0.8 * k], 0.8 * k, { ...metal(p), base: p.light }); // the piston
  }
}

/** The hip girder the hull turns on: a beam with two hip drums, bolts and hydraulic lines. */
function hips(g: Ctx, a: JunglePal): void {
  armour(g, [-9.5, -3, 9.5, -3, 11, 0, 9.5, 3, -9.5, 3, -11, 0], a.metal, a.ink, 0.5);
  for (const s of [-1, 1]) {
    shell(g, s * 8.2, 0, 3.4, 3.4, { base: a.dark, dark: '#14140c', light: a.light, ink: a.ink }, 0);
    shell(g, s * 8.2, 0, 1.5, 1.5, metal(a), 0);
  }
  bolts(g, [-4, -1.8, 4, -1.8, -4, 1.8, 4, 1.8], 0.35);
}

/** The walker's hull at scale 1 (the caller scales): armour, engine grille, plates, gun pods and the visor. */
function walkerHull(g: Ctx, a: JunglePal): void {
  for (const s of [-1, 1]) { // gun pods with their barrels
    armour(g, [s * 10, -3, s * 14.2, -2.4, s * 14.2, 8.6, s * 10, 9], a.dark, a.ink, 0.45);
    cylinder(g, s * 12.1 - 1, 8.4, 2, 4.4, a.metal, 'y');
    plate(g, s * 12.1 - 1.4, 11.8, 2.8, 1.2, '#1a1a12', a.ink, 0.3);
    grille(g, s * 12.1 - 1.3, -1.4, 2.6, 5, 4);
  }
  armour(g, [-8, -8.2, 8, -8.2, 10.2, -6, 10.2, 5, 8, 7.2, -8, 7.2, -10.2, 5, -10.2, -6], a.body, a.ink, 0.6);
  armour(g, [-8.6, -7.6, 8.6, -7.6, 8.6, -4.6, -8.6, -4.6], a.light, a.ink, 0.35); // the light top strip
  grille(g, -5.5, -7.3, 11, 2.4, 6, 'y'); // engine deck
  for (const s of [-1, 1]) {
    armour(g, [s * 3.2, -3.8, s * 9.2, -3.8, s * 9.2, 0.6, s * 3.2, 0.2], a.body, a.ink, 0.35); // shoulder plates
    bolts(g, [s * 4, -3, s * 8.4, -3, s * 8.4, -0.2], 0.3);
    cylinder(g, s * 7.2 - 0.7, -10, 1.4, 2.2, '#2a2a20', 'y'); // exhaust stubs
  }
  hatch(g, 0, -1.6, 1.9, a.body);
  armour(g, [-6, 1.4, 6, 1.4, 6.6, 7, -6.6, 7], a.dark, a.ink, 0.4); // the cockpit block
  plate(g, -4, 3, 8, 4, a.glow, a.ink, 0.35); // the visor
  g.fillStyle = 'rgba(255,240,200,0.45)';
  g.fillRect(-3.6, 3.3, 7.2, 0.9);
  g.fillStyle = '#c8312a';
  g.beginPath();
  g.arc(0, 5.2, 1.2, 0, Math.PI * 2);
  g.fill();
  wear(g, [-9, -2, -7.4, -1.4, 6.6, 4.6, 8.4, 5.2, -2, -5.2, 0.4, -5.6, 9.4, -5, 9.6, -3]);
}

/** The turning hull at scale k, its visor and red sensor glowing (live). */
function walkerTop(ctx: Ctx, p: JunglePal, live: JunglePal, key: string, t: number, aim: number, k: number): void {
  ctx.save();
  ctx.rotate(aim - Math.PI);
  ctx.scale(k, k);
  cachedPart(ctx, `${key}-hull`, [15, 13.5], p, live, walkerHull);
  glowOf(ctx, p, 0, 5, 5, 0.35 + 0.15 * Math.sin(t * 3));
  glowOf(ctx, p, 0, 5.2, 2.6, 0.7, '#ff3a2a');
  ctx.restore();
}

const WALKER = art('walker', {
  under: (ctx, p, t) => walkerLegs(ctx, p, JUNGLE_PAL.walker, 'walker', t, 1),
  body: hips,
  over: (ctx, p, t, aim) => walkerTop(ctx, p, JUNGLE_PAL.walker, 'walker', t, aim, 1),
});

/** A missile rack: a framed box of six tubes with red warheads. */
function rack(g: Ctx, a: JunglePal): void {
  armour(g, [-8, -7, 8, -7, 8, 7, -8, 7], a.trim, a.ink, 0.5);
  for (let i = 0; i < 3; i++) for (const y of [-2.6, 2.6]) {
    g.fillStyle = '#14140c';
    g.beginPath();
    g.arc(-4.6 + i * 4.6, y, 1.8, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#c8312a';
    g.beginPath();
    g.arc(-4.6 + i * 4.6, y + 0.3, 1.1, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = 'rgba(255,220,200,0.6)';
    g.fillRect(-5 + i * 4.6, y - 0.2, 0.5, 0.5);
  }
  bolts(g, [-7, -6, 7, -6, -7, 6, 7, 6], 0.4);
}

const BRUTE = art('brute', {
  under: (ctx, p, t) => walkerLegs(ctx, p, JUNGLE_PAL.brute, 'brute', t * 0.6, 2.6),
  body: (ctx, p) => {
    for (const s of [-1, 1]) armour(ctx, [s * 25, -8, s * 34, -5, s * 34, 5, s * 25, 8], p.dark, p.ink, 0.8); // hip armour
    ctx.save();
    ctx.scale(2.6, 2.6);
    hips(ctx, p);
    ctx.restore();
  },
  over: (ctx, p, t, aim) => {
    walkerTop(ctx, p, JUNGLE_PAL.brute, 'brute', t * 0.6, aim, 2.6);
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.translate(side * 18, -23);
      cachedPart(ctx, 'brute-rack', [9, 8], p, JUNGLE_PAL.brute, rack);
      ctx.restore();
    }
  },
});

/** The hover tank's skirted hull: rubber skirt, deck, sponsons, lift-fan grilles, lamp sockets, stowage. */
function hoverHull(g: Ctx, a: JunglePal): void {
  g.fillStyle = '#26221a';
  g.beginPath();
  g.roundRect(-13.6, -17.6, 27.2, 35.2, 8.6);
  g.fill();
  const deck = new Path2D();
  deck.roundRect(-12, -16, 24, 32, 7);
  g.fillStyle = a.body;
  g.fill(deck);
  g.strokeStyle = a.ink;
  g.lineWidth = 0.6;
  g.stroke(deck);
  for (const s of [-1, 1]) armour(g, [s * 8.6, -11, s * 11.6, -9, s * 11.6, 9, s * 8.6, 11], a.dark, a.ink, 0.4); // sponsons
  armour(g, [-8, 8, 8, 8, 7, 15, -7, 15], a.light, a.ink, 0.4); // the glacis
  grille(g, -8, -13, 16, 3.6, 7, 'y'); // lift-fan grilles (the two stripes)
  grille(g, -6, 9.2, 12, 2.4, 6, 'y');
  for (const s of [-1, 1]) {
    g.fillStyle = '#16140e'; // lamp sockets
    g.beginPath();
    g.arc(s * 8, 14, 2, 0, Math.PI * 2);
    g.fill();
    plate(g, s * 10.6 - 1, -15, 2, 4, '#3a3428', a.ink, 0.3); // tow hooks
  }
  armour(g, [-11, -8, -8.8, -8, -8.8, -3, -11, -3], '#5a4c32', a.ink, 0.35); // a stowage box
  bolts(g, [-10, -14.4, 10, -14.4, -10, 14.4, 10, 14.4, 0, -14.6], 0.4);
  wear(g, [-11, 4, -9.4, 6, 9.6, -6, 11, -4.6, 3, 13.4, 5.6, 13]);
}

/** The hover tank's turret: armoured disc, hatch, sensor block, mantlet and twin barrels along +y. */
function hoverTurret(g: Ctx, a: JunglePal): void {
  for (const dx of [-2.5, 2.5]) {
    cylinder(g, dx - 1, 3, 2, 12.5, a.trim, 'y');
    plate(g, dx - 1.3, 14.6, 2.6, 1.8, '#121008', a.ink, 0.3);
  }
  armour(g, [-4.6, 3.4, 4.6, 3.4, 4, 7, -4, 7], a.metal, a.ink, 0.4); // mantlet
  shell(g, 0, 0, 7, 7, { base: a.dark, dark: '#16120a', light: a.light, ink: a.ink }, 0);
  shell(g, 0, 0, 5.4, 5.4, { base: a.body, dark: a.dark, light: a.light, ink: a.ink }, 0);
  for (let i = 0; i < 10; i++) {
    const b = (i / 10) * Math.PI * 2;
    bolts(g, [Math.cos(b) * 6, Math.sin(b) * 6], 0.32);
  }
  hatch(g, -2.4, -2, 2, a.dark);
  plate(g, 2, -3.6, 3, 2.4, a.metal, a.ink, 0.3);
  g.fillStyle = a.glass;
  g.fillRect(2.4, -2.1, 2.2, 0.7);
}

const HOVERTANK = art('hovertank', {
  under: (ctx, p, t) => {
    if (variantFor(p).kind === 'burnt') return; // no cushion under a wreck
    if (p.mono) {
      ctx.fillStyle = p.body;
      ctx.beginPath();
      ctx.ellipse(0, 0, 17, 21, 0, 0, Math.PI * 2);
      ctx.fill();
      return;
    }
    ctx.fillStyle = 'rgba(200,170,120,0.32)'; // the dust cushion, swirling
    ctx.beginPath();
    ctx.ellipse(0, 0, 17, 21, 0, 0, Math.PI * 2);
    ctx.fill();
    for (let i = 0; i < 12; i++) {
      const b = (i / 12) * Math.PI * 2 + t * 1.6;
      ctx.fillStyle = 'rgba(214,188,140,0.32)';
      ctx.beginPath();
      ctx.arc(Math.cos(b) * 15.5, Math.sin(b) * 19, 3 + Math.sin(t * 3 + i * 1.3) * 1.2, 0, Math.PI * 2);
      ctx.fill();
    }
  },
  body: hoverHull,
  over: (ctx, p, t, aim) => {
    for (const [x, y] of [[-8, 14 + Math.sin(t * 20)], [8, 14 + Math.cos(t * 20)]] as const) {
      glowOf(ctx, p, x, y, 4.5, 0.55);
      if (!p.mono) plate(ctx, x - 1.4, y - 1.1, 2.8, 2.2, p.glow, p.ink, 0.3);
    }
    ctx.save();
    ctx.rotate(aim - Math.PI);
    cachedPart(ctx, 'hovertank-turret', [7.5, 17], p, JUNGLE_PAL.hovertank, hoverTurret);
    ctx.restore();
  },
});

/** The gun pit: dirt floor, a ring of sandbags, shells and a crate, the turntable. */
function gunPit(g: Ctx, a: JunglePal): void {
  shell(g, 0, 0, 16.6, 16.6, { base: '#5a4a32', dark: '#2e2416', light: '#7a6a48', ink: a.ink }, 0);
  for (let i = 0; i < 11; i++) { // the sandbags, each tied at its middle
    const b = (i / 11) * Math.PI * 2;
    g.save();
    g.translate(Math.cos(b) * 13.6, Math.sin(b) * 13.6);
    g.rotate(b + Math.PI / 2);
    shell(g, 0, 0, 3.9, 2.5, { base: '#9a8a5e', dark: '#5e5236', light: '#c8b88a', ink: a.ink }, 0);
    g.fillStyle = 'rgba(40,30,16,0.5)';
    g.fillRect(-0.25, -2.3, 0.5, 4.6);
    g.restore();
  }
  for (const [x, y, r] of [[-7.6, 4.6, 0.6], [-8.4, 2.2, 0.5], [-6.6, 6.8, 0.7]] as const) { // shells lying ready
    g.save();
    g.translate(x, y);
    g.rotate(r);
    cylinder(g, -0.8, -2.4, 1.6, 4.4, '#b08a3a', 'y');
    plate(g, -0.8, -3.2, 1.6, 1, '#6a6a5a', a.ink, 0.2);
    g.restore();
  }
  armour(g, rectPts(5.4, 4.4, 4.6, 3.4), '#5a5232', a.ink, 0.4); // a crate
  shell(g, 0, 0, 9, 9, { base: a.body, dark: a.dark, light: a.light, ink: a.ink }, 0); // the turntable
  for (let i = 0; i < 8; i++) {
    const b = (i / 8) * Math.PI * 2 + 0.2;
    bolts(g, [Math.cos(b) * 7.6, Math.sin(b) * 7.6], 0.4);
  }
}

/** The artillery barrel along +y: breech, shield, recoil cylinders, the barrel and its slotted muzzle brake. */
function gunBarrel(g: Ctx, a: JunglePal): void {
  for (const s of [-1, 1]) cylinder(g, s * 3.1 - 0.7, -1, 1.4, 9, a.metal, 'y'); // recoil cylinders
  cylinder(g, -2.4, 0, 4.8, 9, a.dark, 'y');
  cylinder(g, -1.8, 8, 3.6, 11, a.dark, 'y');
  armour(g, [-7, 3, 7, 3, 6.4, 5.2, -6.4, 5.2], a.body, a.ink, 0.45); // the gun shield
  armour(g, [-4, -5, 4, -5, 4, 1.2, -4, 1.2], a.body, a.ink, 0.5); // the breech block
  bolts(g, [-3, -4, 3, -4, -3, 0.2, 3, 0.2], 0.35);
  plate(g, -4, 18, 8, 4, a.trim, a.ink, 0.45); // the muzzle brake
  for (const s of [-1, 1]) plate(g, s * 2.6 - 0.7, 18.8, 1.4, 2.4, '#0a0a06', a.ink, 0.2);
  g.fillStyle = '#0a0a06';
  g.beginPath();
  g.arc(0, 21.6, 1.2, 0, Math.PI * 2);
  g.fill();
}

const ARTILLERY = art('artillery', {
  body: gunPit,
  over: (ctx, p, _t, aim) => {
    ctx.save();
    ctx.rotate(aim - Math.PI);
    cachedPart(ctx, 'artillery-barrel', [7.5, 23], p, JUNGLE_PAL.artillery, gunBarrel);
    ctx.restore();
  },
});

export const JUNGLE_UNITS: Readonly<Record<'walker' | 'hovertank' | 'artillery' | 'gundrone' | 'dropship' | 'brute', UnitFn>> = {
  walker: detailUnit('walker', WALKER),
  hovertank: detailUnit('hovertank', HOVERTANK),
  artillery: detailUnit('artillery', ARTILLERY),
  gundrone: detailUnit('gundrone', GUNDRONE),
  dropship: detailUnit('dropship', DROPSHIP),
  brute: detailUnit('brute', BRUTE),
};
