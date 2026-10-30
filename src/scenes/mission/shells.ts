import type { AudioEngine } from '../../core/audio';
import { HE_SHELL } from '../../data/he-gun';
import { circleHit } from '../../game/combat';
import { heGun, inBlast } from '../../game/he-gun';
import type { Player } from './player';
import { PF_W, type Enemy, type World } from './world';

// The Bofors 40 mm HE gun (doc 46): fires with the main gun at its own rate; every shell bursts on the first enemy
// or the boss it touches, or in the air at the end of its range, and hurts everything inside the blast.

type Hurt = (e: Enemy, amount: number) => void;

/** Fires the Bofors when it is fitted and loaded; called while the gun fires. */
export function fireHe(world: World, p: Player, audio: AudioEngine): void {
  const gun = heGun(p.stats.heLevel);
  if (!gun || p.heCooldown > 0) return;
  p.heCooldown = 1 / gun.shotsPerSec;
  world.shells.push({ x: p.x, y: p.y - 30, ttl: HE_SHELL.ttl, damage: gun.damage, radius: gun.radius, dead: false });
  audio.play('bofors', { volume: 0.7, pan: (p.x / PF_W) * 2 - 1 });
}

/** Moves the shells and bursts them; `hurt` damages an enemy (a kill pays as usual). */
export function updateShells(world: World, dt: number, audio: AudioEngine, hurt: Hurt): void {
  for (const s of world.shells) {
    if (s.dead) continue;
    s.y -= HE_SHELL.speed * dt;
    s.ttl -= dt;
    if (Math.random() < 0.5) world.particles.trail(s.x, s.y + 10, 'rgba(200,190,170,1)');
    const touched = world.enemies.some((e) => !e.dead && circleHit(s.x, s.y, 5, e.x, e.y, e.radius));
    const boss = world.boss;
    const bossHit = !touched && !!boss && boss.hitAt(s.x, s.y, 5, s.damage, world, audio);
    if (touched || bossHit || s.ttl <= 0 || s.y < -20) burst(world, s, !bossHit, audio, hurt);
  }
}

function burst(world: World, s: World['shells'][number], hitsBoss: boolean, audio: AudioEngine, hurt: Hurt): void {
  s.dead = true;
  for (const e of inBlast(s.x, s.y, s.radius, world.enemies)) hurt(e, s.damage);
  if (hitsBoss) world.boss?.hitAt(s.x, s.y, s.radius, s.damage, world, audio);
  world.particles.explosion(s.x, s.y, 'small');
  world.particles.add({ kind: 'ring', x: s.x, y: s.y, max: 0.22, size: s.radius * 0.3, grow: s.radius * 3.2, color: 'rgba(255,255,255,1)' });
  audio.play('explosionSmall', { volume: 0.35, pan: (s.x / PF_W) * 2 - 1 });
}
