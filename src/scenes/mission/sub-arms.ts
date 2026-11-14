import { DECOY, NET } from '../../data/sub-arms';
import type { WeaponStats } from '../../game/arsenal';
import { circleHit } from '../../game/combat';
import type { Player } from './player';
import { PF_W, type World } from './world';

// The subs' decoy drone and drift nets in the mission (doc 101). The decoy swims ahead and sounds like a sub: enemy
// guns aim at it and enemy torpedoes in the water turn to it (it is shaped like a flare, so a torpedo's decoy can be it).
// A net drifts down where it was thrown; anything swimming in it is slowed. The torpedo swarm flies as missiles
// (heli-arms.ts) and the sonar pulse as a wave (heli-waves.ts).

export interface Decoy { x: number; y: number; vx: number; vy: number; ttl: number }
export interface Net { x: number; y: number; r: number; t: number }

/** The decoy swims ahead and off toward the open water, so what is aimed at it misses the sub. */
export function launchDecoy(world: World, p: Player): void {
  const side = p.x < PF_W / 2 ? 1 : -1;
  world.decoy = { x: p.x + side * 20, y: p.y - 24, vx: side * DECOY.drift, vy: -DECOY.speed, ttl: DECOY.seconds };
}

export function throwNet(world: World, p: Player, w: WeaponStats): void {
  world.nets.push({ x: p.x, y: p.y - NET.throw, r: w.radius, t: NET.seconds });
}

/** What an enemy at `from` aims at: the decoy while it swims within reach, else the player. */
export function aimTarget(world: World, from: { x: number; y: number }, p: Player): { x: number; y: number } {
  const d = world.decoy;
  return d && Math.hypot(d.x - from.x, d.y - from.y) <= DECOY.reach ? d : p;
}

/** One tick: the decoy swims and pulls the enemy torpedoes, the nets drift down and catch what swims in them. */
export function tickSubArms(world: World, dt: number): void {
  const d = world.decoy;
  if (d) {
    d.x += d.vx * dt;
    d.y += d.vy * dt;
    d.ttl -= dt;
    for (const m of world.missiles) if (m.kind === 'enemy' && !m.dead) m.decoy = d;
    if (d.ttl <= 0 || d.y < -30 || d.x < -30 || d.x > PF_W + 30) {
      world.decoy = null;
      for (const m of world.missiles) if (m.decoy === d) m.decoy = null;
    }
  }
  for (const n of world.nets) {
    n.t -= dt;
    n.y += world.scrollSpeed * 0.6 * dt;
    for (const e of world.enemies) if (!e.dead && circleHit(n.x, n.y, n.r, e.x, e.y, e.radius * 0.5)) e.netT = 0.15;
  }
  world.nets = world.nets.filter((n) => n.t > 0);
}
