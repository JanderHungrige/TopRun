import type { Pal, UnitFn } from '../draw-ground-units';
import { circle, ellipse, fillPoly } from '../shapes';

// The invasion's machines (doc 105), heads down (+y): the tripod striding on three long legs with its heat-ray emitter,
// the armoured siege crawler with the lobbing tube on its back, the dug-in plasma cannon, and the war tripod — map 7's
// mini-boss — twice the tripod's size with two rays and missile pods. Flashed or as a shadow they keep the outline.

type SteppeMachine = 'tripod' | 'siegebug' | 'plasmagun' | 'wartripod';

/** Three long legs from the hull, each lifting in turn: the tripod's stride. */
function tripodLegs(ctx: CanvasRenderingContext2D, p: Pal, t: number, reach: number, width: number): void {
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + Math.PI / 2;
    const lift = Math.max(0, Math.sin(t * 2.2 + i * 2.1)) * reach * 0.18;
    const fx = Math.cos(a) * (reach - lift);
    const fy = Math.sin(a) * (reach - lift);
    ctx.lineCap = 'round';
    ctx.strokeStyle = p.mono ? p.body : p.line;
    ctx.lineWidth = width + 1.6;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(fx * 0.55 + Math.cos(a + 0.5) * 4, fy * 0.55 + Math.sin(a + 0.5) * 4);
    ctx.lineTo(fx, fy);
    ctx.stroke();
    ctx.strokeStyle = p.mono ? p.body : p.dark;
    ctx.lineWidth = width;
    ctx.stroke();
    ellipse(ctx, fx, fy, width * 1.2, width * 1.2, p.mono ? p.body : p.light); // the foot
  }
}

/** A heat-ray emitter, glowing hotter just before it fires. */
function emitter(ctx: CanvasRenderingContext2D, p: Pal, x: number, y: number, r: number, t: number): void {
  ellipse(ctx, x, y, r + 1, r + 1, p.mono ? p.body : p.line);
  ellipse(ctx, x, y, r, r, p.mono ? p.body : p.dark);
  if (p.mono) return;
  const heat = 0.5 + 0.5 * Math.sin(t * 5);
  circle(ctx, x, y, r * 0.65, `rgba(255,${Math.round(90 + heat * 120)},60,${(0.6 + heat * 0.4).toFixed(2)})`);
  circle(ctx, x, y, r * 0.25, '#fff4d0');
}

const tripod: UnitFn = (ctx, p, t) => {
  tripodLegs(ctx, p, t, 24, 2.6);
  ellipse(ctx, 0, 0, 13, 12, p.mono ? p.body : p.line); // the hull
  ellipse(ctx, 0, 0, 12, 11, p.body);
  ellipse(ctx, 0, -3, 8, 6, p.mono ? p.body : p.light); // the hood
  emitter(ctx, p, 0, 9, 3.6, t);
  if (p.mono) return;
  ctx.strokeStyle = p.trim;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(0, 0, 10, 9, 0, 0.3, Math.PI - 0.3);
  ctx.stroke();
  circle(ctx, -5, 4, 1, p.glass);
  circle(ctx, 5, 4, 1, p.glass);
};

const siegebug: UnitFn = (ctx, p, t, aim) => {
  ctx.strokeStyle = p.mono ? p.body : p.dark;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  for (let i = 0; i < 4; i++) for (const side of [-1, 1]) { // eight stubby legs
    const g = Math.sin(t * 3 + i * 1.6 + (side > 0 ? 1 : 0)) * 2.5;
    ctx.beginPath();
    ctx.moveTo(side * 14, -14 + i * 9);
    ctx.lineTo(side * 24, -12 + i * 9 + g);
    ctx.stroke();
  }
  ellipse(ctx, 0, 0, 20, 27, p.mono ? p.body : p.line); // the shell
  ellipse(ctx, 0, 0, 19, 26, p.body);
  ellipse(ctx, 0, 24, 10, 7, p.mono ? p.body : p.dark); // the head
  if (!p.mono) {
    for (let k = 0; k < 4; k++) { // armour plates
      ctx.strokeStyle = p.dark;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.ellipse(0, -14 + k * 9, 18 - Math.abs(k - 1.5) * 2, 5, 0, 0.15, Math.PI - 0.15);
      ctx.stroke();
    }
    ctx.fillStyle = p.trim;
    ctx.fillRect(-1, -24, 2, 44);
  }
  ctx.save(); // the lobbing tube on its back, turned to the target
  ctx.translate(0, -4);
  ctx.rotate(aim - Math.PI);
  fillPoly(ctx, [-4, -2, 4, -2, 3, 16, -3, 16], p.mono ? p.body : p.line);
  fillPoly(ctx, [-3, -1, 3, -1, 2.2, 15, -2.2, 15], p.mono ? p.body : p.dark);
  if (!p.mono) circle(ctx, 0, 15, 1.8, p.glass);
  ctx.restore();
  ellipse(ctx, 0, -4, 6, 6, p.mono ? p.body : p.light);
};

const plasmagun: UnitFn = (ctx, p, t, aim) => {
  for (let i = 0; i < 8; i++) { // the ring of bio-sandbags
    const a = (i / 8) * Math.PI * 2;
    ellipse(ctx, Math.cos(a) * 15, Math.sin(a) * 15, 6, 4.5, p.mono ? p.body : '#6a5a48', a);
  }
  fillPoly(ctx, [-9, -5, 0, -10, 9, -5, 9, 5, 0, 10, -9, 5], p.mono ? p.body : p.line); // the hexagonal base
  fillPoly(ctx, [-8, -4.5, 0, -9, 8, -4.5, 8, 4.5, 0, 9, -8, 4.5], p.body);
  ctx.save();
  ctx.rotate(aim - Math.PI);
  for (const dx of [-3, 3]) { // twin barrels
    ctx.fillStyle = p.mono ? p.body : p.line;
    ctx.fillRect(dx - 2, 2, 4, 17);
    if (p.mono) continue;
    ctx.fillStyle = p.dark;
    ctx.fillRect(dx - 1.3, 2, 2.6, 16);
    for (let k = 0; k < 3; k++) ctx.fillRect(dx - 2, 6 + k * 4, 4, 1.2);
  }
  ctx.restore();
  ellipse(ctx, 0, 0, 5.5, 5.5, p.mono ? p.body : p.light);
  if (p.mono) return;
  const coil = 0.5 + 0.5 * Math.sin(t * 6);
  circle(ctx, 0, 0, 3, `rgba(255,74,216,${(0.5 + coil * 0.5).toFixed(2)})`);
};

const wartripod: UnitFn = (ctx, p, t) => {
  tripodLegs(ctx, p, t * 0.7, 54, 5);
  ellipse(ctx, 0, 0, 28, 25, p.mono ? p.body : p.line);
  ellipse(ctx, 0, 0, 27, 24, p.body);
  ellipse(ctx, 0, -6, 18, 12, p.mono ? p.body : p.light); // the armoured head
  for (const side of [-1, 1]) {
    emitter(ctx, p, side * 15, 16, 5, t);
    fillPoly(ctx, [side * 20, -14, side * 30, -10, side * 30, 2, side * 20, 0], p.mono ? p.body : p.dark); // missile pods
    if (!p.mono) for (let k = 0; k < 3; k++) circle(ctx, side * 25, -9 + k * 4, 1.2, '#1a1020');
  }
  if (p.mono) return;
  ctx.strokeStyle = p.trim;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(0, 0, 23, 20, 0, 0.2, Math.PI - 0.2);
  ctx.stroke();
  fillPoly(ctx, [-8, 2, 8, 2, 6, 6, -6, 6], p.glass); // the visor slit
};

export const STEPPE_MACHINES: Readonly<Record<SteppeMachine, UnitFn>> = { tripod, siegebug, plasmagun, wartripod };

export const steppeMachinePals = (pal: (body: string, dark: string, light: string, trim: string, glass?: string) => Pal): Readonly<Record<SteppeMachine, Pal>> => ({
  tripod: pal('#6a6478', '#2e2a38', '#a8a2b8', '#3ad8c8', '#ff4ad8'),
  siegebug: pal('#5a4a5e', '#2a2030', '#8a7a90', '#3ad8c8', '#ff7a3a'),
  plasmagun: pal('#5a5a6a', '#2a2a36', '#9898a8', '#3ad8c8', '#ff4ad8'),
  wartripod: pal('#585266', '#262230', '#98928e', '#3ad8c8', '#ff4ad8'),
});
