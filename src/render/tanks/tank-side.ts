import type { TankId } from '../../data/types';
import { paintFleet } from '../fleet-paint';
import type { Look } from '../livery-art';
import { lazy, polys, stroke } from '../planes/geom';

// The tanks and buggies from the side (doc 104), facing right (+x), the ground at y = 0: a tank's track run with its road
// wheels, the hull with a sloped glacis, the turret and the long barrel (skirts and a muzzle brake on the Bison); a
// buggy's two big wheels, the low body, the roll cage, the seats and its gun or rocket rack. `t` turns the wheels. For
// the MOTOR POOL, the ramp start and the celebration.

const INK = '#1a140a';
const TRACK = '#2a2520';
const RUBBER = '#1c1a18';
const STEEL = '#6a6a62';
const HUB = '#8a8a80';

interface SideBuild { half: number; trackH: number; wheels: number; hull: readonly number[]; turret: readonly number[]; barrel: number; skirts: boolean }

const TANK_SIDE = {
  lynx: {
    half: 26, trackH: 10, wheels: 4, hull: [-27, -9, 22, -9, 28, -15, 20, -20, -27, -20],
    turret: [-12, -20, 10, -20, 8, -27, -8, -28, -12, -25], barrel: 22, skirts: false,
  },
  bison: {
    half: 31, trackH: 12, wheels: 5, hull: [-32, -11, 26, -11, 33, -18, 24, -24, -32, -24],
    turret: [-16, -24, 14, -24, 11, -33, -11, -34, -16, -30], barrel: 30, skirts: true,
  },
} as const satisfies Record<string, SideBuild>;

const geo = lazy(() => ({
  lynx: { hull: polys(TANK_SIDE.lynx.hull), turret: polys(TANK_SIDE.lynx.turret) },
  bison: { hull: polys(TANK_SIDE.bison.hull), turret: polys(TANK_SIDE.bison.turret) },
}));

function spokes(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, turn: number): void {
  ctx.strokeStyle = HUB;
  ctx.lineWidth = 0.9;
  for (let k = 0; k < 3; k++) {
    const a = turn + (k * Math.PI) / 3;
    ctx.beginPath();
    ctx.moveTo(x - Math.cos(a) * r, y - Math.sin(a) * r);
    ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
    ctx.stroke();
  }
}

export function drawTankSide(ctx: CanvasRenderingContext2D, id: 'lynx' | 'bison', look: Look, t: number): void {
  const b = TANK_SIDE[id];
  const g = geo()[id];
  const h = b.trackH;
  ctx.fillStyle = INK;
  ctx.beginPath();
  ctx.roundRect(-b.half - 1, -h - 1, b.half * 2 + 2, h + 2, h / 2 + 1);
  ctx.fill();
  ctx.fillStyle = TRACK;
  ctx.beginPath();
  ctx.roundRect(-b.half, -h, b.half * 2, h, h / 2);
  ctx.fill();
  const r = h * 0.36;
  for (let k = 0; k < b.wheels; k++) {
    const x = -b.half + h / 2 + (k * (b.half * 2 - h)) / (b.wheels - 1);
    ctx.fillStyle = '#4a4438';
    ctx.beginPath();
    ctx.arc(x, -h / 2, r, 0, Math.PI * 2);
    ctx.fill();
    spokes(ctx, x, -h / 2, r * 0.8, -t * 6);
  }
  ctx.fillStyle = look.base;
  ctx.fill(g.hull);
  paintFleet(ctx, look, g.hull, { x: -b.half - 2, y: -b.trackH * 2.6, w: b.half * 2 + 4, h: b.trackH * 2 }, `${id}-side`, 'side');
  stroke(ctx, g.hull, look.ink, 0.9);
  if (b.skirts) {
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(-b.half + 2, -h - 1, b.half * 2 - 4, 4);
  }
  const ty = b.turret[3] ?? -27;
  ctx.fillStyle = INK;
  ctx.fillRect(b.turret[2] ?? 8, ty + 2.4, b.barrel + 1, 3.2);
  ctx.fillStyle = STEEL;
  ctx.fillRect(b.turret[2] ?? 8, ty + 3, b.barrel, 2);
  if (b.skirts) {
    ctx.fillStyle = INK;
    ctx.fillRect((b.turret[2] ?? 8) + b.barrel - 4, ty + 1.8, 5, 4.4);
  }
  ctx.fillStyle = look.under;
  ctx.fill(g.turret);
  stroke(ctx, g.turret, look.ink, 0.9);
  ctx.fillStyle = '#2a241a';
  ctx.fillRect(-4, (b.turret[7] ?? -28) - 2, 6, 2);
}

/** A buggy wheel from the side: the knobbly tyre, the rim, spokes turning with `t`. */
function bigWheel(ctx: CanvasRenderingContext2D, x: number, r: number, t: number): void {
  ctx.fillStyle = INK;
  ctx.beginPath();
  ctx.arc(x, -r, r + 0.9, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = RUBBER;
  ctx.beginPath();
  ctx.arc(x, -r, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#5a564c';
  ctx.beginPath();
  ctx.arc(x, -r, r * 0.5, 0, Math.PI * 2);
  ctx.fill();
  spokes(ctx, x, -r, r * 0.45, -t * 9);
}

const BUGGY_SIDE = {
  jackal: { wheelX: 15, r: 7, body: [-22, -9, 17, -9, 23, -13, 19, -17, -20, -16, -23, -12] },
  viper: { wheelX: 18, r: 7.5, body: [-26, -9, 20, -9, 26, -13, 22, -17, -23, -17, -27, -12] },
} as const;

const buggyGeo = lazy(() => ({ jackal: polys(BUGGY_SIDE.jackal.body), viper: polys(BUGGY_SIDE.viper.body) }));

export function drawBuggySide(ctx: CanvasRenderingContext2D, id: 'jackal' | 'viper', look: Look, t: number): void {
  const b = BUGGY_SIDE[id];
  const body = buggyGeo()[id];
  ctx.strokeStyle = '#3a3630'; // suspension arms
  ctx.lineWidth = 2;
  for (const x of [-b.wheelX, b.wheelX]) {
    ctx.beginPath();
    ctx.moveTo(x, -b.r);
    ctx.lineTo(x * 0.6, -11);
    ctx.stroke();
  }
  ctx.fillStyle = look.base;
  ctx.fill(body);
  paintFleet(ctx, look, body, { x: -28, y: -18, w: 56, h: 10 }, `${id}-side`, 'side');
  stroke(ctx, body, look.ink, 0.9);
  for (const x of [-b.wheelX, b.wheelX]) bigWheel(ctx, x, b.r, t);
  ctx.fillStyle = '#2a2018'; // seat backs
  ctx.fillRect(-7, -23, 3, 7);
  ctx.fillRect(1, -23, 3, 7);
  ctx.strokeStyle = '#c8c8c0'; // the roll cage
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.moveTo(-12, -16);
  ctx.lineTo(-9, -30);
  ctx.lineTo(6, -30);
  ctx.lineTo(12, -17);
  ctx.moveTo(-9, -30);
  ctx.lineTo(4, -17);
  ctx.stroke();
  if (id === 'viper') sideRack(ctx);
  else sideGun(ctx);
}

function sideGun(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = INK;
  ctx.fillRect(-4, -36, 2, 7);
  ctx.fillRect(-6, -38, 20, 3.2);
  ctx.fillStyle = STEEL;
  ctx.fillRect(-5.4, -37.4, 19, 2);
}

function sideRack(ctx: CanvasRenderingContext2D): void {
  ctx.save();
  ctx.translate(-16, -18);
  ctx.rotate(-0.35);
  ctx.fillStyle = INK;
  ctx.fillRect(-1, -9, 18, 9);
  ctx.fillStyle = '#4a5030';
  ctx.fillRect(-0.4, -8.4, 16.8, 7.8);
  ctx.fillStyle = '#c84a2a';
  for (let k = 0; k < 2; k++) ctx.fillRect(16, -7.4 + k * 3.6, 1.6, 2.2);
  ctx.restore();
}

export const isTankSide = (id: TankId): id is 'lynx' | 'bison' => id === 'lynx' || id === 'bison';
