import { antenna, bevel, cylinder, grille, INK, lens, path, plate, sheen, sym } from '../detail/parts';
import { drawCached } from '../detail/sprite';
import { paintFleet } from '../fleet-paint';
import type { Look } from '../livery-art';
import type { TankTopOpts } from './tank-top';
import { drawPintleTop } from './turret-top';
import { BUGGY_TOP, linkOffset, type BuggyTop } from './vehicle-build';
import { C, crewTop, jerrycan, lightBar, lookKey, tyreTop } from './vehicle-parts';

// The buggies from above (docs 104, 114), front up (−y): four knobbly tyres whose lugs run with the ground covered, then
// the chassis in the vehicle's paint (doc 112), cached per look — the tub and its flared fenders, the bull bar and
// winch, headlights, the hood's louvres, the tube roll cage with its light bar, driver and gunner in helmets, the
// spare wheel, jerrycans and ammo on the rear deck, an antenna. The Jackal's pintle MG turns on its own; the Viper
// carries sand ladders, a rolled net and the eight-tube rocket pod.

type Ctx = CanvasRenderingContext2D;
type BuggyId = 'jackal' | 'viper';

const STEEL_TUBE = '#a9aaa2';

function arms(ctx: Ctx, b: BuggyTop): void {
  ctx.strokeStyle = '#2a2a26';
  ctx.lineWidth = 1;
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(sx * 5, sy * (b.wheel.y - 2));
    ctx.lineTo(sx * b.wheel.x, sy * b.wheel.y);
    ctx.moveTo(sx * 5, sy * (b.wheel.y + 1.6));
    ctx.lineTo(sx * b.wheel.x, sy * b.wheel.y);
    ctx.stroke();
  }
}

/** The tub and the fenders over the wheels, painted. */
function tub(ctx: Ctx, id: BuggyId, b: BuggyTop, look: Look): void {
  const L = b.len;
  const pts = sym([0, -L + 1.5, 4.6, -L + 1.5, 6.2, -L + 3, 6.6, -b.wheel.y + 4, 6.2, b.wheel.y - 4, 6.6, L - 2.4, 5, L - 0.8, 0, L - 0.8]);
  const fy = b.wheel.y;
  const fenders = [-1, 1].flatMap((sy) => [-1, 1].map((sx) => sym1(sx, [6, sy * fy - 4, 9.2, sy * fy - 4.2, 11.4, sy * fy - 2.8, 11.4, sy * fy + 2.8, 9.2, sy * fy + 4.2, 6, sy * fy + 4])));
  const all = [pts, ...fenders];
  const p = new Path2D();
  for (const q of all) p.addPath(path(q));
  ctx.fillStyle = look.base;
  ctx.fill(p);
  paintFleet(ctx, look, p, { x: -12.5, y: -L, w: 25, h: L * 2 }, `${id}-top`, 'top');
  sheen(ctx, p, -12.5, -L, 12.5, L, 0.8);
  for (const q of all) bevel(ctx, q, null, look.ink, 0.55);
}

const sym1 = (sx: number, pts: readonly number[]): number[] => pts.map((v, i) => (i % 2 === 0 ? v * sx : v));

function front(ctx: Ctx, b: BuggyTop): void {
  const L = b.len;
  grille(ctx, -3.6, -L + 3.4, 7.2, 3.6, 4);
  cylinder(ctx, -6.4, -L - 0.4, 12.8, 1.1, STEEL_TUBE, 'x'); // bull bar
  for (const x of [-4.6, 3.4]) cylinder(ctx, x, -L + 0.2, 1.2, 2.2, STEEL_TUBE, 'y');
  cylinder(ctx, -1.6, -L + 0.4, 3.2, 1.3, '#3a3a34', 'x'); // winch
  for (const s of [-1, 1]) lens(ctx, s * 4.6, -L + 1.9, 0.6, '#f6efcf');
}

/** The roll cage seen from above: side tubes, cross tubes, pillars to the hood and the light bar. */
function cage(ctx: Ctx, y0: number, y1: number): void {
  for (const s of [-1, 1]) {
    cylinder(ctx, s * 6.4 - 0.55, y0, 1.1, y1 - y0, STEEL_TUBE, 'y');
    ctx.strokeStyle = STEEL_TUBE;
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.moveTo(s * 6.2, y0);
    ctx.lineTo(s * 4.8, y0 - 4.5);
    ctx.stroke();
  }
  cylinder(ctx, -6.4, y0 - 0.5, 12.8, 1.1, STEEL_TUBE, 'x');
  cylinder(ctx, -6.4, y1 - 0.5, 12.8, 1.1, STEEL_TUBE, 'x');
  lightBar(ctx, -4.6, y0 - 0.3, 9.2, 4);
}

/** The open cockpit: a dark floor of chequer plate under the cage, the seats and the crew in it. */
function crew(ctx: Ctx, y: number): void {
  ctx.fillStyle = 'rgba(22,20,16,0.7)';
  ctx.fillRect(-5.8, y - 5, 11.6, 13.2);
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  for (let u = -5.2; u < 5.6; u += 1.3) for (let v = y - 4.4; v < y + 8; v += 1.3) ctx.fillRect(u, v, 0.5, 0.25);
  for (const s of [-1, 1]) plate(ctx, s * 2.8 - 1.9, y - 1.2, 3.8, 4.2, '#2a2620', INK, 0.3); // seats
  ctx.strokeStyle = '#1a1a16'; // steering wheel
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.arc(-2.8, y - 2.8, 1.1, 0, Math.PI * 2);
  ctx.stroke();
  crewTop(ctx, -2.8, y, 1.6);
  crewTop(ctx, 2.8, y, 1.6);
}

function rearDeck(ctx: Ctx, b: BuggyTop): void {
  const L = b.len;
  ctx.save(); // the spare wheel, standing across the back
  ctx.translate(0, L - 3.6);
  ctx.rotate(Math.PI / 2);
  tyreTop(ctx, 0, 0, 2.8, 9.4, 0);
  ctx.restore();
  for (const s of [-1, 1]) jerrycan(ctx, s > 0 ? 3.6 : -6.2, L - 10.8, 2.6, 3.6);
  plate(ctx, -1.6, L - 10.4, 3.2, 2.2, C.can, INK, 0.3); // ammo box
  antenna(ctx, -5.8, L - 1.8, 7, Math.PI - 0.1);
  cylinder(ctx, 3.4, L - 1.2, 1, 1.8, '#3a342c', 'y'); // exhaust
}

/** The Viper's load: sand ladders along the sides, the rolled net and the rocket pod on its cradle. */
function viperLoad(ctx: Ctx, b: BuggyTop): void {
  for (const s of [-1, 1]) {
    plate(ctx, s > 0 ? 6.7 : -8.9, -7.5, 2.2, 15, '#c8a65a', INK, 0.3);
    ctx.fillStyle = 'rgba(40,30,10,0.6)';
    for (let y = -6.4; y < 7; y += 1.8) ctx.fillRect((s > 0 ? 7.3 : -8.3), y, 1, 0.8);
  }
  cylinder(ctx, -5.6, 3.6, 11.2, 1.8, C.tarp, 'x');
  plate(ctx, -5.6, 6, 11.2, 11, '#4a5030', INK, 0.45);
  for (let c = 0; c < 4; c++) {
    cylinder(ctx, -5 + c * 2.6, 6.5, 2.4, 10, '#525a36', 'y');
    lens(ctx, -3.8 + c * 2.6, 6.9, 0.8, '#141410');
    lens(ctx, -3.8 + c * 2.6, 6.9, 0.45, C.red);
  }
  plate(ctx, -1.2, b.len - 6, 2.4, 1.6, '#2a2a24', INK, 0.3); // the cradle's pivot
}

function chassis(ctx: Ctx, id: BuggyId, look: Look): void {
  const b = BUGGY_TOP[id];
  arms(ctx, b);
  tub(ctx, id, b, look);
  front(ctx, b);
  const cy = id === 'viper' ? -5 : -3;
  crew(ctx, cy);
  cage(ctx, cy - 5.6, cy + 8.6);
  if (id === 'viper') viperLoad(ctx, b);
  rearDeck(ctx, b);
}

export function drawBuggyTop(ctx: Ctx, id: BuggyId, look: Look, o: TankTopOpts): void {
  const b = BUGGY_TOP[id];
  const off = linkOffset(o.driven, 2.2);
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) tyreTop(ctx, sx * b.wheel.x, sy * b.wheel.y, b.wheel.w, b.wheel.l, off);
  drawCached(ctx, `${id}-chassis-${lookKey(look)}`, [14, b.len + 2], (g) => chassis(g, id, look));
  if (id === 'jackal') drawPintleTop(ctx, 0, 6, o.turret);
}
