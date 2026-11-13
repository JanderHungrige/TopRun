import type { AudioEngine } from '../../core/audio';
import { SONIC } from '../../data/heli-arms';
import type { WeaponStats } from '../../game/arsenal';
import { inWave } from '../../game/heli-combat';
import type { Player } from './player';
import { damageEnemy } from './projectiles';
import type { World } from './world';

// The sonic cannon (doc 99): an ultrasonic wave that runs out ahead in an arc; everything its front passes takes the hit
// and is stunned (bosses only take the hit), and the enemy rounds, flak and missiles it passes are wiped out.

/** Fires a wave from the helicopter's nose. */
export function fireWave(world: World, p: Player, w: WeaponStats): void {
  world.waves.push({ x: p.x, y: p.y - 18, t: 0, damage: w.damage, reach: w.radius, hit: [], boss: false });
  world.addShake(1.5);
}

/** The wave's radius `t` s after it was fired. */
export const waveRadius = (reach: number, t: number): number => reach * Math.min(1, t / SONIC.time);

/** Runs every wave's front one step out. */
export function updateWaves(world: World, dt: number, audio: AudioEngine): void {
  for (const w of world.waves) {
    const r0 = waveRadius(w.reach, w.t);
    w.t += dt;
    const r1 = waveRadius(w.reach, w.t);
    for (const e of world.enemies) {
      if (e.dead || w.hit.includes(e.id) || !inWave(w, SONIC.cone, r0, r1, e, e.radius)) continue;
      w.hit.push(e.id);
      e.stun = SONIC.stun;
      damageEnemy(world, e, w.damage, audio);
    }
    for (const b of world.bullets) {
      if ((b.kind === 'enemy' || b.kind === 'flak') && inWave(w, SONIC.cone, r0, r1, b, 6)) b.dead = true;
    }
    for (const m of world.missiles) {
      if (m.kind !== 'enemy' || m.dead || !inWave(w, SONIC.cone, r0, r1, m, 6)) continue;
      m.dead = true;
      world.particles.explosion(m.x, m.y, 'small');
    }
    const boss = world.boss;
    if (!w.boss && boss?.active && inWave(w, SONIC.cone, r0, r1, boss.aimPoint(), 30)) {
      const a = boss.aimPoint();
      w.boss = boss.hitAt(a.x, a.y, 30, w.damage, world, audio);
    }
  }
  world.waves = world.waves.filter((w) => w.t < SONIC.time);
}
