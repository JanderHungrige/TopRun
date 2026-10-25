import { LINE } from './palette';
import { closedPath, lazy, lazyPart, outline, paintPart, taper, type Part, type Pts } from './paths';
import type { PersonLook, Tone } from './types';

// People kit (doc 17): hands and feet. Side parts lie along their own +x (wrist → fingers, heel → toes)
// with the back of the hand / top of the foot on −y. Every draw runs twice: outlines first, then fills.

export type Pass = 'line' | 'fill';
export const LW = 1.6;

/** Ball of the foot (toe pivot) in the foot frame; the sole runs along +y = 9.5 (bare) / 14 (sneaker). */
export const BALL = { x: 28, y: 5, sole: 14 } as const;

const HAND = lazyPart({
  ant: [-5, -4.5, 2, -5.5, 10, -5.5, 17, -4.5, 24, -2.6, 31, -0.8, 35, 1.8],
  post: [-5, 4, 2, 6, 10, 6.3, 18, 6.3, 26, 6, 32, 5.4, 35.5, 3.6],
  defs: [taper([3, 1, 12, 3, 21, 4.6], 2.6), taper([21, 1.4, 27, 2.2, 33, 3], 1.3)],
});
const FOOT = lazyPart({
  ant: [-10, -5, -4, -8, 4, -7.5, 12, -4.5, 20, -1.5, 28, 2],
  post: [-11, 2, -10, 8, 0, 9.5, 14, 8.4, 24, 9.5, 30, 8.5],
  defs: [taper([-2, -2, 2, 0, 6, -1], 2.4)],
});
const TOES = lazyPart({ ant: [-3, -3.5, 6, -3.5, 14, -1.8, 19, 0.5], post: [-3, 4.5, 6, 4.6, 14, 4.5, 19.5, 2.8] });
const SHOE = lazyPart({
  ant: [-12, -9, -6, -12, 4, -11, 12, -7, 20, -3, 28, 1, 32, 4],
  post: [-14, -2, -14, 6, -10, 10, 4, 10, 20, 10, 32, 9],
  defs: [taper([-12, -6, -11, 2, -8, 8], 2.4)],
});
const TOE_BOX = lazyPart({ ant: [-4, -6, 4, -6, 12, -4, 18, -0.5, 20, 2.5], post: [-4, 5, 6, 5, 14, 5, 20, 4] });

function poly(p: Pts): Path2D {
  const path = new Path2D();
  for (let i = 0; i < p.length; i += 2) path.lineTo(p[i] ?? 0, p[i + 1] ?? 0);
  path.closePath();
  return path;
}

const SOLES = lazy(() => ({
  heel: closedPath([-15, 8, -15.5, 12, -14, 14, 0, 14.2, 31, 14, 33, 11, 32, 9, 0, 10]),
  toe: closedPath([-4, 5, 20, 4, 21.5, 6.5, 18, 9, -4, 9.2]),
  laces: poly([7, -10, 11, -6.6, 12, -7.4, 8, -10.8]),
  laces2: poly([14, -6.4, 17.6, -3, 18.6, -3.8, 15, -7.2]),
  stripe: closedPath(taper([-6, 3, 6, 0.5, 18, 2, 26, 5], 3.4)),
}));

function part(ctx: CanvasRenderingContext2D, pass: Pass, p: Part, tone: Tone, lit: number, far: boolean): void {
  if (pass === 'line') outline(ctx, p.body, LW);
  else paintPart(ctx, p, tone, lit, far);
}

/** Flat hand, palm down (push-up), in the hand frame. */
export function sideHand(ctx: CanvasRenderingContext2D, pass: Pass, skin: Tone, lit: number, far: boolean): void {
  part(ctx, pass, HAND(), skin, lit, far);
}

function fill(ctx: CanvasRenderingContext2D, path: Path2D, color: string): void {
  ctx.fillStyle = color;
  ctx.fill(path);
}

/** Foot or sneaker in the foot frame; `toe` bends the toes / toe box at the ball (rad, negative = up). */
export function sideFoot(ctx: CanvasRenderingContext2D, pass: Pass, look: PersonLook, lit: number, far: boolean, toe: number): void {
  const shoe = look.feet === 'sneakers';
  ctx.save();
  ctx.translate(BALL.x, BALL.y);
  ctx.rotate(toe);
  part(ctx, pass, shoe ? TOE_BOX() : TOES(), shoe ? look.shoe : look.skin, lit, far);
  if (shoe) {
    const s = SOLES();
    if (pass === 'line') outline(ctx, s.toe, LW);
    else fill(ctx, s.toe, look.sole);
  }
  ctx.restore();
  part(ctx, pass, shoe ? SHOE() : FOOT(), shoe ? look.shoe : look.skin, lit, far);
  if (!shoe) return;
  const s = SOLES();
  if (pass === 'line') return outline(ctx, s.heel, LW);
  fill(ctx, s.heel, look.sole);
  fill(ctx, s.stripe, far ? look.shoe.shadow : look.sole);
  if (far) return;
  fill(ctx, s.laces, look.shoe.light);
  fill(ctx, s.laces2, look.shoe.light);
}

const FINGERS_OPEN: readonly Pts[] = [[16, -5.6, 31, -7.6], [17, -1.8, 33, -2.2], [17, 1.8, 31.5, 3], [16, 5.2, 27, 7.6], [5, -7, 11, -12.5, 17, -14.5]];
const FINGERS_FIST: readonly Pts[] = [[14, -5.4, 17, -5.6], [15, -1.8, 18, -1.8], [15, 1.8, 18, 1.8], [14, 5.2, 16.5, 5.4], [5, -7, 10, -5, 14, -2.5]];
const PALM = lazy(() => closedPath([0, -7, 8, -8.6, 17, -8, 18.5, 0, 17, 7.6, 8, 8, 0, 6.5]));

/** Front-view hand (crowds) in the hand frame: open palm or fist. */
export function frontHand(ctx: CanvasRenderingContext2D, pass: Pass, skin: Tone, open: boolean): void {
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  for (const f of open ? FINGERS_OPEN : FINGERS_FIST) {
    ctx.moveTo(f[0] ?? 0, f[1] ?? 0);
    for (let i = 2; i < f.length; i += 2) ctx.lineTo(f[i] ?? 0, f[i + 1] ?? 0);
  }
  if (pass === 'line') {
    ctx.strokeStyle = LINE;
    ctx.lineWidth = 5.6 + LW;
    ctx.stroke();
    outline(ctx, PALM(), LW);
    return;
  }
  ctx.strokeStyle = skin.base;
  ctx.lineWidth = 5.6;
  ctx.stroke();
  fill(ctx, PALM(), skin.base);
  ctx.globalAlpha = 0.55;
  ctx.fillStyle = skin.shadow;
  ctx.beginPath();
  ctx.ellipse(9, 3.5, 6, 3.2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
}

const FRONT_SHOE = lazy(() => ({
  upper: closedPath([-6, -9, 6, -9, 9, 0, 11, 7, 10, 11, -10, 11, -11, 7, -9, 0]),
  sole: closedPath([-11.5, 9, 11.5, 9, 11.5, 13.5, -11.5, 13.5]),
  foot: closedPath([-5, -7, 5, -7, 7, 3, 9, 9, 8, 12, -8, 12, -9, 9, -7, 3]),
}));

/** Front-view sneaker or bare foot under an ankle at the origin; `side` turns the toes outwards. */
export function frontFoot(ctx: CanvasRenderingContext2D, pass: Pass, look: PersonLook, side: 1 | -1): void {
  const f = FRONT_SHOE();
  ctx.save();
  ctx.transform(1, 0, side * 0.12, 1, 0, 0);
  if (look.feet === 'barefoot') {
    if (pass === 'line') outline(ctx, f.foot, LW);
    else {
      fill(ctx, f.foot, look.skin.base);
      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.ellipse(-6 + i * 3 * 1, 11, 1.4, 1, 0, 0, Math.PI * 2);
        ctx.fillStyle = look.skin.shadow;
        ctx.fill();
      }
    }
  } else if (pass === 'line') {
    outline(ctx, f.upper, LW);
    outline(ctx, f.sole, LW);
  } else {
    fill(ctx, f.upper, look.shoe.base);
    fill(ctx, f.sole, look.sole);
    ctx.fillStyle = look.shoe.light;
    ctx.fillRect(-3, -6, 6, 1.4);
    ctx.fillRect(-3.5, -2.5, 7, 1.4);
  }
  ctx.restore();
}
