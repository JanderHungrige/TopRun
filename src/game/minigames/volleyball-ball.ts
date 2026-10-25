// Beach Volleyball (doc 21): the court, the net and the ball's flight. World units are metres; x = 0 is the
// net, the player's team plays on x < 0, heights are above the sand. The flight is an exact parabola (no
// drag), so the predictions below match the simulation tick for tick. Pure.

export const VB = Object.freeze({
  /** Court half length (arcade: real courts are 8 m). */
  half: 7,
  netH: 2.3,
  ballR: 0.11,
  g: 10,
  /** Half thickness of the net and its tape for collisions. */
  netW: 0.04,
  /** A ball hitting the side of the net drops back with this much of its speed. */
  netDamp: 0.25,
  /** Restitution off the tape. */
  tapeBounce: 0.4,
});

export interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export const xAt = (b: Ball, t: number): number => b.x + b.vx * t;
export const yAt = (b: Ball, t: number): number => b.y + b.vy * t - 0.5 * VB.g * t * t;
export const ballAt = (b: Ball, t: number): Ball => ({ x: xAt(b, t), y: yAt(b, t), vx: b.vx, vy: b.vy - VB.g * t });
export const apexOf = (b: Ball): number => (b.vy > 0 ? b.y + (b.vy * b.vy) / (2 * VB.g) : b.y);
export const speedOf = (b: Ball): number => Math.hypot(b.vx, b.vy);

/** Seconds until the ball comes down through height h (the later crossing); null if it never gets that high. */
export function timeToHeight(b: Ball, h: number): number | null {
  const disc = b.vy * b.vy + 2 * VB.g * (b.y - h);
  if (disc < 0) return null;
  const t = (b.vy + Math.sqrt(disc)) / VB.g;
  return t >= 0 ? t : null;
}

/** Where the ball's centre comes down to its radius (the net ignored). */
export function landingX(b: Ball): number {
  return xAt(b, timeToHeight(b, VB.ballR) ?? 0);
}

/** In when the ball lands touching the line or inside. */
export const isIn = (x: number): boolean => Math.abs(x) <= VB.half + VB.ballR;

/** Height at which the ball crosses the net plane, or null when it moves away from it or lands first. */
export function netCrossHeight(b: Ball): number | null {
  if (b.vx === 0 || Math.sign(b.x) === Math.sign(b.vx)) return null;
  const t = -b.x / b.vx;
  const land = timeToHeight(b, VB.ballR);
  if (land === null || t > land) return null;
  return yAt(b, t);
}

/** A ball at (fromX, fromY) that peaks at `apex` and comes down through (toX, toY). */
export function lob(fromX: number, fromY: number, toX: number, toY: number, apex: number): Ball {
  const top = Math.max(apex, fromY + 0.05, toY + 0.05);
  const vy = Math.sqrt(2 * VB.g * (top - fromY));
  const flight = vy / VB.g + Math.sqrt((2 * (top - toY)) / VB.g);
  return { x: fromX, y: fromY, vx: (toX - fromX) / flight, vy };
}

/** A ball at (fromX, fromY) that lands at toX travelling `speed` m/s horizontally. */
export function drive(fromX: number, fromY: number, toX: number, speed: number): Ball {
  const dx = toX - fromX;
  const t = Math.max(0.05, Math.abs(dx) / speed);
  return { x: fromX, y: fromY, vx: dx / t, vy: (VB.ballR - fromY + 0.5 * VB.g * t * t) / t };
}

/** Bounces the ball off the tape (treated as a point at the top of the net). */
function offTape(n: Ball): Ball {
  const dx = n.x;
  const dy = n.y - VB.netH;
  const d = Math.hypot(dx, dy) || 1e-6;
  const nx = dx / d;
  const ny = dy / d;
  const vn = n.vx * nx + n.vy * ny;
  const push = VB.ballR + VB.netW;
  const out = { x: nx * push, y: VB.netH + ny * push, vx: n.vx, vy: n.vy };
  if (vn >= 0) return out;
  return { ...out, vx: n.vx - (1 + VB.tapeBounce) * vn * nx, vy: n.vy - (1 + VB.tapeBounce) * vn * ny };
}

/** Crossed or touched the net during the step from b to n. */
function netContact(b: Ball, n: Ball, dt: number): 'side' | 'tape' | null {
  const reach = VB.ballR + VB.netW;
  const crossed = Math.sign(b.x) !== Math.sign(n.x) && b.x !== 0;
  if (crossed) {
    const t = b.vx === 0 ? 0 : Math.min(dt, Math.max(0, -b.x / b.vx));
    const y = yAt(b, t);
    if (y <= VB.netH) return 'side';
    return y < VB.netH + VB.ballR ? 'tape' : null;
  }
  if (Math.abs(n.x) >= reach || n.y >= VB.netH + reach) return null;
  if (n.y <= VB.netH) return 'side';
  return Math.hypot(n.x, n.y - VB.netH) < reach ? 'tape' : null;
}

/** One exact flight step with the net in the way. `net` reports a touch of the net. */
export function flyBall(b: Ball, dt: number): { ball: Ball; net: boolean } {
  const n = ballAt(b, dt);
  const hit = netContact(b, n, dt);
  switch (hit) {
    case null: return { ball: n, net: false };
    case 'side': {
      const side = b.x === 0 ? -Math.sign(b.vx) || -1 : Math.sign(b.x);
      return { ball: { ...n, x: side * (VB.ballR + VB.netW), vx: side * Math.abs(n.vx) * VB.netDamp }, net: true };
    }
    case 'tape': return { ball: offTape(n), net: true };
    default: throw new Error(`unhandled: ${hit satisfies never}`);
  }
}
