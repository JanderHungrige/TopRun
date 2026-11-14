import type { TankId } from '../../data/types';

// The motor pool's vehicles in detail (doc 114): the measurements the top and side painters share. Top view: front up
// (−y), centred on the hull's middle; side view: facing right, the ground at y = 0. Pure.

export interface TankTop {
  /** Half width of the deck between the tracks' inner edges, half length of the hull. */
  hull: { hx: number; hy: number };
  /** A track's centre x, its width and half length. */
  track: { x: number; w: number; len: number; pitch: number };
  /** Where the turret turns (on the centre line) and its ring's radius. */
  pivot: { x: number; y: number };
  ring: number;
  /** Gun length from the turret's front and its bore. */
  barrel: number;
  bore: number;
}

export const TANK_TOP = {
  lynx: { hull: { hx: 8.5, hy: 21.5 }, track: { x: 11, w: 5, len: 22, pitch: 2.6 }, pivot: { x: 0, y: 2 }, ring: 7.5, barrel: 17, bore: 0.9 },
  bison: { hull: { hx: 11, hy: 25.5 }, track: { x: 14.5, w: 6.5, len: 26, pitch: 3 }, pivot: { x: 0, y: 0 }, ring: 10.5, barrel: 24, bore: 1.5 },
} as const satisfies Record<'lynx' | 'bison', TankTop>;

export interface BuggyTop {
  /** Half length of the chassis (bull bar to rear deck). */
  len: number;
  /** A tyre's centre (x, ±y), width and length from above. */
  wheel: { x: number; y: number; w: number; l: number };
}

export const BUGGY_TOP = {
  jackal: { len: 20, wheel: { x: 10, y: 13, w: 6.5, l: 11 } },
  viper: { len: 23, wheel: { x: 10.5, y: 15.5, w: 6.8, l: 11.5 } },
} as const satisfies Record<'jackal' | 'viper', BuggyTop>;

export interface TankSide {
  half: number;
  trackH: number;
  wheels: number;
  wheelR: number;
  barrel: number;
}

export const TANK_SIDE = {
  lynx: { half: 26, trackH: 10, wheels: 6, wheelR: 3.3, barrel: 22 },
  bison: { half: 31, trackH: 12, wheels: 7, wheelR: 3.6, barrel: 30 },
} as const satisfies Record<'lynx' | 'bison', TankSide>;

export const BUGGY_SIDE = {
  jackal: { wheelX: 15, r: 7 },
  viper: { wheelX: 18, r: 7.5 },
} as const satisfies Record<'jackal' | 'viper', { wheelX: number; r: number }>;

export const isTank = (id: TankId): id is 'lynx' | 'bison' => id === 'lynx' || id === 'bison';

/** How far the track links (or tyre lugs) have slid, within one pitch, for the ground covered. */
export const linkOffset = (driven: number, pitch: number): number => ((driven % pitch) + pitch) % pitch;

/** The road wheels' centres along the track: evenly between the sprocket (rear) and the idler (front). */
export function roadWheelXs(b: TankSide): number[] {
  const x0 = -b.half + b.trackH * 0.95;
  const x1 = b.half - b.trackH * 0.95;
  return Array.from({ length: b.wheels }, (_, i) => x0 + ((x1 - x0) * i) / (b.wheels - 1));
}

/** The wheels that carry the vehicle in the side view, standing on the ground. */
export function sideWheels(id: TankId): { x: number; y: number; r: number }[] {
  if (isTank(id)) {
    const b = TANK_SIDE[id];
    return roadWheelXs(b).map((x) => ({ x, y: -b.wheelR, r: b.wheelR }));
  }
  const b = BUGGY_SIDE[id];
  return [-b.wheelX, b.wheelX].map((x) => ({ x, y: -b.r, r: b.r }));
}

/** Half extents of everything static from above (hull, fenders, tracks, tyres; not the turning gun). */
export function topExtent(id: TankId): { hx: number; hy: number } {
  if (isTank(id)) {
    const b = TANK_TOP[id];
    return { hx: b.track.x + b.track.w / 2, hy: Math.max(b.hull.hy, b.track.len) + 0.8 };
  }
  const b = BUGGY_TOP[id];
  return { hx: b.wheel.x + b.wheel.w / 2, hy: b.len + 0.8 };
}

/** The rectangle the flash and the shadow fill (with the turret ring for the tanks). */
export function topSilhouetteBox(id: TankId): { hx: number; hy: number } {
  const e = topExtent(id);
  return { hx: e.hx + 0.6, hy: e.hy + 0.8 };
}
