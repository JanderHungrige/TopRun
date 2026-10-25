import { LINE } from './palette';
import { smoothClosed, taper, type Pts } from './paths';
import type { PersonLook, Tone, TorsoWear } from './types';

// People kit (doc 17): the three-quarter torso, shorts and tops. Frame: hip-joint centre at the origin, y up
// negative, shoulder joints at (±40, −94). `turn` rotates the body about its vertical axis (+ = towards +x):
// the outline narrows a little and everything on the front surface slides towards the far side.

const W = 42;
const D = 20;

/** Maps a front-surface point for the turn: silhouette points keep their place, the centre slides by D·sin. */
function mapper(turn: number): (p: Pts) => number[] {
  const s = Math.sin(turn);
  const k = Math.sqrt(Math.cos(turn) ** 2 + (D / W) ** 2 * s * s);
  return (p) => p.map((v, i) => (i % 2 ? v : v * k + D * Math.sqrt(Math.max(0, 1 - (v / W) ** 2)) * s));
}

const mirror = (p: Pts): number[] => p.map((v, i) => (i % 2 ? v : -v));
const both = (p: Pts): Pts[] => [p, mirror(p)];

function loop(half: Pts): number[] {
  const left: number[] = [];
  for (let i = half.length - 2; i >= 0; i -= 2) left.push(-(half[i] ?? 0), half[i + 1] ?? 0);
  return [...half, ...left];
}

const TORSO: Pts = [9, -107, 22, -104, 38, -99, 39, -90, 36, -82, 37, -70, 34, -56, 28, -40, 28, -24, 30, -8, 29, 8, 20, 16, 6, 18];
const DEFS: readonly Pts[] = [
  ...both(taper([3, -71, 12, -68.5, 22, -70, 31, -77], 4.6)), // under the pecs
  taper([0, -101, 0, -86, 0, -73], 2.4), // sternum
  ...both(taper([2, -60, 8, -61, 14, -59], 2.2)), // abs
  ...both(taper([2, -47, 8, -48, 13.5, -46], 2.2)),
  ...both(taper([2, -34, 8, -35, 13, -33], 2)),
  taper([0, -70, 0, -45, 0, -22], 2),
  ...both(taper([15, -66, 16, -46, 13, -26], 2.6)), // outer edge of the abs
  ...both(taper([25, -34, 18, -16, 8, 2], 3.2)), // obliques into the groin
  ...both(taper([29, -72, 33, -69], 2)), // serratus
  ...both(taper([30, -64, 34, -61], 2)),
  ...both(taper([5, -103, 18, -101.5, 33, -100], 1.6)), // collarbones
  taper([0, -29.5, 0, -24.5], 2.4), // navel
  ...both([19, -81.2, 20.6, -80.4, 19, -79]),
];
const SHADE: Pts = [16, -112, 46, -112, 46, 22, 12, 22, 20, -40];
const LIT: readonly Pts[] = [taper([-30, -97, -26, -72, -23, -42], 10), taper([-14, -98, -10, -88, -4, -84], 6)];

const TOPS: Readonly<Record<Exclude<TorsoWear, 'shirtless'>, Pts>> = {
  tank: [-23, -104, -12, -107, -6, -96, 0, -86, 6, -96, 12, -107, 23, -104, 27, -90, 32, -78, 37, -70, 50, -70, 50, 30, -50, 30, -50, -70, -37, -70, -32, -78, -27, -90],
  sportsTop: [-23, -104, -12, -107, -6, -96, 0, -88, 6, -96, 12, -107, 23, -104, 27, -90, 32, -78, 37, -70, 50, -70, 50, -56, -50, -56, -50, -70, -37, -70, -32, -78, -27, -90],
  tshirt: [-11, -107, -5, -101.5, 0, -100, 5, -101.5, 11, -107, 50, -112, 50, 30, -50, 30, -50, -112],
};
const SHORTS: Pts = [-31, -17, 31, -17, 33, 5, 37, 46, 6, 48, 2, 22, -2, 22, -6, 48, -37, 46, -33, 5];

export interface FrontTorso {
  body: Path2D;
  defs: Path2D;
  shade: Path2D;
  lit: Path2D;
  tops: Readonly<Record<Exclude<TorsoWear, 'shirtless'>, Path2D>>;
  shorts: Path2D;
  stripes: Path2D;
  /** Front-surface x of the body centre line after the turn (for props on the chest). */
  centre: (x: number) => number;
}

function path(list: readonly number[][]): Path2D {
  const p = new Path2D();
  for (const pts of list) smoothClosed(p, pts);
  return p;
}

function build(turn: number): FrontTorso {
  const m = mapper(turn);
  return {
    body: path([m(loop(TORSO))]),
    defs: path(DEFS.map(m)),
    shade: path([m(SHADE)]),
    lit: path(LIT.map(m)),
    tops: { tank: path([m(TOPS.tank)]), sportsTop: path([m(TOPS.sportsTop)]), tshirt: path([m(TOPS.tshirt)]) },
    shorts: path([m(SHORTS)]),
    stripes: path(both(taper([32.4, -12, 34.6, 18, 36.4, 46], 3.4)).map(m)),
    centre: (x) => m([x, 0])[0] ?? x,
  };
}

const cache = new Map<number, FrontTorso>();

/** Torso paths for a turn (rounded to 0.05 rad and cached). */
export function frontTorso(turn: number): FrontTorso {
  const key = Math.round(turn * 20) / 20;
  let t = cache.get(key);
  if (!t) {
    t = build(key);
    cache.set(key, t);
  }
  return t;
}

function shaded(ctx: CanvasRenderingContext2D, ft: FrontTorso, area: Path2D, tone: Tone, defs: boolean): void {
  ctx.save();
  ctx.clip(area);
  ctx.fillStyle = tone.base;
  ctx.fill(area);
  ctx.globalAlpha = 0.55;
  ctx.fillStyle = tone.shadow;
  ctx.fill(ft.shade);
  if (defs) {
    ctx.globalAlpha = 0.5;
    ctx.fill(ft.defs);
  }
  ctx.globalAlpha = 0.5;
  ctx.fillStyle = tone.light;
  ctx.fill(ft.lit);
  ctx.restore();
}

export function frontTorsoLine(ctx: CanvasRenderingContext2D, ft: FrontTorso, lw: number): void {
  ctx.lineWidth = lw;
  ctx.strokeStyle = LINE;
  ctx.stroke(ft.body);
}

/** Bare torso with muscle shading, then the top clipped to it. */
export function frontTorsoFill(ctx: CanvasRenderingContext2D, ft: FrontTorso, look: PersonLook): void {
  shaded(ctx, ft, ft.body, look.skin, true);
  if (look.torso === 'shirtless') return;
  const top = ft.tops[look.torso];
  ctx.save();
  ctx.clip(ft.body);
  shaded(ctx, ft, top, look.top, false);
  ctx.lineWidth = 1.4;
  ctx.strokeStyle = LINE;
  ctx.stroke(top);
  ctx.restore();
}

/** Shorts or trouser tops over the pelvis and upper thighs. */
export function frontShorts(ctx: CanvasRenderingContext2D, ft: FrontTorso, look: PersonLook, pass: 'line' | 'fill'): void {
  if (pass === 'line') {
    ctx.lineWidth = 1.6;
    ctx.strokeStyle = LINE;
    ctx.stroke(ft.shorts);
    return;
  }
  shaded(ctx, ft, ft.shorts, look.bottom, false);
  ctx.save();
  ctx.clip(ft.shorts);
  ctx.fillStyle = look.bottom.shadow;
  ctx.fillRect(-50, -18, 100, 6);
  if (look.legs === 'shorts') {
    ctx.fillStyle = look.trim;
    ctx.fill(ft.stripes);
  }
  ctx.restore();
}
