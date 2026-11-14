import type { AudioEngine } from '../../core/audio';
import { DOOR_GUN, PULSE, SWARM, TRACER } from '../../data/heli-arms';
import { CAVITATION, TORP_SWARM } from '../../data/sub-arms';
import type { WeaponStats } from '../../game/arsenal';
import { doorTarget, laserTarget, splashTargets, turretAim } from '../../game/heli-combat';
import type { Player } from './player';
import { damageEnemy, hidden } from './projectiles';
import { updateWaves } from './heli-waves';
import { tickSubArms } from './sub-arms';
import { PF_H, PF_W, type Bullet, type Enemy, type Missile, type World } from './world';

// The helicopters' arsenal in the mission (doc 99): the rounds every gun fires (tracer paint, HEDP burst, incendiary on
// the ground too), the turret's swivel, the door guns, the pulse laser's bursts and the drone swarm. The sonic wave runs
// in heli-waves.ts.

/** A laser burst still firing: pulses left, seconds to the next, damage per pulse, the station's offset. */
export interface Pulse { left: number; t: number; damage: number; dx: number }
/** A laser pulse's glow from the nose to where it struck, or an electric bolt's arc (doc 101, `electric`); `t` counts up. */
export interface Zap { x1: number; y1: number; x2: number; y2: number; t: number; electric?: boolean }
/** A sonic wave running out from where it was fired; `hit` holds the enemies it already struck. */
export interface SonicWave { x: number; y: number; t: number; damage: number; reach: number; hit: number[]; boss: boolean; cone: number }

/** Something the turret, the door guns or the laser can aim at: an enemy, or the boss's aim point (`e` null). */
interface Aim { x: number; y: number; e: Enemy | null }

function aims(world: World, p: Player, boss: boolean): Aim[] {
  const out: Aim[] = world.enemies.filter((e) => !e.dead && e.y > -10 && e.y < PF_H && !hidden(e, p)).map((e) => ({ x: e.x, y: e.y, e }));
  if (boss && world.boss?.active) out.push({ ...world.boss.aimPoint(), e: null });
  return out;
}

type Rounds = Pick<Bullet, 'ground' | 'burn' | 'rounds' | 'burnGround' | 'paint' | 'splash' | 'chain' | 'pierce' | 'harpoon'>;

/** What every round of the guns carries: the jets' ammo, or a fleet's rounds and their effects (docs 99, 101). */
export function gunRounds(p: Player): Rounds {
  const a = p.stats.arms;
  return {
    ground: p.stats.gunGround, burn: p.stats.gunBurn, rounds: p.stats.rounds ?? undefined, burnGround: p.stats.burnGround,
    paint: !!a && a.paint > 0, splash: a?.splash ?? null, chain: a?.chain ?? null, pierce: a?.pierce?.count ?? 0,
    harpoon: p.stats.plane.kind === 'sub',
  };
}

/** Cavitation tips make the bolts fly faster (doc 101). */
export const roundSpeed = (p: Player): number => p.stats.arms?.pierce?.speed ?? 1;

/** A cavitation bolt that struck `e` flies on while it has pierce left, with half its hit (doc 101). */
export function passesThrough(b: Bullet, e: Enemy): boolean {
  if (!b.pierce || b.pierce <= 0) return false;
  b.pierce -= 1;
  b.damage *= CAVITATION.keep;
  (b.hit ??= []).push(e.id);
  return true;
}

/** The turret link's swivel for the next burst (0 without one). */
export const gunSwivel = (world: World, p: Player): number =>
  (p.stats.arms?.swivel ? turretAim(p, aims(world, p, true), p.stats.arms.swivel) : 0);

/** A helicopter round struck `e` for `dealt`: tracer paints it, HEDP bursts onto the enemies around it. */
export function roundEffects(world: World, b: Bullet, e: Enemy, dealt: number, audio: AudioEngine): void {
  if (b.paint) {
    e.paintT = TRACER.seconds;
    e.revealT = Math.max(e.revealT, 0.1);
  }
  if (b.chain) arcOn(world, b.chain, e, dealt, audio);
  if (!b.splash) return;
  for (const o of splashTargets(e, world.enemies.filter((x) => !x.dead), b.splash.radius)) damageEnemy(world, o, dealt * b.splash.share, audio);
  world.particles.add({ kind: 'ring', x: b.x, y: b.y, max: 0.16, size: 3, grow: b.splash.radius * 4, color: 'rgba(255,170,70,1)' });
}

/** An electric bolt's hit arcs to the nearest enemies around `e`, hurting and stunning them (doc 101). */
function arcOn(world: World, c: NonNullable<Bullet['chain']>, e: Enemy, dealt: number, audio: AudioEngine): void {
  const near = world.enemies
    .filter((o) => o !== e && !o.dead && Math.hypot(o.x - e.x, o.y - e.y) <= c.reach)
    .sort((a, b) => Math.hypot(a.x - e.x, a.y - e.y) - Math.hypot(b.x - e.x, b.y - e.y))
    .slice(0, c.targets);
  for (const o of near) {
    o.stun = Math.max(o.stun, c.stun);
    damageEnemy(world, o, dealt * c.share, audio);
    world.zaps.push({ x1: e.x, y1: e.y, x2: o.x, y2: o.y, t: 0, electric: true });
  }
}

/** The door guns: each fires at the nearest enemy in its arc, on its own. */
function fireDoorGuns(world: World, p: Player, dt: number, audio: AudioEngine): void {
  const guns = p.stats.arms?.doorGuns;
  if (!guns || !p.alive) return;
  const targets = aims(world, p, false);
  ([-1, 1] as const).forEach((side, i) => {
    p.doorCooldown[i] = Math.max(0, (p.doorCooldown[i] ?? 0) - dt);
    const t = doorTarget(p, targets, side, guns.range);
    if (!t || (p.doorCooldown[i] ?? 0) > 0) return;
    p.doorCooldown[i] = 1 / DOOR_GUN.rate;
    const x = p.x + side * 11;
    const a = Math.atan2(t.x - x, -(t.y - p.y));
    const v = DOOR_GUN.speed * roundSpeed(p);
    world.bullets.push({
      kind: 'door', x, y: p.y, vx: Math.sin(a) * v, vy: -Math.cos(a) * v, damage: guns.damage, ttl: 0.6, dead: false, ...gunRounds(p),
    });
    if (Math.random() < 0.4) world.particles.sparks(x + Math.sin(a) * 6, p.y - Math.cos(a) * 6, 1, '#ffe08a', 60);
    if (Math.random() < 0.3) audio.play('gun', { volume: 0.18, pan: (x / PF_W) * 2 - 1, pitch: 1.3 });
  });
}

/** The pulse laser: queues a burst of pulses from the station's side of the nose. */
export function firePulse(world: World, w: WeaponStats, dx: number): void {
  world.pulses.push({ left: PULSE.pulses, t: 0, damage: w.damage, dx });
}

function runPulses(world: World, p: Player, dt: number, audio: AudioEngine): void {
  for (const q of world.pulses) {
    q.t -= dt;
    if (q.t > 0 || q.left <= 0 || !p.alive) continue;
    q.t = PULSE.gap;
    q.left -= 1;
    const from = { x: p.x + q.dx * 0.5, y: p.y - 22 };
    const t = laserTarget(from, aims(world, p, true), PULSE.cone, PULSE.range);
    const to = t ?? { x: from.x, y: from.y - PULSE.range };
    if (t?.e) damageEnemy(world, t.e, q.damage, audio);
    else if (t) world.boss?.hitAt(t.x, t.y, 10, q.damage, world, audio);
    world.zaps.push({ x1: from.x, y1: from.y, x2: to.x, y2: to.y, t: 0 });
    if (t) world.particles.sparks(to.x, to.y, 3, '#ffd0f0', 140);
    audio.play('zap', { volume: 0.35, pan: (from.x / PF_W) * 2 - 1 });
  }
  world.pulses = world.pulses.filter((q) => q.left > 0);
  for (const z of world.zaps) z.t += dt;
  world.zaps = world.zaps.filter((z) => z.t < 0.07);
}

/** The drone swarm: three drones out to the sides and ahead that hunt like missiles. */
export function launchSwarm(world: World, p: Player, w: WeaponStats, dx: number, torpedoes = false): void {
  const s = torpedoes ? TORP_SWARM : SWARM; // the subs' torpedo swarm (doc 101)
  for (const heading of s.headings) {
    const m: Missile = {
      kind: torpedoes ? 'minitorp' : 'drone', x: p.x + dx, y: p.y, heading, speed: 140, maxSpeed: w.speed, turnRate: w.turnRate,
      damage: w.damage, hits: 'any', target: null, decoy: null, ttl: s.ttl, dead: false,
    };
    world.missiles.push(m);
  }
}

/** One tick of the helicopters' arsenal. */
export function tickHeliArms(world: World, p: Player, dt: number, audio: AudioEngine): void {
  world.paintBonus = p.stats.arms?.paint ?? 0;
  world.bossPaintT = Math.max(0, world.bossPaintT - dt);
  fireDoorGuns(world, p, dt, audio);
  runPulses(world, p, dt, audio);
  updateWaves(world, dt, audio);
  tickSubArms(world, dt);
}
