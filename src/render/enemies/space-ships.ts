import { mix, shade } from '../detail/color';
import { antenna, bolts, grille, hatch, plate, sym } from '../detail/parts';
import { cells, dish, rack, windows } from './space-gear';
import { bell, canopy, drop, flipX, greebles, keel, lamp, plating, plume, seams, tints } from './space-kit';
import { turret, turretRing } from './space-guns';
import { scatter } from './space-surface';
import { shipArt, type ShipPal } from './space-pal';

// Space's warships in detail (docs 56, 58, 119), bows down (+y): the corvette — a long faceted hull with armour belts,
// a raised deck with red bow chevrons, the domed bridge, a missile rack aft, radiator sponsons and three engine bells,
// its twin turret tracking and its running lights blinking; the gunship — a blunt armoured hull of bolted plates with a
// glacis and viewport slits, side skirts, two weapon pods with vents and thrusters, a triple turret forward and a twin
// flak mount aft; the battlecruiser (warden, the world's mini-boss) — a long wedge with launch-cell nacelles, armour
// belts, lit ports, a raised spine, the bridge tower with its dish, two triple turrets, the missile deck and three
// main engines.

type Ctx = CanvasRenderingContext2D;

const side = (s: number, pts: readonly number[]): readonly number[] => (s > 0 ? pts : flipX(pts));
const blink = (t: number, speed: number, phase = 0): number => (Math.sin(t * speed + phase) > 0.2 ? 1 : 0);
const ringPts = (x: number, y: number, r: number): number[] =>
  Array.from({ length: 12 }, (_, k) => [x + Math.cos((k / 12) * Math.PI * 2) * r, y + Math.sin((k / 12) * Math.PI * 2) * r]).flat();

const CORVETTE_HULL = [0, 46, 4, 44.6, 8, 40, 12, 30, 14, 22, 15, 0, 15, -30, 13, -42, 8, -43.6, 0, -44];
const CORVETTE_SPONSON = [15, -16, 24, -23, 24.6, -26, 24.6, -36, 15, -34];
const CORVETTE_DECK = sym([0, 40, 6, 35, 10, 20, 10, -26, 6, -27.4, 0, -28]);
const CORVETTE_BRIDGE = [-4.4, -6.2, 4.4, -6.2, 6.2, -2, 4.4, 3, -4.4, 3, -6.2, -2];

function corvetteHull(ctx: Ctx, p: ShipPal): Path2D {
  for (const s of [-1, 1]) {
    plating(ctx, side(s, CORVETTE_SPONSON), shade(p.dark, 0.16), p, 0.6);
    grille(ctx, s > 0 ? 17.4 : -23, -33, 5.6, 8.4, 4, 'x');
    plate(ctx, s > 0 ? 18 : -22.4, -20.6, 4.4, 1.2, p.trim, p.ink, 0.25);
    plate(ctx, s > 0 ? 23.2 : -25.6, -32, 2.4, 3, p.metal, p.ink, 0.3); // the light's housing
  }
  const hull = keel(ctx, CORVETTE_HULL, p.hull, p);
  tints(ctx, hull, [-15, -40, 5, 10, 0.08, 10, -40, 5, 10, -0.08, -15, 26, 4, 8, -0.06, 11, -6, 4, 14, 0.05, -15, -14, 4, 12, 0.06]);
  for (const s of [-1, 1]) {
    plating(ctx, side(s, [11.6, 24, 13.8, 20, 13.8, -28, 11.6, -30]), shade(p.hull, -0.2), p, 0.4); // armour belt
    bolts(ctx, side(s, [12.7, 18, 12.7, 10, 12.7, 2, 12.7, -6, 12.7, -14, 12.7, -22]), 0.35);
    greebles(ctx, side(s, [12.4, -40, 2.4, 3.4, 13.6, -36, 1.4, 4]), p, -0.25); // the stern's fins
  }
  drop(ctx, CORVETTE_DECK, 1.3, hull);
  return hull;
}

function corvetteBody(ctx: Ctx, p: ShipPal): void {
  corvetteHull(ctx, p);
  const deck = plating(ctx, CORVETTE_DECK, mix(p.hull, p.light, 0.7), p, 0.6);
  tints(ctx, deck, [-10, -26, 10, 7, -0.07, 0, -12, 10, 8, 0.06, -10, 8, 10, 6, 0.05, 0, 14, 10, 8, -0.06]);
  scatter(ctx, deck, [-9, -10, 9, 22], 10, 41, p, 0.6);
  seams(ctx, [-10, -19, 10, -19, -10, -12, 10, -12, -10, 8, 10, 8, -10, 14, 10, 14, -14, -35, 14, -35, -5, 36.6, 5, 36.6], 0.35);
  for (const y of [33, 30]) plating(ctx, [0, y + 4, 5.6, y, 5.6, y - 1.6, 0, y + 2.4, -5.6, y - 1.6, -5.6, y], p.trim, p, 0.3);
  windows(ctx, [-8.4, 0, -8.4, 3, -8.4, 6, -8.4, 9, 8.4, 0, 8.4, 3, 8.4, 6, 8.4, 9], 0.6);
  grille(ctx, -6, -40, 12, 3.4, 5, 'y');
  greebles(ctx, [-7.6, -17, 3, 2.6, 4.8, -16.4, 2.6, 2], p, -0.15);
  hatch(ctx, 6, -9.6, 1.4, shade(p.light, -0.1));
  drop(ctx, CORVETTE_BRIDGE, 1, deck);
  plating(ctx, CORVETTE_BRIDGE, shade(p.hull, -0.12), p, 0.5);
  canopy(ctx, 0, -0.8, 3, 3, p);
  antenna(ctx, -5, -4, 3.6, -0.3);
  drop(ctx, [-4.6, -26, 4.6, -26, 4.6, -18, -4.6, -18], 1, deck);
  rack(ctx, 0, -22, 4, 7, p);
  drop(ctx, ringPts(0, 26, 7.6), 1, deck);
  turretRing(ctx, 0, 26, 7.6, p);
  for (const x of [-9, 0, 9]) bell(ctx, x, -42, 3.3, 4.4, p);
}

export const CORVETTE = shipArt('corvette', {
  under: (ctx, p, t) => {
    for (const x of [-9, 0, 9]) plume(ctx, x, -46.4, 3.4, t, p);
  },
  body: corvetteBody,
  over: (ctx, p, t, aim) => {
    ctx.save();
    ctx.translate(0, 26);
    turret(ctx, p, 7, 2, 1.8, aim);
    ctx.restore();
    lamp(ctx, p, -24.4, -30.5, 0.9, '255,70,60', blink(t, 3));
    lamp(ctx, p, 24.4, -30.5, 0.9, '90,255,140', blink(t, 3));
    lamp(ctx, p, 0, 43.6, 0.7, '255,255,255', Math.sin(t * 7) > 0.85 ? 1 : 0);
  },
});

const GUNSHIP_HULL = [0, 30, 8, 29.2, 14, 26.4, 19.4, 18, 22, 10, 22, -20, 16, -28, 6, -29, 0, -29];
const GUNSHIP_POD = [22, -3, 30, -9, 30, -22, 22, -18];
const GLACIS = sym([0, 29, 7.8, 28.2, 13.4, 25.6, 18.6, 18, 12, 19.6, 0, 20.4]);

function gunshipHull(ctx: Ctx, p: ShipPal): Path2D {
  for (const s of [-1, 1]) {
    plating(ctx, side(s, GUNSHIP_POD), shade(p.dark, 0.14), p, 0.6);
    grille(ctx, s > 0 ? 24 : -28.6, -17, 4.6, 7, 3, 'x');
    plate(ctx, s > 0 ? 23.6 : -28.4, -8.6, 4.8, 1.2, p.trim, p.ink, 0.25);
    bell(ctx, s * 26, -20.4, 1.8, 2.6, p);
  }
  const hull = keel(ctx, GUNSHIP_HULL, p.hull, p);
  const plates: number[] = [];
  for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) plates.push(-16 + c * 8, -22 + r * 8, 8, 8, ((c * 3 + r * 5) % 4 - 1.5) * 0.035);
  tints(ctx, hull, plates);
  scatter(ctx, hull, [-16, -24, 16, 16], 14, 43, p, 0.75);
  for (const s of [-1, 1]) {
    drop(ctx, side(s, [17.4, 8, 21.4, 8, 21.4, -18, 17.4, -18]), 1, hull);
    plating(ctx, side(s, [17.4, 8, 21.4, 8, 21.4, -18, 17.4, -18]), shade(p.hull, -0.16), p, 0.45); // side skirt
    seams(ctx, side(s, [17.6, -0.6, 21.2, -0.6, 17.6, -9.4, 21.2, -9.4]), 0.3);
    bolts(ctx, side(s, [18.4, 6.4, 20.4, 6.4, 18.4, -16.4, 20.4, -16.4, 19.4, -5, 19.4, -13.8]), 0.35);
  }
  drop(ctx, GLACIS, 1.2, hull);
  return hull;
}

function gunshipBody(ctx: Ctx, p: ShipPal): void {
  const hull = gunshipHull(ctx, p);
  plating(ctx, GLACIS, p.light, p, 0.6);
  for (const x of [-7, -1.6, 3.8]) plate(ctx, x, 22.6, 3.8, 1.4, '#1a2a38', p.ink, 0.3); // viewport slits
  windows(ctx, [-5.1, 23.3, 0.3, 23.3, 5.7, 23.3], 0.5, '#9fe0ff');
  bolts(ctx, [-15, 20.6, 15, 20.6, -9, 27, 9, 27, 0, 21.6], 0.4);
  plate(ctx, -6, -26.6, 12, 3.2, p.trim, p.ink, 0.35);
  dish(ctx, 13, -22, 2.3, p);
  hatch(ctx, -12.6, -21.6, 1.8, shade(p.hull, -0.08));
  hatch(ctx, 12.4, -1.6, 1.6, shade(p.hull, -0.08));
  greebles(ctx, [-15.4, -4, 3.4, 2.6, -14.4, 0.6, 2.4, 3.2, 8.6, -10, 3, 2.4], p, -0.18);
  drop(ctx, ringPts(0, 12, 8), 1.2, hull);
  turretRing(ctx, 0, 12, 8, p);
  turretRing(ctx, 0, -14, 5.4, p);
  for (const s of [-1, 1]) bell(ctx, s * 8, -27.6, 3, 3.2, p);
}

export const GUNSHIP = shipArt('gunship', {
  under: (ctx, p, t) => {
    for (const s of [-1, 1]) {
      plume(ctx, s * 8, -30.8, 3.2, t, p);
      plume(ctx, s * 26, -23, 1.5, t, p);
    }
  },
  body: gunshipBody,
  over: (ctx, p, t, aim) => {
    ctx.save();
    ctx.translate(0, 12);
    turret(ctx, p, 7, 3, 1.7, aim);
    ctx.translate(0, -26);
    turret(ctx, p, 4.4, 2, 1.5, aim);
    ctx.restore();
    for (const s of [-1, 1]) lamp(ctx, p, s * 29.6, -9.6, 0.8, '255,80,64', blink(t, 2.4, s));
  },
});

const WARDEN_HULL = [0, 64, 6, 61.2, 14, 52, 22, 32, 26, 20, 30, -40, 28, -50, 24, -58, 12, -59.4, 0, -60];
const WARDEN_NACELLE = [30, -8, 44, -20, 44.6, -24, 44.6, -46, 30, -40];
const WARDEN_DECK = sym([0, 56, 10, 46, 18, 20, 0, 18]);
const WARDEN_SPINE = sym([0, -14, 7, -15, 8, -48, 5, -52, 0, -52.6]);
const WARDEN_BRIDGE = [-9, -13, 9, -13, 10, 2, 6, 7, -6, 7, -10, 2];

function wardenHull(ctx: Ctx, p: ShipPal): Path2D {
  for (const s of [-1, 1]) {
    plating(ctx, side(s, WARDEN_NACELLE), shade(p.dark, 0.16), p, 0.7);
    cells(ctx, s > 0 ? 33.6 : -40.4, -38, 2, 4, 3.4, p);
    plate(ctx, s > 0 ? 31.4 : -34.4, -18.4, 3, 1.4, p.trim, p.ink, 0.25);
    bell(ctx, s * 37.4, -42.6, 2.6, 3, p);
    plate(ctx, s > 0 ? 42.6 : -44.6, -27, 2, 4, p.metal, p.ink, 0.3);
  }
  const hull = keel(ctx, WARDEN_HULL, p.hull, p, 0.9);
  tints(ctx, hull, [-30, -56, 12, 14, 0.07, 18, -56, 12, 14, -0.07, -26, -6, 8, 18, 0.05, 18, 0, 8, 16, -0.05, -22, 24, 10, 10, -0.05]);
  scatter(ctx, hull, [-25, -54, 25, 26], 26, 47, p, 0.8);
  for (const s of [-1, 1]) {
    plating(ctx, side(s, [23.6, 24, 27.4, 16, 29.2, -38, 26.4, -40]), shade(p.hull, -0.18), p, 0.5); // armour belt
    bolts(ctx, side(s, [26.4, 12, 26.8, 2, 27.2, -8, 27.6, -18, 28, -28]), 0.45);
    windows(ctx, side(s, [21.4, -34, 21.4, -30, 21.4, -26, 21.4, -22, 21.4, 0, 21.4, 4, 21.4, 8]), 0.7);
    grille(ctx, s > 0 ? 14 : -22, -55, 8, 5, 4, 'y');
  }
  seams(ctx, [-24, -50, 24, -50, -26, -24, 26, -24, -26, -18, 26, -18, -24, 22, 24, 22, -16, -48, -16, 10, 16, -48, 16, 10], 0.4);
  for (const pts of [WARDEN_DECK, WARDEN_SPINE, WARDEN_BRIDGE]) drop(ctx, pts, 1.6, hull);
  return hull;
}

function wardenBody(ctx: Ctx, p: ShipPal): void {
  wardenHull(ctx, p);
  plating(ctx, WARDEN_DECK, mix(p.hull, p.light, 0.75), p, 0.7);
  for (const y of [49, 45]) plating(ctx, [0, y + 4, 7.4, y - 2, 7.4, y - 4, 0, y + 2, -7.4, y - 4, -7.4, y - 2], p.trim, p, 0.35);
  const spine = plating(ctx, WARDEN_SPINE, shade(p.hull, 0.1), p, 0.6);
  tints(ctx, spine, [-8, -48, 16, 6, -0.1, -8, -26, 16, 6, 0.08]);
  scatter(ctx, spine, [-7, -50, 7, -14], 6, 53, p, 0.6);
  greebles(ctx, [-20, -12, 3, 6, 17, -12, 3, 6, -22, -46, 4, 3, 18, -46, 4, 3], p, -0.16);
  hatch(ctx, -18.6, 12, 2, shade(p.hull, -0.06));
  hatch(ctx, 18.6, -32, 2, shade(p.hull, -0.06));
  plating(ctx, WARDEN_BRIDGE, shade(p.hull, 0.06), p, 0.6); // the bridge tower
  plating(ctx, [-6, -6, 6, -6, 6.6, 1, -6.6, 1], shade(p.hull, -0.2), p, 0.4);
  windows(ctx, [-4.5, -2, -1.5, -2, 1.5, -2, 4.5, -2], 0.9, '#9fe0ff');
  dish(ctx, 4.6, -9.4, 2.6, p);
  antenna(ctx, -6, -10, 4.6, -0.3);
  grille(ctx, -4, -50, 8, 4, 4, 'y');
  rack(ctx, 0, -34, 4, 9, p);
  turretRing(ctx, 0, 34, 9.2, p);
  turretRing(ctx, 0, 14, 9.2, p);
  for (const x of [-14, 0, 14]) bell(ctx, x, -57.4, 4.6, 5, p);
}

export const WARDEN = shipArt('warden', {
  under: (ctx, p, t) => {
    for (const x of [-14, 0, 14]) plume(ctx, x, -62.4, 4.8, t, p);
    for (const s of [-1, 1]) plume(ctx, s * 37.4, -45.6, 2.4, t, p);
  },
  body: wardenBody,
  over: (ctx, p, t, aim) => {
    for (const y of [34, 14]) {
      ctx.save();
      ctx.translate(0, y);
      turret(ctx, p, 8, 3, 1.8, aim);
      ctx.restore();
    }
    lamp(ctx, p, -43.6, -25, 1.1, '255,70,60', blink(t, 2.6));
    lamp(ctx, p, 43.6, -25, 1.1, '90,255,140', blink(t, 2.6));
    lamp(ctx, p, 0, 61.6, 0.9, '255,255,255', Math.sin(t * 6) > 0.85 ? 1 : 0);
  },
});
