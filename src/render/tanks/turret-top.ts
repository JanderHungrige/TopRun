import { antenna, bevel, cylinder, hatch, INK, lens, path, plate, sheen, sym } from '../detail/parts';
import { drawCached, type Variant } from '../detail/sprite';
import { paintFleet } from '../fleet-paint';
import type { Look } from '../livery-art';
import { basket, C, crewTop, lookKey, smokeBank } from './vehicle-parts';
import { TANK_TOP } from './vehicle-build';

// The turrets from above (doc 114), drawn around their pivot with the gun toward −y and turned as a whole: the Lynx's
// low turret with the 20 mm cannon and its coax, the missile launcher box, the commander's panoramic sight and hatch,
// smoke dischargers, antennas and the stowage basket; the Bison's wedge-armoured turret with the long 120 mm gun (its
// thermal sleeve, fume extractor and muzzle sensor), the commander's remote MG, the loader's hatch and MG, the sights,
// smoke dischargers, the crosswind mast, antennas and the bustle's basket. Cached per look; and the Jackal's pintle MG.

type Ctx = CanvasRenderingContext2D;

/** A gun barrel along −y from `y0`, `len` long and `r` thick, with sleeve bands every `band`. */
function barrel(ctx: Ctx, y0: number, len: number, r: number, band = 0): void {
  cylinder(ctx, -r, y0 - len, r * 2, len, C.gun, 'y');
  if (band > 0) {
    ctx.fillStyle = 'rgba(0,0,0,0.32)';
    for (let y = y0 - band; y > y0 - len + 2; y -= band) ctx.fillRect(-r, y, r * 2, 0.3);
  }
}

function lynxGun(ctx: Ctx): void {
  plate(ctx, -2.1, -8.8, 4.2, 2.2, '#3e413b', INK, 0.35); // mantlet
  barrel(ctx, -8.8, 17, TANK_TOP.lynx.bore);
  plate(ctx, -1.3, -26.6, 2.6, 1.6, '#2e302b', INK, 0.3); // muzzle brake
  cylinder(ctx, 1.6, -13.6, 0.55, 5, C.gun, 'y'); // coax
}

function lynx(ctx: Ctx, look: Look): void {
  lynxGun(ctx);
  basket(ctx, -5, 6.4, 10, 2.8);
  const pts = sym([0, -7.2, 3.2, -7.2, 6.2, -5.5, 7.4, -2, 7.4, 4.5, 6.2, 6.6, 0, 7]);
  const p = path(pts);
  ctx.fillStyle = look.base;
  ctx.fill(p);
  paintFleet(ctx, look, p, { x: -7.5, y: -7.5, w: 15, h: 15 }, 'lynx-turret', 'top');
  sheen(ctx, p, -7.4, -7.2, 7.4, 7);
  bevel(ctx, pts, null, look.ink, 0.6);
  bevel(ctx, [-10.3, -4.6, -7.4, -4.6, -7.4, 3.2, -10.3, 3.2], C.can); // missile launcher box
  for (const x of [-9.6, -8.1]) lens(ctx, x, -4, 0.55, '#1a1c16');
  plate(ctx, 1.8, -4.8, 2.4, 2.2, '#3a3c36', INK, 0.3); // commander's panoramic sight
  plate(ctx, 2, -4.95, 2, 0.5, C.glass, INK, 0.2);
  plate(ctx, -4.2, -5.6, 1.8, 1.4, '#3a3c36', INK, 0.3); // gunner's sight
  hatch(ctx, 3.4, 2.4, 1.7, 'rgba(0,0,0,0.1)');
  for (const s of [-1, 1]) {
    ctx.save();
    ctx.translate(s * 5.6, -5.6);
    ctx.rotate(s * 0.62);
    smokeBank(ctx, -2, -1, 4, 1);
    ctx.restore();
    antenna(ctx, s * 5.4, 5.4, 6.5, Math.PI - s * 0.15);
  }
}

function bisonGun(ctx: Ctx): void {
  const r = TANK_TOP.bison.bore;
  plate(ctx, -3.4, -15, 6.8, 3, '#3e413b', INK, 0.4); // mantlet
  barrel(ctx, -15, 24, r, 3);
  cylinder(ctx, -r - 0.7, -27, r * 2 + 1.4, 4, C.gun, 'y'); // fume extractor
  plate(ctx, r - 0.2, -37.6, 0.9, 1.4, '#2a2c28', INK, 0.25); // muzzle reference sensor
  plate(ctx, -r - 0.3, -39.4, r * 2 + 0.6, 0.9, '#2a2c28', INK, 0.3);
}

function bison(ctx: Ctx, look: Look): void {
  bisonGun(ctx);
  basket(ctx, -9, 11, 18, 3.8);
  const pts = sym([0, -13.5, 2.6, -13.2, 7, -10.5, 11.6, -6.5, 12, -1, 11.6, 8.5, 9.4, 11.2, 0, 11.4]);
  const p = path(pts);
  ctx.fillStyle = look.base;
  ctx.fill(p);
  paintFleet(ctx, look, p, { x: -12, y: -13.5, w: 24, h: 25 }, 'bison-turret', 'top');
  sheen(ctx, p, -12, -13.5, 12, 11.4);
  for (const s of [-1, 1]) bevel(ctx, [0, -13.5, s * 2.6, -13.2, s * 7, -10.5, s * 11.6, -6.5, s * 7.5, -5.2, 0, -8], null, 'rgba(0,0,0,0.3)', 0.3);
  bevel(ctx, pts, null, look.ink, 0.65);
  plate(ctx, 2.6, -9.6, 2.8, 2.4, '#3a3c36', INK, 0.3); // gunner's sight
  plate(ctx, 2.8, -9.8, 2.4, 0.55, C.glass, INK, 0.2);
  hatch(ctx, -5, 3, 2, 'rgba(0,0,0,0.1)'); // loader's hatch and MG
  cylinder(ctx, -5.3, -2.5, 0.6, 4, C.gun, 'y');
  hatch(ctx, 5.4, 2, 2.3, 'rgba(0,0,0,0.12)'); // commander's remote weapon station
  plate(ctx, 4.3, -0.4, 2.2, 2.6, '#3a3c36', INK, 0.3);
  cylinder(ctx, 5.1, -5.4, 0.6, 5, C.gun, 'y');
  lens(ctx, 6.1, 0.3, 0.45, C.glass);
  plate(ctx, -7.2, 7.6, 0.45, 1.8, '#2a2c28', INK, 0.15); // crosswind mast
  plate(ctx, -7.8, 7.4, 1.6, 0.45, '#2a2c28', INK, 0.15);
  for (const s of [-1, 1]) {
    ctx.save();
    ctx.translate(s * 11.4, -3.5);
    ctx.rotate(s * Math.PI * 0.5);
    smokeBank(ctx, -2.2, -1.2, 4, 1.1);
    ctx.restore();
    antenna(ctx, s * 8.6, 9.4, 9, Math.PI - s * 0.12);
  }
}

const BOX = { lynx: [11, 27.5], bison: [13.5, 40] } as const;

/** A turned sprite with its soft shadow cast toward the lower right onto what lies under it. */
function withShadow(ctx: Ctx, x: number, y: number, angle: number, draw: (v: Variant) => void): void {
  ctx.save();
  ctx.translate(x + 1, y + 1.6);
  ctx.rotate(angle);
  ctx.globalAlpha *= 0.3;
  draw({ kind: 'mono', colour: '#000000' });
  ctx.restore();
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  draw({ kind: 'live' });
  ctx.restore();
}

export function drawTurretTop(ctx: Ctx, id: 'lynx' | 'bison', look: Look, angle: number): void {
  const b = TANK_TOP[id];
  const paint = (g: Ctx): void => (id === 'lynx' ? lynx(g, look) : bison(g, look));
  withShadow(ctx, b.pivot.x, b.pivot.y, angle, (v) => drawCached(ctx, `${id}-turret-${lookKey(look)}`, BOX[id], paint, v));
}

function pintle(ctx: Ctx): void {
  ctx.fillStyle = INK;
  ctx.beginPath();
  ctx.arc(0, 0, 2.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = C.steel;
  ctx.beginPath();
  ctx.arc(0, 0, 2.2, 0, Math.PI * 2);
  ctx.fill();
  crewTop(ctx, 0, 2.4, 1.6);
  cylinder(ctx, -0.45, -12.5, 0.9, 9.5, C.gun, 'y'); // barrel with its cooling jacket
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  for (let y = -11.5; y < -6; y += 1.1) ctx.fillRect(-0.45, y, 0.9, 0.35);
  plate(ctx, -1, -3.6, 2, 4.2, '#34362f', INK, 0.3); // receiver
  plate(ctx, -2.9, -2.6, 1.7, 2.6, C.can, INK, 0.3); // ammo can
  plate(ctx, -1.3, 0.4, 2.6, 0.8, '#2a2a24', INK, 0.25); // spade grips
}

/** The Jackal's pintle MG with its gunner, turned by `angle` around its mount. */
export function drawPintleTop(ctx: Ctx, x: number, y: number, angle: number): void {
  withShadow(ctx, x, y, angle, (v) => drawCached(ctx, 'jackal-pintle', [3.5, 13], pintle, v));
}
