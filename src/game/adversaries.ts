import type { EnemyKind } from '../data/types';

// New adversaries (doc 44): the rules of stealth, jamming, the Backfire's loiter and the mini-bosses' slow pass. Pure.

export const STEALTH = Object.freeze({
  /** Seconds a stealth fighter stays visible after it fires. */
  reveal: 1.5,
  /** Closer than this it can be seen anyway (px). */
  near: 150,
});

/** While a jammer is on screen: player homing missiles turn this much slower, and the radar shows static. */
export const JAM = Object.freeze({ missileTurn: 0.5 });

export const LOITER = Object.freeze({
  /** Seconds the Backfire holds the top of the screen before it leaves. */
  hold: 20,
  /** Seconds between its drone launches. */
  escortEvery: 6,
});

/** Scroll speed while a ground mini-boss is in the upper part of the screen (it passes at a fifth of the speed). */
export const MINI_HOLD_SCROLL = 0.2;

/** A stealth fighter is hidden unless it fired in the last 1.5 s or is within 150 px of the player. */
export const cloaked = (stealth: boolean, revealT: number, distance: number): boolean =>
  stealth && revealT <= 0 && distance > STEALTH.near;

interface Unit { kind: EnemyKind; y: number; dead: boolean }

/** Any live jammer on the screen jams (`height` = playfield height). */
export const jamming = (enemies: readonly Unit[], height: number): boolean =>
  enemies.some((e) => !e.dead && e.kind === 'jammer' && e.y > -30 && e.y < height);

/** A ground mini-boss in the upper 60 % of the screen slows the scroll so the fight lasts. */
export const holdsScroll = (enemies: readonly Unit[], height: number, isMini: (k: EnemyKind) => boolean): boolean =>
  enemies.some((e) => !e.dead && isMini(e.kind) && e.kind !== 'backfire' && e.y > 30 && e.y < height * 0.6);

/** Loiter (Backfire): ease down to `targetY`, drift across the top, leave after LOITER.hold. Returns the velocity. */
export function loiter(t: number, x: number, y: number, targetY: number, width: number, speed: number, phase: number): { vx: number; vy: number } {
  if (t > LOITER.hold) return { vx: 0, vy: speed * 1.2 };
  return { vx: Math.sin(t * 0.5 + phase) * 50 - (x - width / 2) * 0.25, vy: (targetY - y) * 0.8 };
}
