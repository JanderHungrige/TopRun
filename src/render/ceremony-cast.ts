import { lerp, type Vec } from '../core/math';
import type { MedalId } from '../data/medals';
import type { Beat } from '../game/ceremony';
import type { AvatarLook } from '../game/avatar-look';
import type { AvatarId } from '../game/profiles';
import { ADMIRAL_EXTRAS, ADMIRAL_LOOK, CREW, crewExtras, pilotInWhites } from './ceremony-looks';
import type { Grid } from './ceremony-set';
import { drawMedal, drawRibbonBar } from './medals';
import { SpriteCache } from './pixel/blit';
import { PAL } from './pixel/palette';
import { toCanvas } from './pixel/post';
import { checker, Pix } from './pixel/raster';
import { drawFrontFigure, frontChestPoint, type Expression, type FrontExtras, type FrontPose, type PersonLook } from './people';

// Medal ceremony (doc 25): the people on deck — the crew at attention in the back row, the pilot in dress whites
// and the admiral who walks up, pins the medal and salutes — with long golden-hour shadows, the pilot's ribbon
// rack and the medals pinned so far.

export const PILOT_X = 548;
export const FRONT_FOOT = 640;
const CREW_FOOT = 478;
const CREW_SCALE = 0.62;
const PILOT_TURN = 0.1;
/** The admiral's spot in front of the pilot, and how far he steps back to salute. */
const ADM_X = 676;
const ADM_BACK = 40;
const SALUTE: Vec = { x: -48, y: -134 };
/** The admiral's own decorations (an old hand: he has them all). */
const ADMIRAL_RACK: readonly MedalId[] = ['leviathan', 'victory', 'topace', 'giant', 'catapult', 'sorties100'];

export interface CastView {
  beat: Beat;
  t: number;
  /** The pilot's preset or custom look (doc 29). */
  avatar: AvatarId | AvatarLook;
  /** Medals earned before this ceremony (ribbon bars). */
  earlier: readonly MedalId[];
  /** Medals pinned on the chest so far in this ceremony. */
  pinned: readonly MedalId[];
}

const rest = (turn: number): Vec => ({ x: -43 * Math.cos(turn), y: 14 });
/** Arm moves and turns snap to a few key poses (retro animation frames; few pixel-cache entries). */
const keyed = (u: number, frames: number): number => Math.round(u * frames) / frames;
const mix = (a: Vec, b: Vec, u: number): Vec => ({ x: lerp(a.x, b.x, keyed(u, 4)), y: lerp(a.y, b.y, keyed(u, 4)) });

function blink(t: number, phase: number): number {
  const ph = (t + phase * 1.3) % 4.4;
  return ph < 0.14 ? 1 - Math.abs(ph / 0.07 - 1) : 0;
}

const shadows = new SpriteCache(16);

/** A long dithered shadow cast to the right by the low sun, under a figure standing at (x, foot). */
function shadow(ctx: CanvasRenderingContext2D, g: Grid, x: number, foot: number, scale: number): void {
  const w = Math.round((150 * scale) / g.G);
  const h = Math.max(2, Math.round((12 * scale) / g.G));
  const art = shadows.get(`${w}x${h}`, () => {
    const p = new Pix(w, h);
    p.paint(p.oval(w / 2, h / 2, w / 2, h / 2), PAL.dusk[0] ?? 0, undefined, checker);
    p.paint(p.oval(w * 0.18, h / 2, w * 0.16, h / 2), PAL.dusk[0] ?? 0);
    return toCanvas(p);
  });
  if (!art) return;
  const x0 = Math.round((x - 14 * scale) / g.G) * g.G;
  const y0 = Math.round((foot - (h * g.G) / 2) / g.G) * g.G;
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.globalAlpha = 0.55;
  ctx.drawImage(art, x0, y0, w * g.G, h * g.G);
  ctx.restore();
}

function figure(
  ctx: CanvasRenderingContext2D, look: PersonLook, x: number, foot: number, scale: number, pose: FrontPose,
  expression: Expression, t: number, phase: number, extras?: FrontExtras,
): void {
  ctx.save();
  ctx.translate(x, foot);
  ctx.scale(scale, scale);
  drawFrontFigure(ctx, look, pose, { expression, strain: 0, blink: blink(t, phase), t }, extras, { units: 3 / scale });
  ctx.restore();
}

function crew(ctx: CanvasRenderingContext2D, g: Grid, v: CastView): void {
  for (const c of CREW) shadow(ctx, g, c.x, CREW_FOOT, CREW_SCALE);
  for (const c of CREW) {
    const s = v.beat.salute;
    const pose: FrontPose = {
      turn: c.turn, raise: [0, 0], hands: s > 0.4 ? 'open' : 'fist',
      ...(s > 0.02 ? { reach: [mix(rest(c.turn), SALUTE, s), null] as const } : {}),
    };
    figure(ctx, c.look, c.x, CREW_FOOT, CREW_SCALE, pose, 'calm', v.t, c.phase, crewExtras(c.helmet));
  }
}

/** Ribbon bars of earlier medals (rows of three) and the medals pinned today, on the wearer's left breast. */
export function chestMedals(ctx: CanvasRenderingContext2D, g: Grid, x: number, foot: number, turn: number, earlier: readonly MedalId[], pinned: readonly MedalId[]): void {
  const bw = 9;
  const bh = 3.6;
  earlier.forEach((id, i) => {
    const row = Math.floor(i / 3);
    const n = Math.min(3, earlier.length - row * 3);
    const p = frontChestPoint(turn, 17 + ((i % 3) - (n - 1) / 2) * bw, -88 - row * bh);
    drawRibbonBar(ctx, id, x + p.x - bw / 2, foot + p.y, bw, bh);
  });
  pinned.forEach((id, i) => {
    const p = frontChestPoint(turn, medalX(pinned.length, i), -82);
    drawMedal(ctx, id, x + p.x, foot + p.y, 36, { px: g.G });
  });
}

/** Across-the-chest position of medal i of n: side by side, overlapping a little when there are many. */
function medalX(n: number, i: number): number {
  const step = n > 1 ? Math.min(17, 46 / (n - 1)) : 0;
  return 15 + (i - (n - 1) / 2) * step;
}

/** Where the pilot's chest medals hang (for the pin sparkle). */
export function pinPoint(count: number, index: number): Vec {
  const p = frontChestPoint(PILOT_TURN, medalX(count, index), -70);
  return { x: PILOT_X + p.x, y: FRONT_FOOT + p.y };
}

function admiral(ctx: CanvasRenderingContext2D, g: Grid, v: CastView): void {
  const b = v.beat;
  const x = lerp(1430, ADM_X, b.walk) + b.back * ADM_BACK;
  const bounce = b.walking ? -Math.abs(Math.sin(v.t * 9)) * 4 : 0;
  const turn = lerp(-0.42, 0.08, keyed(b.back, 4));
  const chest = frontChestPoint(PILOT_TURN, 17, -80);
  const pin: Vec = { x: PILOT_X + chest.x - x + 20, y: -66 };
  const arm = b.salute > 0.02 ? mix(rest(turn), SALUTE, b.salute) : b.reach > 0.02 ? mix(rest(turn), pin, b.reach) : null;
  const pose: FrontPose = { turn, raise: [0, 0], hands: arm ? 'open' : 'fist', ...(arm ? { reach: [arm, null] as const } : {}) };
  shadow(ctx, g, x, FRONT_FOOT, 1);
  figure(ctx, ADMIRAL_LOOK, x, FRONT_FOOT + bounce, 1, pose, b.walking ? 'calm' : 'grin', v.t, 0.6, ADMIRAL_EXTRAS);
  ADMIRAL_RACK.forEach((id, i) => {
    const p = frontChestPoint(turn, 17 + ((i % 3) - 1) * 9, -88 - Math.floor(i / 3) * 3.6);
    drawRibbonBar(ctx, id, x + p.x - 4.5, FRONT_FOOT + bounce + p.y, 9, 3.6);
  });
}

function pilot(ctx: CanvasRenderingContext2D, g: Grid, v: CastView): void {
  const s = v.beat.salute;
  const pose: FrontPose = {
    turn: PILOT_TURN, raise: [0, 0], hands: s > 0.4 ? 'open' : 'fist',
    ...(s > 0.02 ? { reach: [mix(rest(PILOT_TURN), SALUTE, s), null] as const } : {}),
  };
  shadow(ctx, g, PILOT_X, FRONT_FOOT, 1);
  figure(ctx, pilotInWhites(v.avatar), PILOT_X, FRONT_FOOT, 1, pose, v.pinned.length > 0 ? 'grin' : 'calm', v.t, 2.1);
  chestMedals(ctx, g, PILOT_X, FRONT_FOOT, PILOT_TURN, v.earlier, v.pinned);
}

/** Draws everyone on deck for one beat of the ceremony. */
export function drawCast(ctx: CanvasRenderingContext2D, g: Grid, v: CastView): void {
  crew(ctx, g, v);
  pilot(ctx, g, v);
  admiral(ctx, g, v);
}
