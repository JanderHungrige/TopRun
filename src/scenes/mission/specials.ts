import type { AudioEngine } from '../../core/audio';
import { ageDrain, agingJet, CANNON, cannonDamage, NUKE } from '../../game/jets';
import type { Player } from './player';
import { killEnemy } from './projectiles';
import type { WingmanRadio } from './radio';
import { GUN_SPEED } from './weapons-fire';
import { PF_H, type World } from './world';

// Every jet's E ability (docs 05, 36) — activation and what it does each tick — and the Tornado's age drain.

/** E pressed: starts the jet's special if it is charged. */
export function activateSpecial(world: World, p: Player, audio: AudioEngine, radio: WingmanRadio): void {
  const plane = p.stats.plane;
  if (!p.alive || p.specialCooldown > 0 || p.specialActive > 0) return;
  p.specialCooldown = plane.specialCooldown;
  p.specialActive = plane.specialDuration;
  switch (plane.special) {
    case 'roll':
      p.dashVX = (p.bank >= 0 ? 1 : -1) * 620;
      audio.play('special');
      break;
    case 'wingman':
      p.wingman = { x: p.x + 90, y: PF_H + 40, fireT: 0.5 };
      radio.special();
      audio.play('special');
      break;
    case 'dash':
      world.addShake(6);
      audio.play('special');
      break;
    case 'cannon':
      p.cannonT = 0;
      audio.play('cannon');
      break;
    case 'stealth':
      audio.play('stealth');
      break;
    case 'nuke':
      world.nuke = { x: p.x, y: p.y - 30, t: 0 };
      audio.play('nukeLaunch');
      break;
    default:
      throw new Error(`unhandled: ${plane.special satisfies never}`);
  }
}

/** One tick of the running specials, the nuke in flight and the Tornado's age. */
export function tickSpecials(world: World, p: Player, dt: number, audio: AudioEngine): void {
  if (p.wingman && p.specialActive <= 0) p.wingman = null;
  if (p.alive && p.specialActive > 0 && p.stats.plane.special === 'cannon') fireCannon(world, p, dt);
  flyNuke(world, dt, audio);
  if (world.blast) {
    world.blast.t += dt;
    if (world.blast.t >= NUKE.burstSec) world.blast = null;
  }
  if (p.alive && agingJet(p.stats.plane.id)) p.hull = ageDrain(p.hull, p.maxHull, dt);
}

/** A-10 GAU-8: rounds straight ahead at its own rate, gun key or not, with a little recoil shake. */
function fireCannon(world: World, p: Player, dt: number): void {
  const damage = cannonDamage(p.stats.gunDamageMul);
  p.cannonT -= dt;
  while (p.cannonT <= 0) {
    p.cannonT += 1 / CANNON.roundsPerSec;
    const a = (Math.random() * 2 - 1) * CANNON.jitter;
    const v = GUN_SPEED * 1.15;
    world.bullets.push({ kind: 'cannon', x: p.x - 1, y: p.y - 34, vx: Math.sin(a) * v, vy: -Math.cos(a) * v, damage, ttl: 1, dead: false });
    if (world.targetsInView()) world.perf.shots += 1;
  }
  world.shake = Math.max(world.shake, 1.8);
}

function flyNuke(world: World, dt: number, audio: AudioEngine): void {
  const n = world.nuke;
  if (!n) return;
  n.t += dt;
  n.y -= NUKE.climb * dt;
  world.particles.sparks(n.x, n.y + 12, 1, '#ffd38a', 60);
  if (n.t < NUKE.flightSec) return;
  world.nuke = null;
  detonate(world, n.x, n.y, audio);
}

/** The burst: every enemy on screen goes, every enemy shot with it; the boss loses a fifth (doc 36). */
function detonate(world: World, x: number, y: number, audio: AudioEngine): void {
  world.blast = { x, y, t: 0 };
  world.addShake(14);
  audio.play('nuke');
  world.particles.explosion(x, y, 'huge');
  for (const e of world.enemies) if (!e.dead && e.y > -40 && e.y < PF_H + 20) killEnemy(world, e, audio, true);
  for (const b of world.bullets) if (b.kind === 'enemy' || b.kind === 'flak') b.dead = true;
  for (const m of world.missiles) if (m.kind === 'enemy') m.dead = true;
  world.boss?.blast(world, audio);
}
