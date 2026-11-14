import type { AudioEngine } from '../../core/audio';
import { approach } from '../../core/math';
import { circleHit, headingTo } from '../../game/combat';
import { bounce, hullYaw, MAIN_GUN, markDue, markOffsets, NITRO, SENTRY, vehicleOf } from '../../game/tank-drive';
import type { Player } from './player';
import { damageEnemy } from './projectiles';
import { GUN_SPEED } from './weapons-fire';
import { tickMines } from './tank-weapons';
import { gunSwivel } from './heli-arms';
import { PF_H, PF_W, type World } from './world';

// The tanks and buggies in the mission (docs 103, 104): the hull leaning into its course, tracks and tyre marks in the
// grass, dust behind; the Jackal's nitro ramming what it touches, the Lynx's sentry drop, the Bison's main gun.

/** The Lynx's sentry: sits on the ground (scrolls with it) and fires at the nearest enemy in reach. */
export interface Sentry { x: number; y: number; t: number; fireT: number; aim: number }

/** One tick of a vehicle and of what its specials left behind. */
export function tickTank(world: World, p: Player, dt: number, audio: AudioEngine): void {
  runSentry(world, dt);
  tickMines(world, dt, audio);
  if (!p.alive || p.stats.plane.kind !== 'tank') return;
  const kind = vehicleOf(p.stats.plane.id);
  const speed = Math.hypot(p.drift.x, p.drift.y);
  p.yaw = approach(p.yaw, hullYaw(p.drift.x, p.drift.y), dt * (kind === 'buggy' ? 7 : 4));
  p.turret = approach(p.turret, gunSwivel(world, p), dt * 5);
  const before = p.driven;
  p.driven += (world.scrollSpeed + speed) * dt;
  p.bob = bounce(kind, p.driven, speed + world.scrollSpeed);
  if (markDue(before, p.driven)) {
    for (const dx of markOffsets(kind)) {
      const x = p.x + Math.cos(p.yaw) * dx - Math.sin(p.yaw) * 14;
      const y = p.y + Math.sin(p.yaw) * dx + Math.cos(p.yaw) * 14;
      world.terrain.marks.add(x, y, p.yaw, kind === 'tank' ? 6 : 3);
    }
  }
  if (Math.random() < dt * (6 + speed * 0.06)) {
    world.particles.add({
      kind: 'smoke', x: p.x + (Math.random() - 0.5) * 18, y: p.y + 16, vx: (Math.random() - 0.5) * 20, vy: 20,
      max: 0.9, size: 4, grow: 10 + speed * 0.04, drag: 1.5, color: 'rgba(196,170,120,1)', ground: true,
    });
  }
  if (p.specialActive > 0 && p.stats.plane.special === 'nitro') ram(world, p, audio);
}

/** Nitro: every ground enemy the vehicle touches takes the ram once per burst. */
function ram(world: World, p: Player, audio: AudioEngine): void {
  for (const e of world.enemies) {
    if (e.dead || e.layer !== 'ground' || p.rammed.includes(e.id) || !circleHit(p.x, p.y, 18, e.x, e.y, e.radius)) continue;
    p.rammed.push(e.id);
    damageEnemy(world, e, NITRO.ram, audio);
    world.particles.sparks(e.x, e.y, 10, '#9ad8ff', 220, true);
    world.addShake(3);
  }
  world.particles.trail(p.x + (Math.random() - 0.5) * 8, p.y + 20, 'rgba(120,190,255,1)');
}

export function dropSentry(world: World, p: Player): void {
  world.sentry = { x: p.x, y: p.y + 26, t: SENTRY.life, fireT: 0.3, aim: 0 };
}

/** The Bison's main gun: one heavy shell up the screen, a hard hit on the first thing it meets and a burst round it. */
export function fireMainGun(world: World, p: Player, audio: AudioEngine): void {
  world.shells.push({
    x: p.x, y: p.y - 34, ttl: PF_H / MAIN_GUN.speed, damage: MAIN_GUN.splash, radius: MAIN_GUN.radius, dead: false,
    speed: MAIN_GUN.speed, direct: MAIN_GUN.damage,
  });
  world.particles.add({ kind: 'flash', x: p.x, y: p.y - 34, max: 0.12, size: 26, color: '#fff2c0' });
  world.addShake(6);
  p.y = Math.min(PF_H - 40, p.y + 10);
  audio.play('cannon', { volume: 0.8, pan: (p.x / PF_W) * 2 - 1 });
}

function runSentry(world: World, dt: number): void {
  const s = world.sentry;
  if (!s) return;
  s.y += world.scrollSpeed * dt;
  s.t -= dt;
  s.fireT -= dt;
  if (s.t <= 0 || s.y > PF_H + 30) {
    world.sentry = null;
    return;
  }
  const target = nearest(world, s);
  if (!target) return;
  s.aim = headingTo(s.x, s.y, target.x, target.y);
  if (s.fireT > 0) return;
  s.fireT = 1 / SENTRY.rate;
  world.bullets.push({
    kind: 'wingman', x: s.x + Math.sin(s.aim) * 12, y: s.y - Math.cos(s.aim) * 12,
    vx: Math.sin(s.aim) * GUN_SPEED, vy: -Math.cos(s.aim) * GUN_SPEED, damage: SENTRY.damage, ttl: 0.6, dead: false,
  });
}

function nearest(world: World, s: Sentry): { x: number; y: number } | null {
  let best: { x: number; y: number } | null = null;
  let bestD: number = SENTRY.reach;
  for (const e of world.enemies) {
    if (e.dead || e.y < 0) continue;
    const d = Math.hypot(e.x - s.x, e.y - s.y);
    if (d < bestD) [best, bestD] = [e, d];
  }
  const b = world.boss;
  if (b?.active && Math.hypot(b.x - s.x, b.y - s.y) < bestD + 60) best = b;
  return best;
}
