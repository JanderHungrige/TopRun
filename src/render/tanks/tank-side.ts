import type { TankId } from '../../data/types';
import { antenna, bevel, bolts, cylinder, grille, INK, lens, path, plate, sheen } from '../detail/parts';
import { drawCached } from '../detail/sprite';
import { paintFleet } from '../fleet-paint';
import type { Look } from '../livery-art';
import { basket, C, jerrycan, lookKey, rim, smokeBank } from './vehicle-parts';
import { linkOffset, roadWheelXs, TANK_SIDE, type TankSide } from './vehicle-build';

// The tanks from the side (docs 104, 114), facing right (+x), the ground at y = 0, for the MOTOR POOL, the ramp start
// and the celebration: the track run — links sliding along the ground and over the top, the road wheels, the drive
// sprocket at the back, the idler at the front, return rollers — turning with `t`; then, cached per look, the side
// skirts with their bolts (the Bison's front sections in reactive armour), the hull in its paint with headlights, tools,
// exhaust and jerrycans, and the turret: the Lynx's 20 mm cannon, missile box and panoramic sight, the Bison's wedge
// armour and long 120 mm gun, smoke dischargers, antennas, the stowage basket.

type Ctx = CanvasRenderingContext2D;
type TankBody = 'lynx' | 'bison';

/** Where the hull's deck is and its turret's measurements, per tank. */
const DECK = { lynx: -18, bison: -21 } as const;

function trackRun(ctx: Ctx, b: TankSide, t: number): void {
  const h = b.trackH;
  ctx.fillStyle = INK;
  ctx.beginPath();
  ctx.roundRect(-b.half - 0.6, -h - 0.6, b.half * 2 + 1.2, h + 1.2, h / 2 + 0.6);
  ctx.fill();
  ctx.fillStyle = C.track;
  ctx.beginPath();
  ctx.roundRect(-b.half, -h, b.half * 2, h, h / 2);
  ctx.fill();
  ctx.fillStyle = '#12110d';
  ctx.beginPath();
  ctx.roundRect(-b.half + 1.4, -h + 1.4, b.half * 2 - 2.8, h - 2.8, h / 2 - 1.4);
  ctx.fill();
  const pitch = 2.2;
  const off = linkOffset(t * 30, pitch);
  const x0 = -b.half + h / 2;
  const x1 = b.half - h / 2;
  ctx.fillStyle = C.link;
  for (let x = x0 - pitch; x < x1 + pitch; x += pitch) {
    const ground = x - off; // the ground run lies still on the ground: under the moving tank it slides back
    const top = x + off; // the top run travels forward
    if (ground > x0 && ground < x1) ctx.fillRect(ground, -1.1, pitch * 0.55, 1.1);
    if (top > x0 && top < x1) ctx.fillRect(top, -h, pitch * 0.55, 1.1);
  }
}

function wheels(ctx: Ctx, b: TankSide, t: number): void {
  const h = b.trackH;
  const turn = -t * 6;
  const sprocket = { x: -b.half + h / 2, y: -h / 2 - 0.4, r: h * 0.42 };
  ctx.fillStyle = '#3a372f';
  for (let k = 0; k < 10; k++) { // the sprocket's teeth
    const a = turn + (k * Math.PI) / 5;
    ctx.beginPath();
    ctx.arc(sprocket.x + Math.cos(a) * sprocket.r, sprocket.y + Math.sin(a) * sprocket.r, 0.75, 0, Math.PI * 2);
    ctx.fill();
  }
  rim(ctx, sprocket.x, sprocket.y, sprocket.r * 0.85, turn);
  rim(ctx, b.half - h / 2, -h / 2 - 0.6, h * 0.36, turn); // idler
  for (const x of [-b.half * 0.35, b.half * 0.25]) rim(ctx, x, -h + 1.3, 1.1, turn); // return rollers
  for (const x of roadWheelXs(b)) {
    ctx.fillStyle = INK;
    ctx.beginPath();
    ctx.arc(x, -b.wheelR, b.wheelR + 0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = C.rubber;
    ctx.beginPath();
    ctx.arc(x, -b.wheelR, b.wheelR, 0, Math.PI * 2);
    ctx.fill();
    rim(ctx, x, -b.wheelR, b.wheelR * 0.78, turn);
  }
}

/** The side skirts over the wheels: plates, seams and bolts; the Bison's front sections carry armour blocks. */
function skirts(ctx: Ctx, id: TankBody, b: TankSide, look: Look): void {
  const top = -b.trackH - 1.2;
  const bottom = -b.trackH + (id === 'bison' ? 5.2 : 4.2);
  const pts = [-b.half + 1, top, b.half - 1.5, top, b.half + 1, bottom - 1.5, b.half - 1, bottom, -b.half + 1.6, bottom];
  painted(ctx, pts, look, `${id}-skirt`);
  const n = id === 'bison' ? 7 : 5;
  const seg = (b.half * 2 - 2.5) / n;
  for (let k = 1; k < n; k++) {
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(-b.half + 1 + k * seg - 0.2, top + 0.4, 0.4, bottom - top - 0.8);
  }
  for (let k = 0; k < n; k++) bolts(ctx, [-b.half + 1.8 + k * seg, top + 1, -b.half + 1.8 + k * seg, bottom - 1], 0.3);
  if (id === 'bison') for (let k = n - 3; k < n; k++) for (let r = 0; r < 2; r++) {
    plate(ctx, -b.half + 1.5 + k * seg, top + 0.6 + r * 2.5, seg - 1, 2.2, 'rgba(255,255,255,0.1)', INK, 0.35);
  }
}

/** A painted surface: the look's base, its camouflage and trim, the sheen and the lit edges. */
function painted(ctx: Ctx, pts: readonly number[], look: Look, key: string): void {
  const p = path(pts);
  const xs = pts.filter((_, i) => i % 2 === 0);
  const ys = pts.filter((_, i) => i % 2 === 1);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  ctx.fillStyle = look.base;
  ctx.fill(p);
  paintFleet(ctx, look, p, { x: x0, y: y0, w: x1 - x0, h: y1 - y0 }, key, 'side');
  sheen(ctx, p, x0, y0, x0 + (x1 - x0) * 0.3, y1, 0.8);
  bevel(ctx, pts, null, look.ink, 0.6);
}

function hull(ctx: Ctx, id: TankBody, b: TankSide, look: Look): void {
  const d = DECK[id];
  const y0 = -b.trackH - 1.2;
  const pts = id === 'lynx'
    ? [-b.half + 0.6, y0, b.half - 2, y0, b.half + 2, y0 - 2.4, b.half - 6, d, -b.half + 1.2, d, -b.half - 0.4, y0 - 2.4]
    : [-b.half + 0.6, y0, b.half - 2, y0, b.half + 2.6, y0 - 3, b.half - 8, d, -b.half + 1.2, d, -b.half - 0.6, y0 - 3];
  painted(ctx, pts, look, `${id}-hull-side`);
  lens(ctx, b.half - 2.2, d + 2.4, 0.7, '#f6efcf'); // headlight
  grille(ctx, -b.half + 2.5, d + 0.8, 5, 2.2, 3, 'y'); // exhaust
  jerrycan(ctx, -b.half + 9, d + 0.6, 3, 3.8);
  ctx.strokeStyle = '#3a3226'; // shovel and pick on the side
  ctx.lineWidth = 0.55;
  ctx.beginPath();
  ctx.moveTo(-b.half + 15, d + 2.6);
  ctx.lineTo(-b.half + 27, d + 2.6);
  ctx.stroke();
  plate(ctx, -b.half + 27, d + 1.8, 2.4, 1.6, '#4a4a42', INK, 0.25);
  bolts(ctx, [-b.half + 4, y0 - 1, b.half - 6, y0 - 1], 0.3);
}

function lynxTurret(ctx: Ctx, look: Look): void {
  const y = DECK.lynx;
  basket(ctx, -16.5, y - 5, 4.6, 4.4);
  cylinder(ctx, 11.5, y - 3.5, TANK_SIDE.lynx.barrel, 1.3, C.gun, 'x'); // 20 mm cannon
  plate(ctx, 11.5 + TANK_SIDE.lynx.barrel - 0.4, y - 3.9, 2.4, 2.1, '#2e302b', INK, 0.3);
  cylinder(ctx, 10, y - 1.8, 5, 0.6, C.gun, 'x'); // coax
  plate(ctx, 8.8, y - 4.6, 3, 3.4, '#3e413b', INK, 0.35); // mantlet
  painted(ctx, [-12.5, y, 8.5, y, 10.6, y - 2.6, 8.6, y - 5.8, -9.5, y - 6.2, -12.8, y - 3.6], look, 'lynx-turret-side');
  bevel(ctx, [-6.5, y - 6.1, 3, y - 6.1, 3.4, y - 8.8, -6.5, y - 8.8], C.can); // missile box
  for (const x of [1.6, 2.6]) lens(ctx, x + 0.4, y - 7.45, 0.45, '#1a1c16');
  plate(ctx, 4.2, y - 8.6, 2.8, 2.6, '#3a3c36', INK, 0.3); // panoramic sight
  plate(ctx, 6.4, y - 8.2, 0.5, 1.6, C.glass, INK, 0.2);
  ctx.save();
  ctx.translate(7.6, y - 4.4);
  ctx.rotate(-0.5);
  smokeBank(ctx, -1.5, -1, 3, 1);
  ctx.restore();
  antenna(ctx, -10, y - 6, 15, -0.32);
}

function bisonTurret(ctx: Ctx, look: Look): void {
  const y = DECK.bison;
  const L = TANK_SIDE.bison.barrel;
  basket(ctx, -24, y - 7.6, 6.4, 6);
  cylinder(ctx, 16, y - 5.6, L, 2.4, C.gun, 'x');
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  for (let x = 19; x < 16 + L - 2; x += 3) ctx.fillRect(x, y - 5.6, 0.3, 2.4); // thermal sleeve
  cylinder(ctx, 25, y - 6.3, 4.6, 3.8, C.gun, 'x'); // fume extractor
  plate(ctx, 16 + L - 1.5, y - 7, 1.4, 1.2, '#2a2c28', INK, 0.25); // muzzle sensor
  plate(ctx, 16 + L - 0.4, y - 6, 1.2, 3.2, '#2a2c28', INK, 0.3);
  plate(ctx, 13, y - 7.4, 3.6, 5.6, '#3e413b', INK, 0.4); // mantlet
  painted(ctx, [-18.5, y, 13.5, y, 17.5, y - 3.8, 12.5, y - 9, -13.5, y - 9.6, -18.8, y - 5.8], look, 'bison-turret-side');
  bevel(ctx, [12.5, y - 9, 17.5, y - 3.8, 13, y - 3.4, 9.5, y - 7.8], null, 'rgba(0,0,0,0.3)', 0.3); // the wedge
  plate(ctx, 5.2, y - 12.2, 3.2, 2.8, '#3a3c36', INK, 0.3); // gunner's sight
  plate(ctx, 7.9, y - 11.8, 0.5, 1.8, C.glass, INK, 0.2);
  plate(ctx, -3.4, y - 12.4, 3, 2.8, '#3a3c36', INK, 0.3); // the remote weapon station and its MG
  cylinder(ctx, -0.6, y - 11.8, 7, 0.7, C.gun, 'x');
  lens(ctx, -1.9, y - 11, 0.5, C.glass);
  ctx.save();
  ctx.translate(10, y - 7.4);
  ctx.rotate(-0.5);
  smokeBank(ctx, -2, -1.2, 4, 1.1);
  ctx.restore();
  for (const x of [-13, -9]) antenna(ctx, x, y - 9.4, 17, -0.28);
}

function body(ctx: Ctx, id: TankBody, look: Look): void {
  const b = TANK_SIDE[id];
  hull(ctx, id, b, look);
  if (id === 'lynx') lynxTurret(ctx, look);
  else bisonTurret(ctx, look);
  skirts(ctx, id, b, look);
}

const BOX = { lynx: [40, 34], bison: [48, 42] } as const;

export function drawTankSide(ctx: Ctx, id: TankBody, look: Look, t: number): void {
  const b = TANK_SIDE[id];
  trackRun(ctx, b, t);
  wheels(ctx, b, t);
  drawCached(ctx, `${id}-side-${lookKey(look)}`, BOX[id], (g) => body(g, id, look));
}

export const isTankSide = (id: TankId): id is TankBody => id === 'lynx' || id === 'bison';
