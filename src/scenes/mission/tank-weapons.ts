import type { AudioEngine } from '../../core/audio';
import type { WeaponStats } from '../../game/arsenal';
import { setAlight } from './burn';
import type { Player } from './player';
import { damageEnemy } from './projectiles';
import { PF_H, PF_W, type Enemy, type World } from './world';

// The steppe lab's tank weapons in the mission (doc 108) that are neither missiles nor shells: the mine layer's mines
// lying on the ground until something steps near, the flamethrower's cone of fire, the tesla coil's jumping bolt.

/** A mine on the ground: it scrolls with the floor, arms after a moment and blows when a ground unit comes near. */
export interface Mine { x: number; y: number; damage: number; radius: number; armT: number; dead: boolean }

const TRIGGER = 30;
const FLAME_HALF = (25 * Math.PI) / 180;
const CHAIN_REACH = 320;
const CHAIN_JUMPS = 3;

export function layMine(world: World, p: Player, w: WeaponStats): void {
  world.mines.push({ x: p.x, y: p.y + 14, damage: w.damage, radius: w.radius, armT: 0.6, dead: false });
}

/** Everything in the cone ahead takes the hit and catches fire, ground or air; the boss where the cone reaches it. */
export function fireFlame(world: World, p: Player, w: WeaponStats, audio: AudioEngine): void {
  const len = w.radius;
  const inCone = (x: number, y: number): boolean => {
    const dx = x - p.x;
    const dy = p.y - y;
    return dy > 0 && Math.hypot(dx, dy) <= len && Math.abs(Math.atan2(dx, dy)) <= FLAME_HALF;
  };
  for (const e of world.enemies) {
    if (e.dead || !inCone(e.x, e.y)) continue;
    damageEnemy(world, e, w.damage, audio);
    setAlight(e, w.damage, 0.5, true);
  }
  const b = world.boss;
  if (b?.active) for (let k = 0.3; k <= 1; k += 0.35) b.hitAt(p.x, p.y - len * k, 20, w.damage / 3, world, audio);
  for (let i = 0; i < 18; i++) {
    const a = (Math.random() - 0.5) * FLAME_HALF * 2;
    const s = 260 + Math.random() * 180;
    world.particles.add({
      kind: 'fire', x: p.x, y: p.y - 22, vx: Math.sin(a) * s, vy: -Math.cos(a) * s, max: 0.3 + Math.random() * 0.2,
      size: 5 + Math.random() * 5, grow: 18, drag: 2.2, color: '#ff8a2a',
    });
  }
  audio.play('flare', { pitch: 0.6, volume: 0.6 });
}

/** A bolt at the nearest enemy ahead that jumps on to the nearest others within the weapon's reach. */
export function fireChain(world: World, p: Player, w: WeaponStats, audio: AudioEngine): void {
  const ahead = world.enemies.filter((e) => !e.dead && e.y < p.y && e.y > -10 && Math.hypot(e.x - p.x, e.y - p.y) <= CHAIN_REACH);
  let from = { x: p.x, y: p.y - 20 };
  let next: Enemy | undefined = ahead.sort((a, b) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y))[0];
  const hit: Enemy[] = [];
  if (!next && world.boss?.active) {
    world.boss.hitAt(world.boss.x, world.boss.y, 30, w.damage, world, audio);
    world.zaps.push({ x1: from.x, y1: from.y, x2: world.boss.x, y2: world.boss.y, t: 0, electric: true });
  }
  while (next && hit.length <= CHAIN_JUMPS) {
    hit.push(next);
    damageEnemy(world, next, w.damage, audio);
    world.zaps.push({ x1: from.x, y1: from.y, x2: next.x, y2: next.y, t: 0, electric: true });
    from = { x: next.x, y: next.y };
    const last: Enemy = next;
    next = world.enemies.find((e) => !e.dead && !hit.includes(e) && Math.hypot(e.x - last.x, e.y - last.y) <= w.radius);
  }
  audio.play('sonic', { pitch: 1.6, volume: 0.5 });
}

/** The mines scroll with the floor; an armed one blows when something on the ground comes near. */
export function tickMines(world: World, dt: number, audio: AudioEngine): void {
  for (const m of world.mines) {
    m.y += world.scrollSpeed * dt;
    m.armT -= dt;
    if (m.y > PF_H + 20) m.dead = true;
    if (m.dead || m.armT > 0) continue;
    const near = world.enemies.some((e) => !e.dead && e.layer === 'ground' && Math.hypot(e.x - m.x, e.y - m.y) <= TRIGGER + e.radius * 0.5);
    if (!near) continue;
    m.dead = true;
    for (const e of world.enemies) if (!e.dead && e.layer === 'ground' && Math.hypot(e.x - m.x, e.y - m.y) <= m.radius) damageEnemy(world, e, m.damage, audio);
    world.boss?.hitAt(m.x, m.y, m.radius, m.damage, world, audio);
    world.particles.explosion(m.x, m.y, 'large', true);
    world.addShake(3);
    audio.play('explosionLarge', { volume: 0.5, pan: (m.x / PF_W) * 2 - 1 });
  }
  world.mines = world.mines.filter((m) => !m.dead);
}
