import type { UnitFn } from '../draw-ground-units';
import { mix, shade } from '../detail/color';
import { bevel, bolts, cylinder, grille, plate } from '../detail/parts';
import { detailUnit } from '../detail/unit';
import { dish, rack, solar } from './space-gear';
import { bell, canopy, flipX, greebles, keel, lamp, plating, plume, seams, tints } from './space-kit';
import { turret, turretRing } from './space-guns';
import { shipArt, type ShipPal, type SpaceKind } from './space-pal';
import { CORVETTE, GUNSHIP, WARDEN } from './space-ships';

// Space's adversaries in detail (docs 56, 58, 119), noses down (+y): the raider — a forward-swept dart with wing cannons,
// red tips, intakes and twin engine bells; the interceptor — a long-nosed delta with canted fins, an amber missile under
// each wing and one big engine; the gun satellite — a faceted hexagonal bus on two solar wings, its twin turret
// tracking, a beacon blinking on its mast; the lunar battery — a gun pit in a berm of regolith bags with a twin turret,
// a missile launcher, a sensor dish and a blue beacon. The corvette, gunship and battlecruiser are in space-ships.ts.

type Ctx = CanvasRenderingContext2D;

const side = (s: number, pts: readonly number[]): readonly number[] => (s > 0 ? pts : flipX(pts));

const RAIDER = [0, 17.4, 1.5, 15.8, 2.8, 12.4, 4.2, 6.4, 5, 2, 5.8, -5, 6, -10, 5.4, -12.8, 3.8, -14, 0, -14.4];
const RAIDER_WING = [3.6, -6.6, 14.6, 5.2, 16.2, 9.4, 12.4, 10.2, 4.6, 4.2];
const RAIDER_TIP = [12.4, 7.4, 15.6, 8.6, 16.2, 9.4, 12.4, 10.2];

function raiderBody(ctx: Ctx, p: ShipPal): void {
  for (const s of [-1, 1]) {
    plating(ctx, side(s, RAIDER_WING), shade(p.dark, 0.22), p, 0.55);
    seams(ctx, side(s, [3.2, -4.6, 13.7, 6.2, 4.6, 0, 13.4, 7.6]), 0.3);
    plating(ctx, side(s, RAIDER_TIP), p.trim, p, 0.4);
    bolts(ctx, side(s, [6, -1.5, 11.6, 4.6]), 0.28);
    cylinder(ctx, s * 9.4 - 0.45, 6, 0.9, 6.6, p.metal, 'y'); // the wing cannon in its pod
    plating(ctx, side(s, [8.2, 0.4, 10.6, 0.4, 10.8, 7.4, 9.4, 8.6, 8, 7.4]), shade(p.hull, -0.1), p, 0.4);
    plate(ctx, s * 9.4 - 0.7, 12, 1.4, 0.9, p.ink, p.ink, 0.2);
  }
  const hull = keel(ctx, RAIDER, p.hull, p);
  tints(ctx, hull, [-6, -9, 3.4, 6, 0.08, 2.6, -9, 3.4, 6, -0.06, -6, 1.6, 3.4, 5, -0.05, 2.6, -3, 3.4, 4.6, 0.05]);
  for (const s of [-1, 1]) {
    bevel(ctx, side(s, [4.3, 1.6, 5.3, 0.6, 5.7, -4.4, 4.5, -4.4]), '#151a22', p.ink, 0.35); // the intake
    bell(ctx, s * 3.3, -12.6, 2.1, 3.6, p);
  }
  plating(ctx, [-2.2, 14, 2.2, 14, 1.5, 15.8, 0, 17.4, -1.5, 15.8], shade(p.hull, -0.35), p, 0.4); // the nose cap
  seams(ctx, [-5.9, -9, 5.9, -9, -5.5, -3, 5.5, -3, -2.6, -11.5, -2.6, 1.5, 2.6, -11.5, 2.6, 1.5, -3.2, 11, 3.2, 11], 0.3);
  plate(ctx, -0.6, -11.8, 1.2, 6.2, p.trim, p.ink, 0.25); // the spine stripe
  grille(ctx, -1.7, -14, 3.4, 2.4, 3, 'x');
  canopy(ctx, 0, 6.2, 1.9, 3.6, p);
}

const RAIDER_ART = shipArt('raider', {
  under: (ctx, p, t) => {
    for (const s of [-1, 1]) plume(ctx, s * 3.3, -16.2, 2.3, t, p);
  },
  body: raiderBody,
  over: (ctx, p, t) => lamp(ctx, p, 0, -7, 0.6, '255,80,64', Math.max(0, Math.sin(t * 5))),
});

const INTERCEPTOR = [0, 20.4, 1.2, 18, 2.4, 14, 3.4, 8, 4.2, 0, 4.6, -8, 4.6, -12, 3.8, -14.6, 0, -15.2];
const INTERCEPTOR_WING = [3.2, 10, 16, -8, 17, -12, 4.4, -12];

/** A missile under the wing, nose forward (+y): dark fins, the amber casing, a light nose cone. */
function missile(ctx: Ctx, x: number, y0: number, y1: number, p: ShipPal): void {
  ctx.fillStyle = p.ink;
  ctx.fillRect(x - 1.7, y0, 3.4, 1.2);
  cylinder(ctx, x - 0.8, y0, 1.6, y1 - y0 - 1.6, p.trim, 'y');
  ctx.fillStyle = '#e8e8e0';
  ctx.beginPath();
  ctx.moveTo(x - 0.8, y1 - 1.6);
  ctx.lineTo(x, y1);
  ctx.lineTo(x + 0.8, y1 - 1.6);
  ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fillRect(x - 0.8, y1 - 4, 1.6, 0.45);
}

function interceptorBody(ctx: Ctx, p: ShipPal): void {
  for (const s of [-1, 1]) {
    plating(ctx, side(s, INTERCEPTOR_WING), shade(p.hull, -0.06), p, 0.55);
    seams(ctx, side(s, [4.6, -10.4, 16.6, -10.4, 10.6, -10.4, 10.6, -12, 4.4, 7.4, 14.6, -8.6, 4.6, -2, 12.4, -6]), 0.3);
    plating(ctx, side(s, [4.2, -5.6, 5.4, -6.6, 5.9, -13, 4.6, -13.4]), shade(p.hull, 0.2), p, 0.35); // the canted fin
  }
  const hull = keel(ctx, INTERCEPTOR, mix(p.hull, p.light, 0.3), p);
  tints(ctx, hull, [-5, -10.5, 2.8, 4.5, 0.08, 2.2, -10.5, 2.8, 4.5, -0.06, -5, -3.4, 2.8, 6, -0.05, 2.2, -6, 2.8, 2.6, 0.05]);
  plating(ctx, [-1.9, 15.6, 1.9, 15.6, 1.2, 18, 0, 20.4, -1.2, 18], shade(p.hull, -0.4), p, 0.4); // the radome
  bevel(ctx, [-1.6, 0.8, 1.6, 0.8, 1.9, -3, -1.9, -3], '#151a22', p.ink, 0.35); // the dorsal intake
  plate(ctx, -0.25, -2.8, 0.5, 3.4, p.metal, p.ink, 0.2);
  seams(ctx, [-3.4, -6, 3.4, -6, -4, -10.5, 4, -10.5, -2.6, 12.4, 2.6, 12.4, -2.2, -3.4, -2.2, -13, 2.2, -3.4, 2.2, -13], 0.3);
  bell(ctx, 0, -14.4, 3.1, 3.4, p);
  for (const s of [-1, 1]) missile(ctx, s * 10, -7.4, 4.6, p);
  canopy(ctx, 0, 7.2, 1.8, 4.2, p);
}

const INTERCEPTOR_ART = shipArt('interceptor', {
  under: (ctx, p, t) => plume(ctx, 0, -17.8, 3.2, t, p),
  body: interceptorBody,
  over: (ctx, p, t) => {
    const on = Math.sin(t * 4) > 0.5 ? 1 : 0;
    lamp(ctx, p, -16.5, -11.2, 0.55, '255,70,60', on);
    lamp(ctx, p, 16.5, -11.2, 0.55, '90,255,140', on);
  },
});

const HEX = [-6, -10, 6, -10, 11, 0, 6, 10, -6, 10, -11, 0];

/** The hexagonal bus: six facets shaded by where they face, the top deck, corner thrusters and the beacon's mast. */
function satgunBus(ctx: Ctx, p: ShipPal): void {
  for (let i = 0; i < 12; i += 2) {
    const j = (i + 2) % 12;
    const [ax, ay, bx, by] = [HEX[i] ?? 0, HEX[i + 1] ?? 0, HEX[j] ?? 0, HEX[j + 1] ?? 0];
    const mx = (ax + bx) / 2, my = (ay + by) / 2, m = Math.hypot(mx, my) || 1;
    const lit = -(mx + my) / m / Math.SQRT2;
    bevel(ctx, [ax, ay, bx, by, bx * 0.6, by * 0.6, ax * 0.6, ay * 0.6], shade(p.hull, lit * 0.3), p.ink, 0.45);
  }
  plating(ctx, HEX.map((v) => v * 0.6), p.light, p, 0.45);
  greebles(ctx, [-7.2, -10.6, 2.4, 1.6, 4.8, -10.6, 2.4, 1.6, -7.2, 9, 2.4, 1.6, 4.8, 9, 2.4, 1.6], p, -0.25);
  bolts(ctx, [-9.6, -0.1, 9.6, -0.1, -4.6, -7.8, 4.6, -7.8, -4.6, 7.8, 4.6, 7.8], 0.35);
  plate(ctx, -0.4, -12, 0.8, 2.6, p.metal, p.ink, 0.25);
}

const SATGUN = shipArt('satgun', {
  body: (ctx, p) => {
    for (const s of [-1, 1]) {
      plating(ctx, side(s, [8, -1.3, 11.6, -1.3, 11.6, 1.3, 8, 1.3]), p.metal, p, 0.4); // the wing's arm
      solar(ctx, s > 0 ? 10.6 : -25.6, -5.4, 15, 10.8, 4, p);
    }
    satgunBus(ctx, p);
    turretRing(ctx, 0, 0, 4.6, p);
  },
  over: (ctx, p, t, aim) => {
    turret(ctx, p, 5.5, 2, 1.8, aim);
    lamp(ctx, p, 0, -12.2, 0.8, '255,90,74', Math.sin(t * 4) > 0.6 ? 1 : 0);
  },
});

/** The berm of regolith bags round the pit, each lit from the upper left. */
function berm(ctx: Ctx, p: ShipPal): void {
  ctx.fillStyle = p.ink;
  ctx.beginPath();
  ctx.arc(0, 0, 18.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = p.dark;
  ctx.beginPath();
  ctx.arc(0, 0, 18, 0, Math.PI * 2);
  ctx.fill();
  for (let k = 0; k < 14; k++) {
    const a = (k / 14) * Math.PI * 2;
    const lit = -(Math.cos(a) + Math.sin(a)) / Math.SQRT2;
    ctx.save();
    ctx.translate(Math.cos(a) * 15.4, Math.sin(a) * 15.4);
    ctx.rotate(a + Math.PI / 2);
    ctx.beginPath();
    ctx.roundRect(-3.2, -2, 6.4, 4, 1.4);
    ctx.fillStyle = shade(p.hull, -0.1 + lit * 0.22);
    ctx.fill();
    ctx.strokeStyle = p.ink;
    ctx.lineWidth = 0.35;
    ctx.stroke();
    ctx.restore();
  }
}

/** The pad's radial seams and the painted ring round the turret. */
function padMarks(ctx: Ctx, p: ShipPal): void {
  const list: number[] = [];
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI * 2 + Math.PI / 8;
    list.push(Math.cos(a) * 8.6, Math.sin(a) * 8.6, Math.cos(a) * 12.4, Math.sin(a) * 12.4);
  }
  seams(ctx, list, 0.3);
  ctx.strokeStyle = p.trim;
  ctx.lineWidth = 0.8;
  ctx.setLineDash([2.4, 1.6]);
  ctx.beginPath();
  ctx.arc(0, 0, 10.4, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
}

const PAD = Array.from({ length: 16 }, (_, k) => [Math.cos((k / 16) * Math.PI * 2) * 12.6, Math.sin((k / 16) * Math.PI * 2) * 12.6]).flat();

const BATTERY = shipArt('battery', {
  body: (ctx, p) => {
    berm(ctx, p);
    plating(ctx, PAD, p.hull, p, 0.5);
    padMarks(ctx, p);
    turretRing(ctx, 0, 0, 7.6, p);
    dish(ctx, -10.6, -9.4, 3.2, p);
    greebles(ctx, [6.4, 7.6, 3.2, 2.4, 8.4, 10.4, 2.6, 2.2], p, -0.2); // ammunition crates
    plate(ctx, -13.4, 10.6, 2.8, 2.8, p.metal, p.ink, 0.3); // the beacon's base
    rack(ctx, 10, -10, 2, 6, p);
  },
  over: (ctx, p, t, aim) => {
    turret(ctx, p, 7, 2, 1.9, aim);
    lamp(ctx, p, -12, 12, 1, '79,140,255', Math.sin(t * 3) > 0.7 ? 1 : 0);
  },
});

export const SPACE_UNITS: Readonly<Record<SpaceKind, UnitFn>> = {
  raider: detailUnit('space-raider', RAIDER_ART),
  satgun: detailUnit('space-satgun', SATGUN),
  corvette: detailUnit('space-corvette', CORVETTE),
  interceptor: detailUnit('space-interceptor', INTERCEPTOR_ART),
  gunship: detailUnit('space-gunship', GUNSHIP),
  battery: detailUnit('space-battery', BATTERY),
  warden: detailUnit('space-warden', WARDEN),
};
