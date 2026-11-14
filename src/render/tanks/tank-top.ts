import type { TankId } from '../../data/types';
import { bevel, bolts, grille, hatch, INK, lens, path, plate, sheen, sym } from '../detail/parts';
import { drawCached } from '../detail/sprite';
import { paintFleet } from '../fleet-paint';
import type { Look } from '../livery-art';
import { drawTurretTop } from './turret-top';
import { C, jerrycan, lookKey } from './vehicle-parts';
import { BUGGY_TOP, linkOffset, TANK_TOP, topExtent, topSilhouetteBox, type TankTop } from './vehicle-build';

// The tanks from above (docs 104, 114), front up (−y), around the hull's middle: the tracks with their links running
// under the fenders, the hull in the vehicle's paint (doc 112) — glacis with the driver's hatch and periscopes, spare
// track links, headlights and tow hooks, stowage boxes on the fenders, the engine deck's grilles, exhaust, tail lights,
// jerrycans and tow cables (the Lynx's rear door, the Bison's armour blocks) — cached per look; then the turret,
// turned by `turret` (rad, relative to the hull).

export interface TankTopOpts {
  t: number;
  driven: number;
  turret: number;
}

export const isTankBody = (id: TankId): id is 'lynx' | 'bison' => id === 'lynx' || id === 'bison';

/** The outline the flash and the shadow fill: the vehicle's static extent, and the tanks' turret ring. */
export function tankTopSilhouette(id: TankId): Path2D {
  const p = new Path2D();
  if (!isTankBody(id)) {
    const b = BUGGY_TOP[id];
    const { x, y, w, l } = b.wheel;
    p.roundRect(-7, -b.len - 1, 14, b.len * 2 + 2, 2);
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) p.roundRect(sx * x - w / 2 - 0.5, sy * y - l / 2 - 0.5, w + 1, l + 1, 2);
    return p;
  }
  const t = TANK_TOP[id];
  const e = topExtent(id);
  p.roundRect(-e.hx - 0.5, -t.track.len - 0.8, (e.hx + 0.5) * 2, (t.track.len + 0.8) * 2, 2);
  p.roundRect(-t.hull.hx, -t.hull.hy - 1, t.hull.hx * 2, t.hull.hy * 2 + 2, 2);
  p.arc(t.pivot.x, t.pivot.y, t.ring + 1.5, 0, Math.PI * 2);
  return p;
}

/** The fender's outer edge (the track shows outside it). */
const fenderX = (b: TankTop): number => b.track.x + b.track.w / 2 - 1.2;

function outline(b: TankTop): number[] {
  const { hx, hy } = b.hull;
  const fx = fenderX(b);
  const fy0 = -b.track.len + 3.8;
  const fy1 = b.track.len - 3.4;
  return sym([0, -hy, hx - 2.5, -hy, hx, -hy + 1.7, fx, fy0, fx, fy1, fx - 0.9, fy1 + 1.2, hx, fy1 + 1.2, hx, hy, 0, hy]);
}

/** One track: the belt, its links sliding back with the ground covered, guide horns down the middle. */
function track(ctx: CanvasRenderingContext2D, b: TankTop, side: number, driven: number): void {
  const { w, len, pitch } = b.track;
  const x = side * b.track.x - w / 2;
  ctx.fillStyle = INK;
  ctx.beginPath();
  ctx.roundRect(x - 0.5, -len - 0.5, w + 1, len * 2 + 1, 1.6);
  ctx.fill();
  ctx.fillStyle = C.track;
  ctx.beginPath();
  ctx.roundRect(x, -len, w, len * 2, 1.4);
  ctx.fill();
  const off = linkOffset(driven, pitch);
  for (let y = -len - pitch + off; y < len; y += pitch) {
    if (y < -len + 0.3) continue;
    ctx.fillStyle = C.link;
    ctx.fillRect(x + 0.3, y, w - 0.6, pitch * 0.62);
    ctx.fillStyle = C.linkHi;
    ctx.fillRect(x + 0.3, y, w - 0.6, 0.35);
    ctx.fillStyle = '#16140f';
    ctx.fillRect(x + w / 2 - 0.35, y + 0.3, 0.7, pitch * 0.35);
  }
}

/** The front: glacis sheen, driver's hatch and periscopes, spare links, headlights in their guards, tow hooks. */
function front(ctx: CanvasRenderingContext2D, b: TankTop): void {
  const { hx, hy } = b.hull;
  const gy = -hy + (hy > 24 ? 7 : 6);
  bevel(ctx, sym([0, -hy, hx - 2.5, -hy, hx, -hy + 1.7, hx, gy, 0, gy]), null, 'rgba(0,0,0,0.35)', 0.35);
  hatch(ctx, -hx * 0.42, gy + 2.2, hx > 10 ? 1.9 : 1.6, 'rgba(0,0,0,0.12)');
  for (let k = -1; k <= 1; k++) plate(ctx, -hx * 0.42 + k * 1.3 - 0.45, gy + 0.05, 0.9, 0.6, C.glass, INK, 0.25);
  for (let k = 0; k < 3; k++) plate(ctx, -hx * 0.2 + 1.5, -hy + 2 + k * 1.15, hx * 0.75, 0.8, C.link, INK, 0.25);
  for (const s of [-1, 1]) {
    plate(ctx, s * (hx - 1.1) - 1, -hy + 0.4, 2, 1.4, '#3a3a32', INK, 0.25);
    lens(ctx, s * (hx - 1.1) - 0.4, -hy + 1.1, 0.4, '#f6efcf');
    lens(ctx, s * (hx - 1.1) + 0.45, -hy + 1.1, 0.3, C.amber);
    ctx.fillStyle = '#1a1a16';
    ctx.fillRect(s * 3.2 - 0.7, -hy - 0.9, 1.4, 1.1); // tow hooks
  }
}

/** The fenders: stowage boxes with bolted lids (the Bison's front sections in reactive-armour blocks). */
function fenders(ctx: CanvasRenderingContext2D, b: TankTop, bison: boolean): void {
  const x0 = b.hull.hx + 0.3;
  const w = fenderX(b) - x0 - 0.3;
  for (const s of [-1, 1]) {
    const x = s > 0 ? x0 : -x0 - w;
    if (bison) for (let k = 0; k < 4; k++) plate(ctx, x, -b.track.len + 4.6 + k * 2.4, w, 2.1, 'rgba(255,255,255,0.08)', INK, 0.35);
    for (const y of bison ? [-6, 4] : [-12, -3, 6]) {
      plate(ctx, x, y, w, 6.5, 'rgba(0,0,0,0.06)', INK, 0.35);
      bolts(ctx, [x + 0.6, y + 0.6, x + w - 0.6, y + 0.6, x + 0.6, y + 5.9, x + w - 0.6, y + 5.9], 0.25);
    }
  }
}

/** The engine deck at the back: grilles, access panels, the exhaust, tail lights, jerrycans; the Lynx's rear door. */
function deck(ctx: CanvasRenderingContext2D, b: TankTop, bison: boolean): void {
  const { hx, hy } = b.hull;
  const y0 = hy - (bison ? 13 : 9.5);
  for (const s of [-1, 1]) grille(ctx, s > 0 ? 1 : -hx + 1.6, y0, hx - 2.6, bison ? 5.5 : 4, bison ? 6 : 4);
  if (bison) for (const s of [-1, 1]) grille(ctx, s > 0 ? 1 : -hx + 1.6, y0 + 6.4, hx - 2.6, 3.4, 4, 'y');
  plate(ctx, -hx * 0.5, hy - 2.4, hx, 1.6, '#1d1b17', INK, 0.3); // exhaust
  for (const s of [-1, 1]) {
    lens(ctx, s * (hx - 0.9), hy - 0.6, 0.35, C.red);
    jerrycan(ctx, s > 0 ? hx - 3.6 : -hx + 0.9, hy - (bison ? 6.8 : 5.8), 2.7, 3.6);
  }
  if (!bison) {
    plate(ctx, -3.2, hy - 6.2, 6.4, 3.6, null, INK, 0.35); // the rear door
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(-0.9, hy - 4.9, 1.8, 0.45);
  }
  ctx.strokeStyle = 'rgba(30,26,20,0.7)'; // tow cables along the deck's sides
  ctx.lineWidth = 0.55;
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(s * (hx - 0.6), -hy + 9);
    ctx.lineTo(s * (hx - 0.6), y0 - 1.5);
    ctx.stroke();
  }
}

function hull(ctx: CanvasRenderingContext2D, id: 'lynx' | 'bison', look: Look): void {
  const b = TANK_TOP[id];
  const pts = outline(b);
  const p = path(pts);
  ctx.fillStyle = look.base;
  ctx.fill(p);
  const fx = fenderX(b);
  paintFleet(ctx, look, p, { x: -fx, y: -b.hull.hy, w: fx * 2, h: b.hull.hy * 2 }, `${id}-top`, 'top');
  sheen(ctx, p, -fx, -b.hull.hy, fx, b.hull.hy, 0.9);
  ctx.strokeStyle = look.panel;
  ctx.lineWidth = 0.3;
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(s * b.hull.hx, -b.hull.hy + 2);
    ctx.lineTo(s * b.hull.hx, b.hull.hy - 1);
    ctx.stroke();
  }
  front(ctx, b);
  fenders(ctx, b, id === 'bison');
  deck(ctx, b, id === 'bison');
  bevel(ctx, pts, null, look.ink, 0.7);
}

export function drawTankTop(ctx: CanvasRenderingContext2D, id: 'lynx' | 'bison', look: Look, o: TankTopOpts): void {
  const b = TANK_TOP[id];
  for (const s of [-1, 1]) track(ctx, b, s, o.driven);
  const box = topSilhouetteBox(id);
  drawCached(ctx, `${id}-hull-${lookKey(look)}`, [box.hx + 1, box.hy + 1.5], (g) => hull(g, id, look));
  drawTurretTop(ctx, id, look, o.turret);
}
