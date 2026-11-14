import type { TowerId } from '../data/towers';
import { circle, ellipse, fillPoly } from './shapes';

// The towers of a defence from above (doc 106), drawn in code around the pad's centre in the steppe's sand and steel:
// the MG nest's sandbag ring and gun, the flak tower's twin barrels, the mortar pit's tube and shells, the tesla tower's
// coils and glowing ball, the jammer's turning dishes, the rocket battery's box of tubes. `aim` turns the gun (0 = up),
// `level` shows as gold chevrons, `heat` > 0 as a red, steaming overheat.

type Ctx = CanvasRenderingContext2D;

const INK = '#1a140a';
const SAND = '#b8a070';
const STEEL = '#6a6a62';
const DARK = '#3a3a34';

function sandbags(ctx: Ctx, r: number, n: number): void {
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    ellipse(ctx, Math.cos(a) * r, Math.sin(a) * r, 5.5, 4, INK, a);
    ellipse(ctx, Math.cos(a) * r, Math.sin(a) * r, 4.6, 3.2, i % 2 ? SAND : '#a89060', a);
  }
}

function barrel(ctx: Ctx, aim: number, len: number, w: number, dx = 0): void {
  ctx.save();
  ctx.rotate(aim);
  ctx.fillStyle = INK;
  ctx.fillRect(dx - w / 2 - 0.8, -len - 0.8, w + 1.6, len + 1.6);
  ctx.fillStyle = STEEL;
  ctx.fillRect(dx - w / 2, -len, w, len);
  ctx.restore();
}

const mgnest = (ctx: Ctx, aim: number): void => {
  sandbags(ctx, 14, 10);
  circle(ctx, 0, 0, 8, DARK);
  barrel(ctx, aim, 18, 2.6);
  ctx.save();
  ctx.rotate(aim);
  ctx.fillStyle = '#4a5030';
  ctx.fillRect(3, -2, 5, 6); // the ammo box
  ctx.restore();
};

const flak = (ctx: Ctx, aim: number): void => {
  fillPoly(ctx, [-13, -13, 13, -13, 13, 13, -13, 13], INK);
  fillPoly(ctx, [-12, -12, 12, -12, 12, 12, -12, 12], '#7a7a6e');
  barrel(ctx, aim, 20, 2.4, -3.5);
  barrel(ctx, aim, 20, 2.4, 3.5);
  circle(ctx, 0, 0, 6, DARK);
  circle(ctx, -8, 8, 2.4, '#9ad8ff'); // the little radar
};

const mortarpit = (ctx: Ctx, aim: number): void => {
  circle(ctx, 0, 0, 16, INK);
  circle(ctx, 0, 0, 14.5, '#5a4a32');
  circle(ctx, 0, 0, 10, '#3a3022');
  for (const [x, y] of [[-9, 8], [-6, 10], [-3, 11]] as const) ellipse(ctx, x, y, 2, 3.2, '#8a8040');
  barrel(ctx, aim, 10, 6);
};

const tesla = (ctx: Ctx, _aim: number, t: number): void => {
  circle(ctx, 0, 0, 14, INK);
  for (const [r, c] of [[13, '#8a6a3a'], [10, '#b0844a'], [7, '#8a6a3a']] as const) circle(ctx, 0, 0, r, c);
  const glow = 0.6 + 0.4 * Math.sin(t * 9);
  circle(ctx, 0, 0, 5.5, `rgba(120,200,255,${glow.toFixed(2)})`);
  circle(ctx, 0, 0, 2.5, '#eaf8ff');
  for (let k = 0; k < 3; k++) { // little sparks
    const a = t * 7 + k * 2.1;
    circle(ctx, Math.cos(a) * 8, Math.sin(a) * 8, 1.1, '#bfe8ff');
  }
};

const jammer = (ctx: Ctx, _aim: number, t: number): void => {
  circle(ctx, 0, 0, 9, INK);
  circle(ctx, 0, 0, 8, '#6a6a62');
  for (const side of [-1, 1]) {
    ctx.save();
    ctx.rotate(t * 1.4 * side);
    ellipse(ctx, side * 9, 0, 4, 6, INK);
    ellipse(ctx, side * 9, 0, 3, 5, '#c8c8bc');
    ctx.restore();
  }
  circle(ctx, 0, 0, 2.6, Math.floor(t * 2) % 2 ? '#ff4a3a' : '#5a2a22');
};

const rockets = (ctx: Ctx, aim: number): void => {
  circle(ctx, 0, 0, 12, INK);
  circle(ctx, 0, 0, 11, '#7a7a6e');
  ctx.save();
  ctx.rotate(aim);
  fillPoly(ctx, [-9, -14, 9, -14, 9, 6, -9, 6], INK);
  fillPoly(ctx, [-8, -13, 8, -13, 8, 5, -8, 5], '#4a5030');
  for (const x of [-4, 4]) for (const y of [-9, -2]) circle(ctx, x, y, 2.4, '#1a1a14');
  ctx.restore();
};

const ART: Readonly<Record<TowerId, (ctx: Ctx, aim: number, t: number) => void>> = { mgnest, flak, mortarpit, tesla, jammer, rockets };

export function drawTower(ctx: Ctx, id: TowerId, x: number, y: number, o: { aim: number; level: number; heat: number; t: number; scale?: number }): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(o.scale ?? 1, o.scale ?? 1);
  ART[id](ctx, o.aim, o.t);
  for (let k = 0; k < o.level - 1; k++) fillPoly(ctx, [-6 + k * 7, 18, -3 + k * 7, 15, 0 + k * 7, 18, -3 + k * 7, 17], '#ffd25a');
  if (o.heat > 0) {
    circle(ctx, 0, 0, 16, 'rgba(255,60,30,0.35)');
    for (let k = 0; k < 3; k++) circle(ctx, Math.sin(o.t * 5 + k) * 6, -8 - ((o.t * 30 + k * 9) % 18), 3, 'rgba(230,230,230,0.5)');
  }
  ctx.restore();
}
