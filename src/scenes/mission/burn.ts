import { burnStep, ignite } from '../../game/ammo';
import type { Enemy, World } from './world';

// Incendiary ammo (doc 45): a gun hit on a plane adds to its burn, which deals its damage over 1.5 s. Burning planes
// trail fire and smoke, and a burning stealth fighter can be seen.

/** A gun round with a burn share hit `e` for `dealt`: planes catch fire, ground targets and bosses don't. */
export function setAlight(e: Enemy, dealt: number, share: number): void {
  if (share <= 0 || e.dead || e.layer !== 'air' || dealt <= 0) return;
  e.burn = ignite(e.burn, dealt * share);
}

/** Ticks every burn: damage without a hit sound (`kill` still explodes and pays), flames and smoke. */
export function updateBurns(world: World, dt: number, kill: (e: Enemy) => void): void {
  for (const e of world.enemies) {
    if (e.dead || e.burn.t <= 0) continue;
    const step = burnStep(e.burn, dt);
    e.burn = step.burn;
    e.revealT = Math.max(e.revealT, 0.1);
    if (Math.random() < dt * 30) {
      const dx = (Math.random() - 0.5) * e.radius;
      world.particles.add({
        kind: 'fire', x: e.x + dx, y: e.y + e.radius * 0.3, vy: 60, max: 0.3, size: 5 + Math.random() * 4, grow: 6, drag: 1,
        color: Math.random() < 0.5 ? '#ffb43a' : '#ff6a1f',
      });
      if (Math.random() < 0.4) world.particles.trail(e.x + dx, e.y + e.radius * 0.6, 'rgba(70,70,70,1)');
    }
    e.hp -= step.damage;
    if (e.hp <= 0) kill(e);
  }
}
