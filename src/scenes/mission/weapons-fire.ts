import type { AudioEngine } from '../../core/audio';
import type { EnemyWeapon } from '../../data/types';
import { SECONDARIES } from '../../data/weapons';
import { ECM_TURN_FACTOR, headingTo } from '../../game/combat';
import type { Player } from './player';
import type { Missile, World } from './world';

const GUN_SPEED = 900;

export function firePlayerGun(world: World, p: Player, audio: AudioEngine): void {
  if (p.gunCooldown > 0) return;
  const gun = p.gun;
  p.gunCooldown = 1 / gun.shotsPerSec;
  const damage = gun.damage * p.stats.gunDamageMul;
  for (const b of gun.pattern) {
    world.bullets.push({
      kind: 'gun', x: p.x + b.dx, y: p.y - 24, vx: Math.sin(b.angle) * GUN_SPEED, vy: -Math.cos(b.angle) * GUN_SPEED,
      damage, ttl: 1, dead: false,
    });
  }
  audio.play('gun', { volume: 0.5, pan: (p.x / 320 - 1) * 0.5 });
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

function playerMissile(p: Player, kind: Missile['kind'], dx: number, heading: number): Missile {
  if (kind === 'enemy') throw new Error('not a player missile');
  const def = kind === 'rocket' ? SECONDARIES.rockets : SECONDARIES[kind];
  return {
    kind, x: p.x + dx, y: p.y - 6, heading, speed: kind === 'rocket' ? def.speed : 180, maxSpeed: def.speed,
    turnRate: def.turnRate, damage: def.damage, hits: def.hits, target: null, decoy: null, ttl: 3.2, dead: false,
  };
}

/** Fires the selected secondary weapon. Returns false when nothing could be fired. */
export function fireSecondary(world: World, p: Player, audio: AudioEngine): boolean {
  const slot = p.currentSecondary;
  if (!slot || slot.ammo <= 0 || p.secCooldown > 0) return false;
  const def = SECONDARIES[slot.id];
  slot.ammo -= 1;
  p.secCooldown = def.cooldown;
  p.sideToggle *= -1;
  switch (def.behavior) {
    case 'homing':
      if (slot.id === 'aim9' || slot.id === 'aim54' || slot.id === 'agm65') world.missiles.push(playerMissile(p, slot.id, 12 * p.sideToggle, 0));
      audio.play('missile');
      break;
    case 'fan':
      for (let i = -2; i <= 2; i++) world.missiles.push(playerMissile(p, 'rocket', i * 4, i * 0.09));
      audio.play('rocket');
      break;
    case 'bomb':
      world.bombs.push({ x: p.x, y: p.y, t: 0, damage: def.damage, radius: def.radius, dead: false });
      audio.play('bombDrop');
      break;
    default:
      throw new Error(`unhandled: ${def.behavior satisfies never}`);
  }
  if (slot.ammo <= 0) p.switchSecondary();
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
        turnRate: 1.7 * (p.stats.ecm ? ECM_TURN_FACTOR : 1), damage: 22, hits: 'air', target: 'player', decoy: null, ttl: 5, dead: false,
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
