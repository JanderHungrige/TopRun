import type { AudioEngine } from '../../core/audio';
import type { EnemyWeapon, SecondaryId } from '../../data/types';
import { jetGunDef, SECONDARIES, type WeaponRole } from '../../data/weapons';
import { slotFor } from '../../game/loadout';
import { headingTo } from '../../game/combat';
import type { WeaponStats } from '../../game/arsenal';
import type { Player } from './player';
import type { Missile, World } from './world';

export const GUN_SPEED = 900;

export function firePlayerGun(world: World, p: Player, audio: AudioEngine): void {
  fireSecondGun(world, p);
  if (p.gunCooldown > 0) return;
  const gun = p.gun;
  p.gunCooldown = 1 / gun.shotsPerSec;
  const damage = gun.damage * p.stats.gunDamageMul;
  for (const b of gun.pattern) {
    world.bullets.push({
      kind: 'gun', x: p.x + b.dx, y: p.y - 24, vx: Math.sin(b.angle) * GUN_SPEED, vy: -Math.cos(b.angle) * GUN_SPEED,
      damage, ttl: 1, dead: false, ground: p.stats.gunGround,
    });
  }
  if (world.targetsInView()) world.perf.shots += gun.pattern.length;
  audio.play('gun', { volume: 0.5, pan: (p.x / 320 - 1) * 0.5 });
}

/** Second gun of the new jets (doc 37): its own level, from the wing roots, alternating left and right. */
function fireSecondGun(world: World, p: Player): void {
  const level = p.gun2Level;
  if (level <= 0 || p.gun2Cooldown > 0) return;
  const gun = jetGunDef(level, true);
  p.gun2Cooldown = 1 / gun.shotsPerSec;
  p.gun2Side *= -1;
  const damage = gun.damage * p.stats.gunDamageMul;
  for (const b of gun.pattern) {
    world.bullets.push({
      kind: 'gun', x: p.x + p.gun2Side * 13 + b.dx * 0.6, y: p.y - 12, vx: Math.sin(b.angle) * GUN_SPEED,
      vy: -Math.cos(b.angle) * GUN_SPEED, damage, ttl: 1, dead: false, ground: p.stats.gunGround,
    });
  }
  if (world.targetsInView()) world.perf.shots += gun.pattern.length;
}

export function fireWingman(world: World, p: Player, dt: number): void {
  const w = p.wingman;
  if (!w) return;
  w.x += (p.x + 70 - w.x) * Math.min(1, dt * 4);
  w.y += (p.y + 30 - w.y) * Math.min(1, dt * 4);
  w.fireT -= dt;
  if (w.fireT > 0) return;
  w.fireT = 0.11;
  for (const dx of [-6, 6]) {
    world.bullets.push({ kind: 'wingman', x: w.x + dx, y: w.y - 22, vx: 0, vy: -GUN_SPEED, damage: 10, ttl: 1, dead: false });
  }
}

/** A player missile or rocket with the numbers of its weapon's mark (doc 43). */
function playerMissile(p: Player, kind: Missile['kind'], w: WeaponStats, dx: number, heading: number): Missile {
  if (kind === 'enemy') throw new Error('not a player missile');
  const hits = SECONDARIES[kind === 'rocket' ? 'rockets' : kind].hits;
  return {
    kind, x: p.x + dx, y: p.y - 6, heading, speed: kind === 'rocket' ? w.speed : 180, maxSpeed: w.speed,
    turnRate: w.turnRate, damage: w.damage, hits, target: null, decoy: null, ttl: 3.2, dead: false,
  };
}

const homingKind = (id: SecondaryId): Missile['kind'] | null =>
  (id === 'aim9' || id === 'aim54' || id === 'aim120' || id === 'agm65' ? id : null);

/**
 * AIR or GROUND key: fires the picked ground weapon, else the first of that role with ammo (doc 05). Twin pods
 * (doc 37) launch both at once. False when nothing fired.
 */
export function fireSecondary(world: World, p: Player, audio: AudioEngine, role: WeaponRole): boolean {
  const slot = p.secondaries[slotFor(p.secondaries, role, role === 'ground' ? p.groundPick : -1)];
  if (!slot || slot.ammo <= 0 || p.secCooldown > 0) return false;
  const def = SECONDARIES[slot.id];
  const pods = slot.twin && slot.ammo >= 2 ? [-1, 1] : [0];
  slot.ammo -= pods.length;
  p.firedSecondary = true;
  p.secCooldown = def.cooldown;
  p.sideToggle *= -1;
  switch (def.behavior) {
    case 'homing': {
      const kind = homingKind(slot.id);
      for (const s of pods) if (kind) world.missiles.push(playerMissile(p, kind, slot.weapon, s === 0 ? 12 * p.sideToggle : 12 * s, 0));
      audio.play('missile');
      break;
    }
    case 'fan':
      for (const s of pods) for (let i = -2; i <= 2; i++) world.missiles.push(playerMissile(p, 'rocket', slot.weapon, s * 10 + i * 4, i * 0.09));
      audio.play('rocket');
      break;
    case 'bomb':
      for (const s of pods) world.bombs.push({ x: p.x + s * 16, y: p.y, t: 0, damage: slot.weapon.damage, radius: slot.weapon.radius, dead: false });
      audio.play('bombDrop');
      break;
    default:
      throw new Error(`unhandled: ${def.behavior satisfies never}`);
  }
  return true;
}

export function dropFlare(world: World, p: Player, audio: AudioEngine): void {
  if (p.flares <= 0) return;
  p.flares -= 1;
  for (const side of [-1, 1]) world.flares.push({ x: p.x, y: p.y + 10, vx: side * 90, vy: 40, ttl: 2.5 });
  for (const m of world.missiles) {
    if (m.kind === 'enemy' && Math.hypot(m.x - p.x, m.y - p.y) < 260) m.decoy = world.flares[world.flares.length - 1] ?? null;
  }
  audio.play('flare');
}

export interface FireSource {
  x: number;
  y: number;
  bulletSpeedMul: number;
}

function enemyBullet(world: World, s: FireSource, heading: number, speed: number, damage: number): void {
  world.bullets.push({
    kind: 'enemy', x: s.x, y: s.y, vx: Math.sin(heading) * speed * s.bulletSpeedMul, vy: -Math.cos(heading) * speed * s.bulletSpeedMul,
    damage, ttl: 5, dead: false,
  });
}

/** Fires an enemy weapon from a source at the player. */
export function fireEnemyWeapon(world: World, s: FireSource, weapon: EnemyWeapon, p: Player, audio: AudioEngine): void {
  const aim = headingTo(s.x, s.y, p.x, p.y);
  switch (weapon) {
    case 'none': return;
    case 'single': enemyBullet(world, s, Math.PI, 230, 8); break;
    case 'aimed': enemyBullet(world, s, aim, 250, 8); break;
    case 'spread3':
      for (const d of [-0.26, 0, 0.26]) enemyBullet(world, s, aim + d, 215, 8);
      break;
    case 'missile':
      world.missiles.push({
        kind: 'enemy', x: s.x, y: s.y, heading: aim, speed: 150, maxSpeed: 250 * s.bulletSpeedMul,
        turnRate: 1.7 * p.stats.ecmTurn, damage: 22, hits: 'air', target: 'player', decoy: null, ttl: 5, dead: false,
      });
      audio.play('enemyMissile', { volume: 0.6 });
      return;
    case 'flak': {
      const dist = Math.hypot(p.x - s.x, p.y - s.y);
      const speed = 300 * s.bulletSpeedMul;
      world.bullets.push({ kind: 'flak', x: s.x, y: s.y, vx: Math.sin(aim) * speed, vy: -Math.cos(aim) * speed, damage: 12, ttl: dist / speed, dead: false });
      break;
    }
    default:
      throw new Error(`unhandled: ${weapon satisfies never}`);
  }
  audio.play('enemyShot', { volume: 0.35 });
}
