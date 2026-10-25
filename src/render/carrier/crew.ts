import { SpriteCache } from '../pixel/blit';
import { PAL, type Ramp } from '../pixel/palette';
import { path } from '../pixel/path';
import { outline, toCanvas } from '../pixel/post';
import { Pix } from '../pixel/raster';
import { DECK_Y } from './geometry';

/**
 * Flight-deck crew in coloured jerseys and matching cranial helmets (yellow: catapult officer / directors,
 * green: catapult crew, red: ordnance, blue: handlers, purple: fuel, brown: plane captains, white: safety),
 * drawn as tiny outlined pixel sprites (doc 20). Arm angles follow the original deck-officer convention:
 * 0 points to the bow, PI/2 straight up; they snap to 16 directions so signals animate frame by frame.
 */

const JERSEYS: Readonly<Record<string, Ramp>> = {
  '#49c76a': PAL.green, '#d9483f': PAL.red, '#3f78d8': PAL.blue, '#f1f1ec': PAL.white,
  '#8a55c9': PAL.violet, '#f2c230': PAL.yellow, '#ffd23f': PAL.yellow, '#8a5a32': PAL.jersey,
};
const TROUSERS = PAL.navy[1] ?? 0;
const SHOE = PAL.ink[1] ?? 0;
const GLOVE = PAL.teeth[3] ?? 0;
const SKIN = PAL.skinTan[3] ?? 0;
const GOGGLE = PAL.glass[1] ?? 0;
/** Logical units per art pixel the sprites aim for. */
const ART_UNITS = 1.4;
const STEP = Math.PI / 8;

const sprites = new SpriteCache(160);

interface Pose { ramp: Ramp; arms: readonly [number, number]; lean: number }

function drawSprite(p: Pix, c: Pose): void {
  const cs = Math.cos(c.lean);
  const sn = Math.sin(c.lean);
  const r = (x: number, y: number): [number, number] => [x * cs - y * sn, x * sn + y * cs];
  const thick = (pts: readonly number[], rad: number, v: number): void => {
    const out: number[] = [];
    for (let i = 0; i + 1 < pts.length; i += 2) out.push(...r(pts[i] ?? 0, pts[i + 1] ?? 0));
    p.paint(p.thick(out, rad), v);
  };
  const arm = (a: number): void => {
    const end = [9 * Math.cos(-a), -13.5 + 9 * Math.sin(-a)] as const;
    thick([0, -13.5, end[0], end[1]], 1.05, c.ramp[2] ?? 0);
    p.paint(p.oval(...r(end[0], end[1]), 1.25, 1.25), GLOVE);
  };
  arm(c.arms[1]);
  thick([-1.2, -8, -2.2, -1.2], 1.2, TROUSERS);
  thick([1.2, -8, 2.3, -1.2], 1.2, TROUSERS);
  thick([-3.6, -0.8, -0.8, -0.8], 0.8, SHOE);
  thick([1.2, -0.8, 4.4, -0.8], 0.8, SHOE);
  const body = p.shape(path().lines([...r(-3.4, -15.8), ...r(3.4, -15.8), ...r(3.4, -7), ...r(-3.4, -7)]).close());
  p.paint(body, c.ramp[3] ?? 0);
  p.paint(p.shape(path().lines([...r(-3.4, -8.8), ...r(3.4, -8.8), ...r(3.4, -7), ...r(-3.4, -7)]).close()), c.ramp[2] ?? 0, body);
  p.paint(p.shape(path().lines([...r(-3.4, -12.4), ...r(3.4, -12.4), ...r(3.4, -11.4), ...r(-3.4, -11.4)]).close()), PAL.white[4] ?? 0, body);
  p.paint(p.oval(...r(0.4, -18.4), 2.8, 2.8), SKIN);
  p.paint(p.shape(path().ellipse(...r(0, -19.2), 3.2, 2.6)), c.ramp[3] ?? 0, p.shape(path().rect(-6, -24, 12, 5)));
  p.paint(p.oval(...r(2, -19), 1.4, 0.7), GOGGLE);
  p.paint(p.oval(...r(-0.9, -18), 1.2, 1.2), GOGGLE);
  arm(c.arms[0]);
}

/** One crew member standing on `footY` (x, y in world units). `lean` tilts the body towards the bow. */
export function drawCrewman(
  ctx: CanvasRenderingContext2D, x: number, footY: number, jersey: string, arms: readonly [number, number], scale = 1, lean = 0,
): void {
  const m = ctx.getTransform();
  const s = Math.hypot(m.a, m.b);
  if (!(s > 0)) return;
  const D = Math.max(1, Math.round(ART_UNITS * s));
  const G = D / s;
  const k = scale / G;
  const w = 2 * Math.ceil(16 * k) + 2;
  const h = Math.ceil(30 * k) + 2;
  const pose: Pose = { ramp: JERSEYS[jersey] ?? PAL.steel, arms: [Math.round(arms[0] / STEP) * STEP, Math.round(arms[1] / STEP) * STEP], lean };
  const key = `${jersey}|${pose.arms[0].toFixed(2)}|${pose.arms[1].toFixed(2)}|${lean.toFixed(2)}|${k.toFixed(3)}|${D}`;
  const art = sprites.get(key, () => {
    const p = new Pix(w, h, k, w / 2, h - 1);
    drawSprite(p, pose);
    outline(p);
    return toCanvas(p);
  });
  if (!art) return;
  const x0 = x - (w / 2) * G;
  const y0 = footY - (h - 1) * G;
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(art, (Math.round(m.a * x0 + m.e) - m.e) / m.a, (Math.round(m.d * y0 + m.f) - m.f) / m.d, w * G, h * G);
  ctx.restore();
}

/** [world x, jersey, signalling arm, other arm, far side, idle sway]. */
const CREW: readonly (readonly [number, string, number, number, boolean, number])[] = [
  [-150, '#49c76a', 0.4, -1.6, false, 0.14],
  [-175, '#49c76a', 2.6, -1.5, false, 0.1],
  [-250, '#d9483f', 1.2, -1.7, false, 0.12],
  [-316, '#3f78d8', -1.25, -1.85, false, 0.06],
  [-445, '#f1f1ec', -1.3, -1.95, false, 0.05],
  [-540, '#8a55c9', 0.7, -1.6, true, 0.1],
  [-735, '#f2c230', 1.3, 1.9, true, 0.35],
  [-958, '#8a5a32', -1.4, -1.8, true, 0.05],
];

/** Deck crew plus the catapult officer ("shooter") whose arm signals follow the launch phase. */
export function drawCrew(ctx: CanvasRenderingContext2D, t: number, shooterPose: number, launched: boolean): void {
  CREW.forEach(([x, jersey, a, b, far, sway], i) => {
    const wave = Math.sin(t * 1.7 + i * 1.3) * sway;
    drawCrewman(ctx, x, far ? DECK_Y - 5.5 : DECK_Y, jersey, [a + wave, b - wave * 0.5], far ? 0.8 : 1);
  });
  drawCrewman(ctx, 120, DECK_Y, '#ffd23f', [shooterPose, launched ? -2.3 : -1.9], 1, launched ? 0.2 : 0);
}
