import type { HeadMap } from './front-head';
import { LINE } from './palette';
import { closedPath, lazy, memo, shapes, smoothClosed, taper, type Pts } from './paths';
import type { HairLook, HairStyle, SkinTone } from './types';

// People kit (doc 17): hair styles in profile (head frame of head-profile.ts) and three-quarter view
// (head frame of front-head.ts).

const CREW: Pts = [
  14.8, -29.5, 15.6, -33, 11, -40.2, 2, -43, -8, -42.6, -17, -38.2, -21.8, -30, -22.6, -20, -21, -12, -17.5, -9.5,
  -14, -12, -12.5, -19, -8, -24.5, -3, -24, -1.2, -21, -1, -16.5, 1.5, -16.6, 2.5, -23, 6, -27.5, 10.5, -28.6,
];
const BOB: Pts = [
  17.6, -21, 18.4, -27, 14, -37, 4, -43.5, -8, -44, -19, -38.5, -24.5, -28, -25.5, -16, -24.5, -6, -22, 1.5, -19.5, -3,
  -17, 3.5, -14.5, -2.5, -11.5, 2, -9.5, -4, -6.5, -1, -4.5, -8, -2, -14, 1, -20, 4.5, -24, 7.5, -21.5, 9, -25,
  12.5, -20.5, 13.5, -25,
];
/** Strand flow per style (open centre lines, drawn as thin slivers). */
const FLOW: Readonly<Record<'crew' | 'bob' | 'long' | 'messy', readonly Pts[]>> = {
  crew: [[-14, -36, -4, -41, 8, -39], [-17, -30, -7, -36.5, 6, -35], [-19, -24, -11, -30, -2, -31], [-20, -16, -16, -22]],
  bob: [
    [-4, -42, 8, -38, 15, -28, 16.5, -22], [-8, -40, 4, -34, 10, -25, 11, -21], [-8, -42, -18, -34, -22.5, -18, -21.5, -2],
    [-4, -38, -14, -28, -16.5, -12, -15, 1], [0, -34, -7, -22, -8.5, -8, -7, -1], [4, -36, 1, -27, 4, -22],
  ],
  long: [[14, -29, 4, -38, -10, -34, -20, -24], [11, -35, 0, -41.5, -14, -37, -21, -25], [5, -26, -6, -30, -18, -22], [-2, -22, -10, -24, -19, -19]],
  messy: [[16, -27, 9, -32, 2, -33], [12, -38, 4, -38, -2, -36], [0, -42, -6, -38, -12, -36], [-14, -38, -18, -32, -22, -26], [-18, -20, -14, -24, -10, -26], [8, -27, 3, -29, -2, -25]],
};
const LONG: Pts = [
  16, -27, 15.6, -35, 8, -42.6, -5, -44, -17, -39.6, -23, -30, -23.6, -19, -21.6, -13, -16, -12.6, -12, -17,
  -7.5, -22.6, -3, -23, 0, -21, 1, -16, 3, -18, 5, -25, 10, -27.6, 14, -27,
];
const MESSY: Pts = [
  17, -22, 16, -27, 19.5, -31, 13, -35, 14.5, -41.5, 6, -40, 3, -46.5, -3, -41, -10, -45.5, -12, -39, -20.5, -40.5,
  -20, -33, -25.5, -28, -22, -22, -24.5, -14.5, -20, -11, -17, -9, -13, -13, -11, -19, -6, -24, -2, -22, 0, -17,
  3, -21, 6, -25, 10, -23, 13, -25, 15, -21,
];

interface StylePaths { outline: Path2D; flow: Path2D; sheen: Path2D }

const style = (outline: Pts, flow: readonly Pts[], sheen: Pts): StylePaths => ({
  outline: closedPath(outline), flow: shapes(flow.map((l) => taper(l, 1.3))), sheen: shapes([taper(sheen, 2.8)]),
});

const PATHS = lazy(() => ({
  crew: style(CREW, FLOW.crew, [-13, -39, -3, -42.4, 8, -40]),
  bob: style(BOB, FLOW.bob, [-14, -39, -4, -42.2, 8, -39.5, 14, -33]),
  long: style(LONG, FLOW.long, [-14, -38.5, -3, -42.4, 8, -40]),
  messy: style(MESSY, FLOW.messy, [-12, -40, -2, -42, 8, -38]),
  fade: closedPath([-24, -27, 4, -27, 6, -12, -24, -6]),
}));

function pathsFor(s: HairStyle): StylePaths {
  const p = PATHS();
  switch (s) {
    case 'crew':
    case 'buzz': return p.crew;
    case 'bob': return p.bob;
    case 'long': return p.long;
    case 'messy': return p.messy;
    default: throw new Error(`unhandled: ${s satisfies never}`);
  }
}

/** `long` hair's ponytail, tied at the back of the head and hanging along gravity (gx, gy) behind the head. */
export function profileTail(ctx: CanvasRenderingContext2D, h: HairLook, gx: number, gy: number, t: number): void {
  if (h.style !== 'long') return;
  const sway = Math.sin(t * 3) * 3;
  const bx = -22;
  const by = -21;
  const len = 60;
  ctx.beginPath();
  ctx.moveTo(bx - gy * 5.5, by + gx * 5.5);
  ctx.quadraticCurveTo(bx + gx * len * 0.5 - gy * (sway + 9), by + gy * len * 0.5 + gx * (sway + 9), bx + gx * len - gy * sway, by + gy * len + gx * sway);
  ctx.quadraticCurveTo(bx + gx * len * 0.5 + gy * (4 - sway), by + gy * len * 0.5 - gx * (4 - sway), bx + gy * 5.5, by - gx * 5.5);
  ctx.closePath();
  ctx.fillStyle = h.base;
  ctx.fill();
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.beginPath(); // strands down the tail
  for (const k of [-2.5, 1.5]) {
    ctx.moveTo(bx - gy * k, by + gx * k);
    ctx.quadraticCurveTo(bx + gx * len * 0.5 - gy * (sway + 3 + k), by + gy * len * 0.5 + gx * (sway + 3 + k), bx + gx * len * 0.9 - gy * sway, by + gy * len * 0.9 + gx * sway);
  }
  ctx.strokeStyle = h.shadow;
  ctx.lineWidth = 1.1;
  ctx.stroke();
}

/** Hair over the head (the ponytail is drawn behind the head by `profileTail`). */
export function profileHair(ctx: CanvasRenderingContext2D, h: HairLook, skin: SkinTone): void {
  const p = pathsFor(h.style);
  ctx.save();
  ctx.globalAlpha = h.style === 'buzz' ? 0.62 : 1;
  ctx.fillStyle = h.shadow;
  ctx.fill(p.outline);
  ctx.clip(p.outline);
  ctx.save();
  ctx.translate(1.2, -2.2); // the underside stays in shadow: a rim along the lower edge
  ctx.fillStyle = h.base;
  ctx.fill(p.outline);
  ctx.restore();
  ctx.globalAlpha = 1;
  if (h.style === 'crew') {
    ctx.globalAlpha = 0.42;
    ctx.fillStyle = skin.base;
    ctx.fill(PATHS().fade);
  }
  ctx.globalAlpha = 0.65;
  ctx.fillStyle = h.shadow;
  ctx.fill(p.flow);
  ctx.globalAlpha = 0.75;
  ctx.fillStyle = h.light;
  ctx.fill(p.sheen);
  ctx.restore();
  if (h.style === 'buzz') return;
  ctx.lineWidth = 1;
  ctx.strokeStyle = LINE;
  ctx.stroke(p.outline);
  if (h.style === 'long') tie(ctx);
}

function tie(ctx: CanvasRenderingContext2D): void {
  ctx.beginPath();
  ctx.ellipse(-22, -21, 2.6, 4, 0.3, 0, Math.PI * 2);
  ctx.fillStyle = '#c2342c';
  ctx.fill();
}

const FRONT = new Map<string, Path2D>();

/** Front hair: outer contour follows the skull (offsets grow with the turn), the hairline is on the face. */
function frontPoints(style: HairStyle, m: HeadMap): number[] {
  const { s, fx } = m;
  const cap = (top: number, side: number): number[] => [-side - 1.5 * s, -22, -side - 0.6 - s, -31, -12, top + 3, 3 * s, top, 12 + 3 * s, top + 2.5, side + 0.6 + s, -31, side + 0.5 * s, -22];
  const line = (y: number): number[] => [fx(14, 6), y + 7, fx(12, 11), y + 2, fx(6, 15), y - 0.5, fx(0, 16), y - 1, fx(-6, 15), y - 0.5, fx(-12, 11), y + 2, fx(-14, 6), y + 7];
  switch (style) {
    case 'crew':
    case 'buzz': return [...cap(-43.5, 16.8), ...line(-31)];
    case 'long': return [...cap(-44.5, 17.2), ...line(-32)];
    case 'messy': return [-17.5 - s, -20, -21 - s, -30, -15, -38, -14, -46, -6, -43, 2 + 3 * s, -49, 8 + 3 * s, -43, 16 + 3 * s, -46, 17 + s, -35, 18.5 + s, -24, 16.5, -19,
      fx(13, 8), -21, fx(9, 13), -24, fx(5, 15), -20, fx(0, 16), -25, fx(-5, 15), -21, fx(-10, 12), -25, fx(-14, 7), -21];
    case 'bob': return [-19 - 2 * s, -2, -20 - 1.5 * s, -20, -19, -36, -10, -45, 2 + 3 * s, -46, 14 + 3 * s, -43, 19.5 + s, -32, 19.5, -16, 18 + 0.5 * s, -2,
      fx(15, 4), -4, fx(14, 8), -20, fx(10, 14), -23, fx(2, 16), -21, fx(-6, 15), -24, fx(-13, 9), -22, fx(-15, 3), -8, fx(-15.5, 0), -2];
    default: throw new Error(`unhandled: ${style satisfies never}`);
  }
}

/** Hair on a three-quarter head (see front-head.ts); `long` is tied back, its tail peeking out behind. */
export function frontHair(ctx: CanvasRenderingContext2D, h: HairLook, skin: SkinTone, m: HeadMap): void {
  const path = memo(() => {
    const p = new Path2D();
    smoothClosed(p, frontPoints(h.style, m));
    return p;
  }, FRONT, `${h.style}|${m.s.toFixed(3)}|${m.c.toFixed(3)}`);
  ctx.globalAlpha = h.style === 'buzz' ? 0.62 : 1;
  ctx.fillStyle = h.base;
  ctx.fill(path);
  ctx.globalAlpha = 1;
  ctx.save();
  ctx.clip(path);
  if (h.style === 'crew') {
    ctx.globalAlpha = 0.4;
    ctx.fillStyle = skin.base;
    ctx.fillRect(-30, -28, 60, 20);
  }
  ctx.globalAlpha = 0.7;
  ctx.fillStyle = h.light;
  ctx.beginPath();
  ctx.ellipse(m.fx(-4, 8), -40, 7, 2.6, -0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  if (h.style === 'buzz') return;
  ctx.lineWidth = 1;
  ctx.strokeStyle = LINE;
  ctx.stroke(path);
}

/** The tied-back tail of `long` hair behind a three-quarter head (drawn before the head). */
export function frontTail(ctx: CanvasRenderingContext2D, h: HairLook, m: HeadMap, t: number): void {
  if (h.style !== 'long') return;
  const sway = Math.sin(t * 3) * 2;
  ctx.beginPath();
  ctx.moveTo(-14 - 2 * m.s, -26);
  ctx.quadraticCurveTo(-26 - 4 * m.s + sway, -4, -19 - 3 * m.s + sway, 16);
  ctx.quadraticCurveTo(-16 - 3 * m.s, -6, -8, -24);
  ctx.closePath();
  ctx.fillStyle = h.shadow;
  ctx.fill();
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 1;
  ctx.stroke();
}

/** Whether the ear is drawn over the hair (short and tied-back styles) or hidden under it. */
export function earShows(style: HairStyle): boolean {
  return style !== 'bob';
}
